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
    <section className="relative border-y border-white/[0.08] bg-black/20 py-12 md:py-16">
      <div className="premium-container space-y-12">
        {/* Brand strip */}
        <div className="text-center space-y-4">
          <p className="premium-eyebrow text-xs tracking-widest text-white/50 font-semibold">
            Dôverujú nám prémiové prevádzky a nezávislí špecialisti
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 opacity-60">
            {brands.map((brand) => (
              <span
                key={brand}
                className="text-sm md:text-base font-bold tracking-widest text-white/60 font-mono hover:text-white transition-colors"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>

        {/* 3 Core Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-white/[0.08]">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="premium-card p-6 md:p-8 text-center md:text-left space-y-2 hover:border-white/20 transition-colors"
            >
              <div className="premium-stat-value text-3xl sm:text-4xl font-extrabold text-white">
                {metric.value}
              </div>
              <div className="text-sm font-semibold text-white/90">{metric.label}</div>
              <p className="text-xs text-white/60 leading-relaxed">{metric.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
