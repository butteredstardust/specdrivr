import 'server-only';

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { env } from '@/lib/env';

const PREFIX = 'enc:v1:';
const IV_LENGTH = 12;

function encryptionKey(): Buffer {
  return createHash('sha256')
    .update(env.CREDENTIAL_ENCRYPTION_KEY ?? env.BETTER_AUTH_SECRET)
    .digest();
}

export function encryptCredential(value: string | null | undefined): string | null | undefined {
  if (value == null || value.startsWith(PREFIX)) return value;

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${PREFIX}${iv.toString('base64url')}:${tag.toString('base64url')}:${encrypted.toString('base64url')}`;
}

export function decryptCredential(value: string | null | undefined): string | null | undefined {
  if (value == null || !value.startsWith(PREFIX)) return value;

  const [ivEncoded, tagEncoded, encryptedEncoded] = value.slice(PREFIX.length).split(':');
  if (!ivEncoded || !tagEncoded || !encryptedEncoded) {
    throw new Error('Stored credential has an invalid encrypted format');
  }

  const decipher = createDecipheriv(
    'aes-256-gcm',
    encryptionKey(),
    Buffer.from(ivEncoded, 'base64url')
  );
  decipher.setAuthTag(Buffer.from(tagEncoded, 'base64url'));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedEncoded, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}
