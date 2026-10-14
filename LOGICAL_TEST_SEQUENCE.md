# 🎯 Logický Rad Testov - NEXIFY AutoOps & BizAgent 4.0

## 📋 Postup Testovania (Od najdôležitejších po najmspacejšie)

---

## 🔴 **FÁZA 1: ZÁKLADNÉ OVERENIE** (Všetko prešlo ✅)

### Krok 1.1: Syntaktická validácia
```bash
pnpm lint
```
**Výsledok:** ✅ Prešiel - Žiadne chyby

### Krok 1.2: Typová validácia
```bash
cd apps/web && npx tsc --noEmit
```
**Výsledok:** ✅ Prešiel - Žiadne typové chyby

### Krok 1.3: Build
```bash
pnpm build
```
**Výsledok:** ✅ Prešiel - Produkčný build úspešný

### Krok 1.4: Importy a exporty
```bash
# Overiť export
grep "biz-agent" packages/@repo/ai/src/index.ts

# Overiť importy
head -5 apps/web/app/api/chat/biz-agent/route.ts
head -5 apps/web/app/api/cron/autoops-worker/route.ts
```
**Výsledok:** ✅ Všetky importy a exporty sú správne

---

## 🟡 **FÁZA 2: STATICKÁ ANALYZA** (Všetko prešlo ✅)

### Krok 2.1: Overenie existencie súborov
```bash
for file in \
  "packages/@repo/ai/src/assistant/biz-agent.ts" \
  "apps/web/app/api/chat/biz-agent/route.ts" \
  "apps/web/app/api/cron/autoops-worker/route.ts" \
  "apps/web/components/booking/InteractiveFloorCanvas.tsx" \
  "supabase/migrations/021_autoops_tables.sql"; do
  test -f "$file" && echo "✅ $file" || echo "❌ $file"
done
```
**Výsledok:** ✅ Všetky súbory existujú

### Krok 2.2: Overenie struktúry
```bash
# Overiť, či sú súbory v správnych priečinkoch
test -d "apps/web/app/api/chat/biz-agent" && echo "✅ API route directory" 
test -d "apps/web/app/api/cron/autoops-worker" && echo "✅ Cron worker directory"
test -f "apps/web/components/booking/InteractiveFloorCanvas.tsx" && echo "✅ Component file"
```
**Výsledok:** ✅ Všetky adresáre a súbory sú na správnom mieste

---

## 🟢 **FÁZA 3: DYNAMICKÉ TESTY** (Vyžaduje spustený server)

### Krok 3.1: Spustenie vývojového servera
```bash
pnpm dev
```
**Očakávanie:** Server beží na `http://localhost:3009`

### Krok 3.2: Test BizAgent API
```bash
# Test 1: Bez autentifikácie
curl -s -o /dev/null -w "%{http_code}" \
  -X POST http://localhost:3009/api/chat/biz-agent \
  -H "Content-Type: application/json" \
  -d '{"tenantId":"test","messages":[{"role":"user","content":"test"}]}'
# Očakávanie: 401

# Test 2: S autentifikáciou (vyžaduje valid session)
curl -s -o /dev/null -w "%{http_code}" \
  -X POST http://localhost:3009/api/chat/biz-agent \
  -H "Content-Type: application/json" \
  -H "Cookie: [session-cookie]" \
  -d '{"tenantId":"valid-tenant","messages":[{"role":"user","content":"Chcem rezervovať"}]}'
# Očakávanie: 200
```

### Krok 3.3: Test AutoOps Worker
```bash
# Test 1: Bez secretu
curl -s -o /dev/null -w "%{http_code}" \
  -X GET http://localhost:3009/api/cron/autoops-worker
# Očakávanie: 401

# Test 2: S neplatným secretom
curl -s -o /dev/null -w "%{http_code}" \
  -X GET http://localhost:3009/api/cron/autoops-worker \
  -H "Authorization: Bearer wrong-secret"
# Očakávanie: 401

# Test 3: S platným secretom
curl -s -w "\n" \
  -X GET http://localhost:3009/api/cron/autoops-worker \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
# Očakávanie: 200 + JSON response
```

---

## 🔵 **FÁZA 4: DATABÁZOVÉ TESTY** (Vyžaduje Supabase)

### Krok 4.1: Aplikovať migráciu
```bash
# Lokálne (ak máte Supabase CLI)
supabase db push

# Alebo cez Supabase Dashboard:
# 1. Prejdiť na https://app.supabase.com
# 2. Vybrať projekt
# 3. SQL Editor
# 4. Spustiť: SELECT * FROM supabase_migrations WHERE version = '021';
#    Ak neexistuje, aplikovať migráciu
```

### Krok 4.2: Overiť tabuľky
```sql
-- Overiť existenciu tabuliek
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('autoops_events', 'autoops_runs', 'booking_waitlist');

-- Overiť RLS
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN ('autoops_events', 'autoops_runs', 'booking_waitlist');

-- Overiť indexy
SELECT indexname, tablename FROM pg_indexes 
WHERE tablename IN ('autoops_events', 'autoops_runs', 'booking_waitlist');
```

### Krok 4.3: Test INSERT operácii
```sql
-- Test autoops_events
INSERT INTO autoops_events (tenant_id, event_type, details) 
VALUES ('00000000-0000-0000-0000-000000000000', 'no_show_detected', '{"test": true}')
ON CONFLICT DO NOTHING;

-- Test autoops_runs
INSERT INTO autoops_runs (executed_at, no_shows_detected, waitlist_filled, outbox_processed, slots_compacted, errors, duration_ms) 
VALUES (now(), 0, 0, 0, 0, '{}', 100);

-- Test booking_waitlist
INSERT INTO booking_waitlist (tenant_id, service_id, client_name, client_email, client_phone) 
VALUES ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'Test User', 'test@example.com', '+421901234567');
```

---

## 🟣 **FÁZA 5: KOMPONENTOVÉ TESTY** (Vyžaduje prehliadač)

### Krok 5.1: Test InteractiveFloorCanvas
```tsx
// Vytvoriť testovú stránku
import { InteractiveFloorCanvas } from '@/components/booking/InteractiveFloorCanvas';

export default function TestPage() {
  const stations = [
    { id: '1', name: 'Stanica 1', staffName: 'Ján Novák', isAvailable: true, x: 100, y: 100 },
    { id: '2', name: 'Stanica 2', staffName: 'Mária Kuková', isAvailable: false, x: 300, y: 100 },
  ];

  return (
    <div>
      <h1>Test Floor Canvas</h1>
      <InteractiveFloorCanvas 
        stations={stations} 
        onSelectStation={(id) => alert(`Selected: ${id}`)} 
      />
    </div>
  );
}
```

**Overiť:**
- [ ] Renderovanie kanvasu
- [ ] Zobrazenie staníc
- [ ] Pan funkcia (drag)
- [ ] Zoom funkcia (scroll)
- [ ] Klik na stanicu → alert
- [ ] Fallback mód (ak canvas nie je podporovaný)

---

## ⚪ **FÁZA 6: INTEGRAČNÉ TESTY**

### Krok 6.1: Kompletný Booking Flow
```
1. Otvoriť /[tenantSlug]/book
2. Vybrať službu
3. Vybrať termín
4. Zadať kontaktné údaje
5. Overiť, že rezervácia bola vytvorená
6. Overiť, že prišlo potvrdzovacie email
7. Overiť manage link v emaile
```

### Krok 6.2: BizAgent Konverzácia
```
1. Volanie /api/chat/biz-agent
2. Poslať: "Chcem rezervovať kadeřníka"
3. Overiť, že AI navrhne služby
4. Vybrať službu
5. Overiť, že AI navrhne termíny
6. Potvrdiť termín
7. Overiť rezerváciu
```

### Krok 6.3: AutoOps + Zrušenie
```
1. Vytvoriť rezerváciu
2. Zrušiť rezerváciu
3. Spustiť AutoOps workera (manuálne)
4. Overiť, či sa vytvorila notifikácia pre waitlist
5. Overiť audit log v autoops_events
```

---

## 📊 **Súhrn Prístupu k Testovaniu**

| Fáza | Typ | Priorita | Čas | Status |
|-------|------|----------|------|--------|
| 1 | Statické | 🔴 Kritická | 2 min | ✅ Hotové |
| 2 | Statická Analýza | 🔴 Kritická | 1 min | ✅ Hotové |
| 3 | API Testy | 🔴 Kritická | 5 min | ❌ Neotestované |
| 4 | Databáza | 🔴 Kritická | 5 min | ❌ Neotestované |
| 5 | Komponenty | 🟡 Dôležité | 10 min | ❌ Neotestované |
| 6 | Integracia | 🟢 Nízka | 15 min | ❌ Neotestované |

**Celkový čas:** ~20-30 minút na úplné testovanie

---

## 🎯 **Odporúčaný Postup**

### 1. **Rýchle overenie** (2 minúty)
```bash
# Spustite automatické testy
./test-implementation.sh
```

### 2. **Základné manuálne testy** (10 minút)
```bash
# Spustite server
pnpm dev

# V novom termináli testujte:
# - BizAgent API (Krok 3.2)
# - AutoOps Worker (Krok 3.3)
```

### 3. **Databázové testy** (5 minút)
```bash
# Aplikovať migráciu a overiť (Krok 4)
```

### 4. **Komponentové testy** (10 minút)
```
# Testovať v prehliadači (Krok 5)
```

### 5. **Integračné testy** (15 minút)
```
# Kompletné testovanie workflow (Krok 6)
```

---

## ✅ **Zhrnutie**

**Už otestované:**
- Všetky statické validácie (ESLint, TypeScript, Build)
- Importy a exporty
- Existencia súborov

**Ešte neotestované:**
- API endpointy (vyžaduje spustený server)
- AutoOps worker (vyžaduje spustený server a CRON_SECRET)
- Databázová migrácia (vyžaduje Supabase)
- UI komponenty (vyžaduje prehliadač)
- Integračné testy (vyžaduje kompletný workflow)

**Priorita:**
1. 🔴 **API a Cron** - Bez tohto nebude systém funkčný
2. 🟡 **Databáza** - Migráciu je treba aplikovať pred spustením AutoOps
3. 🟢 **UI a Integracia** - Overenie správneho chovania
