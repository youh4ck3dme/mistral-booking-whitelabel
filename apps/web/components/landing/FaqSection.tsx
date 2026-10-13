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
    <section id="faq" className="py-20 md:py-28 relative border-t border-white/[0.08]">
      <div className="premium-container max-w-4xl space-y-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/[0.03]">
            <span className="premium-eyebrow">Často kladené otázky</span>
          </div>
          <h2 className="premium-section-title text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Všetko, čo potrebujete vedieť pred začatím
          </h2>
          <p className="premium-lead max-w-2xl mx-auto">
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
                className="premium-card p-0 overflow-hidden transition-colors hover:border-white/20"
              >
                <button
                  type="button"
                  onClick={() => toggle(faq.id)}
                  aria-expanded={isOpen}
                  aria-controls={contentId}
                  className="w-full text-left p-6 sm:p-7 flex items-center justify-between gap-4 focus:outline-none"
                >
                  <span className="text-base sm:text-lg font-semibold text-white">
                    {faq.question}
                  </span>
                  <span
                    className={`shrink-0 w-8 h-8 rounded-full border border-white/10 bg-white/[0.04] flex items-center justify-center text-white/70 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-white/10 text-white border-white/20' : ''
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
                    className="px-6 pb-6 sm:px-7 sm:pb-7 text-sm sm:text-base text-white/70 leading-relaxed border-t border-white/10 pt-4"
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
