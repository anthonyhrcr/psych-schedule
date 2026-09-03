import {
  dayKey,
  weekKey,
  legacyWeekKey,
  legacyDayIndex,
  migrateLegacySlotIndex,
  getMondayOf,
  fromISODate,
  toISODate,
  addDays,
  DAY_KEY_PREFIX,
  WEEK_KEY_PREFIX,
  LEGACY_WEEK_KEY_PREFIX,
  DaySlots,
  SchedulePayload,
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

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function safeKeys(): string[] {
  try {
    return Object.keys(localStorage);
  } catch {
    return [];
  }
}
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

/**
 * Every day ever recorded, across all storage versions.
 *
 * Legacy week payloads only migrate when their date is visited, so a history
 * built from v3 keys alone would silently omit weeks the user never scrolled
 * back to. This folds those in too, without rewriting them — reading history
 * should not mutate storage.
 */
export function loadAllDays(): SchedulePayload {
  const days: SchedulePayload = {};

  for (const key of safeKeys()) {
    if (!key.startsWith(DAY_KEY_PREFIX)) continue;
    const iso = key.slice(DAY_KEY_PREFIX.length);
    if (!ISO_DATE.test(iso)) continue;
    const slots = parseObject<DaySlots>(safeRead(key));
    if (slots && Object.keys(slots).length > 0) days[iso] = slots;
  }

  const addLegacyWeek = (mondayISO: string, week: WeekPayload, shift: boolean) => {
    const monday = fromISODate(mondayISO);
    for (const [columnKey, slots] of Object.entries(week)) {
      const column = Number(columnKey);
      if (!Number.isInteger(column) || column < 0 || column > 4) continue;
      const iso = toISODate(addDays(monday, column));
      if (days[iso]) continue; // a migrated v3 day already won
      const resolved = shift ? migrateSlots(slots) : slots;
      if (Object.keys(resolved).length > 0) days[iso] = resolved;
    }
  };

  for (const key of safeKeys()) {
    if (key.startsWith(WEEK_KEY_PREFIX)) {
      const iso = key.slice(WEEK_KEY_PREFIX.length);
      if (!ISO_DATE.test(iso)) continue;
      const week = parseObject<WeekPayload>(safeRead(key));
      if (week) addLegacyWeek(iso, week, false);
    } else if (key.startsWith(LEGACY_WEEK_KEY_PREFIX)) {
      // This prefix also covers the patients/evolution/lunch keys, so the
      // suffix must actually look like a date before it is treated as a week.
      const iso = key.slice(LEGACY_WEEK_KEY_PREFIX.length);
      if (!ISO_DATE.test(iso)) continue;
      const week = parseObject<WeekPayload>(safeRead(key));
      if (week) addLegacyWeek(iso, week, true);
    }
  }

  return days;
}

// --- Backup ----------------------------------------------------------------

export type BackupBundle = {
  format: "psych-schedule-backup";
  version: 1;
  exportedAt: string;
  days: SchedulePayload;
  patients: Patient[];
  evolution: EvolutionEntry[];
  lunch: LunchConfigByWeekday;
};

export function buildBackup(): BackupBundle {
  return {
    format: "psych-schedule-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    days: loadAllDays(),
    patients: loadPatients(),
    evolution: loadEvolutionEntries(),
    lunch: loadLunchConfig(),
  };
}

export type RestoreResult = {
  days: number;
  sessions: number;
  patients: number;
  notes: number;
};

/** Reject anything that is not recognisably one of our backup files. */
export function parseBackup(raw: string): BackupBundle | null {
  const parsed = parseObject<Partial<BackupBundle>>(raw);
  if (!parsed) return null;
  if (parsed.format !== "psych-schedule-backup") return null;
  if (!parsed.days || typeof parsed.days !== "object") return null;
  return {
    format: "psych-schedule-backup",
    version: 1,
    exportedAt: typeof parsed.exportedAt === "string" ? parsed.exportedAt : "",
    days: parsed.days as SchedulePayload,
    patients: Array.isArray(parsed.patients) ? parsed.patients : [],
    evolution: Array.isArray(parsed.evolution) ? parsed.evolution : [],
    lunch: parsed.lunch && typeof parsed.lunch === "object" ? parsed.lunch : {},
  };
}

/**
 * Merge a backup into this device. Dates present in the file replace what is
 * held for those dates; dates absent from the file are left alone. Patients
 * and notes are unioned by id, so restoring twice is harmless.
 */
export function restoreBackup(bundle: BackupBundle): RestoreResult {
  let sessions = 0;
  let days = 0;
  for (const [iso, slots] of Object.entries(bundle.days)) {
    if (!ISO_DATE.test(iso) || !slots || typeof slots !== "object") continue;
    saveDay(iso, slots);
    days += 1;
    sessions += Object.keys(slots).length;
  }

  const existingPatients = loadPatients();
  const patientIds = new Set(existingPatients.map((p) => p.id));
  const addedPatients = bundle.patients.filter((p) => p && p.id && !patientIds.has(p.id));
  if (addedPatients.length > 0) {
    savePatients([...existingPatients, ...addedPatients]);
  }

  const existingNotes = loadEvolutionEntries();
  const noteIds = new Set(existingNotes.map((e) => e.id));
  const addedNotes = bundle.evolution.filter((e) => e && e.id && !noteIds.has(e.id));
  if (addedNotes.length > 0) {
    saveEvolutionEntries([...existingNotes, ...addedNotes]);
  }

  if (Object.keys(bundle.lunch).length > 0) {
    saveLunchConfig({ ...loadLunchConfig(), ...bundle.lunch });
  }

  return {
    days,
    sessions,
    patients: addedPatients.length,
    notes: addedNotes.length,
  };
}
