import { describe, expect, it } from 'vitest';
import nextConfig from '../../../next.config.js';

describe('Security Headers (SEC-8)', () => {
  it('defines headers function in next.config.js', () => {
    expect(typeof nextConfig.headers).toBe('function');
  });

  it('provides security headers on all routes', async () => {
    if (!nextConfig.headers) {
      throw new Error('nextConfig.headers must be defined');
    }

    const headersConfig = await nextConfig.headers();
    const globalRoute = headersConfig.find((entry: { source: string }) => entry.source === '/:path*');
    expect(globalRoute).toBeDefined();

    if (!globalRoute) {
      throw new Error('globalRoute must be defined');
    }

    const headerMap = new Map(
      globalRoute.headers.map((h: { key: string; value: string }) => [h.key, h.value])
    );

    expect(headerMap.get('X-Frame-Options')).toBe('DENY');
    expect(headerMap.get('X-Content-Type-Options')).toBe('nosniff');
    expect(headerMap.get('Strict-Transport-Security')).toContain('max-age=');
    expect(headerMap.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(headerMap.get('Permissions-Policy')).toContain('camera=()');

    const csp = headerMap.get('Content-Security-Policy');
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).toContain("frame-ancestors 'none'");
  });
});
