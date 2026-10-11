// Management-link tokens. Server-only (uses node:crypto).
//
// A token is 256 random bits. Only its SHA-256 hash ever leaves this module
// toward the database, so a leaked database row cannot be replayed as a link.

import { createHash, randomBytes } from 'node:crypto';

const TOKEN_BYTES = 32;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const HASH_PATTERN = /^[0-9a-f]{64}$/;

/** Generates a new raw token (256 bits, base64url, 43 characters). */
export function generateManageToken(): string {
  return randomBytes(TOKEN_BYTES).toString('base64url');
}

/** SHA-256 hex digest. Must match encode(sha256(convert_to(token,'UTF8')),'hex') in SQL. */
export function hashManageToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

/** Rejects malformed input before it reaches the database. */
export function isWellFormedManageToken(value: unknown): value is string {
  return typeof value === 'string' && TOKEN_PATTERN.test(value);
}

export function isWellFormedTokenHash(value: unknown): value is string {
  return typeof value === 'string' && HASH_PATTERN.test(value);
}

/** Public management page URL for a tenant and token. */
export function buildManageUrl(appUrl: string, tenantSlug: string, token: string): string {
  return `${appUrl.replace(/\/+$/, '')}/${tenantSlug}/booking/manage/${token}`;
}
