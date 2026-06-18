-- Migration: Harden booking engine against double-booking and invalid state transitions
-- 
-- This migration adds database-level protections that make the booking engine
-- safe against race conditions and concurrent modifications:
--
-- 1. EXCLUDE constraint: Prevents overlapping active bookings for same tenant/service
-- 2. Partial unique index: Prevents exact duplicate active bookings
-- 3. CHECK constraint: Ensures end_time > start_time at DB level
-- 4. Trigger: Enforces valid status transitions only

-- ============================================
-- A) Enable btree_gist extension for EXCLUDE on ranges
-- ============================================
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ============================================
-- B) Add EXCLUDE constraint for overlapping active bookings
-- ============================================
-- This prevents two active bookings for the same tenant_id + service_id
-- from having overlapping time ranges. Uses '[)' range constructor so
-- adjacent bookings (e.g., 10:00-11:00 and 11:00-12:00) are allowed.
-- The WHERE clause excludes cancelled bookings from the constraint.
--
-- Note: EXCLUDE constraints with WHERE clauses require PostgreSQL 12+
-- and the btree_gist extension.
ALTER TABLE bookings
ADD CONSTRAINT no_overlapping_active_bookings
EXCLUDE USING gist (
  tenant_id WITH =,
  service_id WITH =,
  tstzrange(start_time, end_time, '[)') WITH &&
)
WHERE (status != 'cancelled');

-- ============================================
-- C) Add partial unique index for exact duplicate active slots
-- ============================================
-- Prevents two active bookings with identical tenant_id, service_id,
-- start_time, and end_time. Cancelled bookings are excluded.
CREATE UNIQUE INDEX idx_bookings_unique_active_slot
ON bookings (tenant_id, service_id, start_time, end_time)
WHERE (status != 'cancelled');

-- ============================================
-- D) Add CHECK constraint for valid time range
-- ============================================
-- Although create_booking validates this, enforce at DB level too.
ALTER TABLE bookings
ADD CONSTRAINT valid_time_range
CHECK (end_time > start_time);

-- ============================================
-- E) Add trigger to enforce valid status transitions
-- ============================================

-- Function to validate booking status transitions
CREATE OR REPLACE FUNCTION validate_booking_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only validate on UPDATE of status column
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    -- Forbidden: cannot reactivate cancelled bookings
    IF OLD.status = 'cancelled' THEN
      RAISE EXCEPTION 'Cannot modify a cancelled booking';
    END IF;

    -- Forbidden: cannot go from confirmed back to pending
    IF OLD.status = 'confirmed' AND NEW.status = 'pending' THEN
      RAISE EXCEPTION 'Cannot move booking from confirmed to pending';
    END IF;

    -- Forbidden: cannot go from cancelled to anything else
    IF OLD.status = 'cancelled' AND NEW.status != 'cancelled' THEN
      RAISE EXCEPTION 'Cannot reactivate a cancelled booking';
    END IF;

    -- Forbidden: unknown status values (should be caught by CHECK constraint too)
    IF NEW.status NOT IN ('confirmed', 'cancelled', 'pending') THEN
      RAISE EXCEPTION 'Invalid booking status: %', NEW.status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger: fire BEFORE UPDATE on bookings
DROP TRIGGER IF EXISTS enforce_booking_status_transitions ON bookings;

CREATE TRIGGER enforce_booking_status_transitions
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION validate_booking_status_transition();

-- ============================================
-- F) Add index to support the EXCLUDE constraint
-- ============================================
-- The EXCLUDE constraint with WHERE requires a supporting index
CREATE INDEX idx_bookings_exclude_support
ON bookings (tenant_id, service_id)
WHERE (status != 'cancelled');
