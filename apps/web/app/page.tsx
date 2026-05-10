import type { Metadata } from 'next';

import { createServerClient } from '@repo/supabase';
import type { Service, Tenant, TenantBranding } from '@repo/core';

import BookingLandingPage, { type FeaturedServiceCard } from './booking-landing';

type VerticalKey =
  | 'barber'
  | 'beauty'
  | 'massage'
  | 'fitness'
  | 'physio'
  | 'clinic'
  | 'tattoo'
  | 'default';

const verticalAccents: Record<VerticalKey, string> = {
  barber: '#ff5a5f',
  beauty: '#ff6fb5',
  massage: '#6ec8ff',
  fitness: '#8dff8a',
  physio: '#7c9bff',
  clinic: '#5aa8ff',
  tattoo: '#f59e0b',
  default: '#9b8cff',
};

export const metadata: Metadata = {
  title: 'Book Your Perfect Service | NEXIFY TECH CENTER',
  description:
    'Premium multi-tenant booking experience for clinics, wellness studios, beauty brands, fitness operators, and service-led teams.',
};

export const dynamic = 'force-dynamic';

function inferVertical(service: Pick<Service, 'name' | 'description'>, tenantName?: string): VerticalKey {
  const haystack = `${service.name} ${service.description ?? ''} ${tenantName ?? ''}`.toLowerCase();

  if (haystack.includes('barber') || haystack.includes('hair') || haystack.includes('cut')) {
    return 'barber';
  }
  if (haystack.includes('beauty') || haystack.includes('nail') || haystack.includes('skin')) {
    return 'beauty';
  }
  if (haystack.includes('massage') || haystack.includes('wellness') || haystack.includes('spa')) {
    return 'massage';
  }
  if (haystack.includes('fitness') || haystack.includes('training') || haystack.includes('gym')) {
    return 'fitness';
  }
  if (haystack.includes('physio') || haystack.includes('rehab') || haystack.includes('therapy')) {
    return 'physio';
  }
  if (haystack.includes('clinic') || haystack.includes('medical') || haystack.includes('consult')) {
    return 'clinic';
  }
  if (haystack.includes('tattoo') || haystack.includes('ink') || haystack.includes('piercing')) {
    return 'tattoo';
  }

  return 'default';
}

async function getLandingData(): Promise<{
  featuredServices: FeaturedServiceCard[];
  tenants: Tenant[];
  branding: TenantBranding[];
}> {
  const supabase = createServerClient();

  try {
    const [{ data: tenants }, { data: branding }, { data: services }] = await Promise.all([
      supabase.from('tenants').select('*').order('created_at', { ascending: true }).limit(12),
      supabase.from('tenant_branding').select('*'),
      supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(12),
    ]);

    const safeTenants = tenants ?? [];
    const safeBranding = branding ?? [];
    const tenantsById = new Map(safeTenants.map((tenant) => [tenant.id, tenant]));
    const brandingByTenant = new Map(safeBranding.map((entry) => [entry.tenant_id, entry]));

    const featuredServices: FeaturedServiceCard[] = (services ?? []).map((service) => {
      const tenant = tenantsById.get(service.tenant_id);
      const brand = brandingByTenant.get(service.tenant_id);
      const vertical = inferVertical(service, tenant?.name);

      return {
        ...service,
        accent: brand?.primary_color ?? verticalAccents[vertical],
        tenantName: tenant?.name ?? 'Independent studio',
        tenantSlug: tenant?.slug ?? '',
        vertical,
      };
    });

    return {
      featuredServices,
      tenants: safeTenants,
      branding: safeBranding,
    };
  } catch {
    return {
      featuredServices: [],
      tenants: [],
      branding: [],
    };
  }
}

export default async function HomePage() {
  const { featuredServices, tenants, branding } = await getLandingData();

  return (
    <BookingLandingPage
      featuredServices={featuredServices}
      tenants={tenants}
      branding={branding}
    />
  );
}
