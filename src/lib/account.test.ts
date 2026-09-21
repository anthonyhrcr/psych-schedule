import { describe, it, expect } from "vitest";
import {
  createAccountKeys,
  unlockWithPassword,
  unlockWithRecoveryKey,
  rewrapWithPassword,
  rewrapWithNewRecoveryKey,
  encryptRecord,
  decryptRecord,
  generateRecoveryKey,
} from "./account";

/**
 * The failure cases matter more than the happy path here. Encryption that
 * silently accepts the wrong key, or a recovery key that keeps working after
 * rotation, would both look fine in ordinary use.
 */

const PASSWORD = "senha-do-consultorio";
const NOTE = { patient: "Ana Beatriz", text: "Relatou ansiedade no trabalho." };

describe("recovery keys", () => {
  it("is formatted for copying onto paper", () => {
    expect(generateRecoveryKey()).toMatch(/^[0-9A-Z]{5}(-[0-9A-Z]{5}){7}$/);
  });

  it("does not repeat groups", () => {
    // A generator that reuses bytes produces a key whose halves match, which
    // both wastes entropy and reads as a copying mistake. This is a real
    // defect that shipped once.
    for (let i = 0; i < 25; i++) {
      const groups = generateRecoveryKey().split("-");
      expect(new Set(groups).size).toBe(groups.length);
    }
  });

  it("draws unique keys", () => {
    const many = new Set(Array.from({ length: 300 }, generateRecoveryKey));
    expect(many.size).toBe(300);
  });
});

describe("record encryption", () => {
  it("round-trips a record", async () => {
    const { master } = await createAccountKeys(PASSWORD);
    const blob = await encryptRecord(master, NOTE);
    expect(await decryptRecord(master, blob)).toEqual(NOTE);
  });

  it("leaves no plaintext in the ciphertext", async () => {
    const { master } = await createAccountKeys(PASSWORD);
    const blob = await encryptRecord(master, NOTE);
    expect(blob).not.toContain("Ana");
    expect(blob).not.toContain("ansiedade");
  });

  it("uses a fresh iv, so identical records differ on the wire", async () => {
    const { master } = await createAccountKeys(PASSWORD);
    const a = await encryptRecord(master, NOTE);
    const b = await encryptRecord(master, NOTE);
    expect(a).not.toBe(b);
  });

  it("rejects tampered ciphertext instead of returning garbage", async () => {
    const { master } = await createAccountKeys(PASSWORD);
    const blob = await encryptRecord(master, NOTE);
    expect(await decryptRecord(master, blob.slice(0, -4) + "AAAA")).toBeNull();
  });

  it("rejects a malformed blob", async () => {
    const { master } = await createAccountKeys(PASSWORD);
    expect(await decryptRecord(master, "no-separator")).toBeNull();
    expect(await decryptRecord(master, "")).toBeNull();
  });

  it("cannot be read by another account's key", async () => {
    const a = await createAccountKeys(PASSWORD);
    const b = await createAccountKeys(PASSWORD);
    const blob = await encryptRecord(a.master, NOTE);
    expect(await decryptRecord(b.master, blob)).toBeNull();
  });
});

describe("unwrapping the master key", () => {
  it("opens with the right password", async () => {
    const { wrapped } = await createAccountKeys(PASSWORD);
    expect(await unlockWithPassword(wrapped, PASSWORD)).not.toBeNull();
  });

  it("refuses the wrong password", async () => {
    const { wrapped } = await createAccountKeys(PASSWORD);
    expect(await unlockWithPassword(wrapped, "senha-errada")).toBeNull();
  });

  it("opens with the recovery key", async () => {
    const { wrapped, recoveryKey } = await createAccountKeys(PASSWORD);
    expect(await unlockWithRecoveryKey(wrapped, recoveryKey)).not.toBeNull();
  });

  it("accepts a recovery key typed with different case or spacing", async () => {
    const { wrapped, recoveryKey } = await createAccountKeys(PASSWORD);
    const messy = ` ${recoveryKey.toLowerCase().replace(/-/g, " ")} `;
    expect(await unlockWithRecoveryKey(wrapped, messy)).not.toBeNull();
  });

  it("refuses a different recovery key", async () => {
    const { wrapped } = await createAccountKeys(PASSWORD);
    expect(await unlockWithRecoveryKey(wrapped, generateRecoveryKey())).toBeNull();
  });

  it("gives each account its own salts", async () => {
    const a = await createAccountKeys(PASSWORD);
    const b = await createAccountKeys(PASSWORD);
    expect(a.wrapped.passwordSalt).not.toBe(b.wrapped.passwordSalt);
    expect(a.wrapped.passwordWrapped).not.toBe(b.wrapped.passwordWrapped);
  });
});

describe("changing the password", () => {
  it("keeps records readable without re-encrypting them", async () => {
    const { master, wrapped } = await createAccountKeys(PASSWORD);
    const blob = await encryptRecord(master, NOTE);

    const rewrapped = await rewrapWithPassword(wrapped, master, "nova-senha");
    const reopened = await unlockWithPassword(rewrapped, "nova-senha");

    expect(reopened).not.toBeNull();
    expect(await decryptRecord(reopened!, blob)).toEqual(NOTE);
  });

  it("stops the old password working", async () => {
    const { master, wrapped } = await createAccountKeys(PASSWORD);
    const rewrapped = await rewrapWithPassword(wrapped, master, "nova-senha");
    expect(await unlockWithPassword(rewrapped, PASSWORD)).toBeNull();
  });

  it("leaves the recovery key working", async () => {
    const { master, wrapped, recoveryKey } = await createAccountKeys(PASSWORD);
    const rewrapped = await rewrapWithPassword(wrapped, master, "nova-senha");
    expect(await unlockWithRecoveryKey(rewrapped, recoveryKey)).not.toBeNull();
  });
});

describe("rotating the recovery key", () => {
  it("invalidates the old key and honours the new one", async () => {
    const first = await createAccountKeys(PASSWORD);
    const rotated = await rewrapWithNewRecoveryKey(first.wrapped, first.master);

    expect(await unlockWithRecoveryKey(rotated.wrapped, rotated.recoveryKey)).not.toBeNull();
    expect(await unlockWithRecoveryKey(rotated.wrapped, first.recoveryKey)).toBeNull();
  });

  it("still opens with the password afterwards", async () => {
    const first = await createAccountKeys(PASSWORD);
    const rotated = await rewrapWithNewRecoveryKey(first.wrapped, first.master);
    expect(await unlockWithPassword(rotated.wrapped, PASSWORD)).not.toBeNull();
  });
});
