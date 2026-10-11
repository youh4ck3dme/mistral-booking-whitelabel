import { describe, expect, it } from 'vitest';
import {
  buildManageUrl,
  generateManageToken,
  hashManageToken,
  isWellFormedManageToken,
  isWellFormedTokenHash,
} from './manage-token';

describe('generateManageToken', () => {
  it('produces 256 bits of base64url text', () => {
    const token = generateManageToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(Buffer.from(token, 'base64url')).toHaveLength(32);
  });

  it('does not repeat across calls', () => {
    const tokens = new Set(Array.from({ length: 200 }, () => generateManageToken()));
    expect(tokens.size).toBe(200);
  });
});

describe('hashManageToken', () => {
  it('is a 64-character lowercase hex SHA-256 digest', () => {
    expect(hashManageToken('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('never equals the raw token', () => {
    const token = generateManageToken();
    expect(hashManageToken(token)).not.toBe(token);
    expect(isWellFormedTokenHash(hashManageToken(token))).toBe(true);
  });
});

describe('format guards', () => {
  it('accepts only well-formed raw tokens', () => {
    expect(isWellFormedManageToken(generateManageToken())).toBe(true);
    expect(isWellFormedManageToken('short')).toBe(false);
    expect(isWellFormedManageToken('a'.repeat(43) + ' ')).toBe(false);
    expect(isWellFormedManageToken(undefined)).toBe(false);
  });

  it('accepts only lowercase 64-hex hashes', () => {
    expect(isWellFormedTokenHash('a'.repeat(64))).toBe(true);
    expect(isWellFormedTokenHash('A'.repeat(64))).toBe(false);
    expect(isWellFormedTokenHash('a'.repeat(63))).toBe(false);
  });
});

describe('buildManageUrl', () => {
  it('builds the tenant-scoped management path without a double slash', () => {
    expect(buildManageUrl('https://app.example/', 'salon-a', 'tok')).toBe(
      'https://app.example/salon-a/booking/manage/tok',
    );
  });
});
