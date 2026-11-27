/**
 * Canonical IDs and slug for the sample salon shown on /demo.
 *
 * Keep these in sync with supabase/seed/002_demo_salon.sql (PR #7 / branch
 * feat/b2-demo-tenant-seed). SQL cannot import this module, so both files
 * must use the same literals. demo-tenant.test.ts fails if they drift once
 * the seed file is present in the tree.
 */
export const DEMO_TENANT_IDS = {
  slug: 'demo-salon',
  tenant: 'de000000-0000-4000-8000-000000000001',
  branding: 'de000000-0000-4000-8000-000000000101',
  slots: 'de000000-0000-4000-8000-000000000201',
  staff: {
    lucia: 'de000000-0000-4000-8000-000000000301',
    martin: 'de000000-0000-4000-8000-000000000302',
    eva: 'de000000-0000-4000-8000-000000000303',
  },
  services: {
    damskyStrih: 'de000000-0000-4000-8000-000000000501',
    farbenie: 'de000000-0000-4000-8000-000000000502',
    panskyStrih: 'de000000-0000-4000-8000-000000000503',
    brada: 'de000000-0000-4000-8000-000000000504',
    plet: 'de000000-0000-4000-8000-000000000505',
    manikura: 'de000000-0000-4000-8000-000000000506',
  },
} as const;
