'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTenant } from '@repo/web/src/lib/tenant/TenantProvider';
import { Service, Booking } from '@repo/core';
import { Button } from '@repo/ui';

export default function BookingPage() {
  const [supabase] = useState(() => createClientComponentClient());
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenant = useTenant();
  
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const primaryColor = tenant.branding?.primary_color || '#3B82F6';

  // Fetch services for the tenant
  useEffect(() => {
    if (!tenant?.tenant?.id) return;

    const fetchServices = async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('tenant_id', tenant.tenant.id)
          .eq('is_active', true);

        if (error) throw error;
        setServices(data || []);
        
        // Set selected service from URL if provided
        const serviceId = searchParams.get('service');
        if (serviceId) {
          const selected = data?.find((s) => s.id === serviceId);
          if (selected) setSelectedService(selected);
        }
      } catch (err) {
        setError('Nepodarilo sa načítať služby');
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, [searchParams, supabase, tenant?.tenant?.id]);

  // Fetch available time slots when service and date are selected
  useEffect(() => {
    if (!selectedService || !selectedDate) {
      setTimeSlots([]);
      return;
    }

    const fetchTimeSlots = async () => {
      try {
        // In production, this would call an RPC function to get available slots
        // For now, generate some demo time slots
        const slots: string[] = [];
        const startHour = 8;
        const endHour = 18;
        const duration = selectedService.duration;

        for (let hour = startHour; hour <= endHour - Math.ceil(duration / 60); hour++) {
          const startTime = `${hour.toString().padStart(2, '0')}:00`;
          const endHour = hour + Math.ceil(duration / 60);
          const endTime = `${endHour.toString().padStart(2, '0')}:00`;
          slots.push(`${startTime}-${endTime}`);
        }

        setTimeSlots(slots);
      } catch (err) {
        setError('Nepodarilo sa načítať dostupné termíny');
      }
    };

    fetchTimeSlots();
  }, [selectedService, selectedDate]);

  // Handle service selection
  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setSelectedDate('');
    setSelectedTime('');
    setTimeSlots([]);
    setError(null);
  };

  // Handle date selection
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime('');
    setError(null);
  };

  // Generate next 14 days
  const getAvailableDates = (): string[] => {
    const dates: string[] = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sk-SK', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  // Handle booking submission
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedService || !selectedDate || !selectedTime) {
      setError('Vyberte službu, dátum a čas');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Parse selected time
      const [startTime, endTime] = selectedTime.split('-');
      const [startHour, startMinute] = startTime.split(':');
      const [endHour, endMinute] = endTime.split(':');

      // Create Date objects
      const startDate = new Date(selectedDate);
      startDate.setHours(parseInt(startHour), parseInt(startMinute));
      
      const endDate = new Date(selectedDate);
      endDate.setHours(parseInt(endHour), parseInt(endMinute));

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Prosím, prihláste sa');
        router.push(`/${tenant.tenant.slug}/login`);
        return;
      }

      // Call create_booking RPC function
      const { data: booking, error } = await supabase.rpc('create_booking', {
        p_tenant_id: tenant.tenant.id,
        p_user_id: user.id,
        p_service_id: selectedService.id,
        p_start_time: startDate.toISOString(),
        p_end_time: endDate.toISOString(),
      });

      if (error) {
        throw error;
      }

      // Success!
      setSuccess(true);
      setBookingId(booking as string);
      
      // Reset form
      setSelectedService(null);
      setSelectedDate('');
      setSelectedTime('');
    } catch (err: any) {
      setError(err.message || 'Nepodarilo sa vytvoriť rezerváciu');
    } finally {
      setIsLoading(false);
    }
  };

  // If loading, show loading state
  if (isLoading && services.length === 0) {
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

  // If success, show confirmation
  if (success && bookingId) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          <h2 className="text-2xl font-bold mb-2">Rezervácia úspešná!</h2>
          <p className="mb-4">
            Vaša rezervácia bola úspešne vytvorená. ID rezervácie: <strong>{bookingId}</strong>
          </p>
          <p className="mb-4">
            Potvrdzovací email bol odoslaný na vašu emailovú adresu.
          </p>
        </div>
        <div className="flex gap-4">
          <Button onClick={() => router.push(`/${tenant.tenant.slug}/portal`)}>
            Zobraziť moje rezervácie
          </Button>
          <Button variant="secondary" onClick={() => router.push(`/${tenant.tenant.slug}`)}>
            Späť na domovsku stránku
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Rezervácia termínu</h1>

      {/* Step 1: Select Service */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">1. Vyberte službu</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <div
              key={service.id}
              onClick={() => handleServiceSelect(service)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedService?.id === service.id
                  ? `border-${primaryColor.replace('#', '')} bg-${primaryColor.replace('#', '')}10`
                  : 'border-gray-200 hover:border-gray-400'
              }`}
              style={{
                borderColor: selectedService?.id === service.id ? primaryColor : undefined,
                backgroundColor: selectedService?.id === service.id ? `${primaryColor}10` : undefined,
              }}
            >
              <h3 className="font-semibold mb-1">{service.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{service.description}</p>
              <p className="font-bold">
                {service.price} € / {service.duration} min
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Step 2: Select Date */}
      {selectedService && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">2. Vyberte dátum</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {getAvailableDates().map((date) => (
              <button
                key={date}
                onClick={() => handleDateSelect(date)}
                className={`py-2 px-3 rounded-md text-sm transition-colors ${
                  selectedDate === date
                    ? `bg-${primaryColor.replace('#', '')} text-white`
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
                style={{
                  backgroundColor: selectedDate === date ? primaryColor : undefined,
                }}
              >
                {formatDate(date)}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Step 3: Select Time */}
      {selectedService && selectedDate && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">3. Vyberte čas</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {timeSlots.map((slot) => (
              <button
                key={slot}
                onClick={() => setSelectedTime(slot)}
                className={`py-2 px-3 rounded-md text-sm transition-colors ${
                  selectedTime === slot
                    ? `bg-${primaryColor.replace('#', '')} text-white`
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
                style={{
                  backgroundColor: selectedTime === slot ? primaryColor : undefined,
                }}
              >
                {slot}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Summary & Submit */}
      {selectedService && selectedDate && selectedTime && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">4. Prehľad rezervácie</h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="space-y-3">
              <div>
                <span className="font-medium">Služba:</span> {selectedService.name}
              </div>
              <div>
                <span className="font-medium">Dátum:</span> {formatDate(selectedDate)}
              </div>
              <div>
                <span className="font-medium">Čas:</span> {selectedTime}
              </div>
              <div>
                <span className="font-medium">Cena:</span> {selectedService.price} €
              </div>
              <div>
                <span className="font-medium">Trvanie:</span> {selectedService.duration} min
              </div>
            </div>
          </div>

          <form onSubmit={handleBookingSubmit} className="mt-6">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
              style={{ backgroundColor: primaryColor }}
            >
              {isLoading ? 'Spracúvam...' : 'Potvrdiť rezerváciu'}
            </Button>
          </form>
        </section>
      )}

      {!selectedService && (
        <p className="text-gray-500 text-center py-8">
          Prosím, vyberte službu, aby ste mohli pokračovať.
        </p>
      )}
    </div>
  );
}
