import { updateSession } from '@repo/web/src/utils/supabase/middleware';
import { checkRequestRateLimit } from '@repo/web/src/lib/security/rate-limit';
import {
  extractTenantSlug,
  getRewrittenPath,
  applySecurityHeaders,
  isStaticAsset,
  isSystemApiRoute,
} from '@repo/web/src/lib/routing/subdomain';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Configuration validation
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ---------------------------------------------------------------------------
// Tenant slug -> tenant row cache (5 min TTL)
// ---------------------------------------------------------------------------
type CachedTenant = { id: string; slug: string; name: string } | null;

interface TenantCacheEntry {
  tenant: CachedTenant;
  expiresAt: number;
}

const tenantCache = new Map<string, TenantCacheEntry>();
const TENANT_CACHE_TTL_MS = 5 * 60 * 1_000;

function getCachedTenant(slug: string): CachedTenant | undefined {
  const entry = tenantCache.get(slug);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    tenantCache.delete(slug);
    return undefined;
  }
  return entry.tenant;
}

function setCachedTenant(slug: string, tenant: CachedTenant): void {
  tenantCache.set(slug, { tenant, expiresAt: Date.now() + TENANT_CACHE_TTL_MS });
}

async function lookupTenant(slug: string): Promise<CachedTenant> {
  const cached = getCachedTenant(slug);
  if (cached !== undefined) {
    return cached;
  }

  const lookupKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !lookupKey) {
    return null;
  }

  try {
    const client = createServerClient(SUPABASE_URL, lookupKey, {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    });

    const { data } = await client
      .from('tenants')
      .select('id, slug, name')
      .eq('slug', slug)
      .maybeSingle();

    const tenant = data ?? null;
    setCachedTenant(slug, tenant);
    return tenant;
  } catch (err) {
    console.error('[middleware] Failed to lookup tenant:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Route classification
// ---------------------------------------------------------------------------
const AUTH_ROUTES = new Set(['/login', '/signup', '/forgot-password', '/reset-password']);
const PUBLIC_MARKETING_ROUTES = new Set([
  '/',
  '/404',
  '/500',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/privacy',
  '/terms',
]);

// ---------------------------------------------------------------------------
// Middleware Implementation
// ---------------------------------------------------------------------------
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';

  // 1. Pass static assets and Next.js internals through immediately
  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  // 2. CORS Preflight requests for API routes and embed widgets
  if (req.method === 'OPTIONS') {
    const preflight = new NextResponse(null, { status: 204 });
    return applySecurityHeaders(preflight, req);
  }

  // 3. System API routes (/api/cron/*, /api/auth/*) bypass tenant routing
  if (isSystemApiRoute(pathname)) {
    return applySecurityHeaders(NextResponse.next(), req);
  }

  // 4. Rate limit authentication endpoints (brute-force defense)
  if (AUTH_ROUTES.has(pathname)) {
    const rateLimitGuard = checkRequestRateLimit(req, 'auth');
    if (!rateLimitGuard.allowed) {
      return applySecurityHeaders(rateLimitGuard.response, req);
    }
  }

  // 5. General API routes (/api/*)
  if (pathname.startsWith('/api/')) {
    const tenantSlug = extractTenantSlug(host);
    const requestHeaders = new Headers(req.headers);
    if (tenantSlug) {
      requestHeaders.set('x-tenant-slug', tenantSlug);
      requestHeaders.set('x-forwarded-host', host);
    }
    return applySecurityHeaders(
      NextResponse.next({ request: { headers: requestHeaders } }),
      req
    );
  }

  // 6. Platform-level super-admin guard (/platform, /platform/*)
  if (pathname === '/platform' || pathname.startsWith('/platform/')) {
    const res = NextResponse.next();
    const supabase = updateSession(req, res);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return applySecurityHeaders(NextResponse.redirect(new URL('/login', req.url)), req);
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !serviceKey) {
      console.error('[middleware] Missing env vars for platform admin check');
      return applySecurityHeaders(NextResponse.redirect(new URL('/404', req.url)), req);
    }

    try {
      const adminClient = createServerClient(SUPABASE_URL, serviceKey, {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll() {},
        },
      });

      const { data: platformAdmin } = await adminClient
        .from('platform_admins')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!platformAdmin) {
        return applySecurityHeaders(NextResponse.redirect(new URL('/404', req.url)), req);
      }
    } catch (e) {
      console.error('[middleware] Failed to verify platform admin:', e);
      return applySecurityHeaders(NextResponse.redirect(new URL('/500', req.url)), req);
    }

    const headers = new Headers(res.headers);
    headers.set('x-platform-admin', 'true');
    headers.set('x-platform-user-id', user.id);

    return applySecurityHeaders(NextResponse.next({ request: { headers } }), req);
  }

  // 7. Multi-Tenant Subdomain Routing
  const tenantSlugFromHost = extractTenantSlug(host);

  if (tenantSlugFromHost) {
    const tenant = await lookupTenant(tenantSlugFromHost);
    if (!tenant) {
      return applySecurityHeaders(NextResponse.rewrite(new URL('/404', req.url)), req);
    }

    // Refresh Supabase session
    const res = NextResponse.next();
    const supabase = updateSession(req, res);
    await supabase.auth.getUser();

    // Context headers for downstream Server Components
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-tenant-id', tenant.id);
    requestHeaders.set('x-tenant-slug', tenant.slug);
    requestHeaders.set('x-tenant-name', tenant.name);
    requestHeaders.set('x-forwarded-host', host);

    // Compute internal rewrite target (e.g. /book -> /barber-district/book)
    const targetPath = getRewrittenPath(tenant.slug, pathname);
    const rewriteUrl = new URL(targetPath, req.url);

    const response = NextResponse.rewrite(rewriteUrl, {
      request: { headers: requestHeaders },
    });

    // Copy refreshed Supabase cookies
    res.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value, cookie);
    });

    return applySecurityHeaders(response, req);
  }

  // 8. Main Domain Routing (e.g. nexify.sk, localhost:3000, *.vercel.app root)
  if (PUBLIC_MARKETING_ROUTES.has(pathname)) {
    return applySecurityHeaders(NextResponse.next(), req);
  }

  // Direct path-based tenant route (e.g. /barber-district/book)
  const pathSlug = pathname.split('/').filter(Boolean)[0];
  if (!pathSlug) {
    return applySecurityHeaders(NextResponse.redirect(new URL('/', req.url)), req);
  }

  const tenant = await lookupTenant(pathSlug);
  if (!tenant) {
    return applySecurityHeaders(NextResponse.rewrite(new URL('/404', req.url)), req);
  }

  const res = NextResponse.next();
  const supabase = updateSession(req, res);
  await supabase.auth.getUser();

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-tenant-id', tenant.id);
  requestHeaders.set('x-tenant-slug', tenant.slug);
  requestHeaders.set('x-tenant-name', tenant.name);
  requestHeaders.set('x-forwarded-host', host);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  res.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie.name, cookie.value, cookie);
  });

  return applySecurityHeaders(response, req);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - static asset extensions (.svg, .png, .jpg, .jpeg, .gif, .webp, .ico)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
