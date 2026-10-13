import { NextResponse, type NextRequest } from 'next/server';

export const RESERVED_SUBDOMAINS = new Set([
  'www',
  'api',
  'admin',
  'platform',
  'app',
  'status',
  'assets',
  'static',
  'mail',
  'auth',
  'portal',
]);

/**
 * Extracts a tenant slug from the Host header (e.g. barber-district.nexify.sk -> barber-district).
 * Returns null if the request is for the root domain, localhost root, or a reserved subdomain.
 */
export function extractTenantSlug(host: string | null): string | null {
  if (!host) return null;

  // Strip port (e.g., localhost:3000 -> localhost, barber.localhost:3000 -> barber.localhost)
  const hostname = host.split(':')[0].toLowerCase().trim();
  if (!hostname) return null;

  const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'nexify.sk').toLowerCase();

  // Root platform hostnames (no tenant subdomain)
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === rootDomain ||
    hostname === `www.${rootDomain}` ||
    hostname === 'nexify.sk' ||
    hostname === 'www.nexify.sk'
  ) {
    return null;
  }

  // 1. Localhost subdomain: e.g. "barber-district.localhost"
  if (hostname.endsWith('.localhost')) {
    const slug = hostname.replace('.localhost', '');
    return slug && !RESERVED_SUBDOMAINS.has(slug) ? slug : null;
  }

  // 2. Root domain subdomain: e.g. "barber-district.nexify.sk"
  if (hostname.endsWith(`.${rootDomain}`)) {
    const slug = hostname.replace(`.${rootDomain}`, '');
    return slug && !RESERVED_SUBDOMAINS.has(slug) ? slug : null;
  }

  // 3. Vercel deployment preview / production: e.g. "barber-district.mistral-booking.vercel.app"
  if (hostname.endsWith('.vercel.app')) {
    const withoutSuffix = hostname.replace('.vercel.app', '');
    const parts = withoutSuffix.split('.');
    if (parts.length > 1) {
      const slug = parts[0];
      return slug && !RESERVED_SUBDOMAINS.has(slug) ? slug : null;
    }
    // Single deployment root (e.g. "mistral-booking.vercel.app")
    return null;
  }

  // 4. Custom domain or multi-level subdomain: e.g. "rezervacie.barbershop.sk"
  const parts = hostname.split('.');
  if (parts.length > 2) {
    const candidate = parts[0];
    return candidate && !RESERVED_SUBDOMAINS.has(candidate) ? candidate : null;
  }

  return null;
}

/**
 * Computes internal Next.js filesystem path rewrite for tenant subdomains.
 * E.g., slug="barber-district", pathname="/book" -> "/barber-district/book".
 * Prevents double-prefixing if pathname already starts with "/barber-district".
 */
export function getRewrittenPath(tenantSlug: string, pathname: string): string {
  if (pathname === `/${tenantSlug}` || pathname.startsWith(`/${tenantSlug}/`)) {
    return pathname;
  }

  if (pathname === '/' || pathname === '') {
    return `/${tenantSlug}`;
  }

  const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `/${tenantSlug}${cleanPath}`;
}

/**
 * Checks whether a given path is a static asset or Next.js internal file.
 */
export function isStaticAsset(pathname: string): boolean {
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/fonts') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/manifest.webmanifest'
  ) {
    return true;
  }

  return /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$/i.test(pathname);
}

/**
 * Checks whether a path is a system API route that must bypass tenant rewriting.
 */
export function isSystemApiRoute(pathname: string): boolean {
  return (
    pathname.startsWith('/api/cron') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/v1') ||
    pathname === '/api/health'
  );
}

/**
 * Applies security headers (CSP frame-ancestors, X-Content-Type-Options, Referrer-Policy, CORS).
 */
export function applySecurityHeaders(res: NextResponse, req: NextRequest): NextResponse {
  // 1. Core security headers
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  const { pathname, searchParams } = req.nextUrl;
  const isEmbed = pathname.startsWith('/embed') || searchParams.get('embed') === 'true';

  if (!isEmbed) {
    res.headers.set('X-Frame-Options', 'DENY');
  } else {
    // For embeds/widgets, allow iframe embedding
    res.headers.set('Content-Security-Policy', 'frame-ancestors *;');
  }

  // 2. CORS configuration for /api/chat, /api/*, and embed routes
  if (pathname.startsWith('/api/') || isEmbed) {
    const origin = req.headers.get('origin') || '*';
    res.headers.set('Access-Control-Allow-Origin', origin);
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, x-api-key, x-tenant-slug, x-tenant-id, x-forwarded-host'
    );
    res.headers.set('Access-Control-Max-Age', '86400');
  }

  return res;
}
