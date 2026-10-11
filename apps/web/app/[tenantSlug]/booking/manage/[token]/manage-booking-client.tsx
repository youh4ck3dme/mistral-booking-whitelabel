'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';

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

const DATE_TIME = new Intl.DateTimeFormat('sk-SK', { dateStyle: 'full', timeStyle: 'short' });

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
        setView({ kind: 'error', message: String(result.data.error ?? 'Rezerváciu sa nepodarilo načítať.') });
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
      setNotice({ tone: 'error', text: 'Vyberte dátum aj čas.' });
      return;
    }

    setBusy(true);
    setNotice(null);
    try {
      const result = await call({ action: 'reschedule', startTime: local.toISOString() });
      if (result.ok && typeof result.data.manageUrl === 'string') {
        // The old link is revoked by the server. Move to the new link, which the server just issued.
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

  const handleCancel = async () => {
    if (view.kind !== 'ready') return;
    if (!window.confirm('Naozaj chcete rezerváciu zrušiť?')) return;

    setBusy(true);
    setNotice(null);
    try {
      const result = await call({ action: 'cancel' });
      if (result.ok) {
        setView({ kind: 'ready', booking: { ...view.booking, status: 'cancelled' } });
        setNotice({ tone: 'success', text: 'Rezervácia bola zrušená.' });
        setMode('view');
      } else {
        setNotice({ tone: 'error', text: String(result.data.error ?? 'Storno sa nepodarilo dokončiť.') });
      }
    } catch {
      setNotice({ tone: 'error', text: 'Spojenie zlyhalo. Skúste to znova.' });
    } finally {
      setBusy(false);
    }
  };

  const accent = { '--accent': '#3B82F6' } as CSSProperties;

  if (view.kind === 'loading') {
    return (
      <section className="premium-stack" style={accent} aria-busy="true">
        <p className="premium-copy">Načítavam rezerváciu...</p>
      </section>
    );
  }

  if (view.kind === 'invalid') {
    return (
      <section className="premium-stack" style={accent}>
        <div className="premium-alert premium-alert--error" role="alert">
          Odkaz nie je platný. Ak ste dostali novší odkaz, použite ho.
        </div>
      </section>
    );
  }

  if (view.kind === 'expired') {
    return (
      <section className="premium-stack" style={accent}>
        <div className="premium-alert premium-alert--error" role="alert">
          Platnosť tohto odkazu vypršala. Kontaktujte prevádzku, aby vám poslala nový.
        </div>
      </section>
    );
  }

  if (view.kind === 'error') {
    return (
      <section className="premium-stack" style={accent}>
        <div className="premium-alert premium-alert--error" role="alert">
          {view.message}
        </div>
        <button type="button" className="premium-button-secondary" onClick={load}>
          Skúsiť znova
        </button>
      </section>
    );
  }

  const { booking } = view;
  const editable = booking.status === 'confirmed';
  const isCancelled = booking.status === 'cancelled';

  return (
    <section className="premium-stack" style={accent}>
      <div className="premium-card premium-stack">
        <span className="premium-section-label">{booking.tenantName}</span>
        <h1 className="premium-section-title">{booking.serviceName}</h1>
        <dl className="premium-stack">
          <div>
            <dt>Termín</dt>
            <dd>{formatWhen(booking.startTime)}</dd>
          </div>
          <div>
            <dt>Trvanie</dt>
            <dd>{booking.serviceDuration} min</dd>
          </div>
          <div>
            <dt>Cena</dt>
            <dd>{booking.servicePrice} €</dd>
          </div>
        </dl>
        <p className="premium-copy">Časy sa zobrazujú podľa nastavenia vášho zariadenia.</p>
      </div>

      {notice && (
        <div
          className={`premium-alert ${notice.tone === 'success' ? 'premium-alert--success' : 'premium-alert--error'}`}
          role={notice.tone === 'error' ? 'alert' : 'status'}
        >
          {notice.text}
        </div>
      )}

      {isCancelled && (
        <div className="premium-alert premium-alert--warning" role="status">
          Táto rezervácia je zrušená.
        </div>
      )}

      {!isCancelled && !editable && (
        <div className="premium-alert premium-alert--warning" role="status">
          Túto rezerváciu už nie je možné upraviť.
        </div>
      )}

      {editable && mode === 'view' && (
        <div className="premium-actions">
          <button type="button" className="premium-button" onClick={() => setMode('reschedule')} disabled={busy}>
            Zmeniť termín
          </button>
          <button type="button" className="premium-button-danger" onClick={handleCancel} disabled={busy}>
            {busy ? 'Ruším...' : 'Zrušiť rezerváciu'}
          </button>
        </div>
      )}

      {editable && mode === 'reschedule' && (
        <form className="premium-card premium-stack" onSubmit={handleReschedule}>
          <span className="premium-section-label">Nový termín</span>
          <label className="premium-stack">
            <span>Dátum</span>
            <input type="date" required value={date} onChange={e => setDate(e.target.value)} disabled={busy} />
          </label>
          <label className="premium-stack">
            <span>Čas</span>
            <input type="time" required value={time} onChange={e => setTime(e.target.value)} disabled={busy} />
          </label>
          <div className="premium-actions">
            <button type="submit" className="premium-button" disabled={busy}>
              {busy ? 'Ukladám...' : 'Potvrdiť nový termín'}
            </button>
            <button type="button" className="premium-button-secondary" onClick={() => setMode('view')} disabled={busy}>
              Späť
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
