import Link from 'next/link';

export function AiWhiteLabelHighlight() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      {/* Background accents */}
      <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-indigo-500/10 blur-[130px] rounded-full" />
      <div className="pointer-events-none absolute left-0 bottom-0 w-[400px] h-[250px] bg-emerald-500/10 blur-[120px] rounded-full" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16 relative">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            Unikátna konkurenčná výhoda
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Technológia, ktorá povýši vašu značku nad konkurenciu
          </h2>
          <p className="text-zinc-400 text-base sm:text-lg leading-relaxed">
            Spojenie nekompromisného white-label dizajnu a inteligentného AI asistenta poháňaného modelom Mistral AI.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Card 1: 100% White-Label Identity */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-8 sm:p-10 flex flex-col justify-between space-y-8 hover:border-zinc-700 transition-colors">
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
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
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Zákazník neprichádza do cudzích aplikácií. Rezervuje priamo vo vašom prostredí,
                  kde vidí iba vašu identitu, logo a paletu farieb.
                </p>
              </div>

              <div className="space-y-3 text-xs text-zinc-300">
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

            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 font-mono text-xs text-zinc-400 flex items-center justify-between">
              <span>URL: https://vas-salon.sk/book</span>
              <span className="text-emerald-400 font-sans text-[11px] font-semibold">Vlastná doména</span>
            </div>
          </div>

          {/* Card 2: Mistral AI Booking Assistant */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-8 sm:p-10 flex flex-col justify-between space-y-8 hover:border-zinc-700 transition-colors">
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
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
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Inteligentný chat asistent v klientskom bookingu, ktorý rozumie kontextu vašich služieb.
                  Pomôže klientovi vybrať správne ošetrenie a odpovie na časté otázky 24/7.
                </p>
              </div>

              <div className="space-y-3 text-xs text-zinc-300">
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

            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 text-xs space-y-2">
              <div className="text-[11px] text-zinc-400 flex items-center justify-between">
                <span>Klient: „Hľadám regeneráciu vlasov pred svadbou, čo odporúčate?“</span>
              </div>
              <div className="text-[11px] text-indigo-300 bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">
                <span>🤖 AI Asistent: „Odporúčam Hĺbkovú keratínovú kúru (60 min) u stylistky Lucie. Mám voľný termín v piatok o 14:00.“</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center pt-4">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-zinc-950 bg-white hover:bg-zinc-100 transition-colors shadow-md"
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
