import { describe, expect, it } from 'vitest';
import {
  extractTenantSlug,
  getRewrittenPath,
  isStaticAsset,
  isSystemApiRoute,
  applySecurityHeaders,
  RESERVED_SUBDOMAINS,
} from './subdomain';
import { NextRequest, NextResponse } from 'next/server';

describe('extractTenantSlug', () => {
  it('returns null for empty or null hosts', () => {
    expect(extractTenantSlug(null)).toBeNull();
    expect(extractTenantSlug('')).toBeNull();
  });

  it('returns null for main localhost and 127.0.0.1 without subdomain', () => {
    expect(extractTenantSlug('localhost:3000')).toBeNull();
    expect(extractTenantSlug('localhost')).toBeNull();
    expect(extractTenantSlug('127.0.0.1:3000')).toBeNull();
    expect(extractTenantSlug('127.0.0.1')).toBeNull();
  });

  it('returns null for root domain and www on production', () => {
    expect(extractTenantSlug('nexify.sk')).toBeNull();
    expect(extractTenantSlug('www.nexify.sk')).toBeNull();
    expect(extractTenantSlug('nexify.sk:443')).toBeNull();
  });

  it('extracts slug from localhost subdomains', () => {
    expect(extractTenantSlug('barber-district.localhost:3000')).toBe('barber-district');
    expect(extractTenantSlug('salon-elite.localhost')).toBe('salon-elite');
  });

  it('extracts slug from root domain subdomains', () => {
    expect(extractTenantSlug('barber-district.nexify.sk')).toBe('barber-district');
    expect(extractTenantSlug('salon-elite.nexify.sk')).toBe('salon-elite');
  });

  it('extracts slug from Vercel deployment preview subdomains', () => {
    expect(extractTenantSlug('barber-district.mistral-booking.vercel.app')).toBe('barber-district');
  });

  it('returns null for root Vercel deployment without tenant subdomain', () => {
    expect(extractTenantSlug('mistral-booking.vercel.app')).toBeNull();
  });

  it('returns null for reserved subdomains like www, api, admin, platform', () => {
    for (const reserved of Array.from(RESERVED_SUBDOMAINS)) {
      expect(extractTenantSlug(`${reserved}.nexify.sk`)).toBeNull();
      expect(extractTenantSlug(`${reserved}.localhost:3000`)).toBeNull();
    }
  });

  it('extracts slug from custom multi-level domains', () => {
    expect(extractTenantSlug('rezervacie.salon-elite.sk')).toBe('rezervacie');
  });
});

describe('getRewrittenPath', () => {
  it('rewrites root "/" to tenant home "/[slug]"', () => {
    expect(getRewrittenPath('barber-district', '/')).toBe('/barber-district');
    expect(getRewrittenPath('barber-district', '')).toBe('/barber-district');
  });

  it('rewrites subpaths to tenant subpaths "/[slug]/[subpath]"', () => {
    expect(getRewrittenPath('barber-district', '/book')).toBe('/barber-district/book');
    expect(getRewrittenPath('barber-district', '/admin/services')).toBe('/barber-district/admin/services');
  });

  it('prevents double-prefixing if path already starts with slug', () => {
    expect(getRewrittenPath('barber-district', '/barber-district')).toBe('/barber-district');
    expect(getRewrittenPath('barber-district', '/barber-district/book')).toBe('/barber-district/book');
  });
});

describe('isStaticAsset', () => {
  it('identifies static paths and assets correctly', () => {
    expect(isStaticAsset('/_next/static/chunk.js')).toBe(true);
    expect(isStaticAsset('/favicon.ico')).toBe(true);
    expect(isStaticAsset('/assets/logo.png')).toBe(true);
    expect(isStaticAsset('/images/banner.webp')).toBe(true);
    expect(isStaticAsset('/styles.css')).toBe(true);
    expect(isStaticAsset('/fonts/inter.woff2')).toBe(true);
  });

  it('returns false for regular application routes', () => {
    expect(isStaticAsset('/')).toBe(false);
    expect(isStaticAsset('/book')).toBe(false);
    expect(isStaticAsset('/barber-district/book')).toBe(false);
    expect(isStaticAsset('/api/chat')).toBe(false);
  });
});

describe('isSystemApiRoute', () => {
  it('identifies cron, auth and health API routes', () => {
    expect(isSystemApiRoute('/api/cron/process-outbox')).toBe(true);
    expect(isSystemApiRoute('/api/auth/callback')).toBe(true);
    expect(isSystemApiRoute('/api/health')).toBe(true);
  });

  it('returns false for user-facing API routes', () => {
    expect(isSystemApiRoute('/api/chat')).toBe(false);
    expect(isSystemApiRoute('/api/bookings')).toBe(false);
  });
});

describe('applySecurityHeaders', () => {
  it('adds standard security headers for normal pages', () => {
    const req = new NextRequest('https://nexify.sk/');
    const res = NextResponse.next();
    const secured = applySecurityHeaders(res, req);

    expect(secured.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(secured.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(secured.headers.get('X-Frame-Options')).toBe('DENY');
  });

  it('sets CSP frame-ancestors and CORS headers for embed widgets', () => {
    const req = new NextRequest('https://nexify.sk/embed?embed=true');
    const res = NextResponse.next();
    const secured = applySecurityHeaders(res, req);

    expect(secured.headers.get('Content-Security-Policy')).toBe('frame-ancestors *;');
    expect(secured.headers.get('X-Frame-Options')).toBeNull();
    expect(secured.headers.get('Access-Control-Allow-Origin')).toBeDefined();
  });

  it('sets CORS headers for /api/chat', () => {
    const req = new NextRequest('https://nexify.sk/api/chat');
    const res = NextResponse.next();
    const secured = applySecurityHeaders(res, req);

    expect(secured.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(secured.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });
});
