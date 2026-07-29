// Real encryption for the Source Identity Vault — established primitives
// only: PBKDF2-SHA-256 key derivation, AES-256-GCM authenticated encryption,
// both from the Web Crypto API. No invented cryptography.
//
// Honest limits, stated wherever this is offered:
// - The passphrase is NOT recoverable. No reset, no recovery questions, no
//   escrow. A forgotten passphrase means the encrypted vault is gone for
//   good — which is why enabling encryption first pushes the owner to save a
//   Complete Owner Vault Backup somewhere safe.
// - Encryption protects the vault AT REST (browser storage, backup files).
//   While unlocked, the decrypted vault lives in page memory and is readable
//   by anything running in this browser profile. Locking, refreshing, or
//   closing the tab drops it.

const KDF_ITERATIONS = 310_000;

export interface EncryptedEnvelope {
  cipher: "aes-256-gcm";
  kdf: "pbkdf2-sha256";
  iterations: number;
  salt: string; // base64
  iv: string; // base64
  data: string; // base64 ciphertext (includes GCM auth tag)
}

function toB64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function fromB64(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function deriveKey(passphrase: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptJson(passphrase: string, value: unknown): Promise<EncryptedEnvelope> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt, KDF_ITERATIONS);
  const plaintext = new TextEncoder().encode(JSON.stringify(value));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, plaintext as BufferSource);
  return {
    cipher: "aes-256-gcm",
    kdf: "pbkdf2-sha256",
    iterations: KDF_ITERATIONS,
    salt: toB64(salt),
    iv: toB64(iv),
    data: toB64(new Uint8Array(ciphertext)),
  };
}

/** Returns null on a wrong passphrase OR tampered data — GCM authenticates. */
export async function decryptJson(passphrase: string, envelope: EncryptedEnvelope): Promise<unknown | null> {
  try {
    if (envelope.cipher !== "aes-256-gcm" || envelope.kdf !== "pbkdf2-sha256") return null;
    const key = await deriveKey(passphrase, fromB64(envelope.salt), envelope.iterations);
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromB64(envelope.iv) as BufferSource },
      key,
      fromB64(envelope.data) as BufferSource,
    );
    return JSON.parse(new TextDecoder().decode(plaintext));
  } catch {
    return null;
  }
}

export function isEncryptedEnvelope(x: unknown): x is EncryptedEnvelope {
  const e = x as Partial<EncryptedEnvelope> | null;
  return !!e && e.cipher === "aes-256-gcm" && e.kdf === "pbkdf2-sha256"
    && typeof e.iterations === "number" && typeof e.salt === "string"
    && typeof e.iv === "string" && typeof e.data === "string";
}
