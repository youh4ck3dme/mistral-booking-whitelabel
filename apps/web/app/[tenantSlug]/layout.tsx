import { TenantProvider } from '@repo/web/src/lib/tenant/TenantProvider';
import { getServerSession } from '@repo/web/src/lib/auth/server-session';
import { getServerTenantContext } from '@repo/web/src/lib/tenant/server-tenant-context';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import React from 'react';
import type { CSSProperties } from 'react';

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tenantSlug: string };
}) {
  const session = await getServerSession();

  // Fetch tenant context
  const tenantContext = await getServerTenantContext(
    params.tenantSlug,
    session?.user?.id
  );

  // If tenant doesn't exist, redirect to 404
  if (!tenantContext) {
    redirect('/404');
  }

  const primaryColor = tenantContext.branding?.primary_color || '#3B82F6';
  const hasSession = Boolean(session?.user);

  return (
    <TenantProvider initialContext={tenantContext}>
      <div className="premium-page" style={{ '--accent': primaryColor } as CSSProperties}>
        <header className="premium-header">
          <div className="premium-container">
            <div className="premium-nav-shell">
              <Link href={`/${params.tenantSlug}`} className="premium-brand">
                <span className="premium-brand-word">{tenantContext.tenant.name}</span>
                <span className="premium-brand-mark">Booking</span>
              </Link>

              <nav className="premium-nav" aria-label="Tenant navigation">
                <Link href={`/${params.tenantSlug}`} className="premium-nav-link">
                  Home
                </Link>
                <Link href={`/${params.tenantSlug}/book`} className="premium-nav-link">
                  Book
                </Link>
                {tenantContext.userRole && (
                  <Link href={`/${params.tenantSlug}/portal`} className="premium-nav-link">
                    Portal
                  </Link>
                )}
                {tenantContext.userRole === 'admin' && (
                  <Link href={`/${params.tenantSlug}/admin`} className="premium-nav-link">
                    Admin
                  </Link>
                )}
              </nav>

              <div className="premium-nav-actions">
                {hasSession ? (
                  <Link href="/logout" className="premium-button-secondary">
                    Sign out
                  </Link>
                ) : (
                  <Link href="/login" className="premium-button-secondary">
                    Sign in
                  </Link>
                )}
                <Link href={`/${params.tenantSlug}/book`} className="premium-button">
                  Book now
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="premium-main">
          <div className="premium-container">{children}</div>
        </main>

        <footer className="premium-footer">
          <div className="premium-container">
            <div className="premium-footer-grid">
              <div>
                <Link href={`/${params.tenantSlug}`} className="premium-brand">
                  <span className="premium-brand-word">{tenantContext.tenant.name}</span>
                  <span className="premium-brand-mark">Tenant</span>
                </Link>
                <p className="premium-copy">
                  Premium booking presentation powered by the existing tenant, service, and
                  reservation flows.
                </p>
              </div>
              <div>
                <h3 className="premium-footer-heading">Explore</h3>
                <div className="premium-footer-links">
                  <Link href={`/${params.tenantSlug}`}>Overview</Link>
                  <Link href={`/${params.tenantSlug}/book`}>Booking</Link>
                  {tenantContext.userRole && <Link href={`/${params.tenantSlug}/portal`}>Portal</Link>}
                </div>
              </div>
              <div>
                <h3 className="premium-footer-heading">Access</h3>
                <div className="premium-footer-links">
                  {tenantContext.userRole === 'admin' ? (
                    <Link href={`/${params.tenantSlug}/admin`}>Admin workspace</Link>
                  ) : (
                    <span>{hasSession ? 'Signed in' : 'Guest mode'}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="premium-footer-bottom">
              <span>© {new Date().getFullYear()} {tenantContext.tenant.name}</span>
              <span>Booking-first experience on the shared NEXIFY platform.</span>
            </div>
          </div>
        </footer>
      </div>
    </TenantProvider>
  );
}
