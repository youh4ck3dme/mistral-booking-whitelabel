# NEXIFY TECH CENTER - Deployment Guide

## 🚀 Quick Deployment

This guide will walk you through deploying the **NEXIFY TECH CENTER** white-label booking SaaS to **Vercel (frontend)** and **Supabase (backend)**.

---

## 📋 Prerequisites

1. **Accounts Required**
   - [GitHub](https://github.com) (for repository)
   - [Vercel](https://vercel.com) (for frontend hosting)
   - [Supabase](https://supabase.com) (for backend/database)

2. **Tools Required**
   - [Node.js](https://nodejs.org/) >= 18.0.0
   - [pnpm](https://pnpm.io/) (recommended)
   - [Supabase CLI](https://supabase.com/docs/guides/cli)
   - [Vercel CLI](https://vercel.com/docs/cli) (optional)

---

## 🛠️ Step 1: Set Up Supabase

### 1.1 Create a New Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in your project details:
   - **Project Name**: `nexify-tech-center`
   - **Database Password**: [Set a strong password]
   - **Region**: Choose the closest to your users
4. Click **"Create Project"** (this may take a few minutes)

### 1.2 Configure Database
1. Once the project is created, go to **SQL Editor**
2. Run the following to enable UUID extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

### 1.3 Apply Migrations
1. In your local repository, ensure you have the Supabase CLI installed:
   ```bash
   npm install -g supabase
   ```

2. Link your local project to Supabase:
   ```bash
   cd mistral-booking-whitelabel
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   (Get `YOUR_PROJECT_REF` from your Supabase project settings)

3. Push migrations to Supabase:
   ```bash
   pnpm db:push
   ```

4. Seed initial data:
   ```bash
   pnpm db:seed
   ```

### 1.4 Enable Row Level Security (RLS)
1. Go to **Authentication → Policies** in Supabase Dashboard
2. Verify that RLS is enabled on all tables (it should be from migrations)

### 1.5 Configure Auth
1. Go to **Authentication → Providers**
2. Enable the providers you want to support (Email, Google, etc.)
3. For production, configure your site URL and redirect URLs

### 1.6 Get Your Supabase Credentials
1. Go to **Project Settings → API**
2. Copy:
   - **Project URL** (e.g., `https://YOUR_PROJECT_REF.supabase.co`)
   - **anon public key** (e.g., `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

---

## 🌐 Step 2: Set Up Vercel

### 2.1 Create a New Vercel Project
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New" → "Project"**
3. Import your GitHub repository: `youh4ck3dme/mistral-booking-whitelabel`
4. Configure the project:
   - **Project Name**: `nexify-tech-center`
   - **Framework Preset**: Next.js
   - **Root Directory**: (leave empty)
5. Click **"Deploy"**

### 2.2 Configure Environment Variables
1. In your Vercel project, go to **Settings → Environment Variables**
2. Add the following variables:

   | Name | Value | Description |
   |------|-------|-------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL | Frontend Supabase connection |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Frontend Supabase auth |
   | `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | Server-side operations |
   | `SUPABASE_DB_URL` | `postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR_PROJECT_REF].supabase.co:5432/postgres` | For migrations |

3. To get the **service role key**:
   - Go to **Project Settings → API** in Supabase
   - Under **Project API keys**, find **service_role secret**

### 2.3 Configure Build Settings
1. In Vercel project settings, go to **Build & Development Settings**
2. Set:
   - **Build Command**: `pnpm build`
   - **Install Command**: `pnpm install`
   - **Output Directory**: `.next`

---

## 🔄 Step 3: Configure GitHub Actions (CI/CD)

The repository already includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that runs on every push and pull request.

### 3.1 Verify Workflow
The workflow includes:
- **Lint**: Runs ESLint on all packages
- **Build**: Builds the Next.js app and all packages
- **Test**: Runs all tests (unit, integration)

### 3.2 Add Secrets to GitHub
1. Go to your GitHub repository **Settings → Secrets and variables → Actions**
2. Add the following secrets (if needed for deployment):
   - `SUPABASE_DB_URL`
   - `VERCEL_TOKEN` (for automatic deployment)

---

## 🧪 Step 4: Test Your Deployment

### 4.1 Verify Supabase Setup
1. Go to **Table Editor** in Supabase
2. Verify that:
   - All tables exist (tenants, services, bookings, etc.)
   - Seed data is present (2 tenants, services, etc.)
   - RLS policies are enabled

### 4.2 Test the Frontend
1. Visit your Vercel deployment URL
2. Test the following:
   - Home page loads
   - Navigate to `/demo-clinic/book` (should show booking page)
   - Navigate to `/wellness-center/book` (should show different branding)
   - Try to make a test booking (if auth is configured)

### 4.3 Test Authentication
1. If you enabled email auth:
   - Try signing up with a test email
   - Verify you can log in
2. Test tenant isolation:
   - Log in as a user from Tenant A
   - Verify you cannot access Tenant B's data

---

## 📡 Step 5: Configure Custom Domains (Optional)

### 5.1 For Tenants
Each tenant can have their own custom domain (e.g., `clinic.yourdomain.com`):

1. In Vercel:
   - Go to your project
   - Go to **Settings → Domains**
   - Add the custom domain
   - Configure DNS records

2. In Supabase:
   - Configure the domain in `tenant_branding` table
   - Update RLS policies if needed

### 5.2 For Platform Admin
Set up a domain for the platform admin (e.g., `admin.nexify.tech`):
1. Add the domain in Vercel
2. Configure routing in Next.js middleware

---

## 🔄 Step 6: Set Up Monitoring

### 6.1 Supabase Monitoring
1. Go to **Dashboard → Analytics** in Supabase
2. Set up alerts for:
   - High database load
   - Authentication failures
   - Storage usage

### 6.2 Vercel Monitoring
1. Go to **Deployments** in Vercel
2. Set up alerts for:
   - Deployment failures
   - High latency
   - Error rates

### 6.3 Error Tracking (Optional)
Integrate with:
- [Sentry](https://sentry.io/) for error tracking
- [Logflare](https://logflare.app/) for logging

---

## 📈 Step 7: Scale Your Application

### 7.1 Database Scaling
- **Read Replicas**: Add read replicas for read-heavy workloads
- **Connection Pooling**: Configure PgBouncer in Supabase
- **Database Sharding**: Consider for 10,000+ tenants

### 7.2 Application Scaling
- **Vercel**: Automatic scaling for frontend
- **Edge Functions**: Use for serverless backend logic
- **Caching**: Implement Redis for frequent queries

### 7.3 Multi-Region Deployment
- Deploy Supabase in multiple regions
- Use Vercel's global network
- Implement geo-routing

---

## 🔧 Step 8: Maintenance & Updates

### 8.1 Database Migrations
When you make schema changes:
1. Create a new migration file in `supabase/migrations/`
2. Test locally with `supabase db start`
3. Push to Supabase: `pnpm db:push`

### 8.2 Application Updates
1. Test changes in a staging environment
2. Update documentation
3. Deploy to production

### 8.3 Backups
1. Set up automatic backups in Supabase
2. Regularly export your database
3. Test restore procedures

---

## 🚨 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| **RLS blocking all queries** | Check your RLS policies in Supabase. Ensure users have the correct roles. |
| **CORS errors** | Add your frontend domain to **Allowed Origins** in Supabase Auth settings. |
| **Build failures** | Check Node.js version (must be >= 18.0.0). Run `pnpm install` and `pnpm build` locally. |
| **Booking creation fails** | Verify the `create_booking` RPC function exists and has correct permissions. |
| **Tenant not found** | Check the `tenants` table has the correct slug. Verify URL routing in Next.js. |

### Debugging Tips

1. **Supabase Logs**:
   ```bash
   supabase logs
   ```

2. **Next.js Logs**:
   ```bash
   pnpm dev
   # Check console output
   ```

3. **Database Inspection**:
   ```sql
   -- Check RLS policies
   SELECT * FROM pg_policies;

   -- Check table permissions
   SELECT * FROM information_schema.table_privileges;
   ```

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Turborepo Documentation](https://turbo.build/repo)
- [Vercel Documentation](https://vercel.com/docs)

---

## 🎯 Next Steps

1. **Customize**: Modify the branding, services, and configuration for your tenants
2. **Extend**: Add new features (payment processing, calendar sync, etc.)
3. **Monitor**: Set up monitoring and alerting
4. **Scale**: Prepare for production traffic

---

## 📞 Support

For issues with:
- **Supabase**: [Supabase Community](https://github.com/supabase/community)
- **Vercel**: [Vercel Support](https://vercel.com/support)
- **This Project**: Open an issue in the repository