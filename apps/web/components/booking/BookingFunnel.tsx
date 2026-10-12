'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Service, Tenant, TenantBranding } from '@repo/core';
import { Check, Scissors, User, Calendar, FileText } from 'lucide-react';

import { Step1ServiceSelect } from './Step1ServiceSelect';
import { Step2StaffSelect, type BookableStaffMember } from './Step2StaffSelect';
import { Step3SlotSelect, type TimeSlotItem } from './Step3SlotSelect';
import { Step4ContactForm, type ContactFormData } from './Step4ContactForm';
import { submitBookingAction } from '@repo/web/app/[tenantSlug]/book/actions';

interface BookingFunnelProps {
  tenant: Tenant;
  branding?: TenantBranding | null;
  initialServices: Service[];
  preselectedServiceId?: string | null;
}

export function BookingFunnel({
  tenant,
  branding,
  initialServices,
  preselectedServiceId,
}: BookingFunnelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Step state: 1 (Service), 2 (Staff), 3 (Slot), 4 (Contact)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Selections
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [isAnyoneStaff, setIsAnyoneStaff] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotItem | null>(null);

  // Loaded data
  const [bookableStaff, setBookableStaff] = useState<BookableStaffMember[]>([]);
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [daySlotsMap, setDaySlotsMap] = useState<Record<string, TimeSlotItem[]>>({});
  const [loadingData, setLoadingData] = useState<boolean>(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const primaryColor = branding?.primary_color ?? '#6366f1';

  // Initialize service from preselected prop or searchParams
  useEffect(() => {
    const serviceParam = searchParams.get('service') ?? preselectedServiceId;
    if (serviceParam && initialServices.length > 0) {
      const found = initialServices.find((s) => s.id === serviceParam);
      if (found) {
        setSelectedService(found);
        setStep(2);
      }
    }
  }, [searchParams, preselectedServiceId, initialServices]);

  // Fetch staff and slots whenever service or staff choice changes
  const loadAvailability = useCallback(
    async (serviceId: string, staffId: string | null) => {
      try {
        setLoadingData(true);
        const today = new Date();
        const fromStr = today.toISOString().slice(0, 10);
        const toDate = new Date(today.getTime() + 14 * 86_400_000);
        const toStr = toDate.toISOString().slice(0, 10);

        const params = new URLSearchParams({
          tenantSlug: tenant.slug,
          serviceId,
          from: fromStr,
          to: toStr,
        });
        if (staffId) {
          params.set('staffId', staffId);
        }

        const res = await fetch(`/api/booking-availability?${params.toString()}`);
        if (!res.ok) throw new Error('Nepodarilo sa načítať dostupnosť.');

        const data = (await res.json()) as {
          staff: Array<{ id: string; name: string }>;
          days: Record<string, TimeSlotItem[]>;
        };

        setBookableStaff(data.staff);
        const days = Object.keys(data.days);
        setAvailableDays(days);
        setDaySlotsMap(data.days);

        // Select first available day with slots
        const firstActiveDay = days.find((d) => (data.days[d]?.length ?? 0) > 0) ?? days[0] ?? fromStr;
        setSelectedDate(firstActiveDay);
      } catch (err) {
        console.error('[BookingFunnel] Availability load error:', err);
      } finally {
        setLoadingData(false);
      }
    },
    [tenant.slug],
  );

  // Handle service selection (Step 1 -> Step 2)
  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    setSelectedStaffId(null);
    setIsAnyoneStaff(true);
    setSelectedSlot(null);
    setSubmitError(null);
    loadAvailability(service.id, null);
    setStep(2);
  };

  // Handle staff selection (Step 2 -> Step 3)
  const handleSelectStaff = (staffId: string | null) => {
    if (staffId === null) {
      setIsAnyoneStaff(true);
      setSelectedStaffId(null);
    } else {
      setIsAnyoneStaff(false);
      setSelectedStaffId(staffId);
    }
    setSelectedSlot(null);
    setSubmitError(null);

    if (selectedService) {
      loadAvailability(selectedService.id, staffId);
    }
    setStep(3);
  };

  // Handle slot selection (Step 3 -> Step 4)
  const handleSelectSlot = (slot: TimeSlotItem) => {
    setSelectedSlot(slot);
    setSubmitError(null);
    setStep(4);
  };

  // Handle final submit
  const handleFinalSubmit = async (contact: ContactFormData) => {
    if (!selectedService || !selectedSlot) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await submitBookingAction(tenant.slug, {
        serviceId: selectedService.id,
        staffId: isAnyoneStaff ? null : selectedStaffId,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        fullName: contact.fullName,
        email: contact.email,
        phone: contact.phone,
        note: contact.note,
      });

      if (!result.ok) {
        setSubmitError(result.message);
        if (result.error === 'slot_taken') {
          // If slot taken in the meantime, reload availability and return to Step 3
          if (selectedService) {
            loadAvailability(selectedService.id, isAnyoneStaff ? null : selectedStaffId);
          }
          setStep(3);
        }
        return;
      }

      // Success! Redirect to success page
      router.push(
        `/${tenant.slug}/book/success?booking_id=${result.bookingId}&token=${result.rawToken}`,
      );
    } catch {
      setSubmitError('Spojenie so serverom zlyhalo. Skúste to znova.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentSlots = selectedDate ? (daySlotsMap[selectedDate] ?? []) : [];
  const selectedStaffMember = bookableStaff.find((s) => s.id === selectedStaffId) ?? null;

  // Step indicator steps definition
  const stepIndicators = [
    { num: 1, label: 'Služba', icon: Scissors },
    { num: 2, label: 'Personál', icon: User },
    { num: 3, label: 'Termín', icon: Calendar },
    { num: 4, label: 'Údaje', icon: FileText },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* ======================================================== */}
      {/* 4-STEP PROGRESS BAR                                      */}
      {/* ======================================================== */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5 backdrop-blur-xl">
        <div className="flex items-center justify-between relative">
          {/* Background progress track line */}
          <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-[2px] bg-zinc-800 -z-0" />
          <div
            className="absolute top-1/2 left-6 -translate-y-1/2 h-[2px] bg-emerald-400 transition-all duration-300 -z-0"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          />

          {stepIndicators.map((s) => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;
            const Icon = s.icon;

            return (
              <div key={s.num} className="relative z-10 flex flex-col items-center">
                <button
                  type="button"
                  disabled={step < s.num}
                  onClick={() => {
                    if (step > s.num) {
                      setStep(s.num as 1 | 2 | 3 | 4);
                    }
                  }}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200 ${
                    isCompleted
                      ? 'bg-emerald-400 text-zinc-950 ring-2 ring-emerald-400/40 shadow-md cursor-pointer'
                      : isCurrent
                        ? 'bg-indigo-500 text-white ring-4 ring-indigo-500/20 shadow-lg shadow-indigo-500/20'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : <Icon className="w-4 h-4" />}
                </button>
                <span
                  className={`text-[11px] font-semibold mt-1.5 transition-colors hidden sm:block ${
                    isCurrent ? 'text-white' : isCompleted ? 'text-emerald-400' : 'text-zinc-500'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* ACTIVE STEP CARD CONTENT                                 */}
      {/* ======================================================== */}
      <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-8 lg:p-10 backdrop-blur-2xl shadow-xl">
        {step === 1 && (
          <Step1ServiceSelect
            services={initialServices}
            selectedServiceId={selectedService?.id ?? null}
            onSelectService={handleSelectService}
            primaryColor={primaryColor}
          />
        )}

        {step === 2 && selectedService && (
          <Step2StaffSelect
            staffList={bookableStaff}
            selectedStaffId={selectedStaffId}
            isAnyoneSelected={isAnyoneStaff}
            onSelectStaff={handleSelectStaff}
            onBack={() => setStep(1)}
            loading={loadingData}
          />
        )}

        {step === 3 && selectedService && (
          <Step3SlotSelect
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            availableDays={availableDays}
            slotsForSelectedDate={currentSlots}
            selectedSlot={selectedSlot}
            onSelectSlot={handleSelectSlot}
            onBack={() => setStep(2)}
            loading={loadingData}
          />
        )}

        {step === 4 && selectedService && selectedSlot && (
          <Step4ContactForm
            tenantName={tenant.name}
            tenantSlug={tenant.slug}
            selectedService={selectedService}
            selectedStaff={selectedStaffMember}
            isAnyoneSelected={isAnyoneStaff}
            selectedSlot={selectedSlot}
            onSubmit={handleFinalSubmit}
            onBack={() => setStep(3)}
            isSubmitting={isSubmitting}
            errorMessage={submitError}
          />
        )}
      </div>
    </div>
  );
}
