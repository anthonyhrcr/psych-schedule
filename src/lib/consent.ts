import { getSupabase } from "./supabase";

/**
 * Proof that a professional accepted a specific version of the documents.
 *
 * Two places, for two different reasons. The device remembers so the question
 * is asked once rather than on every visit; the server keeps the record so
 * that "which text did they agree to, and when" has an answer later. The
 * server copy is not encrypted — evidence nobody can read is not evidence —
 * and it holds nothing clinical.
 *
 * The check that gates the app is the local one, and deliberately so: it is
 * synchronous, it works with no backend at all, and the worst case is a
 * returning professional ticking a box once more on a new device.
 */

/**
 * Exported because the passcode lock sweeps away every other key under this
 * prefix. This one has to survive: it records an acceptance, holds nothing
 * clinical, and asking again after every unlock would be noise.
 */
export const CONSENT_KEY = "psych-schedule:v1:consent";

type ConsentRecord = {
  version: string;
  acceptedAt: string;
};

function read(): ConsentRecord | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentRecord>;
    if (typeof parsed.version !== "string") return null;
    return {
      version: parsed.version,
      acceptedAt: typeof parsed.acceptedAt === "string" ? parsed.acceptedAt : "",
    };
  } catch {
    return null;
  }
}

export function hasAccepted(version: string): boolean {
  return read()?.version === version;
}

export function acceptedAt(): string | null {
  return read()?.acceptedAt || null;
}

/**
 * Records the acceptance on the device, then on the server when there is one.
 *
 * The device write happens first and is what the app trusts. A server that is
 * unreachable, or a `consents` table that has not been created yet, must not
 * stop someone from using the diary they just agreed to terms for.
 */
export async function recordAcceptance(version: string): Promise<void> {
  const record: ConsentRecord = { version, acceptedAt: new Date().toISOString() };
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(record));
  } catch {
    // A browser refusing storage is not a reason to block the app.
  }

  const supabase = getSupabase();
  if (!supabase) return;
  try {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await supabase
      .from("consents")
      .upsert(
        { user_id: data.user.id, document_version: version },
        { onConflict: "user_id,document_version", ignoreDuplicates: true }
      );
  } catch {
    // Same reasoning: the audit copy is valuable, not load-bearing.
  }
}

/** Used by tests and by sign-out, so one account's acceptance is not another's. */
export function clearAcceptance(): void {
  try {
    localStorage.removeItem(CONSENT_KEY);
  } catch {
    // Nothing to do.
  }
}
