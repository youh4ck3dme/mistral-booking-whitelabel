'use client';

import type { Tenant, TenantBranding } from '@repo/core';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import type { CSSProperties, FormEvent } from 'react';
import { useEffect, useState } from 'react';

export default function EditTenantPage({
  params,
}: {
  params: { tenantId: string };
}) {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', params.tenantId)
          .single();

        if (tenantError) throw tenantError;
        if (!tenantData) {
          router.push('/404');
          return;
        }

        setTenant(tenantData);
        setName(tenantData.name);
        setSlug(tenantData.slug);

        const { data: brandingData } = await supabase
          .from('tenant_branding')
          .select('*')
          .eq('tenant_id', params.tenantId)
          .single();

        if (brandingData) {
          setBranding(brandingData);
          setPrimaryColor(brandingData.primary_color);
        }
      } catch (fetchError: any) {
        setError(fetchError.message || 'Nepodarilo sa načítať tenanta');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenant();
  }, [params.tenantId, router, supabase]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!tenant) return;

    try {
      setIsLoading(true);
      setError(null);

      const { error: tenantError } = await supabase
        .from('tenants')
        .update({ name, slug })
        .eq('id', params.tenantId);

      if (tenantError) throw tenantError;

      if (branding) {
        await supabase
          .from('tenant_branding')
          .update({ primary_color: primaryColor })
          .eq('tenant_id', params.tenantId);
      } else {
        await supabase.from('tenant_branding').insert({
          tenant_id: params.tenantId,
          primary_color: primaryColor,
        });
      }

      router.push('/platform?tab=tenants');
    } catch (submitError: any) {
      setError(submitError.message || 'Nepodarilo sa aktualizovať tenanta');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !tenant) {
    return (
      <div className="premium-card premium-stack">
        <div className="premium-inline-actions">
          <div className="premium-spinner" />
          <span className="premium-copy">Loading tenant settings…</span>
        </div>
      </div>
    );
  }

  if (error && !tenant) {
    return (
      <div className="premium-stack">
        <div className="premium-alert premium-alert--error">{error}</div>
        <button type="button" className="premium-button" onClick={() => router.push('/platform?tab=tenants')}>
          Späť
        </button>
      </div>
    );
  }

  if (!tenant) {
    return <div className="premium-empty"><p className="premium-empty-copy">Tenant neexistuje.</p></div>;
  }

  return (
    <div className="premium-stack" style={{ '--accent': primaryColor } as CSSProperties}>
      <section className="premium-section-header">
        <span className="premium-section-label">Platform setup</span>
        <h1 className="premium-section-title">Upraviť tenanta</h1>
      </section>

      {error && <div className="premium-alert premium-alert--error">{error}</div>}

      <form onSubmit={handleSubmit} className="premium-card premium-form">
        <div className="premium-field">
          <label htmlFor="name" className="premium-label">Názov tenanta*</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="premium-input"
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
          />
        </div>

        <div className="premium-field">
          <label className="premium-label">Primárna farba</label>
          <div className="premium-inline-actions">
            <input
              type="color"
              value={primaryColor}
              onChange={(event) => setPrimaryColor(event.target.value)}
              className="premium-color-input"
            />
            <input
              type="text"
              value={primaryColor}
              onChange={(event) => setPrimaryColor(event.target.value)}
              className="premium-input"
              maxLength={7}
            />
          </div>
        </div>

        <div className="premium-actions">
          <button type="submit" disabled={isLoading} className="premium-button">
            {isLoading ? 'Ukladanie...' : 'Uložiť zmeny'}
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

      <div className="premium-card premium-stack">
        <span className="premium-section-label">Nebezpečná zóna</span>
        <h2 className="premium-section-title">Odstrániť tenanta</h2>
        <p className="premium-copy">
          Odstránením tenanta odstránite všetky dáta, služby, rezervácie a používateľov spojených s týmto tenantom.
        </p>
        <button
          type="button"
          className="premium-button-danger"
          onClick={async () => {
            if (!confirm('Naozaj chcete odstrániť tento tenant a všetky jeho dáta?')) return;
            try {
              setIsLoading(true);
              const { error: deleteError } = await supabase
                .from('tenants')
                .delete()
                .eq('id', params.tenantId);

              if (deleteError) throw deleteError;
              router.push('/platform?tab=tenants');
            } catch (deleteTenantError: any) {
              setError(deleteTenantError.message || 'Nepodarilo sa odstrániť tenanta');
            } finally {
              setIsLoading(false);
            }
          }}
          disabled={isLoading}
        >
          {isLoading ? 'Odstraňujem...' : 'Odstrániť tenanta'}
        </button>
      </div>
    </div>
  );
}
