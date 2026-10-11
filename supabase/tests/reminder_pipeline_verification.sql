-- Reminder pipeline (migration 017): self-contained, rolled back.
-- Requires migrations 001-017 and the auth stub. Ends with 'ALL REMINDER CHECKS PASSED'.
-- Run:  psql -v ON_ERROR_STOP=1 -f supabase/tests/reminder_pipeline_verification.sql

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
  ('91000000-0000-0000-0000-000000000001', 'reminder-customer@example.test'),
  ('91000000-0000-0000-0000-000000000002', 'reminder-admin-a@example.test'),
  ('91000000-0000-0000-0000-000000000003', 'reminder-admin-b@example.test');

INSERT INTO public.tenants (id, name, slug, locale) VALUES
  ('92000000-0000-0000-0000-000000000001', 'Reminder A', 'reminder-a', 'sk'),
  ('92000000-0000-0000-0000-000000000002', 'Reminder B', 'reminder-b', 'sk');

INSERT INTO public.tenant_users (tenant_id, user_id, role) VALUES
  ('92000000-0000-0000-0000-000000000001', '91000000-0000-0000-0000-000000000002', 'admin'),
  ('92000000-0000-0000-0000-000000000002', '91000000-0000-0000-0000-000000000003', 'admin');

INSERT INTO public.services (id, tenant_id, name, duration, price, is_active) VALUES
  ('93000000-0000-0000-0000-000000000001', '92000000-0000-0000-0000-000000000001', 'Reminder Service', 60, 10, true);

-- Default staff of tenant A works every day 08:00-18:00 local (Europe/Bratislava, UTC+2 in June).
INSERT INTO public.staff_working_hours (tenant_id, staff_id, weekday, start_time, end_time)
SELECT '92000000-0000-0000-0000-000000000001', st.id, d.wd, '08:00', '18:00'
FROM public.staff st CROSS JOIN generate_series(1, 7) AS d(wd)
WHERE st.tenant_id = '92000000-0000-0000-0000-000000000001';

-- ============================================
-- 1. Scheduling on booking creation
-- ============================================
SELECT pg_temp.as_user('91000000-0000-0000-0000-000000000001');
SELECT public.create_booking_with_staff('92000000-0000-0000-0000-000000000001', '93000000-0000-0000-0000-000000000001',
  '2030-06-10 08:00+00', '2030-06-10 09:00+00', NULL) AS b1 \gset

SELECT pg_temp.as_owner();
SELECT pg_temp.assert_true((SELECT count(*) FROM public.notification_deliveries
  WHERE booking_id = :'b1' AND notification_type = 'booking_reminder' AND status = 'pending') = 1,
  'creating a booking queues exactly one pending reminder');
SELECT pg_temp.assert_true((SELECT scheduled_for FROM public.notification_deliveries
  WHERE booking_id = :'b1' AND notification_type = 'booking_reminder') = '2030-06-09 08:00+00',
  'default lead is 24 hours before the start');

-- Queuing again is idempotent through the unique key.
SELECT pg_temp.assert_true(public.queue_booking_reminder(:'b1') = false, 'second queue call adds nothing');
SELECT pg_temp.assert_true((SELECT count(*) FROM public.notification_deliveries WHERE booking_id = :'b1' AND notification_type = 'booking_reminder') = 1,
  'still exactly one reminder row');

-- ============================================
-- 2. Reschedule cancels the old reminder and queues a new one
-- ============================================
UPDATE public.bookings
SET start_time = '2030-06-11 08:00+00', end_time = '2030-06-11 09:00+00'
WHERE id = :'b1';

SELECT pg_temp.assert_true((SELECT count(*) FROM public.notification_deliveries
  WHERE booking_id = :'b1' AND notification_type = 'booking_reminder' AND status = 'cancelled') = 1, 'old reminder is cancelled on reschedule');
SELECT pg_temp.assert_true((SELECT count(*) FROM public.notification_deliveries
  WHERE booking_id = :'b1' AND notification_type = 'booking_reminder' AND status = 'pending' AND scheduled_for = '2030-06-10 08:00+00') = 1,
  'new reminder is queued at the new send time');

-- ============================================
-- 3. Cancellation cancels pending reminders
-- ============================================
UPDATE public.bookings SET status = 'cancelled' WHERE id = :'b1';
SELECT pg_temp.assert_true((SELECT count(*) FROM public.notification_deliveries
  WHERE booking_id = :'b1' AND notification_type = 'booking_reminder' AND status = 'pending') = 0, 'cancellation leaves no pending reminder');

-- ============================================
-- 4. Tenant settings: disabled tenant gets none, lead time is respected
-- ============================================
INSERT INTO public.tenant_reminder_settings (tenant_id, enabled, lead_minutes)
VALUES ('92000000-0000-0000-0000-000000000001', false, 1440);

SELECT pg_temp.as_user('91000000-0000-0000-0000-000000000001');
SELECT public.create_booking_with_staff('92000000-0000-0000-0000-000000000001', '93000000-0000-0000-0000-000000000001',
  '2030-06-12 08:00+00', '2030-06-12 09:00+00', NULL) AS b_off \gset
SELECT pg_temp.as_owner();
SELECT pg_temp.assert_true((SELECT count(*) FROM public.notification_deliveries WHERE booking_id = :'b_off' AND notification_type = 'booking_reminder') = 0,
  'disabled tenant queues no reminders');

UPDATE public.tenant_reminder_settings SET enabled = true, lead_minutes = 60
WHERE tenant_id = '92000000-0000-0000-0000-000000000001';

SELECT pg_temp.as_user('91000000-0000-0000-0000-000000000001');
SELECT public.create_booking_with_staff('92000000-0000-0000-0000-000000000001', '93000000-0000-0000-0000-000000000001',
  '2030-06-13 08:00+00', '2030-06-13 09:00+00', NULL) AS b_lead \gset
SELECT pg_temp.as_owner();
SELECT pg_temp.assert_true((SELECT scheduled_for FROM public.notification_deliveries WHERE booking_id = :'b_lead' AND notification_type = 'booking_reminder')
  = '2030-06-13 07:00+00', 'lead time of 60 minutes is applied');

-- Scheduler safety net: running it twice never duplicates.
SELECT public.schedule_booking_reminders() AS first_run \gset
SELECT public.schedule_booking_reminders() AS second_run \gset
SELECT pg_temp.assert_true(:'second_run'::int = 0, 'second scheduler run adds nothing');
SELECT pg_temp.assert_true((SELECT count(*) FROM public.notification_deliveries WHERE booking_id = :'b_lead' AND notification_type = 'booking_reminder') = 1,
  'scheduler does not duplicate existing reminders');

-- ============================================
-- 5. Worker claims once, retries with backoff, recovers stale leases, stops at the limit
-- ============================================
SELECT id AS d1 FROM public.notification_deliveries WHERE booking_id = :'b_lead' AND notification_type = 'booking_reminder' \gset

-- Make the reminder due, then claim it.
UPDATE public.notification_deliveries SET scheduled_for = now() - interval '1 minute' WHERE id = :'d1';
SELECT count(*) AS claimed_first FROM public.claim_notification_deliveries(20, :'b_lead') WHERE notification_type = 'booking_reminder' \gset
SELECT pg_temp.assert_true(:'claimed_first'::int = 1, 'due reminder is claimed');

-- A second worker must not claim the same row while its lease is fresh.
SELECT count(*) AS claimed_second FROM public.claim_notification_deliveries(20, :'b_lead') WHERE notification_type = 'booking_reminder' \gset
SELECT pg_temp.assert_true(:'claimed_second'::int = 0, 'second worker does not claim a fresh lease (no duplicate send)');

-- Failure schedules a retry with backoff.
SELECT public.record_notification_failure(:'d1', 'provider timeout') AS status_1 \gset
SELECT pg_temp.assert_true(:'status_1' = 'pending', 'first failure is retried');
SELECT pg_temp.assert_true((SELECT scheduled_for > now() FROM public.notification_deliveries WHERE id = :'d1'),
  'retry is scheduled in the future');
SELECT pg_temp.assert_true((SELECT error_message FROM public.notification_deliveries WHERE id = :'d1') = 'provider timeout',
  'failure reason is recorded');

-- The updated_at trigger would overwrite the backdated timestamps used below.
-- The change is inside this rolled-back transaction, so it does not persist.
ALTER TABLE public.notification_deliveries DISABLE TRIGGER update_notification_deliveries_updated_at;

-- Stale processing lease (crashed worker) is reclaimed.
UPDATE public.notification_deliveries
SET status = 'processing', updated_at = now() - interval '11 minutes', scheduled_for = now() - interval '1 minute'
WHERE id = :'d1';
SELECT count(*) AS reclaimed FROM public.claim_notification_deliveries(20, :'b_lead') WHERE notification_type = 'booking_reminder' \gset
SELECT pg_temp.assert_true(:'reclaimed'::int = 1, 'stale processing lease is reclaimed');

-- After the attempt limit the row is final and never claimed again.
UPDATE public.notification_deliveries SET attempt_count = 5, status = 'processing',
  updated_at = now() - interval '11 minutes' WHERE id = :'d1';
SELECT public.record_notification_failure(:'d1', 'still failing') AS status_final \gset
SELECT pg_temp.assert_true(:'status_final' = 'failed', 'attempt limit makes the failure final');
SELECT count(*) AS claimed_after_limit FROM public.claim_notification_deliveries(20, :'b_lead') WHERE notification_type = 'booking_reminder' \gset
SELECT pg_temp.assert_true(:'claimed_after_limit'::int = 0, 'failed reminder is not claimed again');

-- A sent reminder is never re-claimed.
UPDATE public.notification_deliveries SET status = 'sent', sent_at = now(), attempt_count = 1 WHERE id = :'d1';
SELECT count(*) AS claimed_sent FROM public.claim_notification_deliveries(20, :'b_lead') WHERE notification_type = 'booking_reminder' \gset
SELECT pg_temp.assert_true(:'claimed_sent'::int = 0, 'sent reminder is not claimed again');

-- ============================================
-- 6. Tenant isolation and privileges
-- ============================================
SELECT pg_temp.as_user('91000000-0000-0000-0000-000000000002');
SELECT pg_temp.assert_true((SELECT count(*) FROM public.notification_deliveries WHERE tenant_id = '92000000-0000-0000-0000-000000000001') > 0,
  'tenant A admin reads own reminders');
SELECT pg_temp.assert_true((SELECT count(*) FROM public.notification_deliveries WHERE tenant_id = '92000000-0000-0000-0000-000000000002') = 0,
  'tenant A admin reads no reminders of tenant B');

SELECT pg_temp.as_user('91000000-0000-0000-0000-000000000003');
SELECT pg_temp.assert_true((SELECT count(*) FROM public.notification_deliveries WHERE tenant_id = '92000000-0000-0000-0000-000000000001') = 0,
  'tenant B admin cannot read tenant A reminders');
UPDATE public.tenant_reminder_settings SET lead_minutes = 120 WHERE tenant_id = '92000000-0000-0000-0000-000000000001';
SELECT pg_temp.as_owner();
SELECT pg_temp.assert_true((SELECT lead_minutes FROM public.tenant_reminder_settings
  WHERE tenant_id = '92000000-0000-0000-0000-000000000001') = 60, 'tenant B admin cannot change tenant A settings');

SELECT pg_temp.as_user('91000000-0000-0000-0000-000000000001');
SELECT pg_temp.assert_true((SELECT count(*) FROM public.notification_deliveries) = 0,
  'customer cannot read the reminder outbox');

SELECT pg_temp.as_owner();
SELECT pg_temp.assert_true(NOT has_function_privilege('anon', 'public.claim_notification_deliveries(integer,uuid)'::regprocedure, 'EXECUTE'),
  'anon cannot claim deliveries');
SELECT pg_temp.assert_true(NOT has_function_privilege('authenticated', 'public.record_notification_failure(uuid,text)'::regprocedure, 'EXECUTE'),
  'authenticated cannot record failures');
SELECT pg_temp.assert_true(NOT has_function_privilege('anon', 'public.schedule_booking_reminders(interval)'::regprocedure, 'EXECUTE'),
  'anon cannot run the scheduler');

SELECT 'ALL REMINDER CHECKS PASSED' AS result;
ROLLBACK;
