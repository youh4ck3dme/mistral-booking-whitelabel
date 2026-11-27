'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Check,
  Percent,
  ArrowRight,
  Calculator,
} from 'lucide-react';

export function PricingWithRoiCalculator() {
  // Monthly turnover slider: 2,000 € to 25,000 €, default 8,000 €
  const [turnover, setTurnover] = useState<number>(8000);

  // Commission calculations: marketplace takes ~15% (between 10% and 20%)
  const MARKETPLACE_RATE = 0.15;
  const marketplaceMonthlyFee = Math.round(turnover * MARKETPLACE_RATE);
  const marketplaceAnnualFee = marketplaceMonthlyFee * 12;

  const plans = [
    {
      id: 'starter',
      name: 'Solo / Štartér',
      badge: null,
      description: 'Pre samostatných špecialistov a štúdiá s jedným pracoviskom.',
      features: [
        '1 pracovník / kalendár',
        'Rezervácie pre jedno pracovisko',
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
      features: [
        'Až 5 pracovníkov s vlastnými rozvrhmi',
        'Neobmedzený počet rezervácií',
        'Mistral AI inteligentný asistent',
        'Vlastná subdoména & branding farby',
        'E-mailové pripomienky z outboxu',
        'Denný prehľad tržieb & No-show tracking',
        'Ochrana Active Staff Guard & buffery',
        '0 % provízia z tržieb',
      ],
      ctaText: 'Začať s balíkom Pro',
      ctaHref: '/signup?plan=pro',
      highlighted: true,
    },
    {
      id: 'enterprise',
      name: 'Multi-pobočka',
      badge: 'PRE SIETE A KLINIKY',
      description: 'Pre prevádzky s viacerými pobočkami, estetické kliniky a franšízy.',
      features: [
        'Neobmedzený počet pracovníkov & pobočiek',
        'Vlastná doména (napr. rezervacie.vasafirma.sk)',
        'Onboarding pri nasadení',
        'Podpora pri nasadení',
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
            Spočítajte si, koľko peňazí odovzdáte cudzím rezervačným portálom. Cena NEXIFY je
            na vyžiadanie — neúčtujeme províziu z tržieb.
          </p>
          <p className="text-xs text-white/45 max-w-2xl mx-auto">
            Ilustračný príklad, nie meranie konkrétnej konkurencie. Kalkulačka predvolene
            počíta s typickou marketplace províziou 15&nbsp;% (bežne sa uvádza približne
            10&nbsp;% až 25&nbsp;%; overte si ju u svojho poskytovateľa). Neodpočítava cenu
            predplatného NEXIFY, tá je na vyžiadanie.
          </p>
        </div>

        {/* ========================================================= */}
        {/* MARKETPLACE COMMISSION CALCULATOR                         */}
        {/* ========================================================= */}
        <div className="premium-card p-6 sm:p-10 lg:p-12 relative overflow-hidden">
          <div className="relative space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Kalkulačka marketplace provízie</h3>
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

            {/* Comparison Metrics Grid — no NEXIFY plan price, no savings that subtract it */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
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

              <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.03] space-y-2">
                <div className="text-xs font-semibold text-white/80 flex items-center justify-between">
                  <span>NEXIFY (0 % provízia)</span>
                  <span className="text-[10px] uppercase font-mono text-emerald-400">Fixné</span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white">
                  Cena na vyžiadanie
                </div>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  Fixné predplatné bez provízie z klientov. Cenu vám pripravíme na mieru — kalkulačka
                  ju do úspory nezarátava.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* PRICING PLANS                                             */}
        {/* ========================================================= */}
        <div className="space-y-10 pt-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {plans.map((plan) => (
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

                    <div className="pt-2 pb-4 border-b border-white/10">
                      <div className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                        Cena na vyžiadanie
                      </div>
                      <div className="text-xs text-white/40 mt-1">
                        Fixné predplatné, bez provízie z tržieb. Cenu vám pripravíme na mieru.
                      </div>
                    </div>

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
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
