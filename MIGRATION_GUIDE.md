# 📋 Migration Guide - Apply 021_autoops_tables.sql to booking-praha

## 🎯 Quick Start

This guide will help you apply migration `20261014150000_autoops_tables.sql` to your Supabase project **booking-praha-2026**.

---

## 📝 Prerequisites

1. **PostgreSQL client (psql)** installed on your machine
   - Download: https://www.postgresql.org/download/
   - Verify: `psql --version`

2. **Supabase Access Token**: Available at https://app.supabase.com/account/tokens

3. **Project Details**:
   - Name: YOUR_PROJECT_NAME
   - Reference: YOUR_PROJECT_REF
   - Region: YOUR_REGION

---

## 🔧 Method 1: Using psql Directly (Recommended)

### Step 1: Get Service Role Key

Run this in PowerShell or Terminal:

```powershell
# PowerShell
$token = "YOUR_SUPABASE_ACCESS_TOKEN"
$projectRef = "YOUR_PROJECT_REF"
$headers = @{"Authorization" = "Bearer $token"}
$response = Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$projectRef/api-keys" -Headers $headers
$serviceRoleKey = ($response | Where-Object { $_.name -eq "service_role" }).api_key
Write-Output "Service Role Key: $serviceRoleKey"
```

Or in bash:

```bash
# Linux/Mac/WSL
SUPABASE_TOKEN="YOUR_SUPABASE_ACCESS_TOKEN"
PROJECT_REF="YOUR_PROJECT_REF"
curl -s -H "Authorization: Bearer $SUPABASE_TOKEN" \
  "https://api.supabase.com/v1/projects/$PROJECT_REF/api-keys" | \
  jq -r '.[] | select(.name == "service_role") | .api_key'
```

### Step 2: Apply Migration

```bash
# Replace SERVICE_ROLE_KEY with the actual key from Step 1
psql postgresql://postgres:SERVICE_ROLE_KEY@aws-1-eu-north-1.pooler.supabase.com:5432/postgres -f supabase/migrations/20261014150000_autoops_tables.sql
```

### Step 3: Verify Tables

```bash
psql postgresql://postgres:SERVICE_ROLE_KEY@aws-1-eu-north-1.pooler.supabase.com:5432/postgres -c "
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('autoops_events', 'autoops_runs', 'booking_waitlist');
"
```

Expected output:
```
 table_name
------------
 autoops_events
 autoops_runs
 booking_waitlist
(3 rows)
```

---

## 🔧 Method 2: Using Supabase Dashboard (No CLI Required)

### Step 1: Log in to Supabase
1. Go to: https://app.supabase.com
2. Navigate to: booking-praha-2026 project

### Step 2: Open SQL Editor
1. Click on "SQL Editor" in the left sidebar
2. Click "New query"

### Step 3: Copy and Paste Migration
1. Open file: `supabase/migrations/20261014150000_autoops_tables.sql`
2. Copy entire content
3. Paste into SQL Editor
4. Click "Run"

### Step 4: Verify Tables
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('autoops_events', 'autoops_runs', 'booking_waitlist');
```

---

## 📊 What This Migration Creates

### Tables:

1. **autoops_events** - Audit log for AutoOps system events
   - Tracks: no_show_detected, waitlist_slot_opened, waitlist_filled, slot_compaction_suggestion
   - Tenant isolation with RLS

2. **autoops_runs** - Execution log for each AutoOps worker run
   - Tracks: execution time, no-shows detected, waitlist filled, outbox processed, errors

3. **booking_waitlist** - Customer waitlist for auto-fill functionality
   - Supports priority queue
   - Automatic expiration (30 days)
   - Status tracking: waiting, notified, fulfilled, expired

### Functions:
- **process_notification_outbox** RPC - Batch outbox processing

### Triggers:
- **booking_waitlist_updated_at_trigger** - Auto-update timestamps

---

## ✅ Verification Checklist

- [ ] Migration file exists: `supabase/migrations/20261014150000_autoops_tables.sql`
- [ ] Tables created: autoops_events, autoops_runs, booking_waitlist
- [ ] RLS policies applied to all tables
- [ ] Indexes created for all tables
- [ ] Function process_notification_outbox exists
- [ ] Trigger booking_waitlist_updated_at_trigger exists

---

## 🚨 Troubleshooting

### Error: "psql: command not found"
**Solution:** Install PostgreSQL client from https://www.postgresql.org/download/

### Error: "Connection refused" or "Password authentication failed"
**Solution:** 
- Verify the service role key is correct
- Try with SSL mode: `?sslmode=require`
- Try direct connection: `db.hmkcigjonbpjpblskrrw.supabase.co`

### Error: "Permission denied"
**Solution:** Make sure you have admin rights on the project

### Error: "Migration already exists"
**Solution:** The migration might already be applied. Check with:
```sql
SELECT * FROM supabase_migrations WHERE version = '20261014150000';
```

---

## 🎉 After Migration

Once migration is applied, you can test:

1. **AutoOps Worker**:
   ```bash
   curl -X GET http://localhost:3009/api/cron/autoops-worker \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

2. **BizAgent API**:
   ```bash
   curl -X POST http://localhost:3009/api/chat/biz-agent \
     -H "Content-Type: application/json" \
     -H "Cookie: [session-cookie]" \
     -d '{"tenantId":"YOUR_TENANT_ID","messages":[{"role":"user","content":"test"}]}'
   ```

---

## 📝 Notes

- This migration adds tables for the AutoOps system
- No data is modified, only new tables are created
- RLS policies ensure tenant isolation
- The migration is idempotent (can be run multiple times safely)
