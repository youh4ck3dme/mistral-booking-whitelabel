'use client';

import type { CSSProperties, MouseEvent } from 'react';
import { useCallback, useMemo } from 'react';
import type { TimeSlot } from './calendar.utils';
import {
  filterPastSlots,
  formatDate,
  generateTimeSlotsForDate,
  getNextAvailableSlot,
  markBookedSlots,
  TimeSlot as TimeSlotType,
} from './calendar.utils';

// ============================================================================
// Types
// ============================================================================

interface TimeSlotPickerProps {
  /** Selected date (YYYY-MM-DD format) */
  selectedDate: string;
  /** Service duration in minutes */
  serviceDuration: number;
  /** Operating hours */
  operatingHours?: { start: string; end: string };
  /** Booked time ranges for this date */
  bookedSlots?: { start_time: string; end_time: string }[];
  /** Selected time slot (startTime-endTime format, e.g., "10:00-11:00") */
  selectedTime: string | null;
  /** Callback when a time slot is selected */
  onTimeSelect: (timeSlot: { startTime: string; endTime: string; display: string }) => void;
  /** Primary color for styling */
  primaryColor?: string;
  /** Disable past slots for today */
  disablePastSlots?: boolean;
  /** Show next available slot helper */
  showNextAvailable?: boolean;
  /** Max slots to show (for mobile) */
  maxSlots?: number;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_OPERATING_HOURS = { start: '09:00:00', end: '17:00:00' };

// ============================================================================
// Component
// ============================================================================

export function TimeSlotPicker({
  selectedDate,
  serviceDuration,
  operatingHours = DEFAULT_OPERATING_HOURS,
  bookedSlots = [],
  selectedTime,
  onTimeSelect,
  primaryColor = '#3B82F6',
  disablePastSlots = true,
  showNextAvailable = true,
  maxSlots,
}: TimeSlotPickerProps) {
  // Generate time slots for the selected date
  const allSlots: TimeSlotType[] = useMemo(() => {
    return generateTimeSlotsForDate(
      selectedDate,
      serviceDuration,
      operatingHours
    );
  }, [selectedDate, serviceDuration, operatingHours]);

  // Mark booked slots as unavailable
  const slotsWithAvailability: TimeSlotType[] = useMemo(() => {
    let slots = markBookedSlots(allSlots, selectedDate, bookedSlots);
    
    if (disablePastSlots) {
      slots = filterPastSlots(slots);
    }
    
    return slots;
  }, [allSlots, selectedDate, bookedSlots, disablePastSlots]);

  // Get available slots only
  const availableSlots = useMemo(() => {
    return slotsWithAvailability.filter(slot => slot.isAvailable && !slot.isPast);
  }, [slotsWithAvailability]);

  // Get next available slot
  const nextAvailableSlot = useMemo(() => {
    return showNextAvailable ? getNextAvailableSlot(availableSlots) : null;
  }, [availableSlots, showNextAvailable]);

  // Handle slot selection
  const handleSlotSelect = useCallback((
    slot: TimeSlotType,
    event: MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (!slot.isAvailable || slot.isPast) {
      return;
    }
    
    onTimeSelect({
      startTime: slot.startTime,
      endTime: slot.endTime,
      display: `${slot.startTime}-${slot.endTime}`,
    });
  }, [onTimeSelect]);

  // Check if slot is selected
  const isSlotSelected = useCallback((slot: TimeSlotType): boolean => {
    if (!selectedTime) return false;
    return selectedTime === `${slot.startTime}-${slot.endTime}`;
  }, [selectedTime]);

  // Render a single time slot
  const renderSlot = useCallback((slot: TimeSlotType) => {
    const isSelected = isSlotSelected(slot);
    const isAvailable = slot.isAvailable && !slot.isPast;
    const isNextAvailable = nextAvailableSlot && 
      slot.startTime === nextAvailableSlot.startTime &&
      slot.endTime === nextAvailableSlot.endTime;
    
    return (
      <button
        key={`${slot.startTime}-${slot.endTime}`}
        type="button"
        className={`booking-time-slot ${
          isSelected ? 'booking-time-slot--selected' : ''
        } ${
          !isAvailable ? 'booking-time-slot--unavailable' : ''
        } ${
          isNextAvailable ? 'booking-time-slot--next-available' : ''
        }`}
        onClick={(e) => handleSlotSelect(slot, e)}
        disabled={!isAvailable}
        aria-label={`Vybrať čas od ${slot.startTime} do ${slot.endTime}`}
        title={!isAvailable ? 'Toto časové úseku je obsadené' : isNextAvailable ? 'Nasledujúci dostupný termín' : undefined}
        style={{
          '--primary-color': primaryColor,
        } as CSSProperties}
      >
        <span className="booking-time-slot-time">{slot.startTime}</span>
        <span className="booking-time-slot-separator">-</span>
        <span className="booking-time-slot-time">{slot.endTime}</span>
        {isNextAvailable && (
          <span className="booking-time-slot-badge">Dostupné</span>
        )}
      </button>
    );
  }, [isSlotSelected, handleSlotSelect, nextAvailableSlot, primaryColor]);

  // Apply maxSlots limit for mobile
  const displaySlots = useMemo(() => {
    if (!maxSlots || slotsWithAvailability.length <= maxSlots) {
      return slotsWithAvailability;
    }
    return slotsWithAvailability.slice(0, maxSlots);
  }, [maxSlots, slotsWithAvailability]);

  // Check if there are more slots to show
  const hasMoreSlots = useMemo(() => {
    return maxSlots && slotsWithAvailability.length > maxSlots;
  }, [maxSlots, slotsWithAvailability]);

  // Calculate booking density message
  const getDensityMessage = useCallback(() => {
    const totalSlots = slotsWithAvailability.length;
    const availableCount = availableSlots.length;
    const bookedCount = totalSlots - availableSlots.length;
    
    if (bookedCount === 0) {
      return `${availableCount} dostupných termínov`;
    }
    if (availableCount === 0) {
      return 'Žiadne dostupné termíny';
    }
    return `${availableCount} dostupných z ${totalSlots}`;
  }, [slotsWithAvailability, availableSlots]);

  return (
    <div className="booking-time-slot-picker" style={{ '--primary-color': primaryColor } as CSSProperties}>
      {showNextAvailable && nextAvailableSlot && availableSlots.length > 0 && (
        <div className="booking-time-slot-picker-next">
          <span className="booking-time-slot-picker-label">Nasledujúci dostupný:</span>
          <span className="booking-time-slot-picker-next-time">
            {nextAvailableSlot.startTime}-{nextAvailableSlot.endTime}
          </span>
        </div>
      )}
      
      <div className="booking-time-slot-picker-grid">
        {displaySlots.map(renderSlot)}
      </div>
      
      {hasMoreSlots && maxSlots && (
        <div className="booking-time-slot-picker-more">
          +{slotsWithAvailability.length - maxSlots} ďalších termínov
        </div>
      )}
      
      <div className="booking-time-slot-picker-status">
        {getDensityMessage()}
      </div>
    </div>
  );
}

// ============================================================================
// Styles
// ============================================================================

export const timeSlotPickerStyles = `
  .booking-time-slot-picker {
    --primary-color: #3B82F6;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .booking-time-slot-picker-next {
    background-color: rgba(59, 130, 246, 0.1);
    border: 1px solid var(--primary-color);
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    margin-bottom: 0.75rem;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .booking-time-slot-picker-label {
    color: #666;
    font-size: 0.875rem;
  }

  .booking-time-slot-picker-next-time {
    font-weight: 600;
    color: var(--primary-color);
  }

  .booking-time-slot-picker-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.5rem;
  }

  .booking-time-slot {
    background: #fff;
    border: 2px solid #e5e7eb;
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    position: relative;
    overflow: hidden;
  }

  .booking-time-slot:hover:not(:disabled) {
    border-color: var(--primary-color);
    background-color: rgba(59, 130, 246, 0.05);
  }

  .booking-time-slot:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .booking-time-slot--selected {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
    color: white;
  }

  .booking-time-slot--selected:hover {
    background-color: var(--primary-color);
  }

  .booking-time-slot--unavailable {
    background-color: #fee2e2;
    border-color: #fecaca;
    color: #991b1b;
  }

  .booking-time-slot--unavailable:hover {
    background-color: #fee2e2;
    border-color: #fecaca;
  }

  .booking-time-slot--next-available {
    /* Already highlighted via badge */
  }

  .booking-time-slot-time {
    line-height: 1;
  }

  .booking-time-slot-separator {
    color: inherit;
    opacity: 0.7;
  }

  .booking-time-slot-badge {
    position: absolute;
    top: 4px;
    right: 4px;
    background-color: var(--primary-color);
    color: white;
    font-size: 0.625rem;
    font-weight: 600;
    padding: 0.125rem 0.375rem;
    border-radius: 9999px;
  }

  /* For selected slot, badge should be visible */
  .booking-time-slot--selected .booking-time-slot-badge {
    background-color: white;
    color: var(--primary-color);
  }

  .booking-time-slot-picker-more {
    text-align: center;
    padding: 0.75rem 0.5rem;
    color: #666;
    font-size: 0.875rem;
    font-style: italic;
    grid-column: 1 / -1;
  }

  .booking-time-slot-picker-status {
    text-align: center;
    padding: 0.5rem;
    color: #666;
    font-size: 0.75rem;
    margin-top: 0.5rem;
  }

  /* Responsive - single column on mobile */
  @media (max-width: 640px) {
    .booking-time-slot-picker-grid {
      grid-template-columns: 1fr;
    }
    
    .booking-time-slot {
      padding: 0.625rem 1rem;
    }
  }
`;
