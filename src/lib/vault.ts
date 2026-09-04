import { SchedulePayload, LunchConfigByWeekday } from "./schedule";
import { Patient } from "./patients";
import { EvolutionEntry } from "./evolution";

/**
 * When a passcode is set, everything the app knows moves into a single
 * encrypted blob and the plaintext keys are removed.
 *
 * The passcode is never stored — not even hashed. The key is derived from it
 * on each unlock, so the data is genuinely unreadable without it, including
 * to anyone poking at localStorage in devtools. The direct consequence is
 * that a forgotten passcode means unrecoverable data, which is why enabling
 * the lock pushes hard on taking a backup first.
 */
export const VAULT_KEY = "psych-schedule:v1:vault";

// OWASP's floor for PBKDF2-SHA256. Costs a few hundred ms on a phone, once,
// at unlock — a fine trade for making a short passcode expensive to guess.
const ITERATIONS = 210_000;

export type VaultData = {
  days: SchedulePayload;
  patients: Patient[];
  evolution: EvolutionEntry[];
  lunch: LunchConfigByWeekday;
};

export type VaultBlob = {
  v: 1;
  salt: string;
  iv: string;
  data: string;
};

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

export function randomBytes(length: number): Uint8Array {
  const b = new Uint8Array(length);
  crypto.getRandomValues(b);
  return b;
}

export async function deriveKey(passcode: string, salt: Uint8Array): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passcode),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: ITERATIONS, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptVault(
  key: CryptoKey,
  salt: Uint8Array,
  data: VaultData
): Promise<VaultBlob> {
  const iv = randomBytes(12);
  const plaintext = new TextEncoder().encode(JSON.stringify(data));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    plaintext
  );
  return {
    v: 1,
    salt: toBase64(salt),
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(cipher)),
  };
}

/** Returns null when the passcode is wrong — AES-GCM fails authentication. */
export async function decryptVault(
  key: CryptoKey,
  blob: VaultBlob
): Promise<VaultData | null> {
  try {
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(blob.iv) as BufferSource },
      key,
      fromBase64(blob.data) as BufferSource
    );
    return JSON.parse(new TextDecoder().decode(plain)) as VaultData;
  } catch {
    return null;
  }
}

export function parseVaultBlob(raw: string | null): VaultBlob | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      parsed.v === 1 &&
      typeof parsed.salt === "string" &&
      typeof parsed.iv === "string" &&
      typeof parsed.data === "string"
    ) {
      return parsed as VaultBlob;
    }
  } catch {
    // Fall through.
  }
  return null;
}

export function saltOf(blob: VaultBlob): Uint8Array {
  return fromBase64(blob.salt);
}
