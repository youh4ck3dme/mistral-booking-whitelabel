import type { Tenant } from '@repo/core';
import { createServiceRoleClient } from '@repo/web/src/lib/supabase/service-role';
import Link from 'next/link';

// Server Component — auth is already enforced by middleware + layout.
// No client-side auth checks needed here.
export default async function PlatformAdminPage() {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('tenants')
    .select('id, name, slug, created_at')
    .order('created_at', { ascending: false });

  const tenants: Tenant[] = data ?? [];
  const fetchError = error?.message ?? null;

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('sk-SK', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  const thirtyDaysAgo = Date.now() - 30 * 86_400_000;

  return (
    <div className="premium-stack">
      <section className="premium-hero">
        <div className="premium-hero-copy premium-stack">
          <span className="premium-eyebrow">Platform admin</span>
          <h1 className="premium-title premium-title--medium">NEXIFY control center</h1>
          <p className="premium-lead">
            Sledujte tenantov, otvárajte nové konfigurácie a držte white-label booking platformu v
            jednotnom premium štýle.
          </p>
          <div className="premium-actions">
            <Link href="/platform/tenants/new" className="premium-button">
              Pridať nového tenanta
            </Link>
          </div>
        </div>
      </section>

      {fetchError ? (
        <div className="premium-alert premium-alert--error">
          Chyba pri načítaní tenantov: {fetchError}
        </div>
      ) : (
        <>
          <section className="premium-kpi-grid">
            <div className="premium-stat">
              <span className="premium-stat-value">{tenants.length}</span>
              <span className="premium-stat-label">tenantov celkom</span>
            </div>
            <div className="premium-stat">
              <span className="premium-stat-value">{tenants.length}</span>
              <span className="premium-stat-label">aktívni tenanti</span>
            </div>
            <div className="premium-stat">
              <span className="premium-stat-value">
                {tenants.filter((t) => new Date(t.created_at).getTime() > thirtyDaysAgo).length}
              </span>
              <span className="premium-stat-label">noví za 30 dní</span>
            </div>
          </section>

          <section className="premium-section">
            <div className="premium-toolbar">
              <div className="premium-section-header">
                <span className="premium-section-label">Tenants</span>
                <h2 className="premium-section-title">Zoznam tenantov</h2>
              </div>
              <Link href="/platform/tenants/new" className="premium-button-secondary">
                Create tenant
              </Link>
            </div>

            {tenants.length === 0 ? (
              <div className="premium-empty">
                <span className="premium-kicker">Fallback state</span>
                <h3 className="premium-card-title">Žiadni tenanti</h3>
                <p className="premium-empty-copy">
                  Kliknite na &ldquo;Pridať nového tenanta&rdquo; a vytvorte prvý workspace.
                </p>
              </div>
            ) : (
              <div className="premium-table-wrap">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Názov</th>
                      <th>Slug</th>
                      <th>Vytvorený</th>
                      <th>Akcie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map((tenant) => (
                      <tr key={tenant.id}>
                        <td><strong>{tenant.name}</strong></td>
                        <td>/{tenant.slug}/book</td>
                        <td>{formatDate(tenant.created_at)}</td>
                        <td>
                          <div className="premium-inline-actions">
                            <Link
                              href={`/platform/tenants/${tenant.id}/edit`}
                              className="premium-button-secondary"
                            >
                              Upraviť
                            </Link>
                            <Link href={`/${tenant.slug}`} className="premium-button">
                              Zobraziť
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
