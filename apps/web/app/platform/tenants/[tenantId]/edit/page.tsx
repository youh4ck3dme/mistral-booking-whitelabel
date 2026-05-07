'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Tenant, TenantBranding } from '@repo/core/types';
import { Button } from '@repo/ui';

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

  // Fetch tenant data
  useEffect(() => {
    const fetchTenant = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch tenant
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

        // Fetch branding
        const { data: brandingData } = await supabase
          .from('tenant_branding')
          .select('*')
          .eq('tenant_id', params.tenantId)
          .single();

        if (brandingData) {
          setBranding(brandingData);
          setPrimaryColor(brandingData.primary_color);
        }
      } catch (err: any) {
        setError(err.message || 'Nepodarilo sa načítať tenanta');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenant();
  }, [params.tenantId, router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tenant) return;

    try {
      setIsLoading(true);
      setError(null);

      // Update tenant
      const { error: tenantError } = await supabase
        .from('tenants')
        .update({
          name,
          slug,
        })
        .eq('id', params.tenantId);

      if (tenantError) throw tenantError;

      // Update branding
      if (branding) {
        await supabase
          .from('tenant_branding')
          .update({
            primary_color: primaryColor,
          })
          .eq('tenant_id', params.tenantId);
      } else {
        await supabase.from('tenant_branding').insert({
          tenant_id: params.tenantId,
          primary_color: primaryColor,
        });
      }

      router.push('/platform?tab=tenants');
    } catch (err: any) {
      setError(err.message || 'Nepodarilo sa aktualizovať tenanta');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !tenant) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
        <Button onClick={() => router.push('/platform?tab=tenants')}>
          Späť
        </Button>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="max-w-2xl mx-auto">
        <p className="text-gray-500">Tenant neexistuje.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Upraviť Tenanta</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Názov Tenanta*
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Názov tenanta"
          />
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
            Slug*
          </label>
          <div className="flex gap-2">
            <span className="px-3 py-2 bg-gray-100 rounded-l-md border border-r-0 border-gray-300">
              /
            </span>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="tenant-slug"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Primárna farba
          </label>
          <div className="flex gap-4 items-center">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-12 h-10 rounded-md border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              maxLength={7}
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Ukladanie...' : 'Uložiť zmeny'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/platform?tab=tenants')}
          >
            Zrušiť
          </Button>
        </div>
      </form>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Nebezpečná zóna</h2>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <h3 className="font-medium mb-2">Odstrániť Tenanta</h3>
          <p className="text-sm text-red-700 mb-4">
            Odstránením tenanta odstránite všetky dátá, služby, rezervácie a používateľov spojených s týmto tenantom. Tuto akciu nie je možné vrátiť späť.
          </p>
          <Button
            variant="danger"
            onClick={async () => {
              if (confirm('Naozaj chcete odstrániť tento tenant a všetky jeho dáta?')) {
                try {
                  setIsLoading(true);
                  
                  // Delete tenant (cascade will delete all related data)
                  const { error } = await supabase
                    .from('tenants')
                    .delete()
                    .eq('id', params.tenantId);

                  if (error) throw error;
                  
                  router.push('/platform?tab=tenants');
                } catch (err: any) {
                  setError(err.message || 'Nepodarilo sa odstrániť tenanta');
                } finally {
                  setIsLoading(false);
                }
              }
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Odstraňujem...' : 'Odstrániť Tenanta'}
          </Button>
        </div>
      </div>
    </div>
  );
}
