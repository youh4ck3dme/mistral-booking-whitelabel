-- Staff availability (migration 016): self-contained, rolled back.
-- Requires migrations 001-016 and the auth stub. Ends with 'ALL STAFF CHECKS PASSED'.
-- Run:  psql -v ON_ERROR_STOP=1 -f supabase/tests/staff_availability_verification.sql

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
  ('71000000-0000-0000-0000-000000000001', 'staff-customer@example.test'),
  ('71000000-0000-0000-0000-000000000002', 'staff-admin-a@example.test');

INSERT INTO public.tenants (id, name, slug, locale) VALUES
  ('72000000-0000-0000-0000-000000000001', 'Staff A', 'staff-a', 'sk'),
  ('72000000-0000-0000-0000-000000000002', 'Staff B', 'staff-b', 'sk');

INSERT INTO public.tenant_users (tenant_id, user_id, role) VALUES
  ('72000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000002', 'admin');

-- Default staff exists by trigger. Add two named staff members for tenant A.
INSERT INTO public.staff (id, tenant_id, display_name) VALUES
  ('73000000-0000-0000-0000-00000000000a', '72000000-0000-0000-0000-000000000001', 'Anna'),
  ('73000000-0000-0000-0000-00000000000b', '72000000-0000-0000-0000-000000000001', 'Boris');

-- Services are assigned to all active staff by trigger.
INSERT INTO public.services (id, tenant_id, name, duration, price, is_active, buffer_after_minutes) VALUES
  ('74000000-0000-0000-0000-000000000001', '72000000-0000-0000-0000-000000000001', 'Svc 60', 60, 10, true, 0),
  ('74000000-0000-0000-0000-000000000002', '72000000-0000-0000-0000-000000000001', 'Svc unassigned', 60, 10, true, 0),
  ('74000000-0000-0000-0000-000000000003', '72000000-0000-0000-0000-000000000001', 'Svc buffered', 60, 10, true, 30);

-- Svc unassigned: only the default staff member can perform it.
DELETE FROM public.service_staff
WHERE service_id = '74000000-0000-0000-0000-000000000002'
  AND staff_id IN ('73000000-0000-0000-0000-00000000000a', '73000000-0000-0000-0000-00000000000b');

-- Working hours 09:00-17:00 local, every day, for all three staff in tenant A.
INSERT INTO public.staff_working_hours (tenant_id, staff_id, weekday, start_time, end_time)
SELECT '72000000-0000-0000-0000-000000000001', st.id, d.wd, '09:00', '17:00'
FROM public.staff st CROSS JOIN generate_series(1, 7) AS d(wd)
WHERE st.tenant_id = '72000000-0000-0000-0000-000000000001';

-- Break for Anna on the weekday of 2030-06-04, 12:00-13:00 local.
INSERT INTO public.staff_breaks (tenant_id, staff_id, weekday, start_time, end_time)
VALUES ('72000000-0000-0000-0000-000000000001', '73000000-0000-0000-0000-00000000000a',
        EXTRACT(ISODOW FROM DATE '2030-06-04')::smallint, '12:00', '13:00');

-- Boris is off on 2030-06-05 (local day, Europe/Bratislava = UTC+2 in June).
INSERT INTO public.staff_time_off (tenant_id, staff_id, starts_at, ends_at, reason)
VALUES ('72000000-0000-0000-0000-000000000001', '73000000-0000-0000-0000-00000000000b',
        '2030-06-04 22:00+00', '2030-06-05 22:00+00', 'vacation');

-- ============================================
-- 1. Two staff members can share a time; the same staff member cannot
-- ============================================
SELECT pg_temp.as_user('71000000-0000-0000-0000-000000000001');
SELECT public.create_booking_with_staff('72000000-0000-0000-0000-000000000001', '74000000-0000-0000-0000-000000000001',
  '2030-06-03 08:00+00', '2030-06-03 09:00+00', '73000000-0000-0000-0000-00000000000a') AS anna_1 \gset
SELECT public.create_booking_with_staff('72000000-0000-0000-0000-000000000001', '74000000-0000-0000-0000-000000000001',
  '2030-06-03 08:00+00', '2030-06-03 09:00+00', '73000000-0000-0000-0000-00000000000b') AS boris_1 \gset

SELECT pg_temp.expect_sqlstate($q$SELECT public.create_booking_with_staff('72000000-0000-0000-0000-000000000001',
  '74000000-0000-0000-0000-000000000001', '2030-06-03 08:30+00', '2030-06-03 09:30+00',
  '73000000-0000-0000-0000-00000000000a')$q$, '23P01', '%already booked%');

-- ============================================
-- 2. Unassigned service, working hours, break, time off
-- ============================================
SELECT pg_temp.expect_sqlstate($q$SELECT public.create_booking_with_staff('72000000-0000-0000-0000-000000000001',
  '74000000-0000-0000-0000-000000000002', '2030-06-03 10:00+00', '2030-06-03 11:00+00',
  '73000000-0000-0000-0000-00000000000b')$q$, 'P0001', '%not available%');

SELECT pg_temp.expect_sqlstate($q$SELECT public.create_booking_with_staff('72000000-0000-0000-0000-000000000001',
  '74000000-0000-0000-0000-000000000001', '2030-06-03 18:00+00', '2030-06-03 19:00+00',
  '73000000-0000-0000-0000-00000000000a')$q$, 'P0001', '%not available%');

SELECT pg_temp.expect_sqlstate($q$SELECT public.create_booking_with_staff('72000000-0000-0000-0000-000000000001',
  '74000000-0000-0000-0000-000000000001', '2030-06-04 10:30+00', '2030-06-04 11:30+00',
  '73000000-0000-0000-0000-00000000000a')$q$, 'P0001', '%not available%');

-- Break 12:00-13:00 local = 10:00-11:00 UTC on 2030-06-04 (UTC+2). A 10:30 start overlaps it.
SELECT pg_temp.expect_sqlstate($q$SELECT public.create_booking_with_staff('72000000-0000-0000-0000-000000000001',
  '74000000-0000-0000-0000-000000000001', '2030-06-04 10:30+00', '2030-06-04 11:30+00',
  '73000000-0000-0000-0000-00000000000a')$q$, 'P0001', '%not available%');

SELECT pg_temp.expect_sqlstate($q$SELECT public.create_booking_with_staff('72000000-0000-0000-0000-000000000001',
  '74000000-0000-0000-0000-000000000001', '2030-06-05 08:00+00', '2030-06-05 09:00+00',
  '73000000-0000-0000-0000-00000000000b')$q$, 'P0001', '%not available%');

-- ============================================
-- 3. Buffers block neighbouring slots for the same staff member only
-- ============================================
SELECT public.create_booking_with_staff('72000000-0000-0000-0000-000000000001', '74000000-0000-0000-0000-000000000003',
  '2030-06-06 08:00+00', '2030-06-06 09:00+00', '73000000-0000-0000-0000-00000000000a');

-- Anna's blocked range now ends at 09:30 UTC (30 minute buffer). 09:00 start is rejected.
SELECT pg_temp.expect_sqlstate($q$SELECT public.create_booking_with_staff('72000000-0000-0000-0000-000000000001',
  '74000000-0000-0000-0000-000000000001', '2030-06-06 09:00+00', '2030-06-06 10:00+00',
  '73000000-0000-0000-0000-00000000000a')$q$, 'P0001', '%not available%');

-- 09:30 is free for Anna.
SELECT public.create_booking_with_staff('72000000-0000-0000-0000-000000000001', '74000000-0000-0000-0000-000000000001',
  '2030-06-06 09:30+00', '2030-06-06 10:30+00', '73000000-0000-0000-0000-00000000000a') AS anna_buffer_ok \gset

-- ============================================
-- 4. "Anyone available": the first free staff member is chosen by the server
-- ============================================
-- 08:00 UTC on 2030-06-03 is taken by Anna and Boris, so the default staff member should be selected.
SELECT public.create_booking_with_staff('72000000-0000-0000-0000-000000000001', '74000000-0000-0000-0000-000000000001',
  '2030-06-03 08:00+00', '2030-06-03 09:00+00', NULL) AS anyone_1 \gset

SELECT pg_temp.as_owner();
SELECT pg_temp.assert_true((SELECT staff_id FROM public.bookings WHERE id = :'anyone_1')
  = (SELECT id FROM public.staff WHERE tenant_id = '72000000-0000-0000-0000-000000000001' AND display_name = 'Tím'),
  '"anyone available" assigns the free staff member');
SELECT pg_temp.assert_true((SELECT staff_id FROM public.bookings WHERE id = :'anna_1')
  = '73000000-0000-0000-0000-00000000000a', 'explicit staff booking keeps the chosen staff member');
SELECT pg_temp.assert_true((SELECT staff_id FROM public.bookings WHERE id = :'boris_1')
  = '73000000-0000-0000-0000-00000000000b', 'second staff member can take the same time');

-- ============================================
-- 5. Tenant isolation
-- ============================================
SELECT pg_temp.as_user('71000000-0000-0000-0000-000000000001');
-- Tenant B cannot use tenant A's service, even with a valid staff id from tenant A.
SELECT pg_temp.expect_sqlstate($q$SELECT public.create_booking_with_staff('72000000-0000-0000-0000-000000000002',
  '74000000-0000-0000-0000-000000000001', '2030-06-03 12:00+00', '2030-06-03 13:00+00',
  '73000000-0000-0000-0000-00000000000a')$q$, 'P0001', '%Service not found%');

-- Admin of tenant A cannot create staff in tenant B.
SELECT pg_temp.as_user('71000000-0000-0000-0000-000000000002');
SELECT pg_temp.expect_sqlstate($q$INSERT INTO public.staff (tenant_id, display_name)
  VALUES ('72000000-0000-0000-0000-000000000002', 'Intruder')$q$, '42501', '%row-level security%');

-- Admin of tenant A cannot read tenant B staff.
SELECT pg_temp.assert_true((SELECT count(*) FROM public.staff
  WHERE tenant_id = '72000000-0000-0000-0000-000000000002') = 0, 'tenant B staff invisible to tenant A admin');

-- Admin of tenant A can manage tenant A staff.
SELECT pg_temp.as_user('71000000-0000-0000-0000-000000000002');
SELECT pg_temp.assert_true((SELECT count(*) FROM public.staff
  WHERE tenant_id = '72000000-0000-0000-0000-000000000001') >= 3, 'tenant A admin sees own staff');

-- Non-admin customers cannot change staff at all.
SELECT pg_temp.as_user('71000000-0000-0000-0000-000000000001');
SELECT pg_temp.assert_true((SELECT count(*) FROM public.staff
  WHERE tenant_id = '72000000-0000-0000-0000-000000000001') = 0, 'customer without membership sees no staff');

-- ============================================
-- 6. Timezone and DST boundary
-- ============================================
-- Europe/Bratislava changes offset on 2030-03-31. 09:00 local is 08:00 UTC before and 07:00 UTC after.
SELECT pg_temp.as_owner();
SELECT pg_temp.assert_true((SELECT min(start_time) FROM public.get_available_slots(
  '72000000-0000-0000-0000-000000000001', '74000000-0000-0000-0000-000000000001', DATE '2030-03-30',
  '73000000-0000-0000-0000-00000000000a')) = '2030-03-30 08:00+00', 'before DST: 09:00 local is 08:00 UTC');
SELECT pg_temp.assert_true((SELECT min(start_time) FROM public.get_available_slots(
  '72000000-0000-0000-0000-000000000001', '74000000-0000-0000-0000-000000000001', DATE '2030-03-31',
  '73000000-0000-0000-0000-00000000000a')) = '2030-03-31 07:00+00', 'after DST: 09:00 local is 07:00 UTC');

-- Slots never start in the past.
SELECT pg_temp.assert_true(NOT EXISTS (SELECT 1 FROM public.get_available_slots(
  '72000000-0000-0000-0000-000000000001', '74000000-0000-0000-0000-000000000001', DATE '2020-01-06',
  '73000000-0000-0000-0000-00000000000a')), 'no slots in the past');

-- Slots follow the service duration: the last one ends by 17:00 local.
SELECT pg_temp.assert_true((SELECT max(end_time) FROM public.get_available_slots(
  '72000000-0000-0000-0000-000000000001', '74000000-0000-0000-0000-000000000001', DATE '2030-06-07',
  '73000000-0000-0000-0000-00000000000a')) = '2030-06-07 15:00+00', 'last slot ends at working-hours end');

SELECT 'ALL STAFF CHECKS PASSED' AS result;
ROLLBACK;
