'use client';

import { useCallback, useEffect, useState } from 'react';

type Status = 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';
type ReminderSummary = { settings: { enabled: boolean; leadMinutes: number }; counts: Record<Status, number>;
  recent: { booking_id: string; status: Status; scheduled_for: string; sent_at: string | null;
    attempt_count: number; error_message: string | null }[] };

const LEAD_OPTIONS = [60, 120, 1440, 2880];
const LABELS: Record<Status, string> = {
  pending: 'čaká',
  processing: 'odosiela sa',
  sent: 'odoslané',
  failed: 'zlyhalo',
  cancelled: 'zrušené',
};

export function RemindersCard({ tenantSlug }: { tenantSlug: string }) {
  const [summary, setSummary] = useState<ReminderSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/reminders?tenantSlug=${encodeURIComponent(tenantSlug)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Stav pripomienok sa nepodarilo načítať.');
      setSummary(data as ReminderSummary);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  }, [tenantSlug]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (next: { enabled: boolean; leadMinutes: number }) => {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/reminders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tenantSlug, ...next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Nastavenie sa nepodarilo uložiť.');
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!summary) {
    return (
      <div className="premium-card">
        <p className="premium-copy">{error ?? 'Načítavam pripomienky…'}</p>
      </div>
    );
  }

  return (
    <div className="premium-card premium-stack">
      <span className="premium-section-label">E-mailové pripomienky</span>
      {error && <div className="premium-alert premium-alert--error" role="alert">{error}</div>}
      <div className="premium-inline-actions">
        <label>
          <input
            type="checkbox"
            checked={summary.settings.enabled}
            disabled={busy}
            onChange={e => save({ ...summary.settings, enabled: e.target.checked })}
          />{' '}
          Posielať pripomienky
        </label>
        <label>
          Pripomenúť pred termínom{' '}
          <select
            value={summary.settings.leadMinutes}
            disabled={busy}
            onChange={e => save({ ...summary.settings, leadMinutes: Number(e.target.value) })}
          >
            {LEAD_OPTIONS.map(minutes => (
              <option key={minutes} value={minutes}>{minutes / 60} h</option>
            ))}
          </select>
        </label>
      </div>
      <p className="premium-copy">
        {(Object.keys(LABELS) as Status[]).map(status => `${LABELS[status]}: ${summary.counts[status] ?? 0}`).join(' · ')}
      </p>
      {summary.recent.some(row => row.status === 'failed') && (
        <ul className="premium-stack" aria-label="Zlyhané pripomienky">
          {summary.recent.filter(row => row.status === 'failed').slice(0, 5).map((row, i) => (
            <li key={`${row.booking_id}-${i}`}>
              {new Date(row.scheduled_for).toLocaleString('sk-SK')} · pokusov: {row.attempt_count}
              {row.error_message ? ` · ${row.error_message}` : ''}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
