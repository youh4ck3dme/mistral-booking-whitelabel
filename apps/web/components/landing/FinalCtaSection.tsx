import Link from 'next/link';

export function FinalCtaSection() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      {/* Background radial gradient glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="w-[700px] h-[350px] bg-indigo-500/15 blur-[140px] rounded-full" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <div className="rounded-3xl border border-zinc-700/80 bg-gradient-to-b from-zinc-900/90 via-zinc-900/60 to-zinc-950 p-8 sm:p-14 lg:p-16 text-center space-y-8 shadow-2xl backdrop-blur-2xl">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Vyskúšajte bez rizika na 14 dní
          </div>

          {/* Heading */}
          <div className="max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
              Pripravení posunúť vaše podnikanie na{' '}
              <span className="bg-gradient-to-r from-indigo-300 via-sky-200 to-emerald-300 bg-clip-text text-transparent">
                profesionálnu white-label úroveň
              </span>
              ?
            </h2>
            <p className="text-base sm:text-lg text-zinc-300 leading-relaxed max-w-2xl mx-auto">
              Získajte plnú kontrolu nad svojou značkou, personálom a tržbami. Nastavenie trvá menej než
              15 minút a nevyžaduje žiadnu kreditnú kartu.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-xl text-base font-bold text-zinc-950 bg-gradient-to-r from-indigo-300 via-sky-200 to-emerald-300 hover:opacity-90 transition-opacity shadow-xl shadow-indigo-500/20"
            >
              Vytvoriť bezplatný účet
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>

            <a
              href="#pricing"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-xl text-base font-semibold text-zinc-200 bg-zinc-800/80 border border-zinc-700/80 hover:bg-zinc-700 transition-colors"
            >
              Prezrieť cenník balíkov
            </a>
          </div>

          {/* Guarantees / Trust Badges */}
          <div className="pt-6 border-t border-zinc-800/80 flex flex-wrap items-center justify-center gap-y-3 gap-x-8 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>14-dňový skúšobný prístup zadarmo</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Nevyžaduje sa platobná karta</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Okamžitá migrácia údajov a podpora</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
