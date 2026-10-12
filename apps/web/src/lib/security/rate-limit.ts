import { NextResponse } from 'next/server';

export type RateLimitScope = 'chat' | 'notifications' | 'auth' | 'default';

export interface RateLimitOptions {
  limit?: number;
  windowMs?: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
  retryAfterSeconds: number;
}

interface ClientHistory {
  timestamps: number[];
  lastSeen: number;
}

// In-memory sliding log store (survives across requests in the same Node/Edge instance)
const rateLimitStore = new Map<string, ClientHistory>();
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 60_000;
const ENTRY_MAX_TTL_MS = 5 * 60_000;

function cleanupExpiredEntries(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS && rateLimitStore.size < 5000) {
    return;
  }
  lastCleanup = now;
  rateLimitStore.forEach((entry, key) => {
    if (now - entry.lastSeen > ENTRY_MAX_TTL_MS) {
      rateLimitStore.delete(key);
    }
  });
}

/**
 * Resets the in-memory rate limit store. Useful for testing.
 */
export function resetRateLimiter(): void {
  rateLimitStore.clear();
  lastCleanup = Date.now();
}

/**
 * Resolves the configured rate limits based on scope and environment variables.
 */
export function getRateLimitConfig(
  scope: RateLimitScope,
  overrideOptions?: RateLimitOptions
): { limit: number; windowMs: number } {
  let envLimit: number | undefined;
  let envWindowMs: number | undefined;

  switch (scope) {
    case 'chat':
      envLimit = process.env.RATE_LIMIT_CHAT_MAX ? Number(process.env.RATE_LIMIT_CHAT_MAX) : undefined;
      envWindowMs = process.env.RATE_LIMIT_CHAT_WINDOW_MS ? Number(process.env.RATE_LIMIT_CHAT_WINDOW_MS) : undefined;
      return {
        limit: overrideOptions?.limit ?? envLimit ?? 20,
        windowMs: overrideOptions?.windowMs ?? envWindowMs ?? 60_000,
      };

    case 'notifications':
      envLimit = process.env.RATE_LIMIT_NOTIFICATIONS_MAX ? Number(process.env.RATE_LIMIT_NOTIFICATIONS_MAX) : undefined;
      envWindowMs = process.env.RATE_LIMIT_NOTIFICATIONS_WINDOW_MS ? Number(process.env.RATE_LIMIT_NOTIFICATIONS_WINDOW_MS) : undefined;
      return {
        limit: overrideOptions?.limit ?? envLimit ?? 30,
        windowMs: overrideOptions?.windowMs ?? envWindowMs ?? 60_000,
      };

    case 'auth':
      envLimit = process.env.RATE_LIMIT_AUTH_MAX ? Number(process.env.RATE_LIMIT_AUTH_MAX) : undefined;
      envWindowMs = process.env.RATE_LIMIT_AUTH_WINDOW_MS ? Number(process.env.RATE_LIMIT_AUTH_WINDOW_MS) : undefined;
      return {
        limit: overrideOptions?.limit ?? envLimit ?? 10,
        windowMs: overrideOptions?.windowMs ?? envWindowMs ?? 60_000,
      };

    case 'default':
    default:
      envLimit = process.env.RATE_LIMIT_GLOBAL_MAX ? Number(process.env.RATE_LIMIT_GLOBAL_MAX) : undefined;
      envWindowMs = process.env.RATE_LIMIT_GLOBAL_WINDOW_MS ? Number(process.env.RATE_LIMIT_GLOBAL_WINDOW_MS) : undefined;
      return {
        limit: overrideOptions?.limit ?? envLimit ?? 60,
        windowMs: overrideOptions?.windowMs ?? envWindowMs ?? 60_000,
      };
  }
}

/**
 * Extracts the best client IP address from request headers.
 */
export function getClientIp(req: Request | { headers: Headers }): string {
  const headers = req.headers instanceof Headers ? req.headers : new Headers(req.headers);

  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }

  const realIp = headers.get('x-real-ip');
  if (realIp?.trim()) return realIp.trim();

  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp?.trim()) return cfConnectingIp.trim();

  return '127.0.0.1';
}

/**
 * Checks whether a key is allowed under the rate limit for a specific scope.
 */
export function checkRateLimit(
  key: string,
  scope: RateLimitScope = 'default',
  overrideOptions?: RateLimitOptions
): RateLimitResult {
  const { limit, windowMs } = getRateLimitConfig(scope, overrideOptions);
  const now = Date.now();

  cleanupExpiredEntries(now);

  let entry = rateLimitStore.get(key);
  if (!entry) {
    entry = { timestamps: [], lastSeen: now };
    rateLimitStore.set(key, entry);
  }

  entry.lastSeen = now;
  // Prune timestamps older than windowMs
  const windowStart = now - windowMs;
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

  if (entry.timestamps.length >= limit) {
    const oldestTimestamp = entry.timestamps[0] || now;
    const resetMs = Math.max(0, oldestTimestamp + windowMs - now);
    const retryAfterSeconds = Math.max(1, Math.ceil(resetMs / 1000));

    return {
      success: false,
      limit,
      remaining: 0,
      resetMs,
      retryAfterSeconds,
    };
  }

  entry.timestamps.push(now);
  const remaining = Math.max(0, limit - entry.timestamps.length);
  const oldestTimestamp = entry.timestamps[0] || now;
  const resetMs = Math.max(0, oldestTimestamp + windowMs - now);
  const retryAfterSeconds = Math.max(1, Math.ceil(resetMs / 1000));

  return {
    success: true,
    limit,
    remaining,
    resetMs,
    retryAfterSeconds,
  };
}

/**
 * Builds a 429 response with RFC standard rate limit headers.
 */
export function createRateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: 'Príliš veľa požiadaviek. Skúste to znova neskôr.',
      retryAfter: result.retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfterSeconds),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(Math.ceil((Date.now() + result.resetMs) / 1000)),
      },
    }
  );
}

/**
 * High-level guard to verify a request against rate limits.
 */
export function checkRequestRateLimit(
  req: Request,
  scope: RateLimitScope,
  customKey?: string,
  overrideOptions?: RateLimitOptions
): { allowed: true; result: RateLimitResult } | { allowed: false; response: NextResponse; result: RateLimitResult } {
  const ip = getClientIp(req);
  const key = `${scope}:${customKey || ip}`;
  const result = checkRateLimit(key, scope, overrideOptions);

  if (!result.success) {
    return {
      allowed: false,
      response: createRateLimitResponse(result),
      result,
    };
  }

  return {
    allowed: true,
    result,
  };
}
