# 🗺️ NEXIFY TECH CENTER - Kompletní Seznam Rout a Navigace

> **Verze:** 1.0.0  
> **Poslední aktualizace:** 19. červen 2026  
> **Autoři:** Mistral Vibe + NEXIFY Team  
> **Projekt:** White-Label Booking Platform

---

## 📋 Obsah

1. [Úvod](#-úvod)
2. [Architektura Routování](#-architektura-routování)
3. [Kompletní Seznam Všech Rout](#-kompletní-seznam-všech-rout)
4. [Navigační Mapování](#-navigační-mapování)
5. [API Endpointy](#-api-endpointy)
6. [Vertikální Routy](#-vertikální-routy)
7. [Autentizační Flow](#-autentizační-flow)
8. [Tenant Routing Logic](#-tenant-routing-logic)
9. [Best Practices](#-best-practices)
10. [Zjištěné Problémy](#-zjištěné-problémy)
11. [Testovací Pokyny](#-testovací-pokyny)

---

## 🎯 Úvod

Tento dokument obsahuje **kompletní a detailní přehled** všech rout, endpointů a navigačních cest v aplikaci **NEXIFY TECH CENTER - White-Label Booking Platform**. 

Cílem je:
- 🔍 **Dokumentovat** všechna existující routy
- ✅ **Ověřit** správnost všech odkazů a navigací
- 🛠️ **Usnadnit** vývoj a údržbu
- 🚀 **Zajistit** konzistenci napříč celou aplikací

---

## 🏗️ Architektura Routování

Aplikace používá **Next.js 14 App Router** s následující strukturou:

```
📁 apps/web/
├── app/
│   ├── (auth)/              # Autentizační skupinové routy
│   │   ├── login/
│   │   ├── signup/
│   │   ├── forgot-password/
│   │   ├── reset-password/
│   │   └── logout/
│   │
│   ├── (marketing)/         # Marketingové stránky
│   │
│   ├── [tenantSlug]/        # Dynamické tenant routy
│   │   ├── book/
│   │   │   └── booking-page-client.tsx
│   │   ├── admin/
│   │   │   ├── users-tab.tsx
│   │   │   ├── services/
│   │   │   │   ├── new/
│   │   │   │   └── [serviceId]/
│   │   │   │       └── edit/
│   │   │   └── layout.tsx
│   │   ├── portal/
│   │   └── page.tsx
│   │
│   ├── platform/            # Platform admin
│   │   ├── tenants/
│   │   │   ├── new/
│   │   │   └── [tenantId]/
│   │   │       └── edit/
│   │   └── page.tsx
│   │
│   ├── api/               # API endpointy
│   │   └── notifications/
│   │       ├── dispatch/
│   │       └── reminders/
│   │
│   ├── privacy/
│   ├── 404/
│   └── page.tsx           # Hlavní landing page
│
├── middleware.ts         # Globální middleware
└── layout.tsx            # Root layout
```

### Routovací pravidla:

1. **Veřejné routy** - Přístupné všem uživatelům
2. **Autentizované routy** - Vyžadují přihlášení
3. **Platform Admin routy** - Vyžadují platform admin práva
4. **Tenant routy** - Dynamické routy založené na tenant slugu

---

## 📊 Kompletní Seznam Všech Rout

### 🌐 Veřejné Routy (Public Routes)

| **Routa** | **Typ** | **Popis** | **Komponenta** | **Povolený Přístup** | **Middleware Check** |
|----------|---------|-----------|----------------|---------------------|---------------------|
| `/` | page | Hlavní landing page | `app/page.tsx` | Všichni | ❌ |
| `/404` | page | 404 Error page | `app/404/page.tsx` | Všichni | ❌ |
| `/privacy` | page | Ochrana soukromí | `app/privacy/page.tsx` | Všichni | ❌ |
| `/login` | page | Přihlášení | `app/(auth)/login/page.tsx` | Všichni | ❌ |
| `/signup` | page | Registrace | `app/(auth)/signup/page.tsx` | Všichni | ❌ |
| `/forgot-password` | page | Zapomenuté heslo | `app/(auth)/forgot-password/page.tsx` | Všichni | ❌ |
| `/reset-password` | page | Reset hesla | `app/(auth)/reset-password/page.tsx` | Všichni | ❌ |
| `/logout` | page | Odhlášení | `app/(auth)/logout/page.tsx` | Všichni | ❌ |

### 👤 Autentizační Routy (Auth Routes)

Všechny routy v `(auth)` složce jsou veřejné, ale vyžadují nebo provádí autentizační akce.

### 🏢 Platform Admin Routy

| **Routa** | **Typ** | **Popis** | **Komponenta** | **Povolený Přístup** | **Middleware Check** |
|----------|---------|-----------|----------------|---------------------|---------------------|
| `/platform` | page | Platform admin dashboard | `app/platform/page.tsx` | Platform Admin | ✅ |
| `/platform/tenants/new` | page | Vytvoření nového tenanta | `app/platform/tenants/new/page.tsx` | Platform Admin | ✅ |
| `/platform/tenants/[tenantId]/edit` | page | Úprava tenanta | `app/platform/tenants/[tenantId]/edit/page.tsx` | Platform Admin | ✅ |

### 🏪 Tenant Routy (Dynamic Routes)

| **Routa** | **Typ** | **Popis** | **Komponenta** | **Povolený Přístup** | **Middleware Check** |
|----------|---------|-----------|----------------|---------------------|---------------------|
| `/[tenantSlug]` | page | Domovská stránka tenanta | `app/[tenantSlug]/page.tsx` | Všichni | ✅ (tenant existence) |
| `/[tenantSlug]/book` | page | Rezervační stránka | `app/[tenantSlug]/book/page.tsx` | Všichni | ✅ (tenant existence) |
| `/[tenantSlug]/portal` | page | Klientský portál | `app/[tenantSlug]/portal/page.tsx` | Přihlášení uživatel | ✅ (tenant + auth) |
| `/[tenantSlug]/admin` | page | Admin tenanta | `app/[tenantSlug]/admin/page.tsx` | Tenant Admin | ✅ (tenant + auth + role) |
| `/[tenantSlug]/admin/services/new` | page | Nová služba | `app/[tenantSlug]/admin/services/new/page.tsx` | Tenant Admin | ✅ (tenant + auth + role) |
| `/[tenantSlug]/admin/services/[serviceId]/edit` | page | Úprava služby | `app/[tenantSlug]/admin/services/[serviceId]/edit/page.tsx` | Tenant Admin | ✅ (tenant + auth + role) |

### 🔌 API Endpointy

| **Endpoint** | **Metoda** | **Popis** | **Handler** | **Povolený Přístup** | **Autentizace** |
|--------------|------------|-----------|-------------|---------------------|------------------|
| `/api/notifications/dispatch` | POST | Odeslání notifikací | `app/api/notifications/dispatch/route.ts` | Autentizovaný uživatel | ✅ (session) |
| `/api/notifications/reminders` | POST | Odeslání připomínek | `app/api/notifications/reminders/route.ts` | Autentizovaný uživatel | ✅ (session) |

---

## 🧭 Navigační Mapování

### Hlavní Navigační Cesty

#### 1. Veřejný Uživatel → Rezervace

```
│
├─ / (Landing Page)
│  ├─ Link: "/demo-clinic/book" → /demo-clinic/book
│  ├─ Link: "/platform" → /platform (redirect na /login)
│  └─ Link: "/login" → /login
│
├─ /demo-clinic (Tenant Home)
│  ├─ Link: "/demo-clinic/book" → /demo-clinic/book
│  └─ Link: "/demo-clinic/portal" → /demo-clinic/portal (redirect na /login)
│
└─ /demo-clinic/book (Booking Page)
   ├─ Link: "/demo-clinic" → /demo-clinic
   └─ After booking → /demo-clinic/portal
```

#### 2. Nový Uživatel → Registrace → Přihlášení → Rezervace

```
│
├─ /signup
│  ├─ Link: "/login" → /login
│  └─ After signup → /login (auto-redirect)
│
├─ /login
│  ├─ Link: "/signup" → /signup
│  ├─ Link: "/forgot-password" → /forgot-password
│  └─ After login → sessionStorage.getItem('returnTo') || /demo-clinic
│
└─ /demo-clinic (Tenant Home)
   └─ Continue booking flow...
```

#### 3. Platform Admin → Správa Tenantů

```
│
├─ /platform
│  ├─ Link: "/platform/tenants/new" → /platform/tenants/new
│  └─ Link: "/platform/tenants/[id]/edit" → /platform/tenants/[id]/edit
│
├─ /platform/tenants/new
│  ├─ Button: Submit → POST /tenants, then /platform?tab=tenants
│  └─ Button: Zrušit → /platform?tab=tenants
│
└─ /platform/tenants/[id]/edit
   ├─ Button: Uložit → PATCH /tenants, then /platform?tab=tenants
   └─ Button: Zrušit → /platform?tab=tenants
```

#### 4. Tenant Admin → Správa Služeb

```
│
├─ /[tenantSlug]/admin
│  ├─ Link: "/[tenantSlug]/admin/services/new" → /[tenantSlug]/admin/services/new
│  ├─ Link: "/[tenantSlug]/admin/services/[id]/edit" → /[tenantSlug]/admin/services/[id]/edit
│  └─ Tab: users → UsersTab component
│
├─ /[tenantSlug]/admin/services/new
│  ├─ Button: Uložit → POST /services, then /[tenantSlug]/admin?tab=services
│  └─ Button: Zrušit → /[tenantSlug]/admin?tab=services
│
└─ /[tenantSlug]/admin/services/[id]/edit
   ├─ Button: Uložit → PATCH /services, then /[tenantSlug]/admin?tab=services
   ├─ Button: Zrušit → /[tenantSlug]/admin?tab=services
   └─ Button: Odstrániť → DELETE /services, then /[tenantSlug]/admin?tab=services
```

#### 5. Klient → Portál → Rezervace

```
│
├─ /[tenantSlug]/portal
│  ├─ Link: "/[tenantSlug]/book" → /[tenantSlug]/book
│  └─ Link: "/[tenantSlug]" → /[tenantSlug]
│
├─ /[tenantSlug]/book
│  ├─ Button: Back → /[tenantSlug]
│  └─ After booking → /[tenantSlug]/portal
│
└─ /[tenantSlug]/portal
   └─ Button: Zrušiť rezerváciu → DELETE /bookings/[id], stay on page
```

---

## 🔌 API Endpointy

### Notifikace

#### POST /api/notifications/dispatch
- **Popis:** Odeslání notifikací pro konkrétní rezervaci
- **Tělo žádosti:** `{ bookingId: string }`
- **Autentizace:** Vyžaduje validní session
- **Odpověď:** `{ sent: number, failed: number, errors: string[] }`
- **Handler:** `app/api/notifications/dispatch/route.ts`

#### POST /api/notifications/reminders
- **Popis:** Odeslání připomínek rezervací
- **Tělo žádosti:** (prázdné nebo s filtry)
- **Autentizace:** Vyžaduje validní session
- **Odpověď:** `{ sent: number, processed: number }`
- **Handler:** `app/api/notifications/reminders/route.ts`

---

## 🎨 Vertikální Routy

Aplikace podporuje několik typů služeb (vertikál), každá s vlastním tenantem a službami:

### Vertikální Konfigurace (`src/lib/booking/vertical-routing.ts`)

| **ID** | **Název** | **Popis** | **Tenant Slug** | **Service ID** | **Barva** | **CTA Text** |
|--------|-----------|-----------|----------------|----------------|-----------|--------------|
| barber | Barber | Cuts, grooming, beard care | barber-lounge | 40000000-...0001 | #ff5a5f | View barber services |
| beauty | Beauty | Nails, skin, lashes | beauty-studio | 50000000-...0001 | #ff6fb5 | View beauty services |
| massage | Massage | Wellness therapies | recovery-massage | 60000000-...0001 | #6ec8ff | View massage services |
| fitness | Fitness | Classes, personal training | apex-fitness | 70000000-...0001 | #8dff8a | View fitness services |
| physio | Physio | Therapy, rehabilitation | motion-physio | 80000000-...0001 | #7c9bff | View physio services |
| clinic | Clinic | Medical consultations | demo-clinic | 10000000-...0001 | #5aa8ff | View clinic services |
| tattoo | Tattoo | Artist scheduling | ink-tattoo | 90000000-...0001 | #f59e0b | View tattoo services |

### Generované Odkazy

Každá vertikála generuje odkaz:
```
/[tenantSlug]/book?service=[serviceId]
```

Příklad:
```
/barber-lounge/book?service=40000000-0000-0000-0000-000000000001
```

---

## 🔐 Autentizační Flow

### Middleware Autentizace (`middleware.ts`)

```typescript
// Veřejné routy (vždy přístupné)
const PUBLIC_ROUTES = new Set(['/', '/404', '/login', '/signup', '/forgot-password', '/reset-password', '/privacy'])

// Platform admin routy (vyžadují platform admin práva)
if (pathname === '/platform' || pathname.startsWith('/platform/')) {
  // 1. Zkontrolovat session
  // 2. Zkontrolovat platform_admins tabulku
  // 3. Pokud neprojde → redirect na /login (nepřihlášen) nebo /404 (přihlášen ale ne admin)
}

// Tenant routy (vyžadují existující tenant)
if (tenantSlug) {
  // 1. Vyhledat tenant v DB
  // 2. Pokud neexistuje → redirect na /404
  // 3. Vložit tenant context do headers
}
```

### Session Management

- **Storage:** Supabase Auth cookies
- **Client:** `createClientComponentClient()`
- **Server:** `createServerClient()`
- **Middleware:** `createMiddlewareClient()`

### ReturnTo Mechanism

Při navigaci na autentizační stránky se ukládá návratová adresa:

```typescript
// Uložení
sessionStorage.setItem('returnTo', currentPath)

// Použití po přihlášení
const returnTo = sessionStorage.getItem('returnTo')
if (returnTo) {
  router.push(returnTo)
  sessionStorage.removeItem('returnTo')
} else {
  router.push('/demo-clinic') // Default
}
```

---

## 🏢 Tenant Routing Logic

### Tenant Resolution

1. **URL Pattern:** `/[tenantSlug]/...`
2. **Extrakce:** `pathname.split('/').filter(Boolean)[0]`
3. **Cache:** 5-minutový cache pro zlepšení výkonu
4. **Lookup:** Dotaz na `tenants` tabulku s `slug` filtrem
5. **Fallback:** Redirect na `/404` pokud tenant neexistuje

### Tenant Context

Po úspěšném vyhledání tenanta se do request headers vkládají:
- `x-tenant-id`
- `x-tenant-slug`
- `x-tenant-name`

### Multi-tenant Architecture

- **Každý tenant** má vlastní:
  - Domovskou stránku (`/[slug]/`)
  - Rezervační stránku (`/[slug]/book`)
  - Admin rozhraní (`/[slug]/admin`)
  - Klientský portál (`/[slug]/portal`)
  - Branding (barvy, logo)
  - Služby
  - Rezervace
  - Uživatele

---

## ✅ Best Practices

### 1. Routování

✅ **Používej absolutní pathy:**
```tsx
// ✅ Dobře
<Link href="/login">Login</Link>
<Link href={`/${tenantSlug}/book`}>Book</Link>

// ❌ Špatně
<Link href="login">Login</Link>
<Link href="book">Book</Link>
```

✅ **Používej Link pro vnitřní navigaci:**
```tsx
// ✅ Dobře
<Link href="/about">About</Link>

// ❌ Špatně (způsobí full page reload)
<a href="/about">About</a>
```

✅ **Používej <a> pro externí odkazy:**
```tsx
// ✅ Dobře
<a href="https://example.com" target="_blank" rel="noopener noreferrer">External</a>

// ❌ Špatně
<Link href="https://example.com">External</Link>
```

### 2. Dynamické Routy

✅ **Vždy validuj existenci dynamických parametrů:**
```tsx
// ✅ Dobře
if (!tenantContext) {
  redirect('/404')
}

// ❌ Špatně (může způsobit runtime error)
// Bez validace
```

✅ **Používej parametry z URL správně:**
```tsx
// ✅ Dobře
const { tenantSlug } = params
const href = `/${tenantSlug}/book`

// ❌ Špatně (hardcodované)
const href = '/demo-clinic/book'
```

### 3. Autentizace a Autorizace

✅ **Vždy zkontroluj oprávnění před navigací:**
```tsx
// ✅ Dobře
if (tenant.userRole !== 'admin') {
  router.push(`/${tenant.tenant.slug}`)
}

// ❌ Špatně (bez kontroly)
// Přímá navigace do admin sekce
```

✅ **Používej server-side redirecty pro autentizaci:**
```tsx
// ✅ Dobře (v server component)
if (!session) {
  redirect('/login')
}
```

### 4. Query Parametry

✅ **Používej URLSearchParams pro query parametry:**
```tsx
// ✅ Dobře
const searchParams = useSearchParams()
const serviceId = searchParams.get('service')

// ❌ Špatně (přímý přístup)
// const serviceId = window.location.search
```

✅ **Validuj query parametry:**
```tsx
// ✅ Dobře
if (!serviceId) {
  // Fallback
}

// ❌ Špatně (bez validace)
```

### 5. Error Handling

✅ **Vždy zachyť chyby při navigaci:**
```tsx
// ✅ Dobře
try {
  await router.push(href)
} catch (error) {
  console.error('Navigation failed:', error)
}
```

✅ **Používej 404 pro neexistující zdroje:**
```tsx
// ✅ Dobře
if (!tenant) {
  redirect('/404')
}
```

---

## ⚠️ Zjištěné Problémy

### Kritické Problémy (High Priority)

**Žádné kritické problémy nalezny.** ✅

### Střední Problémy (Medium Priority)

| **#** | **Problém** | **Soubor** | **Řádek** | **Status** | **Řešení** |
|-------|-------------|------------|-----------|------------|------------|
| 1 | Odkaz na neexistující `/terms` stránku | `app/(auth)/signup/page.tsx` | 139 | 🔴 **Neopraveno** | Vytvořit `app/terms/page.tsx` nebo změnit na `/privacy` |

### Nízké Problémy (Low Priority)

| **#** | **Problém** | **Soubor** | **Řádek** | **Status** | **Řešení** |
|-------|-------------|------------|-----------|------------|------------|
| 1 | Placeholder odkazy `#` v compute-landing | `app/compute-landing.tsx` | 282-294, 300-303 | 🟡 **Neopraveno** | Nahradit `#` konkrétními routami |

---

## 🧪 Testovací Pokyny

### 1. Manuální Testování

#### Testovací Scénáře

**Scénář 1: Veřejný přístup**
1. Navštivte `/`
2. Klikněte na všechny odkazy v headeru
3. Klikněte na všechny buttony v hero sekci
4. Klikněte na všechny vertical cards
5. Klikněte na všechny featured services
6. Klikněte na všechny odkazy v footeru

**Scénář 2: Autentizační flow**
1. Navštivte `/login`
2. Klikněte na "Zabudli ste heslo?" → měla by vést na `/forgot-password`
3. Klikněte na "Registrujte sa" → měla by vést na `/signup`
4. V `/signup` klikněte na "podmienkami" → měla by vést na `/terms` (aktuálně chybí!)
5. V `/signup` klikněte na "Prihláste sa" → měla by vést na `/login`

**Scénář 3: Tenant navigace**
1. Navštivte `/demo-clinic`
2. Klikněte na "Book now" → měla by vést na `/demo-clinic/book`
3. Klikněte na "Open portal" → měla by vést na `/demo-clinic/portal` (redirect na `/login`)
4. Klikněte na jakoukoli službu → měla by vést na `/demo-clinic/book?service=[id]`

**Scénář 4: Platform admin navigace**
1. Přihlaste se jako platform admin
2. Navštivte `/platform`
3. Klikněte na "Pridať nového tenanta" → měla by vést na `/platform/tenants/new`
4. Klikněte na "Create tenant" → měla by vést na `/platform/tenants/new`
5. Klikněte na "Upraviť" u libovolného tenanta → měla by vést na `/platform/tenants/[id]/edit`
6. Klikněte na "Zobraziť" u libovolného tenanta → měla by vést na `/[tenant-slug]`

**Scénář 5: Tenant admin navigace**
1. Přihlaste se jako tenant admin
2. Navštivte `/demo-clinic/admin`
3. Klikněte na "Pridať novú službu" → měla by vést na `/demo-clinic/admin/services/new`
4. Klikněte na "Upraviť" u libovolné služby → měla by vést na `/demo-clinic/admin/services/[id]/edit`
5. Klikněte na "Späť na tenant" → měla by vést na `/demo-clinic`

**Scénář 6: Portál navigace**
1. Přihlaste se jako běžný uživatel
2. Navštivte `/demo-clinic/portal`
3. Klikněte na "Rezervovať termín" → měla by vést na `/demo-clinic/book`
4. Klikněte na "Späť na tenant" → měla by vést na `/demo-clinic`

### 2. Automatizované Testování

Pro automatizované testování použijte:
- **Cypress:** `cypress/e2e/navigation.cy.ts`
- **Playwright:** `tests/navigation.spec.ts`

Viz. samostatná dokumentace pro automatizované testy.

### 3. Checklist pro Code Review

- [ ] Všechny nové odkazy směřují na existující routy
- [ ] Dynamické parametry jsou správně použity
- [ ] Autentizační kontroly jsou na místě
- [ ] Error handling je implementován
- [ ] Odkazy používají správné komponenty (Link vs a)
- [ ] Query parametry jsou validovány
- [ ] Tenant existence je ověřována
- [ ] Admin práva jsou ověřována

---

## 📚 Související Dokumentace

- [Cypress Testy - Navigace](cypress/e2e/navigation.cy.ts)
- [ESLint Pravidla - Routy](.eslintrc.json)
- [API Dokumentace](docs/API_DOCUMENTATION.md)
- [Autentizace](docs/AUTHENTICATION.md)
- [Middleware Dokumentace](docs/MIDDLEWARE.md)

---

## 📝 Historie Změny

| **Verze** | **Datum** | **Autor** | **Změny** |
|-----------|-----------|-----------|------------|
| 1.0.0 | 19. červen 2026 | Mistral Vibe | První verze - kompletní dokumentace rout |

---

## 🤝 Příspěvky

Příspěvky do této dokumentace jsou vítány. Prosím:
1. Vytvořte Pull Request s jasným popisem změn
2. Aktualizujte historii změn
3. Otestujte všechny odkazy v dokumentaci

---

**© 2026 NEXIFY TECH CENTER. Všechna práva vyhrazena.**
