/**
 * Static fixture of the demo salon shown on /demo.
 * Mirrors supabase/seed/002_demo_salon.sql (same ids and slug) so the page works without
 * a database; keep both in sync when the demo changes.
 */

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
  id: 'de000000-0000-4000-8000-000000000001',
  slug: 'demo-salon',
  name: 'Salón Aurora (demo)',
  locale: 'sk',
  timezone: 'Europe/Bratislava',
  primaryColor: '#C2410C',
  openingHours: 'Po – So, 09:00 – 19:00',
  services: [
    { id: 'de000000-0000-4000-8000-000000000501', name: 'Dámsky strih a fúkaná', description: 'Konzultácia, umytie, strih a styling.', durationMinutes: 60, price: 35 },
    { id: 'de000000-0000-4000-8000-000000000502', name: 'Farbenie vlasov', description: 'Celofarbenie vrátane strihu končekov.', durationMinutes: 120, price: 75 },
    { id: 'de000000-0000-4000-8000-000000000503', name: 'Pánsky strih', description: 'Strih strojčekom a nožnicami, umytie.', durationMinutes: 30, price: 18 },
    { id: 'de000000-0000-4000-8000-000000000504', name: 'Úprava brady', description: 'Tvarovanie brady, horúci uterák.', durationMinutes: 20, price: 12 },
    { id: 'de000000-0000-4000-8000-000000000505', name: 'Kozmetické ošetrenie pleti', description: 'Čistenie, peeling, maska a masáž tváre.', durationMinutes: 75, price: 55 },
    { id: 'de000000-0000-4000-8000-000000000506', name: 'Manikúra', description: 'Klasická manikúra s lakovaním.', durationMinutes: 45, price: 25 },
  ],
  staff: [
    { id: 'de000000-0000-4000-8000-000000000301', displayName: 'Lucia', role: 'kaderníčka', workingHours: 'Po – Pi, 09:00 – 17:00' },
    { id: 'de000000-0000-4000-8000-000000000302', displayName: 'Martin', role: 'barber', workingHours: 'Ut – Pi 11:00 – 19:00, So 09:00 – 14:00' },
    { id: 'de000000-0000-4000-8000-000000000303', displayName: 'Eva', role: 'kozmetička', workingHours: 'Po, St, Pi, 10:00 – 18:00' },
  ],
  serviceStaff: [
    { serviceId: 'de000000-0000-4000-8000-000000000501', staffId: 'de000000-0000-4000-8000-000000000301' },
    { serviceId: 'de000000-0000-4000-8000-000000000502', staffId: 'de000000-0000-4000-8000-000000000301' },
    { serviceId: 'de000000-0000-4000-8000-000000000503', staffId: 'de000000-0000-4000-8000-000000000302' },
    { serviceId: 'de000000-0000-4000-8000-000000000503', staffId: 'de000000-0000-4000-8000-000000000301' },
    { serviceId: 'de000000-0000-4000-8000-000000000504', staffId: 'de000000-0000-4000-8000-000000000302' },
    { serviceId: 'de000000-0000-4000-8000-000000000505', staffId: 'de000000-0000-4000-8000-000000000303' },
    { serviceId: 'de000000-0000-4000-8000-000000000506', staffId: 'de000000-0000-4000-8000-000000000303' },
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
