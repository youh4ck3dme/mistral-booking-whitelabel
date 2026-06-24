'use client';

import type { CSSProperties, MouseEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';
import type {
  CalendarDay,
  CalendarMonth,
  CalendarWeek,
  TimeSlot,
} from './calendar.utils';
import {
  DAY_NAMES_SHORT_SK,
  formatDate,
  generateCalendarMonth,
  getCurrentMonthAndYear,
  getNextMonth,
  getPreviousMonth,
  isSameDay,
  MONTH_NAMES_SK,
} from './calendar.utils';

// ============================================================================
// Types
// ============================================================================

interface CalendarProps {
  /** Selected date (YYYY-MM-DD format) */
  selectedDate: string | null;
  /** Callback when a date is selected */
  onDateSelect: (date: string) => void;
  /** Operating hours for the tenant/service */
  operatingHours?: { start: string; end: string };
  /** Service duration in minutes */
  serviceDuration?: number;
  /** Booked slots for the selected month - map of date string to booked time ranges */
  bookedSlotsByDate?: Record<string, { start_time: string; end_time: string }[]>;
  /** Primary color for styling */
  primaryColor?: string;
  /** Disable past dates */
  disablePastDates?: boolean;
  /** Disable future dates beyond this many days */
  maxFutureDays?: number;
  /** Locale for date formatting */
  locale?: string;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_OPERATING_HOURS = { start: '09:00:00', end: '17:00:00' };
const DEFAULT_SERVICE_DURATION = 60; // minutes

// ============================================================================
// Component
// ============================================================================

export function Calendar({
  selectedDate,
  onDateSelect,
  operatingHours = DEFAULT_OPERATING_HOURS,
  serviceDuration = DEFAULT_SERVICE_DURATION,
  bookedSlotsByDate = {},
  primaryColor = '#3B82F6',
  disablePastDates = true,
  maxFutureDays = 60,
  locale = 'sk-SK',
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => getCurrentMonthAndYear());
  
  // Generate calendar month
  const calendarMonth: CalendarMonth = useMemo(() => {
    return generateCalendarMonth(currentMonth.year, currentMonth.month);
  }, [currentMonth.year, currentMonth.month]);

  // Handle previous month navigation
  const handlePrevMonth = useCallback(() => {
    setCurrentMonth(getPreviousMonth(currentMonth.month, currentMonth.year));
  }, [currentMonth]);

  // Handle next month navigation
  const handleNextMonth = useCallback(() => {
    setCurrentMonth(getNextMonth(currentMonth.month, currentMonth.year));
  }, [currentMonth]);

  // Handle today button
  const handleToday = useCallback(() => {
    setCurrentMonth(getCurrentMonthAndYear());
    const today = new Date();
    onDateSelect(formatDate(today));
  }, [onDateSelect]);

  // Check if a date is selectable
  const isDateSelectable = useCallback((date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if past
    if (disablePastDates && date < today) {
      return false;
    }
    
    // Check if too far in future
    if (maxFutureDays) {
      const maxFuture = new Date(today);
      maxFuture.setDate(maxFuture.getDate() + maxFutureDays);
      if (date > maxFuture) {
        return false;
      }
    }
    
    return true;
  }, [disablePastDates, maxFutureDays]);

  // Check if a date has any booked slots
  const hasBookedSlots = useCallback((dateString: string): boolean => {
    return bookedSlotsByDate[dateString]?.length > 0;
  }, [bookedSlotsByDate]);

  // Get number of bookings for a date (for density indicator)
  const getBookingCount = useCallback((dateString: string): number => {
    return bookedSlotsByDate[dateString]?.length || 0;
  }, [bookedSlotsByDate]);

  // Handle date click
  const handleDateClick = useCallback((
    day: CalendarDay,
    event: MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (!isDateSelectable(day.date)) {
      return;
    }
    
    onDateSelect(day.dateString);
  }, [isDateSelectable, onDateSelect]);

  // Check if date is selected
  const isDateSelected = useCallback((day: CalendarDay): boolean => {
    if (!selectedDate) return false;
    const selected = new Date(selectedDate);
    return isSameDay(day.date, selected);
  }, [selectedDate]);

  // Check if date is today
  const isDateToday = useCallback((day: CalendarDay): boolean => {
    return day.isToday;
  }, []);

  // Get day class names
  const getDayClassName = useCallback((day: CalendarDay): string => {
    const baseClass = 'booking-calendar-day';
    const classes: string[] = [baseClass];
    
    if (!day.isCurrentMonth) {
      classes.push('booking-calendar-day--other-month');
    }
    
    if (!isDateSelectable(day.date)) {
      classes.push('booking-calendar-day--disabled');
    }
    
    if (isDateSelected(day)) {
      classes.push('booking-calendar-day--selected');
    }
    
    if (isDateToday(day)) {
      classes.push('booking-calendar-day--today');
    }
    
    if (hasBookedSlots(day.dateString)) {
      classes.push('booking-calendar-day--has-bookings');
    }
    
    return classes.join(' ');
  }, [isDateSelectable, isDateSelected, isDateToday, hasBookedSlots]);

  // Render day cell
  const renderDay = useCallback((day: CalendarDay) => {
    const isSelectable = isDateSelectable(day.date);
    const bookingCount = getBookingCount(day.dateString);
    
    return (
      <button
        key={day.dateString}
        type="button"
        className={getDayClassName(day)}
        onClick={(e) => handleDateClick(day, e)}
        disabled={!isSelectable}
        aria-label={day.date.toLocaleDateString(locale, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
        style={{
          '--primary-color': primaryColor,
        } as CSSProperties}
      >
        <span className="booking-calendar-day-number">{day.dayOfMonth}</span>
        {bookingCount > 0 && (
          <span className="booking-calendar-day-bookings" title={`${bookingCount} rezervácia${bookingCount > 1 ? 'i' : ''}`}>
            {bookingCount}
          </span>
        )}
      </button>
    );
  }, [getDayClassName, isDateSelectable, handleDateClick, isDateSelected, getBookingCount, primaryColor, locale]);

  // Render week header
  const renderWeekHeader = useCallback(() => {
    return (
      <thead className="booking-calendar-header">
        <tr>
          {DAY_NAMES_SHORT_SK.map((dayName) => (
            <th key={dayName} className="booking-calendar-weekday">
              {dayName}
            </th>
          ))}
        </tr>
      </thead>
    );
  }, []);

  // Render calendar grid
  const renderCalendarGrid = useCallback(() => {
    return (
      <tbody className="booking-calendar-body">
        {calendarMonth.weeks.map((week: CalendarWeek) => (
          <tr key={`week-${week.weekNumber}`} className="booking-calendar-week">
            {week.days.map((day: CalendarDay) => (
              <td key={day.dateString} className="booking-calendar-cell">
                {renderDay(day)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    );
  }, [calendarMonth, renderDay]);

  return (
    <div className="booking-calendar" style={{ '--primary-color': primaryColor } as CSSProperties}>
      <div className="booking-calendar-header-bar">
        <div className="booking-calendar-navigation">
          <button
            type="button"
            className="booking-calendar-nav-button"
            onClick={handlePrevMonth}
            aria-label="Predchádzajúci mesiac"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18L9 12L15 6" />
            </svg>
          </button>
          
          <span className="booking-calendar-month-label">
            {MONTH_NAMES_SK[currentMonth.month]} {currentMonth.year}
          </span>
          
          <button
            type="button"
            className="booking-calendar-nav-button"
            onClick={handleNextMonth}
            aria-label="Ďalší mesiac"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18L15 12L9 6" />
            </svg>
          </button>
        </div>
        
        <button
          type="button"
          className="booking-calendar-today-button premium-button-secondary"
          onClick={handleToday}
        >
          Dnes
        </button>
      </div>
      
      <table className="booking-calendar-grid">
        {renderWeekHeader()}
        {renderCalendarGrid()}
      </table>
    </div>
  );
}

// ============================================================================
// Styles (CSS-in-JS for simplicity, can be moved to separate CSS file)
// ============================================================================

// These styles are applied via className in the component above
// In production, consider moving to a separate CSS file or CSS modules

export const calendarStyles = `
  .booking-calendar {
    --primary-color: #3B82F6;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 100%;
    overflow: hidden;
  }

  .booking-calendar-header-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .booking-calendar-navigation {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .booking-calendar-month-label {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--primary-color);
  }

  .booking-calendar-nav-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    color: var(--primary-color);
    border-radius: 4px;
    transition: background-color 0.2s;
  }

  .booking-calendar-nav-button:hover {
    background-color: rgba(59, 130, 246, 0.1);
  }

  .booking-calendar-today-button {
    font-size: 0.875rem;
    padding: 0.5rem 1rem;
  }

  .booking-calendar-grid {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }

  .booking-calendar-header {
    background: none;
  }

  .booking-calendar-weekday {
    text-align: center;
    padding: 0.75rem 0;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    color: #666;
    border-bottom: 1px solid #e5e7eb;
  }

  .booking-calendar-body {
    background: none;
  }

  .booking-calendar-week {
    border-bottom: none;
  }

  .booking-calendar-cell {
    padding: 0.25rem;
    vertical-align: top;
    height: 44px;
  }

  .booking-calendar-day {
    width: 100%;
    height: 100%;
    border: none;
    background: none;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    color: #374151;
    position: relative;
  }

  .booking-calendar-day:hover:not(:disabled) {
    background-color: rgba(59, 130, 246, 0.1);
  }

  .booking-calendar-day:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .booking-calendar-day--other-month {
    color: #9ca3af;
  }

  .booking-calendar-day--today {
    font-weight: 600;
    color: var(--primary-color);
  }

  .booking-calendar-day--selected {
    background-color: var(--primary-color);
    color: white;
  }

  .booking-calendar-day--selected:hover {
    background-color: var(--primary-color);
  }

  .booking-calendar-day--has-bookings {
    /* Indicates there are existing bookings */
  }

  .booking-calendar-day-number {
    line-height: 1;
  }

  .booking-calendar-day-bookings {
    position: absolute;
    top: 2px;
    right: 2px;
    background-color: var(--primary-color);
    color: white;
    font-size: 0.625rem;
    font-weight: 600;
    padding: 0.125rem 0.25rem;
    border-radius: 9999px;
    min-width: 14px;
    height: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Selected day with bookings - white text on primary background */
  .booking-calendar-day--selected .booking-calendar-day-bookings {
    background-color: white;
    color: var(--primary-color);
  }

  /* Disabled day */
  .booking-calendar-day--disabled .booking-calendar-day-bookings {
    background-color: #d1d5db;
    color: white;
  }
`;
