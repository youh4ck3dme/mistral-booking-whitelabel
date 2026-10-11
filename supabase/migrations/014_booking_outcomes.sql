-- 014: Booking outcomes (completed / no_show) via a server-checked RPC.
-- Append-only: earlier migrations are not edited. Direct client UPDATE on
-- bookings stays denied (002 "Deny direct booking updates").

-- 1. Extend the status domain.
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show'));

-- 2. Transition rules. Messages for cancelled and confirmed->pending are kept
--    from 013 so existing verification checks still match.
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

    IF OLD.status IN ('completed', 'no_show') THEN
      RAISE EXCEPTION 'Cannot modify a finalized booking';
    END IF;

    IF NEW.status NOT IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show') THEN
      RAISE EXCEPTION 'Invalid booking status: %', NEW.status;
    END IF;

    IF OLD.status = 'confirmed' AND NEW.status = 'pending' THEN
      RAISE EXCEPTION 'Cannot move booking from confirmed to pending';
    END IF;

    IF NEW.status IN ('completed', 'no_show') AND OLD.status <> 'confirmed' THEN
      RAISE EXCEPTION 'Only a confirmed booking can be completed or marked as no-show';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Outcome RPC: staff/admin of the booking's tenant only, and only after the
--    appointment has started. Uses auth.uid(), never a client-supplied user id.
CREATE OR REPLACE FUNCTION public.set_booking_outcome(p_booking_id uuid, p_outcome text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_booking public.bookings%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF p_outcome NOT IN ('completed', 'no_show') THEN
    RAISE EXCEPTION 'Invalid outcome: %', p_outcome USING ERRCODE = '23514';
  END IF;

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found' USING ERRCODE = 'P0002';
  END IF;

  IF NOT public.is_tenant_admin_or_staff(v_booking.tenant_id) THEN
    RAISE EXCEPTION 'Not authorized for this tenant' USING ERRCODE = '42501';
  END IF;

  IF v_booking.start_time > NOW() THEN
    RAISE EXCEPTION 'Booking has not started yet' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.bookings
  SET status = p_outcome
  WHERE id = p_booking_id;

  RETURN p_outcome;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_booking_outcome(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_booking_outcome(uuid, text) TO authenticated;
