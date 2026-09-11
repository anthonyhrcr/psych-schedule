import { Page, Locator, expect } from "@playwright/test";

/**
 * The grid centres on today, so tests address cells by column position and
 * hour rather than by date. Hard-coding dates would rot the moment the suite
 * ran on a different day.
 */

export const SECTIONS = {
  agenda: 0,
  patients: 1,
  evolution: 2,
  history: 3,
} as const;

/** Start from a clean browser, as a first-time visitor would. */
export async function freshVisit(page: Page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator(".home-index")).toBeVisible();
}

export async function openSection(page: Page, name: keyof typeof SECTIONS) {
  await page.locator(".home-index-item").nth(SECTIONS[name]).click();
}

export async function goBack(page: Page) {
  await page.locator(".back-link").click();
  await expect(page.locator(".home-index")).toBeVisible();
}

/** The cell for a given hour in a given column of the five-day window. */
export function cell(page: Page, column: number, time: string): Locator {
  return page.getByRole("gridcell", { name: new RegExp(`^${time}`) }).nth(column);
}

/** Book a patient into one hour, the way a user does: click, type, Enter. */
export async function book(page: Page, column: number, time: string, name: string) {
  await cell(page, column, time).click();
  const input = page.locator(".cell-input");
  await expect(input).toBeVisible();
  await input.fill(name);
  await input.press("Enter");
  await expect(cell(page, column, time)).toContainText(name);
}

/** The hours that currently show as lunch, as "HH:MM" strings. */
export async function lunchHours(page: Page): Promise<string[]> {
  return page.locator(".slot-cell.lunch").evaluateAll((cells) =>
    cells.map((c) => (c.getAttribute("aria-label") ?? "").split(" ")[0])
  );
}
