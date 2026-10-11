# Source of Truth: Mistral | BOOking (NEXIFY TECH CENTER)

Verzia 1.0 · 2026-10-11 · Vlastník produktu: youh4ck3dme

Tento dokument je jediný zdroj pravdy pre produkt, architektúru a proces.
Pri konflikte s kódom, README alebo starou dokumentáciou platí tento dokument.
Ak je niečo nejasné, spýtaj sa vlastníka. Nerozhoduj sám.

---

## 1. Produkt a cieľ

- **Čo to je:** multi-tenant white-label booking SaaS. Každý klient (tenant) má vlastnú značku, služby, pracovnú dobu, jazyk a tím.
- **Cieľ:** najlepší booking systém pre malé a stredné podniky v SK a CZ, potom v celej EÚ. Vyhráva na konverzii rezervácií, na nižšej neúčasti (no-show) a na jednoduchosti pre klienta aj pre tím.
- **Mimo scope (kým vlastník nerozhodne):** účtovníctvo, ERP, pokladňa, skladové hospodárstvo.

## 2. Ciele kvality

Sú to ciele, nie namerané hodnoty. Každý sa overí pred releasom.

| Oblasť | Cieľ | Ako overiť |
|---|---|---|
| Rezervácia | Z výberu služby na potvrdenie ≤ 3 kroky na mobile, bez povinnej registrácie | Manuálny test + analytika krokov |
| Konflikty | Žiadna dvojitá rezervácia | DB constraint (EXCLUDE) + SQL test |
| Izolácia tenantov | Tenant A nevidí dáta tenantu B | RLS test pre každú novú tabuľku |
| Prístupnosť | WCAG 2.2 AA na verejnej rezervácii a v admin paneli | axe-core v CI (A11Y-1) |
| Výkon | Lighthouse mobile ≥ 90 na `/book` | Lighthouse v CI (PERF-1) |
| Lokalizácia | sk, cs, en. Texty z tenant locale, nie natvrdo | Kontrola pri review |
| Bezpečnosť | OWASP ASVS L2 pre auth a API | Security review pred releasom |

## 3. Architektúra (stav dnes)

- **Frontend:** Next.js 14.2.35 (App Router), React 18, TypeScript, Tailwind a vlastné CSS.
- **Backend:** Supabase (Postgres, Auth, RLS). Logika rezervácií je v RPC `create_booking`, `cancel_booking`, `get_booked_slots`. Sú to SECURITY DEFINER funkcie s `search_path = ''`.
- **AI:** asistent rezervácií cez Mistral (`@ai-sdk/mistral`, route `/api/chat`). AI texty notifikácií majú fallback na statickú šablónu.
- **Notifikácie:** Resend. Tabuľka `notification_deliveries`. Pripomienky spúšťa server cez `NOTIFICATION_CRON_SECRET`.
- **Monorepo:** pnpm + turbo. Balíky v `packages/@repo/*`.
- **Testy:** vitest (unit), SQL test v `supabase/tests`, Playwright (E2E, zatiaľ nie v CI).

## 4. Nepremenné pravidlá

### Bezpečnosť
1. Identitu používateľa na serveri zisťuj len cez `supabase.auth.getUser()`. Nikdy `getSession()` na serveri.
2. Klient nikdy neposiela `user_id`. Identitu berie RPC z `auth.uid()`.
3. Service-role kľúč je len na serveri. Nikdy v klientskom bundle, v logoch ani v commite.
4. Každá SECURITY DEFINER funkcia má `SET search_path = ''` a plne kvalifikované názvy. EXECUTE dostane len rola, ktorá ju potrebuje. Interné rutiny nie sú dostupné pre `anon` ani `authenticated`.
5. Žiadne tajomstvá v repozitári. Testovacie heslá generuj za behu.
6. Nový endpoint: validácia vstupu (zod), autorizácia, limit rýchlosti.

### Dáta a databáza
7. Migrácie sú **append-only**. Aplikovanú migráciu neupravuj. Oprava = nová migrácia (014, 015, ...).
8. Každá zmena schémy má test v `supabase/tests` s aserciami, ktorý beží v transakcii s rollbackom.
9. Chybové kódy sú súčasť kontraktu: konflikt termínu = `23P01`, neplatný rozsah = `23514`. Aplikácia mapuje chyby podľa existujúceho textu, takže texty chýb sa nemenia bez potreby.
10. Každá nová tabuľka v `public` má zapnuté RLS, politiky a test izolácie.

### Kód
11. Novú závislosť pridaj len s dôvodom v popise PR.
12. TypeScript v strict režime. Nový `any` iba s komentárom prečo.
13. Minimálny diff: rieš zadanú položku, neprepisuj okolie.

## 5. Proces a git

- Vývoj len na feature vetvách. **Nikdy nepushuj na `main`.** PR nemerguje nikto bez vlastníka.
- **Gate pred každým pushom:**
  ```bash
  pnpm lint
  cd apps/web && npx tsc --noEmit
  pnpm test
  pnpm build
  ```
  Pri zmene databázy navyše spusti `supabase/tests/booking_concurrency_verification.sql` na Postgres 16 s migráciami 001 až najnovšia.
- Pred tvrdením „hotovo“ over spustením (build, smoke test, SQL test). Čítanie kódu nestačí.
- Force-push a prepisovanie histórie zdieľanej vetvy sa nerobia. Opravu rob novým commitom.
- PR: draft. Popis obsahuje ID položky z BACKLOG.md, zoznam overení a zoznam toho, čo sa neoverilo.
- Commit: `type(scope): popis`, s attribution riadkami podľa session.

## 6. Backlog

- Jediný zoznam úloh je `docs/BACKLOG.md`. Každá práca má ID.
- Postupuj podľa priorít P0 → P1 → P2 → P3. Jedna položka = jeden PR, ak to ide.
- Pri dokončení zmeň status v `BACKLOG.md` v tom istom PR.
- Nový nápad mimo backlogu nekóduj. Zapíš ho do sekcie „Nápady“ v `BACKLOG.md`.
- Položky P3 (diferenciátory) sa nesmú začať bez validácie hypotézy (výstup z prieskumu konkurencie a právnej kontroly).

## 7. Rozhodnutia vlastníka

Codex ani iný agent sa ich nesmie zmocniť. Pri narazení sa najprv spýtaj.

- Platby: či sú v prvom vydaní a ktorá brána (Stripe, GoPay, iná).
- Custom domény tenantov: v scope prvého vydania, alebo odstrániť z dokumentácie.
- Prvý trh: SK, CZ, SK+CZ, alebo celá EÚ.
- Cieľové prostredie: pilot, alebo reálni zákazníci s osobnými údajmi.
- Next.js: zostať na 14.2.x, alebo ísť na 15.
- Cenník a balíky produktu.
- Právne texty (VOP, GDPR, zásady ochrany súkromia). Agent smie navrhnúť, schváliť ich môže len právnik.
- Správanie pri prekročení limitov (napr. pri no-show poplatku).

## 8. Zakázané

- Čítať, vypisovať alebo commitovať tajomstvá a obsah `.env` s hodnotami.
- Obchádzať RLS (service-role v klientskom kóde), vypínať overovanie TLS, unsetovať `HTTPS_PROXY`.
- Mazať dáta v produkčnej DB, pauzovať alebo obnovovať Supabase projekty, meniť nastavenia Vercelu bez schválenia.
- Posielať e-maily alebo SMS skutočným zákazníkom mimo testovacích účtov.
- Tvrdiť, že niečo funguje, ak si to nespustil.

## 9. Definícia hotového (DoD)

- Prejde gate (sekcia 5).
- Nová logika má test. Zmena schémy má SQL test.
- Dotknutá dokumentácia je aktualizovaná.
- Status v `BACKLOG.md` je aktualizovaný.
- Popis PR obsahuje overenia a neoverené časti.

## 10. Stav k 2026-10-11

- Hotové: SEC-1 (Next 14.2.35), SEC-2 (`getUser`), odstránené natvrdo testovacie heslo, DB hardening (migrácia 013).
- Blokery: `main` sa nebuildí (`src/lib/leads/lead.service.server.ts`), GitGuardian check na PR #4 padá, Lint na PR #4 ešte nie je potvrdený ako zelený.
- Zdroj úloh a detailný stav: `docs/BACKLOG.md`.
