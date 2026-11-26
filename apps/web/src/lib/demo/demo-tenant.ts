/**
 * Static fixture of the demo salon shown on /demo.
 * Mirrors supabase/seed/002_demo_salon.sql (same ids and slug) so the page works without
 * a database; IDs come from demo-tenant-ids.ts, which must stay in sync with
 * supabase/seed/002_demo_salon.sql (see that file's header).
 */

import { DEMO_TENANT_IDS } from './demo-tenant-ids';

export interface DemoService {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
}

export interface DemoStaffMember {
  id: string;
  displayName: string;
  role: string;
  workingHours: string;
}

export interface DemoTenant {
  id: string;
  slug: string;
  name: string;
  locale: 'sk';
  timezone: string;
  primaryColor: string;
  openingHours: string;
  services: DemoService[];
  staff: DemoStaffMember[];
  serviceStaff: { serviceId: string; staffId: string }[];
}

export const DEMO_TENANT: DemoTenant = {
  id: DEMO_TENANT_IDS.tenant,
  slug: DEMO_TENANT_IDS.slug,
  name: 'Salón Aurora (demo)',
  locale: 'sk',
  timezone: 'Europe/Bratislava',
  primaryColor: '#C2410C',
  openingHours: 'Po – So, 09:00 – 19:00',
  services: [
    { id: DEMO_TENANT_IDS.services.damskyStrih, name: 'Dámsky strih a fúkaná', description: 'Konzultácia, umytie, strih a styling.', durationMinutes: 60, price: 35 },
    { id: DEMO_TENANT_IDS.services.farbenie, name: 'Farbenie vlasov', description: 'Celofarbenie vrátane strihu končekov.', durationMinutes: 120, price: 75 },
    { id: DEMO_TENANT_IDS.services.panskyStrih, name: 'Pánsky strih', description: 'Strih strojčekom a nožnicami, umytie.', durationMinutes: 30, price: 18 },
    { id: DEMO_TENANT_IDS.services.brada, name: 'Úprava brady', description: 'Tvarovanie brady, horúci uterák.', durationMinutes: 20, price: 12 },
    { id: DEMO_TENANT_IDS.services.plet, name: 'Kozmetické ošetrenie pleti', description: 'Čistenie, peeling, maska a masáž tváre.', durationMinutes: 75, price: 55 },
    { id: DEMO_TENANT_IDS.services.manikura, name: 'Manikúra', description: 'Klasická manikúra s lakovaním.', durationMinutes: 45, price: 25 },
  ],
  staff: [
    { id: DEMO_TENANT_IDS.staff.lucia, displayName: 'Lucia', role: 'kaderníčka', workingHours: 'Po – Pi, 09:00 – 17:00' },
    { id: DEMO_TENANT_IDS.staff.martin, displayName: 'Martin', role: 'barber', workingHours: 'Ut – Pi 11:00 – 19:00, So 09:00 – 14:00' },
    { id: DEMO_TENANT_IDS.staff.eva, displayName: 'Eva', role: 'kozmetička', workingHours: 'Po, St, Pi, 10:00 – 18:00' },
  ],
  serviceStaff: [
    { serviceId: DEMO_TENANT_IDS.services.damskyStrih, staffId: DEMO_TENANT_IDS.staff.lucia },
    { serviceId: DEMO_TENANT_IDS.services.farbenie, staffId: DEMO_TENANT_IDS.staff.lucia },
    { serviceId: DEMO_TENANT_IDS.services.panskyStrih, staffId: DEMO_TENANT_IDS.staff.martin },
    { serviceId: DEMO_TENANT_IDS.services.panskyStrih, staffId: DEMO_TENANT_IDS.staff.lucia },
    { serviceId: DEMO_TENANT_IDS.services.brada, staffId: DEMO_TENANT_IDS.staff.martin },
    { serviceId: DEMO_TENANT_IDS.services.plet, staffId: DEMO_TENANT_IDS.staff.eva },
    { serviceId: DEMO_TENANT_IDS.services.manikura, staffId: DEMO_TENANT_IDS.staff.eva },
  ],
};

export function getDemoServicesWithStaff(tenant: DemoTenant = DEMO_TENANT) {
  return tenant.services.map((service) => ({
    ...service,
    staff: tenant.serviceStaff
      .filter((link) => link.serviceId === service.id)
      .map((link) => tenant.staff.find((member) => member.id === link.staffId))
      .filter((member): member is DemoStaffMember => member !== undefined),
  }));
}

export function formatDemoPrice(price: number): string {
  return `${price.toFixed(2).replace('.', ',')} €`;
}
