'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Tenant } from '@repo/core';
import { Button, Card } from '@repo/ui';

export default function PlatformAdminPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is platform admin (in production, this would check a special role)
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // In production, check if user has platform admin role
      // For demo, we'll just allow access
      if (!user) {
        router.push('/login');
      }
    };
    
    checkAdmin();
  }, [supabase.auth, router]);

  // Fetch all tenants
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('tenants')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTenants(data || []);
      } catch (err) {
        setError('Nepodarilo sa načítať tenantov');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenants();
  }, [supabase]);

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sk-SK', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // If loading, show loading state
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
        </div>
      </div>
    );
  }

  // If error, show error
  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
        <Button onClick={() => router.push('/')}>Späť na domovsku stránku</Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Platform Admin - NEXIFY TECH CENTER</h1>

      <Card className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Prehľad platformy</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-2">Počet Tenantov</h3>
            <p className="text-3xl font-bold">{tenants.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-2">Aktívni Tenanti</h3>
            <p className="text-3xl font-bold">{tenants.filter(t => true).length}</p> {/* All are active in this demo */}
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-2">Noví Tenanti (30 dní)</h3>
            <p className="text-3xl font-bold">0</p> {/* Demo value */}
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Zoznam Tenantov</h2>
          <Button onClick={() => router.push('/platform/tenants/new')}>
            Pridať nového Tenanta
          </Button>
        </div>

        {tenants.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Žiadni tenanti. Kliknite na &quot;Pridať nového Tenanta&quot; pre vytvorenie prvého.
          </p>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Názov
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vytvorený
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcie
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {tenant.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        /{tenant.slug}/book
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatDate(tenant.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="mr-2"
                        onClick={() => router.push(`/platform/tenants/${tenant.id}/edit`)}
                      >
                        Upraviť
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => router.push(`/${tenant.slug}`)}
                      >
                        Zobraziť
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
