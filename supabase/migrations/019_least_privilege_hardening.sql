-- Migration 019: Least-Privilege Access Hardening (DB-014)
-- Rollback: re-run migration 011 grants if needed.
--
-- Migration 011 granted ALL (including TRUNCATE, TRIGGER, REFERENCES) on every
-- table and routine to anon and authenticated. RLS cannot constrain TRUNCATE,
-- and every SECURITY DEFINER / internal routine was callable by both roles.
--
-- Strategy (verified against the real schema in migrations 001-018):
--   * Tables: keep DML for authenticated (RLS governs rows, the app writes to
--     time_slots_config, tenant_reminder_settings, ai_* ...). Remove the
--     privileges RLS cannot protect. anon becomes read-only.
--   * Routines: revoke EXECUTE from PUBLIC/anon/authenticated on every
--     application function, then grant back an explicit whitelist. The whitelist
--     includes the RLS helper functions (is_tenant_member, ...), because policies
--     are evaluated with the caller's privileges.
--   * Extension-owned functions (uuid-ossp, pgcrypto, btree_gist) are untouched.

-- 1. Tables ---------------------------------------------------------------
REVOKE TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM anon;

-- 2. Sequences: no setval() for client roles ------------------------------
REVOKE UPDATE ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

-- 3. Default privileges for objects created by later migrations -------------
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE INSERT, UPDATE, DELETE ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE UPDATE ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM PUBLIC, anon, authenticated;

-- 4. Routines: close everything, then open the whitelist ---------------------
DO $$
DECLARE
  r record;
BEGIN
  -- 4a. Close every application routine (extension members are excluded).
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind IN ('f', 'p')
      AND NOT EXISTS (
        SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e'
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;

  -- 4b. Public booking surface: anon + authenticated.
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'get_available_slots',
        'get_booked_slots',
        'list_bookable_staff',
        'get_booking_by_manage_token',
        'cancel_booking_by_token',
        'reschedule_booking_by_token'
      )
  LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon, authenticated', r.sig);
  END LOOP;

  -- 4c. Signed-in users: booking RPCs and the RLS helper functions.
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'create_booking_with_staff',
        'create_booking',
        'cancel_booking',
        'set_booking_outcome',
        'issue_booking_manage_token',
        'is_tenant_member',
        'is_tenant_admin_or_staff',
        'is_tenant_admin'
      )
  LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.sig);
  END LOOP;
END $$;

-- Outbox / reminder worker routines (claim_notification_deliveries,
-- record_notification_failure, schedule_booking_reminders) stay service_role only.
