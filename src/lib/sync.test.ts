import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { pushDay, pushPatients, pushNotes, pullAll } from "./sync";
import { createAccountKeys, encryptRecord } from "./account";
import { Patient } from "./patients";
import { EvolutionEntry } from "./evolution";

/**
 * The diffing decides what is written and, more importantly, what is deleted.
 * A wrong `removed` set erases a patient's history, so these lean on the
 * delete path as hard as the upsert one.
 *
 * Errors matter as much: every write used to discard the database's error and
 * report success, which turned a failed migration into a silent one.
 */

type Call = { table: string; op: string; payload?: unknown; ids?: unknown };

function fakeSupabase(opts: { failOn?: string } = {}) {
  const calls: Call[] = [];
  const rows: Record<string, unknown[]> = {
    days: [],
    patients: [],
    notes: [],
    settings: [],
  };

  const err = (table: string) =>
    opts.failOn === table ? { message: "database refused the write" } : null;

  const client = {
    from(table: string) {
      const builder = {
        upsert(payload: unknown) {
          calls.push({ table, op: "upsert", payload });
          return Promise.resolve({ error: err(table) });
        },
        delete() {
          const d = {
            _ids: undefined as unknown,
            eq() {
              return d;
            },
            in(_col: string, ids: unknown) {
              d._ids = ids;
              calls.push({ table, op: "delete", ids });
              return Promise.resolve({ error: err(table) });
            },
            then(resolve: (v: unknown) => void) {
              calls.push({ table, op: "delete", ids: d._ids });
              return Promise.resolve({ error: err(table) }).then(resolve);
            },
          };
          return d;
        },
        select() {
          const s = {
            eq: () => s,
            maybeSingle: () => Promise.resolve({ data: rows[table][0] ?? null }),
            then: (resolve: (v: unknown) => void) =>
              Promise.resolve({ data: rows[table] }).then(resolve),
          };
          return s;
        },
      };
      return builder;
    },
  } as unknown as SupabaseClient;

  return { client, calls, rows };
}

const patient = (id: string, name: string): Patient => ({
  id,
  name,
  createdAt: "2026-01-01T00:00:00Z",
});

const note = (id: string, text: string): EvolutionEntry => ({
  id,
  patientId: "p1",
  date: "2026-02-01",
  text,
  createdAt: "2026-02-01T00:00:00Z",
});

describe("pushing a day", () => {
  it("deletes the row when the day is emptied", async () => {
    // Storing an empty object would leave the server holding a row for a date
    // with nothing on it.
    const { client, calls } = fakeSupabase();
    const { master } = await createAccountKeys("pw");
    await pushDay(client, master, "u1", "2026-03-04", {});
    expect(calls).toEqual([{ table: "days", op: "delete", ids: undefined }]);
  });

  it("sends ciphertext, never the patient name", async () => {
    const { client, calls } = fakeSupabase();
    const { master } = await createAccountKeys("pw");
    await pushDay(client, master, "u1", "2026-03-04", { 1: "Ana Beatriz" });
    expect(JSON.stringify(calls)).not.toContain("Ana Beatriz");
  });

  it("throws when the database refuses", async () => {
    const { client } = fakeSupabase({ failOn: "days" });
    const { master } = await createAccountKeys("pw");
    await expect(pushDay(client, master, "u1", "2026-03-04", { 1: "Ana" })).rejects.toThrow(
      /database refused/
    );
  });
});

describe("diffing patients", () => {
  it("writes nothing when nothing changed", async () => {
    const { client, calls } = fakeSupabase();
    const { master } = await createAccountKeys("pw");
    const list = [patient("p1", "Ana")];
    await pushPatients(client, master, "u1", list, list);
    expect(calls).toEqual([]);
  });

  it("upserts only the changed record", async () => {
    const { client, calls } = fakeSupabase();
    const { master } = await createAccountKeys("pw");
    await pushPatients(
      client,
      master,
      "u1",
      [patient("p1", "Ana"), patient("p2", "Rafael renamed")],
      [patient("p1", "Ana"), patient("p2", "Rafael")]
    );
    const upserts = calls.filter((c) => c.op === "upsert");
    expect(upserts).toHaveLength(1);
    expect((upserts[0].payload as Array<{ id: string }>).map((r) => r.id)).toEqual(["p2"]);
  });

  it("deletes only what was actually removed", async () => {
    const { client, calls } = fakeSupabase();
    const { master } = await createAccountKeys("pw");
    await pushPatients(
      client,
      master,
      "u1",
      [patient("p1", "Ana")],
      [patient("p1", "Ana"), patient("p2", "Rafael")]
    );
    expect(calls.filter((c) => c.op === "delete")).toEqual([
      { table: "patients", op: "delete", ids: ["p2"] },
    ]);
  });

  it("does not delete anything on a first upload", async () => {
    // Migration passes an empty `previous`; treating that as "everything was
    // removed" would wipe the account being migrated into.
    const { client, calls } = fakeSupabase();
    const { master } = await createAccountKeys("pw");
    await pushPatients(client, master, "u1", [patient("p1", "Ana")], []);
    expect(calls.some((c) => c.op === "delete")).toBe(false);
  });

  it("throws rather than reporting a refused write as success", async () => {
    const { client } = fakeSupabase({ failOn: "patients" });
    const { master } = await createAccountKeys("pw");
    await expect(
      pushPatients(client, master, "u1", [patient("p1", "Ana")], [])
    ).rejects.toThrow(/patients:/);
  });
});

describe("diffing notes", () => {
  it("keeps patient_id readable for querying but encrypts the text", async () => {
    const { client, calls } = fakeSupabase();
    const { master } = await createAccountKeys("pw");
    await pushNotes(client, master, "u1", [note("e1", "Relatou ansiedade")], []);
    const row = (calls[0].payload as Array<Record<string, string>>)[0];
    expect(row.patient_id).toBe("p1");
    expect(row.content).not.toContain("ansiedade");
  });

  it("deletes a removed note", async () => {
    const { client, calls } = fakeSupabase();
    const { master } = await createAccountKeys("pw");
    await pushNotes(client, master, "u1", [], [note("e1", "gone")]);
    expect(calls.filter((c) => c.op === "delete")).toEqual([
      { table: "notes", op: "delete", ids: ["e1"] },
    ]);
  });
});

describe("pulling everything back", () => {
  it("decrypts rows into records", async () => {
    const { client, rows } = fakeSupabase();
    const { master } = await createAccountKeys("pw");
    rows.days = [{ date: "2026-03-04", content: await encryptRecord(master, { 1: "Ana" }) }];
    rows.patients = [{ id: "p1", content: await encryptRecord(master, patient("p1", "Ana")) }];

    const { data, skipped } = await pullAll(client, master, "u1");
    expect(data.days["2026-03-04"]).toEqual({ 1: "Ana" });
    expect(data.patients[0].name).toBe("Ana");
    expect(skipped).toBe(0);
  });

  it("skips an unreadable row instead of failing the whole account", async () => {
    // One damaged record should cost that record, not access to everything.
    const { client, rows } = fakeSupabase();
    const { master } = await createAccountKeys("pw");
    const other = await createAccountKeys("pw");
    rows.days = [
      { date: "2026-03-04", content: await encryptRecord(master, { 1: "Ana" }) },
      { date: "2026-03-05", content: await encryptRecord(other.master, { 1: "Unreadable" }) },
    ];

    const { data, skipped } = await pullAll(client, master, "u1");
    expect(Object.keys(data.days)).toEqual(["2026-03-04"]);
    expect(skipped).toBe(1);
  });
});
