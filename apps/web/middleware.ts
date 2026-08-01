import { updateSession } from '@repo/web/src/utils/supabase/middleware';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Configuration validation
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file. ' +
    'Get these values from your Supabase project: https://app.supabase.com/project/_/settings/api'
  );
}

// ---------------------------------------------------------------------------
// Tenant slug → tenant row cache
// ---------------------------------------------------------------------------
// Edge/Node processes are long-lived on Vercel; a module-level Map survives
// across requests on the same instance. TTL prevents stale-tenant data from
// sitting forever. Unknown slugs are also cached (null) to avoid hammering
// the DB on 404 routes.
// ---------------------------------------------------------------------------
type CachedTenant = { id: string; slug: string; name: string } | null;

interface TenantCacheEntry {
  tenant: CachedTenant;
  expiresAt: number;
}

const tenantCache = new Map<string, TenantCacheEntry>();
const TENANT_CACHE_TTL_MS = 5 * 60 * 1_000; // 5 minutes

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

// ---------------------------------------------------------------------------
// Route classification
// ---------------------------------------------------------------------------
const PUBLIC_ROUTES = new Set(['/', '/404', '/login', '/signup', '/forgot-password', '/reset-password', '/privacy']);
const API_PREFIX = '/api';

// /platform is no longer in the skip list — it needs its own auth check below.
const ALWAYS_PUBLIC_PREFIXES = [API_PREFIX];

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Pass static assets and Next.js internals through immediately.
  if (pathname.includes('.')) {
    return NextResponse.next();
  }

  // Always-public prefixes (API routes handle their own auth).
  if (ALWAYS_PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  // -------------------------------------------------------------------------
  // /platform — platform-level super-admin guard
  // -------------------------------------------------------------------------
  // The route is NOT in the public list, so we reach here.
  // We verify the session and then check the platform_admins table via a
  // service-role client (bypasses RLS). If the check fails, redirect to /login
  // (unauthenticated) or /404 (authenticated but not a platform admin).
  // -------------------------------------------------------------------------
  if (pathname === '/platform' || pathname.startsWith('/platform/')) {
    const res = NextResponse.next();
    
    // Použijeme updateSession z utils
    const supabase = updateSession(req, res);
    
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Check platform_admins table with service-role key.
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !serviceKey) {
      // Cannot verify → deny access to be safe.
      console.error('[middleware] Missing env vars for platform admin check');
      return NextResponse.redirect(new URL('/404', req.url));
    }

    try {
      const adminClient = createServerClient(SUPABASE_URL, serviceKey, {
        cookies: {
          getAll() { return req.cookies.getAll() },
          setAll() {}
        }
      });

      const { data: platformAdmin } = await adminClient
        .from('platform_admins')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (!platformAdmin) {
        // Authenticated but not a platform admin → 404
        return NextResponse.redirect(new URL('/404', req.url));
      }
    } catch (e) {
      console.error('[middleware] Failed to verify platform admin:', e);
      return NextResponse.redirect(new URL('/500', req.url));
    }

    // Inject platform-admin context header for downstream Server Components.
    const headers = new Headers(res.headers);
    headers.set('x-platform-admin', 'true');
    headers.set('x-platform-user-id', session.user.id);

    return NextResponse.next({ request: { headers } });
  }

  // -------------------------------------------------------------------------
  // Public routes — no tenant resolution needed
  // -------------------------------------------------------------------------
  if (PUBLIC_ROUTES.has(pathname)) {
    return NextResponse.next();
  }

  // -------------------------------------------------------------------------
  // Tenant routes — /[tenantSlug]/...
  // -------------------------------------------------------------------------
  const tenantSlug = pathname.split('/').filter(Boolean)[0];

  if (!tenantSlug) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Refresh Supabase session cookies.
  const res = NextResponse.next();
  const supabase = updateSession(req, res);
  await supabase.auth.getSession();

  // ---- Tenant lookup with cache ----
  let tenant = getCachedTenant(tenantSlug);

  if (tenant === undefined) {
    // Cache miss → hit the DB.
    const tenantLookupKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !tenantLookupKey) {
      return NextResponse.redirect(new URL('/404', req.url));
    }

    try {
      const tenantLookupClient = createServerClient(SUPABASE_URL, tenantLookupKey, {
        cookies: {
          getAll() { return req.cookies.getAll() },
          setAll() {}
        }
      });

      const { data } = await tenantLookupClient
        .from('tenants')
        .select('id, slug, name')
        .eq('slug', tenantSlug)
        .maybeSingle();

      // Cache result — including null (unknown slug) to avoid repeated DB hits.
      tenant = data ?? null;
      setCachedTenant(tenantSlug, tenant);
    } catch (e) {
      console.error('[middleware] Failed to lookup tenant:', e);
      // Return 500 error instead of failing hard
      return NextResponse.redirect(new URL('/500', req.url));
    }
  }

  if (!tenant) {
    return NextResponse.redirect(new URL('/404', req.url));
  }

  // Inject tenant context headers for downstream Server Components and layouts.
  const headers = new Headers(res.headers);
  headers.set('x-tenant-id', tenant.id);
  headers.set('x-tenant-slug', tenant.slug);
  headers.set('x-tenant-name', tenant.name);

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|$).*)'],
};
