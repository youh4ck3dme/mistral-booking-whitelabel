import type { Service } from '@repo/core';
import { Clock, Tag, ChevronRight, Check } from 'lucide-react';

interface Step1ServiceSelectProps {
  services: Service[];
  selectedServiceId: string | null;
  onSelectService: (service: Service) => void;
  primaryColor?: string;
}

export function Step1ServiceSelect({
  services,
  selectedServiceId,
  onSelectService,
  primaryColor = '#6366f1',
}: Step1ServiceSelectProps) {
  if (services.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white/80 dark:border-zinc-800 dark:bg-zinc-900/40 p-8 text-center space-y-3 shadow-sm">
        <p className="text-zinc-600 dark:text-zinc-400 text-sm">Momentálne nie sú k dispozícii žiadne aktívne služby.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
          Vyberte si službu
        </h2>
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
          Zvoľte procedúru alebo ošetrenie, o ktoré máte záujem.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 pt-2">
        {services.map((service) => {
          const isSelected = selectedServiceId === service.id;

          return (
            <button
              key={service.id}
              type="button"
              onClick={() => onSelectService(service)}
              className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-4 group ${
                isSelected
                  ? 'border-indigo-500/80 bg-indigo-50/70 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/40 dark:border-indigo-500/80 dark:bg-indigo-500/10'
                  : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/60 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700 dark:hover:bg-zinc-900'
              }`}
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                    {service.name}
                  </h3>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>

                {service.description && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {service.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400 pt-1">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    {service.duration} min
                  </span>
                  <span className="flex items-center gap-1 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    <Tag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
                    {service.price} €
                  </span>
                </div>
              </div>

              <div className="shrink-0 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
