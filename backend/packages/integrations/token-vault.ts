import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// Seals OAuth tokens before they are stored, so a leaked database dump or
// backup doesn't hand over long-lived access to creators' social accounts.
//
// AES-256-GCM: authenticated, so a tampered value fails to open instead of
// decrypting to garbage. Every value is bound to a context string (we use
// "<userId>:<platform>:<kind>") via the cipher's additional authenticated data,
// so a sealed token copied into another row — or another column — will not open.
//
// Format:  v1.<iv>.<tag>.<ciphertext>   (each part base64url)
//
// Keys come from the environment, never the database:
//   TOKEN_ENCRYPTION_KEY           current key: 32 random bytes, base64
//   TOKEN_ENCRYPTION_KEY_PREVIOUS  optional: the key being rotated out. Values
//                                  sealed with it still open; new ones use the
//                                  current key. Re-seal on read to finish a rotation.
//
// Generate a key:  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

const VERSION = "v1";
const KEY_BYTES = 32;
const IV_BYTES = 12;

type Env = Record<string, string | undefined>;

export class TokenVaultError extends Error {}

function parseKey(name: string, raw: string): Buffer {
  const key = Buffer.from(raw, "base64");
  if (key.length !== KEY_BYTES) {
    throw new TokenVaultError(`${name} must be ${KEY_BYTES} random bytes, base64-encoded`);
  }
  return key;
}

function keysFromEnv(env: Env): { current: Buffer; previous?: Buffer } {
  const current = env.TOKEN_ENCRYPTION_KEY;
  if (!current) throw new TokenVaultError("TOKEN_ENCRYPTION_KEY is not set");
  const previous = env.TOKEN_ENCRYPTION_KEY_PREVIOUS;
  return {
    current: parseKey("TOKEN_ENCRYPTION_KEY", current),
    previous: previous ? parseKey("TOKEN_ENCRYPTION_KEY_PREVIOUS", previous) : undefined,
  };
}

const b64 = (buf: Buffer) => buf.toString("base64url");
const unb64 = (text: string) => Buffer.from(text, "base64url");

/** Seals `plain` for storage. `context` must be passed again to open it. */
export function sealToken(plain: string, context: string, env: Env = process.env): string {
  const { current } = keysFromEnv(env);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", current, iv);
  cipher.setAAD(Buffer.from(context, "utf8"));
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [VERSION, b64(iv), b64(cipher.getAuthTag()), b64(ciphertext)].join(".");
}

/**
 * Opens a sealed token. Throws TokenVaultError if the value is malformed,
 * was tampered with, was sealed for a different context, or the key is wrong.
 * (Error messages never include the token or the key.)
 */
export function openToken(sealed: string, context: string, env: Env = process.env): string {
  const parts = sealed.split(".");
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new TokenVaultError("Not a sealed token");
  }
  const [, ivText, tagText, dataText] = parts as [string, string, string, string];
  const iv = unb64(ivText);
  const tag = unb64(tagText);
  const data = unb64(dataText);
  if (iv.length !== IV_BYTES || tag.length !== 16) {
    throw new TokenVaultError("Not a sealed token");
  }

  const { current, previous } = keysFromEnv(env);
  for (const key of [current, previous]) {
    if (!key) continue;
    try {
      const decipher = createDecipheriv("aes-256-gcm", key, iv);
      decipher.setAAD(Buffer.from(context, "utf8"));
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
    } catch {
      // wrong key, wrong context, or tampered — try the previous key, then give up
    }
  }
  throw new TokenVaultError("Could not open sealed token");
}

/** True if the value looks like something sealToken produced. */
export function isSealed(value: string): boolean {
  const parts = value.split(".");
  return parts.length === 4 && parts[0] === VERSION;
}

/** True if the value was sealed with the previous key and should be re-sealed. */
export function needsReseal(sealed: string, context: string, env: Env = process.env): boolean {
  const { current } = keysFromEnv(env);
  const parts = sealed.split(".");
  if (parts.length !== 4) return false;
  try {
    const decipher = createDecipheriv("aes-256-gcm", current, unb64(parts[1]!));
    decipher.setAAD(Buffer.from(context, "utf8"));
    decipher.setAuthTag(unb64(parts[2]!));
    decipher.update(unb64(parts[3]!));
    decipher.final();
    return false;
  } catch {
    return true;
  }
}
