export type VerticalKey =
  | 'barber'
  | 'beauty'
  | 'massage'
  | 'fitness'
  | 'physio'
  | 'clinic'
  | 'tattoo';

export type VerticalRouteConfig = {
  id: VerticalKey;
  icon: string;
  title: string;
  description: string;
  accent: string;
  cta: string;
  tenantSlug: string;
  serviceId: string;
  serviceName: string;
};

export const verticalRouteList: VerticalRouteConfig[] = [
  {
    id: 'barber',
    icon: '✂',
    title: 'Barber',
    description: 'Cuts, grooming, beard care, and fast repeat bookings for modern barbershops.',
    accent: '#ff5a5f',
    cta: 'View barber services',
    tenantSlug: 'barber-lounge',
    serviceId: '40000000-0000-0000-0000-000000000001',
    serviceName: 'Precision Barber Cut',
  },
  {
    id: 'beauty',
    icon: '✦',
    title: 'Beauty',
    description: 'Appointments for nails, skin, lashes, and premium salon experiences.',
    accent: '#ff6fb5',
    cta: 'View beauty services',
    tenantSlug: 'beauty-studio',
    serviceId: '50000000-0000-0000-0000-000000000001',
    serviceName: 'Signature Glow Facial',
  },
  {
    id: 'massage',
    icon: '◌',
    title: 'Massage',
    description: 'Wellness-focused scheduling for therapies, recovery, and relaxation sessions.',
    accent: '#6ec8ff',
    cta: 'View massage services',
    tenantSlug: 'recovery-massage',
    serviceId: '60000000-0000-0000-0000-000000000001',
    serviceName: 'Deep Tissue Recovery Massage',
  },
  {
    id: 'fitness',
    icon: '▲',
    title: 'Fitness',
    description: 'Classes, personal training, and performance sessions with clean booking flows.',
    accent: '#8dff8a',
    cta: 'View fitness services',
    tenantSlug: 'apex-fitness',
    serviceId: '70000000-0000-0000-0000-000000000001',
    serviceName: 'Performance Coaching Session',
  },
  {
    id: 'physio',
    icon: '＋',
    title: 'Physio',
    description: 'Therapy and rehabilitation appointments with clear timing and availability.',
    accent: '#7c9bff',
    cta: 'View physio services',
    tenantSlug: 'motion-physio',
    serviceId: '80000000-0000-0000-0000-000000000001',
    serviceName: 'Mobility Physio Assessment',
  },
  {
    id: 'clinic',
    icon: '■',
    title: 'Clinic',
    description: 'Medical and consultation bookings for structured, tenant-specific operations.',
    accent: '#5aa8ff',
    cta: 'View clinic services',
    tenantSlug: 'demo-clinic',
    serviceId: '10000000-0000-0000-0000-000000000001',
    serviceName: 'General Checkup',
  },
  {
    id: 'tattoo',
    icon: '✷',
    title: 'Tattoo',
    description: 'Artist scheduling for consultations, custom sessions, and design follow-ups.',
    accent: '#f59e0b',
    cta: 'View tattoo services',
    tenantSlug: 'ink-tattoo',
    serviceId: '90000000-0000-0000-0000-000000000001',
    serviceName: 'Custom Tattoo Consultation',
  },
];
