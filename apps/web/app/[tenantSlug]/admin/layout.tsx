import { createServerClient } from '@repo/supabase';
import { getTenantContext } from '@repo/web/src/lib/tenant/tenant.service';
import { redirect } from 'next/navigation';
import React from 'react';

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tenantSlug: string };
}) {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  const tenantContext = await getTenantContext(
    params.tenantSlug,
    session?.user?.id
  );

  if (!tenantContext) {
    redirect('/404');
  }

  // Check if user is admin
  if (tenantContext.userRole !== 'admin') {
    redirect(`/${params.tenantSlug}`);
  }

  const primaryColor = tenantContext.branding?.primary_color || '#3B82F6';

  return (
    <div className="min-h-screen">
      <header
        className="bg-white shadow-md"
        style={{ borderTop: `4px solid ${primaryColor}` }}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: primaryColor }}
              >
                {tenantContext.tenant.name.charAt(0).toUpperCase()}
              </div>
              <span className="font-semibold text-xl">{tenantContext.tenant.name}</span>
            </div>
            <nav className="flex gap-4">
              <a
                href={`/${params.tenantSlug}`}
                className="px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Späť na stránku
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">{children}</main>

      <footer className="bg-gray-100 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© {new Date().getFullYear()} {tenantContext.tenant.name}. Admin Panel</p>
        </div>
      </footer>
    </div>
  );
}
