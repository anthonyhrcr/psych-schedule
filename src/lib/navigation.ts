export type Page =
  | "home"
  | "agenda"
  | "patients"
  | "evolution"
  | "history"
  // Readable without an account: someone deciding whether to trust the
  // platform has to be able to read these before handing it anything.
  | "privacy"
  | "terms"
  | "cookies";

export const LEGAL_PAGES: Page[] = ["privacy", "terms", "cookies"];

export function isLegalPage(page: Page): boolean {
  return LEGAL_PAGES.includes(page);
}
