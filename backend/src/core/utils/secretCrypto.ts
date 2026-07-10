import crypto from 'crypto';
import { config } from '../../config/env';
import { logger } from '../../config/logger';

/**
 * Symmetric encryption for secrets stored at rest (currently the per-brand
 * Instagram access token). AES-256-GCM with a random per-value IV; the stored
 * string is `enc:v1:<iv>:<authTag>:<ciphertext>` (all base64).
 *
 * Keyed off TOKEN_ENCRYPTION_KEY. In line with the app's zero-config
 * degradation philosophy, if that key is not set we fall back to storing the
 * value as-is (plaintext) and log a one-time warning — so local/demo setups
 * keep working, while production can opt into encryption by setting the key.
 *
 * The `enc:v1:` prefix lets decrypt transparently pass through legacy plaintext
 * values (and values stored while the key was unset), so enabling the key
 * doesn't strand existing tokens — they're re-encrypted on next write.
 */

const PREFIX = 'enc:v1:';
const ALGORITHM = 'aes-256-gcm';

let warnedMissingKey = false;

/** Derives a stable 32-byte key from the configured secret. Returns null if unset. */
function getKey(): Buffer | null {
  const secret = config.TOKEN_ENCRYPTION_KEY;
  if (!secret) {
    if (!warnedMissingKey) {
      warnedMissingKey = true;
      logger.warn(
        'TOKEN_ENCRYPTION_KEY is not set — Instagram access tokens are stored as plaintext at rest. Set it in production.'
      );
    }
    return null;
  }
  // Normalize any-length secret to 32 bytes via SHA-256.
  return crypto.createHash('sha256').update(secret).digest();
}

/** Encrypts a secret for storage. Returns plaintext unchanged if no key is configured. */
export function encryptSecret(plaintext: string): string {
  const key = getKey();
  if (!key) return plaintext;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString('base64')}:${authTag.toString('base64')}:${ciphertext.toString('base64')}`;
}

/**
 * Decrypts a stored secret. Values without the `enc:v1:` prefix are treated as
 * legacy plaintext and returned as-is (so enabling encryption doesn't break
 * previously-stored tokens). Returns null if a prefixed value can't be
 * decrypted (missing/rotated key or tampering) rather than throwing, so a bad
 * token surfaces as "not connected" instead of crashing the publish path.
 */
export function decryptSecret(stored: string | null | undefined): string | null {
  if (!stored) return null;
  if (!stored.startsWith(PREFIX)) return stored; // legacy plaintext

  const key = getKey();
  if (!key) {
    logger.error('Encountered an encrypted secret but TOKEN_ENCRYPTION_KEY is not set — cannot decrypt.');
    return null;
  }

  try {
    const [ivB64, tagB64, dataB64] = stored.slice(PREFIX.length).split(':');
    if (!ivB64 || !tagB64 || !dataB64) return null;
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    const plaintext = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]);
    return plaintext.toString('utf8');
  } catch (error) {
    logger.error({ err: error }, 'Failed to decrypt a stored secret (wrong key or corrupted value)');
    return null;
  }
}

/** True when a value is already in encrypted form. */
export function isEncrypted(value: string | null | undefined): boolean {
  return Boolean(value?.startsWith(PREFIX));
}
