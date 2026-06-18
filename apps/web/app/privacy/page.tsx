import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ochrana súkromia — NEXIFY TECH CENTER',
  description: 'Informácie o spracovaní osobných údajov a cookie politike platformy NEXIFY.',
};

export default function PrivacyPage() {
  return (
    <div className="premium-stack" style={{ maxWidth: '720px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <section className="premium-stack">
        <span className="premium-eyebrow">Právne informácie</span>
        <h1 className="premium-title premium-title--medium">Ochrana súkromia</h1>
        <p className="premium-lead">
          Platforma NEXIFY rešpektuje vaše súkromie a spracúva osobné údaje v súlade s GDPR
          (Nariadenie EÚ 2016/679).
        </p>
      </section>

      <section className="premium-card premium-stack">
        <h2 className="premium-section-title">1. Prevádzkovateľ</h2>
        <p className="premium-copy">
          Prevádzkovateľom platformy NEXIFY TECH CENTER je jej vlastník. Pre otázky týkajúce sa
          osobných údajov nás kontaktujte na emailovej adrese uvedenej na hlavnej stránke.
        </p>
      </section>

      <section className="premium-card premium-stack">
        <h2 className="premium-section-title">2. Aké údaje zbierame</h2>
        <ul className="premium-list">
          <li>
            <strong>Autentifikačné údaje:</strong> emailová adresa a heslom zabezpečená session
            pri registrácii a prihlásení (spravované cez Supabase Auth).
          </li>
          <li>
            <strong>Rezervačné údaje:</strong> dátum, čas, vybratá služba a stav rezervácie, ktoré
            ste zadali pri vytváraní termínu.
          </li>
          <li>
            <strong>Technické údaje:</strong> IP adresa, typ prehliadača a základné metriky
            prístupu pre bezpečnosť a diagnostiku.
          </li>
        </ul>
      </section>

      <section className="premium-card premium-stack">
        <h2 className="premium-section-title">3. Cookies a lokálne úložisko</h2>
        <ul className="premium-list">
          <li>
            <strong>Nevyhnutné cookies (session):</strong> Supabase auth session token uložený
            v cookies — bez neho nemôžete byť prihlásený. Právnym základom je plnenie zmluvy.
          </li>
          <li>
            <strong>Lokálne úložisko:</strong> téma rozhrania (tmavá/svetlá) a súhlas s cookies
            sú uložené lokálne vo vašom prehliadači a neopúšťajú vaše zariadenie.
          </li>
          <li>
            <strong>Analytika:</strong> v súčasnosti nepoužívame analytické nástroje tretích strán.
          </li>
        </ul>
      </section>

      <section className="premium-card premium-stack">
        <h2 className="premium-section-title">4. Doba uchovávania</h2>
        <p className="premium-copy">
          Osobné údaje uchovávame po dobu trvania vášho účtu plus 30 dní po jeho zrušení.
          Rezervačné záznamy sú archivované po dobu 12 mesiacov v súlade s obchodnými požiadavkami.
        </p>
      </section>

      <section className="premium-card premium-stack">
        <h2 className="premium-section-title">5. Vaše práva (GDPR)</h2>
        <ul className="premium-list">
          <li><strong>Právo na prístup</strong> — môžete požiadať o kópiu vašich osobných údajov.</li>
          <li><strong>Právo na opravu</strong> — môžete opraviť nesprávne alebo neúplné údaje.</li>
          <li>
            <strong>Právo na vymazanie</strong> — môžete požiadať o vymazanie vašich údajov
            (právo na zabudnutie).
          </li>
          <li>
            <strong>Právo na prenosnosť</strong> — môžete získať vaše údaje v strojovo čitateľnom
            formáte.
          </li>
          <li>
            <strong>Právo namietať</strong> — môžete namietať spracúvanie vašich osobných údajov.
          </li>
        </ul>
        <p className="premium-copy">
          Pre uplatnenie vašich práv nás kontaktujte emailom. Odpovieme do 30 dní.
        </p>
      </section>

      <section className="premium-card premium-stack">
        <h2 className="premium-section-title">6. Bezpečnosť</h2>
        <p className="premium-copy">
          Všetka komunikácia prebieha cez HTTPS. Heslá nie sú nikdy ukladané v plaintexte —
          autentifikáciu zabezpečuje Supabase Auth s bcrypt hashovaním. Databáza je chránená
          Row Level Security (RLS) politikami.
        </p>
      </section>

      <p className="premium-muted" style={{ fontSize: '0.8rem', marginTop: '2rem' }}>
        Posledná aktualizácia: jún 2026
      </p>
    </div>
  );
}
