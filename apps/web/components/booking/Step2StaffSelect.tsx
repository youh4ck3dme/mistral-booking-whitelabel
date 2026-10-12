'use client';

import { Zap, User, ArrowLeft, Check, ChevronRight } from 'lucide-react';

export type BookableStaffMember = {
  id: string;
  name: string;
  role?: string;
};

interface Step2StaffSelectProps {
  staffList: BookableStaffMember[];
  selectedStaffId: string | null;
  isAnyoneSelected: boolean;
  onSelectStaff: (staffId: string | null) => void;
  onBack: () => void;
  loading?: boolean;
}

export function Step2StaffSelect({
  staffList,
  selectedStaffId,
  isAnyoneSelected,
  onSelectStaff,
  onBack,
  loading = false,
}: Step2StaffSelectProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Vyberte si špecialistu
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Zvoľte preferovaného pracovníka alebo možnosť najbližšieho voľného termínu.
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 text-xs text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Zmeniť službu</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 pt-2">
        {/* ======================================================== */}
        {/* PRVÁ KARTA VŽDY: KTOKOĽVEK VOĽNÝ (NAJBLIŽŠÍ TERMÍN)     */}
        {/* ======================================================== */}
        <button
          type="button"
          onClick={() => onSelectStaff(null)}
          className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-4 group ${
            isAnyoneSelected
              ? 'border-emerald-500/80 bg-emerald-500/10 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/40'
              : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900'
          }`}
        >
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white group-hover:text-emerald-300 transition-colors">
                  Ktokoľvek voľný
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Najskorší termín
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Automaticky priradí prvého voľného špecialistu pre najkratšiu dobu čakania.
              </p>
            </div>
          </div>

          <div className="shrink-0 text-zinc-500 group-hover:text-zinc-300 transition-colors">
            {isAnyoneSelected ? (
              <span className="w-6 h-6 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </span>
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </div>
        </button>

        {/* ======================================================== */}
        {/* ZOZNAM KONKRÉTNYCH ŠPECIALISTOV                          */}
        {/* ======================================================== */}
        {loading ? (
          <div className="p-8 text-center text-xs text-zinc-500">Načítavam dostupných pracovníkov...</div>
        ) : (
          staffList.map((member) => {
            const isSelected = !isAnyoneSelected && selectedStaffId === member.id;

            return (
              <button
                key={member.id}
                type="button"
                onClick={() => onSelectStaff(member.id)}
                className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-4 group ${
                  isSelected
                    ? 'border-indigo-500/80 bg-indigo-500/10 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                    : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 font-bold shrink-0">
                    <User className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h3 className="text-base font-semibold text-white group-hover:text-indigo-300 transition-colors truncate">
                      {member.name}
                    </h3>
                    <p className="text-xs text-zinc-400">
                      {member.role ?? 'Špecialista prevádzky'}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-zinc-500 group-hover:text-zinc-300 transition-colors">
                  {isSelected ? (
                    <span className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
