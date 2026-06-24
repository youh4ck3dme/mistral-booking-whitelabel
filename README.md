# NEXIFY TECH CENTER

> **White-Label Booking SaaS** built with **Next.js (App Router) + Supabase + TypeScript**.
> Multi-tenant platform with AI CRO, upsell capabilities, and custom branding per tenant.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) >= 18.0.0
- [pnpm](https://pnpm.io/) (recommended)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Vercel CLI](https://vercel.com/docs/cli) (for deployment)

### 1. Clone & Install
```bash
# Clone the repository
git clone https://github.com/youh4ck3dme/mistral-booking-whitelabel.git
cd mistral-booking-whitelabel

# Install dependencies
pnpm install

# Initialize Supabase (if not already set up)
pnpm run db:push
pnpm run db:seed
```

### 2. Environment Variables
Create a `.env.local` file in `apps/web`:
```env
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### 3. Run Development Server
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

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
| White-Label | Custom branding, domains, and theming per tenant | ✅ Implemented |
| Booking System | Secure RPC-based booking with time slot validation | ✅ Implemented |
| **Clickable Calendar** | Interactive calendar with time slot picker for reservations | ✅ Implemented |
| AI CRO | Recommendations, upsell bundles, A/B testing | ✅ Implemented |
| Admin Dashboards | Tenant and platform-level admin panels | ✅ Implemented |

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
# Unit tests
pnpm test

# E2E tests (Cypress)
pnpm run test:e2e

# Lint
pnpm lint
```

### Test Coverage
- Unit tests: Core booking logic, RLS policies, AI fallback, **calendar utilities (51 tests)**
- Integration tests: FE/BE slot parity, tenant isolation
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