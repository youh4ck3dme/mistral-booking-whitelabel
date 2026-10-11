'use client';

import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@repo/supabase';

type StaffMember = { id: string; display_name: string; is_active: boolean };
type Interval = { weekday: number; start_time: string; end_time: string };
type TimeOff = { id: string; starts_at: string; ends_at: string; reason: string | null };
type ServiceOption = { id: string; name: string };

const WEEKDAYS = [
  { n: 1, label: 'Pondelok' },
  { n: 2, label: 'Utorok' },
  { n: 3, label: 'Streda' },
  { n: 4, label: 'Štvrtok' },
  { n: 5, label: 'Piatok' },
  { n: 6, label: 'Sobota' },
  { n: 7, label: 'Nedeľa' },
];

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function shortTime(value: string) {
  return value.slice(0, 5);
}

export function StaffTab({
  tenantSlug,
  services,
  supabase,
}: {
  tenantSlug: string;
  services: ServiceOption[];
  supabase: SupabaseClient<Database>;
}) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [assigned, setAssigned] = useState<Set<string>>(new Set());
  const [hours, setHours] = useState<Interval[]>([]);
  const [breaks, setBreaks] = useState<Interval[]>([]);
  const [timeOff, setTimeOff] = useState<TimeOff[]>([]);
  const [timeOffStart, setTimeOffStart] = useState('');
  const [timeOffEnd, setTimeOffEnd] = useState('');
  const [timeOffReason, setTimeOffReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const post = useCallback(async (body: Record<string, unknown>) => {
    const res = await fetch('/api/admin/staff', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...body, tenantSlug }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) throw new Error(data.error || 'Uloženie zlyhalo.');
    return data;
  }, [tenantSlug]);

  const loadStaff = useCallback(async () => {
    const { data, error } = await supabase
      .from('staff')
      .select('id, display_name, is_active')
      .order('display_name', { ascending: true });
    if (error) {
      setMessage({ tone: 'error', text: 'Pracovníkov sa nepodarilo načítať.' });
      return;
    }
    setStaff((data ?? []) as StaffMember[]);
  }, [supabase]);

  const loadDetails = useCallback(async (staffId: string) => {
    const [assignments, workingHours, breakRows, offRows] = await Promise.all([
      supabase.from('service_staff').select('service_id').eq('staff_id', staffId),
      supabase.from('staff_working_hours').select('weekday, start_time, end_time').eq('staff_id', staffId),
      supabase.from('staff_breaks').select('weekday, start_time, end_time').eq('staff_id', staffId),
      supabase.from('staff_time_off').select('id, starts_at, ends_at, reason')
        .eq('staff_id', staffId).order('starts_at', { ascending: true }),
    ]);
    setAssigned(new Set((assignments.data ?? []).map(row => row.service_id as string)));
    setHours((workingHours.data ?? []) as Interval[]);
    setBreaks((breakRows.data ?? []) as Interval[]);
    setTimeOff((offRows.data ?? []) as TimeOff[]);
  }, [supabase]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  useEffect(() => {
    if (selectedId) loadDetails(selectedId);
  }, [selectedId, loadDetails]);

  const run = async (action: () => Promise<void>, success: string) => {
    setBusy(true);
    setMessage(null);
    try {
      await action();
      setMessage({ tone: 'ok', text: success });
    } catch (err: any) {
      setMessage({ tone: 'error', text: err.message || 'Uloženie zlyhalo.' });
    } finally {
      setBusy(false);
    }
  };

  const addStaff = (event: FormEvent) => {
    event.preventDefault();
    const name = newName.trim();
    if (!name) return;
    run(async () => {
      await post({ action: 'createStaff', displayName: name });
      setNewName('');
      await loadStaff();
    }, 'Pracovník bol pridaný.');
  };

  const toggleActive = (member: StaffMember) => run(async () => {
    await post({ action: 'updateStaff', staffId: member.id, isActive: !member.is_active });
    await loadStaff();
  }, member.is_active ? 'Pracovník bol deaktivovaný.' : 'Pracovník bol aktivovaný.');

  // The API stores the full staff list per service, so read that list, then add or remove this member.
  const toggleService = (serviceId: string) => {
    if (!selectedId) return;
    const turnOn = !assigned.has(serviceId);
    run(async () => {
      const { data, error } = await supabase.from('service_staff').select('staff_id').eq('service_id', serviceId);
      if (error) throw new Error('Priradenie sa nepodarilo načítať.');
      const current = (data ?? []).map(row => row.staff_id as string).filter(id => id !== selectedId);
      const staffIds = turnOn ? [...current, selectedId] : current;
      await post({ action: 'setServiceStaff', serviceId, staffIds });
      setAssigned(prev => {
        const next = new Set(prev);
        if (turnOn) next.add(serviceId); else next.delete(serviceId);
        return next;
      });
    }, 'Priradenie služieb je uložené.');
  };

  const intervalFor = (rows: Interval[], weekday: number) => rows.find(row => row.weekday === weekday);

  const saveInterval = (kind: 'setWorkingHours' | 'setBreak', weekday: number, start: string, end: string) => {
    if (!selectedId) return;
    if (start === '' && end === '') {
      run(async () => {
        await post({ action: kind, staffId: selectedId, weekday, interval: null });
        await loadDetails(selectedId);
      }, 'Deň je vymazaný.');
      return;
    }
    if (!TIME_PATTERN.test(start) || !TIME_PATTERN.test(end) || start >= end) {
      setMessage({ tone: 'error', text: 'Zadajte platný začiatok a koniec (koniec po začiatku).' });
      return;
    }
    run(async () => {
      await post({ action: kind, staffId: selectedId, weekday, interval: { start, end } });
      await loadDetails(selectedId);
    }, 'Uložené.');
  };

  const addTimeOff = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedId || !timeOffStart || !timeOffEnd) return;
    const startsAt = new Date(timeOffStart);
    const endsAt = new Date(timeOffEnd);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || startsAt >= endsAt) {
      setMessage({ tone: 'error', text: 'Koniec blokácie musí byť po začiatku.' });
      return;
    }
    run(async () => {
      await post({
        action: 'addTimeOff',
        staffId: selectedId,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        reason: timeOffReason.trim() || undefined,
      });
      setTimeOffStart('');
      setTimeOffEnd('');
      setTimeOffReason('');
      await loadDetails(selectedId);
    }, 'Blokácia je pridaná.');
  };

  const removeTimeOff = (id: string) => run(async () => {
    await post({ action: 'removeTimeOff', timeOffId: id });
    if (selectedId) await loadDetails(selectedId);
  }, 'Blokácia je odstránená.');

  const selected = staff.find(member => member.id === selectedId) ?? null;

  return (
    <section className="premium-stack">
      {message && (
        <div className={`premium-alert ${message.tone === 'ok' ? 'premium-alert--success' : 'premium-alert--error'}`} role="status">
          {message.text}
        </div>
      )}

      <div className="premium-card premium-stack">
        <span className="premium-section-label">Personál</span>
        <ul className="premium-stack" aria-label="Pracovníci">
          {staff.map(member => (
            <li key={member.id} className="premium-inline-actions">
              <button
                type="button"
                className={member.id === selectedId ? 'premium-button' : 'premium-button-secondary'}
                onClick={() => setSelectedId(member.id)}
              >
                {member.display_name}{member.is_active ? '' : ' (neaktívny)'}
              </button>
              <button type="button" className="premium-button-secondary premium-button-small" onClick={() => toggleActive(member)} disabled={busy}>
                {member.is_active ? 'Deaktivovať' : 'Aktivovať'}
              </button>
            </li>
          ))}
        </ul>
        <form className="premium-inline-actions" onSubmit={addStaff}>
          <label>
            <span className="premium-section-label">Nový pracovník</span>
            <input type="text" value={newName} maxLength={80} onChange={e => setNewName(e.target.value)} disabled={busy} />
          </label>
          <button type="submit" className="premium-button" disabled={busy || !newName.trim()}>Pridať</button>
        </form>
      </div>

      {selected && (
        <>
          <div className="premium-card premium-stack">
            <span className="premium-section-label">Služby: {selected.display_name}</span>
            {services.length === 0 && <p className="premium-copy">Najprv pridajte služby.</p>}
            {services.map(service => (
              <label key={service.id} className="premium-inline-actions">
                <input
                  type="checkbox"
                  checked={assigned.has(service.id)}
                  onChange={() => toggleService(service.id)}
                  disabled={busy}
                />
                <span>{service.name}</span>
              </label>
            ))}
          </div>

          <div className="premium-card premium-stack">
            <span className="premium-section-label">Pracovný čas a prestávky</span>
            {WEEKDAYS.map(day => (
              <WeekdayRow
                key={`${selected.id}-${day.n}`}
                label={day.label}
                work={intervalFor(hours, day.n)}
                brk={intervalFor(breaks, day.n)}
                disabled={busy}
                onSaveWork={(start, end) => saveInterval('setWorkingHours', day.n, start, end)}
                onSaveBreak={(start, end) => saveInterval('setBreak', day.n, start, end)}
              />
            ))}
          </div>

          <div className="premium-card premium-stack">
            <span className="premium-section-label">Dovolenka a blokácie</span>
            {timeOff.length === 0 && <p className="premium-copy">Žiadne blokácie.</p>}
            <ul className="premium-stack">
              {timeOff.map(item => (
                <li key={item.id} className="premium-inline-actions">
                  <span>
                    {new Date(item.starts_at).toLocaleString('sk-SK')} – {new Date(item.ends_at).toLocaleString('sk-SK')}
                    {item.reason ? ` · ${item.reason}` : ''}
                  </span>
                  <button type="button" className="premium-button-danger premium-button-small" onClick={() => removeTimeOff(item.id)} disabled={busy}>
                    Odstrániť
                  </button>
                </li>
              ))}
            </ul>
            <form className="premium-stack" onSubmit={addTimeOff}>
              <label className="premium-stack">
                <span>Od</span>
                <input type="datetime-local" value={timeOffStart} onChange={e => setTimeOffStart(e.target.value)} disabled={busy} />
              </label>
              <label className="premium-stack">
                <span>Do</span>
                <input type="datetime-local" value={timeOffEnd} onChange={e => setTimeOffEnd(e.target.value)} disabled={busy} />
              </label>
              <label className="premium-stack">
                <span>Dôvod (voliteľné)</span>
                <input type="text" maxLength={200} value={timeOffReason} onChange={e => setTimeOffReason(e.target.value)} disabled={busy} />
              </label>
              <button type="submit" className="premium-button" disabled={busy || !timeOffStart || !timeOffEnd}>Pridať blokáciu</button>
            </form>
          </div>
        </>
      )}
    </section>
  );
}

function WeekdayRow({
  label,
  work,
  brk,
  disabled,
  onSaveWork,
  onSaveBreak,
}: {
  label: string;
  work?: Interval;
  brk?: Interval;
  disabled: boolean;
  onSaveWork: (start: string, end: string) => void;
  onSaveBreak: (start: string, end: string) => void;
}) {
  const [ws, setWs] = useState(work ? shortTime(work.start_time) : '');
  const [we, setWe] = useState(work ? shortTime(work.end_time) : '');
  const [bs, setBs] = useState(brk ? shortTime(brk.start_time) : '');
  const [be, setBe] = useState(brk ? shortTime(brk.end_time) : '');

  return (
    <div className="premium-stack">
      <strong>{label}</strong>
      <div className="premium-inline-actions">
        <label>Práca od <input type="time" value={ws} onChange={e => setWs(e.target.value)} disabled={disabled} /></label>
        <label>do <input type="time" value={we} onChange={e => setWe(e.target.value)} disabled={disabled} /></label>
        <button type="button" className="premium-button-secondary premium-button-small" disabled={disabled} onClick={() => onSaveWork(ws, we)}>Uložiť</button>
      </div>
      <div className="premium-inline-actions">
        <label>Prestávka od <input type="time" value={bs} onChange={e => setBs(e.target.value)} disabled={disabled} /></label>
        <label>do <input type="time" value={be} onChange={e => setBe(e.target.value)} disabled={disabled} /></label>
        <button type="button" className="premium-button-secondary premium-button-small" disabled={disabled} onClick={() => onSaveBreak(bs, be)}>Uložiť</button>
      </div>
    </div>
  );
}
