import { describe, it, expect } from "vitest";
import { buildRecoveryFile, parseRecoveryFile, recoveryFileName } from "./recovery";
import { generateRecoveryKey, normaliseRecoveryKey, createAccountKeys, unlockWithRecoveryKey } from "./account";

describe("the recovery file", () => {
  it("comes back exactly as it went in", async () => {
    const key = generateRecoveryKey();
    expect(parseRecoveryFile(buildRecoveryFile(key))).toBe(key);
  });

  it("carries nothing that identifies the practice", () => {
    // If this file is ever found on a shared drive it should say nothing
    // about whose it is. On its own it opens nothing anyway.
    const parsed = JSON.parse(buildRecoveryFile(generateRecoveryKey()));
    expect(Object.keys(parsed).sort()).toEqual([
      "format",
      "issuedAt",
      "recoveryKey",
      "version",
    ]);
  });

  it("refuses a backup file handed over by mistake", () => {
    // The other JSON this app produces holds patient names in the clear.
    const backup = JSON.stringify({
      format: "psych-schedule-backup",
      version: 1,
      patients: [{ id: "p1", name: "Ana Beatriz" }],
    });
    expect(parseRecoveryFile(backup)).toBeNull();
  });

  it("refuses rubbish rather than throwing", () => {
    expect(parseRecoveryFile("not json at all")).toBeNull();
    expect(parseRecoveryFile("null")).toBeNull();
    expect(parseRecoveryFile(JSON.stringify({ format: "psych-schedule-recovery" }))).toBeNull();
  });

  it("names the file by the day it was issued", () => {
    expect(recoveryFileName(new Date("2026-10-06T12:00:00Z"))).toBe(
      "agenda-psi-recovery-2026-10-06.json"
    );
  });
});

describe("reading a key back however it was written", () => {
  it("undoes the confusions the alphabet was chosen to avoid", () => {
    // A zero read as the letter O used to fail, and looked exactly like a
    // lost key to the person typing it.
    expect(normaliseRecoveryKey("0OIL1")).toBe("00111");
  });

  it("leaves a freshly generated key untouched", async () => {
    // The wrap is built from the normalised key, so a change here could lock
    // existing accounts out. The alphabet has no O, I, L or U, so it cannot.
    const key = generateRecoveryKey();
    expect(normaliseRecoveryKey(key)).toBe(key.replace(/-/g, ""));
  });

  it("still opens an account created before this change", async () => {
    const created = await createAccountKeys("pw");
    const typedBack = created.recoveryKey.toLowerCase().replace(/-/g, " ");
    expect(await unlockWithRecoveryKey(created.wrapped, typedBack)).not.toBeNull();
  });
});
