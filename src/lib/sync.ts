import { SupabaseClient } from "@supabase/supabase-js";
import { encryptRecord, decryptRecord } from "./account";
import { VaultData } from "./vault";
import { DaySlots, SchedulePayload, LunchConfigByWeekday } from "./schedule";
import { Patient } from "./patients";
import { EvolutionEntry } from "./evolution";

/**
 * Moves records between the device and Supabase, encrypting on the way out
 * and decrypting on the way in. The master key never leaves the browser, so
 * everything crossing the network is opaque to the server.
 *
 * A row that fails to decrypt is skipped rather than throwing: one damaged
 * record should not make the whole account unopenable.
 */

export type PullResult = {
  data: VaultData;
  skipped: number;
};

export async function pullAll(
  supabase: SupabaseClient,
  master: CryptoKey,
  userId: string
): Promise<PullResult> {
  const data: VaultData = { days: {}, patients: [], evolution: [], lunch: {} };
  let skipped = 0;

  const [days, patients, notes, settings] = await Promise.all([
    supabase.from("days").select("date, content").eq("user_id", userId),
    supabase.from("patients").select("id, content").eq("user_id", userId),
    supabase.from("notes").select("id, patient_id, date, content").eq("user_id", userId),
    supabase.from("settings").select("content").eq("user_id", userId).maybeSingle(),
  ]);

  for (const row of days.data ?? []) {
    const slots = await decryptRecord<DaySlots>(master, row.content);
    if (slots) data.days[row.date] = slots;
    else skipped += 1;
  }

  for (const row of patients.data ?? []) {
    const patient = await decryptRecord<Patient>(master, row.content);
    if (patient) data.patients.push(patient);
    else skipped += 1;
  }

  for (const row of notes.data ?? []) {
    const note = await decryptRecord<EvolutionEntry>(master, row.content);
    if (note) data.evolution.push(note);
    else skipped += 1;
  }

  if (settings.data?.content) {
    const lunch = await decryptRecord<LunchConfigByWeekday>(master, settings.data.content);
    if (lunch) data.lunch = lunch;
    else skipped += 1;
  }

  data.patients.sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
  data.evolution.sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));

  return { data, skipped };
}

export async function pushDay(
  supabase: SupabaseClient,
  master: CryptoKey,
  userId: string,
  dateISO: string,
  slots: DaySlots
): Promise<void> {
  // An emptied day is removed rather than stored as an empty object, so the
  // server holds no row for a date with nothing on it.
  if (Object.keys(slots).length === 0) {
    await supabase.from("days").delete().eq("user_id", userId).eq("date", dateISO);
    return;
  }
  await supabase.from("days").upsert(
    { user_id: userId, date: dateISO, content: await encryptRecord(master, slots) },
    { onConflict: "user_id,date" }
  );
}

export async function pushPatients(
  supabase: SupabaseClient,
  master: CryptoKey,
  userId: string,
  next: Patient[],
  previous: Patient[]
): Promise<void> {
  const prevById = new Map(previous.map((p) => [p.id, p]));
  const nextIds = new Set(next.map((p) => p.id));

  const changed = next.filter(
    (p) => JSON.stringify(prevById.get(p.id)) !== JSON.stringify(p)
  );
  const removed = previous.filter((p) => !nextIds.has(p.id)).map((p) => p.id);

  if (changed.length > 0) {
    const rows = await Promise.all(
      changed.map(async (p) => ({
        user_id: userId,
        id: p.id,
        content: await encryptRecord(master, p),
      }))
    );
    await supabase.from("patients").upsert(rows, { onConflict: "user_id,id" });
  }
  if (removed.length > 0) {
    await supabase.from("patients").delete().eq("user_id", userId).in("id", removed);
  }
}

export async function pushNotes(
  supabase: SupabaseClient,
  master: CryptoKey,
  userId: string,
  next: EvolutionEntry[],
  previous: EvolutionEntry[]
): Promise<void> {
  const prevById = new Map(previous.map((e) => [e.id, e]));
  const nextIds = new Set(next.map((e) => e.id));

  const changed = next.filter(
    (e) => JSON.stringify(prevById.get(e.id)) !== JSON.stringify(e)
  );
  const removed = previous.filter((e) => !nextIds.has(e.id)).map((e) => e.id);

  if (changed.length > 0) {
    const rows = await Promise.all(
      changed.map(async (e) => ({
        user_id: userId,
        id: e.id,
        // Kept in the clear so a patient's notes can be fetched without
        // downloading every note; it is an opaque id, not a name.
        patient_id: e.patientId,
        date: e.date,
        content: await encryptRecord(master, e),
      }))
    );
    await supabase.from("notes").upsert(rows, { onConflict: "user_id,id" });
  }
  if (removed.length > 0) {
    await supabase.from("notes").delete().eq("user_id", userId).in("id", removed);
  }
}

export async function pushSettings(
  supabase: SupabaseClient,
  master: CryptoKey,
  userId: string,
  lunch: LunchConfigByWeekday
): Promise<void> {
  await supabase.from("settings").upsert(
    { user_id: userId, content: await encryptRecord(master, lunch) },
    { onConflict: "user_id" }
  );
}

/** Upload a whole local dataset — used when migrating a device into an account. */
export async function pushEverything(
  supabase: SupabaseClient,
  master: CryptoKey,
  userId: string,
  data: VaultData
): Promise<{ days: number; patients: number; notes: number }> {
  const days = Object.entries(data.days).filter(
    ([, slots]) => Object.keys(slots).length > 0
  );

  for (const [dateISO, slots] of days) {
    await pushDay(supabase, master, userId, dateISO, slots as DaySlots);
  }
  await pushPatients(supabase, master, userId, data.patients, []);
  await pushNotes(supabase, master, userId, data.evolution, []);
  await pushSettings(supabase, master, userId, data.lunch);

  return {
    days: days.length,
    patients: data.patients.length,
    notes: data.evolution.length,
  };
}

/** Merge remote into local, preferring remote for any date both hold. */
export function mergeSchedules(
  local: SchedulePayload,
  remote: SchedulePayload
): SchedulePayload {
  return { ...local, ...remote };
}
