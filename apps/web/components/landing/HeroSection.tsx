import Link from 'next/link';
import { HeroLiveSimulator } from './HeroLiveSimulator';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-24 pb-20 md:pt-32 md:pb-28">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-500/10 blur-[120px] rounded-full" />
      <div className="pointer-events-none absolute top-1/3 left-1/4 -translate-x-1/2 w-[350px] h-[250px] bg-emerald-500/10 blur-[100px] rounded-full" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Copy & Actions */}
          <div className="lg:col-span-6 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Prémiová white-label platforma
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
              Rezervačný systém, ktorý chráni vašu značku a{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
                nikdy nevytvorí dvojitú rezerváciu
              </span>
              .
            </h1>

            <p className="max-w-2xl mx-auto lg:mx-0 text-base sm:text-lg text-zinc-300 leading-relaxed">
              Kompletné white-label riešenie pre prémiové salóny, kliniky a štúdiá.
              Inteligentný AI asistent, personálny manažment s buffer časmi a garantované
              transakčné doručenie notifikácií. Zvýšte vyťaženosť bez provízií pre tretie strany.
            </p>

            {/* CTAs & Trust microcopy */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  href="/signup"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-xl font-semibold text-sm text-zinc-950 bg-gradient-to-r from-indigo-300 via-sky-200 to-emerald-300 hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/20"
                >
                  Vyskúšať na 14 dní zadarmo
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>

                <a
                  href="#pricing"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-xl font-semibold text-sm text-zinc-200 bg-zinc-900/80 border border-zinc-700/80 hover:bg-zinc-800 transition-colors"
                >
                  Zobraziť cenník a balíky
                </a>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-xs text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Bez nutnosti kreditnej karty
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Spustenie do 15 minút
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  0 % provízia z tržieb
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Hero Live Simulator */}
          <div className="lg:col-span-6 xl:col-span-6 relative w-full">
            <HeroLiveSimulator />
          </div>
        </div>
      </div>
    </section>
  );
}
