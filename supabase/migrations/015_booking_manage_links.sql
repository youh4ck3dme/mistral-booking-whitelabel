-- 015: Customer self-service reschedule and cancel through a management link.
-- Append-only. Raw tokens never reach the database: the app generates them,
-- hashes them with SHA-256 and sends only the hash. A booking ID alone grants
-- nothing, because every public function requires a token hash that matches
-- an active, unexpired, unrevoked row for the same tenant slug.

-- 1. Token table. No client access; only SECURITY DEFINER functions touch it.
CREATE TABLE IF NOT EXISTS public.booking_manage_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  token_hash  text NOT NULL UNIQUE CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  expires_at  timestamptz NOT NULL,
  revoked_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid
);

CREATE INDEX IF NOT EXISTS idx_booking_manage_tokens_booking
  ON public.booking_manage_tokens (booking_id);

ALTER TABLE public.booking_manage_tokens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.booking_manage_tokens FROM PUBLIC, anon, authenticated;

-- 2. Audit trail for booking changes made through a token or by staff.
CREATE TABLE IF NOT EXISTS public.booking_audit_events (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  booking_id  uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  actor       text NOT NULL CHECK (actor IN ('customer', 'staff', 'client_token')),
  action      text NOT NULL CHECK (action IN ('token_issued', 'rescheduled', 'cancelled')),
  details     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_audit_events_booking
  ON public.booking_audit_events (booking_id, created_at);

ALTER TABLE public.booking_audit_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.booking_audit_events FROM PUBLIC, anon, authenticated;

-- 3. Issue or rotate a management link. Booking owner or tenant staff/admin only.
--    Revokes every active token for the booking, so the newest link is the only one.
CREATE OR REPLACE FUNCTION public.issue_booking_manage_token(p_booking_id uuid, p_token_hash text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid     uuid := auth.uid();
  v_booking public.bookings%ROWTYPE;
  v_actor   text;
  v_expires timestamptz;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF p_token_hash IS NULL OR p_token_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'Invalid token hash' USING ERRCODE = '23514';
  END IF;

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_booking.user_id = v_uid THEN
    v_actor := 'customer';
  ELSIF public.is_tenant_admin_or_staff(v_booking.tenant_id) THEN
    v_actor := 'staff';
  ELSE
    RAISE EXCEPTION 'Not authorized for this booking' USING ERRCODE = '42501';
  END IF;

  IF v_booking.status <> 'confirmed' THEN
    RAISE EXCEPTION 'Booking is not active' USING ERRCODE = 'P0001';
  END IF;

  v_expires := v_booking.end_time + interval '1 day';

  UPDATE public.booking_manage_tokens
  SET revoked_at = now()
  WHERE booking_id = p_booking_id
    AND revoked_at IS NULL;

  INSERT INTO public.booking_manage_tokens (booking_id, tenant_id, token_hash, expires_at, created_by)
  VALUES (p_booking_id, v_booking.tenant_id, p_token_hash, v_expires, v_uid);

  INSERT INTO public.booking_audit_events (tenant_id, booking_id, actor, action, details)
  VALUES (v_booking.tenant_id, p_booking_id, v_actor, 'token_issued',
          jsonb_build_object('expiresAt', v_expires));

  RETURN jsonb_build_object('expiresAt', v_expires, 'actor', v_actor);
END;
$$;

-- 4. Read a booking through its token. Unknown, revoked and wrong-tenant tokens
--    all return the same "invalid" answer, so the response reveals nothing about
--    other bookings.
CREATE OR REPLACE FUNCTION public.get_booking_by_manage_token(p_token_hash text, p_tenant_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_row record;
BEGIN
  IF p_token_hash IS NULL OR p_token_hash !~ '^[0-9a-f]{64}$' THEN
    RETURN jsonb_build_object('status', 'invalid');
  END IF;

  SELECT tk.expires_at, tk.revoked_at,
         b.id, b.start_time, b.end_time, b.status,
         s.name AS service_name, s.duration AS service_duration, s.price AS service_price,
         t.name AS tenant_name, t.slug AS tenant_slug
  INTO v_row
  FROM public.booking_manage_tokens tk
  JOIN public.tenants t ON t.id = tk.tenant_id
  JOIN public.bookings b ON b.id = tk.booking_id
  JOIN public.services s ON s.id = b.service_id
  WHERE tk.token_hash = p_token_hash
    AND t.slug = p_tenant_slug;

  IF NOT FOUND OR v_row.revoked_at IS NOT NULL THEN
    RETURN jsonb_build_object('status', 'invalid');
  END IF;

  IF v_row.expires_at <= now() THEN
    RETURN jsonb_build_object('status', 'expired');
  END IF;

  RETURN jsonb_build_object(
    'status', 'ok',
    'booking', jsonb_build_object(
      'id', v_row.id,
      'startTime', v_row.start_time,
      'endTime', v_row.end_time,
      'status', v_row.status,
      'serviceName', v_row.service_name,
      'serviceDuration', v_row.service_duration,
      'servicePrice', v_row.service_price,
      'tenantName', v_row.tenant_name,
      'tenantSlug', v_row.tenant_slug
    )
  );
END;
$$;

-- 5. Reschedule through a token. Atomic: locks the token and booking, checks the
--    slot, and relies on no_overlapping_active_bookings for races. On success the
--    old token is revoked and a new one (hash supplied by the app) takes over.
CREATE OR REPLACE FUNCTION public.reschedule_booking_by_token(
  p_token_hash text,
  p_tenant_slug text,
  p_new_start timestamptz,
  p_new_token_hash text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tk       public.booking_manage_tokens%ROWTYPE;
  v_b        public.bookings%ROWTYPE;
  v_duration integer;
  v_new_end  timestamptz;
BEGIN
  IF p_token_hash IS NULL OR p_token_hash !~ '^[0-9a-f]{64}$'
     OR p_new_token_hash IS NULL OR p_new_token_hash !~ '^[0-9a-f]{64}$' THEN
    RETURN jsonb_build_object('status', 'invalid');
  END IF;

  SELECT tk.* INTO v_tk
  FROM public.booking_manage_tokens tk
  JOIN public.tenants t ON t.id = tk.tenant_id
  WHERE tk.token_hash = p_token_hash
    AND t.slug = p_tenant_slug
  FOR UPDATE OF tk;

  IF NOT FOUND OR v_tk.revoked_at IS NOT NULL THEN
    RETURN jsonb_build_object('status', 'invalid');
  END IF;

  IF v_tk.expires_at <= now() THEN
    RETURN jsonb_build_object('status', 'expired');
  END IF;

  SELECT * INTO v_b
  FROM public.bookings
  WHERE id = v_tk.booking_id
  FOR UPDATE;

  IF v_b.status = 'cancelled' THEN
    RETURN jsonb_build_object('status', 'already_cancelled');
  END IF;

  IF v_b.status <> 'confirmed' THEN
    RETURN jsonb_build_object('status', 'not_editable');
  END IF;

  IF p_new_start <= now() THEN
    RETURN jsonb_build_object('status', 'in_past');
  END IF;

  SELECT s.duration INTO v_duration
  FROM public.services s
  WHERE s.id = v_b.service_id
    AND s.is_active = TRUE;

  IF v_duration IS NULL THEN
    RETURN jsonb_build_object('status', 'not_editable');
  END IF;

  v_new_end := p_new_start + make_interval(mins => v_duration);

  -- Same opening-hours rule as create_booking. Staff-aware availability replaces it later.
  IF NOT EXISTS (
    SELECT 1 FROM public.time_slots_config tsc
    WHERE tsc.tenant_id = v_b.tenant_id
      AND tsc.is_active = TRUE
      AND tsc.start_time <= (p_new_start AT TIME ZONE 'UTC')::time
      AND tsc.end_time >= (v_new_end AT TIME ZONE 'UTC')::time
  ) THEN
    RETURN jsonb_build_object('status', 'outside_hours');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.tenant_id = v_b.tenant_id
      AND b.service_id = v_b.service_id
      AND b.id <> v_b.id
      AND b.status <> 'cancelled'
      AND p_new_start < b.end_time
      AND v_new_end > b.start_time
  ) THEN
    RETURN jsonb_build_object('status', 'slot_taken');
  END IF;

  BEGIN
    UPDATE public.bookings
    SET start_time = p_new_start,
        end_time = v_new_end
    WHERE id = v_b.id;
  EXCEPTION
    WHEN exclusion_violation THEN
      RETURN jsonb_build_object('status', 'slot_taken');
  END;

  UPDATE public.booking_manage_tokens
  SET revoked_at = now()
  WHERE id = v_tk.id;

  INSERT INTO public.booking_manage_tokens (booking_id, tenant_id, token_hash, expires_at)
  VALUES (v_b.id, v_b.tenant_id, p_new_token_hash, v_new_end + interval '1 day');

  INSERT INTO public.booking_audit_events (tenant_id, booking_id, actor, action, details)
  VALUES (v_b.tenant_id, v_b.id, 'client_token', 'rescheduled', jsonb_build_object(
    'fromStart', v_b.start_time,
    'fromEnd', v_b.end_time,
    'toStart', p_new_start,
    'toEnd', v_new_end,
    'tokenRotated', true
  ));

  RETURN jsonb_build_object('status', 'ok', 'startTime', p_new_start, 'endTime', v_new_end);
END;
$$;

-- 6. Cancel through a token. Idempotent: a second call returns already_cancelled
--    and writes no second audit row.
CREATE OR REPLACE FUNCTION public.cancel_booking_by_token(p_token_hash text, p_tenant_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tk public.booking_manage_tokens%ROWTYPE;
  v_b  public.bookings%ROWTYPE;
BEGIN
  IF p_token_hash IS NULL OR p_token_hash !~ '^[0-9a-f]{64}$' THEN
    RETURN jsonb_build_object('status', 'invalid');
  END IF;

  SELECT tk.* INTO v_tk
  FROM public.booking_manage_tokens tk
  JOIN public.tenants t ON t.id = tk.tenant_id
  WHERE tk.token_hash = p_token_hash
    AND t.slug = p_tenant_slug
  FOR UPDATE OF tk;

  IF NOT FOUND OR v_tk.revoked_at IS NOT NULL THEN
    RETURN jsonb_build_object('status', 'invalid');
  END IF;

  IF v_tk.expires_at <= now() THEN
    RETURN jsonb_build_object('status', 'expired');
  END IF;

  SELECT * INTO v_b
  FROM public.bookings
  WHERE id = v_tk.booking_id
  FOR UPDATE;

  IF v_b.status = 'cancelled' THEN
    RETURN jsonb_build_object('status', 'already_cancelled');
  END IF;

  IF v_b.status NOT IN ('pending', 'confirmed') THEN
    RETURN jsonb_build_object('status', 'not_editable');
  END IF;

  UPDATE public.bookings
  SET status = 'cancelled'
  WHERE id = v_b.id;

  INSERT INTO public.booking_audit_events (tenant_id, booking_id, actor, action, details)
  VALUES (v_b.tenant_id, v_b.id, 'client_token', 'cancelled',
          jsonb_build_object('previousStatus', v_b.status));

  RETURN jsonb_build_object('status', 'ok');
END;
$$;

-- 7. Privileges. Public token functions are callable by anon (the token is the
--    credential). Issuing requires an authenticated session.
REVOKE EXECUTE ON FUNCTION public.issue_booking_manage_token(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.issue_booking_manage_token(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_booking_by_manage_token(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_booking_by_manage_token(text, text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.reschedule_booking_by_token(text, text, timestamptz, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reschedule_booking_by_token(text, text, timestamptz, text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.cancel_booking_by_token(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_booking_by_token(text, text) TO anon, authenticated;
