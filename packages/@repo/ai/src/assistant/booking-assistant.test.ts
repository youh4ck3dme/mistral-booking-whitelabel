import { describe, expect, it } from 'vitest';
import { computeAvailableSlots } from './booking-assistant';

const DATE = '2026-08-02';

describe('computeAvailableSlots', () => {
  it('generates evenly spaced slots across a single operating window with no bookings', () => {
    const slots = computeAvailableSlots(DATE, 30, [{ start_time: '09:00:00', end_time: '10:00:00' }], []);

    expect(slots).toEqual([`${DATE}T09:00:00.000Z`, `${DATE}T09:30:00.000Z`]);
  });

  it('excludes a slot that overlaps an existing booking', () => {
    const slots = computeAvailableSlots(
      DATE,
      30,
      [{ start_time: '09:00:00', end_time: '10:00:00' }],
      [{ start_time: `${DATE}T09:30:00.000Z`, end_time: `${DATE}T10:00:00.000Z` }]
    );

    expect(slots).toEqual([`${DATE}T09:00:00.000Z`]);
  });

  it('does not block an adjacent slot that only touches a booking boundary', () => {
    // Booking occupies 09:00–09:30 exactly; the 09:30 slot starts right where it ends.
    const slots = computeAvailableSlots(
      DATE,
      30,
      [{ start_time: '09:00:00', end_time: '10:00:00' }],
      [{ start_time: `${DATE}T09:00:00.000Z`, end_time: `${DATE}T09:30:00.000Z` }]
    );

    expect(slots).toEqual([`${DATE}T09:30:00.000Z`]);
  });

  it('does not generate a slot that would run past the end of the operating window', () => {
    // 45-minute service in a 60-minute window: only one slot fits, no partial trailing slot.
    const slots = computeAvailableSlots(DATE, 45, [{ start_time: '09:00:00', end_time: '10:00:00' }], []);

    expect(slots).toEqual([`${DATE}T09:00:00.000Z`]);
  });

  it('generates slots across multiple operating windows independently (e.g. split shift)', () => {
    const slots = computeAvailableSlots(
      DATE,
      60,
      [
        { start_time: '09:00:00', end_time: '11:00:00' },
        { start_time: '14:00:00', end_time: '15:00:00' },
      ],
      []
    );

    expect(slots).toEqual([`${DATE}T09:00:00.000Z`, `${DATE}T10:00:00.000Z`, `${DATE}T14:00:00.000Z`]);
  });

  it('returns an empty array when there are no operating hours configured', () => {
    expect(computeAvailableSlots(DATE, 30, [], [])).toEqual([]);
  });

  it('returns an empty array when a booking fully occupies the only window', () => {
    const slots = computeAvailableSlots(
      DATE,
      30,
      [{ start_time: '09:00:00', end_time: '10:00:00' }],
      [{ start_time: `${DATE}T09:00:00.000Z`, end_time: `${DATE}T10:00:00.000Z` }]
    );

    expect(slots).toEqual([]);
  });
});
