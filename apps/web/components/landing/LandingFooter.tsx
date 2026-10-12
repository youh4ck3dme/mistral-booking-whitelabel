import Link from 'next/link';

export function LandingFooter() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 text-zinc-400 text-xs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Col 1: Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-indigo-500 via-sky-400 to-emerald-400 p-[1px]">
                <div className="flex h-full w-full items-center justify-center rounded-[7px] bg-zinc-950 font-mono text-[10px] font-black text-white">
                  N
                </div>
              </div>
              <span className="font-extrabold tracking-tight text-white text-base">
                NEXIFY
              </span>
            </Link>

            <p className="text-zinc-500 leading-relaxed text-xs">
              Prémiová white-label rezervačná platforma pre salóny, kliniky a prevádzky.
              Plná ochrana vlastnej značky bez poplatkov za sprostredkovanie.
            </p>

            <div className="flex items-center gap-2 text-[11px] text-zinc-500">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Všetky systémy v prevádzke (99.99 % SLA)</span>
            </div>
          </div>

          {/* Col 2: Produkt & Piliere */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
              Produkt & Riešenie
            </div>
            <ul className="space-y-2">
              <li>
                <a href="#features" className="hover:text-zinc-200 transition-colors">
                  Rozvrh & Personál
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-zinc-200 transition-colors">
                  Samoobslužný link klienta
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-zinc-200 transition-colors">
                  Denný prehľad & No-show
                </a>
              </li>
              <li>
                <a href="#reliability" className="hover:text-zinc-200 transition-colors">
                  Transakčný Outbox
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-zinc-200 transition-colors">
                  Cenník a balíky
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Spoločnosť & Bezpečnosť */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
              Inžiniering & Dôvera
            </div>
            <ul className="space-y-2">
              <li>
                <a href="#reliability" className="hover:text-zinc-200 transition-colors">
                  PostgreSQL RLS izolácia
                </a>
              </li>
              <li>
                <a href="#reliability" className="hover:text-zinc-200 transition-colors">
                  Prevencia double-bookingu
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-zinc-200 transition-colors">
                  Časté otázky (FAQ)
                </a>
              </li>
              <li>
                <Link href="/login" className="hover:text-zinc-200 transition-colors">
                  Prihlásenie do administrácie
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-zinc-200 transition-colors">
                  Vytvorenie prevádzky
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Právne náležitosti */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
              Právne informácie
            </div>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="hover:text-zinc-200 transition-colors">
                  Obchodné podmienky (VOP)
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-zinc-200 transition-colors">
                  Ochrana osobných údajov (GDPR)
                </Link>
              </li>
              <li className="pt-2 text-zinc-500 text-[11px]">
                Servery umiestnené v EÚ (Frankfurt, Nemecko). Spracovanie údajov v súlade s GDPR.
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-zinc-500 text-[11px]">
          <div>
            © {new Date().getFullYear()} NEXIFY TECH CENTER. Všetky práva vyhradené.
          </div>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:text-zinc-400 transition-colors">
              VOP
            </Link>
            <Link href="/privacy" className="hover:text-zinc-400 transition-colors">
              Privacy Policy
            </Link>
            <a href="#pricing" className="hover:text-zinc-400 transition-colors">
              0 % provízia
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
