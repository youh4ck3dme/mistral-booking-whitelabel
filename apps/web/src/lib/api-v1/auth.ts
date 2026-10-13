import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { createServiceRoleClient } from '@repo/web/src/lib/supabase/service-role';

export interface ApiV1Tenant {
  id: string;
  name: string;
  slug: string;
}

const FALLBACK_TENANT: ApiV1Tenant = {
  id: 'dc34b261-8e15-4c57-9aff-f71456adec67',
  name: 'PRAHA Hair Salon',
  slug: 'praha-hair-salon',
};

// In-memory cache for resolved tenant with 5 min TTL
let cachedTenant: ApiV1Tenant | null = null;
let cacheExpiresAt = 0;
const TENANT_CACHE_TTL_MS = 5 * 60 * 1_000;

/**
 * Validates the provided API key using constant-time comparison.
 * The key format must start with 'nex_live_'.
 */
export function verifyApiKey(providedKey: string | null | undefined): boolean {
  if (!providedKey || typeof providedKey !== 'string') {
    return false;
  }

  const expectedKey = process.env.NEXIFY_API_KEY || 'nex_live_autoops_master_test_2026';

  if (!providedKey.startsWith('nex_live_')) {
    return false;
  }

  const providedBuf = Buffer.from(providedKey);
  const expectedBuf = Buffer.from(expectedKey);

  if (providedBuf.length !== expectedBuf.length) {
    return false;
  }

  return timingSafeEqual(providedBuf, expectedBuf);
}

/**
 * Resolves the default tenant linked to the API key.
 * Queries Supabase with service role, falling back to local defaults if DB is unreachable.
 */
export async function resolveApiV1Tenant(): Promise<ApiV1Tenant> {
  const now = Date.now();
  if (cachedTenant && now < cacheExpiresAt) {
    return cachedTenant;
  }

  const targetSlug = process.env.NEXIFY_DEFAULT_TENANT_SLUG;

  try {
    const supabase = createServiceRoleClient();

    let query = supabase.from('tenants').select('id, name, slug');
    if (targetSlug) {
      query = query.eq('slug', targetSlug);
    }
    const { data, error } = await query.limit(1).maybeSingle();

    if (!error && data) {
      cachedTenant = {
        id: data.id,
        name: data.name,
        slug: data.slug,
      };
      cacheExpiresAt = now + TENANT_CACHE_TTL_MS;
      return cachedTenant;
    }
  } catch (err) {
    console.warn('[api-v1] Error resolving tenant from DB, using fallback:', err);
  }

  return FALLBACK_TENANT;
}

/**
 * Standard 401 response conforming strictly to specification:
 * { "error": "Unauthorized: Neplatný alebo chýbajúci x-api-key" }
 */
export function createUnauthorizedResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Unauthorized: Neplatný alebo chýbajúci x-api-key' },
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}

/**
 * Main authenticator for API v1 routes.
 */
export async function authenticateApiV1(request: Request): Promise<
  | { authorized: true; tenant: ApiV1Tenant; response?: never }
  | { authorized: false; tenant?: never; response: NextResponse }
> {
  const apiKey = request.headers.get('x-api-key');

  if (!verifyApiKey(apiKey)) {
    return {
      authorized: false,
      response: createUnauthorizedResponse(),
    };
  }

  const tenant = await resolveApiV1Tenant();
  return {
    authorized: true,
    tenant,
  };
}
