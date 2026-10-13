-- 020: Guest (frictionless) bookings and AutoOps cycle.
-- Append-only. Guest bookings have no auth.users row: user_id is null and the
-- contact lives on the booking. The manage token (SHA-256 hash only) is the
-- credential, same as 015. AutoOps runs from the cron with the service role.

-- 1. Guest contact on the booking. Existing rows keep a user_id.
ALTER TABLE public.bookings
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS guest_name text,
  ADD COLUMN IF NOT EXISTS guest_email text,
  ADD COLUMN IF NOT EXISTS guest_phone text,
  ADD COLUMN IF NOT EXISTS note text;

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_guest_or_user_check;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_guest_or_user_check
  CHECK (
    user_id IS NOT NULL
    OR (guest_email IS NOT NULL AND guest_name IS NOT NULL)
  );

-- 2. Waitlist. A cancelled slot can notify the next waiting guest.
CREATE TABLE IF NOT EXISTS public.booking_waitlist (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  service_id    uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  guest_name    text NOT NULL,
  guest_email   text NOT NULL,
  guest_phone   text,
  status        text NOT NULL DEFAULT 'waiting'
                  CHECK (status IN ('waiting', 'notified', 'claimed', 'expired')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  notified_at   timestamptz
);

CREATE INDEX IF NOT EXISTS idx_booking_waitlist_open
  ON public.booking_waitlist (tenant_id, service_id, created_at)
  WHERE status = 'waiting';

ALTER TABLE public.booking_waitlist ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.booking_waitlist FROM PUBLIC, anon, authenticated;

-- 3. AutoOps audit. One row per cycle, visible to service role only.
CREATE TABLE IF NOT EXISTS public.autoops_events (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ran_at      timestamptz NOT NULL DEFAULT now(),
  summary     jsonb NOT NULL
);

ALTER TABLE public.autoops_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.autoops_events FROM PUBLIC, anon, authenticated;

-- 4. Notification outbox must accept a guest (no user_id). The old trigger
--    from 005 looked up auth.users and aborted the insert for a guest.
ALTER TABLE public.notification_deliveries
  ALTER COLUMN user_id DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.queue_booking_notification(
  p_booking_id uuid,
  p_notification_type text,
  p_scheduled_for timestamptz DEFAULT now()
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_booking public.bookings%ROWTYPE;
  v_service_name text;
  v_tenant_name text;
  v_email text;
  v_key text;
  v_id uuid;
BEGIN
  IF p_notification_type NOT IN (
    'booking_confirmation', 'booking_reminder', 'booking_cancellation', 'booking_update'
  ) THEN
    RAISE EXCEPTION 'Unsupported notification type: %', p_notification_type;
  END IF;

  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF v_booking.user_id IS NOT NULL THEN
    SELECT u.email INTO v_email FROM auth.users u WHERE u.id = v_booking.user_id;
  END IF;
  IF v_email IS NULL THEN
    v_email := v_booking.guest_email;
  END IF;
  IF v_email IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT s.name, t.name INTO v_service_name, v_tenant_name
  FROM public.services s
  JOIN public.tenants t ON t.id = v_booking.tenant_id
  WHERE s.id = v_booking.service_id;

  v_key := public.build_notification_idempotency_key(p_booking_id, p_notification_type, p_scheduled_for);

  INSERT INTO public.notification_deliveries (
    tenant_id, booking_id, user_id, notification_type, channel, status,
    recipient_email, payload, idempotency_key, scheduled_for
  )
  VALUES (
    v_booking.tenant_id, v_booking.id, v_booking.user_id, p_notification_type, 'email', 'pending',
    v_email,
    jsonb_build_object(
      'tenantName', v_tenant_name,
      'serviceName', v_service_name,
      'startTime', v_booking.start_time,
      'endTime', v_booking.end_time,
      'status', v_booking.status,
      'guestName', v_booking.guest_name
    ),
    v_key,
    COALESCE(p_scheduled_for, now())
  )
  ON CONFLICT (idempotency_key) DO UPDATE
    SET scheduled_for = LEAST(public.notification_deliveries.scheduled_for, EXCLUDED.scheduled_for)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Reminder queue from 017: fall back to guest_email when there is no auth user.
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

  IF v_b.user_id IS NOT NULL THEN
    SELECT u.email INTO v_email FROM auth.users u WHERE u.id = v_b.user_id;
  END IF;
  IF v_email IS NULL THEN
    v_email := v_b.guest_email;
  END IF;
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
      'status', v_b.status,
      'guestName', v_b.guest_name
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

-- 5. Guest booking. No session. The app supplies the token hash; the raw token
--    never reaches the database. Slot and staff rules match create_booking_with_staff.
CREATE OR REPLACE FUNCTION public.create_guest_booking(
  p_tenant_id uuid,
  p_service_id uuid,
  p_start_time timestamptz,
  p_client_name text,
  p_client_email text,
  p_client_phone text,
  p_token_hash text,
  p_staff_id uuid DEFAULT NULL,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tz text;
  v_duration integer;
  v_date date;
  v_end timestamptz;
  v_candidate record;
  v_booking_id uuid;
  v_inserted boolean := false;
  v_expires timestamptz;
BEGIN
  IF p_client_name IS NULL OR char_length(trim(p_client_name)) < 2 THEN
    RETURN jsonb_build_object('status', 'invalid_name');
  END IF;
  IF p_client_email IS NULL OR p_client_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' THEN
    RETURN jsonb_build_object('status', 'invalid_email');
  END IF;
  IF p_client_phone IS NULL OR char_length(regexp_replace(p_client_phone, '\D', '', 'g')) < 9 THEN
    RETURN jsonb_build_object('status', 'invalid_phone');
  END IF;
  IF p_token_hash IS NULL OR p_token_hash !~ '^[0-9a-f]{64}$' THEN
    RETURN jsonb_build_object('status', 'invalid_token');
  END IF;
  IF p_start_time IS NULL OR p_start_time <= now() THEN
    RETURN jsonb_build_object('status', 'in_past');
  END IF;

  SELECT s.duration INTO v_duration
  FROM public.services s
  WHERE s.id = p_service_id AND s.tenant_id = p_tenant_id AND s.is_active = TRUE;
  IF v_duration IS NULL THEN
    RETURN jsonb_build_object('status', 'service_unavailable');
  END IF;

  SELECT t.timezone INTO v_tz FROM public.tenants t WHERE t.id = p_tenant_id;
  IF v_tz IS NULL THEN
    RETURN jsonb_build_object('status', 'tenant_unavailable');
  END IF;

  v_end := p_start_time + make_interval(mins => v_duration);
  v_date := (p_start_time AT TIME ZONE v_tz)::date;

  FOR v_candidate IN
    SELECT a.staff_id AS sid
    FROM public.get_available_slots(p_tenant_id, p_service_id, v_date, p_staff_id) a
    WHERE a.start_time = p_start_time
      AND a.end_time = v_end
    ORDER BY a.staff_id
  LOOP
    BEGIN
      INSERT INTO public.bookings (
        tenant_id, user_id, service_id, staff_id, start_time, end_time, status,
        guest_name, guest_email, guest_phone, note
      )
      VALUES (
        p_tenant_id, NULL, p_service_id, v_candidate.sid, p_start_time, v_end, 'confirmed',
        trim(p_client_name), lower(trim(p_client_email)), trim(p_client_phone), p_note
      )
      RETURNING id INTO v_booking_id;
      v_inserted := true;
    EXCEPTION
      WHEN exclusion_violation THEN
        v_inserted := false;
    END;

    IF v_inserted THEN
      v_expires := v_end + interval '1 day';
      INSERT INTO public.booking_manage_tokens (booking_id, tenant_id, token_hash, expires_at)
      VALUES (v_booking_id, p_tenant_id, p_token_hash, v_expires);

      INSERT INTO public.booking_audit_events (tenant_id, booking_id, actor, action, details)
      VALUES (p_tenant_id, v_booking_id, 'client_token', 'token_issued',
              jsonb_build_object('expiresAt', v_expires, 'guest', true));

      RETURN jsonb_build_object(
        'status', 'ok',
        'bookingId', v_booking_id,
        'startTime', p_start_time,
        'endTime', v_end,
        'expiresAt', v_expires
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object('status', 'slot_taken');
END;
$$;

-- 6. AutoOps cycle. No-show detector, waitlist fill, gap count. Service role only.
CREATE OR REPLACE FUNCTION public.run_autoops_cycle()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_noshows integer := 0;
  v_waitlist integer := 0;
  v_gaps integer := 0;
  v_outbox integer := 0;
  v_row record;
  v_waiter public.booking_waitlist%ROWTYPE;
  v_summary jsonb;
BEGIN
  -- Confirmed bookings whose end passed more than 60 minutes ago and that
  -- staff never marked completed become no_show. The status change cancels
  -- any leftover pending reminder through the existing reminder trigger.
  UPDATE public.bookings
  SET status = 'no_show'
  WHERE status = 'confirmed'
    AND end_time < now() - interval '60 minutes';
  GET DIAGNOSTICS v_noshows = ROW_COUNT;

  -- Recent cancellations: notify the oldest waiting guest for the same service.
  FOR v_row IN
    SELECT b.id, b.tenant_id, b.service_id, b.start_time
    FROM public.bookings b
    WHERE b.status = 'cancelled'
      AND b.updated_at >= now() - interval '20 minutes'
  LOOP
    SELECT * INTO v_waiter
    FROM public.booking_waitlist w
    WHERE w.tenant_id = v_row.tenant_id
      AND w.service_id = v_row.service_id
      AND w.status = 'waiting'
    ORDER BY w.created_at
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    UPDATE public.booking_waitlist
    SET status = 'notified', notified_at = now()
    WHERE id = v_waiter.id;

    INSERT INTO public.notification_deliveries (
      tenant_id, booking_id, user_id, notification_type, channel, status,
      recipient_email, payload, idempotency_key, scheduled_for
    )
    VALUES (
      v_row.tenant_id, v_row.id, NULL, 'booking_update', 'email', 'pending',
      v_waiter.guest_email,
      jsonb_build_object(
        'event', 'waitlist_slot_opened',
        'serviceId', v_row.service_id,
        'slotTime', v_row.start_time,
        'waitlistId', v_waiter.id,
        'guestName', v_waiter.guest_name
      ),
      'waitlist:' || v_waiter.id::text || ':' || v_row.id::text,
      now()
    )
    ON CONFLICT (idempotency_key) DO NOTHING;

    v_waitlist := v_waitlist + 1;
    v_outbox := v_outbox + 1;
  END LOOP;

  -- Gaps: confirmed bookings on the same staff with more than 30 free minutes
  -- between them today. Count only; the app recommends, it does not move bookings.
  SELECT count(*) INTO v_gaps
  FROM (
    SELECT b.staff_id,
           b.end_time,
           lead(b.start_time) OVER (PARTITION BY b.staff_id ORDER BY b.start_time) AS next_start
    FROM public.bookings b
    WHERE b.status = 'confirmed'
      AND b.start_time::date = (now() AT TIME ZONE 'Europe/Bratislava')::date
  ) g
  WHERE g.next_start IS NOT NULL
    AND g.next_start - g.end_time > interval '30 minutes';

  v_summary := jsonb_build_object(
    'noShowsDetected', v_noshows,
    'waitlistFilled', v_waitlist,
    'gaps', v_gaps,
    'outboxQueued', v_outbox
  );

  INSERT INTO public.autoops_events (summary) VALUES (v_summary);
  RETURN v_summary;
END;
$$;

-- 7. Privileges. Guest booking is public (the token hash is the credential).
--    The cycle is service role only. Waitlist and events stay closed.
REVOKE EXECUTE ON FUNCTION public.create_guest_booking(uuid, uuid, timestamptz, text, text, text, text, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_guest_booking(uuid, uuid, timestamptz, text, text, text, text, uuid, text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.run_autoops_cycle() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.run_autoops_cycle() TO service_role;

REVOKE EXECUTE ON FUNCTION public.queue_booking_notification(uuid, text, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.queue_booking_reminder(uuid) FROM PUBLIC, anon, authenticated;
