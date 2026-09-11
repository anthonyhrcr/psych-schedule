import { describe, it, expect } from "vitest";
import { toSessions, groupByDate, summarize } from "./history";
import { SchedulePayload } from "./schedule";

const days: SchedulePayload = {
  "2026-03-04": { 4: "Ana Beatriz", 1: "Rafael Moura" },
  "2026-03-02": { 2: "Ana Beatriz" },
  "2026-03-09": { 3: "Helena Costa" },
};

describe("flattening days into sessions", () => {
  it("gives every booking its hour label", () => {
    const sessions = toSessions({ "2026-03-04": { 0: "Ana", 15: "Rafael" } });
    expect(sessions.map((s) => s.time).sort()).toEqual(["06:00", "21:00"]);
  });

  it("skips empty names rather than listing blank sessions", () => {
    expect(toSessions({ "2026-03-04": { 1: "", 2: "Ana" } })).toHaveLength(1);
  });

  it("still labels a slot index outside the current day", () => {
    // Old data can hold indices beyond today's list; dropping them would make
    // sessions disappear from the record without explanation.
    const [session] = toSessions({ "2026-03-04": { 20: "Late" } });
    expect(session.time).toBe("26:00");
    expect(session.patientName).toBe("Late");
  });
});

describe("grouping", () => {
  it("orders days newest first and hours earliest first", () => {
    const grouped = groupByDate(toSessions(days));
    expect(grouped.map((g) => g.dateISO)).toEqual([
      "2026-03-09",
      "2026-03-04",
      "2026-03-02",
    ]);
    expect(grouped[1].sessions.map((s) => s.time)).toEqual(["07:00", "10:00"]);
  });

  it("returns nothing for an empty record", () => {
    expect(groupByDate([])).toEqual([]);
  });
});

describe("summarising", () => {
  it("counts sessions and distinct patients, not rows", () => {
    const s = summarize(toSessions(days));
    expect(s.totalSessions).toBe(4);
    expect(s.totalDays).toBe(3);
    expect(s.patients).toHaveLength(3);
  });

  it("ranks patients by how often they appear", () => {
    const s = summarize(toSessions(days));
    expect(s.patients[0]).toEqual({ name: "Ana Beatriz", count: 2 });
  });

  it("spans the earliest and latest dates held", () => {
    const s = summarize(toSessions(days));
    expect(s.firstDateISO).toBe("2026-03-02");
    expect(s.lastDateISO).toBe("2026-03-09");
  });

  it("reports an empty record without inventing a range", () => {
    const s = summarize([]);
    expect(s).toMatchObject({ totalSessions: 0, totalDays: 0, firstDateISO: null, lastDateISO: null });
  });
});
