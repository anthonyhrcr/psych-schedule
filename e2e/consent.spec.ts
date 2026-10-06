import { test, expect } from "@playwright/test";
import { freshVisit, acceptLegalTerms } from "./helpers";

/**
 * The gate is the only thing standing between a first-time visitor and the
 * diary, so two things have to hold: it cannot be skipped, and it cannot
 * become a toll gate that asks again on every visit.
 */

test("asks a first-time visitor to accept before the diary opens", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await expect(page.locator(".consent-gate")).toBeVisible();
  await expect(page.locator(".home-index")).toHaveCount(0);

  // The button stays out of reach until the box is ticked.
  await expect(page.locator(".consent-gate .primary-btn")).toBeDisabled();

  await acceptLegalTerms(page);
  await expect(page.locator(".home-index")).toBeVisible();
});

test("does not ask again on the next visit", async ({ page }) => {
  await freshVisit(page);

  await page.reload();

  await expect(page.locator(".consent-gate")).toHaveCount(0);
  await expect(page.locator(".home-index")).toBeVisible();
});

test("the documents are readable from the gate, without accepting", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.locator(".consent-gate .link-btn").first().click();

  await expect(page.locator(".legal-doc")).toBeVisible();
  await expect(page.locator(".legal-section")).not.toHaveCount(0);

  await page.locator(".back-link").click();
  await expect(page.locator(".consent-gate")).toBeVisible();
});
