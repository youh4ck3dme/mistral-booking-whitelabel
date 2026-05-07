import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NEXIFY TECH CENTER',
  description: 'White-Label Booking SaaS Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sk">
      <body>{children}</body>
    </html>
  );
}