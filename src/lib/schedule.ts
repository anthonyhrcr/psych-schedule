// --- Domain model -----------------------------------------------------------

// The day runs as one unbroken column of hours. Lunch is not a gap in this
// list — it is a property of individual cells, so it can move per day.
export const DAY_START_HOUR = 6;
export const DAY_END_HOUR = 22; // exclusive; the last slot starts at 21:00

export const ALL_SLOTS: string[] = Array.from(
  { length: DAY_END_HOUR - DAY_START_HOUR },
  (_, i) => formatHour(DAY_START_HOUR + i)
);

// The grid shows five consecutive days centred on the selected one, so any
// date — weekends included — can sit in the middle and be scheduled.
export const WINDOW_SIZE = 5;
export const WINDOW_OFFSET = 2; // days shown before the selected date

/** The five dates on screen, in order, centred on `selectedDate`. */
export function getWindowDays(selectedDate: Date): Date[] {
  const start = addDays(selectedDate, -WINDOW_OFFSET);
  return Array.from({ length: WINDOW_SIZE }, (_, i) => addDays(start, i));
}

/** The clock hour a slot index represents. */
export function slotHour(slotIndex: number): number {
  return DAY_START_HOUR + slotIndex;
}

/** True when this slot falls inside the given day's lunch break. */
export function isLunchSlot(slotIndex: number, config: LunchConfig): boolean {
  const hour = slotHour(slotIndex);
  return hour >= config.startHour && hour < config.endHour;
}

export type CellValue = string;

/** One day's bookings, keyed by slot index. */
export type DaySlots = { [slotIndex: number]: CellValue };

/** The loaded window, keyed by ISO date so it can span weeks and months. */
export type SchedulePayload = { [dateISO: string]: DaySlots };

/** Legacy shape: a Mon–Fri week keyed by column position. */
export type WeekPayload = {
  [dayIndex: number]: DaySlots;
};

// Per-day lunch configuration. The hour is expressed as the start of the hour
// (e.g., 12 = 12:00–13:00, 11.5 would be 11:30–12:30, but we keep it as integer
// hours for simplicity — the popover uses hh:mm inputs that round to the hour).
export type LunchConfig = {
  startHour: number; // integer hour, e.g., 12
  endHour: number; // integer hour, e.g., 13
};

/**
 * Lunch belongs to a weekday (0 = Sunday … 6 = Saturday), not to a column.
 * Wednesday's break stays Wednesday's as the window slides.
 */
export type LunchConfigByWeekday = { [weekday: number]: LunchConfig };

export const DEFAULT_LUNCH: LunchConfig = { startHour: 12, endHour: 13 };

// v3 stores one key per calendar date, so the grid is free to show any five
// consecutive days. v2/v1 stored Mon–Fri weeks and are migrated on read.
export const DAY_KEY_PREFIX = "psych-schedule:v3:day:";
export const WEEK_KEY_PREFIX = "psych-schedule:v2:week:";
export const LEGACY_WEEK_KEY_PREFIX = "psych-schedule:v1:";
export const LANG_STORAGE_KEY = "psych-schedule:lang";
export const LUNCH_CONFIG_KEY = "psych-schedule:v2:lunch-by-weekday";
export const LEGACY_LUNCH_CONFIG_KEY = "psych-schedule:v1:lunch-config";

export const dayKey = (dateISO: string) => `${DAY_KEY_PREFIX}${dateISO}`;
export const weekKey = (mondayISO: string) => `${WEEK_KEY_PREFIX}${mondayISO}`;
export const legacyWeekKey = (mondayISO: string) =>
  `${LEGACY_WEEK_KEY_PREFIX}${mondayISO}`;

/** Mon=0 … Sun=6, the column order the legacy week payloads used. */
export function legacyDayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function isWeekend(date: Date): boolean {
  const d = date.getDay();
  return d === 0 || d === 6;
}

/**
 * v1 stored a slot list with no 12:00 entry: indices 0–5 were 06:00–11:00 and
 * index 6 onward started at 13:00. v2 includes 12:00, so every afternoon slot
 * shifts one place later.
 */
export function migrateLegacySlotIndex(slotIndex: number): number {
  return slotIndex < 6 ? slotIndex : slotIndex + 1;
}

// --- Date utilities ---------------------------------------------------------

/** Return the Monday (00:00 local) of the week containing the given date. */
export function getMondayOf(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

/** ISO date (YYYY-MM-DD) in local time. */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parse a YYYY-MM-DD string into a local Date at 00:00. */
export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Add `days` to a date, returning a new Date. */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** True if two dates are the same calendar day (local). */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const LOCALE_BY_LANG = {
  en: "en-US",
  pt: "pt-BR",
} as const;

export type Lang = keyof typeof LOCALE_BY_LANG;

export function localeFor(lang: Lang): string {
  return LOCALE_BY_LANG[lang];
}

/** Format a single day as "Mon, 11 Aug" / "Seg, 11 Ago". */
export function formatDay(date: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(localeFor(lang), {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(date);
}

/** Format a month label as "August 2026" / "Agosto 2026". */
export function formatMonthYear(date: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(localeFor(lang), {
    month: "long",
    year: "numeric",
  }).format(date);
}

/** Format a numeric hour as "12:00" / "07:00". */
export function formatHour(h: number): string {
  return `${String(h).padStart(2, "0")}:00`;
}

/** Format a lunch config as "12:00 – 13:00". */
export function formatLunchLabel(config: LunchConfig, lang: Lang): string {
  const range = `${formatHour(config.startHour)} – ${formatHour(config.endHour)}`;
  return lang === "pt" ? `Almoço · ${range}` : `Lunch · ${range}`;
}

/** Short weekday for a date, e.g. "Wed" / "qua." — the grid uppercases it. */
export function weekdayShort(date: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(localeFor(lang), { weekday: "short" })
    .format(date)
    .replace(/\.$/, "");
}

/** Full weekday name, used to label the per-weekday lunch popover. */
export function weekdayLong(date: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(localeFor(lang), { weekday: "long" }).format(date);
}

// --- Month calendar grid ----------------------------------------------------

export type MonthCell = {
  date: Date;
  inCurrentMonth: boolean;
  isWeekend: boolean;
};

/**
 * Build a 6-row × 7-column grid for a month (rows = weeks, columns = Mon–Sun).
 * Includes leading days from the previous month and trailing days from the next
 * month so the grid is always rectangular.
 */
export function getMonthGrid(year: number, monthIndex: number): MonthCell[] {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const firstWeekday = firstOfMonth.getDay(); // 0 = Sun, 1 = Mon, ...
  // We want Monday as the first column. Convert: Mon=0, Tue=1, ..., Sun=6.
  const leading = (firstWeekday + 6) % 7;
  const startDate = addDays(firstOfMonth, -leading);

  const cells: MonthCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = addDays(startDate, i);
    cells.push({
      date: d,
      inCurrentMonth: d.getMonth() === monthIndex,
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
    });
  }
  return cells;
}
