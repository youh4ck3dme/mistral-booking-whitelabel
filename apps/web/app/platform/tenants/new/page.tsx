'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@repo/ui';

export default function NewTenantPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      setError(null);

      // Check if slug already exists
      const { count } = await supabase
        .from('tenants')
        .select('*', { count: 'exact', head: true })
        .eq('slug', slug);

      if (count && count > 0) {
        setError('Tento slug už existuje');
        return;
      }

      // Create tenant
      const { error } = await supabase.from('tenants').insert({
        name,
        slug,
      });

      if (error) {
        throw error;
      }

      // Create default branding
      await supabase.from('tenant_branding').insert({
        tenant_id: `SELECT id FROM tenants WHERE slug = '${slug}'`,
        primary_color: '#3B82F6',
      });

      // Create default time slots
      await supabase.from('time_slots_config').insert({
        tenant_id: `SELECT id FROM tenants WHERE slug = '${slug}'`,
        start_time: '08:00:00',
        end_time: '18:00:00',
        is_active: true,
      });

      router.push('/platform?tab=tenants');
    } catch (err: any) {
      setError(err.message || 'Nepodarilo sa vytvoriť tenanta');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    setSlug(generateSlug(newName));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Nový Tenant</h1>

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
            onChange={handleNameChange}
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
          <p className="mt-1 text-sm text-gray-500">
            Slug bude použitý v URL (napr. /demo-clinic/book)
          </p>
        </div>

        <div className="flex gap-4 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Vytváram...' : 'Vytvoriť Tenanta'}
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
    </div>
  );
}
