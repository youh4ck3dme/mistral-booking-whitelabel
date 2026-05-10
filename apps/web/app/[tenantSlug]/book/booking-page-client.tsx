'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Service } from '@repo/core';
import { dispatchBookingNotificationsRequest, storeFlashToast } from '@repo/web/src/lib/notifications/client';
import { useNotifications } from '@repo/web/app/notifications-provider';
import { useTenant } from '@repo/web/src/lib/tenant/TenantProvider';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { CSSProperties, FormEvent } from 'react';
import { useEffect, useState } from 'react';

export default function BookingPageClient({
  initialServices,
}: {
  initialServices: Service[];
}) {
  const [supabase] = useState(() => createClientComponentClient());
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenant = useTenant();
  const { notifyError, notifyInfo, notifySuccess } = useNotifications();

  const [services] = useState<Service[]>(initialServices);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<'sent' | 'pending'>('pending');

  const primaryColor = tenant.branding?.primary_color || '#3B82F6';

  const setReturnTo = () => {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(
          'returnTo',
          `/${tenant.tenant.slug}/book${window.location.search || ''}`
        );
    }
  };

  useEffect(() => {
    const serviceId = searchParams.get('service');
    if (!serviceId) return;

    const preselected = services.find((service) => service.id === serviceId);
    if (preselected) {
      setSelectedService(preselected);
    }
  }, [searchParams, services]);

  useEffect(() => {
    if (!selectedService || !selectedDate) {
      setTimeSlots([]);
      return;
    }

    const slots: string[] = [];
    const startHour = 8;
    const endHour = 18;
    const duration = selectedService.duration;

    for (let hour = startHour; hour <= endHour - Math.ceil(duration / 60); hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const end = hour + Math.ceil(duration / 60);
      const endTime = `${end.toString().padStart(2, '0')}:00`;
      slots.push(`${startTime}-${endTime}`);
    }

    setTimeSlots(slots);
  }, [selectedDate, selectedService]);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setSelectedDate('');
    setSelectedTime('');
    setTimeSlots([]);
    setError(null);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime('');
    setError(null);
  };

  const getAvailableDates = (): string[] => {
    const dates: string[] = [];
    const today = new Date();

    for (let index = 0; index < 14; index++) {
      const date = new Date(today);
      date.setDate(today.getDate() + index);
      dates.push(date.toISOString().split('T')[0]);
    }

    return dates;
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('sk-SK', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

  const handleBookingSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!selectedService || !selectedDate || !selectedTime) {
      setError('Vyberte službu, dátum a čas');
      notifyError('Rezervácia je neúplná', 'Vyberte službu, dátum aj čas.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [startTime, endTime] = selectedTime.split('-');
      const [startHour, startMinute] = startTime.split(':');
      const [endHour, endMinute] = endTime.split(':');

      const startDate = new Date(selectedDate);
      startDate.setHours(parseInt(startHour, 10), parseInt(startMinute, 10));

      const endDate = new Date(selectedDate);
      endDate.setHours(parseInt(endHour, 10), parseInt(endMinute, 10));

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setReturnTo();
        storeFlashToast({
          title: 'Prihláste sa pre dokončenie',
          description: 'Po prihlásení vás vrátime späť do rezervácie.',
          variant: 'info',
        });
        router.push('/login');
        return;
      }

      const { data: booking, error: bookingError } = await supabase.rpc('create_booking', {
        p_tenant_id: tenant.tenant.id,
        p_user_id: user.id,
        p_service_id: selectedService.id,
        p_start_time: startDate.toISOString(),
        p_end_time: endDate.toISOString(),
      });

      if (bookingError) throw bookingError;

      setSuccess(true);
      setBookingId(booking as string);
      setSelectedService(null);
      setSelectedDate('');
      setSelectedTime('');

      try {
        const dispatchResult = await dispatchBookingNotificationsRequest(booking as string);

        if (dispatchResult.sent > 0) {
          setEmailStatus('sent');
          notifySuccess('Rezervácia bola potvrdená', 'Potvrdzovací email bol úspešne odoslaný.');
        } else {
          setEmailStatus('pending');
          notifyInfo(
            'Rezervácia je potvrdená',
            'Email ostal vo fronte a odošle sa po dokončení konfigurácie notifikácií.'
          );
        }
      } catch {
        setEmailStatus('pending');
        notifyInfo(
          'Rezervácia je potvrdená',
          'Email notifikácia je pripravená, ale jej odoslanie sa nepodarilo dokončiť okamžite.'
        );
      }
    } catch (submitError: any) {
      const message = submitError.message || 'Nepodarilo sa vytvoriť rezerváciu';
      setError(message);
      notifyError('Rezerváciu sa nepodarilo vytvoriť', message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && services.length === 0) {
    return (
      <div className="premium-card premium-stack" style={{ '--accent': primaryColor } as CSSProperties}>
        <div className="premium-inline-actions">
          <div className="premium-spinner" />
          <span className="premium-copy">Loading services and available slots…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="premium-stack" style={{ '--accent': primaryColor } as CSSProperties}>
        <div className="premium-alert premium-alert--error">{error}</div>
        <div className="premium-inline-actions">
          <button
            type="button"
            className="premium-button"
            onClick={() => router.push(`/${tenant.tenant.slug}`)}
          >
            Späť na tenant page
          </button>
        </div>
      </div>
    );
  }

  if (success && bookingId) {
    return (
      <div className="premium-stack" style={{ '--accent': primaryColor } as CSSProperties}>
        <div className="premium-alert premium-alert--success">
          <h2 className="premium-card-title">Rezervácia úspešná!</h2>
          <p>
            Vaša rezervácia bola úspešne vytvorená. ID rezervácie: <strong>{bookingId}</strong>
          </p>
          <p>
            {emailStatus === 'sent'
              ? 'Potvrdzovací email bol odoslaný na vašu emailovú adresu.'
              : 'Email notifikácia je pripravená na odoslanie po dokončení server-side dispatchu.'}
          </p>
        </div>
        <div className="premium-actions">
          <button
            type="button"
            className="premium-button"
            onClick={() => router.push(`/${tenant.tenant.slug}/portal`)}
          >
            Zobraziť moje rezervácie
          </button>
          <button
            type="button"
            className="premium-button-secondary"
            onClick={() => router.push(`/${tenant.tenant.slug}`)}
          >
            Späť na domovskú stránku
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-stack" style={{ '--accent': primaryColor } as CSSProperties}>
      <section className="premium-hero">
        <div className="premium-hero-copy premium-stack">
          <span className="premium-eyebrow">Booking flow</span>
          <h1 className="premium-title premium-title--medium">Rezervácia termínu</h1>
          <p className="premium-lead">
            Vyberte službu, dátum a čas v známom booking flow, teraz v jednotnom premium rozhraní.
          </p>
          <div className="premium-actions">
            <Link href={`/${tenant.tenant.slug}`} className="premium-button-secondary">
              Back to tenant
            </Link>
            {!selectedService && services.length > 0 && (
              <button
                type="button"
                className="premium-button"
                onClick={() => handleServiceSelect(services[0])}
              >
                Start with first service
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="premium-section">
        <div className="premium-section-header">
          <span className="premium-section-label">Step 1</span>
          <h2 className="premium-section-title">Vyberte službu</h2>
        </div>

        {services.length > 0 ? (
          <div className="premium-grid-3">
            {services.map((service) => {
              const isSelected = selectedService?.id === service.id;
              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => handleServiceSelect(service)}
                  className="premium-card premium-stack"
                  style={{
                    backgroundColor: isSelected ? `${primaryColor}12` : undefined,
                    borderColor: isSelected ? primaryColor : undefined,
                    textAlign: 'left',
                  }}
                >
                  <span className="premium-badge">Service</span>
                  <h3 className="premium-card-title">{service.name}</h3>
                  <p className="premium-card-copy">
                    {service.description || 'Premium appointment ready for scheduling.'}
                  </p>
                  <div className="premium-toolbar">
                    <strong>{service.price} €</strong>
                    <span className="premium-muted">{service.duration} min</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="premium-empty">
            <span className="premium-kicker">Fallback state</span>
            <h3 className="premium-card-title">No services available yet</h3>
            <p className="premium-empty-copy">
              Add tenant services first and they will appear here automatically.
            </p>
          </div>
        )}
      </section>

      {selectedService && (
        <section className="premium-section">
          <div className="premium-section-header">
            <span className="premium-section-label">Step 2</span>
            <h2 className="premium-section-title">Vyberte dátum</h2>
          </div>
          <div className="premium-grid-4">
            {getAvailableDates().map((date) => (
              <button
                key={date}
                type="button"
                onClick={() => handleDateSelect(date)}
                className="premium-chip-button"
                style={{
                  backgroundColor: selectedDate === date ? primaryColor : undefined,
                  borderColor: selectedDate === date ? primaryColor : undefined,
                  color: selectedDate === date ? '#fff' : undefined,
                }}
              >
                {formatDate(date)}
              </button>
            ))}
          </div>
        </section>
      )}

      {selectedService && selectedDate && (
        <section className="premium-section">
          <div className="premium-section-header">
            <span className="premium-section-label">Step 3</span>
            <h2 className="premium-section-title">Vyberte čas</h2>
          </div>
          <div className="premium-grid-4">
            {timeSlots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setSelectedTime(slot)}
                className="premium-chip-button"
                style={{
                  backgroundColor: selectedTime === slot ? primaryColor : undefined,
                  borderColor: selectedTime === slot ? primaryColor : undefined,
                  color: selectedTime === slot ? '#fff' : undefined,
                }}
              >
                {slot}
              </button>
            ))}
          </div>
        </section>
      )}

      {selectedService && selectedDate && selectedTime && (
        <section className="premium-split">
          <div className="premium-card premium-stack">
            <span className="premium-section-label">Step 4</span>
            <h2 className="premium-section-title">Prehľad rezervácie</h2>
            <div className="premium-stack">
              <div>
                <strong>Služba:</strong> {selectedService.name}
              </div>
              <div>
                <strong>Dátum:</strong> {formatDate(selectedDate)}
              </div>
              <div>
                <strong>Čas:</strong> {selectedTime}
              </div>
              <div>
                <strong>Cena:</strong> {selectedService.price} €
              </div>
              <div>
                <strong>Trvanie:</strong> {selectedService.duration} min
              </div>
            </div>
          </div>

          <form onSubmit={handleBookingSubmit} className="premium-card premium-stack">
            <span className="premium-section-label">Confirm</span>
            <h2 className="premium-section-title">Dokončiť rezerváciu</h2>
            <p className="premium-copy">
              Ak nie ste prihlásený, presmerujeme vás do existujúceho auth flow a potom späť na
              túto rezerváciu.
            </p>
            <button type="submit" disabled={isLoading} className="premium-button">
              {isLoading ? 'Spracúvam...' : 'Potvrdiť rezerváciu'}
            </button>
          </form>
        </section>
      )}

      {!selectedService && services.length > 0 && (
        <div className="premium-empty">
          <span className="premium-kicker">Next step</span>
          <p className="premium-empty-copy">Prosím, vyberte službu, aby ste mohli pokračovať.</p>
        </div>
      )}
    </div>
  );
}
