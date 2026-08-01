# 🧭 NEXIFY Navigation & Routes Validation System

> **Kompletní systém pro validaci, testování a ověřování všech odkazů, rout a navigace v aplikaci NEXIFY TECH CENTER**

**Verze:** 1.0.0  
**Poslední aktualizace:** 19. červen 2026  
**Autoři:** Mistral Vibe + NEXIFY Team  

---

## 📋 Obsah

1. [Úvod](#-úvod)
2. [Architektura Systému](#-architektura-systému)
3. [Dokumentace Rout](#-dokumentace-rout)
4. [Automatizované Testy](#-automatizované-testy)
5. [ESLint Plugin](#-eslint-plugin)
6. [Validace Rout Script](#-validace-rout-script)
7. [GitHub Actions Workflow](#-github-actions-workflow)
8. [Použití](#-použití)
9. [Konfigurace](#-konfigurace)
10. [Řešení Problémů](#-řešení-problémů)
11. [Best Practices](#-best-practices)

---

## 🎯 Úvod

Tento systém poskytuje **komplexní řešení** pro zajištění toho, že všechny odkazy, routy a navigace v aplikaci **NEXIFY TECH CENTER** jsou správně nakonfigurovány a funkční.

### Proč je to důležité?

- 🔍 **Prevence chyb:** Odhaluje odkazy na neexistující stránky
- ✅ **Zajištění kvality:** Validuje všechny navigační cesty
- 🚀 **Rychlý vývoj:** Automatizuje testování navigace
- 📊 **Dokumentace:** Udržuje aktuální seznam všech rout
- 🔒 **Konzistence:** Zajišťuje jednotný přístup k routování

### Co systém obsahuje?

| Komponenta | Typ | Popis |
|------------|-----|--------|
| `docs/ROUTES_AND_NAVIGATION.md` | Dokumentace | Kompletní seznam všech rout a navigací |
| `cypress/e2e/navigation/*.cy.ts` | Testy | Cypress testy pro ověření navigace |
| `scripts/validate-routes.js` | Script | Node.js script pro validaci rout |
| `scripts/eslint-plugin-nexify-routes/` | ESLint Plugin | Plugin pro detekci problémů v kódu |
| `.github/workflows/validate-navigation.yml` | CI/CD | GitHub Actions workflow pro automatické spouštění |

---

## 🏗️ Architektura Systému

```
┌─────────────────────────────────────────────────────────────┐
│                    NAVIGATION VALIDATION SYSTEM                 │
├─────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                │
│  │   Dokumentace    │    │   Cypress Tests  │                │
│  │  ROUTES_AND_NAV  │    │  navigation/*.cy │                │
│  │                  │    │                  │                │
│  └──────────┬───────┘    └──────────┬───────┘                │
│             │                        │                         │
│             ▼                        ▼                         │
│  ┌─────────────────────────────────────────────────────┐     │
│  │                   VALIDATION LAYER                      │     │
│  │  ┌──────────────────┐    ┌──────────────────┐          │     │
│  │  │  ESLint Plugin   │    │  Route Validator  │          │     │
│  │  │  nexify-routes   │    │  validate-routes  │          │     │
│  │  │                  │    │                  │          │     │
│  │  └──────────┬───────┘    └──────────┬───────┘          │     │
│  │             │                        │                   │     │
│  └─────────────┼────────────────────────┼───────────────────┘     │
│                │                        │                         │
│                ▼                        ▼                         │
│  ┌─────────────────────────────────────────────────────┐     │
│  │                CODE ANALYSIS LAYER                     │     │
│  │  ┌──────────────────┐    ┌──────────────────┐          │     │
│  │  │  Static Analysis │    │  Pattern Matching │          │     │
│  │  │  (ESLint)        │    │  (Node.js)       │          │     │
│  │  └──────────────────┘    └──────────────────┘          │     │
│  └─────────────────────────────────────────────────────┘     │
│                        │                                         │
│                        ▼                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              SOURCE CODE (NEXIFY APP)                      │   │
│  │  apps/web/app/**/*.{tsx,ts}                                 │   │
│  │  apps/web/src/**/*.{tsx,ts}                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│                    REPORTING & OUTPUT                           │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐    ┌──────────────────┐                  │
│  │  Console Output  │    │  GitHub Actions  │                  │
│  │  (Terminal)      │    │  (CI/CD)         │                  │
│  └──────────────────┘    └──────────────────┘                  │
│  ┌──────────────────┐    ┌──────────────────┐                  │
│  │  Test Reports    │    │  Artifacts      │                  │
│  │  (JSON/XML)      │    │  (ZIP)           │                  │
│  └──────────────────┘    └──────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📖 Dokumentace Rout

### Hlavní Dokument

📄 **`docs/ROUTES_AND_NAVIGATION.md`**

Tento dokument obsahuje:
- ✅ Kompletní seznam všech rout v aplikaci
- 🗺️ Navigační mapování a flow diagramy
- 🔌 API endpointy
- 🎨 Vertikální routy
- 🔐 Autentizační flow
- ✅ Best practices pro routování
- ⚠️ Zjištěné problémy a jejich řešení
- 🧪 Testovací pokyny

### Aktualizace Dokumentace

Pokud přidáváte novou routu:

1. Přidejte ji do `docs/ROUTES_AND_NAVIGATION.md`
2. Aktualizujte `CONFIG.knownRoutes` v `scripts/validate-routes.js`
3. Aktualizujte ESLint plugin v `scripts/eslint-plugin-nexify-routes/index.js`

---

## 🧪 Automatizované Testy (Cypress)

### Testovací Soubory

📁 **`cypress/e2e/navigation/`**

- `index.cy.ts` - Hlavní vstupní bod
- `landing-page-navigation.cy.ts` - Testy hlavní stránky
- `auth-navigation.cy.ts` - Testy autentizačních stránek
- `tenant-navigation.cy.ts` - Testy tenant stránek
- `platform-navigation.cy.ts` - Testy platform admin stránek
- `complete-navigation-test.cy.ts` - Kompletní end-to-end testy

### Spuštění Testů

#### Lokální spuštění

```bash
# Nainstaluj závislosti
pnpm install

# Spusť vývojový server
pnpm dev

# Spusť Cypress testy v interaktivním módu
pnpm cypress open

# Spusť pouze navigační testy
pnpm cypress run --spec "cypress/e2e/navigation/**/*.cy.ts"

# Spusť s headless módu
pnpm cypress run --spec "cypress/e2e/navigation/**/*.cy.ts" --headless
```

#### Spuštění specifických testů

```bash
# Testování hlavní stránky
pnpm cypress run --spec "cypress/e2e/navigation/landing-page-navigation.cy.ts"

# Testování autentizace
pnpm cypress run --spec "cypress/e2e/navigation/auth-navigation.cy.ts"

# Testování tenant stránek
pnpm cypress run --spec "cypress/e2e/navigation/tenant-navigation.cy.ts"

# Kompletní test
pnpm cypress run --spec "cypress/e2e/navigation/complete-navigation-test.cy.ts"
```

### Testovací Scénáře

#### 1. **Landing Page Navigation**
- ✅ Logo odkazuje na `/`
- ✅ Header odkazy fungují
- ✅ Hero buttony vedou na správné stránky
- ✅ Vertical cards odkazují na správné tenanty
- ✅ Featured services mají správné odkazy
- ✅ Footer odkazy fungují

#### 2. **Auth Pages Navigation**
- ✅ Login → Signup navigace
- ✅ Login → Forgot Password navigace
- ✅ Signup → Login navigace
- ✅ Všechny odkazy směřují na existující routy

#### 3. **Tenant Pages Navigation**
- ✅ Tenant home → Booking page
- ✅ Booking → Tenant home
- ✅ Service cards → Booking with service param
- ✅ Portal odkazy fungují

#### 4. **Platform Admin Navigation**
- ✅ Platform dashboard odkazy
- ✅ New tenant form navigace
- ✅ Edit tenant form navigace
- ✅ Table action odkazy

#### 5. **End-to-End Flows**
- ✅ Landing → Login → Back → Landing
- ✅ Landing → Tenant → Booking → Back → Tenant
- ✅ Login → Signup → Login
- ✅ Landing → Vertical Service → Booking

### Cypress Konfigurace

Přidat do `cypress.config.ts`:

```typescript
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/navigation/**/*.cy.ts',
    setupNodeEvents(on, config) {
      // Zde můžete přidat custom plugins
    },
  },
});
```

---

## 🔍 ESLint Plugin

### Instalace

```bash
# Nainstaluj plugin
npm install --save-dev eslint-plugin-nexify-routes
```

### Konfigurace

Přidejte do `.eslintrc.json`:

```json
{
  "plugins": ["nexify-routes"],
  "extends": ["plugin:nexify-routes/recommended"],
  "rules": {
    "nexify-routes/valid-route": "error",
    "nexify-routes/absolute-path": "warn",
    "nexify-routes/prefer-next-link": "warn"
  }
}
```

### Dostupná Pravidla

#### 1. **`nexify-routes/valid-route`** (Error)
Detekuje odkazy na neexistující routy.

✅ **Platné:**
```tsx
<Link href="/login">Login</Link>
<Link href="/demo-clinic/book">Book</Link>
```

❌ **Neplatné:**
```tsx
<Link href="/terms">Terms</Link>  // /terms neexistuje
```

#### 2. **`nexify-routes/absolute-path`** (Warning)
Doporučuje používat absolutní pathy místo relativních.

✅ **Platné:**
```tsx
<Link href="/login">Login</Link>
```

⚠️ **Varování:**
```tsx
<Link href="login">Login</Link>  // Relativní path
```

#### 3. **`nexify-routes/prefer-next-link`** (Warning)
Doporučuje používat `<Link>` místo `<a>` pro vnitřní navigaci.

✅ **Platné:**
```tsx
<Link href="/about">About</Link>
```

⚠️ **Varování:**
```tsx
<a href="/about">About</a>  // Použití <a> místo <Link>
```

### Spuštění ESLintu

```bash
# Spusť ESLint s pluginem
npx eslint apps/web/app/**/*.{tsx,ts} --plugin nexify-routes

# Spusť s specifickými pravidly
npx eslint apps/web/app/**/*.{tsx,ts} \
  --plugin nexify-routes \
  --rule 'nexify-routes/valid-route: error' \
  --rule 'nexify-routes/absolute-path: warn' \
  --rule 'nexify-routes/prefer-next-link: warn'
```

---

## 🚀 Validace Rout Script

### Použití

```bash
# Spusť validaci všech rout
node scripts/validate-routes.js

# Nebo prostřednictvím pnpm
cd scripts/validate-routes
pnpm validate
```

### Výstup

```
🚀 NEXIFY Route Validator
🔍 Validuji všechny odkazy a routy v aplikaci...

📊 Výsledky Validace
──────────────────────────────────────

📈 Statistiky:
  Celkem souborů: 42
  Celkem odkazů: 156
  Platných odkazů: 155
  Neplatných odkazů: 1
  Známé problémy: 1
  Neznámé problémy: 0

❌ Nalezené Problémy:
──────────────────────────────────────

1. 🔴 apps/web/app/(auth)/signup/page.tsx:139
   Typ: anchor
   Odkaz: /terms
   Důvod: Známá neexistující routa
   Návrh: Vytvořte stránku /terms nebo změňte odkaz na existující routu

──────────────────────────────────────
❌ Validace selhala: 1 problémů
```

### Konfigurace Scriptu

V `scripts/validate-routes.js` můžete aktualizovat:

```javascript
const CONFIG = {
  srcDirectories: [
    // Adresáře pro prohledávání
  ],
  knownRoutes: [
    // Seznam známých rout
  ],
  knownTenants: [
    // Seznam známých tenantů
  ],
  knownBadRoutes: [
    // Seznam známých neexistujících rout
  ],
};
```

---

## 🌐 GitHub Actions Workflow

### Workflow Soubor

📄 **`.github/workflows/validate-navigation.yml`**

### Spouštění

Workflow se automaticky spustí:

1. **Na push:** do větví `main`, `develop`, `feat/whitelabel-nextjs-platform`
2. **Na pull request:** do větví `main`, `develop`
3. **Pouze při změně:** souborů v `apps/web/app/**` nebo `apps/web/src/**`

### Joby v Workflow

#### 1. **Validate Routes Script**
- ✅ Spouští `scripts/validate-routes.js`
- ✅ Validuje všechny odkazy v kódu
- ✅ Generuje report
- ⏱️ Timeout: 10 minut

#### 2. **Cypress Navigation Tests**
- ✅ Spouští Cypress testy pro navigaci
- ✅ Testuje všechny navigační cesty
- ✅ Generuje screenshots a videa
- ⏱️ Timeout: 15 minut

#### 3. **ESLint Route Checks**
- ✅ Spouští ESLint s pluginem nexify-routes
- ✅ Detekuje problémy v kódu
- ✅ Generuje lint report
- ⏱️ Timeout: 5 minut

#### 4. **Summary**
- ✅ Generuje souhrnný report
- ✅ Zobrazuje výsledky všech testů
- ✅ Poskytuje odkazy na artifacts
- ✅ Selže, pokud některý test selže

### Artefakty

Všechny workflow generují artefacts, které jsou k dispozici po skončení:

- **route-validation-report** - Výsledky validace rout
- **cypress-navigation-results** - Screenshots a videa z testů
- **eslint-routes-report** - ESLint report

### Příklady Výstupu

#### Úspěšné Spuštění

```markdown
# 🧭 Navigation Validation Summary

## 📊 Results

✅ **Route Validation**: PASSED

✅ **Cypress Navigation Tests**: PASSED

✅ **ESLint Route Checks**: PASSED

## 🔗 Artifacts

- [Route Validation Report](link)
- [Cypress Results](link)
- [ESLint Report](link)

## 💡 Next Steps

1. Check the artifacts for detailed reports
2. Fix any identified issues
3. Update the route documentation if new routes were added
```

#### Neúspěšné Spuštění

```markdown
# 🧭 Navigation Validation Summary

## 📊 Results

❌ **Route Validation**: FAILED

✅ **Cypress Navigation Tests**: PASSED

✅ **ESLint Route Checks**: PASSED

## 🔗 Artifacts

- [Route Validation Report](link)
- [Cypress Results](link)
- [ESLint Report](link)

## 💡 Next Steps

1. Check the artifacts for detailed reports
2. Fix any identified issues
3. Update the route documentation if new routes were added

❌ One or more validation checks failed!
```

---

## 🛠️ Použití

### Lokální Vývoj

#### 1. Validace všech rout

```bash
# Spusť validaci
node scripts/validate-routes.js

# Nebo prostřednictvím pnpm
cd scripts/validate-routes && pnpm validate
```

#### 2. Spuštění Cypress testů

```bash
# Nainstaluj závislosti
pnpm install

# Spusť vývojový server
pnpm dev

# Spusť testy
pnpm cypress run --spec "cypress/e2e/navigation/**/*.cy.ts"
```

#### 3. Spuštění ESLintu

```bash
# Spusť ESLint s pluginem
npx eslint apps/web/app/**/*.{tsx,ts} --plugin ./scripts/eslint-plugin-nexify-routes
```

### CI/CD Integrace

#### 1. Automatiké spouštění na PR

Workflow se automaticky spustí při vytvoření Pull Requestu do `main` nebo `develop` větve.

#### 2. Manuální spouštění

```bash
# Spusť workflow manuálně prostřednictvím GitHub UI
# Nebo pomocí GitHub CLI:
gh workflow run validate-navigation
```

#### 3. Lokální testování před commitem

Přidejte do `package.json`:

```json
{
  "scripts": {
    "validate:routes": "node scripts/validate-routes.js",
    "test:navigation": "cypress run --spec \"cypress/e2e/navigation/**/*.cy.ts\"",
    "lint:routes": "npx eslint apps/web/app/**/*.{tsx,ts} --plugin ./scripts/eslint-plugin-nexify-routes",
    "precommit": "pnpm validate:routes && pnpm lint:routes"
  }
}
```

Nastavte git hook:

```bash
# Vytvoř .husky/pre-commit
npm install husky --save-dev
npx husky install
npx husky add .husky/pre-commit "pnpm precommit"
```

---

## ⚙️ Konfigurace

### Aktualizace Seznamu Rout

Když přidáte novou routu do aplikace:

1. **Dokumentace:** Přidejte ji do `docs/ROUTES_AND_NAVIGATION.md`
2. **Validace:** Přidejte ji do `CONFIG.knownRoutes` v `scripts/validate-routes.js`
3. **ESLint:** Přidejte ji do seznamu v `scripts/eslint-plugin-nexify-routes/index.js`

### Přidání Nového Tenanta

Když přidáte nový tenant:

1. **Vertikální routy:** Přidejte do `apps/web/src/lib/booking/vertical-routing.ts`
2. **Konfigurace:** Přidejte do všech konfiguracích (CONFIG.knownTenants)
3. **Testy:** Aktualizujte testy, pokud je potřeba

### Úprava GitHub Actions

Workflow lze upravit v `.github/workflows/validate-navigation.yml`:

- Změnit větve pro spouštění
- Změnit timeouty
- Přidat/odebrat joby
- Změnit artefacts

---

## 🐛 Řešení Problémů

### Známé Problémy

#### 1. **Chybějící /terms stránka**

**Problém:** Signup stránka odkazuje na `/terms`, která neexistuje.

**Řešení:**

```bash
# Vytvořte novou stránku
mkdir -p apps/web/app/terms
cp apps/web/app/privacy/page.tsx apps/web/app/terms/page.tsx

# Upravte obsah
# Nebo změňte odkaz v signup stránce na /privacy
```

#### 2. **Placeholder odkazy v compute-landing**

**Problém:** Některé odkazy používají `#` jako placeholder.

**Řešení:** Nahraďte `#` konkrétními routami podle kontextu.

#### 3. **Cypress testy vyžadují databázi**

**Problém:** Některé testy mohou vyžadovat Supabase databázi.

**Řešení:** Použijte mockování v testech:

```typescript
// V testech použijte cy.intercept() pro mockování API volání
beforeEach(() => {
  cy.intercept('GET', '/api/*', { statusCode: 200, body: {} }).as('apiRequest');
});
```

### Časté Chyby

#### Chyba: "Cannot find module 'chalk'"

**Řešení:**
```bash
cd scripts/validate-routes
pnpm install
```

#### Chyba: "ESLint plugin not found"

**Řešení:** Zajistěte, že plugin je správně nainstalován a konfigurován.

#### Chyba: "Cypress not found"

**Řešení:**
```bash
pnpm install --save-dev cypress
```

#### Chyba: "Port 3000 already in use"

**Řešení:** Změňte port v `pnpm dev` nebo zavřete již běžící proces.

---

## ✅ Best Practices

### 1. Routování

✅ **Používejte absolutní pathy:**
```tsx
// ✅ Dobře
<Link href="/login">Login</Link>
<Link href={`/${tenantSlug}/book`}>Book</Link>

// ❌ Špatně
<Link href="login">Login</Link>
<Link href="book">Book</Link>
```

✅ **Používejte <Link> pro vnitřní navigaci:**
```tsx
// ✅ Dobře
<Link href="/about">About</Link>

// ❌ Špatně
<a href="/about">About</a>
```

✅ **Používejte <a> pro externí odkazy:**
```tsx
// ✅ Dobře
<a href="https://example.com" target="_blank" rel="noopener noreferrer">External</a>

// ❌ Špatně
<Link href="https://example.com">External</Link>
```

### 2. Dynamické Routy

✅ **Vždy validujte existenci parametrů:**
```tsx
// ✅ Dobře
if (!tenantContext) {
  redirect('/404');
}

// ❌ Špatně
// Bez validace
```

✅ **Používejte parametry z URL správně:**
```tsx
// ✅ Dobře
const { tenantSlug } = params;
const href = `/${tenantSlug}/book`;

// ❌ Špatně (hardcodované)
const href = '/demo-clinic/book';
```

### 3. Autentizace

✅ **Vždy zkontrolujte oprávnění:**
```tsx
// ✅ Dobře
if (tenant.userRole !== 'admin') {
  router.push(`/${tenant.tenant.slug}`);
}

// ❌ Špatně
// Přímá navigace do admin sekce bez kontroly
```

### 4. Error Handling

✅ **Vždy zachyťte chyby:**
```tsx
// ✅ Dobře
try {
  await router.push(href);
} catch (error) {
  console.error('Navigation failed:', error);
}
```

### 5. Testování

✅ **Testujte všechny navigační cesty:**
```tsx
// ✅ Dobře
it('should navigate from / to /login', () => {
  cy.visit('/');
  cy.get('a[href="/login"]').click();
  cy.url().should('include', '/login');
});
```

✅ **Validujte všechny odkazy:**
```tsx
// ✅ Dobře
it('should have valid links', () => {
  cy.get('a[href]').each(($link) => {
    const href = $link.attr('href');
    expect(validRoutes).to.include(href);
  });
});
```

---

## 📚 Související Dokumentace

- [Dokumentace Rout](docs/ROUTES_AND_NAVIGATION.md)
- [Cypress Dokumentace](https://docs.cypress.io/)
- [ESLint Dokumentace](https://eslint.org/docs/)
- [Next.js Routování](https://nextjs.org/docs/app/building-your-application/routing)

---

## 🤝 Příspěvky

Příspěvky jsou vítány! Pokud chcete přispět:

1. **Fork** repozitáře
2. Vytvořte **feature branch** (`git checkout -b feature/your-feature`)
3. **Commit** změny (`git commit -m 'Add some feature'`)
4. **Push** na branch (`git push origin feature/your-feature`)
5. Vytvořte **Pull Request**

### Směrnice pro Příspěvky

- ✅ Dodržujte existující code style
- ✅ Přidávejte testy pro nové funkce
- ✅ Aktualizujte dokumentaci
- ✅ Udržujte změny malé a zaměřené
- ✅ Používejte jasné commit zprávy

---

## 📝 Historie Změny

| Verze | Datum | Autor | Změny |
|-------|-------|-------|--------|
| 1.0.0 | 19. červen 2026 | Mistral Vibe | První verze - kompletní systém validace |

---

## 📞 Podpora

Pro otázky a problémy:

1. **Dokumentace:** Zkontrolujte dokumentaci
2. **Issues:** Vytvořte nový issue na GitHub
3. **Discord:** Připojte se na Discord server
4. **Email:** Kontaktujte tým přímo

---

**© 2026 NEXIFY TECH CENTER. Všechna práva vyhrazena.**
