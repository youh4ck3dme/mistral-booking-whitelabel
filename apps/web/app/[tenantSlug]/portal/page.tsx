'use client';

import type { Booking } from '@repo/core';
import { dispatchBookingNotificationsRequest, storeFlashToast } from '@repo/web/src/lib/notifications/client';
import { useNotifications } from '@repo/web/app/notifications-provider';
import { cancelBooking } from '@repo/web/src/lib/booking/booking.service';
import { useTenant } from '@repo/web/src/lib/tenant/TenantProvider';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { CSSProperties } from 'react';
import { useCallback, useEffect, useState } from 'react';

export default function ClientPortalPage() {
  const [supabase] = useState(() => createClientComponentClient());
  const router = useRouter();
  const tenant = useTenant();
  const { notifyError, notifyInfo, notifySuccess } = useNotifications();

  type BookingWithService = Booking & {
    service: { name: string; price: number; duration: number } | null;
  };
  const [bookings, setBookings] = useState<BookingWithService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const primaryColor = tenant.branding?.primary_color || '#3B82F6';
  const tenantSlug = tenant?.tenant?.slug;

  const setReturnTo = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('returnTo', `/${tenantSlug}/portal`);
    }
  }, [tenantSlug]);

  useEffect(() => {
    if (!tenant?.tenant?.id) return;

    const fetchBookings = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setReturnTo();
          storeFlashToast({
            title: 'Prihláste sa pre prístup',
            description: 'Po prihlásení vás vrátime späť do klientského portálu.',
            variant: 'info',
          });
          router.push('/login');
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('bookings')
          .select('*, service:services(name, price, duration)')
          .eq('tenant_id', tenant.tenant.id)
          .eq('user_id', user.id)
          .order('start_time', { ascending: true });

        if (fetchError) {
          setError('Nepodarilo sa načítať vaše rezervácie');
          return;
        }
        setBookings((data || []) as any);
      } catch {
        setError('Nepodarilo sa načítať vaše rezervácie');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [router, setReturnTo, supabase, tenant?.tenant?.id]);

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleString('sk-SK', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const formatStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      confirmed: 'Potvrdená',
      cancelled: 'Zrušená',
      pending: 'Čaká na potvrdenie',
    };
    return statusMap[status] || status;
  };

  const statusClass = (status: Booking['status']) => {
    if (status === 'confirmed') return 'premium-status premium-status--success';
    if (status === 'cancelled') return 'premium-status premium-status--danger';
    return 'premium-status premium-status--warning';
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      setCancellingId(bookingId);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setReturnTo();
        storeFlashToast({
          title: 'Prihláste sa pre prístup',
          description: 'Po prihlásení vás vrátime späť do klientského portálu.',
          variant: 'info',
        });
        router.push('/login');
        return;
      }

      const success = await cancelBooking(bookingId, user.id);

      if (success) {
        const { data: refreshData } = await supabase
          .from('bookings')
          .select('*, service:services(name, price, duration)')
          .eq('tenant_id', tenant.tenant.id)
          .eq('user_id', user.id)
          .order('start_time', { ascending: true });
        setBookings((refreshData || []) as any);
        notifySuccess('Rezervácia bola zrušená', 'Klientský portál aj stav rezervácie sú aktualizované.');

        try {
          const dispatchResult = await dispatchBookingNotificationsRequest(bookingId);

          if (dispatchResult.sent === 0) {
            notifyInfo(
              'Email zrušenia čaká vo fronte',
              'Notifikácia je pripravená, ale nepodarilo sa ju odoslať okamžite.'
            );
          }
        } catch {
          notifyInfo(
            'Email zrušenia čaká vo fronte',
            'Notifikácia je pripravená, ale nepodarilo sa ju odoslať okamžite.'
          );
        }
      } else {
        setError('Nepodarilo sa zrušiť rezerváciu');
        notifyError('Zrušenie rezervácie zlyhalo', 'Skúste to prosím ešte raz.');
      }
    } catch {
      setError('Nastala chyba pri rušení rezervácie');
      notifyError('Zrušenie rezervácie zlyhalo', 'Nastala nečakaná chyba pri rušení rezervácie.');
    } finally {
      setCancellingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="premium-card premium-stack" style={{ '--accent': primaryColor } as CSSProperties}>
        <div className="premium-inline-actions">
          <div className="premium-spinner" />
          <span className="premium-copy">Loading your bookings…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="premium-stack" style={{ '--accent': primaryColor } as CSSProperties}>
        <div className="premium-alert premium-alert--error">{error}</div>
        <button
          type="button"
          className="premium-button"
          onClick={() => router.push(`/${tenant.tenant.slug}`)}
        >
          Späť na domovskú stránku
        </button>
      </div>
    );
  }

  return (
    <div className="premium-stack" style={{ '--accent': primaryColor } as CSSProperties}>
      <section className="premium-hero">
        <div className="premium-hero-copy premium-stack">
          <span className="premium-eyebrow">Client portal</span>
          <h1 className="premium-title premium-title--medium">Môj účet</h1>
          <p className="premium-lead">
            Sledujte svoje rezervácie, zrušte nepotrebné termíny a pokračujte späť do booking flow
            bez zmeny existujúcej logiky.
          </p>
          <div className="premium-actions">
            <Link href={`/${tenant.tenant.slug}/book`} className="premium-button">
              Rezervovať termín
            </Link>
            <Link href={`/${tenant.tenant.slug}`} className="premium-button-secondary">
              Späť na tenant
            </Link>
          </div>
        </div>
      </section>

      <section className="premium-section">
        <div className="premium-section-header">
          <span className="premium-section-label">Bookings</span>
          <h2 className="premium-section-title">Moje rezervácie</h2>
        </div>

        {bookings.length === 0 ? (
          <div className="premium-empty">
            <span className="premium-kicker">Fallback state</span>
            <h3 className="premium-card-title">Nemáte žiadne rezervácie</h3>
            <p className="premium-empty-copy">
              Keď vytvoríte prvú rezerváciu, objaví sa tu s aktuálnym stavom a ďalšími akciami.
            </p>
            <Link href={`/${tenant.tenant.slug}/book`} className="premium-button">
              Rezervovať termín
            </Link>
          </div>
        ) : (
          <div className="premium-table-wrap">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Služba</th>
                  <th>Dátum a čas</th>
                  <th>Stav</th>
                  <th>Akcie</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>
                      <strong>{(booking as BookingWithService).service?.name ?? '—'}</strong>
                      <div className="premium-muted">{(booking as BookingWithService).service?.price} € · {(booking as BookingWithService).service?.duration} min</div>
                    </td>
                    <td>{formatDateTime(booking.start_time)} - {formatDateTime(booking.end_time)}</td>
                    <td>
                      <span className={statusClass(booking.status)}>{formatStatus(booking.status)}</span>
                    </td>
                    <td>
                      {booking.status === 'confirmed' ? (
                        <button
                          type="button"
                          className="premium-button-danger"
                          onClick={() => handleCancelBooking(booking.id)}
                          disabled={cancellingId === booking.id}
                        >
                          {cancellingId === booking.id ? 'Zrušenie...' : 'Zrušiť'}
                        </button>
                      ) : (
                        <span className="premium-muted">Bez akcie</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="premium-card premium-stack">
        <span className="premium-section-label">Account settings</span>
        <h2 className="premium-section-title">Nastavenia účtu</h2>
        <p className="premium-copy">
          Tu zostáva priestor pre ďalšie portálové nastavenia bez zásahu do súčasného account flow.
        </p>
      </section>
    </div>
  );
}
