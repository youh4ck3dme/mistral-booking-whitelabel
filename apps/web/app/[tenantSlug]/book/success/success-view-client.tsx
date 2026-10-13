'use client';

import Link from 'next/link';
import {
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Tag,
  ArrowRight,
  Download,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface SuccessViewClientProps {
  tenantName: string;
  tenantSlug: string;
  bookingId: string;
  token: string;
  serviceName: string;
  serviceDuration: number;
  servicePrice: number;
  staffName: string;
  startTime: string; // ISO
  endTime: string;   // ISO
  manageUrl: string;
}

function formatUtcToCompact(iso: string): string {
  const d = new Date(iso);
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export function SuccessViewClient({
  tenantName,
  tenantSlug,
  bookingId,
  token,
  serviceName,
  serviceDuration,
  servicePrice,
  staffName,
  startTime,
  endTime,
  manageUrl,
}: SuccessViewClientProps) {
  const formattedDate = new Intl.DateTimeFormat('sk-SK', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(startTime));

  // 1. Google Calendar deep link
  const googleCalUrl = (() => {
    const title = encodeURIComponent(`${serviceName} • ${tenantName}`);
    const dates = `${formatUtcToCompact(startTime)}/${formatUtcToCompact(endTime)}`;
    const details = encodeURIComponent(
      `Rezervácia v ${tenantName}.\nSlužba: ${serviceName} (${serviceDuration} min)\nŠpecialista: ${staffName}\nSpráva rezervácie: ${manageUrl}`,
    );
    const location = encodeURIComponent(tenantName);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
  })();

  // 2. Download .ics iCalendar file
  const handleDownloadIcs = () => {
    const startCompact = formatUtcToCompact(startTime);
    const endCompact = formatUtcToCompact(endTime);
    const nowCompact = formatUtcToCompact(new Date().toISOString());

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//NEXIFY//Booking Platform//SK',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${bookingId}@nexify.sk`,
      `DTSTAMP:${nowCompact}`,
      `DTSTART:${startCompact}`,
      `DTEND:${endCompact}`,
      `SUMMARY:${serviceName} - ${tenantName}`,
      `DESCRIPTION:Rezervácia termínu v ${tenantName}. Spravovať rezerváciu: ${manageUrl}`,
      `LOCATION:${tenantName}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rezervacia-${tenantSlug}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 py-8 px-4 sm:px-6">
      {/* Success Badge & Heading */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-2xl shadow-emerald-500/20">
          <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 animate-bounce" />
        </div>

        <div className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-mono">
            Rezervácia potvrdená
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Tešíme sa na vašu návštevu!
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
            Potvrdenie a zabezpečený odkaz na zmenu termínu sme odoslali na váš e-mail.
          </p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SÚHRNNÁ KARTA (RECEIPT CARD)                             */}
      {/* ======================================================== */}
      <div className="rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-gradient-to-b dark:from-zinc-900/90 dark:to-zinc-950 p-6 sm:p-8 space-y-6 shadow-xl dark:shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Prevádzka</div>
            <div className="text-lg font-bold text-zinc-900 dark:text-white">{tenantName}</div>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            ID: {bookingId.slice(0, 8)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-zinc-500 dark:text-zinc-400">Dohodnutá služba:</span>
            <div className="font-semibold text-zinc-900 dark:text-white text-sm">{serviceName}</div>
            <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400 font-mono pt-0.5">
              <span>⏱ {serviceDuration} min</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">💳 {servicePrice} € (na mieste)</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-zinc-500 dark:text-zinc-400">Pridelený personál:</span>
            <div className="font-semibold text-zinc-900 dark:text-white text-sm flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span>{staffName}</span>
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Špecialista prevádzky</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 dark:bg-zinc-950/80 dark:border-zinc-800 space-y-1">
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span>Presný termín návštevy:</span>
          </div>
          <div className="text-sm font-bold text-zinc-900 dark:text-white font-mono">{formattedDate}</div>
        </div>

        {/* Micro-actions Buttons */}
        <div className="space-y-3 pt-2">
          <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
            Rýchle akcie do kalendára
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Stiahnutie .ics súboru */}
            <button
              type="button"
              onClick={handleDownloadIcs}
              className="py-3 px-4 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 text-xs font-semibold text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:bg-zinc-850 dark:hover:border-zinc-700 dark:text-zinc-200 shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              <span>Stiahnuť do kalendára (.ics)</span>
            </button>

            {/* 2. Google Kalendár link */}
            <a
              href={googleCalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 text-xs font-semibold text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:bg-zinc-850 dark:hover:border-zinc-700 dark:text-zinc-200 shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Google Kalendár</span>
            </a>
          </div>
        </div>

        {/* Self-service Link Callout */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Zmena alebo storno je možné kedykoľvek bez telefonátu.</span>
          </div>

          <Link
            href={`/${tenantSlug}/booking/manage/${token}`}
            className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Spravovať rezerváciu</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
