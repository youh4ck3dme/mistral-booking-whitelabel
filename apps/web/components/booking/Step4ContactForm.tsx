import { useState } from 'react';
import Link from 'next/link';
import { User, Mail, Phone, FileText, ArrowLeft, ShieldCheck, Lock, Check } from 'lucide-react';
import type { Service } from '@repo/core';
import type { BookableStaffMember } from './Step2StaffSelect';
import type { TimeSlotItem } from './Step3SlotSelect';

export type ContactFormData = {
  fullName: string;
  email: string;
  phone: string;
  note: string;
};

interface Step4ContactFormProps {
  tenantName: string;
  tenantSlug: string;
  selectedService: Service;
  selectedStaff: BookableStaffMember | null;
  isAnyoneSelected: boolean;
  selectedSlot: TimeSlotItem;
  onSubmit: (contact: ContactFormData) => Promise<void>;
  onBack: () => void;
  isSubmitting: boolean;
  errorMessage: string | null;
}

export function Step4ContactForm({
  tenantName,
  tenantSlug,
  selectedService,
  selectedStaff,
  isAnyoneSelected,
  selectedSlot,
  onSubmit,
  onBack,
  isSubmitting,
  errorMessage,
}: Step4ContactFormProps) {
  const [formData, setFormData] = useState<ContactFormData>({
    fullName: '',
    email: '',
    phone: '',
    note: '',
  });

  const formattedDate = new Intl.DateTimeFormat('sk-SK', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(selectedSlot.startTime));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    await onSubmit(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
            Kontaktné údaje
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            Bez registrácie a bez hesla. Potvrdenie a odkaz na správu dostanete e-mailom.
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white/90 text-xs text-zinc-600 hover:text-zinc-900 hover:border-zinc-300 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400 dark:hover:text-white dark:hover:border-zinc-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Zmeniť termín</span>
        </button>
      </div>

      {/* Súhrnný panel výberu (Reservation Summary Card) */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80 p-4 sm:p-5 space-y-3">
        <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
          Súhrn rezervácie
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <span className="text-zinc-500 dark:text-zinc-400">Služba:</span>
            <div className="font-semibold text-zinc-900 dark:text-white flex items-center justify-between">
              <span>{selectedService.name}</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">{selectedService.price} €</span>
            </div>
            <div className="text-[11px] text-zinc-600 dark:text-zinc-400 font-mono">Trvanie: {selectedService.duration} min</div>
          </div>

          <div className="space-y-1">
            <span className="text-zinc-500 dark:text-zinc-400">Špecialista & Termín:</span>
            <div className="font-semibold text-zinc-900 dark:text-white">
              {isAnyoneSelected ? 'Ktokoľvek voľný (Najbližší termín)' : selectedStaff?.name}
            </div>
            <div className="text-[11px] text-indigo-700 dark:text-indigo-300 font-medium">{formattedDate}</div>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-600 dark:text-red-300 flex items-start gap-2">
          <span className="font-bold">Chyba:</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Formulár údajov */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
          {/* 1. Meno */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
              Meno a priezvisko <span className="text-emerald-600 dark:text-emerald-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
                <User className="w-4 h-4" />
              </div>
              <input
                required
                type="text"
                placeholder="Peter Kováč"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-300 bg-white text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-white dark:placeholder-zinc-500"
              />
            </div>
          </div>

          {/* 2. E-mail */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
              E-mailová adresa (pre potvrdenie a storno odkaz) <span className="text-emerald-600 dark:text-emerald-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                required
                type="email"
                placeholder="peter@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-300 bg-white text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-white dark:placeholder-zinc-500"
              />
            </div>
          </div>

          {/* 3. Telefón */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
              Telefónne číslo (pre SMS pripomienku) <span className="text-emerald-600 dark:text-emerald-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
                <Phone className="w-4 h-4" />
              </div>
              <input
                required
                type="tel"
                placeholder="+421 900 123 456"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-300 bg-white text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-white dark:placeholder-zinc-500"
              />
            </div>
          </div>

          {/* 4. Poznámka */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
              Poznámka pre personál (voliteľné)
            </label>
            <div className="relative">
              <textarea
                rows={2}
                placeholder="Alergie, preferencie alebo doplňujúce informácie..."
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="w-full p-3 rounded-xl border border-zinc-300 bg-white text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-white dark:placeholder-zinc-500"
              />
            </div>
          </div>
        </div>

        {/* Inline GDPR & VOP doložka (Frictionless, žiadne checkboxy) */}
        <div className="pt-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Odoslaním rezervácie súhlasíte s{' '}
            <Link href="/terms" target="_blank" className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 underline">
              obchodnými podmienkami
            </Link>{' '}
            a{' '}
            <Link href="/privacy" target="_blank" className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 underline">
              spracovaním osobných údajov
            </Link>{' '}
            prevádzky {tenantName}.
          </span>
        </div>

        {/* Submit button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-xl font-bold text-sm text-zinc-950 bg-gradient-to-r from-indigo-300 via-sky-200 to-emerald-300 hover:opacity-95 disabled:opacity-50 transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                <span>Potvrdzujem termín...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Potvrdiť rezerváciu</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
