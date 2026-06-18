'use client';

import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@repo/supabase';

type TenantUser = {
  id: string;
  user_id: string;
  role: 'admin' | 'staff' | 'client';
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  staff: 'Personál',
  client: 'Klient',
};

const ROLE_BADGE: Record<string, string> = {
  admin: 'premium-status premium-status--success',
  staff: 'premium-status premium-status--warning',
  client: 'premium-status',
};

export function UsersTab({
  tenantId,
  supabase,
}: {
  tenantId: string;
  supabase: SupabaseClient<Database>;
}) {
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;

    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('tenant_users')
          .select('id, user_id, role')
          .eq('tenant_id', tenantId);

        if (fetchError) throw fetchError;
        setUsers(data ?? []);
      } catch {
        setError('Nepodarilo sa načítať používateľov');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [tenantId, supabase]);

  if (isLoading) {
    return (
      <section className="premium-card premium-stack">
        <div className="premium-inline-actions">
          <div className="premium-spinner" />
          <span className="premium-copy">Načítavam členov tímu…</span>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="premium-card premium-stack">
        <div className="premium-alert premium-alert--error">{error}</div>
      </section>
    );
  }

  const roleCounts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section className="premium-section">
      <div className="premium-toolbar">
        <div className="premium-section-header">
          <span className="premium-section-label">Users</span>
          <h2 className="premium-section-title">Členovia tímu</h2>
        </div>
        <div className="premium-kpi-grid">
          {Object.entries(roleCounts).map(([role, count]) => (
            <div key={role} className="premium-stat">
              <span className="premium-stat-value">{count}</span>
              <span className="premium-stat-label">{ROLE_LABELS[role] ?? role}</span>
            </div>
          ))}
        </div>
      </div>

      {users.length === 0 ? (
        <div className="premium-empty">
          <span className="premium-kicker">Prázdny stav</span>
          <h3 className="premium-card-title">Žiadni členovia tímu</h3>
          <p className="premium-empty-copy">
            Členovia sa zobrazia po pridaní do tenant_users tabuľky.
          </p>
        </div>
      ) : (
        <div className="premium-table-wrap">
          <table className="premium-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Rola</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <code style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                      {user.user_id.slice(0, 16)}…
                    </code>
                  </td>
                  <td>
                    <span className={ROLE_BADGE[user.role] ?? 'premium-status'}>
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="premium-card premium-stack" style={{ marginTop: '1rem' }}>
        <p className="premium-muted" style={{ fontSize: '0.8rem' }}>
          💡 Pre pozvanie nového člena tímu použite Supabase dashboard alebo admin API.
          Podpora self-service pozvania bude pridaná v nasledujúcom release.
        </p>
      </div>
    </section>
  );
}
