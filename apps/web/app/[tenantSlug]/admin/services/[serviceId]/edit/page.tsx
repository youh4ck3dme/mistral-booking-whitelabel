'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTenant } from '@repo/web/src/lib/tenant/TenantProvider';
import { Service } from '@repo/core';
import { Button } from '@repo/ui';

export default function EditServicePage({
  params,
}: {
  params: { tenantSlug: string; serviceId: string };
}) {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const tenant = useTenant();
  
  const [service, setService] = useState<Service | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState<number>(30);
  const [price, setPrice] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch service data
  useEffect(() => {
    if (!tenant?.tenant?.id) return;

    const fetchService = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('id', params.serviceId)
          .eq('tenant_id', tenant.tenant.id)
          .single();

        if (error) throw error;
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
      } catch (err: any) {
        setError(err.message || 'Nepodarilo sa načítať službu');
      } finally {
        setIsLoading(false);
      }
    };

    fetchService();
  }, [tenant?.tenant?.id, params.serviceId, router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tenant?.tenant?.id || !service) return;

    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase
        .from('services')
        .update({
          name,
          description,
          duration,
          price,
          is_active: isActive,
        })
        .eq('id', params.serviceId)
        .eq('tenant_id', tenant.tenant.id);

      if (error) {
        throw error;
      }

      router.push(`/${tenant.tenant.slug}/admin?tab=services`);
    } catch (err: any) {
      setError(err.message || 'Nepodarilo sa aktualizovať službu');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !service) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
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
        <Button onClick={() => router.push(`/${tenant.tenant.slug}/admin?tab=services`)}>
          Späť
        </Button>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="max-w-2xl mx-auto">
        <p className="text-gray-500">Služba neexistuje.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Upraviť službu</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Názov služby*
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Názov služby"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Popis
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Popis služby"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
              Trvanie (minúty)*
            </label>
            <input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
              required
              min={1}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="30"
            />
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Cena (€)*
            </label>
            <input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              required
              min={0}
              step={0.01}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="flex items-center">
          <input
            id="is_active"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
            Aktívna služba
          </label>
        </div>

        <div className="flex gap-4 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Ukladanie...' : 'Uložiť zmeny'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push(`/${tenant.tenant.slug}/admin?tab=services`)}
          >
            Zrušiť
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={async () => {
              if (confirm('Naozaj chcete odstrániť túto službu?')) {
                try {
                  setIsLoading(true);
                  const { error } = await supabase
                    .from('services')
                    .delete()
                    .eq('id', params.serviceId)
                    .eq('tenant_id', tenant.tenant.id);

                  if (error) throw error;
                  router.push(`/${tenant.tenant.slug}/admin?tab=services`);
                } catch (err: any) {
                  setError(err.message || 'Nepodarilo sa odstrániť službu');
                } finally {
                  setIsLoading(false);
                }
              }
            }}
          >
            Odstrániť
          </Button>
        </div>
      </form>
    </div>
  );
}
