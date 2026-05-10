import { getServerSession } from '@repo/web/src/lib/auth/server-session';
import { getServerTenantContext } from '@repo/web/src/lib/tenant/server-tenant-context';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import React from 'react';
import type { CSSProperties } from 'react';

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tenantSlug: string };
}) {
  const session = await getServerSession();
  const tenantContext = await getServerTenantContext(
    params.tenantSlug,
    session?.user?.id
  );

  if (!tenantContext) {
    redirect('/404');
  }

  const primaryColor = tenantContext.branding?.primary_color || '#3B82F6';

  return (
    <section className="premium-stack" style={{ '--accent': primaryColor } as CSSProperties}>
      <div className="premium-card premium-card--soft">
        <div className="premium-toolbar">
          <div>
            <span className="premium-section-label">Tenant admin</span>
            <h1 className="premium-section-title">{tenantContext.tenant.name} control room</h1>
          </div>
          <div className="premium-inline-actions">
            <Link href={`/${params.tenantSlug}`} className="premium-button-secondary">
              View tenant
            </Link>
            <Link href={`/${params.tenantSlug}/book`} className="premium-button">
              Open booking
            </Link>
          </div>
        </div>
      </div>
      {children}
    </section>
  );
}
