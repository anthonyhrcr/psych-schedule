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
import {
  VAULT_KEY,
  VaultData,
  deriveKey,
  encryptVault,
  decryptVault,
  parseVaultBlob,
  randomBytes,
  saltOf,
} from "./vault";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// --- Locked mode -----------------------------------------------------------
//
// With a passcode set, every accessor below reads and writes an in-memory
// mirror instead of localStorage, and that mirror is encrypted back to a
// single key after each change. Keeping the mirror synchronous is what lets
// the rest of the app stay unchanged — only unlocking is async.

type Session = { key: CryptoKey; salt: Uint8Array; data: VaultData };
let session: Session | null = null;

// --- Account mode ----------------------------------------------------------
//
// A signed-in account works the same way as the local vault — a synchronous
// in-memory mirror — except changes are encrypted and pushed to Supabase
// rather than written to localStorage. `pushed` holds the last state sent to
// the server so list writes can be diffed into per-row upserts and deletes.

type Account = {
  userId: string;
  master: CryptoKey;
  data: VaultData;
  pushed: { patients: Patient[]; evolution: EvolutionEntry[] };
};
let account: Account | null = null;

/** Set by the auth layer so storage can push without importing it. */
let pushHandler: ((change: PendingChange) => void) | null = null;

export type PendingChange =
  | { kind: "day"; dateISO: string; slots: DaySlots }
  | { kind: "patients"; next: Patient[]; previous: Patient[] }
  | { kind: "notes"; next: EvolutionEntry[]; previous: EvolutionEntry[] }
  | { kind: "settings"; lunch: LunchConfigByWeekday };

export function isSignedIn(): boolean {
  return account !== null;
}

export function currentUserId(): string | null {
  return account?.userId ?? null;
}

export function currentMasterKey(): CryptoKey | null {
  return account?.master ?? null;
}

export function installAccount(
  userId: string,
  master: CryptoKey,
  data: VaultData,
  onPush: (change: PendingChange) => void
): void {
  account = {
    userId,
    master,
    data,
    pushed: {
      patients: [...data.patients],
      evolution: [...data.evolution],
    },
  };
  pushHandler = onPush;
}

export function clearAccount(): void {
  account = null;
  pushHandler = null;
}

/** True when this browser holds an encrypted vault. */
export function hasPasscode(): boolean {
  return parseVaultBlob(safeRead(VAULT_KEY)) !== null;
}

export function isUnlocked(): boolean {
  return session !== null;
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;

async function persistNow(): Promise<void> {
  if (!session) return;
  const blob = await encryptVault(session.key, session.salt, session.data);
  safeWrite(VAULT_KEY, JSON.stringify(blob));
}

function schedulePersist(): void {
  if (!session) return;
  if (persistTimer !== null) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    void persistNow();
  }, 120);
}

// A tab can be closed between a change and its debounced write. visibilitychange
// fires while the page is still alive and is the more reliable of the two, so
// flush there as well as on pagehide rather than relying on the last moment.
if (typeof window !== "undefined") {
  const flushOnLeave = () => {
    if (persistTimer !== null) void flushVault();
  };
  window.addEventListener("pagehide", flushOnLeave);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushOnLeave();
  });
}

function emptyVault(): VaultData {
  return { days: {}, patients: [], evolution: [], lunch: {} };
}

/** Gather everything currently held in plaintext, for migration into a vault. */
function collectPlaintext(): VaultData {
  return {
    days: loadAllDays(),
    patients: loadPatients(),
    evolution: loadEvolutionEntries(),
    lunch: loadLunchConfig(),
  };
}

function clearPlaintextKeys(): void {
  for (const key of safeKeys()) {
    if (key === LANG_STORAGE_KEY || key === VAULT_KEY) continue;
    if (key.startsWith("psych-schedule:")) {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore.
      }
    }
  }
}

/** Turn the lock on: encrypt what is here, then remove the plaintext. */
export async function enablePasscode(passcode: string): Promise<void> {
  const salt = randomBytes(16);
  const key = await deriveKey(passcode, salt);
  const data = collectPlaintext();
  session = { key, salt, data };
  await persistNow();
  clearPlaintextKeys();
}

/** Wrong passcode returns false and leaves the app locked. */
export async function unlock(passcode: string): Promise<boolean> {
  const blob = parseVaultBlob(safeRead(VAULT_KEY));
  if (!blob) return false;
  const salt = saltOf(blob);
  const key = await deriveKey(passcode, salt);
  const data = await decryptVault(key, blob);
  if (!data) return false;
  session = {
    key,
    salt,
    data: { ...emptyVault(), ...data },
  };
  return true;
}

/**
 * Write any pending change immediately. Encryption is async, so a caller that
 * is about to drop the session — or the page — has to await this or the last
 * edit is lost between the debounce and the key going away.
 */
export async function flushVault(): Promise<void> {
  if (persistTimer !== null) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  await persistNow();
}

export async function lock(): Promise<void> {
  await flushVault();
  session = null;
}

/** Turn the lock off: write everything back as plaintext and drop the vault. */
export function disablePasscode(): void {
  if (!session) return;
  const data = session.data;
  session = null;
  for (const [iso, slots] of Object.entries(data.days)) saveDay(iso, slots);
  savePatients(data.patients);
  saveEvolutionEntries(data.evolution);
  saveLunchConfig(data.lunch);
  try {
    localStorage.removeItem(VAULT_KEY);
  } catch {
    // Ignore.
  }
}

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
  if (account) return account.data.days[dateISO] ?? {};
  if (session) return session.data.days[dateISO] ?? {};

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
  if (account) {
    account.data.days[dateISO] = slots;
    pushHandler?.({ kind: "day", dateISO, slots });
    return;
  }
  if (session) {
    session.data.days[dateISO] = slots;
    schedulePersist();
    return;
  }
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
  if (account) return account.data.lunch;
  if (session) return session.data.lunch;

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
  if (account) {
    account.data.lunch = config;
    pushHandler?.({ kind: "settings", lunch: config });
    return;
  }
  if (session) {
    session.data.lunch = config;
    schedulePersist();
    return;
  }
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
  if (account) return account.data.patients;
  if (session) return session.data.patients;

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
  if (account) {
    const previous = account.pushed.patients;
    account.data.patients = patients;
    account.pushed.patients = [...patients];
    pushHandler?.({ kind: "patients", next: patients, previous });
    return;
  }
  if (session) {
    session.data.patients = patients;
    schedulePersist();
    return;
  }
  safeWrite(PATIENTS_STORAGE_KEY, JSON.stringify(patients));
}

export function loadEvolutionEntries(): EvolutionEntry[] {
  if (account) return account.data.evolution;
  if (session) return session.data.evolution;

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
  if (account) {
    const previous = account.pushed.evolution;
    account.data.evolution = entries;
    account.pushed.evolution = [...entries];
    pushHandler?.({ kind: "notes", next: entries, previous });
    return;
  }
  if (session) {
    session.data.evolution = entries;
    schedulePersist();
    return;
  }
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
  if (account) return { ...account.data.days };
  if (session) return { ...session.data.days };
  return diskDays();
}

/** The day scan on its own, so device data can be read past an account. */
function diskDays(): SchedulePayload {
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

/**
 * What this browser holds, ignoring any signed-in account.
 *
 * The ordinary accessors answer from the account once one is active, which is
 * right everywhere else but useless for deciding whether there is local data
 * worth uploading. These deliberately look past it.
 */
export function readDeviceData(): VaultData {
  if (session) return session.data;
  return {
    days: diskDays(),
    patients: parseArray<Patient>(safeRead(PATIENTS_STORAGE_KEY)),
    evolution: parseArray<EvolutionEntry>(safeRead(EVOLUTION_STORAGE_KEY)),
    lunch: parseObject<LunchConfigByWeekday>(safeRead(LUNCH_CONFIG_KEY)) ?? {},
  };
}

/** How much is sitting on this device — used to offer a one-time upload. */
export function deviceDataCounts(): { sessions: number; patients: number; notes: number } {
  const data = readDeviceData();
  let sessions = 0;
  for (const slots of Object.values(data.days)) {
    sessions += Object.keys(slots).length;
  }
  return {
    sessions,
    patients: data.patients.length,
    notes: data.evolution.length,
  };
}

function parseArray<T>(raw: string | null): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as T[];
  } catch {
    // Fall through.
  }
  return [];
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
