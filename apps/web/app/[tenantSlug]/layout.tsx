import { createClient } from '@repo/supabase-client';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NEXIFY TECH CENTER - Tenant',
  description: 'Tenant-specific booking platform.',
};

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tenantSlug: string };
}) {
  const supabase = createClient();
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', params.tenantSlug)
    .single();

  if (!tenant) {
    redirect('/404');
  }

  return (
    <html lang="sk">
      <body>
        <header className="bg-blue-600 text-white p-4">
          <h1 className="text-xl font-bold">{tenant.name}</h1>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}