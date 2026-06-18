'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Service } from '@repo/core';
import { dispatchBookingNotificationsRequest, storeFlashToast } from '@repo/web/src/lib/notifications/client';
import { useNotifications } from '@repo/web/app/notifications-provider';
import { useTenant } from '@repo/web/src/lib/tenant/TenantProvider';
import { Calendar, TimeSlotPicker, calendarStyles, timeSlotPickerStyles } from '@repo/web/src/lib/booking';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { CSSProperties, FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type BookingDraft = {
  serviceId: string;
  selectedDate: string;
  selectedTime: string;
};

export default function BookingPageClient({
  initialServices,
  operatingHours = { start: '08:00', end: '18:00' },
}: {
  initialServices: Service[];
  operatingHours?: { start: string; end: string };
}) {
  const [supabase] = useState(() => createClientComponentClient());
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenant = useTenant();
  const { notifyError, notifyInfo, notifySuccess } = useNotifications();

  const [services] = useState<Service[]>(initialServices);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<'sent' | 'pending'>('pending');
  const [bookedSlotsByDate, setBookedSlotsByDate] = useState<Record<string, { start_time: string; end_time: string }[]>>({});
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);

  const primaryColor = tenant.branding?.primary_color || '#3B82F6';
  const bookingDraftStorageKey = `bookingDraft:${tenant.tenant.slug}`;
  const hasHydratedDraft = useRef(false);

  const clearPersistedBookingState = () => {
    if (typeof window === 'undefined') {
      return;
    }

    window.sessionStorage.removeItem(bookingDraftStorageKey);
    window.sessionStorage.removeItem('returnTo');
  };

  const buildReturnTo = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (selectedService?.id) {
      params.set('service', selectedService.id);
    }

    const query = params.toString();
    return `/${tenant.tenant.slug}/book${query ? `?${query}` : ''}`;
  };

  const setReturnTo = () => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('returnTo', buildReturnTo());
    }
  };

  // Fetch booked slots for the selected service and date range
  const fetchBookedSlots = useCallback(async (date: string) => {
    if (!selectedService || !date) {
      setBookedSlotsByDate({});
      return;
    }

    try {
      setIsFetchingSlots(true);
      
      // Fetch for a range around the selected date (7 days before and after)
      const dateObj = new Date(date);
      const startRange = new Date(dateObj);
      startRange.setDate(startRange.getDate() - 7);
      startRange.setHours(0, 0, 0, 0);
      
      const endRange = new Date(dateObj);
      endRange.setDate(endRange.getDate() + 7);
      endRange.setHours(23, 59, 59, 999);

      const { data, error: fetchError } = await supabase.rpc('get_booked_slots', {
        p_tenant_id: tenant.tenant.id,
        p_service_id: selectedService.id,
        p_start_range: startRange.toISOString(),
        p_end_range: endRange.toISOString(),
      });

      if (fetchError) throw fetchError;
      
      // Group booked slots by date (YYYY-MM-DD)
      const grouped: Record<string, { start_time: string; end_time: string }[]> = {};
      (data || []).forEach((slot: { start_time: string; end_time: string }) => {
        const dateKey = new Date(slot.start_time).toISOString().split('T')[0];
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(slot);
      });
      
      setBookedSlotsByDate(grouped);
    } catch (err: any) {
      console.error('Failed to fetch booked slots:', err);
      notifyError('Chyba', 'Nepodarilo sa načítať obsadené termíny.');
    } finally {
      setIsFetchingSlots(false);
    }
  }, [selectedService, tenant.tenant.id, supabase, notifyError]);

  // Handle service selection
  const handleServiceSelect = useCallback((service: Service) => {
    setSelectedService(service);
    setSelectedDate(null);
    setSelectedTime(null);
    setError(null);
    setBookedSlotsByDate({});
  }, []);

  // Handle date selection from calendar
  const handleDateSelect = useCallback((date: string) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setError(null);
    
    // Fetch booked slots for this date
    if (selectedService) {
      fetchBookedSlots(date);
    }
  }, [selectedService, fetchBookedSlots]);

  // Handle time slot selection
  const handleTimeSelect = useCallback((slot: { startTime: string; endTime: string; display: string }) => {
    setSelectedTime(slot.display);
    setError(null);
  }, []);

  // Handle service selection with slot fetching
  useEffect(() => {
    const serviceId = searchParams.get('service');
    if (!serviceId) return;

    const preselected = services.find((service) => service.id === serviceId);
    if (preselected) {
      setSelectedService(preselected);
    }
  }, [searchParams, services]);

  // Hydrate draft from sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined' || hasHydratedDraft.current || services.length === 0) {
      return;
    }

    hasHydratedDraft.current = true;

    const rawDraft = window.sessionStorage.getItem(bookingDraftStorageKey);
    if (!rawDraft) {
      return;
    }

    try {
      const persistedDraft = JSON.parse(rawDraft) as Partial<BookingDraft>;
      const persistedService = services.find((service) => service.id === persistedDraft.serviceId);

      if (!persistedService) {
        window.sessionStorage.removeItem(bookingDraftStorageKey);
        return;
      }

      setSelectedService(persistedService);
      
      if (persistedDraft.selectedDate) {
        setSelectedDate(persistedDraft.selectedDate);
        // Fetch booked slots for this date
        fetchBookedSlots(persistedDraft.selectedDate);
      }
      
      setSelectedTime(persistedDraft.selectedTime || null);
      setError(null);
    } catch {
      window.sessionStorage.removeItem(bookingDraftStorageKey);
    }
  }, [bookingDraftStorageKey, services, fetchBookedSlots]);

  // Fetch booked slots when service changes
  useEffect(() => {
    if (selectedService && selectedDate) {
      fetchBookedSlots(selectedDate);
    } else {
      setBookedSlotsByDate({});
    }
  }, [selectedService, selectedDate, fetchBookedSlots]);

  // Save draft to sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined' || !hasHydratedDraft.current) {
      return;
    }

    if (!selectedService) {
      window.sessionStorage.removeItem(bookingDraftStorageKey);
      return;
    }

    const draft: BookingDraft = {
      serviceId: selectedService.id,
      selectedDate: selectedDate || '',
      selectedTime: selectedTime || '',
    };

    window.sessionStorage.setItem(bookingDraftStorageKey, JSON.stringify(draft));
  }, [bookingDraftStorageKey, selectedDate, selectedService, selectedTime]);

  // Clear selected time if it's no longer in the available slots
  useEffect(() => {
    if (!selectedDate || !selectedService || !selectedTime) return;
    
    // Check if the selected time is still valid
    const [startTime, endTime] = selectedTime.split('-');
    const dateObj = new Date(selectedDate);
    const slotStart = new Date(`${selectedDate}T${startTime}:00`);
    const slotEnd = new Date(`${selectedDate}T${endTime}:00`);
    
    const isBooked = (bookedSlotsByDate[selectedDate] || []).some(booked => {
      const bookedStart = new Date(booked.start_time);
      const bookedEnd = new Date(booked.end_time);
      return slotStart.getTime() < bookedEnd.getTime() && bookedStart.getTime() < slotEnd.getTime();
    });
    
    const isPast = new Date() > slotStart;
    
    if (isBooked || isPast) {
      setSelectedTime(null);
    }
  }, [selectedDate, selectedService, selectedTime, bookedSlotsByDate]);

  // Format date for display
  const formatDate = useCallback((dateString: string) =>
    new Date(dateString).toLocaleDateString('sk-SK', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }),
  [],
  );

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

      // Call create_booking RPC - DO NOT use direct insert
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
      setSelectedDate(null);
      setSelectedTime(null);
      clearPersistedBookingState();

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
          
          {isFetchingSlots ? (
            <div className="premium-inline-actions" style={{ padding: '1rem 0' }}>
              <div className="premium-spinner" />
              <span className="premium-copy">Načítavam obsadené termíny…</span>
            </div>
          ) : (
            <>
              <style jsx global>{calendarStyles}</style>
              <Calendar
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                operatingHours={operatingHours}
                serviceDuration={selectedService.duration}
                bookedSlotsByDate={bookedSlotsByDate}
                primaryColor={primaryColor}
                disablePastDates={true}
                maxFutureDays={60}
              />
            </>
          )}
        </section>
      )}

      {selectedService && selectedDate && (
        <section className="premium-section">
          <div className="premium-section-header">
            <span className="premium-section-label">Step 3</span>
            <h2 className="premium-section-title">
              Vyberte čas ({selectedService.duration} min)
            </h2>
          </div>
          
          {isFetchingSlots ? (
            <div className="premium-inline-actions" style={{ padding: '1rem 0' }}>
              <div className="premium-spinner" />
              <span className="premium-copy">Overujem dostupnosť termínov…</span>
            </div>
          ) : (
            <>
              <style jsx global>{timeSlotPickerStyles}</style>
              <TimeSlotPicker
                selectedDate={selectedDate}
                serviceDuration={selectedService.duration}
                operatingHours={operatingHours}
                bookedSlots={bookedSlotsByDate[selectedDate] || []}
                selectedTime={selectedTime}
                onTimeSelect={handleTimeSelect}
                primaryColor={primaryColor}
                disablePastSlots={true}
                showNextAvailable={true}
              />
            </>
          )}
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
