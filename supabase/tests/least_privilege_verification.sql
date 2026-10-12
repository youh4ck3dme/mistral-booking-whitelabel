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
-- 1. Test Anon Role Table Permissions
-- ============================================
PERFORM pg_temp.as_anon();

-- Anon can read public catalog
DO $$
DECLARE
  v_count int;
BEGIN
  SELECT count(*) INTO v_count FROM public.tenants WHERE slug = 'lp-tenant';
  PERFORM pg_temp.assert_true(v_count = 1, 'anon should be able to select from tenants');

  SELECT count(*) INTO v_count FROM public.services WHERE tenant_id = '92000000-0000-0000-0000-000000000001';
  PERFORM pg_temp.assert_true(v_count = 1, 'anon should be able to select from services');
END $$;

-- Anon CANNOT TRUNCATE public tables (Must raise 42501)
PERFORM pg_temp.expect_sqlstate(
  'TRUNCATE public.services',
  '42501',
  '%permission denied%'
);

-- Anon CANNOT INSERT directly into services
PERFORM pg_temp.expect_sqlstate(
  'INSERT INTO public.services (tenant_id, name, duration, price) VALUES (''92000000-0000-0000-0000-000000000001'', ''Hacked'', 30, 0)',
  '42501',
  '%permission denied%'
);

-- Anon CANNOT call internal outbox RPC (Must raise 42501)
PERFORM pg_temp.expect_sqlstate(
  'SELECT public.claim_notification_deliveries(p_worker_id := ''evil'', p_batch_size := 10)',
  '42501',
  '%permission denied%'
);

-- ============================================
-- 2. Test Authenticated Role Table Permissions
-- ============================================
PERFORM pg_temp.as_user('91000000-0000-0000-0000-000000000001');

-- Authenticated CANNOT TRUNCATE tables (Must raise 42501)
PERFORM pg_temp.expect_sqlstate(
  'TRUNCATE public.bookings',
  '42501',
  '%permission denied%'
);

PERFORM pg_temp.expect_sqlstate(
  'TRUNCATE public.tenants',
  '42501',
  '%permission denied%'
);

-- Authenticated CANNOT call internal outbox worker RPC
PERFORM pg_temp.expect_sqlstate(
  'SELECT public.claim_notification_deliveries(p_worker_id := ''evil-user'', p_batch_size := 10)',
  '42501',
  '%permission denied%'
);

-- ============================================
-- 3. Reset Role & Conclude Verification
-- ============================================
PERFORM pg_temp.as_owner();

DO $$
BEGIN
  RAISE NOTICE 'ALL LEAST PRIVILEGE CHECKS PASSED';
END $$;

ROLLBACK;
