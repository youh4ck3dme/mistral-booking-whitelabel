'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import { useState } from 'react';

export default function NewTenantPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateSlug = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    try {
      setIsLoading(true);
      setError(null);

      const { count } = await supabase
        .from('tenants')
        .select('*', { count: 'exact', head: true })
        .eq('slug', slug);

      if (count && count > 0) {
        setError('Tento slug už existuje');
        return;
      }

      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .insert({ name, slug })
        .select()
        .single();

      if (tenantError) throw tenantError;

      await supabase.from('tenant_branding').insert({
        tenant_id: tenantData.id,
        primary_color: '#3B82F6',
      });

      await supabase.from('time_slots_config').insert({
        tenant_id: tenantData.id,
        start_time: '08:00:00',
        end_time: '18:00:00',
        is_active: true,
      });

      router.push('/platform?tab=tenants');
    } catch (submitError: any) {
      setError(submitError.message || 'Nepodarilo sa vytvoriť tenanta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="premium-stack" style={{ maxWidth: '760px' }}>
      <section className="premium-section-header">
        <span className="premium-section-label">Platform setup</span>
        <h1 className="premium-section-title">Nový tenant</h1>
        <p className="premium-lead">Vytvorte nový white-label booking workspace bez zmeny backend flow.</p>
      </section>

      {error && <div className="premium-alert premium-alert--error">{error}</div>}

      <form onSubmit={handleSubmit} className="premium-card premium-form">
        <div className="premium-field">
          <label htmlFor="name" className="premium-label">Názov tenanta*</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) => {
              const nextName = event.target.value;
              setName(nextName);
              setSlug(generateSlug(nextName));
            }}
            required
            className="premium-input"
            placeholder="Názov tenanta"
          />
        </div>

        <div className="premium-field">
          <label htmlFor="slug" className="premium-label">Slug*</label>
          <input
            id="slug"
            type="text"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            required
            className="premium-input"
            placeholder="tenant-slug"
          />
          <span className="premium-helper">Slug bude použitý v URL, napr. /demo-clinic/book</span>
        </div>

        <div className="premium-actions">
          <button type="submit" disabled={isLoading} className="premium-button">
            {isLoading ? 'Vytváram...' : 'Vytvoriť tenanta'}
          </button>
          <button
            type="button"
            className="premium-button-secondary"
            onClick={() => router.push('/platform?tab=tenants')}
          >
            Zrušiť
          </button>
        </div>
      </form>
    </div>
  );
}
