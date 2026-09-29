import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createAccountKeys,
  unlockWithPassword,
  unlockWithRecoveryKey,
  WrappedKeys,
} from "./account";

/**
 * A password reset is the one flow that can strand an account: the server can
 * change a password but cannot decrypt anything, so the recovery key is the
 * only thing that carries the records across. These tests hold the order in
 * place — check the key first, change the password second — because reversing
 * it fails silently and only shows up when someone has already lost access.
 */

const h = vi.hoisted(() => ({ client: null as unknown }));

vi.mock("./supabase", () => ({
  getSupabase: () => h.client,
  isBackendConfigured: true,
}));

const { completePasswordReset, requestPasswordReset, changePassword } = await import("./auth");

type Call = { op: string; payload?: unknown };

function fakeSupabase(
  opts: { keyRow?: Record<string, string> | null; failKeyWrite?: boolean } = {}
) {
  const calls: Call[] = [];
  const state = { keyRow: opts.keyRow ?? null };

  const client = {
    auth: {
      getUser: () => Promise.resolve({ data: { user: { id: "u1" } } }),
      updateUser: (attrs: { password?: string }) => {
        calls.push({ op: "updateUser", payload: attrs.password });
        return Promise.resolve({ error: null });
      },
      resetPasswordForEmail: (email: string, o?: { redirectTo?: string }) => {
        calls.push({ op: "resetPasswordForEmail", payload: { email, redirectTo: o?.redirectTo } });
        return Promise.resolve({ error: null });
      },
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
    from(table: string) {
      return {
        select() {
          const s = {
            eq: () => s,
            maybeSingle: () =>
              Promise.resolve({ data: table === "account_keys" ? state.keyRow : null }),
            then: (resolve: (v: unknown) => void) =>
              Promise.resolve({ data: [] }).then(resolve),
          };
          return s;
        },
        upsert(payload: Record<string, string>) {
          calls.push({ op: `upsert:${table}`, payload });
          if (table === "account_keys") {
            if (opts.failKeyWrite) return Promise.resolve({ error: { message: "write refused" } });
            state.keyRow = payload;
          }
          return Promise.resolve({ error: null });
        },
      };
    },
  } as unknown as SupabaseClient;

  h.client = client;
  return { client, calls, state };
}

function toRow(userId: string, keys: WrappedKeys): Record<string, string> {
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

function toKeys(row: Record<string, string>): WrappedKeys {
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

describe("completing a password reset", () => {
  it("leaves the password alone when the recovery key is wrong", async () => {
    // The dangerous order: changing the password first would sign the user in
    // to records their new password can no longer open, with the old password
    // gone too. Nothing about the account may move until the key checks out.
    const created = await createAccountKeys("old-password");
    const { calls } = fakeSupabase({ keyRow: toRow("u1", created.wrapped) });

    const result = await completePasswordReset("ZZZZZ-ZZZZZ-ZZZZZ-ZZZZZ", "a-new-password");

    expect(result.status).toBe("bad-key");
    expect(calls.some((c) => c.op === "updateUser")).toBe(false);
    expect(calls.some((c) => c.op === "upsert:account_keys")).toBe(false);
  });

  it("sets the new password and re-wraps the master key under it", async () => {
    const created = await createAccountKeys("old-password");
    const { calls, state } = fakeSupabase({ keyRow: toRow("u1", created.wrapped) });

    const result = await completePasswordReset(created.recoveryKey, "a-new-password");

    expect(result.status).toBe("ok");
    expect(calls).toContainEqual({ op: "updateUser", payload: "a-new-password" });

    // The stored wrap must follow the password, or the next sign-in lands
    // straight back on the recovery screen.
    const stored = toKeys(state.keyRow as Record<string, string>);
    expect(await unlockWithPassword(stored, "a-new-password")).not.toBeNull();
    expect(await unlockWithPassword(stored, "old-password")).toBeNull();
  });

  it("reports a refused key write instead of reporting success", async () => {
    // Success here would tell the user their new password works while the
    // server still holds the wrap made from the old one.
    const created = await createAccountKeys("old-password");
    fakeSupabase({ keyRow: toRow("u1", created.wrapped), failKeyWrite: true });

    const result = await completePasswordReset(created.recoveryKey, "a-new-password");

    expect(result.status).toBe("failed");
  });

  it("sets the password for an invited user who has no keys yet", async () => {
    const { calls } = fakeSupabase({ keyRow: null });

    const result = await completePasswordReset("", "a-new-password");

    expect(result.status).toBe("ok");
    expect(calls).toContainEqual({ op: "updateUser", payload: "a-new-password" });
  });
});

describe("requesting a reset link", () => {
  it("sends the user back to this page, without the consumed hash", async () => {
    const { calls } = fakeSupabase();

    const ok = await requestPasswordReset("someone@example.com");

    expect(ok).toBe(true);
    const sent = calls.find((c) => c.op === "resetPasswordForEmail");
    const redirectTo = (sent?.payload as { redirectTo: string }).redirectTo;
    expect(redirectTo).not.toContain("#");
    expect(redirectTo).toContain("http");
  });
});

describe("changing the password from inside the diary", () => {
  it("changes nothing when the current password is wrong", async () => {
    const created = await createAccountKeys("old-password");
    const { calls } = fakeSupabase({ keyRow: toRow("u1", created.wrapped) });

    const result = await changePassword("not-the-password", "a-new-password");

    expect(result.status).toBe("bad-password");
    expect(calls.some((c) => c.op === "updateUser")).toBe(false);
    expect(calls.some((c) => c.op === "upsert:account_keys")).toBe(false);
  });

  it("re-wraps the key without disturbing the recovery key", async () => {
    // The panel tells the user their recovery key keeps working. If the
    // recovery wrap were rebuilt here, the key on their paper would be dead
    // and they would not find out until the day they needed it.
    const created = await createAccountKeys("old-password");
    const { state } = fakeSupabase({ keyRow: toRow("u1", created.wrapped) });

    const result = await changePassword("old-password", "a-new-password");

    expect(result.status).toBe("ok");
    const stored = toKeys(state.keyRow as Record<string, string>);
    expect(await unlockWithPassword(stored, "a-new-password")).not.toBeNull();
    expect(await unlockWithPassword(stored, "old-password")).toBeNull();
    expect(await unlockWithRecoveryKey(stored, created.recoveryKey)).not.toBeNull();
  });

  it("reports a refused key write instead of reporting success", async () => {
    const created = await createAccountKeys("old-password");
    fakeSupabase({ keyRow: toRow("u1", created.wrapped), failKeyWrite: true });

    const result = await changePassword("old-password", "a-new-password");

    expect(result.status).toBe("failed");
  });
});
