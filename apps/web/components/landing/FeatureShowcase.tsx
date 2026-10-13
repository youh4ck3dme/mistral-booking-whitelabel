'use client';

import { useState } from 'react';

export function FeatureShowcase() {
  const [activeTab, setActiveTab] = useState<'schedule' | 'selfservice' | 'overview'>('schedule');

  const tabs = [
    {
      id: 'schedule' as const,
      title: 'Personál & Buffery',
      subtitle: 'Precízny rozvrh bez prestojov',
    },
    {
      id: 'selfservice' as const,
      title: 'Samoobslužný link',
      subtitle: 'Bez hesiel a zbytočných telefonátov',
    },
    {
      id: 'overview' as const,
      title: 'Denný prehľad & Dochádzka',
      subtitle: 'Okamžitý sumár dňa na 1 klik',
    },
  ];

  return (
    <section id="features" className="py-20 md:py-28 relative border-t border-white/[0.08]">
      <div className="premium-container space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/[0.03]">
            <span className="premium-eyebrow">Kľúčové piliere platformy</span>
          </div>
          <h2 className="premium-section-title text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Všetko, čo prevádzka potrebuje na bezchybný chod
          </h2>
          <p className="premium-lead max-w-2xl mx-auto">
            Namiesto zložitých a neprehľadných nastavení sme sa zamerali na to, čo personál reálne využíva každý deň.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`text-left px-5 py-3.5 rounded-2xl border transition-all ${
                  isActive
                    ? 'border-white/30 bg-white/10 text-white shadow-lg shadow-white/5 ring-1 ring-white/20'
                    : 'border-white/[0.08] bg-white/[0.02] text-white/60 hover:text-white hover:border-white/20'
                }`}
              >
                <div className="text-sm font-semibold">{tab.title}</div>
                <div className="text-xs text-white/40 font-normal">{tab.subtitle}</div>
              </button>
            );
          })}
        </div>

        {/* Tab Content Display */}
        <div className="premium-card p-6 sm:p-10 backdrop-blur-2xl">
          {activeTab === 'schedule' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-5">
                <span className="text-xs font-mono font-semibold text-emerald-400 uppercase tracking-widest">
                  PILIER 01 • ROZVRH A PERSONÁL
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-white leading-snug">
                  Inteligentná dostupnosť a automatické buffer časy
                </h3>
                <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                  Každý pracovník má vlastný pracovný čas, pauzy na obed a priradené služby.
                  Medzi rezervácie systém automaticky vkladá 10-minútový buffer time na upratanie
                  a prípravu, takže nikto nemešká.
                </p>
                <ul className="space-y-2.5 text-xs sm:text-sm text-zinc-300">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span> Ochrana pred rezerváciou u neaktívneho pracovníka (Active Staff Guard)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span> Voľba „Ktokoľvek voľný“ pre klientov hľadajúcich najbližší slot
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span> Automatické zohľadnenie letného/zimného času (DST) v časovej zóne tenanta
                  </li>
                </ul>
              </div>

              <div className="lg:col-span-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 space-y-4">
                <div className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                  Náhľad rozvrhu tímu
                </div>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="font-semibold text-white">Michal K. (Senior Barber)</span>
                    </div>
                    <span className="text-zinc-400">09:00 – 17:00 • 6 rezervácií</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="font-semibold text-white">Lucia M. (Stylistka)</span>
                    </div>
                    <span className="text-zinc-400">10:00 – 18:00 • 4 rezervácie</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] flex items-center justify-between">
                    <span>⚡ Buffer +10 min započítaný medzi termínmi</span>
                    <span className="font-semibold">Aktívne</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'selfservice' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-5">
                <span className="text-xs font-mono font-semibold text-sky-400 uppercase tracking-widest">
                  PILIER 02 • KLIENTSKÁ SAMOOBSLUHA
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-white leading-snug">
                  Zmena termínu a storno cez bezpečný osobný link
                </h3>
                <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                  Zákazník nepotrebuje heslo, ktoré by zabudol. V každom potvrdzujúcom e-maile nájde unikátny,
                  kryptograficky chránený odkaz na správu svojho termínu.
                </p>
                <ul className="space-y-2.5 text-xs sm:text-sm text-zinc-300">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span> Bezpečný SHA-256 hash token – surový token sa v databáze nikdy neukladá
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span> Okamžité atomické uvoľnenie kapacity pri storne pre ďalších záujemcov
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span> Automatické zrušenie pripomienok pri zrušení termínu
                  </li>
                </ul>
              </div>

              <div className="lg:col-span-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 space-y-4">
                <div className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                  Náhľad klientskeho e-mailu & odkazu
                </div>
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-3 text-xs">
                  <div className="text-zinc-300 font-semibold">Potvrdenie rezervácie: Pánsky strih</div>
                  <div className="text-zinc-400">Termín: Piatok, 24. októbra o 14:30</div>
                  <div className="pt-2">
                    <div className="inline-block py-2 px-4 rounded-lg bg-indigo-500 text-white font-semibold text-xs shadow-md">
                      Spravovať rezerváciu (zmena / storno)
                    </div>
                  </div>
                  <div className="text-[11px] text-zinc-500 pt-1">
                    🔒 Odkaz je osobný a jednorazový. Presmeruje priamo do zabezpečeného portálu.
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-5">
                <span className="text-xs font-mono font-semibold text-indigo-400 uppercase tracking-widest">
                  PILIER 03 • DENNÁ OPERATÍVA
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-white leading-snug">
                  Dnešný prehľad, rýchle výsledky a evidencia tržieb
                </h3>
                <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                  Žiadne zložité tabuľky. Personál na jedno kliknutie označí stav po ukončení služby
                  alebo eviduje neúčasť (No-show), čím chráni históriu prevádzky.
                </p>
                <ul className="space-y-2.5 text-xs sm:text-sm text-zinc-300">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span> Tlačidlá Dokončené a Nedostavil sa priamo v dennom rozvrhu
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span> Skutočné tržby z dokončených služieb v reálnom čase (žiadne odhady)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span> Bezpečný CSV export rezervácií pre účtovníka na jedno kliknutie
                  </li>
                </ul>
              </div>

              <div className="lg:col-span-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 space-y-4">
                <div className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                  Náhľad denného dashboardu
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                    <div className="text-zinc-400 text-[11px]">Dnešné tržby</div>
                    <div className="text-xl font-bold text-emerald-400 mt-1">385 €</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">z 11 dokončených</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                    <div className="text-zinc-400 text-[11px]">No-show kontrola</div>
                    <div className="text-xl font-bold text-indigo-400 mt-1">1 termín</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">klient Peter M.</div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs">
                  <span className="text-zinc-300">15:30 • Konzultácia (Jana K.)</span>
                  <div className="flex gap-1.5">
                    <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold">
                      ✓ Dokončené
                    </span>
                    <span className="px-2 py-1 rounded bg-red-500/20 text-red-300 text-[10px] font-semibold">
                      ✕ No-show
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
