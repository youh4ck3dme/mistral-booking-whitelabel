-- ============================================================================
-- AUTOREPAIR: Booking Integrity Self-Healing Script
-- ============================================================================
-- Purpose:  Fix data anomalies in the booking system without downtime.
-- Run as:   service_role (via psql or Supabase SQL editor)
-- Before:   Take a PITR snapshot / pg_dump. Run the pre-check below first.
-- Safety:   Idempotent — re-running produces no side effects.
--           Transactional — all-or-nothing via BEGIN/COMMIT.
--           Trigger-aware — bookings_notification_sync fires automatically
--           on status changes, so no manual notification INSERT is needed.
-- ============================================================================

-- ============================================================================
-- STEP 0: PRE-CHECK (READ-ONLY) — Run this first, review results before repair
-- ============================================================================

SELECT
  'cross_tenant_service' AS category,
  COUNT(*) AS affected_count
FROM public.bookings b
JOIN public.services s ON s.id = b.service_id
WHERE b.tenant_id <> s.tenant_id

UNION ALL

SELECT
  'cross_tenant_staff',
  COUNT(*)
FROM public.bookings b
JOIN public.staff st ON st.id = b.staff_id
WHERE b.tenant_id <> st.tenant_id

UNION ALL

SELECT
  'inactive_staff_future_booking',
  COUNT(*)
FROM public.bookings b
JOIN public.staff st ON st.id = b.staff_id
WHERE st.is_active = FALSE
  AND b.status IN ('pending', 'confirmed')
  AND b.start_time > NOW()

UNION ALL

SELECT
  'orphaned_token',
  COUNT(*)
FROM public.booking_manage_tokens tk
JOIN public.bookings b ON b.id = tk.booking_id
WHERE tk.revoked_at IS NULL
  AND tk.expires_at > NOW()
  AND b.status NOT IN ('pending', 'confirmed')

UNION ALL

SELECT
  'stuck_notification',
  COUNT(*)
FROM public.notification_deliveries nd
WHERE nd.status = 'processing'
  AND nd.updated_at < NOW() - INTERVAL '10 minutes'

UNION ALL

SELECT
  'blocked_range_desync',
  COUNT(*)
FROM public.bookings b
JOIN public.services s ON s.id = b.service_id
WHERE b.blocked_start <> b.start_time - make_interval(mins => s.buffer_before_minutes)
   OR b.blocked_end <> b.end_time + make_interval(mins => s.buffer_after_minutes)

UNION ALL

SELECT
  'double_booking_overlap',
  COUNT(DISTINCT b2.id)
FROM public.bookings b1
JOIN public.bookings b2
  ON b1.staff_id = b2.staff_id
 AND b1.id <> b2.id
 AND b1.status IN ('pending', 'confirmed')
 AND b2.status IN ('pending', 'confirmed')
 AND tstzrange(b1.blocked_start, b1.blocked_end, '[)')
     && tstzrange(b2.blocked_start, b2.blocked_end, '[)')
WHERE (b1.created_at, b1.id) < (b2.created_at, b2.id)

UNION ALL

SELECT
  'bookings_missing_auth_email',
  COUNT(*)
FROM public.bookings b
LEFT JOIN auth.users u ON u.id = b.user_id
WHERE b.status IN ('pending', 'confirmed')
  AND (u.id IS NULL OR u.email IS NULL)

UNION ALL

SELECT
  'bookings_missing_audit_events',
  COUNT(*)
FROM public.bookings b
WHERE NOT EXISTS (
  SELECT 1 FROM public.booking_audit_events ae
  WHERE ae.booking_id = b.id
)

UNION ALL

SELECT
  'potential_duplicate_notifications',
  COUNT(*)
FROM (
  SELECT booking_id, notification_type, COUNT(*) AS cnt
  FROM public.notification_deliveries
  GROUP BY booking_id, notification_type
  HAVING COUNT(*) > 1
) dupes;

-- ============================================================================
-- STEP 1: REPAIR (TRANSACTIONAL) — Only run after reviewing Step 0 results
-- ============================================================================
-- Uncomment the BEGIN/COMMIT block below to execute.

-- BEGIN;

-- -- A) Revoke orphaned manage tokens for inactive bookings.
-- --    Tokens for cancelled/completed/no_show bookings should not remain active.
-- UPDATE public.booking_manage_tokens tk
-- SET revoked_at = NOW()
-- FROM public.bookings b
-- WHERE tk.booking_id = b.id
--   AND tk.revoked_at IS NULL
--   AND tk.expires_at > NOW()
--   AND b.status NOT IN ('pending', 'confirmed');

-- -- B) Reset stuck notifications (lease expired > 10 min, under attempt limit).
-- --    claim_notification_deliveries (017) also does lease recovery, but if the
-- --    worker is not running, this manual reset ensures they get picked up.
-- UPDATE public.notification_deliveries
-- SET status = 'pending',
--     updated_at = NOW()
-- WHERE status = 'processing'
--   AND updated_at < NOW() - INTERVAL '10 minutes'
--   AND attempt_count < 5;

-- -- C) Fix blocked_start/blocked_end desync.
-- --    The prepare_booking_row trigger (016) only fires on changes to
-- --    start_time/end_time/service_id/staff_id, so a direct service buffer
-- --    change can leave existing bookings out of sync.
-- UPDATE public.bookings b
-- SET blocked_start = b.start_time - make_interval(mins => s.buffer_before_minutes),
--     blocked_end = b.end_time + make_interval(mins => s.buffer_after_minutes),
--     updated_at = NOW()
-- FROM public.services s
-- WHERE s.id = b.service_id
--   AND (b.blocked_start <> b.start_time - make_interval(mins => s.buffer_before_minutes)
--     OR b.blocked_end <> b.end_time + make_interval(mins => s.buffer_after_minutes));

-- -- D) Identify bookings to cancel.
-- CREATE TEMP TABLE _repair_cancels ON COMMIT DROP AS
--
--   -- D.1: Future bookings with inactive staff
--   SELECT b.id, b.tenant_id, 'staff_inactive'::text AS reason
--   FROM public.bookings b
--   JOIN public.staff st ON st.id = b.staff_id
--   WHERE st.is_active = FALSE
--     AND b.status IN ('pending', 'confirmed')
--     AND b.start_time > NOW()
--
--   UNION -- Deduplication between D.1 and D.2
--
--   -- D.2: True double-booking losers via range overlap (&&) and tuple comparison
--   SELECT DISTINCT b2.id, b2.tenant_id, 'overlap_resolution'::text AS reason
--   FROM public.bookings b1
--   JOIN public.bookings b2
--     ON b1.staff_id = b2.staff_id
--    AND b1.id <> b2.id
--    AND b1.status IN ('pending', 'confirmed')
--    AND b2.status IN ('pending', 'confirmed')
--    AND tstzrange(b1.blocked_start, b1.blocked_end, '[)')
--        && tstzrange(b2.blocked_start, b2.blocked_end, '[)')
--   WHERE (b1.created_at, b1.id) < (b2.created_at, b2.id);

-- -- D.3: Cancel bookings.
-- --      Trigger bookings_notification_sync (005) fires automatically and calls
-- --      queue_booking_notification('booking_cancellation'). This resolves the
-- --      recipient email from auth.users and uses the standard idempotency key.
-- --      DO NOT manually INSERT into notification_deliveries — it would cause
-- --      duplicate emails.
-- UPDATE public.bookings b
-- SET status = 'cancelled',
--     updated_at = NOW()
-- FROM _repair_cancels rc
-- WHERE b.id = rc.id
--   AND b.status NOT IN ('cancelled');

-- -- D.4: Audit trail.
-- --      booking_audit_events has no trigger, so manual INSERT is required.
-- --      actor CHECK constraint allows: 'customer', 'staff', 'client_token'.
-- --      Using 'staff' with system_autorepair flag in details.
-- INSERT INTO public.booking_audit_events (tenant_id, booking_id, actor, action, details)
-- SELECT
--   rc.tenant_id,
--   rc.id,
--   'staff',
--   'cancelled',
--   jsonb_build_object(
--     'system_autorepair', true,
--     'reason', rc.reason,
--     'repaired_at', NOW()::text
--   )
-- FROM _repair_cancels rc;

-- COMMIT;
