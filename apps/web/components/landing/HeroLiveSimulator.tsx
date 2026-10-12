'use client';

import { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Scissors,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  RefreshCw,
  Palette,
  Check,
} from 'lucide-react';

type BrandTheme = {
  id: 'elegance' | 'barber';
  name: string;
  category: string;
  domain: string;
  primaryColor: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  accentGradient: string;
  ringColor: string;
  badgeBg: string;
};

const BRANDS: Record<'elegance' | 'barber', BrandTheme> = {
  elegance: {
    id: 'elegance',
    name: 'Elegance Salon & Spa',
    category: 'Prémiový salón krásy',
    domain: 'app.nexify.sk/elegance/book',
    primaryColor: '#a855f7',
    accentBg: 'bg-purple-500/15',
    accentBorder: 'border-purple-500/40',
    accentText: 'text-purple-300',
    accentGradient: 'from-purple-500 to-indigo-500',
    ringColor: 'ring-purple-500/50',
    badgeBg: 'bg-purple-500/20 text-purple-200 border-purple-500/30',
  },
  barber: {
    id: 'barber',
    name: 'Barber District HQ',
    category: 'Gentlemen Barber Shop',
    domain: 'rezervacie.barberdistrict.sk',
    primaryColor: '#f59e0b',
    accentBg: 'bg-amber-500/15',
    accentBorder: 'border-amber-500/40',
    accentText: 'text-amber-300',
    accentGradient: 'from-amber-500 to-emerald-500',
    ringColor: 'ring-amber-500/50',
    badgeBg: 'bg-amber-500/20 text-amber-200 border-amber-500/30',
  },
};

const SERVICES = [
  { id: 'cut', name: 'Strih & Styling', duration: 45, price: 35 },
  { id: 'full', name: 'Kompletná starostlivosť', duration: 60, price: 50 },
];

const STAFF_LIST = [
  { id: 'michal', name: 'Michal K.', role: 'Senior Stylist' },
  { id: 'lucia', name: 'Lucia M.', role: 'Color Expert' },
];

const AVAILABLE_SLOTS = ['13:00', '14:00', '15:30', '17:00'];

export function HeroLiveSimulator() {
  const [currentBrand, setCurrentBrand] = useState<'elegance' | 'barber'>('elegance');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('cut');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('michal');
  const [selectedSlot, setSelectedSlot] = useState<string>('14:00');
  const [activeTab, setActiveTab] = useState<'client' | 'admin'>('client');
  const [justLocked, setJustLocked] = useState<boolean>(true);

  const brand = BRANDS[currentBrand];
  const selectedService = SERVICES.find((s) => s.id === selectedServiceId) ?? SERVICES[0];
  const selectedStaff = STAFF_LIST.find((s) => s.id === selectedStaffId) ?? STAFF_LIST[0];

  const handleSelectSlot = (slot: string) => {
    setSelectedSlot(slot);
    setJustLocked(true);
    setTimeout(() => setJustLocked(false), 900);
  };

  const toggleBrand = () => {
    setCurrentBrand((prev) => (prev === 'elegance' ? 'barber' : 'elegance'));
  };

  return (
    <div className="w-full rounded-2xl border border-zinc-700/70 bg-gradient-to-b from-zinc-900/95 via-zinc-900/90 to-zinc-950/95 shadow-2xl backdrop-blur-xl overflow-hidden">
      {/* Simulation Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-950/70 text-xs">
        {/* Browser URL Simulation */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 font-mono text-[11px] text-zinc-400 truncate max-w-[200px] sm:max-w-xs">
            <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="truncate">{brand.domain}</span>
          </div>
        </div>

        {/* White-Label Theme Switcher Action */}
        <button
          type="button"
          onClick={toggleBrand}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 transition-all duration-200 shadow-sm"
          title="Zmeniť branding značky"
        >
          <Palette className="w-3.5 h-3.5 text-indigo-400" />
          <span>Branding: {brand.name.split(' ')[0]}</span>
          <RefreshCw className="w-3 h-3 text-zinc-400 ml-0.5" />
        </button>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="flex lg:hidden border-b border-zinc-800 bg-zinc-900/50 p-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('client')}
          className={`flex-1 py-2 text-center rounded-lg font-semibold transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'client'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Klientsky widget</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('admin')}
          className={`flex-1 py-2 text-center rounded-lg font-semibold transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'admin'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>Živý kalendár personálu</span>
        </button>
      </div>

      {/* Simulator Content Grid (Split-View on Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800/80">
        {/* ========================================================= */}
        {/* LEFT COLUMN: Client Booking Widget                        */}
        {/* ========================================================= */}
        <div
          className={`lg:col-span-6 p-4 sm:p-5 space-y-4 ${
            activeTab === 'client' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Header of Tenant Booking Card */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full transition-colors duration-300"
                  style={{ backgroundColor: brand.primaryColor }}
                />
                {brand.name}
              </div>
              <div className="text-[11px] text-zinc-400">{brand.category}</div>
            </div>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${brand.badgeBg} transition-colors duration-200`}
            >
              100% White-Label
            </span>
          </div>

          {/* 1. Service Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1">
              <Scissors className="w-3 h-3 text-zinc-400" />
              <span>Výber služby</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SERVICES.map((s) => {
                const isSelected = selectedServiceId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedServiceId(s.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all duration-200 ${
                      isSelected
                        ? `${brand.accentBg} ${brand.accentBorder} ring-1 ${brand.ringColor}`
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="text-xs font-semibold text-white truncate">{s.name}</div>
                    <div className="flex justify-between items-center text-[11px] text-zinc-400 mt-0.5">
                      <span>{s.duration} min</span>
                      <span className="font-bold text-emerald-400">{s.price} €</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Staff Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1">
              <User className="w-3 h-3 text-zinc-400" />
              <span>Personál</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {STAFF_LIST.map((staff) => {
                const isSelected = selectedStaffId === staff.id;
                return (
                  <button
                    key={staff.id}
                    type="button"
                    onClick={() => setSelectedStaffId(staff.id)}
                    className={`p-2 rounded-xl border text-left transition-all duration-200 ${
                      isSelected
                        ? `${brand.accentBg} ${brand.accentBorder} ring-1 ${brand.ringColor}`
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="text-xs font-semibold text-white">{staff.name}</div>
                    <div className="text-[10px] text-zinc-400">{staff.role}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Slot Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-zinc-300 flex items-center gap-1">
                <Clock className="w-3 h-3 text-zinc-400" />
                <span>Dostupné sloty (kliknite pre test zámku)</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Dnes</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {AVAILABLE_SLOTS.map((slot) => {
                const isSelected = selectedSlot === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => handleSelectSlot(slot)}
                    className={`py-2 px-1 text-center rounded-xl font-mono text-xs font-bold transition-all duration-200 ${
                      isSelected
                        ? `bg-gradient-to-r ${brand.accentGradient} text-zinc-950 shadow-md scale-[1.02]`
                        : 'bg-zinc-800/80 border border-zinc-700/70 text-zinc-200 hover:border-zinc-500'
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Client Action Notification */}
          <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-[11px] flex items-center justify-between text-zinc-300">
            <div className="flex items-center gap-1.5 truncate">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">
                Vybraté: <strong className="text-white">{selectedSlot}</strong> ({selectedStaff.name})
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono shrink-0">Bez prihlásenia</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Business Calendar & Outbox Live Locks       */}
        {/* ========================================================= */}
        <div
          className={`lg:col-span-6 p-4 sm:p-5 space-y-4 bg-zinc-950/60 ${
            activeTab === 'admin' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Calendar Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-indigo-400" />
              <div>
                <div className="text-sm font-bold text-white">Rozvrh: {selectedStaff.name}</div>
                <div className="text-[10px] text-zinc-400">Automatické buffer časy +10 min</div>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              GiST Index Aktívny
            </span>
          </div>

          {/* Live Schedule Timeline */}
          <div className="space-y-2.5 text-xs font-mono">
            {/* Slot A: Existing booking */}
            <div className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 flex items-center justify-between text-zinc-400 opacity-75">
              <div className="flex items-center gap-2">
                <span className="font-bold text-zinc-300">12:00 – 12:45</span>
                <span className="text-[11px] font-sans text-zinc-400">Peter M. (Pánsky strih)</span>
              </div>
              <span className="text-[10px] text-zinc-500 px-1.5 py-0.5 rounded bg-zinc-800">Obsadené</span>
            </div>

            {/* Buffer strip indicator */}
            <div className="px-3 py-1 rounded-md bg-zinc-900/40 border border-dashed border-zinc-800 text-[10px] text-zinc-500 flex items-center justify-between">
              <span>🧹 Buffer na upratanie: 12:45 – 12:55</span>
              <span>+10 min</span>
            </div>

            {/* Slot B: Interactive Target Slot */}
            <div
              className={`p-3 rounded-xl border transition-all duration-300 ${
                justLocked
                  ? 'border-emerald-500/80 bg-emerald-500/10 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-500/50'
                  : 'border-indigo-500/60 bg-indigo-500/10 ring-1 ring-indigo-500/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-xs">{selectedSlot} – {getEndTime(selectedSlot, selectedService.duration)}</span>
                  <span className="text-[11px] font-sans font-semibold text-zinc-200">
                    Nový klient ({selectedService.name})
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Uzamknuté
                  </span>
                </div>
              </div>

              {/* Buffer calculation */}
              <div className="mt-2 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-sans text-zinc-300">
                <span className="flex items-center gap-1 text-emerald-400 text-[10px]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Nulový double-booking (PostgreSQL EXCLUDE)
                </span>
                <span className="text-[10px] text-indigo-300 font-mono">
                  Buffer do {getEndTime(selectedSlot, selectedService.duration + 10)}
                </span>
              </div>
            </div>

            {/* Buffer strip indicator */}
            <div className="px-3 py-1 rounded-md bg-zinc-900/40 border border-dashed border-zinc-800 text-[10px] text-zinc-500 flex items-center justify-between">
              <span>🧹 Buffer na upratanie: {getEndTime(selectedSlot, selectedService.duration)} – {getEndTime(selectedSlot, selectedService.duration + 10)}</span>
              <span>+10 min</span>
            </div>

            {/* Slot C: Later existing booking */}
            <div className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 flex items-center justify-between text-zinc-400 opacity-75">
              <div className="flex items-center gap-2">
                <span className="font-bold text-zinc-300">16:30 – 17:15</span>
                <span className="text-[11px] font-sans text-zinc-400">Ján T. (Styling)</span>
              </div>
              <span className="text-[10px] text-zinc-500 px-1.5 py-0.5 rounded bg-zinc-800">Obsadené</span>
            </div>
          </div>

          {/* Outbox Event Telemetry */}
          <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-[11px] text-zinc-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Transakčný Outbox: e-mailové potvrdenie vygenerované</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold">Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getEndTime(startTime: string, durationMinutes: number): string {
  const [hStr, mStr] = startTime.split(':');
  const h = Number.parseInt(hStr, 10);
  const m = Number.parseInt(mStr, 10);
  const totalMinutes = h * 60 + m + durationMinutes;
  const endH = Math.floor(totalMinutes / 60) % 24;
  const endM = totalMinutes % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}
