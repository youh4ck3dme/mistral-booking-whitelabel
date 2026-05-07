import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NEXIFY TECH CENTER - White-Label Booking SaaS',
  description: 'Production-grade white-label booking platform for clinics and brands.',
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}