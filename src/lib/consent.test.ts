import { describe, it, expect, beforeEach } from "vitest";
import { hasAccepted, acceptedAt, recordAcceptance, clearAcceptance, CONSENT_KEY } from "./consent";
import { enablePasscode, saveDay, loadDay, unlock, lock } from "./storage";

/**
 * The acceptance record has one job: to be there when asked, and to say which
 * version was agreed to. The failure that matters is losing it silently —
 * someone would be asked to accept again and nobody would know why.
 */

describe("recording acceptance", () => {
  beforeEach(() => {
    clearAcceptance();
  });

  it("remembers the version that was accepted", async () => {
    await recordAcceptance("2026-10-06");
    expect(hasAccepted("2026-10-06")).toBe(true);
    expect(acceptedAt()).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("does not count an older acceptance as the current one", async () => {
    // A document change bumps the version, and the question is asked again.
    await recordAcceptance("2026-01-01");
    expect(hasAccepted("2026-10-06")).toBe(false);
  });

  it("treats a damaged record as no acceptance rather than throwing", () => {
    localStorage.setItem(CONSENT_KEY, "{ this is not json");
    expect(hasAccepted("2026-10-06")).toBe(false);
  });

  it("survives turning on the passcode lock", async () => {
    // The lock sweeps away every other key under this prefix. If it took this
    // one too, every unlock would end at the consent screen.
    await recordAcceptance("2026-10-06");
    saveDay("2026-10-06", { 1: "Ana" });

    await enablePasscode("a-passcode");

    expect(hasAccepted("2026-10-06")).toBe(true);

    await lock();
    expect(await unlock("a-passcode")).toBe(true);
    expect(hasAccepted("2026-10-06")).toBe(true);
    expect(loadDay("2026-10-06")).toEqual({ 1: "Ana" });
  });
});
