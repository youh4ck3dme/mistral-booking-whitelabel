import type { Metadata } from 'next';

import { createServerClient } from '@repo/supabase';
import type { Tenant, TenantBranding } from '@repo/core';
import {
  type VerticalKey,
  verticalRouteList,
} from '@repo/web/src/lib/booking/vertical-routing';

import BookingLandingPage, { type FeaturedServiceCard } from './booking-landing';

export const metadata: Metadata = {
  title: 'Book Your Perfect Service | NEXIFY TECH CENTER',
  description:
    'Premium multi-tenant booking experience for clinics, wellness studios, beauty brands, fitness operators, and service-led teams.',
};

export const dynamic = 'force-dynamic';

async function getLandingData(): Promise<{
  featuredServices: FeaturedServiceCard[];
  tenants: Tenant[];
  branding: TenantBranding[];
}> {
  const supabase = createServerClient();
  const serviceIds = verticalRouteList.map((vertical) => vertical.serviceId);

  try {
    const [{ data: tenants }, { data: branding }, { data: services }] = await Promise.all([
      supabase.from('tenants').select('*').order('created_at', { ascending: true }).limit(12),
      supabase.from('tenant_branding').select('*'),
      supabase
        .from('services')
        .select('*')
        .in('id', serviceIds)
        .eq('is_active', true)
        .order('created_at', { ascending: true }),
    ]);

    const safeTenants = tenants ?? [];
    const safeBranding = branding ?? [];
    const tenantsBySlug = new Map(safeTenants.map((tenant) => [tenant.slug, tenant]));
    const brandingByTenant = new Map(safeBranding.map((entry) => [entry.tenant_id, entry]));
    const servicesById = new Map((services ?? []).map((service) => [service.id, service]));

    const featuredServices: FeaturedServiceCard[] = verticalRouteList.flatMap((vertical) => {
      const service = servicesById.get(vertical.serviceId);
      const tenant = tenantsBySlug.get(vertical.tenantSlug);

      if (!service || !tenant) {
        return [];
      }

      const brand = brandingByTenant.get(tenant.id);

      return [{
        ...service,
        accent: brand?.primary_color ?? vertical.accent,
        tenantName: tenant.name,
        tenantSlug: tenant.slug,
        vertical: vertical.id as VerticalKey,
      }];
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
