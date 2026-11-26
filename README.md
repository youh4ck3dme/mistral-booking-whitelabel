# NEXIFY TECH CENTER

> **White-Label Booking SaaS** built with **Next.js (App Router) + Supabase + TypeScript**.
> Multi-tenant platform with AI CRO, upsell capabilities, and custom branding per tenant.

---

## 🚀 Quick Start

Runs the web app locally **without a database and without any `.env` file**: the marketing pages, auth screens and the full unit test suite work out of the box. Tenant pages (`/<tenant-slug>`) need a Supabase project, see [Connect a Supabase project](#connect-a-supabase-project-optional).

Verified on 2026-11-26 from a fresh clone (Linux, Node.js 24.22.1, pnpm 9.15.9).

### Prerequisites

- Node.js 20 or newer (`node --version`; CI uses 20)
- pnpm 9 (`npm install --global pnpm@9`, then `pnpm --version`)
- Git

### 1. Clone and install

```bash
git clone https://github.com/youh4ck3dme/mistral-booking-whitelabel.git
cd mistral-booking-whitelabel
pnpm install --frozen-lockfile
```

The default branch is `feat/whitelabel-nextjs-platform`; `git clone` checks it out.

### 2. Check that everything is green

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Expected: all four exit with code 0; `pnpm test` reports `@repo/web` 260 passed and `@repo/ai` 22 passed.

### 3. Run the app

Production build (after `pnpm build`):

```bash
pnpm --filter @repo/web start --hostname 127.0.0.1 --port 3009
```

or the dev server with hot reload:

```bash
pnpm --filter @repo/web dev --hostname 127.0.0.1 --port 3009
```

In a second terminal:

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3009/
```

Expected: `200`. Open http://127.0.0.1:3009 in the browser. `/login`, `/privacy`, `/terms` and `/manifest.webmanifest` also return 200 without a database.

Pass the arguments without a separate `--` (`pnpm --filter @repo/web start -- --port 3009` makes Next.js treat `--hostname` as a directory and fails). Plain `pnpm dev` from the root runs `next dev` on its default port 3000.

### Connect a Supabase project (optional)

1. Copy `apps/web/.env.example` to `apps/web/.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` of **your own development project**. Never commit `.env.local`.
2. Apply `supabase/migrations` and `supabase/seed/001_initial_data.sql` only to that development database. `pnpm db:push` / `pnpm db:seed` write to whatever `SUPABASE_DB_URL` points at; never point it at production. Changes to the hosted production database need the owner's approval (see `AGENTS.md`).
3. Restart the app so it reads the new variables. (This optional part was not re-verified in the 2026-11-26 run.)

---

## 📂 Project Structure

```
mistral-booking-whitelabel/
├── apps/
│   └── web/                      # Next.js App (Turborepo workspace)
│       ├── app/
│       │   ├── (marketing)/      # Public pages (landing, pricing)
│       │   ├── (auth)/           # Auth pages (login, signup)
│       │   ├── [tenantSlug]/     # Tenant-specific routes
│       │   │   ├── book/         # Public booking flow
│       │   │   ├── admin/        # Tenant admin dashboard
│       │   │   └── portal/       # Client portal
│       │   └── platform/         # Global platform admin
│       └── ...
├── packages/
│   ├── @repo/ui/                # Shared UI components (Tailwind)
│   ├── @repo/core/              # Core business logic (booking, tenants)
│   ├── @repo/supabase/          # Typed Supabase client
│   └── @repo/ai/                # AI CRO + Upsell logic
├── supabase/
│   ├── migrations/              # SQL migrations
│   └── seed/                    # Seed data
├── docs/
│   ├── ARCHITECTURE.md          # Architecture documentation
│   └── DEPLOYMENT.md            # Deployment guide
└── .github/
    └── workflows/
        └── ci.yml               # GitHub Actions CI
```

---

## 🏗️ Core Features

| Feature | Description | Status |
|---------|-------------|--------|
| Multi-Tenancy | Single DB + `tenant_id` + RLS isolation | ✅ Implemented |
| White-Label | Custom branding, tenant slugs, theming & floor map (custom domains in decision) | ✅ Implemented |
| Booking System | Secure RPC-based booking with time slot validation & guest checkout | ✅ Implemented |
| **Clickable Calendar** | Interactive calendar with time slot picker for reservations | ✅ Implemented |
| AI CRO | Recommendations, upsell bundles, A/B testing & Mistral Chat | ✅ Implemented |
| AutoOps AI & REST API v1 | Key-authenticated REST API connector (`/api/v1/*`), BizAgent 4.0 & cron worker | ✅ Implemented |
| Env Validation | Startup environment verification & schema checks (OPS-3) | ✅ Implemented |
| Admin Dashboards | Tenant and platform-level admin panels with CSV export & floor canvas | ✅ Implemented |

---

## 🔧 Configuration

### Supabase

1. [Create a new Supabase project](https://supabase.com/dashboard).
2. Run migrations:

   ```bash
   pnpm db:push
   ```

3. Seed initial data:

   ```bash
   pnpm db:seed
   ```

### Vercel

1. Link your repository to [Vercel](https://vercel.com).
2. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy!

---

## 🧪 Testing

### Run Tests

```bash
# Unit & Integration tests (Vitest)
pnpm test

# E2E tests (Playwright)
pnpm test:e2e

# Lint
pnpm lint

# Typecheck
pnpm --filter @repo/web exec tsc --noEmit
```

### Test Coverage

- Unit tests: Core booking logic, RLS policies, AI fallback, API v1 connector, **calendar utilities, floor canvas**
- Integration tests: FE/BE slot parity, tenant isolation, concurrency checks
- E2E tests: Full booking flow for 2+ tenants, **calendar interaction tests**

---

## 📄 Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Clickable Booking Calendar Implementation](CALENDAR_IMPLEMENTATION_REPORT.md)
- [Calendar QA Checklist](apps/web/src/lib/booking/CALENDAR_QA_CHECKLIST.md)

---

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feat/your-feature`).
3. Commit your changes (`git commit -m 'feat: add your feature'`).
4. Push to the branch (`git push origin feat/your-feature`).
5. Open a Pull Request.

---

## 📜 License

This project is private. Do not distribute without permission.

---

## 🔗 Links

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Vercel Dashboard](https://vercel.com)
- [Turborepo Docs](https://turbo.build/repo)
