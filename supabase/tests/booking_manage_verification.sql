-- Customer management links (migration 015): self-contained, rolled back.
-- Requires migrations 001-015 and the Supabase-like auth stub.
-- Run:  psql -v ON_ERROR_STOP=1 -f supabase/tests/booking_manage_verification.sql
-- A clean run ends with 'ALL MANAGE-LINK CHECKS PASSED'.

\set ON_ERROR_STOP on
BEGIN;
SET LOCAL TIME ZONE 'UTC';

CREATE FUNCTION pg_temp.as_user(p_uid uuid) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', p_uid::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
END $$;

CREATE FUNCTION pg_temp.as_anon() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '', true);
  EXECUTE 'SET LOCAL ROLE anon';
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

-- SHA-256 hex, identical to the app's hashManageToken().
CREATE FUNCTION pg_temp.h(p text) RETURNS text LANGUAGE sql AS $$
  SELECT encode(sha256(convert_to(p, 'UTF8')), 'hex')
$$;

CREATE FUNCTION pg_temp.status_of(p_token text, p_slug text) RETURNS text LANGUAGE sql STABLE AS $$
  SELECT public.get_booking_by_manage_token(pg_temp.h(p_token), p_slug)->>'status'
$$;

-- ============================================
-- Fixtures
-- ============================================
INSERT INTO auth.users (id, email) VALUES
  ('f1000000-0000-0000-0000-000000000001', 'manage-customer@example.test'),
  ('f1000000-0000-0000-0000-000000000002', 'manage-admin@example.test'),
  ('f1000000-0000-0000-0000-000000000003', 'manage-intruder@example.test');

INSERT INTO public.tenants (id, name, slug, locale) VALUES
  ('f2000000-0000-0000-0000-000000000001', 'Manage Tenant', 'manage-tenant', 'sk'),
  ('f2000000-0000-0000-0000-000000000002', 'Other Tenant', 'other-tenant', 'sk');

INSERT INTO public.tenant_users (tenant_id, user_id, role) VALUES
  ('f2000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000002', 'admin');

INSERT INTO public.services (id, tenant_id, name, duration, price, is_active) VALUES
  ('f3000000-0000-0000-0000-000000000001', 'f2000000-0000-0000-0000-000000000001', 'Manage Service', 60, 25, true);

INSERT INTO public.time_slots_config (tenant_id, start_time, end_time, is_active) VALUES
  ('f2000000-0000-0000-0000-000000000001', '08:00', '18:00', true);

-- Confirmed future bookings. Inserted as owner (bypasses RLS on purpose for fixtures).
INSERT INTO public.bookings (id, tenant_id, user_id, service_id, start_time, end_time, status) VALUES
  ('f4000000-0000-0000-0000-000000000001', 'f2000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001',
   'f3000000-0000-0000-0000-000000000001', '2030-03-01 10:00+00', '2030-03-01 11:00+00', 'confirmed'),
  ('f4000000-0000-0000-0000-000000000002', 'f2000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001',
   'f3000000-0000-0000-0000-000000000001', '2030-03-01 13:00+00', '2030-03-01 14:00+00', 'confirmed'),
  ('f4000000-0000-0000-0000-000000000003', 'f2000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001',
   'f3000000-0000-0000-0000-000000000001', '2030-03-02 10:00+00', '2030-03-02 11:00+00', 'confirmed'),
  ('f4000000-0000-0000-0000-000000000004', 'f2000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001',
   'f3000000-0000-0000-0000-000000000001', '2030-03-03 10:00+00', '2030-03-03 11:00+00', 'confirmed'),
  ('f4000000-0000-0000-0000-000000000005', 'f2000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001',
   'f3000000-0000-0000-0000-000000000001', '2030-03-04 10:00+00', '2030-03-04 11:00+00', 'confirmed');

-- ============================================
-- 1. Issuing links: authorization and input validation
-- ============================================
SELECT pg_temp.as_user('f1000000-0000-0000-0000-000000000003');
SELECT pg_temp.expect_sqlstate($q$SELECT public.issue_booking_manage_token('f4000000-0000-0000-0000-000000000001'::uuid, '$q$ || pg_temp.h('tok-b1') || $q$')$q$,
  '42501', '%Not authorized%');

SELECT pg_temp.as_user('f1000000-0000-0000-0000-000000000001');
SELECT pg_temp.assert_true((public.issue_booking_manage_token('f4000000-0000-0000-0000-000000000001', pg_temp.h('tok-b1'))->>'actor') = 'customer',
  'booking owner receives a customer-issued link');

SELECT pg_temp.as_user('f1000000-0000-0000-0000-000000000002');
SELECT pg_temp.assert_true((public.issue_booking_manage_token('f4000000-0000-0000-0000-000000000002', pg_temp.h('tok-b2'))->>'actor') = 'staff',
  'tenant admin can issue a link for an existing booking');

SELECT pg_temp.as_user('f1000000-0000-0000-0000-000000000001');
SELECT pg_temp.expect_sqlstate($q$SELECT public.issue_booking_manage_token('f4000000-0000-0000-0000-000000000001', 'not-a-hash')$q$,
  '23514', '%Invalid token hash%');

-- Issuing a new link rotates: the first one stops working.
SELECT public.issue_booking_manage_token('f4000000-0000-0000-0000-000000000001', pg_temp.h('tok-b1-rotated'));

SELECT pg_temp.as_owner();
SELECT pg_temp.assert_true(pg_temp.status_of('tok-b1', 'manage-tenant') = 'invalid',
  'superseded link is revoked by rotation');
SELECT pg_temp.assert_true(pg_temp.status_of('tok-b1-rotated', 'manage-tenant') = 'ok',
  'newest link works');

-- Anonymous users cannot issue links and cannot read the token table.
SELECT pg_temp.as_anon();
SELECT pg_temp.assert_true(NOT has_function_privilege('anon',
  'public.issue_booking_manage_token(uuid,text)'::regprocedure, 'EXECUTE'),
  'anon cannot issue management links');
SELECT pg_temp.expect_sqlstate('SELECT count(*) FROM public.booking_manage_tokens', '42501', '%permission denied%');

-- ============================================
-- 2. Reading through a token
-- ============================================
SELECT pg_temp.assert_true(pg_temp.status_of('tok-b1-rotated', 'manage-tenant') = 'ok',
  'valid token reads the booking');
SELECT pg_temp.assert_true(pg_temp.status_of('definitely-wrong-token', 'manage-tenant') = 'invalid',
  'unknown token is invalid');
SELECT pg_temp.assert_true(pg_temp.status_of('tok-b1-rotated', 'other-tenant') = 'invalid',
  'token of tenant A is invalid under tenant B slug');
-- A booking ID alone must never be accepted as a credential.
SELECT pg_temp.assert_true(public.get_booking_by_manage_token(pg_temp.h('f4000000-0000-0000-0000-000000000001'), 'manage-tenant')->>'status' = 'invalid',
  'booking id hashed as a token is rejected');
SELECT pg_temp.assert_true(public.get_booking_by_manage_token('f4000000-0000-0000-0000-000000000001', 'manage-tenant')->>'status' = 'invalid',
  'raw booking id as token hash is rejected');

-- ============================================
-- 3. Reschedule: conflict, outside hours, success with rotation
-- ============================================
SELECT pg_temp.as_owner();
SELECT pg_temp.assert_true(public.reschedule_booking_by_token(pg_temp.h('tok-b1-rotated'), 'manage-tenant',
  '2030-03-01 13:00+00', pg_temp.h('tok-b1-next'))->>'status' = 'slot_taken',
  'reschedule onto another booking is rejected as slot_taken');
SELECT pg_temp.assert_true(public.reschedule_booking_by_token(pg_temp.h('tok-b1-rotated'), 'manage-tenant',
  '2030-03-01 20:00+00', pg_temp.h('tok-b1-next'))->>'status' = 'outside_hours',
  'reschedule outside opening hours is rejected');
-- Rejected attempts must not rotate the token.
SELECT pg_temp.assert_true(pg_temp.status_of('tok-b1-rotated', 'manage-tenant') = 'ok',
  'rejected reschedule keeps the current token valid');

-- Reschedule B3 with a token issued for it, then verify rotation and replay protection.
SELECT pg_temp.as_user('f1000000-0000-0000-0000-000000000001');
SELECT public.issue_booking_manage_token('f4000000-0000-0000-0000-000000000003', pg_temp.h('tok-b3-old'));
SELECT public.reschedule_booking_by_token(pg_temp.h('tok-b3-old'), 'manage-tenant',
  '2030-03-02 14:00+00', pg_temp.h('tok-b3-new')) AS r \gset
SELECT pg_temp.assert_true(:'r'::jsonb->>'status' = 'ok', 'reschedule to a free slot succeeds');

SELECT pg_temp.as_owner();
SELECT pg_temp.assert_true((SELECT start_time FROM public.bookings WHERE id = 'f4000000-0000-0000-0000-000000000003')
  = '2030-03-02 14:00+00', 'booking moved to the new start time');
SELECT pg_temp.assert_true((SELECT end_time FROM public.bookings WHERE id = 'f4000000-0000-0000-0000-000000000003')
  = '2030-03-02 15:00+00', 'end time follows the service duration');
SELECT pg_temp.assert_true(pg_temp.status_of('tok-b3-old', 'manage-tenant') = 'invalid',
  'old token is revoked after reschedule');
SELECT pg_temp.assert_true(pg_temp.status_of('tok-b3-new', 'manage-tenant') = 'ok',
  'rotated token works after reschedule');
SELECT pg_temp.assert_true(public.reschedule_booking_by_token(pg_temp.h('tok-b3-old'), 'manage-tenant',
  '2030-03-02 16:00+00', pg_temp.h('tok-b3-x'))->>'status' = 'invalid',
  'replaying the old token cannot reschedule again');
SELECT pg_temp.assert_true((SELECT count(*) FROM public.booking_audit_events
  WHERE booking_id = 'f4000000-0000-0000-0000-000000000003' AND action = 'rescheduled') = 1,
  'reschedule writes exactly one audit event');

-- ============================================
-- 4. Cancel: idempotent, audited, expired token blocked
-- ============================================
SELECT pg_temp.as_user('f1000000-0000-0000-0000-000000000001');
SELECT public.issue_booking_manage_token('f4000000-0000-0000-0000-000000000005', pg_temp.h('tok-b5'));
SELECT public.cancel_booking_by_token(pg_temp.h('tok-b5'), 'manage-tenant') AS c1 \gset
SELECT public.cancel_booking_by_token(pg_temp.h('tok-b5'), 'manage-tenant') AS c2 \gset
SELECT pg_temp.assert_true(:'c1'::jsonb->>'status' = 'ok', 'first cancel succeeds');

SELECT pg_temp.as_owner();
SELECT pg_temp.assert_true(:'c2'::jsonb->>'status' = 'already_cancelled', 'repeated cancel is idempotent');
SELECT pg_temp.assert_true((SELECT status FROM public.bookings WHERE id = 'f4000000-0000-0000-0000-000000000005') = 'cancelled',
  'booking is cancelled');
SELECT pg_temp.assert_true((SELECT count(*) FROM public.booking_audit_events
  WHERE booking_id = 'f4000000-0000-0000-0000-000000000005' AND action = 'cancelled') = 1,
  'repeated cancel writes no second audit event');

-- Expired token: booking stays confirmed.
SELECT pg_temp.as_user('f1000000-0000-0000-0000-000000000001');
SELECT public.issue_booking_manage_token('f4000000-0000-0000-0000-000000000004', pg_temp.h('tok-b4'));
SELECT pg_temp.as_owner();
UPDATE public.booking_manage_tokens SET expires_at = now() - interval '1 minute'
WHERE token_hash = pg_temp.h('tok-b4');
SELECT pg_temp.assert_true(pg_temp.status_of('tok-b4', 'manage-tenant') = 'expired', 'expired token reads as expired');
SELECT pg_temp.assert_true(public.cancel_booking_by_token(pg_temp.h('tok-b4'), 'manage-tenant')->>'status' = 'expired',
  'expired token cannot cancel');
SELECT pg_temp.assert_true((SELECT status FROM public.bookings WHERE id = 'f4000000-0000-0000-0000-000000000004') = 'confirmed',
  'expired token leaves the booking unchanged');

-- A cancelled booking cannot be rescheduled, even with its still-valid link.
SELECT pg_temp.assert_true(public.reschedule_booking_by_token(pg_temp.h('tok-b5'), 'manage-tenant',
  '2030-03-05 10:00+00', pg_temp.h('tok-b5-next'))->>'status' = 'already_cancelled',
  'cancelled booking cannot be rescheduled');

-- Authenticated users cannot call the token functions with another tenant's data either.
SELECT pg_temp.as_anon();
SELECT pg_temp.assert_true(has_function_privilege('anon', 'public.get_booking_by_manage_token(text,text)'::regprocedure, 'EXECUTE'),
  'anon may call the token read function (the token is the credential)');

SELECT pg_temp.as_owner();
SELECT 'ALL MANAGE-LINK CHECKS PASSED' AS result;
ROLLBACK;
