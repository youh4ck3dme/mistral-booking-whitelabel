'use client';

import { useMemo } from 'react';
import { Calendar, Clock, ArrowLeft, Check, AlertCircle } from 'lucide-react';

export type TimeSlotItem = {
  staffId: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
};

interface Step3SlotSelectProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  availableDays: string[]; // List of YYYY-MM-DD
  slotsForSelectedDate: TimeSlotItem[];
  selectedSlot: TimeSlotItem | null;
  onSelectSlot: (slot: TimeSlotItem) => void;
  onBack: () => void;
  loading?: boolean;
}

const SK_DAYS = ['Ne', 'Po', 'Ut', 'St', 'Št', 'Pi', 'So'];
const SK_MONTHS = [
  'januára',
  'februára',
  'marca',
  'apríla',
  'mája',
  'júna',
  'júla',
  'augusta',
  'septembra',
  'októbra',
  'novembra',
  'decembra',
];

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function Step3SlotSelect({
  selectedDate,
  onSelectDate,
  availableDays,
  slotsForSelectedDate,
  selectedSlot,
  onSelectSlot,
  onBack,
  loading = false,
}: Step3SlotSelectProps) {
  // Generate date carousel options
  const dateOptions = useMemo(() => {
    return availableDays.map((dateStr) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      return {
        dateStr,
        dayName: SK_DAYS[d.getDay()],
        dayNum: d.getDate(),
        monthName: SK_MONTHS[d.getMonth()],
      };
    });
  }, [availableDays]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Vyberte si termín a čas
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Zvoľte vyhovujúci deň a voľný časový slot.
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 text-xs text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Zmeniť personál</span>
        </button>
      </div>

      {/* 1. Date Selection Carousel / Row */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
          <span>Dostupné dni</span>
        </label>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
          {dateOptions.map((item) => {
            const isSelected = selectedDate === item.dateStr;

            return (
              <button
                key={item.dateStr}
                type="button"
                onClick={() => onSelectDate(item.dateStr)}
                className={`flex-shrink-0 w-16 sm:w-20 py-3 rounded-2xl border text-center transition-all duration-200 ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 ring-2 ring-indigo-400/40'
                    : 'border-zinc-800 bg-zinc-900/70 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <div className={`text-[11px] font-medium uppercase ${isSelected ? 'text-indigo-100' : 'text-zinc-500'}`}>
                  {item.dayName}
                </div>
                <div className="text-lg sm:text-xl font-extrabold my-0.5">
                  {item.dayNum}
                </div>
                <div className={`text-[10px] truncate px-1 ${isSelected ? 'text-indigo-100' : 'text-zinc-500'}`}>
                  {item.monthName.slice(0, 3)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Time Slot Grid */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Voľné časy pre vybraný deň</span>
          </label>
          <span className="text-[11px] text-zinc-500">
            {slotsForSelectedDate.length} {slotsForSelectedDate.length === 1 ? 'slot' : 'slotov'}
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-zinc-500 rounded-2xl border border-zinc-800 bg-zinc-900/30">
            Načítavam voľné termíny...
          </div>
        ) : slotsForSelectedDate.length === 0 ? (
          <div className="p-8 text-center space-y-2 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30">
            <AlertCircle className="w-6 h-6 text-zinc-500 mx-auto" />
            <p className="text-sm font-semibold text-zinc-300">Pre tento deň už nie sú voľné sloty.</p>
            <p className="text-xs text-zinc-500">Zvoľte prosím iný dátum v kalendári vyššie.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
            {slotsForSelectedDate.map((slot) => {
              const isSelected = selectedSlot?.startTime === slot.startTime;
              const formatted = formatTime(slot.startTime);

              return (
                <button
                  key={slot.startTime}
                  type="button"
                  onClick={() => onSelectSlot(slot)}
                  className={`py-3 px-2 rounded-xl text-center font-mono text-sm font-bold border transition-all duration-200 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20 scale-[1.03]'
                      : 'border-zinc-800 bg-zinc-900/80 text-zinc-200 hover:border-indigo-500/60 hover:bg-zinc-800'
                  }`}
                >
                  {formatted}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
