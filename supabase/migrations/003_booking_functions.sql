-- Create booking RPC function with validation
CREATE OR REPLACE FUNCTION create_booking(
  p_tenant_id UUID,
  p_user_id UUID,
  p_service_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking_id UUID;
  v_service_duration INT;
  v_service_tenant_id UUID;
  v_time_slot_valid BOOLEAN;
BEGIN
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

  -- Create the booking
  INSERT INTO bookings (tenant_id, user_id, service_id, start_time, end_time, status)
  VALUES (p_tenant_id, p_user_id, p_service_id, p_start_time, p_end_time, 'confirmed')
  RETURNING id INTO v_booking_id;

  RETURN v_booking_id;
END;
$$;

-- Cancel booking function
CREATE OR REPLACE FUNCTION cancel_booking(
  p_booking_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking_exists BOOLEAN;
  v_tenant_id UUID;
BEGIN
  -- Check if booking exists and belongs to user
  SELECT EXISTS(
    SELECT 1 FROM bookings
    WHERE id = p_booking_id
    AND user_id = p_user_id
    AND status != 'cancelled'
  ) INTO v_booking_exists;

  IF NOT v_booking_exists THEN
    RAISE EXCEPTION 'Booking not found or already cancelled';
  END IF;

  -- Get tenant ID for RLS check
  SELECT tenant_id INTO v_tenant_id FROM bookings WHERE id = p_booking_id;

  -- Update booking status
  UPDATE bookings
  SET status = 'cancelled', updated_at = NOW()
  WHERE id = p_booking_id;

  RETURN TRUE;
END;
$$;

-- Send booking email function (placeholder)
CREATE OR REPLACE FUNCTION send_booking_email(
  p_booking_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- In production, this would integrate with an email service
  -- For now, just return true
  RETURN TRUE;
END;
$$;

-- Reminders function (placeholder)
CREATE OR REPLACE FUNCTION send_reminders()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- In production, this would send reminders for upcoming bookings
  -- For now, do nothing
  RETURN;
END;
$$;