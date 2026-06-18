import { createClient } from '@supabase/supabase-js';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse, NextRequest } from 'next/server';

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
    const supabase = createMiddlewareClient({ req, res });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Check platform_admins table with service-role key.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      // Cannot verify → deny access to be safe.
      console.error('[middleware] Missing env vars for platform admin check');
      return NextResponse.redirect(new URL('/404', req.url));
    }

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: platformAdmin } = await adminClient
      .from('platform_admins')
      .select('id')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (!platformAdmin) {
      // Authenticated but not a platform admin → 404 (don't reveal the route exists).
      return NextResponse.redirect(new URL('/404', req.url));
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
  const supabase = createMiddlewareClient({ req, res });
  await supabase.auth.getSession();

  // ---- Tenant lookup with cache ----
  let tenant = getCachedTenant(tenantSlug);

  if (tenant === undefined) {
    // Cache miss → hit the DB.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const tenantLookupKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !tenantLookupKey) {
      return NextResponse.redirect(new URL('/404', req.url));
    }

    const tenantLookupClient = createClient(supabaseUrl, tenantLookupKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data } = await tenantLookupClient
      .from('tenants')
      .select('id, slug, name')
      .eq('slug', tenantSlug)
      .maybeSingle();

    // Cache result — including null (unknown slug) to avoid repeated DB hits.
    tenant = data ?? null;
    setCachedTenant(tenantSlug, tenant);
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
