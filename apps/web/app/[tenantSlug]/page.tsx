import { getServerSession } from '../../src/lib/auth/server-session';
import { createServerClient } from '@repo/supabase';
import { getServerTenantContext } from '../../src/lib/tenant/server-tenant-context';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { CSSProperties } from 'react';

export default async function TenantHomePage({
  params,
}: {
  params: { tenantSlug: string };
}) {
  const session = await getServerSession();

  const tenantContext = await getServerTenantContext(params.tenantSlug, session?.user?.id);

  const supabase = createServerClient();
  
  if (!tenantContext) {
    redirect('/404');
  }

  // Fetch services for this tenant
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('tenant_id', tenantContext.tenant.id)
    .eq('is_active', true);

  const primaryColor = tenantContext.branding?.primary_color || '#3B82F6';
  const activeServices = services ?? [];
  const createdDate = new Date(tenantContext.tenant.created_at).toLocaleDateString('sk-SK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="premium-stack" style={{ '--accent': primaryColor } as CSSProperties}>
      <section className="premium-hero">
        <div className="premium-hero-copy premium-stack">
          <span className="premium-eyebrow">Tenant homepage</span>
          <h1 className="premium-title premium-title--medium">
            Welcome to <span className="premium-title-gradient">{tenantContext.tenant.name}</span>
          </h1>
          <p className="premium-lead">
            Explore active services, move directly into the booking flow, and keep the premium
            experience consistent with the new landing page.
          </p>
          <div className="premium-actions">
            <Link href={`/${params.tenantSlug}/book`} className="premium-button">
              Book now
            </Link>
            <Link href={`/${params.tenantSlug}/portal`} className="premium-button-secondary">
              Open portal
            </Link>
          </div>
        </div>

        <div className="premium-kpi-grid">
          <div className="premium-stat">
            <span className="premium-stat-value">{activeServices.length}</span>
            <span className="premium-stat-label">active services</span>
          </div>
          <div className="premium-stat">
            <span className="premium-stat-value">{tenantContext.userRole ? 'Yes' : 'No'}</span>
            <span className="premium-stat-label">signed in access</span>
          </div>
          <div className="premium-stat">
            <span className="premium-stat-value">{createdDate}</span>
            <span className="premium-stat-label">tenant created</span>
          </div>
        </div>
      </section>

      <section className="premium-section">
        <div className="premium-section-header">
          <span className="premium-section-label">Services</span>
          <h2 className="premium-section-title">Book a service with one clear next step.</h2>
          <p className="premium-lead">
            Service cards stay visual and direct, but all scheduling still runs through the
            existing booking flow and tenant-specific data.
          </p>
        </div>

        {activeServices.length > 0 ? (
          <div className="premium-grid-3">
            {activeServices.map((service) => (
              <article key={service.id} className="premium-card premium-stack">
                <span className="premium-badge">Active service</span>
                <h3 className="premium-card-title">{service.name}</h3>
                <p className="premium-card-copy">
                  {service.description || 'Premium appointment ready for direct online booking.'}
                </p>
                <div className="premium-toolbar">
                  <div>
                    <strong>{service.price} €</strong>
                    <div className="premium-muted">{service.duration} min</div>
                  </div>
                  <Link
                    href={`/${params.tenantSlug}/book?service=${service.id}`}
                    className="premium-chip-button"
                  >
                    Reserve
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="premium-empty">
            <span className="premium-kicker">Fallback state</span>
            <h3 className="premium-card-title">No active services yet</h3>
            <p className="premium-empty-copy">
              Add the first service from the admin area and this tenant page will populate
              automatically.
            </p>
          </div>
        )}
      </section>

      <section className="premium-split">
        <div className="premium-card premium-stack">
          <span className="premium-section-label">About</span>
          <h2 className="premium-section-title">Built for clean tenant-first booking.</h2>
          <p className="premium-copy">
            {tenantContext.tenant.name} runs on the shared NEXIFY booking platform with tenant-aware
            branding, service configuration, and protected admin access.
          </p>
          <ul className="premium-list premium-list--ordered">
            <li>Select a service that matches the visit.</li>
            <li>Choose the date and slot that fit your schedule.</li>
            <li>Confirm the reservation and continue in your client portal.</li>
          </ul>
        </div>

        <div className="premium-card premium-stack">
          <span className="premium-section-label">Contact</span>
          <h2 className="premium-section-title">Need access or support?</h2>
          <p className="premium-copy">
            Use the existing auth flow for account access, then manage reservations through the
            portal or the tenant admin workspace.
          </p>
          <div className="premium-stack">
            <Link href="/login" className="premium-button-secondary">
              Sign in
            </Link>
            {tenantContext.userRole === 'admin' && (
              <Link href={`/${params.tenantSlug}/admin`} className="premium-button">
                Open admin workspace
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
