'use client';

import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Tag,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  X,
  ArrowRight,
  ShieldAlert,
  Building2,
} from 'lucide-react';

type ManagedBooking = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  serviceName: string;
  serviceDuration: number;
  servicePrice: number | string;
  tenantName: string;
  tenantSlug: string;
};

type ViewState =
  | { kind: 'loading' }
  | { kind: 'ready'; booking: ManagedBooking }
  | { kind: 'invalid' }
  | { kind: 'expired' }
  | { kind: 'error'; message: string };

type ApiResponse = { ok: boolean; status: number; data: Record<string, unknown> };

const DATE_TIME = new Intl.DateTimeFormat('sk-SK', {
  dateStyle: 'full',
  timeStyle: 'short',
});

function formatWhen(iso: string) {
  return DATE_TIME.format(new Date(iso));
}

export default function ManageBookingClient({
  tenantSlug,
  token,
}: {
  tenantSlug: string;
  token: string;
}) {
  const [view, setView] = useState<ViewState>({ kind: 'loading' });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [mode, setMode] = useState<'view' | 'reschedule'>('view');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);

  const call = useCallback(
    async (payload: Record<string, unknown>): Promise<ApiResponse> => {
      const res = await fetch('/api/booking-manage', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...payload, tenantSlug, token }),
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      return { ok: res.ok, status: res.status, data };
    },
    [tenantSlug, token],
  );

  const load = useCallback(async () => {
    setView({ kind: 'loading' });
    try {
      const result = await call({ action: 'read' });
      if (result.ok && result.data.status === 'ok') {
        setView({ kind: 'ready', booking: result.data.booking as ManagedBooking });
      } else if (result.data.status === 'expired') {
        setView({ kind: 'expired' });
      } else if (result.status === 404 || result.data.status === 'invalid') {
        setView({ kind: 'invalid' });
      } else {
        setView({
          kind: 'error',
          message: String(result.data.error ?? 'Rezerváciu sa nepodarilo načítať.'),
        });
      }
    } catch {
      setView({ kind: 'error', message: 'Spojenie zlyhalo. Skúste to znova.' });
    }
  }, [call]);

  useEffect(() => {
    load();
  }, [load]);

  const handleReschedule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (view.kind !== 'ready') return;

    const local = new Date(`${date}T${time}`);
    if (!date || !time || Number.isNaN(local.getTime())) {
      setNotice({ tone: 'error', text: 'Vyberte platný dátum aj čas.' });
      return;
    }

    setBusy(true);
    setNotice(null);
    try {
      const result = await call({ action: 'reschedule', startTime: local.toISOString() });
      if (result.ok && typeof result.data.manageUrl === 'string') {
        // Old token is revoked by server. Move to new URL issued by server.
        window.location.replace(result.data.manageUrl);
        return;
      }
      setNotice({
        tone: 'error',
        text: String(result.data.error ?? 'Presun sa nepodarilo dokončiť. Skúste to znova.'),
      });
    } catch {
      setNotice({ tone: 'error', text: 'Spojenie zlyhalo. Skúste to znova.' });
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (view.kind !== 'ready') return;

    setBusy(true);
    setNotice(null);
    setShowCancelModal(false);

    try {
      const result = await call({ action: 'cancel' });
      if (result.ok) {
        setView({ kind: 'ready', booking: { ...view.booking, status: 'cancelled' } });
        setNotice({ tone: 'success', text: 'Rezervácia bola úspešne zrušená.' });
        setMode('view');
      } else {
        setNotice({
          tone: 'error',
          text: String(result.data.error ?? 'Storno sa nepodarilo dokončiť.'),
        });
      }
    } catch {
      setNotice({ tone: 'error', text: 'Spojenie zlyhalo. Skúste to znova.' });
    } finally {
      setBusy(false);
    }
  };

  if (view.kind === 'loading') {
    return (
      <div className="min-h-screen py-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 text-center space-y-4 backdrop-blur-xl shadow-2xl">
          <RefreshCw className="w-8 h-8 mx-auto text-indigo-400 animate-spin" />
          <p className="text-zinc-300 font-medium text-sm">Načítavam detaily rezervácie...</p>
        </div>
      </div>
    );
  }

  if (view.kind === 'invalid') {
    return (
      <div className="min-h-screen py-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 text-center space-y-5 backdrop-blur-xl shadow-2xl">
          <div className="w-12 h-12 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <XCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-white">Neplatný odkaz</h1>
            <p className="text-sm text-zinc-400">
              Tento odkaz na správu rezervácie nie je platný. Ak ste obdržali novší odkaz e-mailom, použite ten najaktuálnejší.
            </p>
          </div>
          <Link
            href={`/${tenantSlug}/book`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium transition-all"
          >
            Prejsť na rezervácie
          </Link>
        </div>
      </div>
    );
  }

  if (view.kind === 'expired') {
    return (
      <div className="min-h-screen py-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 text-center space-y-5 backdrop-blur-xl shadow-2xl">
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-white">Platnosť odkazu vypršala</h1>
            <p className="text-sm text-zinc-400">
              Platnosť tohto odkazu vypršala. Kontaktujte priamo prevádzku, aby vám vystavila nový potvrdzujúci odkaz.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (view.kind === 'error') {
    return (
      <div className="min-h-screen py-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 text-center space-y-5 backdrop-blur-xl shadow-2xl">
          <div className="w-12 h-12 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <p className="text-sm text-red-300">{view.message}</p>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Skúsiť znova
          </button>
        </div>
      </div>
    );
  }

  const { booking } = view;
  const editable = booking.status === 'confirmed';
  const isCancelled = booking.status === 'cancelled';

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto space-y-6">
      {/* ======================================================== */}
      {/* BOOKING DETAIL CARD                                      */}
      {/* ======================================================== */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold">
              <Building2 className="w-3 h-3" />
              {booking.tenantName}
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {booking.serviceName}
            </h1>
          </div>

          <div>
            {isCancelled ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
                <XCircle className="w-3.5 h-3.5" />
                Zrušená
              </span>
            ) : editable ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Potvrdená
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-zinc-800 text-zinc-400 border border-zinc-700">
                {booking.status}
              </span>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-4 space-y-1">
            <span className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              Termín
            </span>
            <p className="text-sm font-semibold text-white leading-tight">
              {formatWhen(booking.startTime)}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-4 space-y-1">
            <span className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Trvanie
            </span>
            <p className="text-sm font-semibold text-white">
              {booking.serviceDuration} minút
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-4 space-y-1">
            <span className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-400" />
              Cena
            </span>
            <p className="text-sm font-semibold text-white">
              {Number(booking.servicePrice).toFixed(2)} €
            </p>
          </div>
        </div>

        <p className="text-xs text-zinc-500">
          Časy sa zobrazujú automaticky podľa časového pásma vášho prehliadača.
        </p>

        {/* Status notice */}
        {notice && (
          <div
            className={`rounded-xl border p-4 text-sm flex items-center gap-3 ${
              notice.tone === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border-red-500/30 bg-red-500/10 text-red-300'
            }`}
          >
            {notice.tone === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0" />
            )}
            <span>{notice.text}</span>
          </div>
        )}

        {isCancelled && !notice && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />
            <span>Táto rezervácia bola zrušená a termín bol uvoľnený pre iných klientov.</span>
          </div>
        )}

        {!isCancelled && !editable && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-300 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
            <span>Túto rezerváciu už nie je možné elektronicky upraviť ani stornovať.</span>
          </div>
        )}

        {/* Actions bar */}
        {editable && mode === 'view' && (
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => setMode('reschedule')}
              disabled={busy}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Zmeniť termín
            </button>

            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              disabled={busy}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold text-sm transition-all flex items-center justify-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Zrušiť rezerváciu
            </button>
          </div>
        )}

        {/* Reschedule inline form */}
        {editable && mode === 'reschedule' && (
          <form
            onSubmit={handleReschedule}
            className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Výber nového termínu
              </h2>
              <button
                type="button"
                onClick={() => setMode('view')}
                className="text-zinc-400 hover:text-white text-xs"
              >
                Zrušiť
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Nový dátum</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={busy}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Nový čas</label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  disabled={busy}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={busy}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
              >
                {busy ? 'Ukladám...' : 'Potvrdiť nový termín'}
              </button>
              <button
                type="button"
                onClick={() => setMode('view')}
                disabled={busy}
                className="px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 font-medium text-sm transition-all"
              >
                Späť
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ======================================================== */}
      {/* CANCELLATION CONFIRMATION MODAL                          */}
      {/* ======================================================== */}
      {showCancelModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Naozaj chcete zrušiť rezerváciu?</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Táto akcia uvoľní váš termín pre ostatných záujemcov. Rezerváciu už nebude možné obnoviť.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={busy}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-all shadow-lg shadow-red-600/20 disabled:opacity-50"
              >
                {busy ? 'Ruším...' : 'Áno, zrušiť rezerváciu'}
              </button>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={busy}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 font-medium text-sm transition-all"
              >
                Ponechať termín
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
