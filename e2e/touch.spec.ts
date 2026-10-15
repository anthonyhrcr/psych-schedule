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

/**
 * Multi-fill was desktop-only: the range came from shift+click, and a phone
 * has no shift key. These pin the touch path and the thing it must not break.
 */

/** A long press, assembled from pointer events because Playwright's
 *  touchscreen only taps. pointerType is what the component keys off. */
async function longPress(locator: ReturnType<typeof cell>) {
  const box = await locator.boundingBox();
  if (!box) throw new Error("cell is not on screen");
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  const init = { pointerType: "touch", clientX: x, clientY: y, bubbles: true };

  await locator.dispatchEvent("pointerdown", init);
  await locator.page().waitForTimeout(600);
  await locator.dispatchEvent("pointerup", init);
  await locator.dispatchEvent("click", { bubbles: true });
}

test("fills a run of hours by long press and tap", async ({ page }) => {
  await freshVisit(page);
  await openSection(page, "agenda");

  await longPress(cell(page, 2, "14:00"));
  await expect(page.locator(".slot-cell.selected")).toHaveCount(1);

  // A plain tap extends the range while a selection is open.
  await cell(page, 2, "16:00").tap();
  await expect(page.locator(".slot-cell.selected")).toHaveCount(3);

  const input = page.locator(".multi-fill-prompt input");
  await input.fill("Helena Vasques");
  await input.press("Enter");

  await expect(cell(page, 2, "14:00")).toContainText("Helena Vasques");
  await expect(cell(page, 2, "15:00")).toContainText("Helena Vasques");
  await expect(cell(page, 2, "16:00")).toContainText("Helena Vasques");
});

test("a swipe across the grid scrolls it instead of selecting", async ({ page }) => {
  await freshVisit(page);
  await openSection(page, "agenda");

  // The press starts on a cell and the finger travels, which is how every
  // horizontal scroll of this grid begins. It must not become a selection.
  const target = cell(page, 2, "14:00");
  const box = await target.boundingBox();
  if (!box) throw new Error("cell is not on screen");
  const y = box.y + box.height / 2;

  await target.dispatchEvent("pointerdown", {
    pointerType: "touch",
    clientX: box.x + box.width / 2,
    clientY: y,
    bubbles: true,
  });
  await target.dispatchEvent("pointermove", {
    pointerType: "touch",
    clientX: box.x + box.width / 2 - 60,
    clientY: y,
    bubbles: true,
  });
  await page.waitForTimeout(600);
  await target.dispatchEvent("pointerup", { pointerType: "touch", bubbles: true });

  await expect(page.locator(".slot-cell.selected")).toHaveCount(0);
});

test("every control clears 44px under a coarse pointer", async ({ page }) => {
  await freshVisit(page);
  await openSection(page, "agenda");
  await page.locator(".date-picker-toggle, .jump-btn, .today-btn").first().waitFor();

  const undersized = await page.evaluate(() => {
    const els = [...document.querySelectorAll("button, a, input, select")];
    return els
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { sel: el.className.toString().split(" ")[0], w: Math.round(r.width), h: Math.round(r.height) };
      })
      .filter((o) => o.w > 0 && (o.w < 44 || o.h < 44));
  });

  expect(undersized).toEqual([]);
});
