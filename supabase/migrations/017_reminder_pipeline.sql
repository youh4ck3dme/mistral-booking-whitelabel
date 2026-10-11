-- 017: Reliable reminder pipeline on top of notification_deliveries (the transactional outbox from 005/013).
-- Append-only. Adds tenant settings, booking-driven scheduling and cancellation,
-- bounded retry with backoff, stale-lease recovery and admin visibility.

-- 1. Delivery states: 'cancelled' for reminders whose booking changed or was cancelled.
ALTER TABLE public.notification_deliveries DROP CONSTRAINT IF EXISTS notification_deliveries_status_check;
ALTER TABLE public.notification_deliveries
  ADD CONSTRAINT notification_deliveries_status_check
  CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled'));

-- 2. Tenant reminder configuration. Missing row means the defaults (enabled, 24 hours).
CREATE TABLE IF NOT EXISTS public.tenant_reminder_settings (
  tenant_id     uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  enabled       boolean NOT NULL DEFAULT true,
  lead_minutes  integer NOT NULL DEFAULT 1440 CHECK (lead_minutes BETWEEN 60 AND 10080),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tenant_reminder_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members read reminder settings" ON public.tenant_reminder_settings;
CREATE POLICY "Members read reminder settings" ON public.tenant_reminder_settings
  FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS "Admins manage reminder settings" ON public.tenant_reminder_settings;
CREATE POLICY "Admins manage reminder settings" ON public.tenant_reminder_settings
  FOR ALL TO authenticated
  USING (public.is_tenant_admin(tenant_id)) WITH CHECK (public.is_tenant_admin(tenant_id));

REVOKE ALL ON public.tenant_reminder_settings FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_reminder_settings TO authenticated;

-- 3. Admin visibility into the outbox, limited to the admin's own tenant. Recipient e-mails
--    stay readable only to admins. Members and customers have no access.
DROP POLICY IF EXISTS "Admins read reminder deliveries" ON public.notification_deliveries;
CREATE POLICY "Admins read reminder deliveries" ON public.notification_deliveries
  FOR SELECT TO authenticated
  USING (public.is_tenant_admin(tenant_id) AND notification_type = 'booking_reminder');

GRANT SELECT ON public.notification_deliveries TO authenticated;

-- 4. Queue one reminder for a confirmed future booking. Idempotent through the unique key.
--    No reminder is queued when its send time has already passed or the tenant disabled reminders.
CREATE OR REPLACE FUNCTION public.queue_booking_reminder(p_booking_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_b        public.bookings%ROWTYPE;
  v_enabled  boolean;
  v_lead     integer;
  v_send_at  timestamptz;
  v_email    text;
  v_inserted integer;
BEGIN
  SELECT * INTO v_b FROM public.bookings WHERE id = p_booking_id;
  IF NOT FOUND OR v_b.status <> 'confirmed' OR v_b.start_time <= now() THEN
    RETURN false;
  END IF;

  SELECT COALESCE(rs.enabled, true), COALESCE(rs.lead_minutes, 1440)
  INTO v_enabled, v_lead
  FROM (SELECT 1) AS one
  LEFT JOIN public.tenant_reminder_settings rs ON rs.tenant_id = v_b.tenant_id;

  IF NOT v_enabled THEN
    RETURN false;
  END IF;

  v_send_at := v_b.start_time - make_interval(mins => v_lead);
  IF v_send_at < now() THEN
    RETURN false;
  END IF;

  SELECT u.email INTO v_email FROM auth.users u WHERE u.id = v_b.user_id;
  IF v_email IS NULL THEN
    RETURN false;
  END IF;

  INSERT INTO public.notification_deliveries (
    tenant_id, booking_id, user_id, notification_type, channel, status,
    recipient_email, payload, idempotency_key, scheduled_for
  )
  SELECT
    v_b.tenant_id, v_b.id, v_b.user_id, 'booking_reminder', 'email', 'pending',
    v_email,
    jsonb_build_object(
      'tenantName', t.name,
      'serviceName', s.name,
      'startTime', v_b.start_time,
      'endTime', v_b.end_time,
      'status', v_b.status
    ),
    public.build_notification_idempotency_key(v_b.id, 'booking_reminder', DATE_TRUNC('minute', v_send_at)),
    v_send_at
  FROM public.tenants t
  JOIN public.services s ON s.id = v_b.service_id
  WHERE t.id = v_b.tenant_id
  ON CONFLICT (idempotency_key) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN v_inserted > 0;
END;
$$;

-- 5. Safety-net scheduler: queues reminders for confirmed bookings whose send time falls in the next window.
DROP FUNCTION IF EXISTS public.schedule_booking_reminders(interval, interval);

CREATE OR REPLACE FUNCTION public.schedule_booking_reminders(
  p_schedule_window interval DEFAULT '01:00:00'::interval
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count integer := 0;
  v_row record;
BEGIN
  FOR v_row IN
    SELECT b.id
    FROM public.bookings b
    LEFT JOIN public.tenant_reminder_settings rs ON rs.tenant_id = b.tenant_id
    WHERE b.status = 'confirmed'
      AND b.start_time > now()
      AND COALESCE(rs.enabled, true)
      AND b.start_time - make_interval(mins => COALESCE(rs.lead_minutes, 1440)) < now() + p_schedule_window
  LOOP
    IF public.queue_booking_reminder(v_row.id) THEN
      v_count := v_count + 1;
    END IF;
  END LOOP;
  RETURN v_count;
END;
$$;

-- 6. Booking changes. A reschedule cancels pending reminders and queues new ones.
--    A cancellation, completion or no-show cancels pending reminders.
CREATE OR REPLACE FUNCTION public.sync_booking_reminders()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'confirmed' THEN
      PERFORM public.queue_booking_reminder(NEW.id);
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM 'confirmed'
     OR NEW.start_time IS DISTINCT FROM OLD.start_time
     OR NEW.end_time IS DISTINCT FROM OLD.end_time THEN
    UPDATE public.notification_deliveries
    SET status = 'cancelled',
        error_message = 'booking changed or no longer confirmed'
    WHERE booking_id = NEW.id
      AND notification_type = 'booking_reminder'
      AND status = 'pending';
  END IF;

  IF NEW.status = 'confirmed'
     AND (NEW.start_time IS DISTINCT FROM OLD.start_time OR OLD.status IS DISTINCT FROM 'confirmed') THEN
    PERFORM public.queue_booking_reminder(NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_reminder_sync ON public.bookings;
CREATE TRIGGER bookings_reminder_sync
  AFTER INSERT OR UPDATE OF status, start_time, end_time ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.sync_booking_reminders();

-- 7. Claiming. Pending rows that are due, plus rows left in 'processing' by a crashed worker
--    once their lease (10 minutes) has expired. Rows past the attempt limit are not claimed.
CREATE OR REPLACE FUNCTION public.claim_notification_deliveries(
  p_limit integer DEFAULT 20,
  p_booking_id uuid DEFAULT NULL::uuid
)
RETURNS SETOF public.notification_deliveries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  WITH due_deliveries AS (
    SELECT nd.id
    FROM public.notification_deliveries nd
    WHERE nd.attempt_count < 5
      AND (
        (nd.status = 'pending' AND nd.scheduled_for <= NOW())
        OR (nd.status = 'processing' AND nd.updated_at < NOW() - interval '10 minutes')
      )
      AND (p_booking_id IS NULL OR nd.booking_id = p_booking_id)
    ORDER BY nd.scheduled_for ASC, nd.created_at ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  ),
  updated_deliveries AS (
    UPDATE public.notification_deliveries nd
    SET
      status = 'processing',
      attempt_count = nd.attempt_count + 1,
      updated_at = NOW()
    FROM due_deliveries dd
    WHERE nd.id = dd.id
    RETURNING nd.*
  )
  SELECT * FROM updated_deliveries;
END;
$$;

-- 8. Failure handling. Retry with exponential backoff (1, 2, 4 ... capped at 60 minutes).
--    After 5 attempts the row becomes 'failed' and stays visible to the admin.
CREATE OR REPLACE FUNCTION public.record_notification_failure(p_delivery_id uuid, p_error text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_attempts integer;
  v_status text;
BEGIN
  SELECT attempt_count INTO v_attempts
  FROM public.notification_deliveries
  WHERE id = p_delivery_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF v_attempts >= 5 THEN
    v_status := 'failed';
    UPDATE public.notification_deliveries
    SET status = 'failed', error_message = left(p_error, 500)
    WHERE id = p_delivery_id;
  ELSE
    v_status := 'pending';
    UPDATE public.notification_deliveries
    SET status = 'pending',
        error_message = left(p_error, 500),
        scheduled_for = now() + LEAST(make_interval(mins => power(2, v_attempts - 1)::integer), interval '60 minutes')
    WHERE id = p_delivery_id;
  END IF;

  RETURN v_status;
END;
$$;

-- 9. Privileges. Triggers and internal routines have no client access. The server calls
--    the worker routines with the service role.
REVOKE EXECUTE ON FUNCTION public.queue_booking_reminder(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_booking_reminders() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.schedule_booking_reminders(interval) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.schedule_booking_reminders(interval) TO service_role;
REVOKE EXECUTE ON FUNCTION public.claim_notification_deliveries(integer, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_notification_deliveries(integer, uuid) TO service_role;
REVOKE EXECUTE ON FUNCTION public.record_notification_failure(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_notification_failure(uuid, text) TO service_role;
