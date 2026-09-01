import {
  dayKey,
  weekKey,
  legacyWeekKey,
  legacyDayIndex,
  migrateLegacySlotIndex,
  getMondayOf,
  fromISODate,
  toISODate,
  DaySlots,
  WeekPayload,
  LANG_STORAGE_KEY,
  LUNCH_CONFIG_KEY,
  LEGACY_LUNCH_CONFIG_KEY,
  Lang,
  LunchConfigByWeekday,
  DEFAULT_LUNCH,
} from "./schedule";
import { Patient, PATIENTS_STORAGE_KEY } from "./patients";
import { EvolutionEntry, EVOLUTION_STORAGE_KEY } from "./evolution";

function safeRead(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Quota / private mode — silently ignore.
  }
}

function parseObject<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as T;
    }
  } catch {
    // Fall through.
  }
  return null;
}

/** Shift a v1 day's slot indices onto the current hour list. */
function migrateSlots(slots: DaySlots): DaySlots {
  const next: DaySlots = {};
  for (const [slotKey, value] of Object.entries(slots)) {
    next[migrateLegacySlotIndex(Number(slotKey))] = value;
  }
  return next;
}

/**
 * Pull one date's bookings out of the Mon–Fri week payloads that v2 and v1
 * stored. Weekends never existed in those formats, so they have nothing.
 */
function loadFromLegacyWeek(dateISO: string): DaySlots | null {
  const date = fromISODate(dateISO);
  const dayIndex = legacyDayIndex(date);
  if (dayIndex > 4) return null;

  const mondayISO = toISODate(getMondayOf(date));

  const v2 = parseObject<WeekPayload>(safeRead(weekKey(mondayISO)));
  if (v2) return v2[dayIndex] ?? {};

  const v1 = parseObject<WeekPayload>(safeRead(legacyWeekKey(mondayISO)));
  if (v1) return v1[dayIndex] ? migrateSlots(v1[dayIndex]) : {};

  return null;
}

/**
 * Read one date's bookings. Returns an empty object on miss or on corrupted
 * data so the app keeps working. Legacy week payloads are migrated on first
 * read and rewritten under the date key, so this runs once per date.
 */
export function loadDay(dateISO: string): DaySlots {
  const current = parseObject<DaySlots>(safeRead(dayKey(dateISO)));
  if (current) return current;

  const migrated = loadFromLegacyWeek(dateISO);
  if (migrated) {
    saveDay(dateISO, migrated);
    return migrated;
  }
  return {};
}

/** Always writes, even when empty, so a migration cannot re-fire and
    resurrect bookings the user has since cleared. */
export function saveDay(dateISO: string, slots: DaySlots): void {
  safeWrite(dayKey(dateISO), JSON.stringify(slots));
}

export function loadLanguage(): Lang {
  const raw = safeRead(LANG_STORAGE_KEY);
  if (raw === "en" || raw === "pt") return raw;
  if (typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("pt")) {
    return "pt";
  }
  return "en";
}

export function saveLanguage(lang: Lang): void {
  safeWrite(LANG_STORAGE_KEY, lang);
}

/**
 * Lunch used to be keyed by Mon–Fri column position; it is now keyed by
 * weekday (0 = Sunday). Columns 0–4 were Monday–Friday, i.e. weekdays 1–5.
 */
export function loadLunchConfig(): LunchConfigByWeekday {
  const current = parseObject<LunchConfigByWeekday>(safeRead(LUNCH_CONFIG_KEY));
  if (current) return current;

  const legacy = parseObject<LunchConfigByWeekday>(safeRead(LEGACY_LUNCH_CONFIG_KEY));
  if (legacy) {
    const migrated: LunchConfigByWeekday = {};
    for (const [columnKey, config] of Object.entries(legacy)) {
      const column = Number(columnKey);
      if (column >= 0 && column <= 4) migrated[column + 1] = config;
    }
    saveLunchConfig(migrated);
    return migrated;
  }
  return {};
}

export function saveLunchConfig(config: LunchConfigByWeekday): void {
  safeWrite(LUNCH_CONFIG_KEY, JSON.stringify(config));
}

/** Get the lunch config for a weekday, falling back to the default. */
export function getLunchForWeekday(
  weekday: number,
  config: LunchConfigByWeekday
): { startHour: number; endHour: number } {
  return config[weekday] ?? DEFAULT_LUNCH;
}

export function loadPatients(): Patient[] {
  const raw = safeRead(PATIENTS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as Patient[];
  } catch {
    // Fall through.
  }
  return [];
}

export function savePatients(patients: Patient[]): void {
  safeWrite(PATIENTS_STORAGE_KEY, JSON.stringify(patients));
}

export function loadEvolutionEntries(): EvolutionEntry[] {
  const raw = safeRead(EVOLUTION_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as EvolutionEntry[];
  } catch {
    // Fall through.
  }
  return [];
}

export function saveEvolutionEntries(entries: EvolutionEntry[]): void {
  safeWrite(EVOLUTION_STORAGE_KEY, JSON.stringify(entries));
}
