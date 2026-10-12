-- Active staff guard (migration 018): self-contained, rolled back.
-- Requires migrations 001-018 and the auth stub. Ends with 'ALL ACTIVE STAFF GUARD CHECKS PASSED'.
-- Run:  psql -v ON_ERROR_STOP=1 -f supabase/tests/active_staff_guard_verification.sql

\set ON_ERROR_STOP on
BEGIN;
SET LOCAL TIME ZONE 'UTC';

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
  ('81000000-0000-0000-0000-000000000001', 'guard-customer@example.test'),
  ('81000000-0000-0000-0000-000000000002', 'guard-admin@example.test');

INSERT INTO public.tenants (id, name, slug, locale) VALUES
  ('82000000-0000-0000-0000-000000000001', 'Guard Tenant A', 'guard-tenant-a', 'sk'),
  ('82000000-0000-0000-0000-000000000002', 'Guard Tenant B', 'guard-tenant-b', 'sk');

INSERT INTO public.tenant_users (tenant_id, user_id, role) VALUES
  ('82000000-0000-0000-0000-000000000001', '81000000-0000-0000-0000-000000000002', 'admin');

-- Staff: Active and Inactive for Tenant A, and Active for Tenant B
INSERT INTO public.staff (id, tenant_id, display_name, is_active) VALUES
  ('83000000-0000-0000-0000-00000000000a', '82000000-0000-0000-0000-000000000001', 'Active Staff A', true),
  ('83000000-0000-0000-0000-00000000000b', '82000000-0000-0000-0000-000000000001', 'Inactive Staff A', false),
  ('83000000-0000-0000-0000-00000000000c', '82000000-0000-0000-0000-000000000002', 'Active Staff B', true);

INSERT INTO public.services (id, tenant_id, name, duration, price, is_active) VALUES
  ('84000000-0000-0000-0000-000000000001', '82000000-0000-0000-0000-000000000001', 'Guard Service 60', 60, 20, true);

-- ============================================
-- 1. INSERT validation tests
-- ============================================

-- A) INSERT with active staff succeeds
INSERT INTO public.bookings (id, tenant_id, user_id, service_id, staff_id, start_time, end_time, status)
VALUES (
  '85000000-0000-0000-0000-000000000001',
  '82000000-0000-0000-0000-000000000001',
  '81000000-0000-0000-0000-000000000001',
  '84000000-0000-0000-0000-000000000001',
  '83000000-0000-0000-0000-00000000000a',
  '2030-08-01 10:00:00+00',
  '2030-08-01 11:00:00+00',
  'confirmed'
);

-- B) INSERT with inactive staff fails with 23514
SELECT pg_temp.expect_sqlstate(
  $$INSERT INTO public.bookings (id, tenant_id, user_id, service_id, staff_id, start_time, end_time, status)
    VALUES (
      '85000000-0000-0000-0000-000000000002',
      '82000000-0000-0000-0000-000000000001',
      '81000000-0000-0000-0000-000000000001',
      '84000000-0000-0000-0000-000000000001',
      '83000000-0000-0000-0000-00000000000b',
      '2030-08-01 12:00:00+00',
      '2030-08-01 13:00:00+00',
      'confirmed'
    )$$,
  '23514',
  '%is not active or does not belong to tenant%'
);

-- C) INSERT with wrong tenant staff fails with 23514
SELECT pg_temp.expect_sqlstate(
  $$INSERT INTO public.bookings (id, tenant_id, user_id, service_id, staff_id, start_time, end_time, status)
    VALUES (
      '85000000-0000-0000-0000-000000000003',
      '82000000-0000-0000-0000-000000000001',
      '81000000-0000-0000-0000-000000000001',
      '84000000-0000-0000-0000-000000000001',
      '83000000-0000-0000-0000-00000000000c',
      '2030-08-01 14:00:00+00',
      '2030-08-01 15:00:00+00',
      'confirmed'
    )$$,
  '23514',
  '%is not active or does not belong to tenant%'
);

-- ============================================
-- 2. UPDATE validation tests
-- ============================================

-- A) UPDATE staff_id to inactive staff fails with 23514
SELECT pg_temp.expect_sqlstate(
  $$UPDATE public.bookings
    SET staff_id = '83000000-0000-0000-0000-00000000000b'
    WHERE id = '85000000-0000-0000-0000-000000000001'$$,
  '23514',
  '%is not active or does not belong to tenant%'
);

-- Deactivate the currently assigned staff member
UPDATE public.staff
SET is_active = false
WHERE id = '83000000-0000-0000-0000-00000000000a';

-- B) Reschedule (UPDATE start_time) with now-inactive staff fails with 23514
SELECT pg_temp.expect_sqlstate(
  $$UPDATE public.bookings
    SET start_time = '2030-08-01 11:00:00+00',
        end_time   = '2030-08-01 12:00:00+00'
    WHERE id = '85000000-0000-0000-0000-000000000001'$$,
  '23514',
  '%is not active or does not belong to tenant%'
);

-- C) Cancellation (UPDATE status = 'cancelled') SUCCEEDS even when staff is inactive
UPDATE public.bookings
SET status = 'cancelled'
WHERE id = '85000000-0000-0000-0000-000000000001';

SELECT pg_temp.assert_true(
  EXISTS (
    SELECT 1 FROM public.bookings
    WHERE id = '85000000-0000-0000-0000-000000000001'
      AND status = 'cancelled'
  ),
  'cancelled booking should be persisted'
);

ROLLBACK;

SELECT 'ALL ACTIVE STAFF GUARD CHECKS PASSED' AS result;
