/**
 * The recovery key as a file rather than a transcription.
 *
 * The key itself is unchanged — it is still the second wrap of the master
 * key, and the server still never sees it. What changes is how it reaches the
 * person: copying forty characters off a screen onto paper, and typing them
 * back months later, is where this was failing. A file goes into a password
 * manager or a drive and comes back exactly as it left.
 *
 * The file is deliberately small and dull: no email, no account id, nothing
 * that identifies a practice or a patient if it is ever found. On its own it
 * opens nothing — it is useless without the account's own encrypted rows.
 */

export const RECOVERY_FORMAT = "psych-schedule-recovery";

export type RecoveryFile = {
  format: typeof RECOVERY_FORMAT;
  version: 1;
  issuedAt: string;
  recoveryKey: string;
};

export function buildRecoveryFile(recoveryKey: string, now = new Date()): string {
  const file: RecoveryFile = {
    format: RECOVERY_FORMAT,
    version: 1,
    issuedAt: now.toISOString(),
    recoveryKey,
  };
  return JSON.stringify(file, null, 2);
}

export function recoveryFileName(now = new Date()): string {
  return `agenda-psi-recovery-${now.toISOString().slice(0, 10)}.json`;
}

/**
 * Returns the key, or null for anything that is not one of our files.
 *
 * A backup file is the likeliest thing to be handed over by mistake — it is
 * the other JSON the app produces — and it holds patient names in the clear,
 * so being strict here keeps a misclick from sending one anywhere.
 */
export function parseRecoveryFile(raw: string): string | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const file = parsed as Partial<RecoveryFile>;
  if (file.format !== RECOVERY_FORMAT) return null;
  if (typeof file.recoveryKey !== "string" || file.recoveryKey.trim() === "") return null;
  return file.recoveryKey;
}
