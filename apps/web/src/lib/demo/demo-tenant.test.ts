import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { DEMO_TENANT_IDS } from './demo-tenant-ids';
import { DEMO_TENANT, formatDemoPrice, getDemoServicesWithStaff } from './demo-tenant';

const seedPath = path.resolve(__dirname, '../../../../../supabase/seed/002_demo_salon.sql');

function collectStringValues(value: unknown, into: string[] = []): string[] {
  if (typeof value === 'string') {
    into.push(value);
    return into;
  }
  if (value && typeof value === 'object') {
    for (const child of Object.values(value as Record<string, unknown>)) {
      collectStringValues(child, into);
    }
  }
  return into;
}

describe('demo tenant fixture', () => {
  it('uses the shared DEMO_TENANT_IDS constants for slug and ids', () => {
    expect(DEMO_TENANT.id).toBe(DEMO_TENANT_IDS.tenant);
    expect(DEMO_TENANT.slug).toBe(DEMO_TENANT_IDS.slug);
    expect(DEMO_TENANT.locale).toBe('sk');
    expect(DEMO_TENANT.staff.map((member) => member.id)).toEqual([
      DEMO_TENANT_IDS.staff.lucia,
      DEMO_TENANT_IDS.staff.martin,
      DEMO_TENANT_IDS.staff.eva,
    ]);
    expect(DEMO_TENANT.services.map((service) => service.id)).toEqual([
      DEMO_TENANT_IDS.services.damskyStrih,
      DEMO_TENANT_IDS.services.farbenie,
      DEMO_TENANT_IDS.services.panskyStrih,
      DEMO_TENANT_IDS.services.brada,
      DEMO_TENANT_IDS.services.plet,
      DEMO_TENANT_IDS.services.manikura,
    ]);
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

  it('stays in sync with supabase/seed/002_demo_salon.sql when that seed is in the tree', () => {
    // Seed lives in PR #7 (feat/b2-demo-tenant-seed). After it is merged, this
    // assertion catches UUID / slug / price drift between the fixture and the SQL.
    if (!existsSync(seedPath)) {
      expect(seedPath.endsWith('supabase/seed/002_demo_salon.sql')).toBe(true);
      return;
    }
    const sql = readFileSync(seedPath, 'utf8');
    for (const id of collectStringValues(DEMO_TENANT_IDS)) {
      expect(sql, `seed is missing ${id}`).toContain(id);
    }
    for (const service of DEMO_TENANT.services) {
      expect(sql, `seed is missing service name ${service.name}`).toContain(service.name);
      expect(sql, `seed is missing price ${service.price} for ${service.name}`).toContain(
        service.price.toFixed(2)
      );
    }
  });
});
