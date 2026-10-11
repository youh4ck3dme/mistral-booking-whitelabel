-- Booking engine verification (self-contained).
--
-- Creates its own fixtures and runs inside a single transaction that is rolled
-- back, so it can be run against a dev or staging database without leaving data.
-- Every check raises an exception on failure. A clean run ends with the
-- result row 'ALL BOOKING CHECKS PASSED'.
--
-- Requires migrations 001-013 and a Supabase-like auth schema (auth.users, auth.uid()).
--
-- Run:  psql -v ON_ERROR_STOP=1 -f supabase/tests/booking_concurrency_verification.sql

\set ON_ERROR_STOP on
BEGIN;
SET LOCAL TIME ZONE 'UTC';

-- ============================================
-- Helpers (temporary, rolled back with the transaction)
-- ============================================
CREATE FUNCTION pg_temp.as_user(p_uid uuid) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', p_uid::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
END $$;

CREATE FUNCTION pg_temp.as_owner() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE 'RESET ROLE';
  PERFORM set_config('request.jwt.claim.sub', '', true);
END $$;

-- Passes only if p_sql fails with the given SQLSTATE and a matching message.
CREATE FUNCTION pg_temp.expect_sqlstate(p_sql text, p_state text, p_msg_like text DEFAULT '%')
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_state text;
  v_msg text;
BEGIN
  BEGIN
    EXECUTE p_sql;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_state = RETURNED_SQLSTATE, v_msg = MESSAGE_TEXT;
    IF v_state IS DISTINCT FROM p_state OR v_msg NOT LIKE p_msg_like THEN
      RAISE EXCEPTION 'expected % (%), got % (%) for: %', p_state, p_msg_like, v_state, v_msg, p_sql;
    END IF;
    RETURN;
  END;
  RAISE EXCEPTION 'expected error % but statement succeeded: %', p_state, p_sql;
END $$;

-- Passes only if p_sql affects zero rows (used for RLS-filtered writes).
CREATE FUNCTION pg_temp.expect_no_rows(p_sql text) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  n bigint;
BEGIN
  EXECUTE p_sql;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN
    RAISE EXCEPTION 'expected 0 rows affected, got %: %', n, p_sql;
  END IF;
END $$;

CREATE FUNCTION pg_temp.assert_true(p_ok boolean, p_what text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF NOT coalesce(p_ok, false) THEN
    RAISE EXCEPTION 'assertion failed: %', p_what;
  END IF;
END $$;

-- ============================================
-- Fixtures (owner role, bypasses RLS)
-- ============================================
INSERT INTO auth.users (id, email) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'verify-user-1@example.test'),
  ('a0000000-0000-0000-0000-000000000002', 'verify-user-2@example.test');

INSERT INTO public.tenants (id, name, slug, locale) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Verify Tenant', 'verify-tenant', 'sk');

INSERT INTO public.services (id, tenant_id, name, duration, price, is_active) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Verify Service', 60, 10, true);

INSERT INTO public.time_slots_config (id, tenant_id, start_time, end_time, is_active) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '09:00', '17:00', true);

-- ============================================
-- 1. Booking via RPC, then overlap, adjacency, duplicate and cancel-reuse
-- ============================================
SELECT pg_temp.as_user('a0000000-0000-0000-0000-000000000001');
SELECT public.create_booking('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
                             '2030-01-01 10:00:00+00', '2030-01-01 11:00:00+00') AS b1 \gset

-- Overlap must be rejected with exclusion_violation (23P01).
SELECT pg_temp.as_user('a0000000-0000-0000-0000-000000000002');
SELECT pg_temp.expect_sqlstate($q$SELECT public.create_booking('b0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001', '2030-01-01 10:30:00+00', '2030-01-01 11:30:00+00')$q$,
  '23P01', '%already booked%');

-- Adjacent slot must be allowed.
SELECT public.create_booking('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
                             '2030-01-01 11:00:00+00', '2030-01-01 12:00:00+00') AS b2 \gset

-- Exact duplicate of an active slot must be rejected with the same deterministic code (23P01).
SELECT pg_temp.expect_sqlstate($q$SELECT public.create_booking('b0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001', '2030-01-01 11:00:00+00', '2030-01-01 12:00:00+00')$q$,
  '23P01', '%already booked%');

-- Cancelled slot can be rebooked by another user.
SELECT pg_temp.as_user('a0000000-0000-0000-0000-000000000001');
SELECT public.cancel_booking(:'b1');
SELECT pg_temp.as_user('a0000000-0000-0000-0000-000000000002');
SELECT public.create_booking('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
                             '2030-01-01 10:00:00+00', '2030-01-01 11:00:00+00') AS b3 \gset

-- ============================================
-- 2. RLS: direct client writes
-- ============================================
-- A user cannot insert a booking on behalf of another user.
SELECT pg_temp.expect_sqlstate($q$INSERT INTO public.bookings (tenant_id, user_id, service_id, start_time, end_time, status)
  VALUES ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
          'c0000000-0000-0000-0000-000000000001', '2030-02-01 10:00:00+00', '2030-02-01 11:00:00+00', 'confirmed')$q$,
  '42501', '%row-level security%');

-- A user cannot update bookings directly (only via RPC).
SELECT pg_temp.expect_no_rows(format('UPDATE public.bookings SET status = %L WHERE id = %L', 'cancelled', :'b2'));

-- ============================================
-- 3. Owner-role checks: trigger, notifications, search_path, privileges
-- ============================================
SELECT pg_temp.as_owner();

-- Cancelled bookings cannot be reactivated (status transition trigger).
SELECT pg_temp.expect_sqlstate(format('UPDATE public.bookings SET status = %L WHERE id = %L', 'confirmed', :'b1'),
  'P0001', '%Cannot modify a cancelled booking%');

-- Confirmation notifications are queued by the booking trigger.
SELECT pg_temp.assert_true(EXISTS (
  SELECT 1 FROM public.notification_deliveries
  WHERE booking_id = :'b2' AND notification_type = 'booking_confirmation'
), 'confirmation notification queued for booking b2');

-- Privileges: internal routines are not client-callable; client RPCs are.
DO $priv$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('public.claim_notification_deliveries(integer,uuid)', 'anon', false),
      ('public.claim_notification_deliveries(integer,uuid)', 'authenticated', false),
      ('public.queue_booking_notification(uuid,text,timestamp with time zone)', 'anon', false),
      ('public.queue_booking_notification(uuid,text,timestamp with time zone)', 'authenticated', false),
      ('public.schedule_booking_reminders(interval,interval)', 'anon', false),
      ('public.schedule_booking_reminders(interval,interval)', 'authenticated', false),
      ('public.send_reminders()', 'anon', false),
      ('public.send_reminders()', 'authenticated', false),
      ('public.send_booking_email(uuid)', 'anon', false),
      ('public.send_booking_email(uuid)', 'authenticated', false),
      ('public.create_booking(uuid,uuid,timestamp with time zone,timestamp with time zone)', 'anon', false),
      ('public.create_booking(uuid,uuid,timestamp with time zone,timestamp with time zone)', 'authenticated', true),
      ('public.cancel_booking(uuid)', 'anon', false),
      ('public.cancel_booking(uuid)', 'authenticated', true),
      ('public.get_booked_slots(uuid,uuid,timestamp with time zone,timestamp with time zone)', 'anon', true),
      ('public.is_tenant_member(uuid)', 'anon', false),
      ('public.is_tenant_member(uuid)', 'authenticated', true)
    ) AS v(fn, role_name, expected)
  LOOP
    IF has_function_privilege(r.role_name, r.fn::regprocedure, 'EXECUTE') IS DISTINCT FROM r.expected THEN
      RAISE EXCEPTION 'EXECUTE privilege mismatch: role=% fn=% expected=%', r.role_name, r.fn, r.expected;
    END IF;
  END LOOP;
END $priv$;

-- Every SECURITY DEFINER / trigger / SQL function in public pins its search_path.
DO $sp$
DECLARE
  n integer;
BEGIN
  SELECT count(*) INTO n
  FROM pg_proc p
  JOIN pg_namespace ns ON ns.oid = p.pronamespace
  WHERE ns.nspname = 'public'
    AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e')
    AND NOT EXISTS (
      SELECT 1 FROM unnest(coalesce(p.proconfig, '{}'::text[])) c WHERE c = 'search_path=""'
    );
  IF n > 0 THEN
    RAISE EXCEPTION '% function(s) in public do not pin search_path to empty', n;
  END IF;
END $sp$;

-- Anonymous client cannot read notification recipients through the claim routine.
SELECT pg_temp.assert_true(NOT has_function_privilege('anon',
  'public.claim_notification_deliveries(integer,uuid)'::regprocedure, 'EXECUTE'),
  'anon cannot call claim_notification_deliveries');

SELECT 'ALL BOOKING CHECKS PASSED' AS result;
ROLLBACK;
