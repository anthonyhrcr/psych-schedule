import { test, expect } from "@playwright/test";
import { freshVisit, openSection, book, cell, lunchHours } from "./helpers";

test.beforeEach(async ({ page }) => {
  await freshVisit(page);
  await openSection(page, "agenda");
});

test("opens straight into the diary with no sign-in", async ({ page }) => {
  // Confirms these flows really are running local-only; if the backend were
  // configured the gate would stand in front of everything below.
  await expect(page.locator("#email")).toHaveCount(0);
  await expect(page.locator(".schedule-grid")).toBeVisible();
});

test("shows five days with the selected date in the middle", async ({ page }) => {
  const headers = page.locator(".day-header-date");
  await expect(headers).toHaveCount(5);
  // Today is the third of the five, which is what lets weekends be reached.
  await expect(page.locator(".day-header.today")).toHaveCount(1);
  await expect(page.locator(".day-header").nth(2)).toHaveClass(/today/);
});

test("runs from 06:00 to 21:00 with no missing hour", async ({ page }) => {
  const times = await page.locator(".slot-row .time-col").allTextContents();
  expect(times).toHaveLength(16);
  expect(times[0]).toBe("06:00");
  expect(times.at(-1)).toBe("21:00");
  expect(times).toContain("12:00");
});

test("books a patient and keeps it across a reload", async ({ page }) => {
  await book(page, 2, "09:00", "Ana Beatriz");

  await page.reload();
  await openSection(page, "agenda");
  await expect(cell(page, 2, "09:00")).toContainText("Ana Beatriz");
});

test("clears a booking by emptying the name", async ({ page }) => {
  await book(page, 1, "10:00", "Rafael Moura");

  await cell(page, 1, "10:00").click();
  const input = page.locator(".cell-input");
  await input.fill("");
  await input.press("Enter");

  await expect(cell(page, 1, "10:00")).toHaveAttribute("aria-label", /Available/);
});

test("fills a run of hours from one name with shift+click", async ({ page }) => {
  await cell(page, 0, "07:00").click({ modifiers: ["Shift"] });
  await cell(page, 0, "10:00").click({ modifiers: ["Shift"] });

  const prompt = page.locator(".multi-fill-prompt");
  await expect(prompt).toBeVisible();
  await expect(prompt).toContainText("4");

  await prompt.locator(".multi-fill-input").fill("Helena Costa");
  await prompt.locator(".multi-fill-input").press("Enter");

  for (const time of ["07:00", "08:00", "09:00", "10:00"]) {
    await expect(cell(page, 0, time)).toContainText("Helena Costa");
  }
  // The hour outside the range must not be swept up.
  await expect(cell(page, 0, "11:00")).toHaveAttribute("aria-label", /Available/);
});

test("abandons a multi-fill selection on Escape", async ({ page }) => {
  await cell(page, 0, "07:00").click({ modifiers: ["Shift"] });
  await expect(page.locator(".multi-fill-prompt")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.locator(".multi-fill-prompt")).toHaveCount(0);
  await expect(cell(page, 0, "07:00")).toHaveAttribute("aria-label", /Available/);
});

test("defaults lunch to noon on every day", async ({ page }) => {
  expect(await lunchHours(page)).toEqual(["12:00", "12:00", "12:00", "12:00", "12:00"]);
});

test("moves one weekday's lunch without touching the others", async ({ page }) => {
  await page.locator(".lunch-handle").nth(1).click();
  const popover = page.locator(".lunch-popover");
  await expect(popover).toBeVisible();

  await popover.locator("input[type=time]").first().fill("15:00");
  await popover.locator("input[type=time]").nth(1).fill("17:00");
  await popover.getByRole("button", { name: /save|salvar/i }).click();

  // That column moves to 15:00 and 16:00; the rest stay at noon.
  const hours = await lunchHours(page);
  expect(hours.filter((h) => h === "12:00")).toHaveLength(4);
  expect(hours.filter((h) => h === "15:00")).toHaveLength(1);
  expect(hours.filter((h) => h === "16:00")).toHaveLength(1);

  // And the hour it vacated becomes bookable again.
  await expect(cell(page, 1, "12:00")).toHaveAttribute("aria-label", /Available/);
});

test("allows booking over the lunch break", async ({ page }) => {
  // The break is a default, not a lock: a patient who can only come at noon
  // has to be bookable.
  const noon = cell(page, 2, "12:00");
  await expect(noon).toHaveClass(/lunch/);

  await noon.click();
  const input = page.locator(".cell-input");
  await input.fill("Sofia Andrade");
  await input.press("Enter");

  await expect(cell(page, 2, "12:00")).toContainText("Sofia Andrade");
  // Still flagged as sitting inside the break.
  await expect(cell(page, 2, "12:00")).toHaveClass(/lunch/);
});

test("re-centres the window on a day picked from the strip", async ({ page }) => {
  const fourth = page.locator(".day-strip-chip").nth(3);
  const label = await fourth.locator(".day-strip-day").textContent();
  await fourth.click();

  // The picked day becomes the middle of the new window.
  await expect(page.locator(".day-strip-chip").nth(2).locator(".day-strip-day")).toHaveText(
    label!
  );
});

test("moves a whole window at a time, skipping nothing", async ({ page }) => {
  const before = await page.locator(".day-header-date").allTextContents();
  await page.getByRole("button", { name: /forward 5 days|5 dias depois/i }).click();
  const after = await page.locator(".day-header-date").allTextContents();

  expect(after).not.toEqual(before);
  // Contiguous: no day falls between the two windows.
  expect(new Set(after)).not.toContain(before.at(-1));
});

test("returns to today", async ({ page }) => {
  await page.getByRole("button", { name: /forward 5 days|5 dias depois/i }).click();
  await expect(page.locator(".day-header.today")).toHaveCount(0);

  await page.getByRole("button", { name: /^(today|hoje)$/i }).click();
  await expect(page.locator(".day-header.today")).toHaveCount(1);
});
