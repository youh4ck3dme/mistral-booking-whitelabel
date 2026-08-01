-- Migration: fix infinite recursion in tenant_users RLS policies
-- Rollback: restore the raw-subquery policy bodies from 002_rls_policies.sql
-- and DROP FUNCTION is_tenant_member, is_tenant_admin_or_staff.
--
-- Discovered by replaying migrations against a fresh local Supabase instance
-- and exercising the booking assistant as an authenticated user:
--   "infinite recursion detected in policy for relation \"tenant_users\""
--   (Postgres 42P17)
--
-- Root cause: the "Tenant users can access their own tenant users" policy on
-- tenant_users queries tenant_users again inside its own USING clause.
-- Evaluating that policy requires re-evaluating it, which requires
-- re-evaluating it... Postgres detects the cycle and errors out. Because
-- every other table's policy (services, bookings, tenant_branding,
-- time_slots_config, ai_experiments, ai_impressions, ai_conversions) also
-- does `EXISTS (SELECT 1 FROM tenant_users WHERE ...)`, evaluating THEIR
-- policies triggers tenant_users' own broken policy too — so this breaks
-- authenticated reads on essentially every tenant-scoped table, including
-- the admin panel's own queries (apps/web/app/[tenantSlug]/admin/page.tsx),
-- not just the new AI booking assistant that surfaced it.
--
-- Fix: SECURITY DEFINER helper functions bypass RLS for their own internal
-- query, breaking the cycle. Policies now call the helper instead of
-- re-querying tenant_users directly.

CREATE OR REPLACE FUNCTION is_tenant_member(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM tenant_users
    WHERE tenant_id = p_tenant_id
    AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION is_tenant_admin_or_staff(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM tenant_users
    WHERE tenant_id = p_tenant_id
    AND user_id = auth.uid()
    AND role IN ('admin', 'staff')
  );
$$;

-- tenant_users: self-referencing policy — the actual source of the recursion.
DROP POLICY IF EXISTS "Tenant users can access their own tenant users" ON tenant_users;
CREATE POLICY "Tenant users can access their own tenant users"
ON tenant_users FOR ALL
TO authenticated
USING (is_tenant_admin_or_staff(tenant_id));

-- services
DROP POLICY IF EXISTS "Tenant users can access their services" ON services;
CREATE POLICY "Tenant users can access their services"
ON services FOR ALL
TO authenticated
USING (is_tenant_member(tenant_id));

-- bookings (SELECT)
DROP POLICY IF EXISTS "Tenant users can access their bookings" ON bookings;
CREATE POLICY "Tenant users can access their bookings"
ON bookings FOR SELECT
TO authenticated
USING (
  (user_id = auth.uid()) OR is_tenant_admin_or_staff(tenant_id)
);

-- bookings (INSERT via RPC check)
DROP POLICY IF EXISTS "Authenticated users can create bookings via RPC" ON bookings;
CREATE POLICY "Authenticated users can create bookings via RPC"
ON bookings FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM services
    WHERE services.id = bookings.service_id AND services.is_active = true
  ) AND is_tenant_member(tenant_id)
);

-- tenant_branding
DROP POLICY IF EXISTS "Tenant users can access their branding" ON tenant_branding;
CREATE POLICY "Tenant users can access their branding"
ON tenant_branding FOR ALL
TO authenticated
USING (is_tenant_member(tenant_id));

-- time_slots_config
DROP POLICY IF EXISTS "Tenant users can access their time slots" ON time_slots_config;
CREATE POLICY "Tenant users can access their time slots"
ON time_slots_config FOR ALL
TO authenticated
USING (is_tenant_member(tenant_id));

-- ai_experiments
DROP POLICY IF EXISTS "Tenant users can access their AI experiments" ON ai_experiments;
CREATE POLICY "Tenant users can access their AI experiments"
ON ai_experiments FOR ALL
TO authenticated
USING (is_tenant_member(tenant_id));

-- ai_impressions
DROP POLICY IF EXISTS "Tenant users can access their AI impressions" ON ai_impressions;
CREATE POLICY "Tenant users can access their AI impressions"
ON ai_impressions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ai_experiments ae
    WHERE ae.id = ai_impressions.experiment_id
    AND is_tenant_member(ae.tenant_id)
  )
);

-- ai_conversions
DROP POLICY IF EXISTS "Tenant users can access their AI conversions" ON ai_conversions;
CREATE POLICY "Tenant users can access their AI conversions"
ON ai_conversions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ai_impressions aimp
    JOIN ai_experiments ae ON ae.id = aimp.experiment_id
    WHERE aimp.id = ai_conversions.impression_id
    AND is_tenant_member(ae.tenant_id)
  )
);
