-- Least-privilege access verification (migration 019 / DB-014)
-- Self-contained, transactional rollback.
-- Ends with: 'ALL LEAST PRIVILEGE CHECKS PASSED'

\set ON_ERROR_STOP on
BEGIN;
SET LOCAL TIME ZONE 'UTC';

CREATE FUNCTION pg_temp.as_anon() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '', true);
  EXECUTE 'SET LOCAL ROLE anon';
END $$;

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

CREATE FUNCTION pg_temp.assert_true(p_ok boolean, p_what text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF p_ok IS NOT TRUE THEN
    RAISE EXCEPTION 'assertion failed: %', p_what;
  END IF;
END $$;

-- ============================================
-- Fixtures
-- ============================================
INSERT INTO auth.users (id, email) VALUES
  ('91000000-0000-0000-0000-000000000001', 'lp-customer@example.test'),
  ('91000000-0000-0000-0000-000000000002', 'lp-admin@example.test');

INSERT INTO public.tenants (id, name, slug, locale) VALUES
  ('92000000-0000-0000-0000-000000000001', 'LP Tenant', 'lp-tenant', 'sk');

INSERT INTO public.services (id, tenant_id, name, duration, price, is_active) VALUES
  ('93000000-0000-0000-0000-000000000001', '92000000-0000-0000-0000-000000000001', 'LP Service', 30, 25.00, true);


-- ============================================
-- 1. anon: public catalog readable, no writes, no internal/auth-only RPC
-- ============================================
SELECT pg_temp.as_anon();

DO $$
DECLARE
  v_count int;
BEGIN
  SELECT count(*) INTO v_count FROM public.tenants WHERE slug = 'lp-tenant';
  PERFORM pg_temp.assert_true(v_count = 1, 'anon should be able to select from tenants');

  SELECT count(*) INTO v_count FROM public.services WHERE tenant_id = '92000000-0000-0000-0000-000000000001';
  PERFORM pg_temp.assert_true(v_count = 1, 'anon should be able to select from services');
END $$;

SELECT pg_temp.expect_sqlstate('TRUNCATE public.services', '42501', '%permission denied%');

SELECT pg_temp.expect_sqlstate(
  'INSERT INTO public.services (tenant_id, name, duration, price) VALUES (''92000000-0000-0000-0000-000000000001'', ''Hacked'', 30, 0)',
  '42501', '%permission denied%');

SELECT pg_temp.expect_sqlstate(
  'UPDATE public.services SET price = 0', '42501', '%permission denied%');

SELECT pg_temp.expect_sqlstate(
  'SELECT public.claim_notification_deliveries(p_limit := 10)', '42501', '%permission denied%');

SELECT pg_temp.expect_sqlstate(
  'SELECT public.schedule_booking_reminders()', '42501', '%permission denied%');

SELECT pg_temp.expect_sqlstate(
  'SELECT public.create_booking_with_staff(''92000000-0000-0000-0000-000000000001''::uuid, ''93000000-0000-0000-0000-000000000001''::uuid, now(), now() + interval ''30 minutes'', NULL)',
  '42501', '%permission denied%');

-- anon keeps the public booking surface: EXECUTE must not be denied (any other outcome is fine)
DO $$
BEGIN
  BEGIN
    PERFORM public.get_booking_by_manage_token('nonexistent', 'lp-tenant');
  EXCEPTION WHEN OTHERS THEN
    IF SQLSTATE = '42501' AND SQLERRM LIKE '%permission denied for function%' THEN
      RAISE EXCEPTION 'anon lost EXECUTE on get_booking_by_manage_token: %', SQLERRM;
    END IF;
  END;
END $$;

-- ============================================
-- 2. authenticated: RLS helpers still callable, booking RPC callable,
--    TRUNCATE and internal RPC denied
-- ============================================
SELECT pg_temp.as_user('91000000-0000-0000-0000-000000000001');

SELECT pg_temp.expect_sqlstate('TRUNCATE public.bookings', '42501', '%permission denied%');
SELECT pg_temp.expect_sqlstate('TRUNCATE public.tenants', '42501', '%permission denied%');

SELECT pg_temp.expect_sqlstate(
  'SELECT public.claim_notification_deliveries(p_limit := 10)', '42501', '%permission denied%');
SELECT pg_temp.expect_sqlstate(
  'SELECT public.schedule_booking_reminders()', '42501', '%permission denied%');

-- Regression: policies call is_tenant_member / is_tenant_admin_or_staff / is_tenant_admin
-- with the caller's privileges. These queries must not raise permission denied.
DO $$
DECLARE
  v_count int;
BEGIN
  SELECT count(*) INTO v_count FROM public.tenant_users;
  SELECT count(*) INTO v_count FROM public.bookings;
  SELECT count(*) INTO v_count FROM public.staff;
  SELECT count(*) INTO v_count FROM public.staff_working_hours;
  PERFORM public.is_tenant_member('92000000-0000-0000-0000-000000000001');
  PERFORM public.is_tenant_admin_or_staff('92000000-0000-0000-0000-000000000001');
  PERFORM public.is_tenant_admin('92000000-0000-0000-0000-000000000001');
END $$;

-- authenticated passes the EXECUTE check; the function then rejects the empty range (23514)
SELECT pg_temp.expect_sqlstate(
  'SELECT public.create_booking_with_staff(''92000000-0000-0000-0000-000000000001''::uuid, ''93000000-0000-0000-0000-000000000001''::uuid, now(), now(), NULL)',
  '23514', 'Invalid time range%');

-- ============================================
-- 3. Reset role and conclude
-- ============================================
SELECT pg_temp.as_owner();

DO $$
BEGIN
  RAISE NOTICE 'ALL LEAST PRIVILEGE CHECKS PASSED';
END $$;

ROLLBACK;