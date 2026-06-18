-- Migration: Fix SQL security vulnerability — never accept p_user_id from client
-- Both create_booking and cancel_booking now derive identity from auth.uid()

-- Drop old signatures first (different parameter lists = overloaded in PG, so drop explicitly)
DROP FUNCTION IF EXISTS create_booking(UUID, UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS cancel_booking(UUID, UUID);

-- Re-create create_booking WITHOUT p_user_id
CREATE OR REPLACE FUNCTION create_booking(
  p_tenant_id  UUID,
  p_service_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time   TIMESTAMPTZ
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_user   UUID;
  v_booking_id     UUID;
  v_service_duration INT;
  v_service_tenant_id UUID;
  v_time_slot_valid BOOLEAN;
BEGIN
  -- Derive identity from the authenticated session — never trust client-supplied user_id
  v_current_user := auth.uid();

  IF v_current_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate service exists and belongs to tenant
  SELECT duration, tenant_id INTO v_service_duration, v_service_tenant_id
  FROM services
  WHERE id = p_service_id AND is_active = TRUE;

  IF v_service_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Service not found or inactive';
  END IF;

  IF v_service_tenant_id != p_tenant_id THEN
    RAISE EXCEPTION 'Service does not belong to tenant';
  END IF;

  -- Validate time slot
  SELECT EXISTS(
    SELECT 1 FROM time_slots_config
    WHERE tenant_id = p_tenant_id
    AND is_active = TRUE
    AND start_time <= p_start_time::TIME
    AND end_time >= p_end_time::TIME
  ) INTO v_time_slot_valid;

  IF NOT v_time_slot_valid THEN
    RAISE EXCEPTION 'Selected time slot is not available';
  END IF;

  -- Validate booking time logic
  IF p_start_time >= p_end_time THEN
    RAISE EXCEPTION 'Invalid time range: start must be before end';
  END IF;

  -- Validate service duration matches
  IF (EXTRACT(EPOCH FROM (p_end_time - p_start_time)) / 60) != v_service_duration THEN
    RAISE EXCEPTION 'Booking duration does not match service duration';
  END IF;

  -- Check for overlapping bookings
  IF EXISTS(
    SELECT 1 FROM bookings
    WHERE tenant_id = p_tenant_id
    AND service_id = p_service_id
    AND status != 'cancelled'
    AND (
      (p_start_time < end_time AND p_end_time > start_time) OR
      (p_start_time = start_time AND p_end_time = end_time)
    )
  ) THEN
    RAISE EXCEPTION 'Time slot already booked';
  END IF;

  -- Create the booking using the server-side identity
  INSERT INTO bookings (tenant_id, user_id, service_id, start_time, end_time, status)
  VALUES (p_tenant_id, v_current_user, p_service_id, p_start_time, p_end_time, 'confirmed')
  RETURNING id INTO v_booking_id;

  RETURN v_booking_id;
END;
$$;

-- Re-create cancel_booking WITHOUT p_user_id
CREATE OR REPLACE FUNCTION cancel_booking(
  p_booking_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_user  UUID;
  v_booking_exists BOOLEAN;
BEGIN
  -- Derive identity from the authenticated session
  v_current_user := auth.uid();

  IF v_current_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if booking exists and belongs to the authenticated user
  SELECT EXISTS(
    SELECT 1 FROM bookings
    WHERE id = p_booking_id
    AND user_id = v_current_user
    AND status != 'cancelled'
  ) INTO v_booking_exists;

  IF NOT v_booking_exists THEN
    RAISE EXCEPTION 'Booking not found or already cancelled';
  END IF;

  -- Update booking status
  UPDATE bookings
  SET status = 'cancelled', updated_at = NOW()
  WHERE id = p_booking_id;

  RETURN TRUE;
END;
$$;
