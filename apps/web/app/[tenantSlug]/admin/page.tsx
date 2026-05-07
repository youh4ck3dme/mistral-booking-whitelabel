'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTenant } from '@repo/web/src/lib/tenant/TenantProvider';
import { Service, Booking, TenantBranding } from '@repo/core/types';
import { getServicesByTenant, getBookingsByUser } from '@repo/web/src/lib/booking/booking.service';
import { getRecommendedServices } from '@repo/ai/src/recommendation/recommendation.service';
import { getUpsellBundles } from '@repo/ai/src/upsell/upsell.service';
import { Button, Card } from '@repo/ui';

export default function TenantAdminPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const tenant = useTenant();
  
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'services' | 'bookings' | 'branding' | 'ai' | 'users'>('services');

  const primaryColor = tenant.branding?.primary_color || '#3B82F6';

  // Check if user is admin
  useEffect(() => {
    if (tenant?.userRole !== 'admin') {
      router.push(`/${tenant.tenant.slug}`);
    }
  }, [tenant, router]);

  // Fetch data based on active tab
  useEffect(() => {
    if (!tenant?.tenant?.id) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (activeTab === 'services') {
          const services = await getServicesByTenant(tenant.tenant.id);
          setServices(services);
        } else if (activeTab === 'bookings') {
          const { data: allBookings } = await supabase
            .from('bookings')
            .select('*')
            .eq('tenant_id', tenant.tenant.id)
            .order('start_time', { ascending: false });
          setBookings(allBookings || []);
        } else if (activeTab === 'branding') {
          const { data: brandingData } = await supabase
            .from('tenant_branding')
            .select('*')
            .eq('tenant_id', tenant.tenant.id)
            .single();
          setBranding(brandingData || null);
        }
      } catch (err) {
        setError('Nepodarilo sa načítať dáta');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [tenant?.tenant?.id, activeTab, supabase]);

  // Format date for display
  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('sk-SK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format status for display
  const formatStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      confirmed: 'Potvrdená',
      cancelled: 'Zrušená',
      pending: 'Čaká na potvrdenie',
    };
    return statusMap[status] || status;
  };

  // Handle branding update
  const handleUpdateBranding = async (field: keyof TenantBranding, value: string) => {
    try {
      if (!branding?.id) return;

      const { error } = await supabase
        .from('tenant_branding')
        .update({ [field]: value })
        .eq('id', branding.id);

      if (error) throw error;

      setBranding({ ...branding, [field]: value });
    } catch (err) {
      setError('Nepodarilo sa aktualizovať branding');
    }
  };

  // Handle service toggle
  const handleToggleService = async (serviceId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !isActive })
        .eq('id', serviceId);

      if (error) throw error;

      setServices(
        services.map((s) =>
          s.id === serviceId ? { ...s, is_active: !isActive } : s
        )
      );
    } catch (err) {
      setError('Nepodarilo sa aktualizovať službu');
    }
  };

  // If not admin, show loading
  if (tenant?.userRole !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
        </div>
      </div>
    );
  }

  // If loading, show loading state
  if (isLoading && (services.length === 0 || bookings.length === 0)) {
    return (
      <div className="max-w-6xl mx-auto">
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
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
        <Button onClick={() => router.push(`/${tenant.tenant.slug}`)}>
          Späť na domovsku stránku
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin Panel - {tenant.tenant.name}</h1>

      {/* Admin Navigation Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {[
            { id: 'services', label: 'Služby' },
            { id: 'bookings', label: 'Rezervácie' },
            { id: 'branding', label: 'Branding' },
            { id: 'ai', label: 'AI Nastavenia' },
            { id: 'users', label: 'Používatelia' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`${
                activeTab === tab.id
                  ? `border-${primaryColor.replace('#', '')} text-${primaryColor.replace('#', '')}`
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              style={{
                borderColor: activeTab === tab.id ? primaryColor : undefined,
                color: activeTab === tab.id ? primaryColor : undefined,
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* Services Tab */}
        {activeTab === 'services' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Služby</h2>
              <Button
                onClick={() => router.push(`/${tenant.tenant.slug}/admin/services/new`)}
                style={{ backgroundColor: primaryColor }}
              >
                Pridať novú službu
              </Button>
            </div>

            {services.length === 0 ? (
              <Card>
                <p className="text-gray-500 text-center py-8">
                  Žiadne služby. Kliknite na "Pridať novú službu" pre vytvorenie prvej.
                </p>
              </Card>
            ) : (
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Názov
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Popis
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cena
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trvanie
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stav
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Akcie
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {services.map((service) => (
                      <tr key={service.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {service.name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">
                            {service.description || '—'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium">
                            {service.price} €
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {service.duration} min
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              service.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {service.is_active ? 'Aktívna' : 'Neaktívna'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="mr-2"
                            onClick={() => router.push(`/${tenant.tenant.slug}/admin/services/${service.id}/edit`)}
                          >
                            Upraviť
                          </Button>
                          <Button
                            size="sm"
                            variant={service.is_active ? 'danger' : 'primary'}
                            onClick={() => handleToggleService(service.id, service.is_active)}
                          >
                            {service.is_active ? 'Deaktivovať' : 'Aktivovať'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Rezervácie</h2>

            {bookings.length === 0 ? (
              <Card>
                <p className="text-gray-500 text-center py-8">
                  Žiadne rezervácie.
                </p>
              </Card>
            ) : (
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Služba
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Používateľ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dátum a čas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stav
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Akcie
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {booking.id.slice(0, 8)}...
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">
                            {booking.service_id}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">
                            {booking.user_id.slice(0, 8)}...
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {formatDateTime(booking.start_time)} - {formatDateTime(booking.end_time)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              booking.status === 'confirmed'
                                ? 'bg-green-100 text-green-800'
                                : booking.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {formatStatus(booking.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button size="sm" variant="secondary">
                            Zobraziť
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Branding Tab */}
        {activeTab === 'branding' && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Branding</h2>

            <Card>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo URL
                  </label>
                  <div className="flex gap-4">
                    <input
                      type="text"
                      value={branding?.logo_url || ''}
                      onChange={(e) => handleUpdateBranding('logo_url', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                  {branding?.logo_url && (
                    <img
                      src={branding.logo_url}
                      alt="Logo"
                      className="mt-4 h-16 object-contain"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Favicon URL
                  </label>
                  <div className="flex gap-4">
                    <input
                      type="text"
                      value={branding?.favicon_url || ''}
                      onChange={(e) => handleUpdateBranding('favicon_url', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/favicon.ico"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primárna farba
                  </label>
                  <div className="flex gap-4 items-center">
                    <input
                      type="color"
                      value={branding?.primary_color || '#3B82F6'}
                      onChange={(e) => handleUpdateBranding('primary_color', e.target.value)}
                      className="w-12 h-10 rounded-md border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={branding?.primary_color || '#3B82F6'}
                      onChange={(e) => handleUpdateBranding('primary_color', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                      maxLength={7}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <h3 className="text-lg font-medium mb-2">Náhľad</h3>
                  <div
                    className="p-6 rounded-lg"
                    style={{ backgroundColor: `${branding?.primary_color || '#3B82F6'}10` }}
                  >
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: branding?.primary_color || '#3B82F6' }}
                    >
                      {tenant.tenant.name.charAt(0).toUpperCase()}
                    </div>
                    <h4 className="mt-4 font-semibold">{tenant.tenant.name}</h4>
                    <p className="text-sm text-gray-600">Náhľad branding-u</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* AI Tab */}
        {activeTab === 'ai' && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">AI Nastavenia</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-lg font-medium mb-4">Odporúčania služieb</h3>
                <p className="text-gray-600 mb-4">
                  AI systém automaticky odporúča služby používateľom na základe ich histórie.
                </p>
                <Button variant="secondary">
                  Zobraziť štatistiky
                </Button>
              </Card>

              <Card>
                <h3 className="text-lg font-medium mb-4">Upsell Balíčky</h3>
                <p className="text-gray-600 mb-4">
                  AI generuje osobitné balíčky pre zvýšenie predaja.
                </p>
                <Button variant="secondary">
                  Nastaviť balíčky
                </Button>
              </Card>
            </div>

            <Card className="mt-6">
              <h3 className="text-lg font-medium mb-4">AI Experimenty</h3>
              <p className="text-gray-600 mb-4">
                Tu môžeš spravovať A/B testy pre optimalizáciu konverzie.
              </p>
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Názov
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Popis
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Akcie
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          Service Recommendation A/B Test
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">
                          Test different recommendation algorithms
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button size="sm" variant="secondary">
                          Zobraziť
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Používatelia</h2>

            <Card>
              <p className="text-gray-600 text-center py-8">
                Správa používateľov bude implementovaná v nasledujúcej fáze.
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
