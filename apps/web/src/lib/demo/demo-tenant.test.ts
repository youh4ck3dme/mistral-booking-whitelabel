import { describe, expect, it } from 'vitest';

import { DEMO_TENANT, formatDemoPrice, getDemoServicesWithStaff } from './demo-tenant';

describe('demo tenant fixture', () => {
  it('describes the demo salon with the same slug and id as supabase/seed/002_demo_salon.sql', () => {
    expect(DEMO_TENANT.id).toBe('de000000-0000-4000-8000-000000000001');
    expect(DEMO_TENANT.slug).toBe('demo-salon');
    expect(DEMO_TENANT.locale).toBe('sk');
  });

  it('has 6 active services, each with a positive price, duration and at least one staff member', () => {
    const services = getDemoServicesWithStaff();
    expect(services).toHaveLength(6);
    for (const service of services) {
      expect(service.price).toBeGreaterThan(0);
      expect(service.durationMinutes).toBeGreaterThan(0);
      expect(service.staff.length).toBeGreaterThan(0);
    }
  });

  it('only links services to staff of the demo tenant', () => {
    const staffIds = new Set(DEMO_TENANT.staff.map((member) => member.id));
    for (const link of DEMO_TENANT.serviceStaff) {
      expect(staffIds.has(link.staffId)).toBe(true);
      expect(DEMO_TENANT.services.some((service) => service.id === link.serviceId)).toBe(true);
    }
  });

  it('formats prices in Slovak euro notation', () => {
    expect(formatDemoPrice(35)).toBe('35,00 €');
  });
});
