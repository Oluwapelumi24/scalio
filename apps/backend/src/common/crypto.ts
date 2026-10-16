import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

// AES-256-GCM for bank account numbers at rest. Format: base64(iv).base64(tag).base64(ciphertext).
// PII_ENCRYPTION_KEY is 32 bytes, base64-encoded. Outside production a fixed
// development key is used so local setups work; production refuses to start without one.

function key(): Buffer {
  const configured = process.env.PII_ENCRYPTION_KEY;
  if (configured) {
    const k = Buffer.from(configured, 'base64');
    if (k.length !== 32) throw new Error('PII_ENCRYPTION_KEY must be 32 bytes, base64-encoded');
    return k;
  }
  if (process.env.NODE_ENV === 'production') throw new Error('PII_ENCRYPTION_KEY is required in production');
  return createHash('sha256').update('scalio-dev-only-pii-key').digest();
}

export function encryptPii(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString('base64')).join('.');
}

export function decryptPii(sealed: string): string {
  const [iv, tag, data] = sealed.split('.').map((p) => Buffer.from(p, 'base64'));
  const decipher = createDecipheriv('aes-256-gcm', key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

export const last4 = (accountNumber: string) => accountNumber.slice(-4);
