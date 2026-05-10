'use client';

import type { Tenant } from '@repo/core';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PlatformAdminPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
      }
    };

    checkAdmin();
  }, [router, supabase.auth]);

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: tenantsError } = await supabase
          .from('tenants')
          .select('*')
          .order('created_at', { ascending: false });

        if (tenantsError) throw tenantsError;
        setTenants(data || []);
      } catch {
        setError('Nepodarilo sa načítať tenantov');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenants();
  }, [supabase]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('sk-SK', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  if (isLoading) {
    return (
      <div className="premium-card premium-stack">
        <div className="premium-inline-actions">
          <div className="premium-spinner" />
          <span className="premium-copy">Loading platform overview…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="premium-stack">
        <div className="premium-alert premium-alert--error">{error}</div>
        <button type="button" className="premium-button" onClick={() => router.push('/')}>
          Späť na domovskú stránku
        </button>
      </div>
    );
  }

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

      <section className="premium-kpi-grid">
        <div className="premium-stat">
          <span className="premium-stat-value">{tenants.length}</span>
          <span className="premium-stat-label">tenantov celkom</span>
        </div>
        <div className="premium-stat">
          <span className="premium-stat-value">{tenants.filter(() => true).length}</span>
          <span className="premium-stat-label">aktívni tenanti</span>
        </div>
        <div className="premium-stat">
          <span className="premium-stat-value">
            {tenants.filter((tenant) => Date.now() - new Date(tenant.created_at).getTime() < 30 * 86400000).length}
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
              Kliknite na „Pridať nového tenanta“ a vytvorte prvý workspace.
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
    </div>
  );
}
