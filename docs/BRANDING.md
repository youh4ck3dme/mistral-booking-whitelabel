# B1 · Branding inventory and name decision

## Decision (Erik, 2026-11-26, Europe/Bratislava)

**Source:** Erik confirmed this in the Booking Systémy chat on 2026-11-26 at 23:10 (UTC+1 / Europe/Bratislava) with the message `VRAT NEXIFY`, after being asked whether the final name should be NEXIFY and whether to restore the original NEXIFY home page (option A). That is the owner decision recorded here.

- **Final name: NEXIFY.** Wordmark and product: NEXIFY (with the descriptive suffix "Booking" in page titles, e.g. "NEXIFY Booking"). Legal/operator name stays **NEXIFY TECH CENTER** on terms, privacy and the footer.
- **Option A implemented:** the Bookio home page in `apps/web/app/page.tsx` is restored to the NEXIFY landing from `57f0e2e` (existing `components/landing/*`). `www.bookio.com` is removed from `apps/web/next.config.js` `images.remotePatterns`.
- After this change, `git grep -i bookio -- apps/web` is empty. Remaining mentions of Bookio outside the app are historical (`INTEGRITY_TEST_REPORT.md` commit notes) and competitive research (`docs/MARKET_RESEARCH.md:53,65`, where Bookio is listed as a SK competitor). Those stay.


Base: `origin/feat/whitelabel-nextjs-platform` @ `06bc965`. Generated with a case-sensitive scan of tracked files (`Bookio|bookio|BOOKIO`, `NEXIFY|Nexify|nexify`, `BOOking`), excluding `pnpm-lock.yaml` and binaries.

## Summary

| Brand | Category | Lines |
|---|---|---|
| Bookio | UI (user-facing) | 31 |
| Bookio | config/code | 1 |
| Bookio | docs | 4 |
| Mistral\|BOOking | docs | 2 |
| NEXIFY | UI (user-facing) | 52 |
| NEXIFY | config/code | 47 |
| NEXIFY | docs | 52 |
| NEXIFY | tests | 20 |

Key facts:

- **Bookio appears in exactly one user-facing file, `apps/web/app/page.tsx` (the `/` home page, 31 lines), plus one image host in `apps/web/next.config.js:65`.** It was introduced by `b81892c` and `06bc965` (2026-10-14/15) and replaced the earlier NEXIFY landing (`57f0e2e`).
- That page hotlinks the logo and images from `www.bookio.com`, links "Prihlásiť sa" to `services.bookio.com`, and shows four testimonials that name Bookio. Bookio is listed as a local competitor in `docs/MARKET_RESEARCH.md:53,65`.
- Side finding (measured with `next start`, `GET /` → 200): the Bookio home page is a client component with an artificial 1.5 s loading state, so the server HTML of `/` contains only "Loading..." and no product text (SEO and no-JS users see nothing). Option A (implemented below) also fixes this.
- Every other user-facing surface (app shell metadata, PWA manifest, auth layout, 404, privacy, terms, platform admin, tenant pages, ICS export, landing components) already says NEXIFY.
- Inside NEXIFY there are three variants: `NEXIFY` (wordmark), `NEXIFY TECH CENTER` (company/legal and `<title>`), `NEXIFY Booking` (product title in the pre-Bookio landing). `docs/SOURCE_OF_TRUTH.md` is titled "Mistral | BOOking (NEXIFY TECH CENTER)".

## Proposal (accepted): one name = **NEXIFY**

- Wordmark and product: **NEXIFY** (descriptive suffix "Booking" where context needs it, e.g. page titles: "NEXIFY Booking").
- Legal/operator name stays **NEXIFY TECH CENTER** on terms/privacy/footer (company, not a second brand).

Reasoning:

1. It is already the brand on ~all user-facing surfaces and in technical identifiers (`nexify.sk` routing, storage keys, SW cache name, ICS `PRODID`, ESLint plugin). Switching to anything else touches >150 lines; staying on NEXIFY means only the home page changes.
2. "Bookio" is the trademark of an existing SK competitor (bookio.com). Using its name, logo, hotlinked assets and its customers' testimonials on our production home page is a trademark/unfair-competition and copyright risk, not a style choice. This should be removed regardless of the final name.
3. A white-label product needs a neutral platform brand that tenants' customers rarely see; NEXIFY already fills that role.

## Implementation

Option A is in this PR (second commit, after the inventory). A plain text swap Bookio → NEXIFY was rejected because the old page hotlinked the competitor's logo, images, login URL and testimonials.

The inventory below is the scan of the pre-decision tree at `06bc965` (plus the first commit of this branch, which only added this document). The `apps/web/app/page.tsx` and `apps/web/next.config.js` rows no longer exist in the current tree.

## Inventory: Bookio (all occurrences at 06bc965, before option A)

| Category | file:line | Text |
|---|---|---|
| docs | `INTEGRITY_TEST_REPORT.md:140` | 2. **b81892c** - feat: new home page with Bookio branding and placeholder images |
| docs | `INTEGRITY_TEST_REPORT.md:141` | - Nova home page s Bookio dizajnom |
| UI (user-facing) | `apps/web/app/page.tsx:7` | * Bookio Home Page - Complete Rebuild |
| UI (user-facing) | `apps/web/app/page.tsx:20` | logo: 'https://www.bookio.com/assets/img/logo-white.svg', |
| UI (user-facing) | `apps/web/app/page.tsx:21` | heroScheduler: 'https://www.bookio.com/assets/img/bento/main.png?v=1', |
| UI (user-facing) | `apps/web/app/page.tsx:22` | schedulerFallback: 'https://www.bookio.com/assets/img/features/scheduler.jpg', |
| UI (user-facing) | `apps/web/app/page.tsx:23` | consultation: 'https://www.bookio.com/assets/img/bento/consultation.png?v=1', |
| UI (user-facing) | `apps/web/app/page.tsx:24` | handshake: 'https://www.bookio.com/assets/img/bento/handshake.png?v=1', |
| UI (user-facing) | `apps/web/app/page.tsx:25` | creditCards: 'https://www.bookio.com/assets/img/credit-cards.png', |
| UI (user-facing) | `apps/web/app/page.tsx:27` | beauty: 'https://www.bookio.com/storage/files/8XqoSYfMc91yNV4hwL5C4kSfcFnsw69MmDGKNB9J.webp', |
| UI (user-facing) | `apps/web/app/page.tsx:28` | barber: 'https://www.bookio.com/storage/files/oTP3ZMpFGNhELnPCFyDabHUrBpA9Rm8DQWEAL28V.png', |
| UI (user-facing) | `apps/web/app/page.tsx:29` | gastro: 'https://www.bookio.com/storage/files/w1dOOMSidGUU8NDbq8vanWhZIdledGnrVNWtnwTj.jpg', |
| UI (user-facing) | `apps/web/app/page.tsx:30` | health: 'https://www.bookio.com/storage/files/sTh7viCrM97Ve2aqOoSDm5JGI5qty0szXE15RBx8.webp', |
| UI (user-facing) | `apps/web/app/page.tsx:31` | cosmetic: 'https://www.bookio.com/storage/files/UO37bgjRg5ZXHCvkP5vGAnquz3BoWVSfYi5XVmb5.webp', |
| UI (user-facing) | `apps/web/app/page.tsx:32` | fitness: 'https://www.bookio.com/storage/files/frESRVIGmup2p78kUrWfnDJc7qpJ4Ee2bgtAWtgf.webp', |
| UI (user-facing) | `apps/web/app/page.tsx:109` | quote: '"Zjednodušenie pracovného chaosu" Bookio má skvelý tím ľudí, Martina mi vždy bol...', |
| UI (user-facing) | `apps/web/app/page.tsx:113` | quote: 'S bookiom spolupracujeme už pol roka a nemôžeme si tento rezervačný systém vyna...', |
| UI (user-facing) | `apps/web/app/page.tsx:121` | quote: '"Najefektívnejší systém na trhu" Rezervačný systém Bookio prináša nášmu klientovi...', |
| UI (user-facing) | `apps/web/app/page.tsx:171` | alt="Bookio Logo" |
| UI (user-facing) | `apps/web/app/page.tsx:224` | href="https://services.bookio.com/auth/login?targetUri=%2Fclient-admin&lang=sk" |
| UI (user-facing) | `apps/web/app/page.tsx:330` | href="https://services.bookio.com/auth/login?targetUri=%2Fclient-admin&lang=sk" |
| UI (user-facing) | `apps/web/app/page.tsx:364` | Venujte sa svojmu biznisu. A o rezervácie, správu klientov a administráciu sa postará Bookio. |
| UI (user-facing) | `apps/web/app/page.tsx:393` | alt="Bookio Rezervačný systém rozhranie" |
| UI (user-facing) | `apps/web/app/page.tsx:422` | Bookio vám pomáha v biznise vyhrať. Každý deň. |
| UI (user-facing) | `apps/web/app/page.tsx:652` | href="https://services.bookio.com/auth/login?targetUri=%2Fclient-admin&lang=sk" |
| UI (user-facing) | `apps/web/app/page.tsx:680` | Za Bookiom stoja technológie. Aj ľudia. Aplikácia, ktorá šetrí čas. Tím, ktorý rieši vaše problémy. |
| UI (user-facing) | `apps/web/app/page.tsx:705` | alt="Bookio" |
| UI (user-facing) | `apps/web/app/page.tsx:756` | Už máte svoj účet v Bookio? Prihláste sa do svojej administrácie: |
| UI (user-facing) | `apps/web/app/page.tsx:759` | href="https://services.bookio.com/auth/login?targetUri=%2Fclient-admin&lang=sk" |
| UI (user-facing) | `apps/web/app/page.tsx:762` | Prihlásiť sa do Bookio |
| UI (user-facing) | `apps/web/app/page.tsx:769` | © {new Date().getFullYear()} Bookio. Všetky práva vyhradené. Rezervačný systém pre salóny, gastro a služby. |
| UI (user-facing) | `apps/web/app/page.tsx:772` | <a href="https://www.bookio.com/sk" className="hover:text-slate-400">Podmienky používania</a> |
| UI (user-facing) | `apps/web/app/page.tsx:774` | <a href="https://www.bookio.com/sk" className="hover:text-slate-400">Ochrana osobných údajov</a> |
| config/code | `apps/web/next.config.js:65` | hostname: 'www.bookio.com', |
| docs | `docs/MARKET_RESEARCH.md:53` | \| Bookio (SK), Salona (CZ), Anolla (CZ), Reenio (CZ) \| 🟡 lokálne \| Z pôvodného výskumu, nepreverené tu. \| |
| docs | `docs/MARKET_RESEARCH.md:65` | **Záver:** Lokálni hráči (Bookio, Salona, Reservio, Anolla, Reenio, Reservanto) sú hlavná konkurencia v SK/CZ. Ich ceny a funkcie treba over |

## Inventory: NEXIFY on user-facing surfaces (`apps/web/app`, `components`, `public`)

| file:line | Text |
|---|---|
| `apps/web/app/(auth)/layout.tsx:28` | <span className="premium-brand-word">NEXIFY</span> |
| `apps/web/app/(marketing)/layout.tsx:4` | title: 'NEXIFY TECH CENTER - White-Label Booking SaaS', |
| `apps/web/app/404/page.tsx:7` | title: '404 \| NEXIFY TECH CENTER', |
| `apps/web/app/404/page.tsx:23` | <span className={styles.logoWord}>NEXIFY</span> |
| `apps/web/app/[tenantSlug]/admin/onboarding-checklist.tsx:49` | const storageKey = `nexify_onboarding_dismissed_${tenantId}`; |
| `apps/web/app/[tenantSlug]/admin/onboarding-checklist.tsx:50` | const testKey = `nexify_onboarding_tested_${tenantId}`; |
| `apps/web/app/[tenantSlug]/book/success/success-view-client.tsx:73` | 'PRODID:-//NEXIFY//Booking Platform//SK', |
| `apps/web/app/[tenantSlug]/book/success/success-view-client.tsx:77` | `UID:${bookingId}@nexify.sk`, |
| `apps/web/app/[tenantSlug]/layout.tsx:123` | <span>Booking-first experience on the shared NEXIFY platform.</span> |
| `apps/web/app/[tenantSlug]/page.tsx:127` | {tenantContext.tenant.name} runs on the shared NEXIFY booking platform with tenant-aware |
| `apps/web/app/booking-landing.tsx:78` | <span className={styles.logoWord}>NEXIFY</span> |
| `apps/web/app/booking-landing.tsx:299` | <span className={styles.logoWord}>NEXIFY</span> |
| `apps/web/app/booking-landing.tsx:335` | <span>© 2026 NEXIFY TECH CENTER. All rights reserved.</span> |
| `apps/web/app/cookie-consent.tsx:6` | const CONSENT_KEY = 'nexify-cookie-consent'; |
| `apps/web/app/layout.tsx:17` | applicationName: 'NEXIFY TECH CENTER', |
| `apps/web/app/layout.tsx:18` | title: 'NEXIFY TECH CENTER - White-Label Booking', |
| `apps/web/app/layout.tsx:33` | title: 'NEXIFY', |
| `apps/web/app/manifest.ts:5` | name: 'NEXIFY TECH CENTER', |
| `apps/web/app/manifest.ts:6` | short_name: 'NEXIFY', |
| `apps/web/app/platform/layout.tsx:36` | <span className="premium-brand-word">NEXIFY</span> |
| `apps/web/app/platform/page.tsx:32` | <h1 className="premium-title premium-title--medium">NEXIFY control center</h1> |
| `apps/web/app/privacy/page.tsx:4` | title: 'Ochrana súkromia — NEXIFY TECH CENTER', |
| `apps/web/app/privacy/page.tsx:5` | description: 'Informácie o spracovaní osobných údajov a cookie politike platformy NEXIFY.', |
| `apps/web/app/privacy/page.tsx:15` | Platforma NEXIFY rešpektuje vaše súkromie a spracúva osobné údaje v súlade s GDPR |
| `apps/web/app/privacy/page.tsx:23` | Prevádzkovateľom platformy NEXIFY TECH CENTER je jej vlastník. Pre otázky týkajúce sa |
| `apps/web/app/terms/page.tsx:5` | title: 'Všeobecné obchodné podmienky — NEXIFY TECH CENTER', |
| `apps/web/app/terms/page.tsx:6` | description: 'Všeobecné obchodné podmienky používania platformy NEXIFY TECH CENTER.', |
| `apps/web/app/terms/page.tsx:17` | rezervačnej a prevádzkovej platformy NEXIFY TECH CENTER. |
| `apps/web/app/terms/page.tsx:25` | <strong>Poskytovateľ platformy:</strong> Prevádzkovateľ technologického riešenia NEXIFY TECH CENTER. |
| `apps/web/app/theme-toggle.tsx:9` | const STORAGE_KEY = 'nexify-theme'; |
| `apps/web/app/theme-toggle.tsx:20` | 'meta[name="theme-color"][data-nexify-dynamic]' |
| `apps/web/app/theme-toggle.tsx:26` | themeMeta.setAttribute('data-nexify-dynamic', 'true'); |
| `apps/web/components/landing/AiWhiteLabelHighlight.tsx:44` | <span className="text-emerald-400">✓</span> Vlastná subdoména alebo slug (napr. app.nexify.sk/vas-salon/book) |
| `apps/web/components/landing/FaqSection.tsx:25` | 'Áno, presne tak. Na rozdiel od marketplace platforiem, ktoré si berú 10 % až 25 % z každej rezervácie, NEXIFY funguje na princípe čistého B |
| `apps/web/components/landing/FaqSection.tsx:37` | 'Vaši zákazníci vidia výhradne vašu firemnú identitu. V administrácii si nastavíte vlastné logo, primárnu a sekundárnu farbu, popisy a konta |
| `apps/web/components/landing/HeroLiveSimulator.tsx:37` | domain: 'app.nexify.sk/elegance/book', |
| `apps/web/components/landing/LandingFooter.tsx:11` | <span className="premium-brand-word text-xl">NEXIFY</span> |
| `apps/web/components/landing/LandingFooter.tsx:120` | © {new Date().getFullYear()} NEXIFY TECH CENTER. Všetky práva vyhradené. |
| `apps/web/components/landing/LandingHeader.tsx:23` | <span className="premium-brand-word">NEXIFY</span> |
| `apps/web/components/landing/PricingWithRoiCalculator.tsx:26` | // NEXIFY Pro tier is the standard SaaS cost (55 €/month annual or 69 €/month monthly) |
| `apps/web/components/landing/PricingWithRoiCalculator.tsx:27` | const nexifyMonthlyCost = isAnnual ? 55 : 69; |
| `apps/web/components/landing/PricingWithRoiCalculator.tsx:28` | const nexifyAnnualCost = nexifyMonthlyCost * 12; |
| `apps/web/components/landing/PricingWithRoiCalculator.tsx:31` | const annualSavings = Math.max(0, marketplaceAnnualFee - nexifyAnnualCost); |
| `apps/web/components/landing/PricingWithRoiCalculator.tsx:109` | s fixným modelom NEXIFY. |
| `apps/web/components/landing/PricingWithRoiCalculator.tsx:178` | {/* Box 2: NEXIFY Fix Cost */} |
| `apps/web/components/landing/PricingWithRoiCalculator.tsx:181` | <span>NEXIFY (0 % provízia)</span> |
| `apps/web/components/landing/PricingWithRoiCalculator.tsx:185` | {nexifyMonthlyCost} € |
| `apps/web/components/landing/ProblemSolution.tsx:8` | goodLabel: 'NEXIFY riešenie (100% White-Label)', |
| `apps/web/components/landing/ProblemSolution.tsx:17` | goodLabel: 'NEXIFY riešenie (Databázové zámky)', |
| `apps/web/components/landing/ProblemSolution.tsx:26` | goodLabel: 'NEXIFY riešenie (Samoobslužný odkaz)', |
| `apps/web/components/landing/ProblemSolution.tsx:74` | {/* The Good Way (NEXIFY) */} |
| `apps/web/public/sw.js:1` | const CACHE_NAME = 'nexify-shell-v2'; |

## Inventory: other occurrences (code, tests, docs, config) — counts per file

| Brand | File | Lines |
|---|---|---|
| Mistral\|BOOking | `docs/BACKLOG.md` | 1 |
| Mistral\|BOOking | `docs/SOURCE_OF_TRUTH.md` | 1 |
| NEXIFY | `.github/workflows/validate-navigation.yml` | 7 |
| NEXIFY | `IMPLEMENTATION_SUMMARY.md` | 4 |
| NEXIFY | `INTEGRITY_TEST_REPORT.md` | 3 |
| NEXIFY | `LOGICAL_TEST_SEQUENCE.md` | 1 |
| NEXIFY | `NAVIGATION_VALIDATION.md` | 28 |
| NEXIFY | `README.md` | 1 |
| NEXIFY | `TESTING_CHECKLIST.md` | 1 |
| NEXIFY | `apps/web/.env.example` | 2 |
| NEXIFY | `apps/web/middleware.ts` | 1 |
| NEXIFY | `apps/web/src/lib/api-v1/api-v1.test.ts` | 1 |
| NEXIFY | `apps/web/src/lib/api-v1/auth.ts` | 2 |
| NEXIFY | `apps/web/src/lib/env/validator.test.ts` | 3 |
| NEXIFY | `apps/web/src/lib/env/validator.ts` | 5 |
| NEXIFY | `apps/web/src/lib/notifications/client.ts` | 1 |
| NEXIFY | `apps/web/src/lib/notifications/templates.test.ts` | 1 |
| NEXIFY | `apps/web/src/lib/notifications/templates.ts` | 1 |
| NEXIFY | `apps/web/src/lib/routing/subdomain.test.ts` | 9 |
| NEXIFY | `apps/web/src/lib/routing/subdomain.ts` | 5 |
| NEXIFY | `docs/ARCHITECTURE.md` | 3 |
| NEXIFY | `docs/BLUEPRINT_AUTOOPS_BIZAGENT.md` | 2 |
| NEXIFY | `docs/DEPLOYMENT.md` | 4 |
| NEXIFY | `docs/ROUTES_AND_NAVIGATION.md` | 4 |
| NEXIFY | `docs/SOURCE_OF_TRUTH.md` | 1 |
| NEXIFY | `package.json` | 1 |
| NEXIFY | `scripts/eslint-plugin-nexify-routes/index.js` | 11 |
| NEXIFY | `scripts/eslint-plugin-nexify-routes/package.json` | 4 |
| NEXIFY | `scripts/validate-routes.js` | 2 |
| NEXIFY | `scripts/validate-routes/package.json` | 4 |
| NEXIFY | `supabase/migrations/006_platform_admins.sql` | 1 |
| NEXIFY | `test-implementation.sh` | 2 |
| NEXIFY | `tests/e2e/apple/ios.spec.ts` | 1 |
| NEXIFY | `tests/e2e/integration/pwa.spec.ts` | 2 |
| NEXIFY | `tests/e2e/utils/helpers.ts` | 1 |
