'use client';

import { useState } from 'react';
import {
  X,
  Download,
  FileSpreadsheet,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { createClient } from '@repo/web/src/utils/supabase/client';
import {
  bookingsToCsv,
  downloadFile,
  servicesToCsv,
  staffToCsv,
  tenantToFullCsv,
  tenantToJson,
  type ExportBooking,
  type ExportService,
  type ExportStaff,
  type TenantExportData,
} from '@repo/web/src/lib/export/tenant-export';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantSlug: string;
  tenantId: string;
  tenantName: string;
}

type ExportKind = 'all-csv' | 'bookings-csv' | 'services-csv' | 'staff-csv' | 'all-json';

export function ExportModal({
  isOpen,
  onClose,
  tenantSlug,
  tenantId,
  tenantName,
}: ExportModalProps) {
  const supabase = createClient();
  const [isExporting, setIsExporting] = useState(false);
  const [lastExported, setLastExported] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const dateStamp = new Date().toISOString().slice(0, 10);

  const fetchTenantData = async (): Promise<TenantExportData> => {
    const [servicesRes, staffRes, bookingsRes] = await Promise.all([
      supabase
        .from('services')
        .select('id, name, description, price, duration, is_active, created_at')
        .eq('tenant_id', tenantId)
        .order('name', { ascending: true }),
      supabase
        .from('staff')
        .select('id, display_name, email, is_active, created_at')
        .eq('tenant_id', tenantId)
        .order('display_name', { ascending: true }),
      supabase
        .from('bookings')
        .select('id, start_time, end_time, status, created_at, services(name, price), staff(display_name)')
        .eq('tenant_id', tenantId)
        .order('start_time', { ascending: false }),
    ]);

    if (servicesRes.error) throw servicesRes.error;
    if (staffRes.error) throw staffRes.error;
    if (bookingsRes.error) throw bookingsRes.error;

    const services: ExportService[] = (servicesRes.data ?? []).map((s: any) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      price: s.price,
      duration: s.duration,
      is_active: Boolean(s.is_active),
      created_at: s.created_at,
    }));

    const staff: ExportStaff[] = (staffRes.data ?? []).map((st: any) => ({
      id: st.id,
      display_name: st.display_name,
      email: st.email,
      is_active: Boolean(st.is_active),
      created_at: st.created_at,
    }));

    const bookings: ExportBooking[] = (bookingsRes.data ?? []).map((b: any) => {
      const svc = Array.isArray(b.services) ? b.services[0] : b.services;
      const st = Array.isArray(b.staff) ? b.staff[0] : b.staff;
      return {
        id: b.id,
        start_time: b.start_time,
        end_time: b.end_time,
        status: b.status,
        service_name: svc?.name ?? null,
        staff_name: st?.display_name ?? null,
        price: svc?.price ?? null,
        created_at: b.created_at,
      };
    });

    return {
      tenantName,
      exportedAt: new Date().toISOString(),
      services,
      staff,
      bookings,
    };
  };

  const handleRunExport = async (kind: ExportKind) => {
    setIsExporting(true);
    setExportError(null);
    try {
      const data = await fetchTenantData();

      switch (kind) {
        case 'all-csv': {
          const csv = tenantToFullCsv(data);
          downloadFile(csv, `${tenantSlug}-kompletny-export-${dateStamp}.csv`);
          setLastExported('Kompletný CSV export bol úspešne stiahnutý.');
          break;
        }
        case 'bookings-csv': {
          const csv = bookingsToCsv(data.bookings);
          downloadFile(csv, `${tenantSlug}-rezervacie-${dateStamp}.csv`);
          setLastExported(`Exportovaných ${data.bookings.length} rezervácií (CSV).`);
          break;
        }
        case 'services-csv': {
          const csv = servicesToCsv(data.services);
          downloadFile(csv, `${tenantSlug}-sluzby-${dateStamp}.csv`);
          setLastExported(`Exportovaných ${data.services.length} služieb (CSV).`);
          break;
        }
        case 'staff-csv': {
          const csv = staffToCsv(data.staff);
          downloadFile(csv, `${tenantSlug}-personal-${dateStamp}.csv`);
          setLastExported(`Exportovaných ${data.staff.length} členov personálu (CSV).`);
          break;
        }
        case 'all-json': {
          const json = tenantToJson(data);
          downloadFile(json, `${tenantSlug}-backup-${dateStamp}.json`, 'application/json;charset=utf-8');
          setLastExported('Kompletný JSON balík bol úspešne stiahnutý.');
          break;
        }
      }
    } catch (err: any) {
      setExportError(err?.message || 'Nastala chyba pri načítavaní dát pre export.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 sm:p-7 max-w-xl w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                OPS-9 & BK-3
              </span>
              <h2 id="export-modal-title" className="text-xl font-bold text-white">
                Bezplatný export dát tenanta
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
            aria-label="Zatvoriť dialóg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-zinc-400 leading-relaxed">
          Kedykoľvek si môžete bezplatne stiahnuť všetky údaje vašej prevádzky ({tenantName}).
          Dáta patria výlučne vám — žiadne vendor lock-in obmedzenia.
        </p>

        {/* Security / compliance badge */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-zinc-300 leading-relaxed">
            <strong className="text-emerald-400 block mb-0.5 font-semibold">
              Bezpečný štandard formátovania:
            </strong>
            Ochrana proti CSV Injection (sanitizácia vzorcov <code className="text-emerald-300 font-mono text-[11px]">= + - @</code>),
            oddeľovač bodkočiarka a kódovanie UTF-8 s BOM pre okamžité otvorenie v programe Excel na SK/CZ Windows.
          </div>
        </div>

        {exportError && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 flex items-center gap-3 text-sm text-red-300">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{exportError}</span>
          </div>
        )}

        {lastExported && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 flex items-center gap-3 text-sm text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{lastExported}</span>
          </div>
        )}

        {/* Export action buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            disabled={isExporting}
            onClick={() => handleRunExport('all-csv')}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-white transition-all text-left group disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-blue-400" />
              <div>
                <div className="font-semibold text-sm">Kompletný CSV bundle (Všetko v jednom)</div>
                <div className="text-xs text-zinc-400">Služby, personál aj rezervácie v jednom súbore so sekciami</div>
              </div>
            </div>
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            ) : (
              <Download className="w-4 h-4 text-blue-400 group-hover:translate-y-0.5 transition-transform" />
            )}
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              disabled={isExporting}
              onClick={() => handleRunExport('bookings-csv')}
              className="flex items-center justify-between p-3 rounded-xl border border-zinc-800 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-200 transition-all text-left text-xs font-medium disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-zinc-400" />
                <span>Rezervácie (CSV)</span>
              </div>
              <Download className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            <button
              type="button"
              disabled={isExporting}
              onClick={() => handleRunExport('services-csv')}
              className="flex items-center justify-between p-3 rounded-xl border border-zinc-800 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-200 transition-all text-left text-xs font-medium disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-zinc-400" />
                <span>Služby (CSV)</span>
              </div>
              <Download className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            <button
              type="button"
              disabled={isExporting}
              onClick={() => handleRunExport('staff-csv')}
              className="flex items-center justify-between p-3 rounded-xl border border-zinc-800 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-200 transition-all text-left text-xs font-medium disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-zinc-400" />
                <span>Personál (CSV)</span>
              </div>
              <Download className="w-3.5 h-3.5 text-zinc-400" />
            </button>
          </div>

          <button
            type="button"
            disabled={isExporting}
            onClick={() => handleRunExport('all-json')}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-zinc-800 bg-zinc-800/40 hover:bg-zinc-800 text-zinc-300 transition-all text-left group disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <FileCode className="w-5 h-5 text-amber-400" />
              <div>
                <div className="font-semibold text-sm">Záložný JSON balík (Strojovo čitateľný)</div>
                <div className="text-xs text-zinc-400">Kompletná štruktúrovaná kópia pre migráciu, GDPR archiváciu alebo zálohy</div>
              </div>
            </div>
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            ) : (
              <Download className="w-4 h-4 text-zinc-400 group-hover:translate-y-0.5 transition-transform" />
            )}
          </button>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-sm transition-colors"
          >
            Zavrieť
          </button>
        </div>
      </div>
    </div>
  );
}
