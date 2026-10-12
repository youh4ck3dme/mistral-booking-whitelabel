'use client';

import { useState } from 'react';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export function FaqSection() {
  const [openId, setOpenId] = useState<string | null>('faq-1');

  const faqs: FaqItem[] = [
    {
      id: 'faq-1',
      question: 'Ako systém zaručuje, že nikdy nevznikne dvojitá rezervácia (double-booking)?',
      answer:
        'Využívame transakčné PostgreSQL EXCLUDE obmedzenia priamo v databázovom jadre. Pred potvrdením rezervácie sa aplikuje atomický zámok na časový interval a konkrétneho pracovníka. Dve súbežné požiadavky na rovnaký slot nie je technicky možné zapísať do databázy. Ak by aj dvaja klienti klikli v tej istej milisekunde, databáza druhú transakciu odmietne s okamžitou a zrozumiteľnou odozvou.',
    },
    {
      id: 'faq-2',
      question: 'Skutočne si neúčtujete žiadne percentá ani provízie z mojich tržieb?',
      answer:
        'Áno, presne tak. Na rozdiel od marketplace platforiem, ktoré si berú 10 % až 25 % z každej rezervácie, NEXIFY funguje na princípe čistého B2B SaaS predplatného. Platíte iba fixný mesačný alebo ročný poplatok za softvér. Celých 100 % tržieb od vašich klientov zostáva na vašom účte.',
    },
    {
      id: 'faq-3',
      question: 'Musia si moji klienti sťahovať aplikáciu alebo vytvárať účet?',
      answer:
        'Nie, absolútne nie. Klientsky rezervačný proces je navrhnutý ako úplne beztrenicový (frictionless). Klient si v bežnom webovom prehliadači vyberie službu, pracovníka a čas, zadá svoje kontaktné údaje a potvrdí. Po dokončení dostane e-mail s unikátnym a bezpečným odkazom na správu termínu, kde môže rezerváciu kedykoľvek zmeniť alebo zrušiť bez nutnosti pamätať si heslo.',
    },
    {
      id: 'faq-4',
      question: 'Ako funguje White-Label prispôsobenie a vlastná značka?',
      answer:
        'Vaši zákazníci vidia výhradne vašu firemnú identitu. V administrácii si nastavíte vlastné logo, primárnu a sekundárnu farbu, popisy a kontakty. Rezervačný systém beží na vašej subdoméne (napr. app.nexify.sk/vas-salon/book) alebo na vašej vlastnej doméne (rezervacie.vasaspolocnost.sk). V rozhraní sa nezobrazuje žiadna reklama na iné prevádzky ani marketplace katalógy.',
    },
    {
      id: 'faq-5',
      question: 'Čo sa stane, ak klient nepríde alebo potrebuje termín zmeniť na poslednú chvíľu?',
      answer:
        'Vďaka automatickým transakčným pripomienkam cez outbox pattern výrazne znižujeme mieru neúčasti (No-show). Ak klient klikne na samoobslužný storno odkaz, systém jeho slot okamžite atomicky uvoľní pre iných čakajúcich zákazníkov. V dennom rozvrhu má personál možnosť jedným kliknutím označiť rezerváciu ako „Dokončené“ alebo „Nedostavil sa“, vďaka čomu máte presné štatistiky o spoľahlivosti klientov.',
    },
  ];

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section id="faq" className="py-20 md:py-28 relative bg-zinc-950/80 border-t border-zinc-800">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-700 bg-zinc-900 text-zinc-300 text-xs font-semibold uppercase tracking-wider">
            Často kladené otázky
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Všetko, čo potrebujete vedieť pred začatím
          </h2>
          <p className="text-zinc-400 text-base sm:text-lg leading-relaxed">
            Máte otázku, na ktorú tu nenájdete odpoveď? Náš tím je pripravený vám pomôcť 24/7.
          </p>
        </div>

        {/* Accordion list */}
        <div className="space-y-4">
          {faqs.map((faq) => {
            const isOpen = openId === faq.id;
            const contentId = `${faq.id}-content`;

            return (
              <div
                key={faq.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden transition-colors hover:border-zinc-700"
              >
                <button
                  type="button"
                  onClick={() => toggle(faq.id)}
                  aria-expanded={isOpen}
                  aria-controls={contentId}
                  className="w-full text-left p-6 sm:p-7 flex items-center justify-between gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <span className="text-base sm:text-lg font-semibold text-white">
                    {faq.question}
                  </span>
                  <span
                    className={`shrink-0 w-8 h-8 rounded-full border border-zinc-700 bg-zinc-800 flex items-center justify-center text-zinc-300 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : ''
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>

                {isOpen && (
                  <div
                    id={contentId}
                    role="region"
                    className="px-6 pb-6 sm:px-7 sm:pb-7 text-sm sm:text-base text-zinc-300 leading-relaxed border-t border-zinc-800/60 pt-4"
                  >
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
