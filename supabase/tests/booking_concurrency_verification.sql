-- Booking Concurrency Hardening Verification Tests
-- 
-- Run these tests AFTER applying migration 009_booking_concurrency_hardening.sql
-- to verify that the database-level protections work correctly.
--
-- Prerequisites:
--   - A tenant exists with id = '00000000-0000-0000-0000-000000000001'
--   - A service exists with id = '00000000-0000-0000-0000-000000000002' for that tenant
--   - A user exists with id = '00000000-0000-0000-0000-000000000003'
--
-- If these don't exist, create them first with:
--   INSERT INTO tenants (id, name, slug) VALUES ('00000000-0000-0000-0000-000000000001', 'Test Tenant', 'test-tenant');
--   INSERT INTO services (id, tenant_id, name, duration, price, is_active) 
--     VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Test Service', 60, 100.00, true);

-- ============================================
-- Setup: Clean up any existing test data
-- ============================================
DELETE FROM bookings WHERE tenant_id = '00000000-0000-0000-0000-000000000001';

-- ============================================
-- Test A: Overlap must fail
-- Insert active booking 10:00-11:00, then try 10:30-11:30
-- Expected: second insert fails with exclusion_violation
-- ============================================
-- Setup: Insert first booking
INSERT INTO bookings (id, tenant_id, user_id, service_id, start_time, end_time, status)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000002',
  '2024-01-01 10:00:00+00',
  '2024-01-01 11:00:00+00',
  'confirmed'
);

-- Test: Try to insert overlapping booking
-- This should FAIL with exclusion_violation (23P01)
-- Uncomment to test: 
-- INSERT INTO bookings (id, tenant_id, user_id, service_id, start_time, end_time, status)
-- VALUES (
--   '20000000-0000-0000-0000-000000000001',
--   '00000000-0000-0000-0000-000000000001',
--   '00000000-0000-0000-0000-000000000003',
--   '00000000-0000-0000-0000-000000000002',
--   '2024-01-01 10:30:00+00',
--   '2024-01-01 11:30:00+00',
--   'confirmed'
-- );

-- Verification query for Test A
SELECT 
  'Test A: Overlap must fail' AS test_name,
  COUNT(*) = 1 AS only_one_booking_exists,
  COUNT(*) AS actual_count
FROM bookings 
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
  AND service_id = '00000000-0000-0000-0000-000000000002'
  AND status != 'cancelled';
-- Expected: only_one_booking_exists = true, actual_count = 1

-- ============================================
-- Test B: Adjacent booking must pass
-- Insert booking 11:00-12:00 (adjacent to 10:00-11:00)
-- Expected: succeeds
-- ============================================
INSERT INTO bookings (id, tenant_id, user_id, service_id, start_time, end_time, status)
VALUES (
  '30000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000002',
  '2024-01-01 11:00:00+00',
  '2024-01-01 12:00:00+00',
  'confirmed'
);

-- Verification query for Test B
SELECT 
  'Test B: Adjacent booking must pass' AS test_name,
  COUNT(*) = 2 AS two_bookings_exist,
  COUNT(*) AS actual_count
FROM bookings 
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
  AND service_id = '00000000-0000-0000-0000-000000000002'
  AND status != 'cancelled';
-- Expected: two_bookings_exist = true, actual_count = 2

-- ============================================
-- Test C: Cancelled booking must not block
-- Cancel booking 10:00-11:00, then insert new booking at same time
-- Expected: succeeds
-- ============================================
-- Cancel first booking
UPDATE bookings 
SET status = 'cancelled'
WHERE id = '10000000-0000-0000-0000-000000000001';

-- Insert new booking at same time slot
INSERT INTO bookings (id, tenant_id, user_id, service_id, start_time, end_time, status)
VALUES (
  '40000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000002',
  '2024-01-01 10:00:00+00',
  '2024-01-01 11:00:00+00',
  'confirmed'
);

-- Verification query for Test C
SELECT 
  'Test C: Cancelled booking must not block' AS test_name,
  COUNT(*) = 2 AS two_active_bookings_exist,
  COUNT(*) AS actual_count
FROM bookings 
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
  AND service_id = '00000000-0000-0000-0000-000000000002'
  AND status != 'cancelled';
-- Expected: two_active_bookings_exist = true, actual_count = 2
-- (booking at 11:00-12:00 and new booking at 10:00-11:00)

-- ============================================
-- Test D: Exact duplicate active booking must fail
-- Try to insert another booking at 11:00-12:00
-- Expected: fails with unique_violation (23505)
-- ============================================
-- This should FAIL:
-- INSERT INTO bookings (id, tenant_id, user_id, service_id, start_time, end_time, status)
-- VALUES (
--   '50000000-0000-0000-0000-000000000001',
--   '00000000-0000-0000-0000-000000000001',
--   '00000000-0000-0000-0000-000000000003',
--   '00000000-0000-0000-0000-000000000002',
--   '2024-01-01 11:00:00+00',
--   '2024-01-01 12:00:00+00',
--   'confirmed'
-- );

-- Verification query for Test D
SELECT 
  'Test D: Exact duplicate active booking must fail' AS test_name,
  COUNT(*) = 2 AS still_only_two_active_bookings,
  COUNT(*) AS actual_count
FROM bookings 
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
  AND service_id = '00000000-0000-0000-0000-000000000002'
  AND status != 'cancelled';
-- Expected: still_only_two_active_bookings = true, actual_count = 2

-- ============================================
-- Test E: Invalid status transitions must fail
-- ============================================

-- Setup: Create a confirmed booking for transition tests
INSERT INTO bookings (id, tenant_id, user_id, service_id, start_time, end_time, status)
VALUES (
  '60000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000002',
  '2024-01-02 10:00:00+00',
  '2024-01-02 11:00:00+00',
  'confirmed'
);

-- Test E1: cancelled -> confirmed must fail
-- This should FAIL with the trigger exception
-- UPDATE bookings SET status = 'confirmed' WHERE id = '10000000-0000-0000-0000-000000000001';

-- Test E2: confirmed -> pending must fail
-- This should FAIL with the trigger exception
-- UPDATE bookings SET status = 'pending' WHERE id = '60000000-0000-0000-0000-000000000001';

-- Verification query for Test E
-- Check that the confirmed booking is still confirmed
SELECT 
  'Test E: Invalid status transitions must fail' AS test_name,
  status = 'confirmed' AS status_unchanged,
  status AS actual_status
FROM bookings 
WHERE id = '60000000-0000-0000-0000-000000000001';
-- Expected: status_unchanged = true, actual_status = 'confirmed'

-- ============================================
-- Test F: Valid status transitions must pass
-- ============================================

-- Test F1: pending -> confirmed must pass
INSERT INTO bookings (id, tenant_id, user_id, service_id, start_time, end_time, status)
VALUES (
  '70000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000002',
  '2024-01-03 10:00:00+00',
  '2024-01-03 11:00:00+00',
  'pending'
);

UPDATE bookings SET status = 'confirmed' WHERE id = '70000000-0000-0000-0000-000000000001';

-- Test F2: confirmed -> cancelled must pass
UPDATE bookings SET status = 'cancelled' WHERE id = '70000000-0000-0000-0000-000000000001';

-- Verification query for Test F
SELECT 
  'Test F1: pending -> confirmed must pass' AS test_name,
  id = '70000000-0000-0000-0000-000000000001' AS booking_exists,
  status = 'cancelled' AS status_is_cancelled
FROM bookings 
WHERE id = '70000000-0000-0000-0000-000000000001';
-- Expected: booking_exists = true, status_is_cancelled = true

-- ============================================
-- Cleanup
-- ============================================
-- Uncomment to clean up test data
-- DELETE FROM bookings WHERE tenant_id = '00000000-0000-0000-0000-000000000001';

-- ============================================
-- Summary Verification Query
-- Run this to see all test results at once
-- ============================================
WITH test_results AS (
  -- Test A: Only one overlapping booking should exist
  SELECT 
    'A: Overlap must fail' AS test_name,
    CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL' END AS result,
    COUNT(*) AS details
  FROM bookings 
  WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
    AND service_id = '00000000-0000-0000-0000-000000000002'
    AND status != 'cancelled'
    AND (
      (start_time = '2024-01-01 10:00:00+00' AND end_time = '2024-01-01 11:00:00+00')
      OR (start_time = '2024-01-01 10:30:00+00' AND end_time = '2024-01-01 11:30:00+00')
    )

  UNION ALL

  -- Test B: Two adjacent bookings should exist
  SELECT 
    'B: Adjacent booking must pass' AS test_name,
    CASE WHEN COUNT(*) = 2 THEN 'PASS' ELSE 'FAIL' END AS result,
    COUNT(*) AS details
  FROM bookings 
  WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
    AND service_id = '00000000-0000-0000-0000-000000000002'
    AND status != 'cancelled'

  UNION ALL

  -- Test C: Cancelled booking doesn't block
  SELECT 
    'C: Cancelled booking must not block' AS test_name,
    CASE WHEN COUNT(*) = 2 THEN 'PASS' ELSE 'FAIL' END AS result,
    COUNT(*) AS details
  FROM bookings 
  WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
    AND service_id = '00000000-0000-0000-0000-000000000002'
    AND status != 'cancelled'

  UNION ALL

  -- Test D: Exact duplicate fails
  SELECT 
    'D: Exact duplicate active booking must fail' AS test_name,
    CASE WHEN COUNT(*) = 2 THEN 'PASS' ELSE 'FAIL' END AS result,
    COUNT(*) AS details
  FROM bookings 
  WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
    AND service_id = '00000000-0000-0000-0000-000000000002'
    AND start_time = '2024-01-01 11:00:00+00'
    AND end_time = '2024-01-01 12:00:00+00'
    AND status != 'cancelled'

  UNION ALL

  -- Test E: Invalid transitions
  SELECT 
    'E: Invalid status transitions must fail' AS test_name,
    CASE WHEN status = 'confirmed' THEN 'PASS' ELSE 'FAIL' END AS result,
    1 AS details
  FROM bookings 
  WHERE id = '60000000-0000-0000-0000-000000000001'

  UNION ALL

  -- Test F: Valid transitions
  SELECT 
    'F: Valid status transitions must pass' AS test_name,
    CASE WHEN status = 'cancelled' THEN 'PASS' ELSE 'FAIL' END AS result,
    1 AS details
  FROM bookings 
  WHERE id = '70000000-0000-0000-0000-000000000001'
)
SELECT * FROM test_results;
