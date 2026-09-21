import { test, expect } from "@playwright/test";
import { freshVisit, openSection, goBack, book, cell } from "./helpers";

test.beforeEach(async ({ page }) => {
  await freshVisit(page);
});

test("the contents page leads to all four sections", async ({ page }) => {
  await expect(page.locator(".home-index-item")).toHaveCount(4);
  for (const name of ["agenda", "patients", "evolution", "history"] as const) {
    await openSection(page, name);
    await expect(page.locator(".back-link")).toBeVisible();
    await goBack(page);
  }
});

test("switches language and remembers the choice", async ({ page }) => {
  const toggle = page.locator(".lang-toggle");
  const before = await toggle.textContent();
  await toggle.click();
  await expect(toggle).not.toHaveText(before!);

  await page.reload();
  await expect(page.locator(".lang-toggle")).not.toHaveText(before!);
});

test("adds a patient and removes them again", async ({ page }) => {
  await openSection(page, "patients");
  await expect(page.locator(".empty-hint")).toBeVisible();

  await page.locator(".inline-form .text-input").first().fill("Ana Beatriz");
  await page.locator(".inline-form .text-input").nth(1).fill("Terças e quintas");
  await page.getByRole("button", { name: /add to list|adicionar à lista/i }).click();

  await expect(page.locator(".item-row")).toHaveCount(1);
  await expect(page.locator(".item-row-title")).toHaveText("Ana Beatriz");
  await expect(page.locator(".item-row-subtitle")).toHaveText("Terças e quintas");

  await page.locator(".icon-btn").click();
  await expect(page.locator(".item-row")).toHaveCount(0);
});

test("offers saved patients as suggestions in the agenda", async ({ page }) => {
  await openSection(page, "patients");
  await page.locator(".inline-form .text-input").first().fill("Ana Beatriz");
  await page.getByRole("button", { name: /add to list|adicionar à lista/i }).click();
  await goBack(page);

  await openSection(page, "agenda");
  await cell(page, 2, "09:00").click();

  const input = page.locator(".cell-input");
  const listId = await input.getAttribute("list");
  expect(listId).toBeTruthy();
  await expect(page.locator(`#${listId} option`)).toHaveCount(1);
  await expect(page.locator(`#${listId} option`)).toHaveAttribute("value", "Ana Beatriz");
});

test("sends you to add a patient before any notes exist", async ({ page }) => {
  await openSection(page, "evolution");
  await expect(page.locator(".empty-state")).toBeVisible();

  await page.getByRole("button", { name: /add a patient|adicionar paciente/i }).click();
  await expect(page.locator(".inline-form")).toBeVisible();
});

test("writes a session note against a patient", async ({ page }) => {
  await openSection(page, "patients");
  await page.locator(".inline-form .text-input").first().fill("Ana Beatriz");
  await page.getByRole("button", { name: /add to list|adicionar à lista/i }).click();
  await goBack(page);

  await openSection(page, "evolution");
  await expect(page.locator("#evolution-patient-select")).toHaveValue(/.+/);

  await page.locator(".text-area").fill("Relatou ansiedade ligada ao trabalho.");
  await page.getByRole("button", { name: /save note|salvar anotação/i }).click();

  await expect(page.locator(".entry-item")).toHaveCount(1);
  await expect(page.locator(".entry-item-text")).toContainText("ansiedade");
  await expect(page.locator(".entry-item-date")).not.toBeEmpty();
});

test("lists newest notes first", async ({ page }) => {
  await openSection(page, "patients");
  await page.locator(".inline-form .text-input").first().fill("Ana Beatriz");
  await page.getByRole("button", { name: /add to list|adicionar à lista/i }).click();
  await goBack(page);

  await openSection(page, "evolution");
  for (const text of ["primeira sessão", "segunda sessão"]) {
    await page.locator(".text-area").fill(text);
    await page.getByRole("button", { name: /save note|salvar anotação/i }).click();
  }

  await expect(page.locator(".entry-item")).toHaveCount(2);
  await expect(page.locator(".entry-item-text").first()).toContainText("segunda");
});

test("history totals every booking and filters to one patient", async ({ page }) => {
  await openSection(page, "agenda");
  await book(page, 0, "07:00", "Ana Beatriz");
  await book(page, 1, "08:00", "Rafael Moura");
  await book(page, 1, "09:00", "Ana Beatriz");
  await goBack(page);

  await openSection(page, "history");
  const stats = page.locator(".stat-value");
  await expect(stats.nth(0)).toHaveText("3"); // sessions
  await expect(stats.nth(2)).toHaveText("2"); // distinct patients
  await expect(page.locator(".history-session")).toHaveCount(3);

  await page.locator("#history-filter").selectOption("Ana Beatriz");
  await expect(page.locator(".history-session")).toHaveCount(2);
  // The headline figures still describe the whole record, not the filter.
  await expect(stats.nth(0)).toHaveText("3");
});

test("history reaches bookings outside the visible window", async ({ page }) => {
  await openSection(page, "agenda");
  await book(page, 0, "07:00", "Ana Beatriz");

  // Move well away, so the booking is no longer on screen in the agenda.
  for (let i = 0; i < 4; i++) {
    await page.getByRole("button", { name: /forward 5 days|5 dias depois/i }).click();
  }
  await expect(page.getByRole("gridcell", { name: /Ana Beatriz/ })).toHaveCount(0);

  await goBack(page);
  await openSection(page, "history");
  await expect(page.locator(".history-session")).toContainText(["Ana Beatriz"]);
});
