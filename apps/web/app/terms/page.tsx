import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Všeobecné obchodné podmienky — NEXIFY TECH CENTER',
  description: 'Všeobecné obchodné podmienky používania platformy NEXIFY TECH CENTER.',
};

export default function TermsPage() {
  return (
    <div className="premium-stack" style={{ maxWidth: '760px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <section className="premium-stack">
        <span className="premium-eyebrow">Právne informácie</span>
        <h1 className="premium-title premium-title--medium">Všeobecné obchodné podmienky</h1>
        <p className="premium-lead">
          Tieto všeobecné obchodné podmienky (ďalej len „VOP“) upravujú práva a povinnosti pri používaní
          rezervačnej a prevádzkovej platformy NEXIFY TECH CENTER.
        </p>
      </section>

      <section className="premium-card premium-stack">
        <h2 className="premium-section-title">1. Vymedzenie základných pojmov</h2>
        <ul className="premium-list">
          <li>
            <strong>Poskytovateľ platformy:</strong> Prevádzkovateľ technologického riešenia NEXIFY TECH CENTER.
          </li>
          <li>
            <strong>Tenant (Prevádzkovateľ služby):</strong> Podnikateľský subjekt, ktorý využíva platformu na správu
            svojich služieb, zamestnancov a prijímanie rezervácií od koncových zákazníkov.
          </li>
          <li>
            <strong>Klient (Zákazník):</strong> Fyzická alebo právnická osoba, ktorá si cez platformu rezervuje termín
            na poskytnutie služby u konkrétneho Prevádzkovateľa.
          </li>
          <li>
            <strong>Rezervácia:</strong> Záväzný dopyt alebo objednávka termínu služby vytvorená cez rezervačný systém.
          </li>
        </ul>
      </section>

      <section className="premium-card premium-stack">
        <h2 className="premium-section-title">2. Registrácia a používateľský účet</h2>
        <p className="premium-copy">
          Registrácia v platforme je bezplatná. Používateľ je povinný pri registrácii uviesť pravdivé a úplné údaje.
          Prístupové údaje k účtu sú dôverné a používateľ je povinný chrániť ich pred zneužitím tretími osobami.
        </p>
        <p className="premium-copy">
          Pri prihlasovaní a overovaní identity platforma využíva bezpečné kryptografické štandardy. V prípade podozrenia
          na neoprávnený prístup je používateľ povinný bezodkladne zmeniť svoje heslo alebo kontaktovať podporu.
        </p>
      </section>

      <section className="premium-card premium-stack">
        <h2 className="premium-section-title">3. Pravidlá vytvárania, zmien a storna rezervácií</h2>
        <p className="premium-copy">
          Rezervácia termínu sa stáva platnou po jej potvrdení systémom a odoslaní potvrdzujúceho oznámenia s unikátnym
          odkazom na správu rezervácie.
        </p>
        <ul className="premium-list">
          <li>
            <strong>Zmena termínu (Reschedule):</strong> Klient môže požiadať o presun termínu prostredníctvom odkazu
            na správu rezervácie v súlade s časovými limitmi stanovenými konkrétnym prevádzkovateľom.
          </li>
          <li>
            <strong>Zrušenie termínu (Storno):</strong> Zrušenie rezervácie je možné vykonať online cez bezpečný odkaz.
            Storno podmienky a prípadné storno poplatky sa riadia individuálnymi pravidlami zvolenej prevádzky.
          </li>
          <li>
            <strong>Vylúčenie zodpovednosti za samotné plnenie:</strong> Poskytovateľ platformy nie je poskytovateľom
            samotných objednávaných fyzických služieb (napr. kaderníckych, kozmetických či lekárskych úkonov); za ich
            kvalitu, realizáciu a daňové náležitosti zodpovedá priamo príslušný Tenant.
          </li>
        </ul>
      </section>

      <section className="premium-card premium-stack">
        <h2 className="premium-section-title">4. Práva a povinnosti používateľa</h2>
        <p className="premium-copy">
          Používateľ sa zaväzuje používať platformu výlučne v súlade s platnými právnymi predpismi Slovenskej republiky
          a Európskej únie. Zakázané je najmä:
        </p>
        <ul className="premium-list">
          <li>Akékoľvek pokusy o narušenie bezpečnosti, reverzné inžinierstvo alebo preťažovanie serverov (DDoS útoky).</li>
          <li>Vytváranie fiktívnych alebo špekulatívnych rezervácií blokujúcich kapacity prevádzkovateľov.</li>
          <li>Zadanie nepravdivých osobných údajov alebo údajov cudzích osôb bez ich výslovného súhlasu.</li>
        </ul>
      </section>

      <section className="premium-card premium-stack">
        <h2 className="premium-section-title">5. Ochrana osobných údajov</h2>
        <p className="premium-copy">
          Spracovanie osobných údajov podlieha prísnym bezpečnostným štandardom a pravidlám GDPR. Podrobné informácie
          o tom, aké údaje spracovávame a ako ich chránime, nájdete v sekcii{' '}
          <Link href="/privacy" className="premium-inline-link">
            Ochrana súkromia
          </Link>
          .
        </p>
      </section>

      <section className="premium-card premium-stack">
        <h2 className="premium-section-title">6. Záverečné ustanovenia</h2>
        <p className="premium-copy">
          Tieto VOP nadobúdajú platnosť dňom ich zverejnenia. Poskytovateľ si vyhradzuje právo VOP primerane aktualizovať;
          o podstatných zmenách budú registrovaní používatelia informovaní. Právne vzťahy neupravené týmito VOP sa riadia
          Obchodným zákonníkom a Občianskym zákonníkom Slovenskej republiky.
        </p>
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
          <Link href="/signup" className="premium-button premium-button--secondary">
            Späť na registráciu
          </Link>
          <Link href="/" className="premium-button premium-button--ghost">
            Hlavná stránka
          </Link>
        </div>
      </section>
    </div>
  );
}
