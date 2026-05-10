'use client';

import { useNotifications } from '@repo/web/app/notifications-provider';
import { storeFlashToast } from '@repo/web/src/lib/notifications/client';
import type { Service } from '@repo/core';
import { useTenant } from '@repo/web/src/lib/tenant/TenantProvider';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import type { CSSProperties, FormEvent } from 'react';
import { useEffect, useState } from 'react';

export default function EditServicePage({
  params,
}: {
  params: { tenantSlug: string; serviceId: string };
}) {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const tenant = useTenant();
  const { notifyError } = useNotifications();

  const [service, setService] = useState<Service | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState<number>(30);
  const [price, setPrice] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!tenant?.tenant?.id) return;

    const fetchService = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: serviceError } = await supabase
          .from('services')
          .select('*')
          .eq('id', params.serviceId)
          .eq('tenant_id', tenant.tenant.id)
          .single();

        if (serviceError) throw serviceError;
        if (!data) {
          router.push('/404');
          return;
        }

        setService(data);
        setName(data.name);
        setDescription(data.description || '');
        setDuration(data.duration);
        setPrice(data.price);
        setIsActive(data.is_active);
      } catch (fetchError: any) {
        setError(fetchError.message || 'Nepodarilo sa načítať službu');
      } finally {
        setIsLoading(false);
      }
    };

    fetchService();
  }, [params.serviceId, router, supabase, tenant?.tenant?.id]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!tenant?.tenant?.id || !service) return;

    try {
      setIsLoading(true);
      setError(null);

      const { error: serviceError } = await supabase
        .from('services')
        .update({ name, description, duration, price, is_active: isActive })
        .eq('id', params.serviceId)
        .eq('tenant_id', tenant.tenant.id);

      if (serviceError) throw serviceError;
      storeFlashToast({
        title: 'Služba bola aktualizovaná',
        description: 'Uložené zmeny sú viditeľné v tenant admin rozhraní.',
        variant: 'success',
      });
      router.push(`/${tenant.tenant.slug}/admin?tab=services`);
    } catch (submitError: any) {
      const message = submitError.message || 'Nepodarilo sa aktualizovať službu';
      setError(message);
      notifyError('Službu sa nepodarilo uložiť', message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !service) {
    return (
      <div className="premium-card premium-stack">
        <div className="premium-inline-actions">
          <div className="premium-spinner" />
          <span className="premium-copy">Loading service details…</span>
        </div>
      </div>
    );
  }

  if (error && !service) {
    return (
      <div className="premium-stack">
        <div className="premium-alert premium-alert--error">{error}</div>
        <button type="button" className="premium-button" onClick={() => router.push(`/${tenant.tenant.slug}/admin?tab=services`)}>
          Späť
        </button>
      </div>
    );
  }

  if (!service) {
    return <div className="premium-empty"><p className="premium-empty-copy">Služba neexistuje.</p></div>;
  }

  return (
    <div className="premium-stack" style={{ maxWidth: '760px', '--accent': tenant.branding?.primary_color || '#3B82F6' } as CSSProperties}>
      <section className="premium-section-header">
        <span className="premium-section-label">Tenant admin</span>
        <h1 className="premium-section-title">Upraviť službu</h1>
      </section>

      {error && <div className="premium-alert premium-alert--error">{error}</div>}

      <form onSubmit={handleSubmit} className="premium-card premium-form">
        <div className="premium-field">
          <label htmlFor="name" className="premium-label">Názov služby*</label>
          <input id="name" type="text" value={name} onChange={(event) => setName(event.target.value)} required className="premium-input" />
        </div>

        <div className="premium-field">
          <label htmlFor="description" className="premium-label">Popis</label>
          <textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} rows={4} className="premium-textarea" />
        </div>

        <div className="premium-form-grid">
          <div className="premium-field">
            <label htmlFor="duration" className="premium-label">Trvanie (minúty)*</label>
            <input id="duration" type="number" value={duration} onChange={(event) => setDuration(parseInt(event.target.value, 10) || 0)} required min={1} className="premium-input" />
          </div>
          <div className="premium-field">
            <label htmlFor="price" className="premium-label">Cena (€)*</label>
            <input id="price" type="number" value={price} onChange={(event) => setPrice(parseFloat(event.target.value) || 0)} required min={0} step={0.01} className="premium-input" />
          </div>
        </div>

        <label className="premium-checkbox-row">
          <input id="is_active" type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} className="premium-checkbox" />
          <span className="premium-copy">Aktívna služba</span>
        </label>

        <div className="premium-actions">
          <button type="submit" disabled={isLoading} className="premium-button">
            {isLoading ? 'Ukladanie...' : 'Uložiť zmeny'}
          </button>
          <button type="button" className="premium-button-secondary" onClick={() => router.push(`/${tenant.tenant.slug}/admin?tab=services`)}>
            Zrušiť
          </button>
          <button
            type="button"
            className="premium-button-danger"
            onClick={async () => {
              if (!confirm('Naozaj chcete odstrániť túto službu?')) return;
              try {
                setIsLoading(true);
                const { error: deleteError } = await supabase
                  .from('services')
                  .delete()
                  .eq('id', params.serviceId)
                  .eq('tenant_id', tenant.tenant.id);

                if (deleteError) throw deleteError;
                storeFlashToast({
                  title: 'Služba bola odstránená',
                  description: 'Tenant admin zoznam služieb je aktualizovaný.',
                  variant: 'success',
                });
                router.push(`/${tenant.tenant.slug}/admin?tab=services`);
              } catch (deleteServiceError: any) {
                const message = deleteServiceError.message || 'Nepodarilo sa odstrániť službu';
                setError(message);
                notifyError('Službu sa nepodarilo odstrániť', message);
              } finally {
                setIsLoading(false);
              }
            }}
          >
            Odstrániť
          </button>
        </div>
      </form>
    </div>
  );
}
