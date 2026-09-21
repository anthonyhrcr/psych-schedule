import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { freshVisit, openSection, goBack, book } from "./helpers";

/**
 * The two flows where a mistake costs the user their records rather than
 * merely annoying them: the backup that is the only copy outside the browser,
 * and the lock whose passcode cannot be reset.
 */

async function seedRecords(page: import("@playwright/test").Page) {
  await openSection(page, "agenda");
  await book(page, 0, "07:00", "Ana Beatriz");
  await book(page, 1, "08:00", "Rafael Moura");
  await goBack(page);
}

test.beforeEach(async ({ page }) => {
  await freshVisit(page);
});

test("downloads a backup and restores it onto an emptied device", async ({ page }) => {
  await seedRecords(page);
  await openSection(page, "history");

  const download = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /download a backup|baixar backup/i }).click(),
  ]).then(([d]) => d);

  const file = await download.path();
  const bundle = JSON.parse(await readFile(file, "utf8"));
  expect(bundle.format).toBe("psych-schedule-backup");
  expect(Object.keys(bundle.days)).toHaveLength(2);

  // Wipe the device entirely, as clearing site data would.
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await openSection(page, "history");
  await expect(page.locator(".history-session")).toHaveCount(0);

  await page.locator("input[type=file]").setInputFiles(file);
  await expect(page.locator(".notice-ok")).toBeVisible();
  await expect(page.locator(".history-session")).toHaveCount(2);
  await expect(page.locator(".history-session")).toContainText(["Ana Beatriz"]);
});

test("restoring the same file twice changes nothing", async ({ page }) => {
  // Someone anxious about their records will import the file again.
  await seedRecords(page);
  await openSection(page, "history");

  const download = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /download a backup|baixar backup/i }).click(),
  ]).then(([d]) => d);
  const file = await download.path();

  await page.locator("input[type=file]").setInputFiles(file);
  await expect(page.locator(".notice-ok")).toBeVisible();
  await page.locator("input[type=file]").setInputFiles(file);

  await expect(page.locator(".history-session")).toHaveCount(2);
  await expect(page.locator(".stat-value").first()).toHaveText("2");
});

test("rejects a file that is not one of ours", async ({ page }) => {
  await openSection(page, "history");
  await page.locator("input[type=file]").setInputFiles({
    name: "not-a-backup.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"something":"else"}'),
  });

  await expect(page.locator(".notice-error")).toBeVisible();
  await expect(page.locator(".history-session")).toHaveCount(0);
});

test("locks the diary behind a passcode and reopens it", async ({ page }) => {
  await seedRecords(page);
  await openSection(page, "history");

  await page.getByRole("button", { name: /set a passcode|definir uma senha/i }).click();
  await page.locator("#new-passcode").fill("consultorio2026");
  await page.locator("#confirm-passcode").fill("consultorio2026");

  // The lock cannot be armed until a backup is acknowledged, because a
  // forgotten passcode is unrecoverable.
  const turnOn = page.getByRole("button", { name: /turn on the lock|ativar o bloqueio/i });
  await expect(turnOn).toBeDisabled();
  await page.locator(".checkbox-row input").check();
  await expect(turnOn).toBeEnabled();
  await turnOn.click();

  await expect(page.getByRole("button", { name: /lock now|bloquear agora/i })).toBeVisible();

  // Nothing legible is left behind in storage.
  const stored = await page.evaluate(() =>
    Object.entries(localStorage).map(([k, v]) => `${k}=${v}`).join("|")
  );
  expect(stored).not.toContain("Ana Beatriz");

  await page.reload();
  await expect(page.locator(".lock-card")).toBeVisible();

  await page.locator("#passcode").fill("senha-errada");
  await page.getByRole("button", { name: /unlock|desbloquear/i }).click();
  await expect(page.locator(".notice-error")).toBeVisible();
  await expect(page.locator(".lock-card")).toBeVisible();

  await page.locator("#passcode").fill("consultorio2026");
  await page.getByRole("button", { name: /unlock|desbloquear/i }).click();

  await expect(page.locator(".home-index")).toBeVisible();
  await openSection(page, "history");
  await expect(page.locator(".history-session")).toHaveCount(2);
});

test("carries a recent edit through a lock and unlock", async ({ page }) => {
  // Covers the round trip, not the race beneath it. The debounced write is
  // only lost when the flush is dropped *and* the unlock happens immediately;
  // browser round-trips here leave enough time for it to land either way, so
  // this passes with the flush removed. The guard for that is the unit test
  // "persists edits made while unlocked", which reproduces the timing.
  await openSection(page, "history");
  await page.getByRole("button", { name: /set a passcode|definir uma senha/i }).click();
  await page.locator("#new-passcode").fill("consultorio2026");
  await page.locator("#confirm-passcode").fill("consultorio2026");
  await page.locator(".checkbox-row input").check();
  await page.getByRole("button", { name: /turn on the lock|ativar o bloqueio/i }).click();
  await goBack(page);

  await openSection(page, "agenda");
  await book(page, 2, "14:00", "Sofia Andrade");
  await goBack(page);

  await openSection(page, "history");
  await page.getByRole("button", { name: /lock now|bloquear agora/i }).click();
  await expect(page.locator(".lock-card")).toBeVisible();

  await page.locator("#passcode").fill("consultorio2026");
  await page.getByRole("button", { name: /unlock|desbloquear/i }).click();
  await openSection(page, "history");
  await expect(page.locator(".history-session")).toContainText(["Sofia Andrade"]);
});

test("removing the passcode leaves the records readable", async ({ page }) => {
  await seedRecords(page);
  await openSection(page, "history");
  await page.getByRole("button", { name: /set a passcode|definir uma senha/i }).click();
  await page.locator("#new-passcode").fill("consultorio2026");
  await page.locator("#confirm-passcode").fill("consultorio2026");
  await page.locator(".checkbox-row input").check();
  await page.getByRole("button", { name: /turn on the lock|ativar o bloqueio/i }).click();

  await page.getByRole("button", { name: /remove the passcode|remover a senha/i }).click();
  await expect(page.getByRole("button", { name: /set a passcode|definir uma senha/i })).toBeVisible();

  await page.reload();
  await expect(page.locator(".lock-card")).toHaveCount(0);
  await openSection(page, "history");
  await expect(page.locator(".history-session")).toHaveCount(2);
});
