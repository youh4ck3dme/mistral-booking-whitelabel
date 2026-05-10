'use client';

import { useNotifications } from '@repo/web/app/notifications-provider';
import { storeFlashToast } from '@repo/web/src/lib/notifications/client';
import { useTenant } from '@repo/web/src/lib/tenant/TenantProvider';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import type { CSSProperties, FormEvent } from 'react';
import { useState } from 'react';

export default function NewServicePage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const tenant = useTenant();
  const { notifyError } = useNotifications();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState<number>(30);
  const [price, setPrice] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!tenant?.tenant?.id) {
      setError('Tenant not found');
      notifyError('Tenant nebol nájdený', 'Bez aktívneho tenanta nie je možné vytvoriť službu.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { error: serviceError } = await supabase.from('services').insert({
        tenant_id: tenant.tenant.id,
        name,
        description,
        duration,
        price,
        is_active: isActive,
      });

      if (serviceError) throw serviceError;
      storeFlashToast({
        title: 'Služba bola vytvorená',
        description: 'Nová služba je pripravená v tenant admin rozhraní.',
        variant: 'success',
      });
      router.push(`/${tenant.tenant.slug}/admin?tab=services`);
    } catch (submitError: any) {
      const message = submitError.message || 'Nepodarilo sa vytvoriť službu';
      setError(message);
      notifyError('Službu sa nepodarilo vytvoriť', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="premium-stack" style={{ maxWidth: '760px', '--accent': tenant.branding?.primary_color || '#3B82F6' } as CSSProperties}>
      <section className="premium-section-header">
        <span className="premium-section-label">Tenant admin</span>
        <h1 className="premium-section-title">Nová služba</h1>
      </section>

      {error && <div className="premium-alert premium-alert--error">{error}</div>}

      <form onSubmit={handleSubmit} className="premium-card premium-form">
        <div className="premium-field">
          <label htmlFor="name" className="premium-label">Názov služby*</label>
          <input id="name" type="text" value={name} onChange={(event) => setName(event.target.value)} required className="premium-input" placeholder="Názov služby" />
        </div>

        <div className="premium-field">
          <label htmlFor="description" className="premium-label">Popis</label>
          <textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} rows={4} className="premium-textarea" placeholder="Popis služby" />
        </div>

        <div className="premium-form-grid">
          <div className="premium-field">
            <label htmlFor="duration" className="premium-label">Trvanie (minúty)*</label>
            <input id="duration" type="number" value={duration} onChange={(event) => setDuration(parseInt(event.target.value, 10) || 0)} required min={1} className="premium-input" placeholder="30" />
          </div>
          <div className="premium-field">
            <label htmlFor="price" className="premium-label">Cena (€)*</label>
            <input id="price" type="number" value={price} onChange={(event) => setPrice(parseFloat(event.target.value) || 0)} required min={0} step={0.01} className="premium-input" placeholder="0.00" />
          </div>
        </div>

        <label className="premium-checkbox-row">
          <input id="is_active" type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} className="premium-checkbox" />
          <span className="premium-copy">Aktívna služba</span>
        </label>

        <div className="premium-actions">
          <button type="submit" disabled={isLoading} className="premium-button">
            {isLoading ? 'Ukladanie...' : 'Uložiť službu'}
          </button>
          <button type="button" className="premium-button-secondary" onClick={() => router.push(`/${tenant.tenant.slug}/admin?tab=services`)}>
            Zrušiť
          </button>
        </div>
      </form>
    </div>
  );
}
