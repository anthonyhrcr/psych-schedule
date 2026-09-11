import { test, expect } from "@playwright/test";
import { freshVisit, openSection, cell } from "./helpers";

/**
 * Runs only on the mobile project. Hiding the "+" on an empty hour until
 * hover reads as restraint on a desktop and as a dead grid on a phone, where
 * hover never fires — every free hour rendered blank with nothing to suggest
 * it could be tapped. This is that regression, pinned.
 */

test("an empty hour shows it can be tapped", async ({ page }) => {
  await freshVisit(page);
  await openSection(page, "agenda");

  const hasHover = await page.evaluate(() => matchMedia("(hover: hover)").matches);
  expect(hasHover).toBe(false);

  const plus = cell(page, 2, "09:00").locator(".add-icon");
  const opacity = await plus.evaluate((el) => Number(getComputedStyle(el).opacity));
  expect(opacity).toBeGreaterThan(0);
});

test("books by tapping, with the hour column staying put", async ({ page }) => {
  await freshVisit(page);
  await openSection(page, "agenda");

  await cell(page, 2, "09:00").tap();
  const input = page.locator(".cell-input");
  await input.fill("Ana Beatriz");
  await input.press("Enter");
  await expect(cell(page, 2, "09:00")).toContainText("Ana Beatriz");

  // The five-day grid scrolls sideways on a narrow screen; the hours must
  // stay visible or there is no way to tell what time a row is.
  const scroller = page.locator(".schedule-scroll");
  await scroller.evaluate((el) => (el.scrollLeft = 260));
  const left = await page
    .locator(".slot-row .time-col")
    .first()
    .evaluate((el) => el.getBoundingClientRect().left);
  expect(left).toBeGreaterThanOrEqual(0);
});
