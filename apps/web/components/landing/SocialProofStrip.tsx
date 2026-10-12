export function SocialProofStrip() {
  const brands = [
    'ELITE CLINIC',
    'BARBER HOUSE',
    'STUDIO ATELIER',
    'DENTAL CARE',
    'GLOW SPA',
    'PULSE FITNESS',
  ];

  const metrics = [
    {
      value: '99.99 %',
      label: 'Spoľahlivosť bez výpadkov',
      description: 'Databázové zámky garantujú presne 0 kolízií a double-bookingov',
    },
    {
      value: '0 %',
      label: 'Provízie z vašich tržieb',
      description: 'Žiadne skryté poplatky z každého klienta ako pri marketplace systémoch',
    },
    {
      value: '< 30 s',
      label: 'Priemerný čas rezervácie',
      description: 'Beztrenicový klientsky flow bez nutnosti inštalácie aplikácie či hesiel',
    },
  ];

  return (
    <section className="relative border-y border-zinc-800 bg-zinc-950/60 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Brand strip */}
        <div className="text-center space-y-4">
          <p className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">
            Dôverujú nám prémiové prevádzky a nezávislí špecialisti
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 opacity-60">
            {brands.map((brand) => (
              <span
                key={brand}
                className="text-sm md:text-base font-bold tracking-widest text-zinc-400 font-mono hover:text-zinc-200 transition-colors"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>

        {/* 3 Core Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-zinc-800/80">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 text-center md:text-left space-y-2 hover:border-zinc-700 transition-colors"
            >
              <div className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-white via-zinc-200 to-indigo-300 bg-clip-text text-transparent">
                {metric.value}
              </div>
              <div className="text-sm font-semibold text-zinc-200">{metric.label}</div>
              <p className="text-xs text-zinc-400 leading-relaxed">{metric.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
