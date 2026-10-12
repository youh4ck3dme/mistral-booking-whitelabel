-- 018: Active staff guard on bookings.
-- Append-only. prepare_booking_row (016) already handles buffer sync.
-- This migration adds only the missing active-staff validation trigger
-- to prevent bookings from referencing an inactive or wrong-tenant staff member.
--
-- Without this guard, a booking could be created or rescheduled to an inactive
-- staff member through a service_role UPDATE or a race between staff deactivation
-- and booking creation.

-- 1. Validation function: rejects if the staff member is inactive or belongs
--    to a different tenant. Fires on INSERT and UPDATE of staff_id, tenant_id, or start_time.
CREATE OR REPLACE FUNCTION public.validate_booking_staff_active()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Ak sa ruší rezervácia, validáciu personálu preskočíme
  IF NEW.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.staff
    WHERE id = NEW.staff_id
      AND is_active = TRUE
      AND tenant_id = NEW.tenant_id
  ) THEN
    RAISE EXCEPTION 'Staff member % is not active or does not belong to tenant %',
      NEW.staff_id, NEW.tenant_id USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_booking_staff ON public.bookings;
CREATE TRIGGER trg_validate_booking_staff
  BEFORE INSERT OR UPDATE OF staff_id, tenant_id, start_time ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_booking_staff_active();

-- 2. Trigger function is internal, no client access.
REVOKE EXECUTE ON FUNCTION public.validate_booking_staff_active()
  FROM PUBLIC, anon, authenticated;
