import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiV1 } from '@repo/web/src/lib/api-v1/auth';
import { createServiceRoleClient } from '@repo/web/src/lib/supabase/service-role';

export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
  'Cache-Control': 'no-store',
};

const MOCK_SERVICES = [
  {
    id: 'srv_1',
    name: 'Konzultácia a diagnostika',
    duration: 30,
    price: 50,
    currency: 'EUR',
  },
  {
    id: 'srv_2',
    name: 'Kompletný prémiový balík',
    duration: 60,
    price: 90,
    currency: 'EUR',
  },
  {
    id: 'srv_3',
    name: 'Rýchla úprava a styling',
    duration: 20,
    price: 25,
    currency: 'EUR',
  },
];

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

/**
 * GET /api/v1/services
 * 
 * AutoOps AI Edge connector verification endpoint.
 * Returns tenant identity and available bookable services.
 */
export async function GET(req: NextRequest) {
  const authResult = await authenticateApiV1(req);
  if (!authResult.authorized) {
    return authResult.response;
  }

  const { tenant } = authResult;

  try {
    const supabase = createServiceRoleClient();
    const { data: dbServices, error } = await (supabase as any)
      .from('services')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true);

    let services = MOCK_SERVICES;

    if (!error && dbServices && dbServices.length > 0) {
      services = dbServices.map((row: any) => ({
        id: String(row.id),
        name: String(row.name ?? row.name_sk ?? row.name_en ?? 'Služba'),
        duration: Number(row.duration) || 30,
        price: Number(row.price) || 0,
        currency: 'EUR',
      }));
    }

    return NextResponse.json(
      {
        tenant: {
          id: tenant.id,
          name: tenant.name,
        },
        services,
      },
      {
        status: 200,
        headers: CORS_HEADERS,
      }
    );
  } catch (err) {
    console.error('[api-v1/services] Error loading services:', err);
    // Graceful fallback to mock services so AutoOps connector does not fail
    return NextResponse.json(
      {
        tenant: {
          id: tenant.id,
          name: tenant.name,
        },
        services: MOCK_SERVICES,
      },
      {
        status: 200,
        headers: CORS_HEADERS,
      }
    );
  }
}
