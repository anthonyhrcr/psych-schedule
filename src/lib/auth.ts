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
  snapshotLocal,
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
      // A failed push must not poison the queue for later writes.
      .catch(() => undefined);
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

  const local: VaultData = snapshotLocal();
  const master = currentMasterKey();
  if (!master) return null;

  return pushEverything(supabase, master, auth.user.id, local);
}
