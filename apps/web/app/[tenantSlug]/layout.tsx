import { createServerClient } from '@repo/supabase';
import { getTenantContext } from '@repo/web/src/lib/tenant/tenant.service';
import { TenantProvider } from '@repo/web/src/lib/tenant/TenantProvider';
import { redirect } from 'next/navigation';
import React from 'react';

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tenantSlug: string };
}) {
  // Create Supabase server client
  const supabase = createServerClient();

  // Get session to determine current user
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Fetch tenant context
  const tenantContext = await getTenantContext(
    params.tenantSlug,
    session?.user?.id
  );

  // If tenant doesn't exist, redirect to 404
  if (!tenantContext) {
    redirect('/404');
  }

  // Apply tenant branding to the layout
  const primaryColor = tenantContext.branding?.primary_color || '#3B82F6';

  return (
    <html lang="sk" suppressHydrationWarning>
      <head>
        {/* Dynamic favicon based on tenant */}
        {tenantContext.branding?.favicon_url && (
          <link rel="icon" href={tenantContext.branding.favicon_url} />
        )}
        {/* Dynamic title based on tenant */}
        <title>{tenantContext.tenant.name} | NEXIFY TECH CENTER</title>
      </head>
      <body
        className={`min-h-screen`}
        style={{ backgroundColor: primaryColor === '#3B82F6' ? '#f8fafc' : `${primaryColor}10` }}
      >
        <TenantProvider initialContext={tenantContext}>
          {/* Tenant-specific header */}
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
                    href={`/${params.tenantSlug}/book`}
                    className="px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100"
                  >
                    Rezervovať
                  </a>
                  {tenantContext.userRole && (
                    <a
                      href={`/${params.tenantSlug}/portal`}
                      className="px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100"
                    >
                      Môj účet
                    </a>
                  )}
                  {tenantContext.userRole === 'admin' && (
                    <a
                      href={`/${params.tenantSlug}/admin`}
                      className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Admin
                    </a>
                  )}
                </nav>
              </div>
            </div>
          </header>
          
          {/* Main content */}
          <main className="container mx-auto px-4 py-8">{children}</main>
          
          {/* Footer */}
          <footer className="bg-gray-100 py-6 mt-12">
            <div className="container mx-auto px-4 text-center text-gray-600">
              <p>© {new Date().getFullYear()} {tenantContext.tenant.name}. Všetky práva vyhradené.</p>
            </div>
          </footer>
        </TenantProvider>
      </body>
    </html>
  );
}
