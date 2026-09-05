/**
 * Key management for end-to-end encrypted accounts.
 *
 * The design problem: records must be encrypted with a key the server never
 * sees, yet the user must be able to change their password without
 * re-encrypting everything, and must have some way back in if they forget it.
 *
 * So the data is encrypted with a random master key, and it is the *master
 * key* that gets wrapped — twice. Once by a key derived from the password,
 * once by a key derived from a recovery key shown at signup. Either can
 * unwrap it; neither is ever sent anywhere. Changing the password only
 * re-wraps, so the records are untouched.
 *
 * The server stores both wrapped copies. They are inert without the password
 * or the recovery key.
 */

const ITERATIONS = 210_000;

export type WrappedKeys = {
  v: 1;
  passwordSalt: string;
  passwordWrapped: string;
  passwordIv: string;
  recoverySalt: string;
  recoveryWrapped: string;
  recoveryIv: string;
};

// Crockford base32 minus look-alikes, so a recovery key can be read aloud
// or copied off paper without I/L/O/U confusion.
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function toBase64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function fromBase64(value: string): Uint8Array {
  const bin = atob(value);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function randomBytes(n: number): Uint8Array {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return b;
}

/**
 * A 40-character recovery key, grouped for legibility.
 *
 * One byte per character — reusing bytes would repeat visible chunks of the
 * key, which both looks like a copying mistake and wastes entropy. The
 * alphabet is exactly 32 long and 256 divides evenly by it, so the modulo
 * introduces no bias.
 */
export function generateRecoveryKey(): string {
  const bytes = randomBytes(40);
  let out = "";
  for (let i = 0; i < 40; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return (out.match(/.{1,5}/g) ?? []).join("-");
}

/** Accept a recovery key however the user typed it: case, spaces, dashes. */
export function normaliseRecoveryKey(input: string): string {
  return input.toUpperCase().replace(/[^0-9A-Z]/g, "");
}

async function deriveWrappingKey(secret: string, salt: Uint8Array): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: ITERATIONS, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["wrapKey", "unwrapKey"]
  );
}

async function generateMasterKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
}

async function wrap(
  master: CryptoKey,
  secret: string
): Promise<{ salt: string; wrapped: string; iv: string }> {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const kek = await deriveWrappingKey(secret, salt);
  const wrapped = await crypto.subtle.wrapKey("raw", master, kek, {
    name: "AES-GCM",
    iv: iv as BufferSource,
  });
  return {
    salt: toBase64(salt),
    wrapped: toBase64(new Uint8Array(wrapped)),
    iv: toBase64(iv),
  };
}

async function unwrap(
  wrapped: string,
  iv: string,
  salt: string,
  secret: string
): Promise<CryptoKey | null> {
  try {
    const kek = await deriveWrappingKey(secret, fromBase64(salt));
    return await crypto.subtle.unwrapKey(
      "raw",
      fromBase64(wrapped) as BufferSource,
      kek,
      { name: "AES-GCM", iv: fromBase64(iv) as BufferSource },
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
  } catch {
    return null;
  }
}

export type NewAccountKeys = {
  master: CryptoKey;
  wrapped: WrappedKeys;
  recoveryKey: string;
};

/** Called once at signup. The recovery key is shown to the user and never stored. */
export async function createAccountKeys(password: string): Promise<NewAccountKeys> {
  const master = await generateMasterKey();
  const recoveryKey = generateRecoveryKey();

  const byPassword = await wrap(master, password);
  const byRecovery = await wrap(master, normaliseRecoveryKey(recoveryKey));

  return {
    master,
    recoveryKey,
    wrapped: {
      v: 1,
      passwordSalt: byPassword.salt,
      passwordWrapped: byPassword.wrapped,
      passwordIv: byPassword.iv,
      recoverySalt: byRecovery.salt,
      recoveryWrapped: byRecovery.wrapped,
      recoveryIv: byRecovery.iv,
    },
  };
}

/** Returns null when the password is wrong. */
export async function unlockWithPassword(
  keys: WrappedKeys,
  password: string
): Promise<CryptoKey | null> {
  return unwrap(keys.passwordWrapped, keys.passwordIv, keys.passwordSalt, password);
}

/** Returns null when the recovery key is wrong. */
export async function unlockWithRecoveryKey(
  keys: WrappedKeys,
  recoveryKey: string
): Promise<CryptoKey | null> {
  return unwrap(
    keys.recoveryWrapped,
    keys.recoveryIv,
    keys.recoverySalt,
    normaliseRecoveryKey(recoveryKey)
  );
}

/**
 * Re-wrap the master key under a new password. The records are not touched,
 * so this stays instant no matter how much history exists.
 */
export async function rewrapWithPassword(
  keys: WrappedKeys,
  master: CryptoKey,
  newPassword: string
): Promise<WrappedKeys> {
  const byPassword = await wrap(master, newPassword);
  return {
    ...keys,
    passwordSalt: byPassword.salt,
    passwordWrapped: byPassword.wrapped,
    passwordIv: byPassword.iv,
  };
}

/** Issue a fresh recovery key, invalidating the old one. */
export async function rewrapWithNewRecoveryKey(
  keys: WrappedKeys,
  master: CryptoKey
): Promise<{ wrapped: WrappedKeys; recoveryKey: string }> {
  const recoveryKey = generateRecoveryKey();
  const byRecovery = await wrap(master, normaliseRecoveryKey(recoveryKey));
  return {
    recoveryKey,
    wrapped: {
      ...keys,
      recoverySalt: byRecovery.salt,
      recoveryWrapped: byRecovery.wrapped,
      recoveryIv: byRecovery.iv,
    },
  };
}

// --- Record encryption -----------------------------------------------------

/** Encrypt one record's contents under the master key. */
export async function encryptRecord(master: CryptoKey, value: unknown): Promise<string> {
  const iv = randomBytes(12);
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    master,
    new TextEncoder().encode(JSON.stringify(value))
  );
  return `${toBase64(iv)}.${toBase64(new Uint8Array(cipher))}`;
}

/** Returns null on a wrong key or tampered ciphertext. */
export async function decryptRecord<T>(master: CryptoKey, blob: string): Promise<T | null> {
  try {
    const [ivPart, dataPart] = blob.split(".");
    if (!ivPart || !dataPart) return null;
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(ivPart) as BufferSource },
      master,
      fromBase64(dataPart) as BufferSource
    );
    return JSON.parse(new TextDecoder().decode(plain)) as T;
  } catch {
    return null;
  }
}
