import { describe, it, expect } from "vitest";
import {
  ALL_SLOTS,
  DAY_START_HOUR,
  DAY_END_HOUR,
  slotHour,
  isLunchSlot,
  getWindowDays,
  getMondayOf,
  toISODate,
  fromISODate,
  addDays,
  isSameDay,
  isWeekend,
  legacyDayIndex,
  migrateLegacySlotIndex,
  getMonthGrid,
  formatHour,
} from "./schedule";

describe("the slot list", () => {
  it("covers every hour from 06:00 to 22:00 with no gap", () => {
    expect(ALL_SLOTS).toHaveLength(DAY_END_HOUR - DAY_START_HOUR);
    expect(ALL_SLOTS[0]).toBe("06:00");
    expect(ALL_SLOTS.at(-1)).toBe("21:00");
    // 12:00 was absent in v1 and its reintroduction is what forced the
    // migration; a gap here would break lunch placement silently.
    expect(ALL_SLOTS).toContain("12:00");
  });

  it("maps indices to the hours they display", () => {
    ALL_SLOTS.forEach((label, i) => {
      expect(label).toBe(formatHour(slotHour(i)));
    });
  });
});

describe("lunch placement", () => {
  const at = (startHour: number, endHour: number) => ({ startHour, endHour });

  it("marks only the configured hour", () => {
    const noon = ALL_SLOTS.indexOf("12:00");
    expect(isLunchSlot(noon, at(12, 13))).toBe(true);
    expect(isLunchSlot(noon - 1, at(12, 13))).toBe(false);
    expect(isLunchSlot(noon + 1, at(12, 13))).toBe(false);
  });

  it("covers every hour of a multi-hour break", () => {
    const hours = ALL_SLOTS.map((_, i) => i).filter((i) => isLunchSlot(i, at(11, 14)));
    expect(hours.map(slotHour)).toEqual([11, 12, 13]);
  });

  it("moves with the configuration rather than staying at noon", () => {
    const noon = ALL_SLOTS.indexOf("12:00");
    const three = ALL_SLOTS.indexOf("15:00");
    expect(isLunchSlot(three, at(15, 16))).toBe(true);
    expect(isLunchSlot(noon, at(15, 16))).toBe(false);
  });

  it("marks nothing when the break falls outside the day", () => {
    expect(ALL_SLOTS.every((_, i) => !isLunchSlot(i, at(3, 4)))).toBe(true);
  });
});

describe("the five-day window", () => {
  it("centres on the selected date", () => {
    const days = getWindowDays(fromISODate("2026-03-04")).map(toISODate);
    expect(days).toEqual([
      "2026-03-02",
      "2026-03-03",
      "2026-03-04",
      "2026-03-05",
      "2026-03-06",
    ]);
    expect(days[2]).toBe("2026-03-04");
  });

  it("includes weekends, so they can be booked", () => {
    // A Saturday in the middle is the case the old Mon-Fri grid could not show.
    const days = getWindowDays(fromISODate("2026-03-07"));
    expect(days.map(toISODate)[2]).toBe("2026-03-07");
    expect(days.filter(isWeekend).map(toISODate)).toEqual(["2026-03-07", "2026-03-08"]);
  });

  it("crosses month and year boundaries", () => {
    expect(getWindowDays(fromISODate("2026-01-01")).map(toISODate)).toEqual([
      "2025-12-30",
      "2025-12-31",
      "2026-01-01",
      "2026-01-02",
      "2026-01-03",
    ]);
  });

  it("steps a full window without skipping days", () => {
    // Stepping by the window size is what keeps coverage contiguous; a
    // seven-day step would skip the weekend the window exists to reach.
    const first = getWindowDays(fromISODate("2026-03-04")).map(toISODate);
    const next = getWindowDays(addDays(fromISODate("2026-03-04"), 5)).map(toISODate);
    expect(fromISODate(next[0]).getTime() - fromISODate(first.at(-1)!).getTime()).toBe(
      24 * 60 * 60 * 1000
    );
  });
});

describe("date helpers", () => {
  it("finds Monday from any day, including Sunday", () => {
    expect(toISODate(getMondayOf(fromISODate("2026-03-04")))).toBe("2026-03-02");
    expect(toISODate(getMondayOf(fromISODate("2026-03-02")))).toBe("2026-03-02");
    // Sunday belongs to the week that started six days earlier, not the next.
    expect(toISODate(getMondayOf(fromISODate("2026-03-08")))).toBe("2026-03-02");
  });

  it("round-trips ISO dates in local time", () => {
    // Parsing via Date(string) would shift by timezone; this must not.
    for (const iso of ["2026-01-01", "2026-06-15", "2026-12-31"]) {
      expect(toISODate(fromISODate(iso))).toBe(iso);
    }
  });

  it("crosses a DST boundary without losing a day", () => {
    // Brazil has abolished DST, but a user's browser may not be in Brazil.
    const days = Array.from({ length: 5 }, (_, i) =>
      toISODate(addDays(fromISODate("2026-10-16"), i))
    );
    expect(days).toEqual([
      "2026-10-16",
      "2026-10-17",
      "2026-10-18",
      "2026-10-19",
      "2026-10-20",
    ]);
  });

  it("compares calendar days, not instants", () => {
    const morning = fromISODate("2026-03-04");
    const evening = new Date(2026, 2, 4, 23, 59, 59);
    expect(isSameDay(morning, evening)).toBe(true);
    expect(isSameDay(morning, fromISODate("2026-03-05"))).toBe(false);
  });

  it("orders weekdays Monday-first for the legacy column mapping", () => {
    expect(legacyDayIndex(fromISODate("2026-03-02"))).toBe(0); // Monday
    expect(legacyDayIndex(fromISODate("2026-03-06"))).toBe(4); // Friday
    expect(legacyDayIndex(fromISODate("2026-03-08"))).toBe(6); // Sunday
  });
});

describe("legacy slot migration", () => {
  it("leaves morning slots alone and shifts the afternoon", () => {
    // v1 indices 0-5 were 06:00-11:00; index 6 began at 13:00.
    expect([0, 1, 5].map(migrateLegacySlotIndex)).toEqual([0, 1, 5]);
    expect([6, 7, 8].map(migrateLegacySlotIndex)).toEqual([7, 8, 9]);
  });

  it("preserves the displayed hour across the migration", () => {
    const v1Hour = (i: number) => (i < 6 ? 6 + i : 7 + i);
    for (let i = 0; i <= 14; i++) {
      expect(slotHour(migrateLegacySlotIndex(i))).toBe(v1Hour(i));
    }
  });
});

describe("the month grid", () => {
  it("is always a full six-week rectangle starting on Monday", () => {
    for (const [y, m] of [[2026, 0], [2026, 1], [2026, 8]] as const) {
      const cells = getMonthGrid(y, m);
      expect(cells).toHaveLength(42);
      expect(cells[0].date.getDay()).toBe(1);
    }
  });

  it("pads with neighbouring months rather than blanks", () => {
    const cells = getMonthGrid(2026, 2);
    expect(cells.filter((c) => c.inCurrentMonth)).toHaveLength(31);
    expect(cells.some((c) => !c.inCurrentMonth)).toBe(true);
  });
});
