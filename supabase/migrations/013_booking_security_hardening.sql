-- Migration 013: security and correctness hardening for the booking engine.
--
-- Append-only follow-up to 001-012 (earlier migrations are not edited).
--
-- 1. Remove redundant indexes from 009. The EXCLUDE constraint already rejects
--    exact duplicates (SQLSTATE 23P01), and its GiST index covers the
--    (tenant_id, service_id) lookups. Keeping the unique index made the error
--    code for a duplicate depend on which index was checked first.
-- 2. Client INSERTs on bookings: only for the caller's own user_id and only for
--    a service of the same tenant. Previously any authenticated user could
--    insert for another user or reference a service from another tenant.
-- 3. create_booking / cancel_booking: schema-qualified names, search_path pinned
--    to '' (Supabase advisor: function_search_path_mutable), and explicit
--    SQLSTATEs on re-raised errors (23P01 overlap, 23514 invalid range).
-- 4. Every function in public pins search_path to '' and uses qualified names.
-- 5. Least-privilege EXECUTE: internal notification and trigger routines are not
--    callable by anon/authenticated (claim_notification_deliveries returns
--    recipient emails, so anonymous access was a data exposure). Client RPCs keep
--    only the grants they need. Server-only routines are granted to service_role.
-- 6. notification_deliveries and platform_admins: no client-role table access.

-- ============================================
-- 1. Redundant indexes
-- ============================================
DROP INDEX IF EXISTS public.idx_bookings_unique_active_slot;
DROP INDEX IF EXISTS public.idx_bookings_exclude_support;

-- ============================================
-- 2. Client INSERT policy on bookings
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can create bookings via RPC" ON public.bookings;

CREATE POLICY "Authenticated users can insert own bookings"
ON public.bookings FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.services s
    WHERE s.id = bookings.service_id
      AND s.tenant_id = bookings.tenant_id
      AND s.is_active = true
  )
);

-- ============================================
-- 3. Booking RPCs
-- ============================================
CREATE OR REPLACE FUNCTION public.create_booking(
  p_tenant_id  UUID,
  p_service_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time   TIMESTAMPTZ
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_current_user      UUID;
  v_booking_id        UUID;
  v_service_duration  INT;
  v_service_tenant_id UUID;
  v_time_slot_valid   BOOLEAN;
BEGIN
  -- Identity comes from the session only; never from the client.
  v_current_user := auth.uid();

  IF v_current_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT s.duration, s.tenant_id INTO v_service_duration, v_service_tenant_id
  FROM public.services s
  WHERE s.id = p_service_id AND s.is_active = TRUE;

  IF v_service_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Service not found or inactive';
  END IF;

  IF v_service_tenant_id != p_tenant_id THEN
    RAISE EXCEPTION 'Service does not belong to tenant';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.time_slots_config tsc
    WHERE tsc.tenant_id = p_tenant_id
      AND tsc.is_active = TRUE
      AND tsc.start_time <= p_start_time::TIME
      AND tsc.end_time >= p_end_time::TIME
  ) INTO v_time_slot_valid;

  IF NOT v_time_slot_valid THEN
    RAISE EXCEPTION 'Selected time slot is not available';
  END IF;

  IF p_start_time >= p_end_time THEN
    RAISE EXCEPTION 'Invalid time range: start must be before end';
  END IF;

  IF (EXTRACT(EPOCH FROM (p_end_time - p_start_time)) / 60) != v_service_duration THEN
    RAISE EXCEPTION 'Booking duration does not match service duration';
  END IF;

  -- Fast pre-check for a clear error. The EXCLUDE constraint below is the
  -- authoritative guard against races.
  IF EXISTS(
    SELECT 1 FROM public.bookings b
    WHERE b.tenant_id = p_tenant_id
      AND b.service_id = p_service_id
      AND b.status != 'cancelled'
      AND (p_start_time < b.end_time AND p_end_time > b.start_time)
  ) THEN
    RAISE EXCEPTION 'Time slot already booked' USING ERRCODE = 'exclusion_violation';
  END IF;

  BEGIN
    INSERT INTO public.bookings (tenant_id, user_id, service_id, start_time, end_time, status)
    VALUES (p_tenant_id, v_current_user, p_service_id, p_start_time, p_end_time, 'confirmed')
    RETURNING id INTO v_booking_id;
  EXCEPTION
    WHEN exclusion_violation THEN
      RAISE EXCEPTION 'Time slot already booked' USING ERRCODE = 'exclusion_violation';
    WHEN check_violation THEN
      RAISE EXCEPTION 'Invalid time range: start must be before end' USING ERRCODE = 'check_violation';
  END;

  RETURN v_booking_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_booking(
  p_booking_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_current_user  UUID;
  v_rows_affected INT;
BEGIN
  v_current_user := auth.uid();

  IF v_current_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Only the owner can cancel, and only once.
  UPDATE public.bookings
  SET status = 'cancelled', updated_at = NOW()
  WHERE id = p_booking_id
    AND user_id = v_current_user
    AND status != 'cancelled';

  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

  IF v_rows_affected = 0 THEN
    RAISE EXCEPTION 'Booking not found or already cancelled';
  END IF;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_booked_slots(
  p_tenant_id  UUID,
  p_service_id UUID,
  p_start_range TIMESTAMPTZ,
  p_end_range   TIMESTAMPTZ
)
RETURNS TABLE(start_time TIMESTAMPTZ, end_time TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT b.start_time, b.end_time
  FROM public.bookings b
  WHERE b.tenant_id = p_tenant_id
    AND b.service_id = p_service_id
    AND b.status != 'cancelled'
    AND b.start_time >= p_start_range
    AND b.start_time <= p_end_range
  ORDER BY b.start_time ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_booking_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF OLD.status = 'cancelled' THEN
      RAISE EXCEPTION 'Cannot modify a cancelled booking';
    END IF;

    IF OLD.status = 'confirmed' AND NEW.status = 'pending' THEN
      RAISE EXCEPTION 'Cannot move booking from confirmed to pending';
    END IF;

    IF NEW.status NOT IN ('confirmed', 'cancelled', 'pending') THEN
      RAISE EXCEPTION 'Invalid booking status: %', NEW.status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================
-- 4. Remaining functions: qualified names and pinned search_path
-- ============================================
CREATE OR REPLACE FUNCTION public.is_tenant_member(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_users tu
    WHERE tu.tenant_id = p_tenant_id
      AND tu.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_admin_or_staff(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_users tu
    WHERE tu.tenant_id = p_tenant_id
      AND tu.user_id = auth.uid()
      AND tu.role IN ('admin', 'staff')
  );
$$;

CREATE OR REPLACE FUNCTION public.build_notification_idempotency_key(
  p_booking_id uuid,
  p_notification_type text,
  p_scheduled_for timestamptz DEFAULT now()
)
RETURNS text
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF p_notification_type = 'booking_reminder' THEN
    RETURN CONCAT(
      p_booking_id::TEXT,
      ':',
      p_notification_type,
      ':',
      TO_CHAR(DATE_TRUNC('minute', COALESCE(p_scheduled_for, NOW()) AT TIME ZONE 'UTC'), 'YYYYMMDDHH24MI')
    );
  END IF;

  RETURN CONCAT(p_booking_id::TEXT, ':', p_notification_type);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

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
  v_booking RECORD;
  v_recipient_email TEXT;
  v_idempotency_key TEXT;
  v_delivery_id UUID;
  v_scheduled_for TIMESTAMPTZ := COALESCE(p_scheduled_for, NOW());
BEGIN
  IF p_notification_type NOT IN (
    'booking_confirmation',
    'booking_reminder',
    'booking_cancellation',
    'booking_update'
  ) THEN
    RAISE EXCEPTION 'Unsupported notification type: %', p_notification_type;
  END IF;

  SELECT
    b.id,
    b.tenant_id,
    b.user_id,
    b.service_id,
    b.start_time,
    b.end_time,
    b.status,
    s.name AS service_name,
    t.name AS tenant_name
  INTO v_booking
  FROM public.bookings b
  JOIN public.services s ON s.id = b.service_id
  JOIN public.tenants t ON t.id = b.tenant_id
  WHERE b.id = p_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking % was not found for notification queueing', p_booking_id;
  END IF;

  SELECT u.email
  INTO v_recipient_email
  FROM auth.users u
  WHERE u.id = v_booking.user_id;

  IF v_recipient_email IS NULL THEN
    RAISE EXCEPTION 'Booking % has no recipient email', p_booking_id;
  END IF;

  v_idempotency_key := public.build_notification_idempotency_key(
    p_booking_id,
    p_notification_type,
    v_scheduled_for
  );

  INSERT INTO public.notification_deliveries AS nd (
    tenant_id,
    booking_id,
    user_id,
    notification_type,
    channel,
    status,
    recipient_email,
    subject,
    payload,
    idempotency_key,
    scheduled_for
  )
  VALUES (
    v_booking.tenant_id,
    v_booking.id,
    v_booking.user_id,
    p_notification_type,
    'email',
    'pending',
    v_recipient_email,
    NULL,
    jsonb_build_object(
      'tenantName', v_booking.tenant_name,
      'serviceName', v_booking.service_name,
      'startTime', v_booking.start_time,
      'endTime', v_booking.end_time,
      'status', v_booking.status
    ),
    v_idempotency_key,
    v_scheduled_for
  )
  ON CONFLICT (idempotency_key) DO UPDATE
    SET scheduled_for = LEAST(nd.scheduled_for, EXCLUDED.scheduled_for)
  RETURNING nd.id INTO v_delivery_id;

  RETURN v_delivery_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.send_booking_email(p_booking_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM public.queue_booking_notification(p_booking_id, 'booking_confirmation', NOW());
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_booking_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'confirmed' THEN
      PERFORM public.queue_booking_notification(NEW.id, 'booking_confirmation', NOW());
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'cancelled' THEN
      PERFORM public.queue_booking_notification(NEW.id, 'booking_cancellation', NOW());
      RETURN NEW;
    END IF;

    IF NEW.status = 'confirmed' THEN
      PERFORM public.queue_booking_notification(NEW.id, 'booking_confirmation', NOW());
    END IF;
  END IF;

  IF
    NEW.status != 'cancelled'
    AND (
      NEW.start_time IS DISTINCT FROM OLD.start_time
      OR NEW.end_time IS DISTINCT FROM OLD.end_time
      OR NEW.service_id IS DISTINCT FROM OLD.service_id
    )
  THEN
    PERFORM public.queue_booking_notification(NEW.id, 'booking_update', NOW());
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.schedule_booking_reminders(
  p_reminder_lead_time interval DEFAULT '24:00:00'::interval,
  p_schedule_window interval DEFAULT '01:00:00'::interval
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_inserted INTEGER := 0;
BEGIN
  INSERT INTO public.notification_deliveries (
    tenant_id,
    booking_id,
    user_id,
    notification_type,
    channel,
    status,
    recipient_email,
    payload,
    idempotency_key,
    scheduled_for
  )
  SELECT
    b.tenant_id,
    b.id,
    b.user_id,
    'booking_reminder',
    'email',
    'pending',
    u.email,
    jsonb_build_object(
      'tenantName', t.name,
      'serviceName', s.name,
      'startTime', b.start_time,
      'endTime', b.end_time,
      'status', b.status
    ),
    public.build_notification_idempotency_key(
      b.id,
      'booking_reminder',
      DATE_TRUNC('minute', b.start_time - p_reminder_lead_time)
    ),
    NOW()
  FROM public.bookings b
  JOIN public.services s ON s.id = b.service_id
  JOIN public.tenants t ON t.id = b.tenant_id
  JOIN auth.users u ON u.id = b.user_id
  WHERE b.status = 'confirmed'
    AND b.start_time >= NOW() + p_reminder_lead_time
    AND b.start_time < NOW() + p_reminder_lead_time + p_schedule_window
    AND u.email IS NOT NULL
  ON CONFLICT (idempotency_key) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN v_inserted;
END;
$$;

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
    WHERE nd.status = 'pending'
      AND nd.scheduled_for <= NOW()
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

CREATE OR REPLACE FUNCTION public.send_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM public.schedule_booking_reminders();
END;
$$;

-- ============================================
-- 5. Least-privilege EXECUTE
-- ============================================
-- Internal, trigger and server-only routines: no client-role access.
REVOKE EXECUTE ON FUNCTION public.queue_booking_notification(uuid, text, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.send_booking_email(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.send_reminders() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_booking_notifications() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_booking_status_transition() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.build_notification_idempotency_key(uuid, text, timestamptz) FROM PUBLIC, anon, authenticated;

-- Called by the server with the service role (apps/web notifications repository).
REVOKE EXECUTE ON FUNCTION public.claim_notification_deliveries(integer, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_notification_deliveries(integer, uuid) TO service_role;
REVOKE EXECUTE ON FUNCTION public.schedule_booking_reminders(interval, interval) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.schedule_booking_reminders(interval, interval) TO service_role;

-- Client RPCs.
REVOKE EXECUTE ON FUNCTION public.create_booking(uuid, uuid, timestamptz, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_booking(uuid, uuid, timestamptz, timestamptz) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.cancel_booking(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_booking(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_booked_slots(uuid, uuid, timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_booked_slots(uuid, uuid, timestamptz, timestamptz) TO anon, authenticated;

-- RLS helpers: evaluated for authenticated sessions only.
REVOKE EXECUTE ON FUNCTION public.is_tenant_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_tenant_member(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_tenant_admin_or_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_tenant_admin_or_staff(uuid) TO authenticated;

-- Future functions created in public should not be executable by client roles by default.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON ROUTINES FROM anon, authenticated;

-- ============================================
-- 6. Table privileges for client roles
-- ============================================
-- These tables are written only by server-side code and SECURITY DEFINER routines.
REVOKE ALL ON public.notification_deliveries FROM anon, authenticated;
REVOKE ALL ON public.platform_admins FROM anon, authenticated;
