import { beforeEach } from "vitest";
import { webcrypto } from "node:crypto";

/**
 * jsdom does not implement SubtleCrypto, and the vault and account modules are
 * built on it. Node's WebCrypto is the same API, so hand it over rather than
 * mocking — tests should exercise the real primitives, not a stand-in that
 * could agree with a broken implementation.
 */
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
    configurable: true,
  });
}

// Storage keeps an unlocked vault and a signed-in account in module-level
// state, which localStorage.clear() does not touch. Leaving either in place
// lets one test's records surface in the next and makes results depend on
// execution order — so reset both, not just the browser storage.
beforeEach(async () => {
  const storage = await import("../lib/storage");
  await storage.lock();
  storage.clearAccount();
  localStorage.clear();
});
