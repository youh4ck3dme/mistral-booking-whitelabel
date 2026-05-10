import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@repo/supabase';

// List of public routes that don't require tenant resolution
const PUBLIC_ROUTES = ['/', '/login', '/signup', '/api'];
const PLATFORM_ROUTES = ['/platform'];

// Tenant slugs that exist in the system (could be fetched from DB in production)
const VALID_TENANT_SLUGS = ['demo-clinic', 'wellness-center'];

export async function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;

  // Skip middleware for public routes, API routes, or platform admin
  if (
    PUBLIC_ROUTES.some((route) => pathname.startsWith(route)) ||
    PLATFORM_ROUTES.some((route) => pathname.startsWith(route))
  ) {
    return NextResponse.next();
  }

  // Extract tenant slug from the URL
  const tenantSlug = pathname.split('/')[1];

  // If no tenant slug in URL, redirect to home
  if (!tenantSlug) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Check if tenant exists (basic validation - in production, query DB)
  if (!VALID_TENANT_SLUGS.includes(tenantSlug)) {
    return NextResponse.redirect(new URL('/404', req.url));
  }

  // Create Supabase client for server-side auth
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Get session for RLS context
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Set tenant context for RLS (this is a placeholder - actual RLS is handled in Supabase)
  // In production, you would set a cookie or header with the tenant ID
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, slug, name')
    .eq('slug', tenantSlug)
    .single();

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
