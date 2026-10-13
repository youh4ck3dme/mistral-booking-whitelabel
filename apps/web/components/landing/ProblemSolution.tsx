export function ProblemSolution() {
  const comparisons = [
    {
      title: 'Vlastníctvo klienta & Značka',
      badLabel: 'Starý spôsob (Marketplace)',
      badText:
        'Marketplace platformy vás zaradia do spoločného katalógu, odporúčajú vašim klientom lacnejšiu konkurenciu a účtujú províziu z každej jednej rezervácie.',
      goodLabel: 'NEXIFY riešenie (100% White-Label)',
      goodText:
        'Váš vlastný odkaz, vaše farby a logo. Klient nikdy nevidí cudzí systém a patrí výhradne vám. Žiadne provízie z vašich tržieb.',
    },
    {
      title: 'Spoľahlivosť & Prevencia kolízií',
      badLabel: 'Starý spôsob (Zastarané pluginy)',
      badText:
        'Bežné pluginy a lacné systémy padajú pri náhlych nápore a dovoľujú dvom klientom rezervovať rovnaký slot v ten istý moment.',
      goodLabel: 'NEXIFY riešenie (Databázové zámky)',
      goodText:
        'Architektúra s PostgreSQL EXCLUDE obmedzeniami a guardom personálu robí double-booking matematicky a fyzicky nemožným.',
    },
    {
      title: 'Denná administratíva & Zmeny termínov',
      badLabel: 'Starý spôsob (Telefonáty na recepciu)',
      badText:
        'Klienti neustále volajú kvôli zmene termínu alebo zabudnutým heslám, čo vyrušuje personál pri práci a vytvára zbytočný stres.',
      goodLabel: 'NEXIFY riešenie (Samoobslužný odkaz)',
      goodText:
        'Zákazník dostane v potvrdzujúcom e-maile bezpečný link na správu. Zmenu alebo storno vykoná na 2 kliknutia bez nutnosti registrácie.',
    },
  ];

  return (
    <section className="py-20 md:py-28 relative">
      <div className="premium-container space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/[0.03]">
            <span className="premium-eyebrow">Zmena paradigmy</span>
          </div>
          <h2 className="premium-section-title text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Prečo bežné nástroje brzdia rast vašej prevádzky?
          </h2>
          <p className="premium-lead max-w-2xl mx-auto">
            Porovnanie starého spôsobu s modernou architektúrou, ktorá stavia na prvé miesto
            dôveryhodnosť vašej značky a pokoj personálu.
          </p>
        </div>

        {/* 3 Comparison Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {comparisons.map((item, idx) => (
            <div
              key={item.title}
              className="premium-card p-6 sm:p-8 flex flex-col justify-between space-y-6 hover:border-white/20 transition-colors"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono text-white/50 uppercase tracking-wider">
                  <span>0{idx + 1}</span>
                  <span>/</span>
                  <span className="text-white font-sans font-semibold">{item.title}</span>
                </div>

                {/* The Bad Way */}
                <div className="p-4 rounded-2xl border border-red-500/20 bg-red-500/[0.04] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-red-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {item.badLabel}
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">{item.badText}</p>
                </div>

                {/* The Good Way (NEXIFY) */}
                <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {item.goodLabel}
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed">{item.goodText}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
