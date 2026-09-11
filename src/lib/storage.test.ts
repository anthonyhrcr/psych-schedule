import { describe, it, expect } from "vitest";
import {
  loadDay,
  saveDay,
  loadAllDays,
  loadPatients,
  savePatients,
  loadEvolutionEntries,
  saveEvolutionEntries,
  loadLunchConfig,
  saveLunchConfig,
  buildBackup,
  parseBackup,
  restoreBackup,
  readDeviceData,
  deviceDataCounts,
} from "./storage";
import { slotHour } from "./schedule";

/**
 * These target the places where data goes missing quietly: version
 * migrations and restore. Both have already produced real defects in this
 * project, and both fail in ways nobody notices until the records are gone.
 */

const v3 = (iso: string) => `psych-schedule:v3:day:${iso}`;
const v2 = (mondayISO: string) => `psych-schedule:v2:week:${mondayISO}`;
const v1 = (mondayISO: string) => `psych-schedule:v1:${mondayISO}`;

/** The hour a slot index lands on, which is what a migration must preserve. */
const hoursOf = (slots: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(slots).map(([i, name]) => [slotHour(Number(i)), name])
  );

describe("day storage", () => {
  it("returns an empty day rather than throwing on a miss", () => {
    expect(loadDay("2026-03-02")).toEqual({});
  });

  it("survives corrupted JSON instead of breaking the app", () => {
    localStorage.setItem(v3("2026-03-02"), "{not valid json");
    expect(loadDay("2026-03-02")).toEqual({});
  });

  it("writes an emptied day rather than deleting the key", () => {
    // The key must persist, otherwise a legacy migration re-fires on the next
    // read and resurrects bookings the user has just cleared.
    saveDay("2026-03-02", { 3: "Ana" });
    saveDay("2026-03-02", {});
    expect(localStorage.getItem(v3("2026-03-02"))).toBe("{}");
    expect(loadDay("2026-03-02")).toEqual({});
  });
});

describe("migration from the v2 week format", () => {
  // 2026-03-02 is a Monday; v2 keyed a week by column, 0 = Monday.
  it("splits a week into per-date keys at the same hours", () => {
    localStorage.setItem(
      v2("2026-03-02"),
      JSON.stringify({ 0: { 7: "Monday 1pm" }, 4: { 8: "Friday 2pm" } })
    );

    expect(hoursOf(loadDay("2026-03-02"))).toEqual({ 13: "Monday 1pm" });
    expect(hoursOf(loadDay("2026-03-06"))).toEqual({ 14: "Friday 2pm" });
  });

  it("rewrites migrated days under the current key", () => {
    localStorage.setItem(v2("2026-03-02"), JSON.stringify({ 0: { 7: "Ana" } }));
    loadDay("2026-03-02");
    expect(localStorage.getItem(v3("2026-03-02"))).toContain("Ana");
  });

  it("does not resurrect a booking the user cleared after migrating", () => {
    localStorage.setItem(v2("2026-03-02"), JSON.stringify({ 0: { 7: "Ana" } }));
    loadDay("2026-03-02");
    saveDay("2026-03-02", {});
    expect(loadDay("2026-03-02")).toEqual({});
  });
});

describe("migration from the v1 week format", () => {
  it("shifts afternoon slots so the hour is preserved", () => {
    // v1 had no 12:00 slot: indices 0-5 were 06:00-11:00 and index 6 began at
    // 13:00. Adding 12:00 shifts every afternoon slot one place later.
    localStorage.setItem(
      v1("2026-03-02"),
      JSON.stringify({ 0: { 0: "6am", 5: "11am", 6: "1pm", 8: "3pm" } })
    );

    expect(hoursOf(loadDay("2026-03-02"))).toEqual({
      6: "6am",
      11: "11am",
      13: "1pm",
      15: "3pm",
    });
  });

  it("prefers v2 over v1 when both exist for a week", () => {
    localStorage.setItem(v2("2026-03-02"), JSON.stringify({ 0: { 7: "from v2" } }));
    localStorage.setItem(v1("2026-03-02"), JSON.stringify({ 0: { 6: "from v1" } }));
    expect(Object.values(loadDay("2026-03-02"))).toEqual(["from v2"]);
  });
});

describe("loadAllDays", () => {
  it("includes legacy weeks that were never opened", () => {
    // History built from current keys alone would omit any week the user
    // never scrolled back to, because migration happens lazily on read.
    localStorage.setItem(v3("2026-03-02"), JSON.stringify({ 1: "current" }));
    localStorage.setItem(v2("2026-02-02"), JSON.stringify({ 0: { 7: "old v2" } }));
    localStorage.setItem(v1("2026-01-05"), JSON.stringify({ 0: { 6: "old v1" } }));

    const all = loadAllDays();
    expect(Object.keys(all).sort()).toEqual(["2026-01-05", "2026-02-02", "2026-03-02"]);
    expect(hoursOf(all["2026-01-05"])).toEqual({ 13: "old v1" });
  });

  it("does not mistake the patients key for a dated week", () => {
    // The v1 prefix also covers patients/evolution/lunch, so the suffix has
    // to actually look like a date before it is read as a week.
    localStorage.setItem(
      "psych-schedule:v1:patients",
      JSON.stringify([{ id: "p1", name: "Ana", createdAt: "2026-01-01" }])
    );
    expect(loadAllDays()).toEqual({});
  });

  it("reading history does not rewrite legacy storage", () => {
    localStorage.setItem(v2("2026-02-02"), JSON.stringify({ 0: { 7: "old" } }));
    loadAllDays();
    expect(localStorage.getItem(v3("2026-02-02"))).toBeNull();
  });
});

describe("lunch configuration", () => {
  it("migrates column positions to weekdays", () => {
    // Columns 0-4 were Monday-Friday, i.e. weekdays 1-5.
    localStorage.setItem(
      "psych-schedule:v1:lunch-config",
      JSON.stringify({ 0: { startHour: 11, endHour: 12 }, 2: { startHour: 15, endHour: 16 } })
    );
    expect(loadLunchConfig()).toEqual({
      1: { startHour: 11, endHour: 12 },
      3: { startHour: 15, endHour: 16 },
    });
  });

  it("keeps a saved config over the legacy one", () => {
    saveLunchConfig({ 6: { startHour: 9, endHour: 11 } });
    localStorage.setItem(
      "psych-schedule:v1:lunch-config",
      JSON.stringify({ 0: { startHour: 11, endHour: 12 } })
    );
    expect(loadLunchConfig()).toEqual({ 6: { startHour: 9, endHour: 11 } });
  });
});

describe("backup and restore", () => {
  const seed = () => {
    saveDay("2026-03-02", { 1: "Ana", 4: "Rafael" });
    saveDay("2026-03-03", { 2: "Helena" });
    savePatients([{ id: "p1", name: "Ana", createdAt: "2026-01-01T00:00:00Z" }]);
    saveEvolutionEntries([
      { id: "e1", patientId: "p1", date: "2026-02-01", text: "note", createdAt: "2026-02-01T00:00:00Z" },
    ]);
    saveLunchConfig({ 3: { startHour: 15, endHour: 16 } });
  };

  it("round-trips everything through a backup file", () => {
    seed();
    const file = JSON.stringify(buildBackup());
    localStorage.clear();

    const parsed = parseBackup(file);
    expect(parsed).not.toBeNull();
    restoreBackup(parsed!);

    expect(loadDay("2026-03-02")).toEqual({ 1: "Ana", 4: "Rafael" });
    expect(loadPatients()).toHaveLength(1);
    expect(loadEvolutionEntries()).toHaveLength(1);
    expect(loadLunchConfig()).toEqual({ 3: { startHour: 15, endHour: 16 } });
  });

  it("is idempotent — restoring twice duplicates nothing", () => {
    // Someone anxious about their data will restore the same file twice.
    seed();
    const parsed = parseBackup(JSON.stringify(buildBackup()))!;
    localStorage.clear();

    restoreBackup(parsed);
    const second = restoreBackup(parsed);

    expect(loadPatients()).toHaveLength(1);
    expect(loadEvolutionEntries()).toHaveLength(1);
    expect(second.patients).toBe(0);
    expect(second.notes).toBe(0);
  });

  it("leaves dates absent from the file untouched", () => {
    seed();
    const parsed = parseBackup(JSON.stringify(buildBackup()))!;
    saveDay("2026-05-05", { 6: "added later" });

    restoreBackup(parsed);

    expect(loadDay("2026-05-05")).toEqual({ 6: "added later" });
    expect(loadDay("2026-03-02")).toEqual({ 1: "Ana", 4: "Rafael" });
  });

  it("rejects a file that is not one of ours", () => {
    expect(parseBackup('{"some":"other json"}')).toBeNull();
    expect(parseBackup("not json at all")).toBeNull();
    expect(parseBackup("[]")).toBeNull();
  });

  it("ignores malformed dates inside an otherwise valid backup", () => {
    const bundle = {
      format: "psych-schedule-backup",
      version: 1,
      exportedAt: "2026-01-01T00:00:00Z",
      days: { "2026-03-02": { 1: "Ana" }, "not-a-date": { 1: "bad" } },
      patients: [],
      evolution: [],
      lunch: {},
    };
    const result = restoreBackup(parseBackup(JSON.stringify(bundle))!);
    expect(result.days).toBe(1);
    expect(loadDay("2026-03-02")).toEqual({ 1: "Ana" });
  });
});

describe("device data counts", () => {
  it("counts sessions rather than days", () => {
    saveDay("2026-03-02", { 1: "Ana", 4: "Rafael" });
    saveDay("2026-03-03", { 2: "Helena" });
    savePatients([{ id: "p1", name: "Ana", createdAt: "2026-01-01T00:00:00Z" }]);
    expect(deviceDataCounts()).toEqual({ sessions: 3, patients: 1, notes: 0 });
  });

  it("reports nothing on an untouched device", () => {
    expect(deviceDataCounts()).toEqual({ sessions: 0, patients: 0, notes: 0 });
    expect(readDeviceData().days).toEqual({});
  });
});
