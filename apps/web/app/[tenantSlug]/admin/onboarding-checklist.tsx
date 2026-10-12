'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Circle,
  Scissors,
  Users,
  Palette,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  EyeOff,
  Eye,
} from 'lucide-react';

interface OnboardingChecklistProps {
  tenantSlug: string;
  tenantId: string;
  tenantName: string;
  servicesCount: number;
  hasStaff: boolean;
  hasWorkingHours: boolean;
  hasBranding: boolean;
  bookingsCount: number;
  onNavigateTab: (tab: 'services' | 'bookings' | 'branding' | 'staff') => void;
}

export function OnboardingChecklist({
  tenantSlug,
  tenantId,
  tenantName,
  servicesCount,
  hasStaff,
  hasWorkingHours,
  hasBranding,
  bookingsCount,
  onNavigateTab,
}: OnboardingChecklistProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isTestedManually, setIsTestedManually] = useState(false);

  const storageKey = `nexify_onboarding_dismissed_${tenantId}`;
  const testKey = `nexify_onboarding_tested_${tenantId}`;

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const dismissed = localStorage.getItem(storageKey);
        if (dismissed === 'true') {
          setIsDismissed(true);
        }
        const tested = localStorage.getItem(testKey);
        if (tested === 'true') {
          setIsTestedManually(true);
        }
      }
    } catch {
      // localStorage unavailable or restricted
    }
  }, [storageKey, testKey]);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem(storageKey, 'true');
    } catch {}
  };

  const handleRestore = () => {
    setIsDismissed(false);
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  };

  const handleMarkTested = () => {
    setIsTestedManually(true);
    try {
      localStorage.setItem(testKey, 'true');
    } catch {}
  };

  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}/${tenantSlug}/book`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  // 4 Core Setup Criteria
  const step1Done = servicesCount > 0;
  const step2Done = hasStaff && hasWorkingHours;
  const step3Done = hasBranding;
  const step4Done = bookingsCount > 0 || isTestedManually;

  const completedCount = [step1Done, step2Done, step3Done, step4Done].filter(Boolean).length;
  const percent = Math.round((completedCount / 4) * 100);
  const isAllComplete = completedCount === 4;

  if (isDismissed) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-xs text-zinc-400">
        <span className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          Onboarding sprievodca prevádzky je skrytý ({completedCount}/4 krokov).
        </span>
        <button
          type="button"
          onClick={handleRestore}
          className="inline-flex items-center gap-1 font-semibold text-indigo-400 hover:text-indigo-300"
        >
          <Eye className="w-3.5 h-3.5" />
          Zobraziť sprievodcu
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-5">
      {/* Header with Title and Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              Onboarding Checklist
            </span>
            <span className="text-xs font-semibold text-zinc-400">
              {completedCount} zo 4 krokov hotové ({percent} %)
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Nastavenie prevádzky {tenantName}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-950/40 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            {isCollapsed ? (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                Rozbaliť
              </>
            ) : (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                Zbaliť
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            title="Skryť sprievodcu"
            className="p-1.5 rounded-xl border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <EyeOff className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Track Bar */}
      <div className="space-y-1.5">
        <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        {isAllComplete && (
          <p className="text-xs text-emerald-400 font-medium flex items-center gap-1.5 pt-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Všetky základné kroky sú dokončené! Vaša prevádzka je 100 % pripravená na prijímanie rezervácií.
          </p>
        )}
      </div>

      {/* Checklist items grid */}
      {!isCollapsed && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          {/* STEP 1: SERVICES */}
          <div
            className={`rounded-xl border p-4 transition-all ${
              step1Done
                ? 'border-emerald-500/20 bg-emerald-500/5'
                : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 rounded-lg p-2 ${
                    step1Done
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  <Scissors className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Krok 1
                    </span>
                    {step1Done && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                        Splnené ({servicesCount})
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-white">
                    Pridanie služieb
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Definujte aspoň jednu službu s trvaním a cenou.
                  </p>
                </div>
              </div>

              {step1Done ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-zinc-600 shrink-0" />
              )}
            </div>

            <div className="mt-3.5 pt-3 border-t border-zinc-800/60 flex items-center gap-2">
              <Link
                href={`/${tenantSlug}/admin/services/new`}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
              >
                Pridať novú službu
              </Link>
              <button
                type="button"
                onClick={() => onNavigateTab('services')}
                className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 text-zinc-300 text-xs font-medium hover:bg-zinc-700 transition-colors"
              >
                Prehľad služieb
              </button>
            </div>
          </div>

          {/* STEP 2: STAFF & WORKING HOURS */}
          <div
            className={`rounded-xl border p-4 transition-all ${
              step2Done
                ? 'border-emerald-500/20 bg-emerald-500/5'
                : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 rounded-lg p-2 ${
                    step2Done
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  <Users className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Krok 2
                    </span>
                    {step2Done && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                        Splnené
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-white">
                    Personál a pracovný čas
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Nastavte pracovný rozvrh a buffer časy personálu.
                  </p>
                </div>
              </div>

              {step2Done ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-zinc-600 shrink-0" />
              )}
            </div>

            <div className="mt-3.5 pt-3 border-t border-zinc-800/60 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigateTab('staff')}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
              >
                Nastaviť personál
              </button>
            </div>
          </div>

          {/* STEP 3: BRANDING */}
          <div
            className={`rounded-xl border p-4 transition-all ${
              step3Done
                ? 'border-emerald-500/20 bg-emerald-500/5'
                : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 rounded-lg p-2 ${
                    step3Done
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  <Palette className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Krok 3
                    </span>
                    {step3Done && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                        Splnené
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-white">
                    Branding a logo
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Zvoľte logo a firemnú farbu pre rezervačný formulár.
                  </p>
                </div>
              </div>

              {step3Done ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-zinc-600 shrink-0" />
              )}
            </div>

            <div className="mt-3.5 pt-3 border-t border-zinc-800/60 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigateTab('branding')}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
              >
                Upraviť branding
              </button>
            </div>
          </div>

          {/* STEP 4: PUBLISH & TEST LINK */}
          <div
            className={`rounded-xl border p-4 transition-all ${
              step4Done
                ? 'border-emerald-500/20 bg-emerald-500/5'
                : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 rounded-lg p-2 ${
                    step4Done
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  <ExternalLink className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Krok 4
                    </span>
                    {step4Done && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                        Pripravené
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-white">
                    Test a zverejnenie odkazu
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Otestujte si rezerváciu a zdieľajte link so zákazníkmi.
                  </p>
                </div>
              </div>

              {step4Done ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-zinc-600 shrink-0" />
              )}
            </div>

            <div className="mt-3.5 pt-3 border-t border-zinc-800/60 flex flex-wrap items-center gap-2">
              <a
                href={`/${tenantSlug}/book`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
              >
                Otvoriť /book
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 text-zinc-300 text-xs font-medium hover:bg-zinc-700 transition-colors"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Skopírované!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Kopírovať odkaz
                  </>
                )}
              </button>

              {!step4Done && (
                <button
                  type="button"
                  onClick={handleMarkTested}
                  className="px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  Označiť ako otestované
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
