import Link from 'next/link';
import { HeroLiveSimulator } from './HeroLiveSimulator';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28">
      <div className="premium-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Copy & Actions */}
          <div className="lg:col-span-6 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-md">
              <span className="premium-eyebrow">Prémiová white-label platforma</span>
            </div>

            <h1 className="premium-title text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08]">
              Rezervačný systém, ktorý chráni vašu značku a{' '}
              <span className="premium-title-gradient">
                nikdy nevytvorí dvojitú rezerváciu
              </span>
              .
            </h1>

            <p className="premium-lead max-w-2xl mx-auto lg:mx-0">
              Kompletné white-label riešenie pre prémiové salóny, kliniky a štúdiá.
              Inteligentný AI asistent, personálny manažment s buffer časmi a garantované
              transakčné doručenie notifikácií. Zvýšte vyťaženosť bez provízií pre tretie strany.
            </p>

            {/* CTAs & Trust microcopy */}
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  href="/signup"
                  className="w-full sm:w-auto premium-button text-sm"
                >
                  Vyskúšať na 14 dní zadarmo
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>

                <a
                  href="#pricing"
                  className="w-full sm:w-auto premium-button-secondary text-sm"
                >
                  Zobraziť cenník a balíky
                </a>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-xs text-white/50 font-mono">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Bez kreditnej karty
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
