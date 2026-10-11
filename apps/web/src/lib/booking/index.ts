// Booking module exports
// Re-exports all booking-related utilities, components, and services

export {
  // Services
  getServicesByTenant,
  getServiceById,
  getTimeSlotsConfig,
  createBooking,
  getBookingsByUser,
  cancelBooking,
  generateTimeSlots,
  type BookingSlot,
  type TimeSlot,
} from './booking.service';

export {
  // Calendar utilities
  generateCalendarMonth,
  getCurrentMonthAndYear,
  getNextMonth,
  getPreviousMonth,
  getDaysInMonth,
  formatDate,
  formatDateDisplay,
  formatDateShort,
  isSameDay,
  isToday,
  isPastDate,
  isFutureDate,
  timeToMinutes,
  minutesToTime,
  generateTimeSlotsForDate,
  getNextAvailableSlot,
  markBookedSlots,
  filterPastSlots,
  getBookingErrorMessage,
  isConflictError,
  MONTH_NAMES,
  MONTH_NAMES_SK,
  DAY_NAMES_SHORT,
  DAY_NAMES_SHORT_SK,
  type CalendarDay,
  type CalendarWeek,
  type CalendarMonth,
  type BookedSlotRange,
} from './calendar.utils';

export {
  // Components
  Calendar,
  calendarStyles,
} from './Calendar';

export {
  TimeSlotPicker,
  timeSlotPickerStyles,
} from './TimeSlotPicker';

export {
  AdminCalendar,
  adminCalendarStyles,
} from './AdminCalendar';
