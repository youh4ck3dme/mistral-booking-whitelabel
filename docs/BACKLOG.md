# Backlog: Mistral | BOOking

Jediný zoznam úloh. Pravidlá práce sú v `docs/SOURCE_OF_TRUTH.md`.
Aktualizované: 2026-10-11.

**Legenda:** ✅ hotové · 🟡 rozrobené · ⛔ čaká na rozhodnutie vlastníka · ⬜ čaká · 🔬 najprv validovať (hypotéza)
**Veľkosť:** S ≈ 0,5 dňa · M ≈ 1–2 dni · L ≈ 3+ dni

---

## Ďalšie kroky (v tomto poradí)

1. **BLD-1**: zmerge draft PR #5 po review (oprava buildu `main`, typy pre `sales_leads`).
2. **SEC-5** validácia a členstvo v `/api/chat`.
3. **QA-2, QA-3, QA-4**: ✅ hotové (`.github/workflows/ci.yml`, Postgres container, migrácie 001–018 a SQL guard testy).
4. **DB-014** least-privilege granty (po schválení návrhu).

---

## P0: bezpečnosť a blokery

| ID | Úloha | Akceptácia | Vel. | Stav |
|---|---|---|---|---|
| SEC-1 | Next.js 14.0.0 → 14.2.35, zarovnanie `@repo/ui` a `@repo/supabase`, layouty `force-dynamic` | Build bez chýb, žiadna referencia na 14.0.0 v zámku | M | ✅ `d698cd1` |
| SEC-2 | `getSession()` → `getUser()` pre všetky serverové rozhodnutia o auth | Reprodukcia 200 → 401 pri neplatnom JWT, regresné testy | M | ✅ `144b1f3` |
| SEC-9 | Natvrdo zapísané testovacie heslo v repozitári | Heslo sa generuje za behu, `.env.example` má placeholder | S | ✅ `dc106c5` |
| DB-013 | Hardening bookingov: anon únik e-mailov, IDOR pri INSERT, SQLSTATE 23P01, search_path, redundantné indexy | `ALL BOOKING CHECKS PASSED` na čistej DB s migráciami 001–013 | M | ✅ `92eec0e` |
| BLD-1 | `main` sa nebuildí: 25 TS chýb v `src/lib/leads/lead.service.*.ts` (chýbajú typy tabuliek `sales_leads`, `sales_messages`, `sales_offers` z migrácie 010). Overené: merge PR #4 chybu **neopraví** | `tsc`, lint, testy a `next build` na `main` prejdú. Oprava: PR #5 (draft) | S | 🟡 PR #5 čaká na review |
| PR-1 | Lint a GitGuardian na PR #4 | Lint zelený. GitGuardian: buď nález vyriešený, alebo označený ako false positive | S | ⛔ GitGuardian: rozhodnutie vlastníka |
| SEC-3 | Kontrola roly v `admin/layout.tsx` na serveri (nie len v klientskom `page.tsx`) | Ne-admin a anonym dostane redirect pred renderom. Testy pravidla aj layoutu, mutation check | S | ✅ (PR #4) |
| SEC-4 | Supabase advisors na staging DB po aplikácii 001–013 | 0 kritických hlásení. Výsledok v popise PR | S | ⬜ |
| SEC-5 | `/api/chat`: zod validácia `messages`, limit dĺžky, overenie členstva v `tenantId` | Neplatný vstup 400, nečlen 403, testy | S | ✅ |
| SEC-6 | Rate limit na `/api/chat`, `/api/notifications/*`, login a reset hesla | Nad limit 429, limit konfigurovateľný cez env | M | ✅ Sliding window RateLimiter v `src/lib/security/rate-limit.ts`, ochrana v middleware aj API trasách, testy |
| SEC-7 | Porovnanie `NOTIFICATION_CRON_SECRET` v konštantnom čase | `timingSafeEqual`, test s chybným tajomstvom | S | ✅ |
| SEC-8 | Security headers: CSP, HSTS, X-Frame-Options, Referrer-Policy | Skener bez F, CSP nerozbije Next.js | S | ✅ |
| DB-014 | Least-privilege: odobrať `GRANT ALL` na tabuľky pre `anon`/`authenticated` (migrácia 011), nahradiť explicitnými grantmi | Verejné stránky fungujú, SQL test pre každú rolu, RLS zostáva | M | ⬜ návrh, čaká na schválenie |

## P1: pred prvým zákazníkom

| ID | Úloha | Akceptácia | Vel. | Stav |
|---|---|---|---|---|
| BK-4 | Klient: zmena termínu a storno cez bezpečný odkaz. Hash tokenu (256 bitov), rotácia, expirácia, revokácia, auditovaný idempotentný storno, atomický presun, verejná stránka `/[tenantSlug]/booking/manage/[token]` | Migrácia 015, SQL overenie, dvojsessionový race test (presun na rovnaký slot), testy trasy. Tailwind UI a modálny potvrdzovací dialóg | L | ✅ Hotové: refaktorované Tailwind UI, token rotácia, storno modal a outbox integrácia |
| BK-5 | Personál a dostupnosť: pracovníci, priradenie služieb, pracovný čas, prestávky, dovolenka, buffer, časová zóna tenanta a DST, „ktokoľvek voľný“, admin záložka Personál | Migrácia 016 a 018 (active staff guard), SQL suite staff, race posledného slotu, testy API a dostupnosti. Booking funnel s kartou „Ktokoľvek voľný“ | L | ✅ Hotové: migrácie 016+018, slot resolution, priority karta a guard |
| BK-6 | Spoľahlivé pripomienky: nastavenie tenanta, outbox, idempotentný kľúč, retry s backoffom a konečným stavom, lease obnova, zrušenie pri zmene, disabled provider bez odoslania, chránený cron | Migrácia 017, SQL suite reminder, testy worker a cron autorizácie, admin karta | M | 🟡 `20bc858`, `cc9c435`, `3c3b8aa`. Chýba: skutočný provider (bez kľúča sa neodosiela), SMS/WhatsApp |
| BK-1 | Stav rezervácie Dokončená / Nedostavil sa: migrácia 014, RPC `set_booking_outcome` (len personál tenanta, až po začiatku, bez priameho UPDATE), API, tlačidlá v admin kalendári | Migrácia 014 na čistej DB, SQL overenie, unit testy trasy a pravidiel. UI nebolo E2E overené v prehliadači | M | ✅ `1b02763`, `7fcfbac`, `09a070b` |
| BK-2 | Dashboard z reálnych riadkov: dnes, dokončené, nedostavenie sa, tržby z dokončených, najžiadanejšie služby | Výpočet v čistej funkcii s testami. Žiadne placeholder čísla | S | ✅ `09a070b` |
| BK-3 | CSV export rezervácií zo zobrazeného zoznamu (BOM, bodkočiarka, ochrana proti vzorcom). Nie je e-Faktúra | Test escapovania a hlavičky. Export klientov a služieb je v OPS-9 | S | 🟡 `09a070b`, len rezervácie |
| FUN-1 | `/terms` a obchodné podmienky, oprava odkazu v signup | Odkaz nevedie na 404, stránka v locale tenanta | S | ✅ |
| FUN-2 | Odstrániť `href="#"` v `compute-landing.tsx` | Žiadny `#` odkaz v buildu | S | ✅ |
| FUN-3 | Platby: brána (napr. GoPay, Comgate, SumUp alebo Stripe, výber podľa rozhodnutia), záloha pri rezervácii, refund | Checkout, webhook, refund, idempotencia, doklad podľa FIS-1 a F-19 | L | ⛔ rozhodnutie vlastníka |
| FUN-4 | Custom domény tenantov | Host routing v middleware, overenie DNS, SSL | L | ⛔ rozhodnutie vlastníka |
| FUN-5 | Presun rezervácie (reschedule) | Atomický RPC `reschedule_booking`, EXCLUDE chráni konflikt, test | M | ⬜ |
| FUN-6 | Export `.ics` a potvrdzovací e-mail | Súbor sa importuje do Google a Apple kalendára, časová zóna správna | S | ✅ Hotové: RFC 5545 `.ics` export, Google Calendar link a `/book/success` |
| FUN-7 | Reset hesla a verifikácia e-mailu end-to-end | Reset → nové heslo → prihlásenie, overené v Safari/iOS | M | ⬜ |
| FUN-8 | Varovanie „deopted into client-side rendering“ na `/reset-password` | Build bez varovania | S | ✅ vyriešené pri SEC-1 |
| FUN-9 | Hosťovská rezervácia cez magic link (bez hesla) | Rezervácia za ≤ 3 kroky, potvrdenie e-mailom, test | M | ✅ Hotové: 4-krokový frictionless funnel na `/[tenantSlug]/book` s guest checkoutom |
| LEG-1 | Právna analýza eKasa pre tenantov v SK: služby podľa SK NACE, výnimky § 3 ods. 2 písm. b), znenie po novele 30/2026 Z. z. Rozhodnutie: vlastný certifikovaný adaptér, partner, alebo len upozornenie | Písomné stanovisko právnika. Rozhodnutie vlastníka zapísané do SOURCE_OF_TRUTH.md sekcia 7 | M | ⛔ právna kontrola + rozhodnutie vlastníka |
| LEG-2 | Právna analýza GDPR roly: správca alebo spracovateľ (SaaS vs. prevádzka tenanta), agregácia naprieč tenantmi, tréning AI, profilovanie a skóre neúčasti (F-14) | Písomné stanovisko. Rozhodnutie zapísané do docs/MARKET_RESEARCH.md, bod 5 | M | ⛔ právna kontrola + rozhodnutie vlastníka |
| LEG-3 | Právna analýza storna, záloh a poplatkov za neúčasť (SK/CZ spotrebiteľské právo, odstúpenie, výnimka pre služby na termín, zverejnenie pred rezerváciou) | Písomné stanovisko a vzor podmienok, ktoré sa zobrazia pri checkoute (F-11) | M | ⛔ právna kontrola |
| FIS-1 | e-Faktúra (SK, povinná od 1. 1. 2027): VERIFIED, primárny zdroj FS SR (vzdelavanie.financnasprava.sk, id=136; od vlastníka, agent neotvoril). Povinnosť prijímať majú právnické osoby a podnikatelia zdaniteľní DPH. PDF ani fotografia nie je e-Faktúra, vyžaduje sa štruktúrované XML. Digitálny poštár: VERIFIED (FS SR). UNVERIFIED: EN 16931 / UBL / Peppol ako architektúra, treba záväznú technickú špecifikáciu | Vygenerovaný XML prejde oficiálnou validáciou, odoslanie v testovacom prostredí, PDF nie je jediný výstup | L | ⛔ rozhodnutie vlastníka (partner s Digitálnym poštárom vs. vlastná kvalifikácia/infraštruktúra) + právna kontrola |
| FIS-2 | Účtovný export pre účtovníka (CSV alebo XML): predaje, DPH, platby, zálohy, refundy za zvolené obdobie | Formát podľa vzoru od účtovníka, test súčtov voči DB | M | ⬜ právna kontrola |
| QA-1 | E2E (Playwright) proti Vercel preview s testovacou DB | Testy `tests/e2e/integration/*` zelené | M | ⬜ |
| QA-2 | CI na všetkých PR (base `main` aj `feat/*`) | PR do `main` spustí lint, typecheck, build, testy | S | ✅ `.github/workflows/ci.yml` na `main` a `feat/*` |
| QA-3 | Typecheck v CI a turbo pipeline | CI padne pri type chybe | S | ✅ `tsc --noEmit` v CI a typecheck úloha v turbo pipeline |
| QA-4 | SQL test v CI (Postgres service container, migrácie 001–najnovšia) | Padne, ak ktorákoľvek migrácia alebo constraint zlyhá | M | ✅ Postgres service container s aplikáciou 001–018 a SQL guard testami |
| QA-5 | Unit testy pre dispatch, reminders a AI asistenta (mock Mistral) | Kritické cesty pokryté, nie len utility | M | ⬜ |
| A11Y-1 | axe-core v CI na `/book` a admin | WCAG 2.2 AA bez kritických chýb | M | ⬜ |
| PERF-1 | Lighthouse mobile v CI na `/book` | Skóre ≥ 90 alebo výnimka zapísaná s dôvodom | S | ⬜ |

## P2: prevádzka a compliance

| ID | Úloha | Akceptácia | Vel. | Stav |
|---|---|---|---|---|
| OPS-1 | Chybový monitoring (Sentry alebo ekvivalent), server aj klient | Chyby s tenant ID, bez osobných údajov v payloade | S | ⬜ |
| OPS-2 | Audit log: kto zmenil službu, rolu alebo rezerváciu | Tabuľka s používateľom a časom, RLS, test | M | ⬜ |
| OPS-3 | Checklist env premenných a kontrola pri štarte | Chýbajúca premenná = jasná chyba, nie tichý pád | S | ⬜ |
| OPS-4 | Obnova zo zálohy (PITR) overená na staging | Zdokumentovaný postup, záznam o teste obnovy | S | ⬜ |
| OPS-5 | Zosúladiť README a `ROUTES_AND_NAVIGATION.md` s realitou | Žiadne „✅ Implemented“ pre nehotové veci, Cypress → Playwright | S | ⬜ |
| OPS-6 | Duplicitný `@playwright/test` v koreňovom `package.json` | Lockfile a package.json konzistentné | S | ✅ |
| OPS-7 | GDPR: self-service export údajov a vymazanie účtu | Export JSON, vymazanie s anonymizáciou bookingov | M | ⬜ |
| OPS-8 | GDPR: záznam súhlasov (consent log) | Verzia textu, čas, účel, test | S | ⬜ |
| OPS-9 | Bezplatný export dát tenanta (CSV alebo JSON) kedykoľvek, bez poplatku | Export: rezervácie, klienti, služby. Test, že export obsahuje všetky tabuľky tenanta | M | ⬜ |
| OPS-10 | Register subdodávateľov a DPA (Supabase, Vercel, Resend, Mistral, platobná brána, SMS) a posúdenie prenosov mimo EÚ | Tabuľka s DPA, krajinou a prenosovým mechanizmom, schválená pred pilotom | S | ⬜ |
| OPS-11 | Retenčné politiky podľa kategórie údajov (rezervácie, klienti, logy, súhlasy, faktúry) s automatickým mazaním alebo anonymizáciou | Politika schválená právnikom, úloha mazania, test na vzorke dát | M | ⬜ čaká na LEG-2 |

## P3: diferenciátory

Každá položka je **hypotéza**. Pred implementáciou musí prejsť validáciou (prieskum konkurencie, ohlasy používateľov, právna kontrola tam, kde je uvedená). Výstup validácie sa zapíše do položky.

### Rezervácia a kapacita

| ID | Hypotéza | Vel. | Stav |
|---|---|---|---|
| F-1 🔬 | Zamestnanci so zručnosťami, miestnosti a vybavenie ako zdroje, buffer time. Znižuje „nikto nie je voľný“ a konflikty | L | ⬜ |
| F-2 🔬 | Čakacia listina s automatickou ponukou pri zrušení termínu | M | ⬜ |
| F-3 🔬 | Opakované rezervácie (séria) a balíky s kreditom (napr. 10 návštev) | M | ⬜ |
| F-4 🔬 | Skupinová rezervácia (viac osôb, jeden čas) | M | ⬜ |
| F-5 🔬 | Viac služieb v jednom košíku (sekvenčné sloty) | M | ⬜ |
| F-6 🔬 | Obojsmerná synchronizácia s Google, Outlook a Apple (CalDAV) a iCal feed | L | ⬜ |

### Tržby

| ID | Hypotéza | Vel. | Stav |
|---|---|---|---|
| F-7 🔬 | Záloha alebo predplatba pri rezervácii (závisí od FUN-3) | M | ⛔ FUN-3 |
| F-8 🔬 | Vouchery a darčekové poukazy | M | ⬜ |
| F-9 🔬 | Členstvá a predplatné | L | ⬜ |
| F-10 🔬 | Dynamické ceny (špička a mimo špičky) s pravidlami, ktoré vidí klient | M | ⬜ |

### Neúčasť a udržanie zákazníka

| ID | Hypotéza | Vel. | Stav |
|---|---|---|---|
| F-11 🔬 | Konfigurovateľné storno pravidlá a poplatok za neúčasť, s jasným upozornením pri rezervácii. Verzované podmienky s dôkazom prijatia (OPS-8) | M | ⬜ čaká na LEG-3 |
| F-12 🔬 | Pripomienky e-mailom a SMS (WhatsApp podľa preferencie), opt-in, odkaz na presun | M | ⬜ |
| F-13 🔬 | Žiadosť o recenziu po návšteve a vernostné body | M | ⬜ |
| F-14 🔬 | Predpoveď neúčasti na základe vysvetliteľných signálov. Bez automatického rozhodnutia bez človeka. GDPR posúdenie | L | ⬜ |

### Kanály

| ID | Hypotéza | Vel. | Stav |
|---|---|---|---|
| F-15 🔬 | Embed widget pre web klienta (iframe alebo web component, téma podľa tenanta) | M | ⬜ |
| F-16 🔬 | Odkaz pre Google Business, Instagram, Facebook a QR kód na prevádzke | S | ⬜ |
| F-17 🔬 | Konverzačný asistent cez WhatsApp a web (rozšírenie existujúceho AI asistenta). SimplyBook.me kanály WhatsApp a web VERIFIED (vlastný zdroj). Messenger je overený samostatne z help wiki, ale nie je v scope bez rozhodnutia. Diferenciácia musí byť lokálna | L | ⬜ |
| F-18 🔬 | Hlasový asistent pre zmeškané hovory. SimplyBook.me AI Voice Booking existuje: VERIFIED dostupnosť, hlas ide cez OpenAI, audio sa nezaznamenáva (vendor tvrdenie). VERIFIED (vendor-stated): max. 30 dní retencia OpenAI (abuse monitoring). CONFLICTING / LEGAL REVIEW: retencia textového prepisu. Overiť náklady a právo | L | ⬜ |

### Compliance SK, CZ a EÚ (vyžaduje právnu kontrolu)

| ID | Hypotéza | Vel. | Stav |
|---|---|---|---|
| F-19 | Automatické faktúry s DPH podľa SK a CZ. Prahy a obsah dokladu: docs/MARKET_RESEARCH.md, bod 2 | M | ⬜ právna kontrola |
| F-20 | Pokladničná integrácia. SK: eKasa pre služby od 1. 1. 2026 (LEG-1). CZ EET 2.0: parlament schválil 9. 9. 2026 (VERIFIED), prezident podpísal 17. 9. 2026 (VERIFIED), vyhlásený ako 180/2026 Sb. 7. 10. 2026 (VERIFIED, primárny zdroj PSP, od vlastníka, agent neotvoril). Účinnosť 1. 1. 2027 VERIFIED (zákon je vyhlásený); prechodné ustanovenia a aplikácia na produkt LEGAL/TAX REVIEW. Prípravné časti od 1. 11. 2026 sú podľa návrhu, nepotvrdené vo vyhlásenom znení. Rozsah platieb (karty, QR pri osobnom kontakte) je LEGAL/TAX REVIEW | L | ⛔ LEG-1, právna kontrola a rozhodnutie vlastníka |
| F-21 | Prístupnosť podľa European Accessibility Act. Overiť, či sa vzťahuje na službu rezervácie | S | ⬜ právna kontrola |

### Doplnené z výskumu (2026-10-11)

| ID | Hypotéza alebo úloha | Vel. | Stav |
|---|---|---|---|
| F-25 | Pay by Square QR kód na faktúrach pre SK účty v eurách (štandard SK, podľa payme.sk a SBA). CZ: SPAYD pre CZK | S | ⬜ |
| F-26 | SK kontrolný výkaz DPH (ako CZ kontrolní hlášení): mesačne alebo štvrťročne podľa registrácie, termín 25 dní. Overiť s právnikom | M | ⬜ právna kontrola |
| F-27 🔬 | Vernostné karty s cashback a odporúčací program (lokálne salóny ho používajú, globálne nástroje nie) | M | ⬜ |
| F-28 🔬 | Evidencia POS a zásob spojená s rezerváciou (model MYFOX) | L | ⛔ rozhodnutie o vertikále |
| F-29 🔬 | Zdravotnícky režim: intake, poznámky, telehealth. Len ak vlastník schváli vertikálu a zdravotné údaje | L | ⛔ rozhodnutie vlastníka + právna kontrola |
| F-30 🔬 | Voliteľný marketplace s nízkou províziou a atribučným oknom | L | ⛔ rozhodnutie vlastníka |

### Analytika a platforma

| ID | Hypotéza | Vel. | Stav |
|---|---|---|---|
| F-22 🔬 | Analytika: heatmapa vyťaženia, tržby na slot, retencia, zdroj rezervácie | M | ⬜ |
| F-23 🔬 | Verejné API s kľúčmi per tenant, webhooky, Zapier a Make | L | ⬜ |
| F-24 🔬 | PWA pre personál: offline rozpis a push notifikácie | M | ⬜ |

---

## Rozhodnutia, ktoré blokujú položky

| Rozhodnutie | Blokuje |
|---|---|
| Platby a brána | FUN-3, F-7 |
| Custom domény | FUN-4 |
| Prvý trh (SK, CZ, EÚ) | F-19 až F-21, FUN-1 (právne texty) |
| Pilot alebo reálni zákazníci | OPS-7, OPS-8, rozsah OPS-1 až OPS-4 |
| Next.js 14.2.x alebo 15 | Nič teraz, rieši sa pri ďalšom upgrade |
| GitGuardian nález | PR-1 |
| Prvý vertical (beauty, wellness, kliniky, remeslá) | F-1, F-28, F-29 |
| Marketplace áno alebo nie | F-30 |
| eKasa: vlastný adaptér, partner, alebo len upozornenie | LEG-1, F-20 |
| Zdravotné údaje: uchovávať, alebo len termín a kontakt | F-29, OPS-8 |
| e-Faktúra: partner s Digitálnym poštárom vs. vlastná kvalifikácia/infraštruktúra | FIS-1 |
| GDPR rola platformy (správca alebo spracovateľ) | LEG-2, OPS-10, OPS-11 |
| Podmienky storna a záloh: znenie a zobrazenie pri checkoute | LEG-3, F-11, FUN-3 |

---

## Nápady (nekóduj, len zapíš)

- **2026-10-12 · DB-018 · Active staff guard trigger.** Migrácia `018_active_staff_guard.sql` pridáva `BEFORE INSERT OR UPDATE OF staff_id, tenant_id` trigger na `bookings`, ktorý bráni vytvoreniu/presunu bookingu na neaktívneho alebo cudzieho staff. Doplnok k existujúcemu `prepare_booking_row` (016), ktorý rieši len buffery. Dôvod: pri deaktivácii staff člena existujúce budúce bookings ostanú confirmed — bez tohto guardu nové bookings na neaktívneho staff nie sú blokované na DB úrovni.
- **2026-10-12 · OPS · Autorepair booking integrity skript.** `scripts/autorepair_booking_integrity.sql` — operačný skript pre opravu dátových anomálií (orphaned tokeny, stuck notifikácie, buffer desync, inactive staff bookings, double-booking resolution). Idempotentný, transakčný, trigger-aware. Spúšťať cez service_role po PITR zálohe. Dôvod: bez hotového audit logu (OPS-2) a monitoringu (OPS-1) je manuálna diagnostika jedinou cestou pri incidentoch.
- **2026-10-12 · DB · Rozšíriť `booking_audit_events.actor` CHECK o hodnotu `'system'`.** Aktuálne je CHECK `('customer','staff','client_token')` — autorepair musí použiť `'staff'` čo je semanticky zavádzajúce. Vyžaduje rozhodnutie vlastníka (SOURCE_OF_TRUTH.md §7 — ide o zmenu kontraktu).
