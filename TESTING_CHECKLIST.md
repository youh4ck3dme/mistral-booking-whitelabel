# 🧪 Testing Checklist - NEXIFY AutoOps & BizAgent 4.0

## 🔴 KRITICKÉ TESTY (Musia sa otestovat pred deployom)

### 1. BizAgent API Route
**Endpoint:** `POST /api/chat/biz-agent`

- [ ] Bez autentifikacie → `401 Unauthorized`
- [ ] S autentifikaciou → `200 OK` + streaming response
- [ ] Neplatny tenantId → `404 Tenant not found`
- [ ] Non-member user → `403 Forbidden`
- [ ] Prazdna sprava → `400 Invalid request`
- [ ] Sprava >1000 znakov → `400 Invalid request`
- [ ] Rate limiting (10+ requestov) → `429 Too Many Requests`

---

### 2. AutoOps Worker
**Endpoint:** `GET /api/cron/autoops-worker`

- [ ] Bez CRON_SECRET → `401 Unauthorized`
- [ ] Neplatny CRON_SECRET → `401 Unauthorized`
- [ ] Platny CRON_SECRET → `200 OK` + summary JSON
- [ ] POST metoda → taktiez funguje

---

### 3. Databazova migracia 021

- [ ] `supabase db push` - aplikovat migraciu
- [ ] Overit tabulky: `autoops_events`, `autoops_runs`, `booking_waitlist`
- [ ] Overit RLS policy pre kazdu tabulku
- [ ] Overit indexy
- [ ] Test Insert do kazdej tabulky

---

## 🟡 Dôležité testy

### 4. InteractiveFloorCanvas

- [ ] Render s prazdnym zoznamom stanic
- [ ] Render so stanicami
- [ ] Canvas mod (ak podporuje prehliadac)
- [ ] Fallback mod (starie prehliadace)
- [ ] Pan a zoom funkcia
- [ ] Klik na stanicu → onSelectStation

### 5. Integračne testy

- [ ] Kompletny booking flow cez BizAgent
- [ ] Zrusenie rezervacie + AutoOps → waitlist notifikacia
- [ ] Floor Canvas → Booking flow

### 6. Edge Cases

- [ ] Concurrent requests
- [ ] Network failures
- [ ] Invalid dates (past/future)
- [ ] Special characters (ščťžýáíé, emojis)
- [ ] Large payloads

---

## ✅ Už otestované

- [x] ESLint
- [x] TypeScript (tsc --noEmit)
- [x] Build (pnpm build)
- [x] Unit tests (260 tests)

---

## 🎯 Priorita

| Test | Priorita | Status |
|------|----------|--------|
| BizAgent API | 🔴 KRITICKY | ❌ |
| AutoOps Worker | 🔴 KRITICKY | ❌ |
| Migrácia 021 | 🔴 KRITICKY | ❌ |
| Floor Canvas | 🟡 DOLZITE | ❌ |
| Integracia | 🟡 DOLZITE | ❌ |
| Edge Cases | 🟢 VOLITELNE | ❌ |
