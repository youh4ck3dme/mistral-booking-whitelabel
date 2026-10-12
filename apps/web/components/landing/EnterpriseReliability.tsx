export function EnterpriseReliability() {
  const pillars = [
    {
      title: 'Transakčný Outbox Pattern',
      badge: '100% DORUČENIE',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      description:
        'Notifikácie a potvrdzujúce e-maily sa zapisujú do databázy v tej istej transakcii ako rezervácia. Aj pri výpadku externej e-mailovej brány sa žiadna správa nestratí a po obnove sa automaticky doručí.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
      metric: 'Garancia doručenia notifikácií',
    },
    {
      title: 'Prísna RLS Multi-Tenant Izolácia',
      badge: 'POSTGRESQL KERNEL',
      badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      description:
        'Každý tenant má svoje dáta striktne izolované priamo na úrovni databázového jadra pomocou Row Level Security (RLS). Únik dát medzi prevádzkami je vďaka kryptografickému oddeleniu vylúčený.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
      metric: 'Zero-Leakage Architecture',
    },
    {
      title: 'GDPR & SHA-256 Klientske Tokeny',
      badge: 'CRYPTO HARDENED',
      badgeColor: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
      description:
        'Žiadne ukladanie citlivých prihlasovacích údajov v databáze. Odkazy na samoobslužnú správu rezervácie sú hašované algoritmom SHA-256 a osobné údaje sú chránené podľa prísnych štandardov GDPR.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
      metric: 'Plná zhoda s GDPR & VOP',
    },
    {
      title: 'Matematická Prevencia Kolízií',
      badge: 'EXCLUDE CONSTRAINTS',
      badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      description:
        'Namiesto neistých aplikačných kontrol rieši dostupnosť časových intervalov a personálu priamo PostgreSQL GiST index. Dva prekrývajúce sa sloty nemôžu byť do databázy zapísané ani pri stotisícovom návale.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      metric: '0 % riziko double-bookingu',
    },
  ];

  return (
    <section id="reliability" className="py-20 md:py-28 relative bg-zinc-950/90 border-t border-zinc-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-700 bg-zinc-900 text-zinc-300 text-xs font-semibold uppercase tracking-wider">
            Inžiniering & Spoľahlivosť
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Postavené pre prevádzky, kde výpadok znamená stratu zákazníka
          </h2>
          <p className="text-zinc-400 text-base sm:text-lg leading-relaxed">
            Vyvinuté s dôrazom na bezpečnosť finančného sektora. Žiadne provizórne WordPress pluginy,
            ale robustný cloudový backend pripravený na škálovanie.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-7 sm:p-8 space-y-6 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-200">
                  {pillar.icon}
                </div>
                <span
                  className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border ${pillar.badgeColor}`}
                >
                  {pillar.badge}
                </span>
              </div>

              <div className="space-y-2.5">
                <h3 className="text-xl font-bold text-white">{pillar.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{pillar.description}</p>
              </div>

              <div className="pt-3 border-t border-zinc-800/80 flex items-center gap-2 text-xs font-semibold text-zinc-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{pillar.metric}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Technical Stack Architecture Footnote */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-zinc-400">
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              <strong className="text-zinc-200">Moderný technologický stack:</strong> Next.js 14 App Router,
              PostgreSQL 15 s GiST indexmi, Supabase Auth (SSR safe s `auth.getUser()`) a Vercel Edge Network.
            </span>
          </div>
          <div className="font-mono text-zinc-500 whitespace-nowrap">
            Latency &lt; 90ms • 99.99% SLA
          </div>
        </div>
      </div>
    </section>
  );
}
