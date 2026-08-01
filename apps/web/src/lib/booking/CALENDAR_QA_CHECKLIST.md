# Booking Calendar QA Checklist

## Overview
This checklist verifies that the clickable booking calendar implementation meets all production requirements for safety, correctness, and user experience.

## Test Environment
- **Browser:** Chrome, Firefox, Safari, Edge
- **Viewport:** Desktop (>1024px), Tablet (768-1024px), Mobile (<768px)
- **Backend:** Local Supabase with booking concurrency hardening applied

---

## 1. Public Booking Calendar

### Service Selection
- [ ] User can see list of available services
- [ ] User can select a service by clicking on it
- [ ] Selected service is highlighted
- [ ] Service details (name, description, price, duration) are displayed
- [ ] Selecting a service enables date selection
- [ ] Empty state shown when no services available

### Date Selection (Calendar)
- [ ] Calendar shows current month by default
- [ ] Calendar displays month name and year
- [ ] Calendar shows days of week (Sun-Sat or Mon-Sun based on locale)
- [ ] Current day is highlighted
- [ ] Past days are disabled and cannot be selected
- [ ] Future days beyond 60 days are disabled (configurable)
- [ ] Clicking a date selects it
- [ ] Selected date is highlighted
- [ ] Calendar shows days from previous/next month for complete weeks
- [ ] Previous/next month navigation works
- [ ] "Today" button returns to current date
- [ ] Calendar is keyboard accessible (Tab, Arrow keys)
- [ ] Calendar shows booking density indicators (count of bookings per day)

### Time Slot Selection
- [ ] Time slots are generated based on service duration
- [ ] Time slots respect operating hours (09:00-17:00 fallback)
- [ ] Available slots are clickable
- [ ] Booked slots are disabled with visual indicator
- [ ] Past slots for today are disabled
- [ ] Selected time slot is highlighted
- [ ] Next available slot is highlighted with badge
- [ ] Slot density message is displayed (e.g., "5 dostupn√Ωch z 8")
- [ ] Mobile layout shows single column of slots
- [ ] Desktop layout shows grid of slots

### Booking Confirmation Flow
- [ ] User can see booking summary before confirmation
- [ ] Summary shows: service, date, time, price, duration
- [ ] Confirm button is enabled when all fields selected
- [ ] Confirm button shows loading state during submission
- [ ] Confirm button is disabled while submitting to prevent double-click
- [ ] User must be authenticated to confirm booking
- [ ] Unauthenticated user is redirected to login, then back to booking after login
- [ ] Booking is created via `create_booking` RPC (NOT direct insert)
- [ ] On success, user sees success message with booking ID
- [ ] On success, booked slots are refreshed automatically
- [ ] On conflict error (slot taken), user sees "This time slot was just booked. Please choose another time."
- [ ] On other errors, user sees appropriate error message

---

## 2. Admin/Tenant Calendar

### Calendar View
- [ ] Admin calendar shows all tenant bookings
- [ ] Calendar displays booking count per day
- [ ] Clicking a date shows bookings for that day
- [ ] Selected date shows booking list
- [ ] Calendar navigation works (prev/next month, today button)
- [ ] Calendar refreshes when date selected

### Bookings List
- [ ] Bookings list shows: time, service, user, status, actions
- [ ] Service name is displayed (or service ID if service deleted)
- [ ] User ID is displayed (truncated)
- [ ] Status is displayed with color coding (green=confirmed, red=cancelled, orange=pending)
- [ ] Cancel button is shown for confirmed/pending bookings
- [ ] Cancelled bookings show "Already cancelled" message

### Booking Cancellation
- [ ] Admin can cancel confirmed bookings
- [ ] Cancellation requires confirmation dialog
- [ ] Cancellation uses `cancel_booking` RPC (NOT direct update)
- [ ] After cancellation, booking status changes to "cancelled"
- [ ] After cancellation, booking list refreshes
- [ ] Cancelled booking cannot be cancelled again
- [ ] Loading state shown during cancellation
- [ ] Error shown if cancellation fails

### Filters
- [ ] Service filter dropdown works
- [ ] Status filter dropdown works
- [ ] Multiple filters can be applied simultaneously
- [ ] Clearing filters shows all bookings
- [ ] Filters update results in real-time

---

## 3. RPC Integration Verification

### create_booking RPC
- [ ] All booking creations go through `create_booking` RPC
- [ ] RPC parameters include: tenant_id, user_id, service_id, start_time, end_time
- [ ] No direct INSERT into bookings table from client
- [ ] RPC validates service belongs to tenant
- [ ] RPC validates service is active
- [ ] RPC validates time slot is within operating hours
- [ ] RPC validates booking duration matches service duration
- [ ] RPC checks for overlapping bookings

### cancel_booking RPC
- [ ] All booking cancellations go through `cancel_booking` RPC
- [ ] RPC parameters include: booking_id, user_id
- [ ] No direct UPDATE to bookings table from client
- [ ] RPC validates booking exists and belongs to user
- [ ] RPC validates booking is not already cancelled
- [ ] RPC updates status to 'cancelled'

### get_booked_slots RPC
- [ ] Booked slots are fetched via `get_booked_slots` RPC
- [ ] RPC parameters include: tenant_id, service_id, date range
- [ ] RPC returns only non-cancelled bookings
- [ ] RPC orders results by start_time
- [ ] Fetched slots are used to disable unavailable time slots

---

## 4. UX States

### Loading States
- [ ] Loading spinner shown while fetching services
- [ ] Loading spinner shown while fetching booked slots
- [ ] Skeleton loading for calendar (optional)
- [ ] Confirm button shows loading text during submission

### Empty States
- [ ] Empty state when no services available
- [ ] Empty state when no dates available for selection
- [ ] Empty state when no time slots available for date
- [ ] Empty state when no bookings for selected date in admin
- [ ] Empty state when no bookings match filters in admin

### Error States
- [ ] Error message shown when service fetch fails
- [ ] Error message shown when slot fetch fails
- [ ] Error message shown when booking creation fails
- [ ] Error message shown when booking cancellation fails
- [ ] Conflict error message is user-friendly
- [ ] Authentication error redirects to login
- [ ] 404 error for non-existent tenant

### Success States
- [ ] Success message shown after booking creation
- [ ] Success message shown after booking cancellation
- [ ] Booking ID displayed after creation
- [ ] Confirmation that email will be sent

### Conflict Recovery
- [ ] If selected slot becomes unavailable while user is selecting, it's disabled
- [ ] If user tries to book unavailable slot, clear error shown
- [ ] User can select different slot after conflict
- [ ] Calendar refreshes after conflict

### Mobile States
- [ ] Calendar fits on mobile screen
- [ ] Time slots show in single column on mobile
- [ ] Buttons are large enough for touch
- [ ] Confirm button is sticky at bottom on mobile (optional)
- [ ] No horizontal scrolling required on mobile

---

## 5. Safety & Correctness

### Database Constraints
- [ ] Two users cannot book same slot (verified by DB EXCLUDE constraint)
- [ ] Adjacent bookings are allowed (09:00-10:00 and 10:00-11:00)
- [ ] Overlapping bookings are prevented (09:00-10:00 and 09:30-10:30)
- [ ] Exact duplicate bookings are prevented
- [ ] Cancelled booking slots can be reused
- [ ] Booking status can only transition: pending -> confirmed, confirmed -> cancelled, pending -> cancelled
- [ ] Cannot reactivate cancelled bookings
- [ ] Direct client UPDATE on bookings table is denied by RLS

### Frontend Validation
- [ ] Past dates cannot be selected
- [ ] Past time slots for today cannot be selected
- [ ] Booked slots cannot be selected
- [ ] User must select service before date
- [ ] User must select date before time
- [ ] User must be authenticated to create booking
- [ ] User cannot book service from another tenant

### Security
- [ ] No `service_role` key exposed in client
- [ ] No `NEXT_PUBLIC_*` secrets for sensitive data
- [ ] All Supabase clients use `createClientComponentClient()` or `createServiceRoleClient()`
- [ ] Tenant ID is always scoped in queries
- [ ] User can only access their own tenant's data (RLS)
- [ ] Public users can only view active services (RLS)

---

## 6. Automated Tests

### Unit Tests (vitest)
- [ ] `generateCalendarMonth` generates correct calendar structure
- [ ] `formatDate` formats dates correctly
- [ ] `isSameDay` checks correctly
- [ ] `timeToMinutes` and `minutesToTime` convert correctly
- [ ] `generateTimeSlotsForDate` generates correct slots based on duration
- [ ] `generateTimeSlotsForDate` marks past slots correctly for today
- [ ] `isSlotAvailable` returns true for available slots
- [ ] `isSlotAvailable` returns false for overlapping slots
- [ ] `isSlotAvailable` returns false for exact duplicates
- [ ] `isSlotAvailable` returns true for adjacent slots
- [ ] `markBookedSlots` marks slots correctly
- [ ] `filterPastSlots` filters past slots
- [ ] `getNextAvailableSlot` returns first available slot
- [ ] `getBookingErrorMessage` returns user-friendly messages
- [ ] `isConflictError` identifies conflict errors

### E2E Tests (Cypress)
- [ ] User can navigate to tenant booking page
- [ ] User can see available services
- [ ] User can select service
- [ ] User can select date from calendar
- [ ] User can select time slot
- [ ] User can see booking summary
- [ ] User must login to create booking
- [ ] User can create booking successfully
- [ ] User sees success message after booking
- [ ] User cannot book already booked slot
- [ ] User can see booking in portal after creation
- [ ] User can cancel booking from portal
- [ ] Admin can see calendar in dashboard
- [ ] Admin can see bookings for date
- [ ] Admin can filter bookings by service
- [ ] Admin can filter bookings by status
- [ ] Admin can cancel booking
- [ ] Admin sees updated status after cancellation

---

## 7. Manual QA Steps

### Step 1: Service Selection
1. Navigate to `/demo-clinic/book` (or any tenant)
2. Verify services are displayed
3. Click on a service
4. Verify service is selected and highlighted
5. Verify date selection becomes available

### Step 2: Date Selection
1. With service selected, verify calendar is visible
2. Verify current month is shown
3. Verify current day is highlighted
4. Verify past days are disabled
5. Click on today's date
6. Verify date is selected
7. Click on a future date
8. Verify date selection changes
9. Click on a day with existing bookings
10. Verify booking count indicator is shown

### Step 3: Time Slot Selection
1. With date selected, verify time slots are displayed
2. Verify slots respect service duration
3. Verify some slots are marked as booked (if applicable)
4. Click on an available slot
5. Verify slot is selected
6. Verify next available slot badge is shown
7. Try to click on a booked slot
8. Verify nothing happens (slot remains unselected)

### Step 4: Booking Creation
1. With service, date, and time selected, verify summary is shown
2. Verify all details are correct
3. Click "Confirm Booking"
4. If not logged in, verify redirect to login
5. If logged in, verify loading state
6. Verify booking is created successfully
7. Verify success message is shown
8. Verify booking ID is displayed

### Step 5: Conflict Handling
1. Create a booking for a specific slot
2. In another browser/incognito, try to book the same slot
3. Verify first user can book successfully
4. Verify second user sees error message
5. Verify second user can select different slot

### Step 6: Adjacent Slots
1. Book a slot (e.g., 10:00-11:00)
2. Try to book adjacent slot (11:00-12:00)
3. Verify adjacent slot can be booked (no overlap)
4. Refresh page
5. Verify both slots are now booked

### Step 7: Cancelled Slots
1. As admin, cancel a booking
2. Refresh public booking page
3. Try to book the newly available slot
4. Verify slot can be booked

### Step 8: Admin Calendar
1. Navigate to `/demo-clinic/admin`
2. Go to Bookings tab
3. Verify calendar is displayed
4. Click on a date with bookings
5. Verify bookings list is shown
6. Verify service filter works
7. Verify status filter works
8. Cancel a booking
9. Verify status changes to cancelled
10. Refresh page
11. Verify change persists

### Step 9: Mobile Testing
1. Open browser dev tools
2. Set viewport to iPhone SE (375x667)
3. Navigate to booking page
4. Verify calendar is usable
5. Verify time slots show in single column
6. Verify buttons are large enough
7. Verify can complete booking flow

### Step 10: Console Errors
1. Open browser dev tools
2. Go to Console tab
3. Navigate through entire booking flow
4. Verify no errors or warnings (except expected ones)
5. Verify no 404 network errors

---

## 8. Performance Checklist

- [ ] Calendar renders within 500ms
- [ ] Booked slots fetch within 1s
- [ ] Time slot generation is instant (<100ms)
- [ ] Booking creation completes within 2s
- [ ] No memory leaks (check for event listeners cleanup)

---

## 9. Accessibility Checklist

- [ ] All interactive elements are keyboard accessible
- [ ] Calendar navigation works with keyboard
- [ ] Date selection works with keyboard
- [ ] Time slot selection works with keyboard
- [ ] Buttons have appropriate ARIA labels
- [ ] Loading states have ARIA live regions
- [ ] Error messages are announced to screen readers
- [ ] Color contrast meets WCAG 2.1 AA standards
- [ ] Focus indicators are visible

---

## 10. Final Sign-off

**Tester Name:** ________________________

**Date:** ________________________

**Browser/Version:** ________________________

**All tests passed:** [ ] Yes [ ] No

**Issues found:** ________________________

**Notes:** ________________________
