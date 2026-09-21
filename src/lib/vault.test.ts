import { describe, it, expect } from "vitest";
import {
  deriveKey,
  encryptVault,
  decryptVault,
  parseVaultBlob,
  randomBytes,
  saltOf,
  VAULT_KEY,
  VaultData,
} from "./vault";
import {
  enablePasscode,
  unlock,
  lock,
  disablePasscode,
  hasPasscode,
  isUnlocked,
  saveDay,
  loadDay,
  savePatients,
  loadPatients,
  loadAllDays,
} from "./storage";

const data: VaultData = {
  days: { "2026-03-04": { 1: "Ana Beatriz" } },
  patients: [{ id: "p1", name: "Ana Beatriz", createdAt: "2026-01-01T00:00:00Z" }],
  evolution: [],
  lunch: { 3: { startHour: 15, endHour: 16 } },
};

describe("vault encryption", () => {
  it("round-trips through a passcode", async () => {
    const salt = randomBytes(16);
    const key = await deriveKey("umasenha", salt);
    const blob = await encryptVault(key, salt, data);
    expect(await decryptVault(key, blob)).toEqual(data);
  });

  it("hides the records in the blob", async () => {
    const salt = randomBytes(16);
    const key = await deriveKey("umasenha", salt);
    const blob = await encryptVault(key, salt, data);
    expect(JSON.stringify(blob)).not.toContain("Ana Beatriz");
  });

  it("refuses a key derived from the wrong passcode", async () => {
    const salt = randomBytes(16);
    const blob = await encryptVault(await deriveKey("certa", salt), salt, data);
    expect(await decryptVault(await deriveKey("errada", salt), blob)).toBeNull();
  });

  it("reuses the stored salt, so the same passcode reopens it", async () => {
    const salt = randomBytes(16);
    const blob = await encryptVault(await deriveKey("umasenha", salt), salt, data);
    const reopened = await deriveKey("umasenha", saltOf(blob));
    expect(await decryptVault(reopened, blob)).toEqual(data);
  });

  it("rejects anything that is not one of our blobs", () => {
    expect(parseVaultBlob(null)).toBeNull();
    expect(parseVaultBlob("not json")).toBeNull();
    expect(parseVaultBlob('{"v":2,"salt":"a","iv":"b","data":"c"}')).toBeNull();
    expect(parseVaultBlob('{"v":1,"salt":"a"}')).toBeNull();
  });
});

describe("turning the passcode lock on", () => {
  it("moves existing records into the vault and clears the plaintext", async () => {
    saveDay("2026-03-04", { 1: "Ana Beatriz" });
    savePatients([{ id: "p1", name: "Ana Beatriz", createdAt: "2026-01-01T00:00:00Z" }]);

    await enablePasscode("minhasenha");

    const stored = Object.entries(localStorage).map(([k, v]) => `${k}=${v}`).join("|");
    expect(stored).not.toContain("Ana Beatriz");
    expect(hasPasscode()).toBe(true);
    // Still readable in the session that locked it.
    expect(loadDay("2026-03-04")).toEqual({ 1: "Ana Beatriz" });
  });

  it("keeps the language preference readable", async () => {
    localStorage.setItem("psych-schedule:lang", "pt");
    saveDay("2026-03-04", { 1: "Ana" });
    await enablePasscode("minhasenha");
    expect(localStorage.getItem("psych-schedule:lang")).toBe("pt");
  });
});

describe("unlocking", () => {
  it("restores the records with the right passcode", async () => {
    saveDay("2026-03-04", { 1: "Ana Beatriz" });
    await enablePasscode("minhasenha");
    await lock();
    expect(isUnlocked()).toBe(false);

    expect(await unlock("minhasenha")).toBe(true);
    expect(loadDay("2026-03-04")).toEqual({ 1: "Ana Beatriz" });
  });

  it("refuses the wrong passcode and stays locked", async () => {
    saveDay("2026-03-04", { 1: "Ana" });
    await enablePasscode("minhasenha");
    await lock();

    expect(await unlock("senha-errada")).toBe(false);
    expect(isUnlocked()).toBe(false);
  });

  it("fails cleanly when there is no vault", async () => {
    expect(await unlock("qualquer")).toBe(false);
  });

  it("persists edits made while unlocked", async () => {
    await enablePasscode("minhasenha");
    saveDay("2026-03-05", { 2: "Rafael" });
    // The debounced write is flushed by lock().
    await lock();
    await unlock("minhasenha");
    expect(loadDay("2026-03-05")).toEqual({ 2: "Rafael" });
  });
});

describe("removing the passcode", () => {
  it("writes everything back in plain form and drops the vault", async () => {
    saveDay("2026-03-04", { 1: "Ana Beatriz" });
    savePatients([{ id: "p1", name: "Ana Beatriz", createdAt: "2026-01-01T00:00:00Z" }]);
    await enablePasscode("minhasenha");

    disablePasscode();

    expect(localStorage.getItem(VAULT_KEY)).toBeNull();
    expect(hasPasscode()).toBe(false);
    expect(loadDay("2026-03-04")).toEqual({ 1: "Ana Beatriz" });
    expect(loadPatients()).toHaveLength(1);
    expect(Object.keys(loadAllDays())).toEqual(["2026-03-04"]);
  });

  it("loses nothing across a lock, unlock and removal cycle", async () => {
    saveDay("2026-03-04", { 1: "Ana" });
    saveDay("2026-03-05", { 2: "Rafael" });
    await enablePasscode("minhasenha");
    await lock();
    await unlock("minhasenha");
    disablePasscode();

    expect(loadDay("2026-03-04")).toEqual({ 1: "Ana" });
    expect(loadDay("2026-03-05")).toEqual({ 2: "Rafael" });
  });
});
