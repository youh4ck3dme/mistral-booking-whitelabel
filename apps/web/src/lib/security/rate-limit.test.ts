import { beforeEach, describe, expect, it } from 'vitest';
import {
  checkRateLimit,
  checkRequestRateLimit,
  getClientIp,
  getRateLimitConfig,
  resetRateLimiter,
} from './rate-limit';

describe('Rate Limiter (SEC-6)', () => {
  beforeEach(() => {
    resetRateLimiter();
    delete process.env.RATE_LIMIT_CHAT_MAX;
    delete process.env.RATE_LIMIT_CHAT_WINDOW_MS;
    delete process.env.RATE_LIMIT_NOTIFICATIONS_MAX;
    delete process.env.RATE_LIMIT_AUTH_MAX;
  });

  describe('Configuration & Defaults', () => {
    it('provides sensible defaults for all scopes', () => {
      expect(getRateLimitConfig('chat')).toEqual({ limit: 20, windowMs: 60_000 });
      expect(getRateLimitConfig('notifications')).toEqual({ limit: 30, windowMs: 60_000 });
      expect(getRateLimitConfig('auth')).toEqual({ limit: 10, windowMs: 60_000 });
      expect(getRateLimitConfig('default')).toEqual({ limit: 60, windowMs: 60_000 });
    });

    it('respects environment variable overrides', () => {
      process.env.RATE_LIMIT_CHAT_MAX = '50';
      process.env.RATE_LIMIT_CHAT_WINDOW_MS = '30000';
      process.env.RATE_LIMIT_AUTH_MAX = '5';

      expect(getRateLimitConfig('chat')).toEqual({ limit: 50, windowMs: 30_000 });
      expect(getRateLimitConfig('auth')).toEqual({ limit: 5, windowMs: 60_000 });
    });
  });

  describe('IP Extraction', () => {
    it('extracts IP from x-forwarded-for header (first in list)', () => {
      const req = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178' },
      });
      expect(getClientIp(req)).toBe('203.0.113.195');
    });

    it('extracts IP from x-real-ip header', () => {
      const req = new Request('http://localhost', {
        headers: { 'x-real-ip': '198.51.100.42' },
      });
      expect(getClientIp(req)).toBe('198.51.100.42');
    });

    it('falls back to 127.0.0.1 when no IP headers exist', () => {
      const req = new Request('http://localhost');
      expect(getClientIp(req)).toBe('127.0.0.1');
    });
  });

  describe('Sliding Window Enforcement', () => {
    it('allows requests up to the configured limit', () => {
      const key = 'test-client-1';
      const options = { limit: 3, windowMs: 60_000 };

      const r1 = checkRateLimit(key, 'default', options);
      expect(r1.success).toBe(true);
      expect(r1.remaining).toBe(2);

      const r2 = checkRateLimit(key, 'default', options);
      expect(r2.success).toBe(true);
      expect(r2.remaining).toBe(1);

      const r3 = checkRateLimit(key, 'default', options);
      expect(r3.success).toBe(true);
      expect(r3.remaining).toBe(0);

      // 4th request exceeds limit
      const r4 = checkRateLimit(key, 'default', options);
      expect(r4.success).toBe(false);
      expect(r4.remaining).toBe(0);
      expect(r4.retryAfterSeconds).toBeGreaterThan(0);
    });

    it('isolates different keys independently', () => {
      const options = { limit: 1, windowMs: 60_000 };

      expect(checkRateLimit('client-a', 'default', options).success).toBe(true);
      expect(checkRateLimit('client-a', 'default', options).success).toBe(false);

      // Client B should still be allowed
      expect(checkRateLimit('client-b', 'default', options).success).toBe(true);
    });
  });

  describe('checkRequestRateLimit Helper', () => {
    it('returns allowed: true and allows execution for compliant requests', () => {
      const req = new Request('http://localhost/api/chat', {
        headers: { 'x-real-ip': '1.2.3.4' },
      });

      const guard = checkRequestRateLimit(req, 'chat', undefined, { limit: 5, windowMs: 60_000 });
      expect(guard.allowed).toBe(true);
      if (guard.allowed) {
        expect(guard.result.remaining).toBe(4);
      }
    });

    it('returns 429 response with proper headers when limit is exceeded', () => {
      const req = new Request('http://localhost/api/chat', {
        headers: { 'x-real-ip': '9.8.7.6' },
      });
      const options = { limit: 2, windowMs: 60_000 };

      checkRequestRateLimit(req, 'chat', undefined, options);
      checkRequestRateLimit(req, 'chat', undefined, options);

      const blocked = checkRequestRateLimit(req, 'chat', undefined, options);
      expect(blocked.allowed).toBe(false);

      if (!blocked.allowed) {
        expect(blocked.response.status).toBe(429);
        expect(blocked.response.headers.get('Retry-After')).toBeDefined();
        expect(blocked.response.headers.get('X-RateLimit-Limit')).toBe('2');
        expect(blocked.response.headers.get('X-RateLimit-Remaining')).toBe('0');
      }
    });
  });
});
