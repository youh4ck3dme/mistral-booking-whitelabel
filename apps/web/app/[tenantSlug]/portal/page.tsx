'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTenant } from '@repo/web/src/lib/tenant/TenantProvider';
import { Booking } from '@repo/core/types';
import { cancelBooking, getBookingsByUser } from '@repo/web/src/lib/booking/booking.service';
import { Button } from '@repo/ui';

export default function ClientPortalPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const tenant = useTenant();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const primaryColor = tenant.branding?.primary_color || '#3B82F6';

  // Fetch user's bookings
  useEffect(() => {
    if (!tenant?.tenant?.id) return;

    const fetchBookings = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push(`/${tenant.tenant.slug}/login`);
          return;
        }

        const bookings = await getBookingsByUser(tenant.tenant.id, user.id);
        setBookings(bookings);
      } catch (err) {
        setError('Nepodarilo sa načítať vaše rezervácie');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [tenant?.tenant?.id, router, supabase.auth]);

  // Format date for display
  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('sk-SK', {
      day: 'numeric',
      month: 'long',
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

  // Handle booking cancellation
  const handleCancelBooking = async (bookingId: string) => {
    try {
      setCancellingId(bookingId);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Prosím, prihláste sa');
        return;
      }

      const success = await cancelBooking(bookingId, user.id);
      
      if (success) {
        // Refresh bookings
        const updatedBookings = await getBookingsByUser(tenant.tenant.id, user.id);
        setBookings(updatedBookings);
      } else {
        setError('Nepodarilo sa zrušiť rezerváciu');
      }
    } catch (err) {
      setError('Nastala chyba pri rušení rezervácie');
    } finally {
      setCancellingId(null);
    }
  };

  // If loading, show loading state
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  // If error, show error
  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
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
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Moj účet</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Moje rezervácie</h2>
        
        {bookings.length === 0 ? (
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <p className="text-gray-500 mb-4">Nemáte žiadne rezervácie.</p>
            <Button onClick={() => router.push(`/${tenant.tenant.slug}/book`)}>
              Rezervovať termín
            </Button>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Služba
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
                        {booking.service_id}
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
                      {booking.status === 'confirmed' && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleCancelBooking(booking.id)}
                          disabled={cancellingId === booking.id}
                        >
                          {cancellingId === booking.id ? 'Zrušenie...' : 'Zrušiť'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Nastavenia účtu</h2>
        <p className="text-gray-600">
          Tu budú nastavenia vášho účtu. (Funkcionalita bude doplnená)
        </p>
      </section>
    </div>
  );
}
