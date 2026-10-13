'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Check,
  Zap,
  Sparkles,
  ShieldCheck,
  Percent,
  ArrowRight,
  Calculator,
} from 'lucide-react';

export function PricingWithRoiCalculator() {
  // Monthly turnover slider: 2,000 € to 25,000 €, default 8,000 €
  const [turnover, setTurnover] = useState<number>(8000);
  const [isAnnual, setIsAnnual] = useState<boolean>(true);

  // Commission calculations: marketplace takes ~15% (between 10% and 20%)
  const MARKETPLACE_RATE = 0.15;
  const marketplaceMonthlyFee = Math.round(turnover * MARKETPLACE_RATE);
  const marketplaceAnnualFee = marketplaceMonthlyFee * 12;

  // NEXIFY Pro tier is the standard SaaS cost (55 €/month annual or 69 €/month monthly)
  const nexifyMonthlyCost = isAnnual ? 55 : 69;
  const nexifyAnnualCost = nexifyMonthlyCost * 12;

  // Annual savings kept by the salon owner
  const annualSavings = Math.max(0, marketplaceAnnualFee - nexifyAnnualCost);

  const plans = [
    {
      id: 'starter',
      name: 'Solo / Štartér',
      badge: null,
      description: 'Pre samostatných špecialistov a štúdiá s jedným pracoviskom.',
      monthlyPrice: 29,
      annualPrice: 24,
      features: [
        '1 pracovník / kalendár',
        'Až 300 rezervácií mesačne',
        'White-label klientsky odkaz',
        'E-mailové notifikácie z outboxu',
        'Samoobslužná správa termínu klienta',
        '0 % provízia z tržieb',
      ],
      ctaText: 'Začať so Štartérom',
      ctaHref: '/signup?plan=starter',
      highlighted: false,
    },
    {
      id: 'pro',
      name: 'Pro / Salón',
      badge: 'NAJPOPULÁRNEJŠIE',
      description: 'Pre rastúce salóny, kliniky a štúdiá s tímom profesionálov.',
      monthlyPrice: 69,
      annualPrice: 55,
      features: [
        'Až 5 pracovníkov s vlastnými rozvrhmi',
        'Neobmedzený počet rezervácií',
        'Mistral AI inteligentný asistent',
        'Vlastná subdoména & branding farby',
        'SMS & transakčné pripomienky',
        'Denný prehľad tržieb & No-show tracking',
        'Ochrana Active Staff Guard & buffery',
        '0 % provízia z tržieb',
      ],
      ctaText: 'Vyskúšať Pro na 14 dní zadarmo',
      ctaHref: '/signup?plan=pro',
      highlighted: true,
    },
    {
      id: 'enterprise',
      name: 'Multi-pobočka',
      badge: 'PRE SIETE A KLINIKY',
      description: 'Pre prevádzky s viacerými pobočkami, estetické kliniky a franšízy.',
      monthlyPrice: 149,
      annualPrice: 119,
      features: [
        'Neobmedzený počet pracovníkov & pobočiek',
        'Vlastná doména (napr. rezervacie.vasafirma.sk)',
        'Dedikovaný account manažér & onboarding',
        'Prioritná SLA podpora 24/7',
        'Webhooky & vlastné API integrácie',
        '0 % provízia z tržieb',
      ],
      ctaText: 'Kontaktovať k Multi-pobočke',
      ctaHref: '/signup?plan=enterprise',
      highlighted: false,
    },
  ];

  return (
    <section id="pricing" className="py-20 md:py-28 relative">
      <div className="premium-container space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/[0.03]">
            <Percent className="w-3.5 h-3.5 text-white/70" />
            <span className="premium-eyebrow">The Commission Killer</span>
          </div>
          <h2 className="premium-section-title text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Prečo platiť marketplace provízie, keď tržby patria vám?
          </h2>
          <p className="premium-lead max-w-2xl mx-auto">
            Spočítajte si, koľko peňazí odovzdáte cudzím rezervačným portálom a koľko ušetríte
            s fixným modelom NEXIFY.
          </p>
        </div>

        {/* ========================================================= */}
        {/* ROI CALCULATOR CARD (THE COMMISSION KILLER)               */}
        {/* ========================================================= */}
        <div className="premium-card p-6 sm:p-10 lg:p-12 relative overflow-hidden">
          <div className="relative space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Interaktívna ROI kalkulačka</h3>
                  <p className="text-xs text-white/60">Nastavte priemerný mesačný obrat vašej prevádzky</p>
                </div>
              </div>
              <div className="flex items-baseline gap-2 bg-black/40 px-4 py-2 rounded-2xl border border-white/10">
                <span className="text-xs text-white/60 font-medium">Váš mesačný obrat:</span>
                <span className="text-2xl font-extrabold text-white font-mono">
                  {turnover.toLocaleString('sk-SK')} €
                </span>
              </div>
            </div>

            {/* Slider Control */}
            <div className="space-y-3">
              <div className="flex justify-between text-xs text-white/50 font-medium font-mono">
                <span>2 000 € / mes</span>
                <span>10 000 €</span>
                <span>18 000 €</span>
                <span>25 000 € / mes</span>
              </div>

              <input
                type="range"
                min={2000}
                max={25000}
                step={500}
                value={turnover}
                onChange={(e) => setTurnover(Number.parseInt(e.target.value, 10))}
                aria-label="Mesačný obrat prevádzky v eurách"
                aria-valuenow={turnover}
                aria-valuemin={2000}
                aria-valuemax={25000}
                aria-valuetext={`${turnover} eur mesačne`}
                className="w-full h-3 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>

            {/* Comparison Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {/* Box 1: Marketplace Cost */}
              <div className="p-5 rounded-2xl border border-red-500/20 bg-red-500/[0.04] space-y-2">
                <div className="text-xs font-semibold text-red-400 flex items-center justify-between">
                  <span>Marketplace (15 % provízia)</span>
                  <span className="text-[10px] uppercase font-mono">Straty</span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-red-300 font-mono">
                  -{marketplaceMonthlyFee.toLocaleString('sk-SK')} €
                  <span className="text-xs text-red-400/80 font-normal"> / mesiac</span>
                </div>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  Až <strong>{marketplaceAnnualFee.toLocaleString('sk-SK')} €</strong> ročne odovzdáte cudzím katalógom.
                </p>
              </div>

              {/* Box 2: NEXIFY Fix Cost */}
              <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.03] space-y-2">
                <div className="text-xs font-semibold text-white/80 flex items-center justify-between">
                  <span>NEXIFY (0 % provízia)</span>
                  <span className="text-[10px] uppercase font-mono text-emerald-400">Fixné</span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                  {nexifyMonthlyCost} €
                  <span className="text-xs text-white/50 font-normal"> / mesiac</span>
                </div>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  Fixné predplatné balíka Pro bez akýchkoľvek skrytých poplatkov z klientov.
                </p>
              </div>

              {/* Box 3: Total Annual Savings Highlight */}
              <div className="p-5 rounded-2xl border border-emerald-500/40 bg-emerald-500/[0.06] space-y-2">
                <div className="text-xs font-semibold text-emerald-400 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Čistá úspora majiteľa
                  </span>
                  <span className="text-[10px] uppercase font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                    Vo vašom vrecku
                  </span>
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono">
                  +{annualSavings.toLocaleString('sk-SK')} €
                  <span className="text-xs text-emerald-300/80 font-normal"> / rok</span>
                </div>
                <p className="text-[11px] text-white/80 leading-relaxed">
                  Peniaze, ktoré môžete investovať do vybavenia, personálu alebo rozvoja salónu.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* PRICING PLANS & BILLING TOGGLE                            */}
        {/* ========================================================= */}
        <div className="space-y-10 pt-8">
          {/* Billing Switcher (Monthly vs Annual) */}
          <div className="flex items-center justify-center gap-4">
            <span
              className={`text-sm font-medium transition-colors ${
                !isAnnual ? 'text-white font-semibold' : 'text-white/50'
              }`}
            >
              Mesačná platba
            </span>

            <button
              type="button"
              role="switch"
              aria-checked={isAnnual}
              aria-label="Prepnúť ročnú platbu so zľavou 20 percent"
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-white/10 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full shadow-md ring-0 transition duration-200 ease-in-out ${
                  isAnnual ? 'translate-x-7 bg-white' : 'translate-x-0 bg-white/40'
                }`}
              />
            </button>

            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-medium transition-colors ${
                  isAnnual ? 'text-white font-semibold' : 'text-white/50'
                }`}
              >
                Ročná platba
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-white border border-white/20 font-mono">
                -20 % (2 mesiace zadarmo)
              </span>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {plans.map((plan) => {
              const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;

              return (
                <div
                  key={plan.id}
                  className={`premium-card p-8 sm:p-10 flex flex-col justify-between transition-all relative ${
                    plan.highlighted
                      ? 'border-white/30 bg-white/[0.05] shadow-2xl ring-1 ring-white/20'
                      : 'hover:border-white/20'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="px-3.5 py-1 rounded-full text-[11px] font-extrabold tracking-wider uppercase bg-white text-black shadow-md font-mono">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                      <p className="text-xs text-white/60 mt-2 min-h-[32px] leading-relaxed">
                        {plan.description}
                      </p>
                    </div>

                    {/* Price display */}
                    <div className="pt-2 pb-4 border-b border-white/10">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl sm:text-5xl font-extrabold text-white font-mono">{price} €</span>
                        <span className="text-sm font-medium text-white/50">/ mesiac</span>
                      </div>
                      <div className="text-xs text-white/40 mt-1 font-mono">
                        {isAnnual ? 'Účtované ročne (ušetríte 2 mesiace)' : 'Účtované mesačne, bez viazanosti'}
                      </div>
                    </div>

                    {/* Features list */}
                    <div className="space-y-3">
                      <div className="text-xs font-semibold text-white/80 uppercase tracking-wider font-mono">
                        V cene balíka:
                      </div>
                      <ul className="space-y-2.5 text-xs sm:text-sm text-white/70">
                        {plan.features.map((feat) => (
                          <li key={feat} className="flex items-start gap-2.5">
                            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Card CTA */}
                  <div className="pt-8 mt-6 border-t border-white/10">
                    <Link
                      href={plan.ctaHref}
                      className={`w-full ${plan.highlighted ? 'premium-button' : 'premium-button-secondary'} text-sm`}
                    >
                      {plan.ctaText}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
