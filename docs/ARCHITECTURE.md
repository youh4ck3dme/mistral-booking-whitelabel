# NEXIFY TECH CENTER - Architecture Overview

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                NEXIFY TECH CENTER                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐  │
│  │   Frontend      │    │   Backend       │    │      Database            │  │
│  │  (Next.js)      │───▶│  (Supabase)     │───▶│   (PostgreSQL)          │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────────────┘  │
│           │                       │                       │                │
│           ▼                       ▼                       ▼                │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                            Multi-Tenant Layer                           │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │  Tenant A   │  │  Tenant B   │  │  Tenant C   │  │   Platform   │  │  │
│  │  │ (demo-clinic)│  │(wellness-   │  │             │  │   Admin      │  │  │
│  │  │             │  │  center)    │  │             │  │             │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐  │
│  │   AI CRO        │    │   Upsell         │    │   Booking Logic         │  │
│  │  (Recommendations)│    │  (Bundles)      │    │   (RPC Functions)       │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Monorepo Structure

```
mistral-booking-whitelabel/
├── apps/
│   └── web/                      # Next.js 14 (App Router)
│       ├── app/
│       │   ├── (marketing)/      # Public landing pages
│       │   ├── (auth)/           # Authentication pages
│       │   ├── [tenantSlug]/     # Tenant-specific routes
│       │   │   ├── book/         # Public booking flow (Calendar, TimeSlotPicker)
│       │   │   ├── admin/        # Tenant admin dashboard (AdminCalendar)
│       │   │   └── portal/       # Client portal
│       │   └── platform/         # Global platform admin
│       ├── public/               # Static assets
│       └── src/                  # Shared utilities & booking module
│
├── packages/
│   ├── @repo/ui/                # Shared UI components
│   │   ├── src/
│   │   │   ├── components/      # Button, Card, TenantLogo, etc.
│   │   │   ├── styles/          # Tailwind config, colors
│   │   │   └── utils/           # Helper functions
│   │   └── package.json
│   │
│   ├── @repo/core/              # Core business logic
│   │   ├── src/
│   │   │   ├── booking/         # Booking service, validation
│   │   │   ├── tenant/          # Tenant management
│   │   │   └── rpc/             # Supabase RPC clients
│   │   └── package.json
│   │
│   ├── @repo/supabase/          # Supabase integration
│   │   ├── src/
│   │   │   ├── client.ts        # Typed Supabase client
│   │   │   └── types.ts         # Database types
│   │   └── package.json
│   │
│   └── @repo/ai/                # AI CRO & Upsell
│       ├── src/
│       │   ├── recommendation/  # Service recommendations
│       │   └── upsell/          # Upsell bundles
│       └── package.json
│
├── supabase/
│   ├── migrations/              # SQL migrations
│   │   ├── 001_init_tenants.sql
│   │   ├── 002_rls_policies.sql
│   │   └── 003_booking_functions.sql
│   └── seed/                    # Seed data
│       └── 001_initial_data.sql
│
├── docs/
│   ├── ARCHITECTURE.md          # This file
│   └── DEPLOYMENT.md            # Deployment guide
│
└── .github/
    └── workflows/
        └── ci.yml               # GitHub Actions CI
```

---

## 🔗 Key Components

### 1. Multi-Tenancy Model
- **Single Database**: All tenants share one PostgreSQL database
- **Tenant Isolation**: `tenant_id` column in all tenant-scoped tables
- **Row Level Security (RLS)**: Policies ensure tenants can only access their own data
- **Custom Domains**: Each tenant can have their own domain (e.g., `clinic1.nexify.tech`)

### 2. Authentication & Authorization
- **Supabase Auth**: Built-in authentication with email/password, OAuth, etc.
- **Role-Based Access**: `admin`, `staff`, `client` roles per tenant
- **Service Role**: Privileged operations use Supabase service role key

### 3. Booking System
- **Time Slot Management**: Configurable operating hours per tenant (fallback: 09:00-17:00)
- **RPC Functions**: Secure server-side booking creation/cancellation
- **Idempotency**: Prevent duplicate bookings via database EXCLUDE constraint
- **Validation**: Time range, service duration, availability checks
- **Clickable Calendar**: Interactive calendar with month/day navigation, time slot picker
- **Slot Generation**: Dynamic slots based on service duration, not fixed intervals
- **Conflict Prevention**: Database-level EXCLUDE constraint blocks overlapping active bookings

### 4. AI CRO Layer
- **Recommendation Engine**: Suggest services based on user history
- **Upsell Bundles**: AI-driven bundle suggestions at checkout
- **A/B Testing**: Experiment tracking for optimization
- **Fallback**: Deterministic behavior when AI is unavailable

### 5. Booking Calendar Components
- **Calendar.tsx**: Month view calendar with navigation, date selection, booking density indicators
- **TimeSlotPicker.tsx**: Time slot grid with availability status, next available slot helper
- **AdminCalendar.tsx**: Admin dashboard calendar with filters, booking list, cancel functionality
- **calendar.utils.ts**: Pure utility functions for slot generation, overlap detection, date formatting
- **booking.service.ts**: RPC clients for booking operations (create, cancel, availability checks)

### 5. White-Label Capabilities
- **Branding**: Logo, colors, favicon per tenant
- **Localization**: Multi-language support
- **Theming**: Custom CSS variables per tenant
- **Domain Mapping**: Custom domains for each tenant

---

## 🔄 Data Flow

### Booking Flow
```
1. User visits /[tenantSlug]/book
2. System resolves tenant by slug
3. Fetches available services (RLS filtered)
4. **User selects service from calendar UI**
5. **Calendar displays available dates with density indicators**
6. **User selects date from interactive calendar**
7. **Fetches booked slots via get_booked_slots RPC**
8. **Generates time slots based on service duration**
9. **TimeSlotPicker displays available slots, marks booked/unavailable**
10. User selects time slot
11. Frontend validates slot availability (client-side check)
12. Calls create_booking RPC function
13. Backend validates:
    - Service exists and is active
    - Time slot is available
    - No overlapping bookings (EXCLUDE constraint)
    - Duration matches service
    - Tenant ownership
14. Creates booking record
15. Returns confirmation to user
16. **Calendar refreshes automatically**
```

### Admin Calendar Flow
```
1. Admin visits /[tenantSlug]/admin
2. System loads AdminCalendar component
3. Fetches all bookings for tenant via SELECT (RLS protected)
4. Displays calendar with booking count per day
5. Admin can filter by service and status
6. Clicking a date shows bookings list for that day
7. Admin can cancel booking via cancel_booking RPC
8. Calendar refreshes after cancellation
```

### Tenant Resolution
```
1. User visits any tenant-specific route
2. Next.js middleware extracts tenantSlug from URL
3. Queries tenants table by slug
4. Sets tenant context (RLS, theming)
5. Renders tenant-specific UI
```

---

## 🛡️ Security

### RLS Policies
- All tables have RLS enabled
- Policies ensure users can only access data for their tenant
- Public policies for read-only access (services, time slots)
- Authenticated policies for mutations (bookings)

### Service Role
- Used for privileged operations (migrations, admin functions)
- Never exposed to frontend
- Stored in server-side environment variables

### Input Validation
- All RPC functions validate inputs
- Time range checks (valid_time_range CHECK constraint)
- Service existence checks
- Tenant membership checks
- **Booking Protection**: EXCLUDE constraint prevents overlapping active bookings
- **Status Transitions**: Trigger enforces valid status changes (pending → confirmed → cancelled)

---

## 🚀 Performance Considerations

### Indexes
- Composite indexes on frequently queried columns
- Tenant ID + User ID for tenant-scoped queries
- Time-based indexes for booking lookups

### Caching
- Supabase client-side caching for UI
- Server-side caching for tenant config
- CDN caching for static assets

### Query Optimization
- Select only needed columns
- Use RLS to limit result sets
- Batch operations where possible

---

## 🔧 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 14 (App Router) | React framework with SSR |
| Styling | Tailwind CSS | Utility-first CSS |
| Backend | Supabase | Postgres + Auth + Edge Functions |
| Database | PostgreSQL 15 | Relational database with RLS |
| Language | TypeScript | Type safety across the stack |
| Build Tool | Turborepo | Monorepo task orchestration |
| Package Manager | pnpm | Fast, disk-space efficient |
| CI/CD | GitHub Actions | Automated testing & deployment |
| Hosting (Frontend) | Vercel | Serverless deployment |
| Hosting (Backend) | Supabase | Managed Postgres |

---

## 📊 Scalability

### Horizontal Scaling
- Vercel: Automatic scaling for frontend
- Supabase: Database read replicas for read-heavy workloads
- Edge Functions: Serverless scaling for backend logic

### Multi-Tenant Scaling
- Single database supports thousands of tenants
- RLS policies add minimal overhead
- Tenant-specific indexes optimize queries

### Future Considerations
- Database sharding for very large scale
- Multi-region deployment for global tenants
- Microservices architecture for complex features

---

## 📝 Best Practices

### Code Organization
- Group by feature, not by layer
- Keep business logic in `@repo/core`
- Keep UI components in `@repo/ui`
- Keep database types in `@repo/supabase`

### Type Safety
- Use TypeScript throughout
- Generate database types from Supabase
- Share types between packages

### Testing
- Unit tests for business logic (51 calendar utility tests)
- Integration tests for FE/BE parity
- E2E tests for critical user flows
- Test with multiple tenants
- **Calendar-specific tests**: Slot generation, overlap detection, past slot filtering

### Security
- Never hardcode tenant IDs
- Use RLS for all data access
- Validate all user inputs
- Use service role only on server

---

## 🔗 Related Documents
- [Deployment Guide](DEPLOYMENT.md)
- [API Documentation](../apps/web/app/api/README.md) (TBD)
- [Database Schema](../supabase/migrations/README.md) (TBD)
- [Booking Calendar Implementation](../../CALENDAR_IMPLEMENTATION_REPORT.md)
- [Calendar QA Checklist](../../apps/web/src/lib/booking/CALENDAR_QA_CHECKLIST.md)