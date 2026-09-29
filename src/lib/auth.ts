import { getSupabase, AccountKeysRow } from "./supabase";
import {
  WrappedKeys,
  createAccountKeys,
  unlockWithPassword,
  unlockWithRecoveryKey,
  rewrapWithPassword,
} from "./account";
import { pullAll, pushDay, pushPatients, pushNotes, pushSettings, pushEverything } from "./sync";
import {
  installAccount,
  clearAccount,
  readDeviceData,
  currentMasterKey,
  isSignedIn,
  PendingChange,
} from "./storage";
import { VaultData } from "./vault";

/**
 * Ties Supabase authentication to the encryption keys.
 *
 * Signing in proves who you are to the server; it does not by itself make
 * your records readable. The master key still has to be unwrapped locally,
 * which is what keeps the data unreadable to the server even while you are
 * logged in.
 *
 * Note on the password: the same one authenticates and unwraps the key. This
 * protects against the realistic threat — a database dump or someone with
 * database access — but not against a compromised auth endpoint capturing the
 * password in flight. Separating the two would mean two secrets to remember.
 */

/** Last failure from a background push, so sync problems are not invisible. */
let lastSyncError: string | null = null;

export function getLastSyncError(): string | null {
  return lastSyncError;
}

export type SignInOutcome =
  | { status: "ok" }
  | { status: "needs-key-setup" }
  | { status: "needs-recovery" }
  | { status: "failed"; message: string };

function rowToWrapped(row: AccountKeysRow): WrappedKeys {
  return {
    v: 1,
    passwordSalt: row.password_salt,
    passwordWrapped: row.password_wrapped,
    passwordIv: row.password_iv,
    recoverySalt: row.recovery_salt,
    recoveryWrapped: row.recovery_wrapped,
    recoveryIv: row.recovery_iv,
  };
}

function wrappedToRow(userId: string, keys: WrappedKeys) {
  return {
    user_id: userId,
    password_salt: keys.passwordSalt,
    password_wrapped: keys.passwordWrapped,
    password_iv: keys.passwordIv,
    recovery_salt: keys.recoverySalt,
    recovery_wrapped: keys.recoveryWrapped,
    recovery_iv: keys.recoveryIv,
  };
}

/** Writes queue behind one another so rapid edits cannot race each other. */
function makePushHandler(userId: string, master: CryptoKey) {
  let queue: Promise<unknown> = Promise.resolve();
  return (change: PendingChange) => {
    const supabase = getSupabase();
    if (!supabase) return;
    queue = queue
      .then(() => {
        switch (change.kind) {
          case "day":
            return pushDay(supabase, master, userId, change.dateISO, change.slots);
          case "patients":
            return pushPatients(supabase, master, userId, change.next, change.previous);
          case "notes":
            return pushNotes(supabase, master, userId, change.next, change.previous);
          case "settings":
            return pushSettings(supabase, master, userId, change.lunch);
        }
      })
      // A failed push must not poison the queue for later writes, but it is
      // recorded rather than discarded so the failure can be surfaced.
      .catch((e) => {
        lastSyncError = e instanceof Error ? e.message : String(e);
      });
  };
}

async function activate(userId: string, master: CryptoKey): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("No backend configured");
  const { data } = await pullAll(supabase, master, userId);
  installAccount(userId, master, data, makePushHandler(userId, master));
}

export async function signIn(email: string, password: string): Promise<SignInOutcome> {
  const supabase = getSupabase();
  if (!supabase) return { status: "failed", message: "no-backend" };

  const { data: auth, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !auth.user) {
    return { status: "failed", message: error?.message ?? "sign-in failed" };
  }

  const userId = auth.user.id;
  const { data: row } = await supabase
    .from("account_keys")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  // A user created from the dashboard has no key material yet.
  if (!row) return { status: "needs-key-setup" };

  const master = await unlockWithPassword(rowToWrapped(row as AccountKeysRow), password);
  // Signed in, but the password no longer matches the wrapped key — which is
  // what a password reset looks like. The recovery key is the way back.
  if (!master) return { status: "needs-recovery" };

  await activate(userId, master);
  return { status: "ok" };
}

/**
 * First run for a freshly invited user: mint the keys, upload the wrapped
 * copies, and hand back the recovery key to be shown exactly once.
 */
export async function setUpKeys(password: string): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const created = await createAccountKeys(password);
  const { error } = await supabase
    .from("account_keys")
    .upsert(wrappedToRow(auth.user.id, created.wrapped), { onConflict: "user_id" });
  if (error) return null;

  await activate(auth.user.id, created.master);
  return created.recoveryKey;
}

/** Recover after a password reset: unwrap with the recovery key, re-wrap with the new password. */
export async function recoverWithKey(
  recoveryKey: string,
  newPassword: string
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return false;

  const { data: row } = await supabase
    .from("account_keys")
    .select("*")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (!row) return false;

  const keys = rowToWrapped(row as AccountKeysRow);
  const master = await unlockWithRecoveryKey(keys, recoveryKey);
  if (!master) return false;

  const rewrapped = await rewrapWithPassword(keys, master, newPassword);
  await supabase
    .from("account_keys")
    .upsert(wrappedToRow(auth.user.id, rewrapped), { onConflict: "user_id" });

  await activate(auth.user.id, master);
  return true;
}

/**
 * Password reset, in an app whose server cannot decrypt anything.
 *
 * The email proves who you are to Supabase, which is enough to change the
 * sign-in password — and not enough to read a single record. The master key
 * is wrapped under the old password and nothing on the server can unwrap it.
 * The recovery key is the second wrap, and the only way back to the records.
 */

// Read at module load. The Supabase client consumes the link and strips the
// hash from the URL as soon as it is created, so a later read finds nothing.
const openedFromRecoveryLink =
  typeof window !== "undefined" && /[#&]type=recovery/.test(window.location.hash);

export function isPasswordRecoveryLink(): boolean {
  return openedFromRecoveryLink;
}

/**
 * The PKCE variant of the link carries no `type=recovery` in the hash, so the
 * event is the only signal. Returns an unsubscribe function.
 */
export function onPasswordRecovery(cb: () => void): () => void {
  const supabase = getSupabase();
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") cb();
  });
  return () => data.subscription.unsubscribe();
}

/**
 * Sends the reset link. Success here says only that the request was accepted:
 * an address without an account gets the same answer, so the form cannot be
 * used to find out who holds one.
 */
export async function requestPasswordReset(email: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  // No routes in this app, so the link comes back to the page it left from.
  const redirectTo = window.location.href.split("#")[0];
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  return !error;
}

export type PasswordResetOutcome =
  | { status: "ok" }
  | { status: "bad-key" }
  | { status: "no-session" }
  | { status: "failed"; message: string };

/**
 * Finish a reset: check the recovery key, set the new password, re-wrap.
 *
 * The order is the whole point. Changing the password first and checking the
 * key afterwards would, on a mistyped key, leave the account stranded —
 * signed in, records unreadable, and the old password no longer a way back.
 */
export async function completePasswordReset(
  recoveryKey: string,
  newPassword: string
): Promise<PasswordResetOutcome> {
  const supabase = getSupabase();
  if (!supabase) return { status: "failed", message: "no-backend" };
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { status: "no-session" };

  const { data: row } = await supabase
    .from("account_keys")
    .select("*")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  // Invited from the dashboard but never set up: there is no master key to
  // rescue, so the password is all there is to set. Keys are minted at the
  // next sign-in, as they would have been anyway.
  if (!row) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return error ? { status: "failed", message: error.message } : { status: "ok" };
  }

  const keys = rowToWrapped(row as AccountKeysRow);
  const master = await unlockWithRecoveryKey(keys, recoveryKey);
  if (!master) return { status: "bad-key" };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { status: "failed", message: error.message };

  const rewrapped = await rewrapWithPassword(keys, master, newPassword);
  // A failed write here would leave the password changed and the wrapped key
  // still on the old one — the exact state the recovery key had just fixed.
  const { error: keyError } = await supabase
    .from("account_keys")
    .upsert(wrappedToRow(auth.user.id, rewrapped), { onConflict: "user_id" });
  if (keyError) return { status: "failed", message: keyError.message };

  await activate(auth.user.id, master);
  return { status: "ok" };
}

/** Restore a session left from a previous visit, if the key can be unwrapped. */
export async function resumeSession(): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session);
}

export async function signOut(): Promise<void> {
  const supabase = getSupabase();
  clearAccount();
  if (supabase) await supabase.auth.signOut();
}

/** Copy this device's local records into the signed-in account. */
export async function uploadLocalData(): Promise<{
  days: number;
  patients: number;
  notes: number;
} | null> {
  const supabase = getSupabase();
  if (!supabase || !isSignedIn()) return null;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  // Deliberately reads the device rather than the account, which by this
  // point is already installed and would otherwise echo itself back.
  const local: VaultData = readDeviceData();
  const master = currentMasterKey();
  if (!master) return null;

  // A partial upload must not report success: the user would be told their
  // records are safe in the account while some silently never arrived.
  let result;
  try {
    result = await pushEverything(supabase, master, auth.user.id, local);
  } catch (e) {
    lastSyncError = e instanceof Error ? e.message : String(e);
    return null;
  }
  // Pull the merged state back so the app shows the uploaded records at once.
  await activate(auth.user.id, master);
  return result;
}
