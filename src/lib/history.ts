import { ALL_SLOTS, SchedulePayload, slotHour, formatHour } from "./schedule";

export type SessionRecord = {
  dateISO: string;
  slotIndex: number;
  time: string;
  patientName: string;
};

export type HistoryDay = {
  dateISO: string;
  sessions: SessionRecord[];
};

export type HistorySummary = {
  totalSessions: number;
  totalDays: number;
  patients: Array<{ name: string; count: number }>;
  firstDateISO: string | null;
  lastDateISO: string | null;
};

/** Flatten stored days into one chronological list of sessions. */
export function toSessions(days: SchedulePayload): SessionRecord[] {
  const out: SessionRecord[] = [];
  for (const [dateISO, slots] of Object.entries(days)) {
    for (const [slotKey, patientName] of Object.entries(slots)) {
      const slotIndex = Number(slotKey);
      if (!Number.isInteger(slotIndex) || !patientName) continue;
      out.push({
        dateISO,
        slotIndex,
        // Slots outside the current 6:00–22:00 list can exist in old data;
        // fall back to deriving the label rather than dropping the session.
        time: ALL_SLOTS[slotIndex] ?? formatHour(slotHour(slotIndex)),
        patientName,
      });
    }
  }
  return out;
}

/** Group sessions by date, newest date first, each day ordered by hour. */
export function groupByDate(sessions: SessionRecord[]): HistoryDay[] {
  const byDate = new Map<string, SessionRecord[]>();
  for (const s of sessions) {
    const list = byDate.get(s.dateISO);
    if (list) list.push(s);
    else byDate.set(s.dateISO, [s]);
  }
  return Array.from(byDate.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([dateISO, list]) => ({
      dateISO,
      sessions: list.sort((a, b) => a.slotIndex - b.slotIndex),
    }));
}

export function summarize(sessions: SessionRecord[]): HistorySummary {
  const counts = new Map<string, number>();
  let first: string | null = null;
  let last: string | null = null;
  const dates = new Set<string>();

  for (const s of sessions) {
    counts.set(s.patientName, (counts.get(s.patientName) ?? 0) + 1);
    dates.add(s.dateISO);
    if (!first || s.dateISO < first) first = s.dateISO;
    if (!last || s.dateISO > last) last = s.dateISO;
  }

  const patients = Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return {
    totalSessions: sessions.length,
    totalDays: dates.size,
    patients,
    firstDateISO: first,
    lastDateISO: last,
  };
}
