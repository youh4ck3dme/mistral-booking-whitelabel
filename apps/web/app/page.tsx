'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'

/**
 * Bookio Home Page - Complete Rebuild
 * Moderný rezervačný systém pre salóny, gastro a služby
 * Design tokens:
 *  - bg: #000000
 *  - surface: #080032
 *  - text: #ffffff
 *  - success: #3fca90
 *  - accent: #ffb719
 *  - border: #de9100
 */

// Placeholder images for all visual elements
const IMAGES = {
  logo: 'https://www.bookio.com/assets/img/logo-white.svg',
  heroScheduler: 'https://www.bookio.com/assets/img/bento/main.png?v=1',
  schedulerFallback: 'https://www.bookio.com/assets/img/features/scheduler.jpg',
  consultation: 'https://www.bookio.com/assets/img/bento/consultation.png?v=1',
  handshake: 'https://www.bookio.com/assets/img/bento/handshake.png?v=1',
  creditCards: 'https://www.bookio.com/assets/img/credit-cards.png',
  segments: {
    beauty: 'https://www.bookio.com/storage/files/8XqoSYfMc91yNV4hwL5C4kSfcFnsw69MmDGKNB9J.webp',
    barber: 'https://www.bookio.com/storage/files/oTP3ZMpFGNhELnPCFyDabHUrBpA9Rm8DQWEAL28V.png',
    gastro: 'https://www.bookio.com/storage/files/w1dOOMSidGUU8NDbq8vanWhZIdledGnrVNWtnwTj.jpg',
    health: 'https://www.bookio.com/storage/files/sTh7viCrM97Ve2aqOoSDm5JGI5qty0szXE15RBx8.webp',
    cosmetic: 'https://www.bookio.com/storage/files/UO37bgjRg5ZXHCvkP5vGAnquz3BoWVSfYi5XVmb5.webp',
    fitness: 'https://www.bookio.com/storage/files/frESRVIGmup2p78kUrWfnDJc7qpJ4Ee2bgtAWtgf.webp',
  },
}

const LANGUAGES = [
  { code: 'SK', flag: 'https://flagcdn.com/32x24/sk.webp', name: 'Slovenčina' },
  { code: 'CZ', flag: 'https://flagcdn.com/32x24/cz.webp', name: 'Čeština' },
  { code: 'DE', flag: 'https://flagcdn.com/32x24/de.webp', name: 'Deutsch' },
  { code: 'EN', flag: 'https://flagcdn.com/32x24/gb.webp', name: 'English' },
  { code: 'HU', flag: 'https://flagcdn.com/32x24/hu.webp', name: 'Magyar' },
  { code: 'PL', flag: 'https://flagcdn.com/32x24/pl.webp', name: 'Polski' },
]

const NAVIGATION_ITEMS = [
  { id: 'funkcie', label: 'Funkcie', dropdown: [
    'Rezervačná kniha',
    'Kalendár',
    'Rezervácie 24/7',
    'Pripomienky',
    'Špeciálne udalosti',
    'Platené rezervácie',
    'Darčekové poukážky',
    'Prehľady a štatistiky',
  ]},
  { id: 'segmenty', label: 'Segmenty', dropdown: [
    'Krása a Wellness',
    'Kaderníctva',
    'Barbery',
    'Wellness',
    'Kozmetické salóny',
    'Masáže',
    'Fyzioterapia',
    'Reštaurácie',
    'Gastro',
    'Šport a Fitness',
  ]},
  { id: 'cennik', label: 'Cenník' },
  { id: 'kontakt', label: 'Kontakt' },
]

const STATS = [
  { value: '24/7', title: 'Rezervácie 24/7', desc: 'Neustály príjem objednávok aj mimo otváracích hodín.' },
  { value: '40%', title: 'Ušetrite 40% času', desc: 'Menej telefonátov a papierovania, viac času na klientov.' },
  { value: '+35%', title: 'Vyššie tržby o 35%', desc: 'Viac obsadených termínov a platby vopred bez výpadkov.' },
  { value: '100%', title: 'Dokonalý prehľad', desc: 'Všetky rezervácie, tím a tržby prehľadne na jednej obrazovke.' },
  { value: '5 min', title: 'Nastavené za pár minút', desc: 'Rýchle spustenie bez technických znalostí a inštalácií.' },
  { value: '10+ rokov', title: 'Priateľský tím ľudí', desc: 'Skúsená slovenská podpora pripravená pomôcť kedykoľvek.' },
  { value: '0%', title: 'Notifikácie a SMS pripomienky', desc: 'Automatické pripomenutie termínu klientovi pred návštevou.' },
  { value: 'Online', title: 'Jednoduchší predaj a platby', desc: 'Okamžité platby kartou, zálohy a darčekové poukazy.' },
]

const FEATURES = [
  { title: 'Rezervačná kniha', desc: 'Prehľadný kalendár a online správa rezervácií v reálnom čase.' },
  { title: 'Kalendár', desc: 'Prepojenie s Google a iPhone kalendárom pre okamžitú synchronizáciu.' },
  { title: 'Rezervácie 24/7', desc: 'Vaši klienti sa objednajú kedykoľvek, aj cez víkendy a sviatky.' },
  { title: 'Pripomienky', desc: 'Automatické SMS a e-mailové notifikácie znižujú výpadky až o 70%.' },
  { title: 'Špeciálne udalosti', desc: 'Workshopy, degustačné večery a jednorazové skupinové termíny.' },
  { title: 'Platené rezervácie', desc: 'Zálohy a platby kartou vopred chránia pred no-show klientmi.' },
  { title: 'Darčekové poukážky', desc: 'Automatizovaný predaj a evidencia poukazov online na webe.' },
  { title: 'Prehľady a štatistiky', desc: 'Kompletný prehľad o tržbách, vyťaženosti zamestnancov a zákazníkoch.' },
  { title: 'Informácie o zákazníkoch', desc: 'História návštev, preferencie a kontakty bezpečne na jednom mieste.' },
  { title: 'Spätná väzba', desc: 'Hodnotenia od spokojných klientov pre rast vašej reputácie.' },
  { title: 'Vzdialený prístup', desc: 'Prístup z mobilu, tabletu alebo notebooku odkiaľkoľvek.' },
  { title: 'Bezpečná archivácia', desc: 'Dáta v bezpečí podľa GDPR s pravidelnými cloudovými zálohami.' },
]

const SEGMENTS = [
  { name: 'Krása a Wellness', img: IMAGES.segments.beauty },
  { name: 'Kaderníctva & Barbery', img: IMAGES.segments.barber },
  { name: 'Gastro & Reštaurácie', img: IMAGES.segments.gastro },
  { name: 'Zdravie & Masáže', img: IMAGES.segments.health },
  { name: 'Kozmetické salóny', img: IMAGES.segments.cosmetic },
  { name: 'Šport & Fitness', img: IMAGES.segments.fitness },
]

const TESTIMONIALS = [
  {
    quote: '"Zjednodušenie pracovného chaosu" Bookio má skvelý tím ľudí, Martina mi vždy bol...',
    author: 'Spokojný klient',
  },
  {
    quote: 'S bookiom spolupracujeme už pol roka a nemôžeme si tento rezervačný systém vyna...',
    author: 'Spokojný klient',
  },
  {
    quote: '"Zaujme nových zákazníkov" Našej klinike pomohol s objednávaním klientov a zabezp...',
    author: 'Spokojný klient',
  },
  {
    quote: '"Najefektívnejší systém na trhu" Rezervačný systém Bookio prináša nášmu klientovi...',
    author: 'Spokojný klient',
  },
]

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [currentLang, setCurrentLang] = useState('SK')
  const [activeNavDropdown, setActiveNavDropdown] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget as HTMLImageElement
    target.src = IMAGES.schedulerFallback
  }

  const currentLanguage = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <div className="page-loading active">
          <div className="page-loading-inner">
            <div className="page-spinner">
              <span className="text-white">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#000000] text-white font-sans antialiased selection:bg-[#ffb719] selection:text-black">
      {/* ============================================================ */}
      {/* NAVBAR */}
      {/* ============================================================ */}
      <header className="navbar navbar-expand-lg fixed-top bg-[#080032]/95 backdrop-blur-md border-b border-[#de9100]/25 transition-all z-50">
        <div className="container justify-content-md-between justify-content-end px-2 max-w-7xl mx-auto">
          {/* Logo */}
          <a className="navbar-brand me-auto flex items-center gap-2">
            <Image
              src={IMAGES.logo}
              alt="Bookio Logo"
              width={120}
              height={32}
              className="h-8 w-auto object-contain"
              priority
            />
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-200">
            {NAVIGATION_ITEMS.map((item) => (
              <div key={item.id} className="relative">
                {item.dropdown ? (
                  <div
                    className="cursor-pointer hover:text-[#ffb719] transition-colors py-2 flex items-center gap-1"
                    onMouseEnter={() => setActiveNavDropdown(item.id)}
                    onMouseLeave={() => setActiveNavDropdown(null)}
                  >
                    {item.label}
                    <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                    {activeNavDropdown === item.id && (
                      <div className="absolute top-full left-0 mt-2 w-48 bg-[#080032] border border-[#de9100]/40 rounded-xl shadow-2xl py-2 z-50">
                        {item.dropdown.map((dropdownItem, index) => (
                          <a
                            key={index}
                            href={`#${item.id}`}
                            className="block px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10 hover:text-[#ffb719] transition rounded"
                          >
                            {dropdownItem}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <a
                    href={`#${item.id}`}
                    className="hover:text-[#ffb719] transition-colors py-2"
                  >
                    {item.label}
                  </a>
                )}
              </div>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Login Button */}
            <a
              id="loginbtn"
              href="https://services.bookio.com/auth/login?targetUri=%2Fclient-admin&lang=sk"
              className="btn btn-outline-primary bg-light btn-sm px-4 py-2 text-xs md:text-sm font-semibold text-white/90 hover:text-white border border-white/20 hover:border-[#de9100] rounded-full transition"
            >
              <i className="ai-user fs-xl me-2 ms-n1" />
              Prihlásiť sa
            </a>

            {/* Top CTA Button */}
            <a
              id="topbtn"
              href="#konzultacia"
              className="btn btn-primary btn-sm fs-sm px-5 py-2 text-xs md:text-sm font-bold text-black bg-[#ffb719] hover:bg-[#de9100] rounded-full shadow-lg shadow-[#ffb719]/20 transition transform active:scale-95"
            >
              <i className="ai-arrow-right fs-xl me-2 ms-n1" />
              Vyskúšať zdarma
            </a>

            {/* Language Selector */}
            <div className="relative lang-selector">
              <button
                id="langnav"
                type="button"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="nav-link dropdown-toggle ms-2 my-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-[#de9100] text-xs font-semibold uppercase tracking-wider text-slate-200 transition"
                aria-expanded={langMenuOpen}
              >
                <Image
                  src={currentLanguage.flag}
                  alt={currentLanguage.name}
                  width={16}
                  height={12}
                  className="w-4 h-3 object-cover rounded-xs"
                />
                <span>{currentLang}</span>
              </button>

              {langMenuOpen && (
                <ul className="dropdown-menu absolute right-0 mt-2 w-36 bg-[#080032] border border-[#de9100]/40 rounded-xl shadow-2xl py-1 z-50">
                  {LANGUAGES.map((lang) => (
                    <li key={lang.code} className="nav-item">
                      <button
                        onClick={() => {
                          setCurrentLang(lang.code)
                          setLangMenuOpen(false)
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left hover:bg-white/10 transition text-slate-200"
                      >
                        <Image src={lang.flag} alt={lang.name} width={16} height={12} className="w-4 h-3 object-cover rounded-xs" />
                        <span>{lang.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Mobile Toggle */}
          <button
            className="navbar-toggler order-5 ms-2 my-1 flex sm:hidden items-center justify-center p-2 rounded-lg bg-white/5 border border-white/10 text-white hover:text-[#ffb719]"
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </span>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden bg-[#080032] border-b border-[#de9100]/30 px-4 pt-2 pb-6 space-y-3">
            {NAVIGATION_ITEMS.map((item) => (
              <div key={item.id} className="space-y-1">
                <a
                  href={`#${item.id}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-base font-medium text-slate-200 hover:text-[#ffb719]"
                >
                  {item.label}
                </a>
                {item.dropdown && (
                  <div className="ps-4 space-y-1">
                    {item.dropdown.map((dropdownItem, index) => (
                      <a
                        key={index}
                        href={`#${item.id}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block py-1.5 text-sm text-slate-300 hover:text-[#ffb719]"
                      >
                        {dropdownItem}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-3 border-t border-white/10 flex flex-col gap-2.5 d-sm-none">
              <a
                href="https://services.bookio.com/auth/login?targetUri=%2Fclient-admin&lang=sk"
                className="btn btn-outline-primary w-100 mb-1 px-4 py-2.5 rounded-full border border-white/20 text-sm font-semibold text-center"
              >
                Prihlásiť sa
              </a>
              <a
                href="#konzultacia"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-primary w-100 mb-1 px-4 py-2.5 rounded-full bg-[#ffb719] text-black font-bold text-sm shadow-md text-center"
              >
                Vyskúšať zdarma
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ============================================================ */}
      {/* MAIN CONTENT */}
      {/* ============================================================ */}
      <main className="bk-main px-2 pt-20">
        <div className="container max-w-7xl mx-auto">
          {/* Hero Section */}
          <section className="text-center space-y-6 pt-12 pb-20 lg:pt-20 lg:pb-32">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ffb719]/10 border border-[#de9100]/40 text-[#ffb719] text-xs font-semibold tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-[#3fca90] animate-pulse" />
              14 dní zadarmo bez zadania platobnej karty
            </div>

            <h1 className="heading h1 text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Moderný rezervačný systém pre salóny, gastro a služby
            </h1>

            <div className="subheading text-xl sm:text-2xl font-medium text-[#3fca90]">
              Venujte sa svojmu biznisu. A o rezervácie, správu klientov a administráciu sa postará Bookio.
            </div>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Online rezervačný systém pre salóny, reštaurácie a služby. Rezervácie 24/7, platby, SMS pripomienky.
              Používa ho viac ako 2 500+ prevádzok na Slovensku a v Česku.
            </p>

            <div className="buttons flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <a
                href="#konzultacia"
                className="btn btn-primary w-full sm:w-auto px-8 py-4 rounded-full bg-[#ffb719] hover:bg-[#de9100] text-black font-extrabold text-base shadow-xl shadow-[#ffb719]/25 transition transform active:scale-95"
              >
                Vyskúšať zdarma
              </a>
              <a
                href="#funkcie"
                className="btn btn-outline-primary w-full sm:w-auto px-8 py-4 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-base transition"
              >
                Preskúmať funkcie
              </a>
            </div>

            {/* Hero Visual - Bento Layout */}
            <div className="mt-14 relative max-w-5xl mx-auto">
              <div className="bento rounded-3xl border border-[#de9100]/30 shadow-2xl overflow-hidden bg-slate-900/60 backdrop-blur-xl">
                <div className="overlay p-3 sm:p-5 relative">
                  <Image
                    src={IMAGES.heroScheduler}
                    alt="Bookio Rezervačný systém rozhranie"
                    fill
                    className="rounded-2xl object-cover shadow-inner"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    onError={handleImageError}
                  />
                </div>
                <div className="bg bg-m" />
              </div>

              {/* Welcome Bento */}
              <div className="bento reduce mt-8 rounded-3xl border border-[#de9100]/30 shadow-2xl overflow-hidden bg-slate-900/60 backdrop-blur-xl">
                <div className="overlay p-6">
                  <h2 className="text-2xl font-bold text-white">
                    Menej chaosu. Viac klientov. Vyššie tržby.
                  </h2>
                  <p className="text-slate-300 mt-2">
                    Rezervačný systém, ktorý myslí na všetko.
                  </p>
                </div>
                <div className="bg welcome bg-m" />
              </div>
            </div>
          </section>

          {/* Stats Grid */}
          <section className="py-16">
            <div className="text-center space-y-4 mb-10">
              <h2 className="h1 text-2xl sm:text-4xl font-bold tracking-tight text-white">
                Bookio vám pomáha v biznise vyhrať. Každý deň.
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
                Už žiadne zmeškané hovory, neprehľadné papierové diáre a prázdne miesta v rozvrhu kvôli zabudnutým termínom.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {STATS.map((stat, index) => (
                <div
                  key={index}
                  className="p-6 rounded-2xl bg-[#080032] border border-[#de9100]/25 hover:border-[#ffb719] transition-all space-y-3 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#3fca90] px-2 py-0.5 rounded-full bg-[#3fca90]/10">
                      Výhoda
                    </span>
                    <span className="text-2xl font-black text-[#ffb719] group-hover:scale-105 transition-transform">
                      {stat.value}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-white group-hover:text-[#ffb719] transition-colors">
                    {stat.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {stat.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Segments Section */}
          <section id="segmenty" className="py-16 space-y-8">
            <div className="text-center space-y-3">
              <h2 className="h1 text-2xl sm:text-4xl font-bold text-white">
                10+ rokov vývoja. 100+ dostupných segmentov.
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto text-sm">
                Riešenie prispôsobené pre kaderníctva, barberov, kozmetiky, masáže, reštaurácie aj zdravotnícke centrá.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {SEGMENTS.map((segment, index) => (
                <div
                  key={index}
                  className="group relative rounded-2xl overflow-hidden border border-white/10 hover:border-[#ffb719] transition bg-[#080032] flex flex-col"
                >
                  <div className="aspect-4/3 w-full overflow-hidden bg-slate-800">
                    <Image
                      src={segment.img}
                      alt={segment.name}
                      width={300}
                      height={225}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                    />
                  </div>
                  <div className="p-3 text-center">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-[#ffb719] transition">
                      {segment.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Features Section */}
          <section id="funkcie" className="py-16 space-y-12">
            <div className="text-center space-y-3">
              <div className="inline-block text-xs font-bold uppercase tracking-wider text-[#3fca90] px-3 py-1 bg-[#3fca90]/10 rounded-full">
                Prehľad možností
              </div>
              <h2 className="h1 text-2xl sm:text-4xl font-bold text-white">
                Všetky funkcie pod jednou strechou
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#ffb719]/15 text-[#ffb719] border border-[#ffb719]/30">
                  Rezervácie
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 text-slate-300 border border-white/10">
                  Marketing
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 text-slate-300 border border-white/10">
                  Predaj a platby
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 text-slate-300 border border-white/10">
                  Manažment
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 text-slate-300 border border-white/10">
                  API a Integrácie
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((feature, index) => (
                <div
                  key={index}
                  className="p-5 rounded-2xl bg-[#080032] border border-[#de9100]/20 hover:border-[#ffb719] transition space-y-2.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#ffb719]/20 flex items-center justify-center text-[#ffb719]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h4 className="text-base font-bold text-white">{feature.title}</h4>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-11">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Testimonials Section */}
          <section className="testimonials py-16 px-2">
            <div className="justify-content-center pt-2 pt-sm-4 pb-4">
              <div className="text-center pt-2">
                <h2 className="h1 mb-1 text-2xl sm:text-4xl font-bold text-white">
                  Čísla hovoria jasne
                </h2>
              </div>
            </div>

            <div className="px-2 py-4">
              <div className="grid grid-cols-2 row-cols-md-4 gap-4">
                <div className="d-md-flex justify-content-center text-center">
                  <div className="position-absolute top-50 end-0 translate-middle-y">
                    <div className="p-3 px-sm-0 py-sm-4">
                      <span className="text-2xl font-black text-[#ffb719]">20,000,000+</span>
                      <p className="text-xs text-slate-300">obslúžených zákazníkov</p>
                    </div>
                  </div>
                </div>
                <div className="d-md-flex justify-content-center text-center">
                  <div className="position-absolute top-50 end-0 translate-middle-y">
                    <div className="p-3 px-sm-0 py-sm-4">
                      <span className="text-2xl font-black text-[#ffb719]">1,000,000+</span>
                      <p className="text-xs text-slate-300">online platieb</p>
                    </div>
                  </div>
                </div>
                <div className="d-md-flex justify-content-center text-center">
                  <div className="position-absolute top-50 end-0 translate-middle-y">
                    <div className="p-3 px-sm-0 py-sm-4">
                      <span className="text-2xl font-black text-[#ffb719]">15+</span>
                      <p className="text-xs text-slate-300">odmakanych rokov</p>
                    </div>
                  </div>
                </div>
                <div className="d-md-flex justify-content-center text-center">
                  <div className="position-absolute top-50 end-0 translate-middle-y">
                    <div className="p-3 px-sm-0 py-sm-4">
                      <span className="text-2xl font-black text-[#ffb719]">2,500+</span>
                      <p className="text-xs text-slate-300">prevádzok</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="swiper pt-2 pb-5">
                <div className="swiper-wrapper pt-5">
                  {TESTIMONIALS.map((testimonial, index) => (
                    <div key={index} className="swiper-slide">
                      <div className="bk-alert testimonial p-6 bg-[#080032] border border-[#de9100]/25 rounded-xl d-flex">
                        <p className="text-slate-300 text-sm">{testimonial.quote}</p>
                        <div className="text-xs text-slate-400 mt-2">{testimonial.author}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="swiper-controls mt-5 flex justify-center gap-4">
                  <button className="swiper-nav p-2 rounded-full bg-white/5 border border-white/10 hover:bg-[#ffb719] hover:text-black transition">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button className="swiper-nav p-2 rounded-full bg-white/5 border border-white/10 hover:bg-[#ffb719] hover:text-black transition">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Consultation Section */}
          <section
            id="konzultacia"
            className="position-relative px-2 pb-5 pt-2"
          >
            <div className="container position-relative zindex-2 pt-sm-2">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div className="consult-content space-y-6">
                  <h2 className="h1 text-2xl sm:text-4xl font-extrabold text-white">
                    Poraďte sa sa s našimi špecialistami
                  </h2>
                  <ul className="mt-4 list-unstyled space-y-3 text-slate-300">
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#3fca90]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Vyberte si preferovaný termín konzultácie
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#3fca90]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Získajte nezávislý pohľad od ľudí z praxe
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#3fca90]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Zorientujte sa v možnostiach Bookia
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#3fca90]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Získajte informácie pre správne rozhodnutie
                    </li>
                  </ul>
                  <div className="mb-4">
                    <a
                      href="https://services.bookio.com/auth/login?targetUri=%2Fclient-admin&lang=sk"
                      className="btn btn-primary d-inline-flex px-8 py-3 rounded-xl bg-[#ffb719] hover:bg-[#de9100] text-black font-extrabold text-sm shadow-lg shadow-[#ffb719]/25 transition active:scale-98"
                    >
                      Bezplatná konzultácia
                    </a>
                  </div>
                </div>

                <div className="consult-bento hidden lg:block">
                  <Image
                    src={IMAGES.consultation}
                    alt="Konzultácia"
                    width={500}
                    height={400}
                    className="rounded-2xl object-cover border border-[#de9100]/30"
                    onError={handleImageError}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Final Bento Section */}
          <section className="bk-main np py-16">
            <div className="container">
              <div className="bento rounded-3xl border border-[#de9100]/30 shadow-2xl overflow-hidden bg-slate-900/60 backdrop-blur-xl">
                <div className="overlay p-6 text-center">
                  <h2 className="h1 text-xl sm:text-2xl font-bold text-white">
                    Za Bookiom stoja technológie. Aj ľudia. Aplikácia, ktorá šetrí čas. Tím, ktorý rieši vaše problémy.
                  </h2>
                </div>
                <div className="bg bg-m" />
              </div>
              <div className="bento reduce-small mt-8 rounded-3xl border border-[#de9100]/30 shadow-2xl overflow-hidden bg-slate-900/60 backdrop-blur-xl">
                <div className="overlay" />
                <div className="bg" />
                <div className="bg-m" />
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* ============================================================ */}
      {/* FOOTER */}
      {/* ============================================================ */}
      <footer id="kontakt" className="bg-[#080032] border-t border-[#de9100]/25 pt-14 pb-12 mt-20 text-slate-400 text-xs">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="space-y-4 md:col-span-1">
              <Image
                src={IMAGES.logo}
                alt="Bookio"
                width={120}
                height={32}
                className="h-7 w-auto object-contain"
              />
              <p className="text-slate-300 leading-relaxed text-xs">
                Online rezervačný systém pre salóny, reštaurácie a služby. Rezervácie 24/7, platby, SMS pripomienky.
              </p>
              <div className="pt-2">
                <Image
                  src={IMAGES.creditCards}
                  alt="Platobné karty"
                  width={150}
                  height={24}
                  className="h-6 w-auto opacity-80"
                />
              </div>
            </div>

            {/* Funkcie */}
            <div className="space-y-2">
              <div className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">Funkcie</div>
              <ul className="space-y-1.5">
                {FEATURES.slice(0, 5).map((feature, index) => (
                  <li key={index}>
                    <a href={`#${feature.title.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-[#ffb719] transition">
                      {feature.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Segmenty */}
            <div className="space-y-2">
              <div className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">Segmenty</div>
              <ul className="space-y-1.5">
                {SEGMENTS.map((segment, index) => (
                  <li key={index}>
                    <a href="#segmenty" className="hover:text-[#ffb719] transition">
                      {segment.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Klientska zóna */}
            <div className="space-y-3">
              <div className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">Klientska zóna</div>
              <p className="text-slate-300">
                Už máte svoj účet v Bookio? Prihláste sa do svojej administrácie:
              </p>
              <a
                href="https://services.bookio.com/auth/login?targetUri=%2Fclient-admin&lang=sk"
                className="inline-block px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs transition"
              >
                Prihlásiť sa do Bookio
              </a>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>
              © {new Date().getFullYear()} Bookio. Všetky práva vyhradené. Rezervačný systém pre salóny, gastro a služby.
            </div>
            <div className="flex items-center gap-4">
              <a href="https://www.bookio.com/sk" className="hover:text-slate-400">Podmienky používania</a>
              <span>•</span>
              <a href="https://www.bookio.com/sk" className="hover:text-slate-400">Ochrana osobných údajov</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-[#ffb719] hover:bg-[#de9100] text-black shadow-lg shadow-[#ffb719]/25 transition transform active:scale-95 z-50 flex items-center justify-center"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
    </div>
  )
}
