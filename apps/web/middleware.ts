import { createClient } from '@supabase/supabase-js';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse, NextRequest } from 'next/server';

const PUBLIC_ROUTES = new Set(['/', '/404', '/login', '/signup', '/forgot-password', '/reset-password']);
const PUBLIC_ROUTE_PREFIXES = ['/api', '/platform'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.includes('.')) {
    return NextResponse.next();
  }

  // Skip middleware for public routes, API routes, or platform admin
  if (
    PUBLIC_ROUTES.has(pathname) ||
    PUBLIC_ROUTE_PREFIXES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
  ) {
    return NextResponse.next();
  }

  // Extract tenant slug from the URL
  const tenantSlug = pathname.split('/').filter(Boolean)[0];

  // If no tenant slug in URL, redirect to home
  if (!tenantSlug) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Create Supabase client for server-side auth
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  await supabase.auth.getSession();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const tenantLookupKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !tenantLookupKey) {
    return NextResponse.redirect(new URL('/404', req.url));
  }

  const tenantLookupClient = createClient(supabaseUrl, tenantLookupKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: tenant } = await tenantLookupClient
    .from('tenants')
    .select('id, slug, name')
    .eq('slug', tenantSlug)
    .maybeSingle();

  if (!tenant) {
    return NextResponse.redirect(new URL('/404', req.url));
  }

  // Add tenant context to headers for downstream use
  const headers = new Headers(res.headers);
  headers.set('x-tenant-id', tenant.id);
  headers.set('x-tenant-slug', tenant.slug);
  headers.set('x-tenant-name', tenant.name);

  // Update the response with tenant context
  return NextResponse.next({
    request: {
      headers,
    },
  });
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|$).*)'],
};
