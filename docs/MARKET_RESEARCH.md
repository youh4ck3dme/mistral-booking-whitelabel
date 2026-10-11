# Výskum trhu a mapa funkcií: SK/CZ → EÚ

Stav: 2026-10-11. Tento dokument je vstup do `docs/BACKLOG.md`. Zdroj pravdy o produkte a pravidlách je `docs/SOURCE_OF_TRUTH.md`.

**Nie je to právne ani daňové poradenstvo.** Právne body sú informácie z verejných zdrojov. Každý bod, ktorý ide do produktu, musí potvrdiť SK/CZ právnik alebo daňový poradca.

Legenda: ✅ potvrdené v tejto kontrole · 🟡 čiastočne alebo len sekundárny zdroj · ❌ oprava k pôvodnému tvrdeniu · ❓ neoverené

---

## 1. Čo sa overovalo

- **Pôvodný výskum:** tri výstupy (fact-check, strategická mapa, slovenský preklad s doplnkami). Beriem to ako: 1 = fact-check, 2 = výskum, 3 + 4 = preklad a doplnenie. Ak je to inak, oprav ma.
- **Táto kontrola:** 9 vyhľadávaní a 1 neúspešné otvorenie stránky (help.booksy.com nie je z prostredia dostupný). Vybrané tvrdenia sú v tabuľke nižšie.
- **Neprebrané:** ostatné citácie (cca 100 odkazov z pôvodnej správy) som jednotlivo neotváral. Ich tvrdenia sú označené ❓, pokiaľ ich nepotvrdila táto kontrola.
- **Ceny produktov:** nekontrolované. Pred rozhodnutím o cenníku ich over z oficiálnych stránok s dátumom.

## 2. Opravy k fact-checku a overené body

| Tvrdenie | Stav | Čo platí | Zdroj |
|---|---|---|---|
| CZ prah DPH 2 536 500 Kč | ❌ neúplné | Od 2025 sa počíta kalendárny rok, nie kĺzavých 12 mesiacov. Prah 2 000 000 Kč: registrácia od 1. 1. nasledujúceho roka. Prah 2 536 500 Kč: registrácia nasledujúci deň. Zdroje sa líšia v dni. Nerezidenti nemajú prah. | [Avalara](https://www.avalara.com/vatlive/en/country-guides/europe/czech-republic/czech-vat-registration.html), [KPMG](https://kpmg.com/us/en/taxnewsflash/news/2025/03/czech-republic-vat-registration-guidance.html) |
| SK prah registrácie DPH 50 000 € / 62 500 € | 🟡 nepreverené v tejto kontrole | Podľa fact-checku: kalendárny rok, registrácia do 5 pracovných dní. | fact-check, podnikajte.sk, KROS |
| SK zjednodušená faktúra do 100 € | 🟡 | Platí pre bežné zjednodušené doklady so sumou s DPH do 100 €. | [podnikajte.sk](https://www.podnikajte.sk/dan-z-pridanej-hodnoty/faktura-vs-zjednodusena-faktura) |
| SK eKasa doklady: 400 € (fact-check) | ❌ konflikt | Zdroje uvádzajú 1 000 € (hotovosť) a 1 600 € (karta alebo iný náhrada hotovosti). Jeden český sprievodca uvádza 400 €. **Číslo nekódovať do produktu, kým ho nepotvrdí právnik.** | [podnikajte.sk](https://www.podnikajte.sk/ekasa/faktura-zaplatena-v-hotovosti-ekasa-limit), [Eurofiscalis](https://www.eurofiscalis.com/cs/facturer-client-slovaquie/) |
| SK eKasa od 1. 1. 2026 | ✅ | Zákon 384/2025 Z. z., schválený 3. 12. 2025, účinný 1. 1. 2026, nahrádza 289/2008 Z. z. Vzťahuje sa na služby podľa SK NACE, s výnimkami v § 3 ods. 2 písm. b). Zoznam výnimiek z prílohy staršieho zákona v novom znení chýba. Novela 30/2026 Z. z. → **znenie overiť**. | [podnikajte.sk](https://www.podnikajte.sk/ekasa/zmeny-v-evidencii-trzieb-od-2026), [FS – služby podliehajúce eKase](https://podpora.financnasprava.sk/679547-Slu%C5%BEby-podliehaj%C3%BAce-povinnosti-evidencie-tr%C5%BEieb-v-pokladnici-eKasa-), [Slov-Lex PDF](https://static.slov-lex.sk/pdf/SK/ZZ/2025/384/ZZ_2025_384_20260101.pdf) |
| CZ EET 2.0 „podpísaný a vyhlásený“ | ❌ nepotvrdené | Parlament schválil 9. 9. 2026. Zdroje sa líšia v podpise (17. 9. vs. ešte čaká). Vyhlásenie v Zbierke zákonů nepotvrdené, ministerstvo plánovalo koniec októbra alebo november 2026. Účinnosť 1. 1. 2027, prípravné časti od 1. 11. 2026. Rozsah: platby pri osobnom kontakte vrátane kariet a QR. | [LookupTax](https://lookuptax.com/tax-changes/czech-republic/eet-2-chamber-overrides-senate-2026), [epravo.cz](https://www.epravo.cz/top/aktualne/eet-20-je-na-svete-od-ledna-2027-budou-podnikatele-evidovat-i-platby-kartou-a-qr-kodem-121639.html) |
| SK e-Faktúra od 1. 1. 2027 | 🟡 viac sekundárnych zdrojov | Štruktúrovaný XML (EN 16931 / UBL), prijímať musia aj neplatitelia DPH, PDF e-mailom nestačí, doručenie cez Peppol. „Digitálny poštár“ sa v zdrojoch nenašiel, treba overiť z Finančnej správy. | [podnikajte.sk](https://www.podnikajte.sk/dan-z-pridanej-hodnoty/efaktura-povinna-elektronicka-fakturacia-od-2027), [pravnenoviny.sk](https://pravnenoviny.sk/elektronicka-faktura-povinnost-prijimat/) |
| SimplyBook.me: AI hlasová rezervácia | ✅ help wiki, ❓ Instagram | Web widget, Messenger a WhatsApp. Hlas ide cez OpenAI a neukladá sa, platí sa kreditmi. Instagram je len v marketingu. | [SimplyBook.me](https://simplybook.me/en/ai-voice-booking), [help wiki](https://help.simplybook.me/wiki/AI_Voice_Booking) |
| Cal.com cloud je closed source | 🟡 | Hlavný kód už nie je verejný. Open-source časť je `calcom/cal.diy` pod MIT (predtým AGPL 3.0). Dátum: april 2026 (It's FOSS). | [Cal.com blog](https://cal.com/blog/cal-diy-open-source-to-closed-source), [It's FOSS](https://itsfoss.com/news/cal-com-goes-proprietary.md) |
| Square Appointments nie je v CZ/SK | ❓ pravdepodobne áno | Komunita Square uvádza len US, Kanadu, Japonsko, Austráliu a UK (nedatovaná odpoveď). Nepotvrdené na oficiálnej podpore. | community.squareup.com (nedatované) |
| Booksy nie je v CZ/SK | ❓ | Help center nebol dostupný. Nepotvrdené. | — |
| Treatwell: 13 krajín, bez CZ/SK | ❓ | Potvrdené len sídlo v Londýne a anglo-taliansky pôvod (sekundárne). Zoznam krajín nie. | Capterra, Health Club Management |
| Doctolib: FR, DE, IT, NL | 🟡 | Tretia strana (Similarweb, aug. 2026) uvádza FR, IT, DE, NL. CZ/SK nenájdené. | [Similarweb](https://www.similarweb.com/ko/company/doctolib.fr/) |
| Vagaro: US, CA, UK, AU | 🟡 | Tretie strany konzistentne uvádzajú US, CA, UK, AU. CZ nenájdené. | [Vagaro](https://www.vagaro.com/pro/about-us) (fact-check) |
| Pay by Square ako SK štandard | ✅ | Štandard QR kódu pre platbu faktúr v eurách na SK IBAN, podporuje ho Slovenská bankárska asociácia. CZ používa SPAYD pre CZK. | [payme.sk](https://payme.sk/en), [Fakturoid](https://www.fakturoid.cz/blog/2025/11/28/qr-kod-slovensko) |
| Mindbody poplatok 500 $ za export dát | ❓ jediný zdroj | Nepreverené. Pred použitím v komunikácii overiť. | CheckThat |
| No-show štatistiky (75 %, 45 %, 30–50 %, 9 % / 23 %) | ❓ marketingové zdroje | Nepoužívať ako dôkaz v produkte ani v materiáloch bez primárneho zdroja. | viaceré blogy |
| Cancel button od 19. 6. 2026 | ❓ | Tvrdí pôvodný výskum. Overiť text smernice 2023/2673 a jej rozsah pre rezervácie. | — |

## 3. Konkurencia v SK/CZ (stav dôkazu)

| Produkt | Prítomnosť v SK/CZ | Poznámka |
|---|---|---|
| Reservio | 🟡 CZ/SK jazyk podľa výskumu | Nepreverené tu. Bez veľkých cenových tabuliek. |
| Bookio (SK), Salona (CZ), Anolla (CZ), Reenio (CZ) | 🟡 lokálne | Z pôvodného výskumu, nepreverené tu. |
| Reservanto (CZ) | ❓ | Doplnený fact-checkom. Nepreverený. |
| Medevio (CZ/SK, zdravotníctvo) | ❓ | Doplnený fact-checkom. Nepreverený. |
| MYFOX (CZ, POS-first) | ❓ | Doplnený fact-checkom. Nepreverený. |
| Altegio | ❓ | Doplnený fact-checkom. Nepreverený. |
| Planity, Salonkee (EÚ) | ❓ | Doplnené fact-checkom. Nepreverené. |
| Fresha | 🟡 | Fact-check uvádza živé CZ listingy. Tu nepreverené. |
| Calendly, Acuity, Cal.com, SimplyBook.me, Setmore | ❓ v SK/CZ | Globálne nástroje. Lokálna podpora nie je overená. |
| Reservatic, Notado, MojaRezervácia, iSport System (SK/CZ) | ❓ | Uvedené v kritike reportu, nepreverené. Zaradiť do ďalšieho prieskumu. |
| Microsoft Bookings, Google Appointment Schedules, WordPress Amelia | ❓ | Lacné alternatívy z kritiky reportu. Nepreverené: cena, lokálna prítomnosť, funkcie. | — |
| Square, Booksy, Treatwell, Vagaro, Doctolib, Jane | ❓ | Viď tabuľku bodov vyššie. |

**Záver:** Lokálni hráči (Bookio, Salona, Reservio, Anolla, Reenio, Reservanto) sú hlavná konkurencia v SK/CZ. Ich cenové údaje a funkcie treba overiť priamo na stránkach pred rozhodnutím o cenníku.

## 4. Funkcie

### Table-stakes (prítomné u väčšiny hráčov, z výskumu)
Online rezervácia 24/7 · embed alebo odkaz · viac zamestnancov · pripomienky e-mailom · záznamy klientov · zálohy alebo online platba · čakacia listina · základná analytika · synchronizácia kalendára · SK/CZ platba QR (Pay by Square na faktúrach) · GDPR základy (DPA, súhlas).

### Diferenciátory (kandidáti, mapované na backlog)
- Vlastníctvo dát a bezplatný export → **OPS-9**
- Zdroje a kapacita za SMB cenu → **F-1**
- WhatsApp rezervácie a pripomienky → **F-17**, **F-12**
- Hlasový agent mimo otváracích hodín → **F-18** (náklady a právo overiť)
- SK/CZ fiškálne a daňové vrstvy → **F-19**, **F-20**, **F-25**, **F-26**, **LEG-1**
- Prístupnosť podľa EAA → **F-21**
- Vernostné karty a odporúčací program → **F-27** (nový)
- POS a zásoby pri rezervácii → **F-28** (nový, závisí od vertikály)
- Zdravotnícky režim → **F-29** (nový, len po rozhodnutí vlastníka)
- Voliteľný marketplace s nízkou províziou → **F-30** (nový, len po rozhodnutí vlastníka)

### Trendy 2025–2026 (sekundárne dôkazy, 🔬)
AI asistenti v rezerváciách, hlasové rezervácie, rezervácie v messaging aplikáciách, predikcia neúčasti, dynamické ceny. Každý trend musí prejsť validáciou pred implementáciou.

## 5. Body pre právnika

1. **eKasa:** ktoré tenant služby spadajú pod zákon 384/2025 Z. z. po novele 30/2026 Z. z. a aké výnimky platia (§ 3 ods. 2 písm. b). Má produkt vlastný certifikovaný adaptér, partnera, alebo len upozornenie? (LEG-1)
2. **Faktúry a doklady SK/CZ:** limity zjednodušeného dokladu a eKasa dokladov (100 € / 1 000 € / 1 600 € / 400 € — konflikt), obsah dokladu, DPH prah CZ (dva prahy, nerezidenti, OSS).
3. **GDPR:** rola platformy (procesor alebo spoločný správca) najmä pri agregácii dát naprieč tenantmi a pri trénovaní AI modelov. Retencia rezervačných dát. Lehota žiadostí dotknutých osôb (1 mesiac).
4. **Zdravotné údaje** (čl. 9 GDPR): ak sa rozhodne pre zdravotnícku vertikálu, výslovný súhlas, DPA a hosting.
5. **EAA:** či sa rezervačný tok tenanta považuje za službu v pôsobnosti, výnimka pre mikropodniky a zodpovednosť medzi widgetom platformy a webom tenanta.
6. **Spotrebiteľské pravidlá:** odstúpenie 14 dní a výnimka pre služby na konkrétny termín, storno poplatky a zálohy, povinné predzmluvné informácie, zverejnenie dynamických cien.
7. **EET 2.0:** potvrdiť vyhlásenie v Sbírce zákonů a účinnosť. Zatiaľ je to sledovanie rizika, nie povinnosť.
   Rozsah: platby pri osobnom kontakte vrátane kariet a QR (podľa návrhu). Pre salón s kartovou platbou na mieste je to priamo relevantné.
8. **e-Faktúra SK:** overiť znenie zákona a úlohu „Digitálny poštár“ z oficiálnych zdrojov, rozsah povinnosti pre neplatiteľov DPH a formát pre Peppol.

## 6. Rozhodnutia vlastníka (doplnené do SOURCE_OF_TRUTH sekcia 7)

1. Prvý vertical: beauty/barber, wellness/fitness, kliniky, remeslá, alebo všeobecné služby.
2. Marketplace: áno (voliteľný, nízka provízia), alebo nie.
3. eKasa: vlastný adaptér, partner, alebo len upozornenie tenantov.
4. Zdravotné údaje: uchovávať, alebo len termín a kontakt.
5. Platobný model: vlastné napojenie (Stripe a lokálne terminály), alebo partner (SumUp, GoPay, Comgate).
6. Cieľový tenant: solo, 2–10 zamestnancov, viac lokalít, alebo franchise.
7. Priorita: najnižšia cena, lokálna compliance, alebo prevádzková hĺbka.
8. Self-hosted alebo on-prem variant: áno, alebo nie.
9. Migračné zdroje na prvý deň.
10. MVP kanály: Google, Instagram, WhatsApp, telefón.

## 7. Ďalší postup

1. **LEG-1** (právna analýza eKasa): najvyššia priorita pre SK tenantov, zákon platí od 1. 1. 2026.
2. Overiť priamo na oficiálnych stránkach: Square Appointments, Booksy, Treatwell, Doctolib, Vagaro (SK/CZ dostupnosť) a cenníky lokálnych hráčov.
3. Validovať položky 🔬 krátkym prieskumom: rozhovory s 10 salónmi alebo klinikami v SK/CZ.
4. Štvrťročne aktualizovať mapu konkurencie (ceny, AI funkcie, legislatíva).
