import Link from 'next/link';

export function AiWhiteLabelHighlight() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      <div className="premium-container space-y-16 relative">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/[0.03]">
            <span className="premium-eyebrow">Unikátna konkurenčná výhoda</span>
          </div>
          <h2 className="premium-section-title text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Technológia, ktorá povýši vašu značku nad konkurenciu
          </h2>
          <p className="premium-lead max-w-2xl mx-auto">
            Spojenie nekompromisného white-label dizajnu a inteligentného AI asistenta poháňaného modelom Mistral AI.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Card 1: 100% White-Label Identity */}
          <div className="premium-card p-8 sm:p-10 flex flex-col justify-between space-y-8 hover:border-white/20 transition-colors">
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 21a4 44 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                  />
                </svg>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">100% White-Label zážitok</h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  Zákazník neprichádza do cudzích aplikácií. Rezervuje priamo vo vašom prostredí,
                  kde vidí iba vašu identitu, logo a paletu farieb.
                </p>
              </div>

              <div className="space-y-3 text-xs text-white/80">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Vlastná subdoména alebo slug (napr. app.nexify.sk/vas-salon/book)
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Úprava primárnej farby a faviconu v reálnom čase
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Plná kontrola nad klientskou databázou (žiadny únik kontaktov)
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-white/10 bg-black/40 font-mono text-xs text-white/60 flex items-center justify-between">
              <span>URL: https://vas-salon.sk/book</span>
              <span className="text-emerald-400 font-sans text-[11px] font-semibold">Vlastná doména</span>
            </div>
          </div>

          {/* Card 2: Mistral AI Booking Assistant */}
          <div className="premium-card p-8 sm:p-10 flex flex-col justify-between space-y-8 hover:border-white/20 transition-colors">
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">Mistral AI rezervačný asistent</h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  Inteligentný chat asistent v klientskom bookingu, ktorý rozumie kontextu vašich služieb.
                  Pomôže klientovi vybrať správne ošetrenie a odpovie na časté otázky 24/7.
                </p>
              </div>

              <div className="space-y-3 text-xs text-white/80">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Zabezpečený route `/api/chat` so Zod validáciou a clampingom
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Generovanie personalizovaných textov e-mailových pripomienok
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Smart upsell doplnkových služieb priamo počas konverzácie
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-white/10 bg-black/40 text-xs space-y-2">
              <div className="text-[11px] text-white/60 flex items-center justify-between">
                <span>Klient: „Hľadám regeneráciu vlasov pred svadbou, čo odporúčate?“</span>
              </div>
              <div className="text-[11px] text-indigo-200 bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/20">
                <span>🤖 AI Asistent: „Odporúčam Hĺbkovú keratínovú kúru (60 min) u stylistky Lucie. Mám voľný termín v piatok o 14:00.“</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center pt-4">
          <Link
            href="/signup"
            className="premium-button text-sm"
          >
            Aktivovať vlastnú značku a AI asistenta
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
