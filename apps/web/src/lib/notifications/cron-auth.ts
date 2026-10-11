import { createHash, timingSafeEqual } from 'node:crypto';

// Hashing both sides gives equal-length buffers, so the comparison is constant time
// regardless of the secret's length or of where a mismatch occurs.
function digest(value: string) {
  return createHash('sha256').update(value, 'utf8').digest();
}

export function secretsMatch(provided: string | null, expected: string): boolean {
  if (provided === null) return false;
  return timingSafeEqual(digest(provided), digest(expected));
}

/** Accepts `Authorization: Bearer <secret>` or `x-notification-secret: <secret>`. */
export function isCronRequestAuthorized(headers: Headers, secret: string): boolean {
  const bearer = headers.get('authorization');
  const provided = bearer?.startsWith('Bearer ') ? bearer.slice('Bearer '.length) : null;
  if (provided !== null && secretsMatch(provided, secret)) return true;
  return secretsMatch(headers.get('x-notification-secret'), secret);
}
