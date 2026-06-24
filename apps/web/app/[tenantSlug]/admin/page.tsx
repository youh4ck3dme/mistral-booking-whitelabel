'use client';

import type { Booking, Service, TenantBranding } from '@repo/core';
import { useNotifications } from '@repo/web/app/notifications-provider';
import { useTenant } from '@repo/web/src/lib/tenant/TenantProvider';
import { UsersTab } from './users-tab';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { CSSProperties } from 'react';
import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import AdminCalendar to avoid SSR issues with client-side only features
const DynamicAdminCalendar = dynamic(
  () => import('@repo/web/src/lib/booking/AdminCalendar').then((mod) => mod.AdminCalendar),
  {
    ssr: false,
    loading: () => (
      <div className="premium-inline-actions">
        <div className="premium-spinner" />
        <span className="premium-copy">Načítavam kalendár...</span>
      </div>
    ),
  }
);

// Import styles for server-side rendering
import { adminCalendarStyles } from '@repo/web/src/lib/booking/AdminCalendar';

export default function TenantAdminPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const tenant = useTenant();
  const { notifyError, notifyInfo, notifySuccess } = useNotifications();

  const [services, setServices] = useState<Service[]>([]);
  type BookingWithService = Booking & {
    service: { name: string; price: number; duration: number } | null;
  };
  const [bookings, setBookings] = useState<BookingWithService[]>([]);
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'services' | 'bookings' | 'branding' | 'ai' | 'users' | 'leads'>('services');

  const brandingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const primaryColor = tenant.branding?.primary_color || '#3B82F6';

  useEffect(() => {
    if (!tenant.isRoleResolved) {
      return;
    }

    if (tenant?.userRole !== 'admin') {
      router.push(`/${tenant.tenant.slug}`);
    }
  }, [router, tenant]);

  useEffect(() => {
    if (!tenant?.tenant?.id || !tenant.isRoleResolved || tenant.userRole !== 'admin') return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (activeTab === 'services') {
          const { data } = await supabase
            .from('services')
            .select('*')
            .eq('tenant_id', tenant.tenant.id)
            .order('created_at', { ascending: false });
          setServices(data || []);
        } else if (activeTab === 'bookings') {
          const { data } = await supabase
            .from('bookings')
            .select('*, service:services(name, price, duration)')
            .eq('tenant_id', tenant.tenant.id)
            .order('start_time', { ascending: false });
          setBookings((data || []) as any);
        } else if (activeTab === 'branding') {
          const { data } = await supabase
            .from('tenant_branding')
            .select('*')
            .eq('tenant_id', tenant.tenant.id)
            .single();
          setBranding(data || null);
        }
      } catch {
        setError('Nepodarilo sa načítať dáta');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [activeTab, supabase, tenant?.isRoleResolved, tenant?.tenant?.id, tenant?.userRole]);

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleString('sk-SK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const formatStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      confirmed: 'Potvrdená',
      cancelled: 'Zrušená',
      pending: 'Čaká na potvrdenie',
    };
    return statusMap[status] || status;
  };

  const badgeClass = (status: string) => {
    if (status === 'confirmed' || status === 'Aktívna') return 'premium-status premium-status--success';
    if (status === 'cancelled' || status === 'Neaktívna') return 'premium-status premium-status--danger';
    return 'premium-status premium-status--warning';
  };

  const handleUpdateBranding = async (field: keyof TenantBranding, value: string) => {
    try {
      if (!branding?.id) return;

      const { error: brandingError } = await supabase
        .from('tenant_branding')
        .update({ [field]: value })
        .eq('id', branding.id);

      if (brandingError) throw brandingError;
      setBranding({ ...branding, [field]: value });
      notifySuccess('Branding uložený', 'Tenant branding bol úspešne aktualizovaný.');
    } catch {
      setError('Nepodarilo sa aktualizovať branding');
      notifyError('Branding sa nepodarilo uložiť', 'Skontrolujte údaje a skúste to znova.');
    }
  };

  const handleUpdateBrandingDebounced = (field: keyof TenantBranding, value: string) => {
    // Optimistically update local state immediately for responsive UI
    setBranding((current) => current ? { ...current, [field]: value } : current);
    // Debounce the actual DB write
    if (brandingDebounceRef.current) clearTimeout(brandingDebounceRef.current);
    brandingDebounceRef.current = setTimeout(() => {
      void handleUpdateBranding(field, value);
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (brandingDebounceRef.current) clearTimeout(brandingDebounceRef.current);
    };
  }, []);

  const handleToggleService = async (serviceId: string, isActive: boolean) => {
    try {
      const { error: serviceError } = await supabase
        .from('services')
        .update({ is_active: !isActive })
        .eq('id', serviceId);

      if (serviceError) throw serviceError;

      setServices((current) =>
        current.map((service) =>
          service.id === serviceId ? { ...service, is_active: !isActive } : service
        )
      );
      notifySuccess(
        isActive ? 'Služba bola deaktivovaná' : 'Služba bola aktivovaná',
        'Zmena stavu služby bola uložená.'
      );
    } catch {
      setError('Nepodarilo sa aktualizovať službu');
      notifyError('Stav služby sa nepodarilo uložiť', 'Skúste zmenu zopakovať.');
    }
  };

  if (!tenant.isRoleResolved || tenant?.userRole !== 'admin') {
    return (
      <div className="premium-card premium-stack" style={{ '--accent': primaryColor } as CSSProperties}>
        <div className="premium-inline-actions">
          <div className="premium-spinner" />
          <span className="premium-copy">Checking admin access…</span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="premium-card premium-stack" style={{ '--accent': primaryColor } as CSSProperties}>
        <div className="premium-inline-actions">
          <div className="premium-spinner" />
          <span className="premium-copy">Loading tenant admin data…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="premium-stack" style={{ '--accent': primaryColor } as CSSProperties}>
        <div className="premium-alert premium-alert--error">{error}</div>
        <button
          type="button"
          className="premium-button"
          onClick={() => router.push(`/${tenant.tenant.slug}`)}
        >
          Späť na tenant
        </button>
      </div>
    );
  }

  return (
    <div className="premium-stack" style={{ '--accent': primaryColor } as CSSProperties}>
      <section className="premium-card premium-card--soft premium-stack">
        <div className="premium-toolbar">
          <div>
            <span className="premium-section-label">Workspace</span>
            <h1 className="premium-section-title">Tenant admin</h1>
          </div>
          <div className="premium-kpi-grid">
            <div className="premium-stat">
              <span className="premium-stat-value">{services.length}</span>
              <span className="premium-stat-label">services</span>
            </div>
            <div className="premium-stat">
              <span className="premium-stat-value">{bookings.length}</span>
              <span className="premium-stat-label">bookings</span>
            </div>
            <div className="premium-stat">
              <span className="premium-stat-value">{tenant.userRole || 'admin'}</span>
              <span className="premium-stat-label">access role</span>
            </div>
          </div>
        </div>
      </section>

      <div className="premium-tab-list" role="tablist" aria-label="Admin tabs">
        {[
          { id: 'services', label: 'Služby' },
          { id: 'bookings', label: 'Rezervácie' },
          { id: 'branding', label: 'Branding' },
          { id: 'ai', label: 'AI Nastavenia' },
          { id: 'users', label: 'Používatelia' },
          { id: 'leads', label: 'Leads' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`premium-tab ${activeTab === tab.id ? 'is-active' : ''}`}
            style={{
              borderColor: activeTab === tab.id ? primaryColor : undefined,
              color: activeTab === tab.id ? primaryColor : undefined,
            }}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'services' && (
        <section className="premium-section">
          <div className="premium-toolbar">
            <div className="premium-section-header">
              <span className="premium-section-label">Services</span>
              <h2 className="premium-section-title">Správa služieb</h2>
            </div>
            <Link href={`/${tenant.tenant.slug}/admin/services/new`} className="premium-button">
              Pridať novú službu
            </Link>
          </div>

          {services.length === 0 ? (
            <div className="premium-empty">
              <span className="premium-kicker">Fallback state</span>
              <h3 className="premium-card-title">Žiadne služby</h3>
              <p className="premium-empty-copy">
                Kliknite na „Pridať novú službu“ a vytvorte prvú položku pre tento tenant.
              </p>
            </div>
          ) : (
            <div className="premium-table-wrap">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Názov</th>
                    <th>Popis</th>
                    <th>Cena</th>
                    <th>Trvanie</th>
                    <th>Stav</th>
                    <th>Akcie</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <tr key={service.id}>
                      <td><strong>{service.name}</strong></td>
                      <td>{service.description || '—'}</td>
                      <td>{service.price} €</td>
                      <td>{service.duration} min</td>
                      <td>
                        <span className={badgeClass(service.is_active ? 'Aktívna' : 'Neaktívna')}>
                          {service.is_active ? 'Aktívna' : 'Neaktívna'}
                        </span>
                      </td>
                      <td>
                        <div className="premium-inline-actions">
                          <Link
                            href={`/${tenant.tenant.slug}/admin/services/${service.id}/edit`}
                            className="premium-button-secondary"
                          >
                            Upraviť
                          </Link>
                          <button
                            type="button"
                            className={service.is_active ? 'premium-button-danger' : 'premium-button'}
                            onClick={() => handleToggleService(service.id, service.is_active)}
                          >
                            {service.is_active ? 'Deaktivovať' : 'Aktivovať'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeTab === 'bookings' && (
        <section className="premium-section">
          <div className="premium-section-header">
            <span className="premium-section-label">Bookings</span>
            <h2 className="premium-section-title">Rezervácie</h2>
          </div>

          {bookings.length === 0 ? (
            <div className="premium-empty">
              <span className="premium-kicker">Fallback state</span>
              <h3 className="premium-card-title">Žiadne rezervácie</h3>
              <p className="premium-empty-copy">Keď zákazníci začnú rezervovať, objavia sa tu.</p>
            </div>
          ) : (
            <>
              <style jsx global>{`
                ${(typeof window !== 'undefined' && document.getElementById('admin-calendar-styles')) ? '' : adminCalendarStyles}
              `}</style>
              <DynamicAdminCalendar
                tenantId={tenant.tenant.id}
                services={services}
                bookings={bookings as BookingWithService[]}
                primaryColor={primaryColor}
              />
            </>
          )}
        </section>
      )}

      {activeTab === 'branding' && (
        <section className="premium-split">
          <div className="premium-card premium-stack">
            <span className="premium-section-label">Branding</span>
            <h2 className="premium-section-title">Tenant identity</h2>

            <div className="premium-form">
              <div className="premium-field">
                <label className="premium-label" htmlFor="logo-url">Logo URL</label>
                <input
                  id="logo-url"
                  type="text"
                  className="premium-input"
                  value={branding?.logo_url || ''}
                  onChange={(event) => handleUpdateBrandingDebounced('logo_url', event.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div className="premium-field">
                <label className="premium-label" htmlFor="favicon-url">Favicon URL</label>
                <input
                  id="favicon-url"
                  type="text"
                  className="premium-input"
                  value={branding?.favicon_url || ''}
                  onChange={(event) => handleUpdateBrandingDebounced('favicon_url', event.target.value)}
                  placeholder="https://example.com/favicon.ico"
                />
              </div>

              <div className="premium-field">
                <label className="premium-label" htmlFor="primary-color">Primárna farba</label>
                <div className="premium-inline-actions">
                  <input
                    id="primary-color"
                    type="color"
                    className="premium-color-input"
                    value={branding?.primary_color || '#3B82F6'}
                    onChange={(event) => handleUpdateBrandingDebounced('primary_color', event.target.value)}
                  />
                  <input
                    type="text"
                    className="premium-input"
                    value={branding?.primary_color || '#3B82F6'}
                    onChange={(event) => handleUpdateBrandingDebounced('primary_color', event.target.value)}
                    maxLength={7}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="premium-card premium-stack">
            <span className="premium-section-label">Preview</span>
            <h2 className="premium-section-title">Náhľad brandingu</h2>
            <div
              className="premium-card premium-card--tight premium-stack"
              style={{ backgroundColor: `${branding?.primary_color || primaryColor}12` }}
            >
              <div
                style={{
                  alignItems: 'center',
                  backgroundColor: branding?.primary_color || primaryColor,
                  borderRadius: '18px',
                  color: '#fff',
                  display: 'inline-flex',
                  fontWeight: 700,
                  height: '56px',
                  justifyContent: 'center',
                  width: '56px',
                }}
              >
                {tenant.tenant.name.charAt(0).toUpperCase()}
              </div>
              <h3 className="premium-card-title">{tenant.tenant.name}</h3>
              <p className="premium-card-copy">Náhľad branding-u pre booking experience.</p>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'ai' && (
        <section className="premium-section">
          <div className="premium-section-header">
            <span className="premium-section-label">AI settings</span>
            <h2 className="premium-section-title">AI Nastavenia</h2>
          </div>
          <div className="premium-grid-2">
            <article className="premium-card premium-stack">
              <h3 className="premium-card-title">Odporúčania služieb</h3>
              <p className="premium-card-copy">
                AI systém automaticky odporúča služby používateľom na základe ich histórie.
              </p>
              <button type="button" className="premium-button-secondary">
                Zobraziť štatistiky
              </button>
            </article>
            <article className="premium-card premium-stack">
              <h3 className="premium-card-title">Upsell Balíčky</h3>
              <p className="premium-card-copy">
                AI generuje osobitné balíčky pre zvýšenie predaja.
              </p>
              <button type="button" className="premium-button-secondary">
                Nastaviť balíčky
              </button>
            </article>
          </div>
          <div className="premium-card premium-stack">
            <h3 className="premium-card-title">AI Experimenty</h3>
            <p className="premium-card-copy">
              Tu môžeš spravovať A/B testy pre optimalizáciu konverzie.
            </p>
            <div className="premium-table-wrap">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Názov</th>
                    <th>Popis</th>
                    <th>Akcie</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Service Recommendation A/B Test</strong></td>
                    <td>Test different recommendation algorithms</td>
                    <td><button type="button" className="premium-button-secondary">Zobraziť</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'users' && (
        <UsersTab tenantId={tenant.tenant.id} supabase={supabase} />
      )}

      {activeTab === 'leads' && (
        <section className="premium-section">
          <div className="premium-toolbar">
            <div className="premium-section-header">
              <span className="premium-section-label">Sales Pipeline</span>
              <h2 className="premium-section-title">Booking Growth Leads</h2>
            </div>
            <Link href={`/${tenant.tenant.slug}/admin/leads`} className="premium-button">
              View All Leads
            </Link>
          </div>
          <div className="premium-card premium-stack">
            <p className="premium-card-copy">
              Manage your sales pipeline for booking PWA opportunities. 
              View, filter, and track leads across different verticals.
            </p>
            <div className="premium-inline-actions" style={{ marginTop: '1rem' }}>
              <Link href={`/${tenant.tenant.slug}/admin/leads`} className="premium-button">
                Go to Leads Dashboard
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
