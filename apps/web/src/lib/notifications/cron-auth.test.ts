import { describe, expect, it } from 'vitest';
import { isCronRequestAuthorized, secretsMatch } from './cron-auth';

const SECRET = 'a-long-random-cron-secret-value-0123456789';

describe('secretsMatch', () => {
  it('matches only the exact secret', () => {
    expect(secretsMatch(SECRET, SECRET)).toBe(true);
    expect(secretsMatch(SECRET + 'x', SECRET)).toBe(false);
    expect(secretsMatch('', SECRET)).toBe(false);
    expect(secretsMatch(null, SECRET)).toBe(false);
  });
});

describe('isCronRequestAuthorized', () => {
  it('accepts the bearer header and the dedicated header', () => {
    expect(isCronRequestAuthorized(new Headers({ authorization: `Bearer ${SECRET}` }), SECRET)).toBe(true);
    expect(isCronRequestAuthorized(new Headers({ 'x-notification-secret': SECRET }), SECRET)).toBe(true);
  });

  it('rejects a request with no credentials', () => {
    expect(isCronRequestAuthorized(new Headers(), SECRET)).toBe(false);
  });

  it('rejects a wrong secret in either header', () => {
    expect(isCronRequestAuthorized(new Headers({ authorization: 'Bearer wrong' }), SECRET)).toBe(false);
    expect(isCronRequestAuthorized(new Headers({ 'x-notification-secret': 'wrong' }), SECRET)).toBe(false);
  });

  it('rejects the bare secret without the Bearer scheme', () => {
    expect(isCronRequestAuthorized(new Headers({ authorization: SECRET }), SECRET)).toBe(false);
  });
});
