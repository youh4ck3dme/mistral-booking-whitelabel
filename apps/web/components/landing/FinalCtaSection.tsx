import Link from 'next/link';

export function FinalCtaSection() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      <div className="premium-container relative">
        <div className="premium-card p-8 sm:p-14 lg:p-16 text-center space-y-8 shadow-2xl backdrop-blur-2xl">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/[0.03]">
            <span className="premium-eyebrow">Vyskúšajte bez rizika na 14 dní</span>
          </div>

          {/* Heading */}
          <div className="max-w-3xl mx-auto space-y-4">
            <h2 className="premium-section-title text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
              Pripravení posunúť vaše podnikanie na{' '}
              <span className="premium-title-gradient">
                profesionálnu white-label úroveň
              </span>
              ?
            </h2>
            <p className="premium-lead max-w-2xl mx-auto">
              Získajte plnú kontrolu nad svojou značkou, personálom a tržbami. Nastavenie trvá menej než
              15 minút a nevyžaduje žiadnu kreditnú kartu.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/signup"
              className="w-full sm:w-auto premium-button text-base px-8 py-4"
            >
              Vytvoriť bezplatný účet
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>

            <a
              href="#pricing"
              className="w-full sm:w-auto premium-button-secondary text-base px-8 py-4"
            >
              Prezrieť cenník balíkov
            </a>
          </div>

          {/* Guarantees / Trust Badges */}
          <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-center gap-y-3 gap-x-8 text-xs text-white/50 font-mono">
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
