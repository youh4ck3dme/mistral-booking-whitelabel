-- Migration: Add get_booked_slots function for safe, RLS-bypassing availability queries
-- This allows client pages to fetch booked slots without having general select permission on bookings of other users.

CREATE OR REPLACE FUNCTION get_booked_slots(
  p_tenant_id   UUID,
  p_service_id  UUID,
  p_start_range TIMESTAMPTZ,
  p_end_range   TIMESTAMPTZ
)
RETURNS TABLE (
  start_time TIMESTAMPTZ,
  end_time   TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT b.start_time, b.end_time
  FROM bookings b
  WHERE b.tenant_id = p_tenant_id
    AND b.service_id = p_service_id
    AND b.status != 'cancelled'
    AND b.start_time >= p_start_range
    AND b.start_time <= p_end_range
  ORDER BY b.start_time ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_booked_slots(UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO anon, authenticated;
