'use client';

import type { Booking, Service } from '@repo/core';
import { useCallback, useMemo, useState } from 'react';
import type { CalendarDay, CalendarMonth } from './calendar.utils';
import {
  generateCalendarMonth,
  getCurrentMonthAndYear,
  getNextMonth,
  getPreviousMonth,
  formatDate,
  isSameDay,
  MONTH_NAMES_SK,
  DAY_NAMES_SHORT_SK,
} from './calendar.utils';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useNotifications } from '@repo/web/app/notifications-provider';
import { cancelBooking } from './booking.service';

// ============================================================================
// Types
// ============================================================================

interface AdminCalendarProps {
  tenantId: string;
  services: Service[];
  bookings: Booking[];
  primaryColor?: string;
}

interface BookingWithService extends Booking {
  service?: Service | null;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_PRIMARY_COLOR = '#3B82F6';

// ============================================================================
// Component
// ============================================================================

export function AdminCalendar({
  tenantId,
  services,
  bookings: initialBookings,
  primaryColor = DEFAULT_PRIMARY_COLOR,
}: AdminCalendarProps) {
  const supabase = createClientComponentClient();
  const { notifyError, notifySuccess, notifyInfo } = useNotifications();
  
  const [currentMonth, setCurrentMonth] = useState(() => getCurrentMonthAndYear());
  const [bookings, setBookings] = useState<BookingWithService[]>(initialBookings);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Generate calendar month
  const calendarMonth: CalendarMonth = useMemo(() => {
    return generateCalendarMonth(currentMonth.year, currentMonth.month);
  }, [currentMonth.year, currentMonth.month]);

  // Group bookings by date
  const bookingsByDate = useMemo(() => {
    const grouped: Record<string, BookingWithService[]> = {};
    bookings.forEach((booking) => {
      const dateKey = new Date(booking.start_time).toISOString().split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(booking);
    });
    return grouped;
  }, [bookings]);

  // Get bookings for selected date
  const selectedDateBookings = useMemo(() => {
    if (!selectedDate) return [];
    return bookingsByDate[selectedDate] || [];
  }, [selectedDate, bookingsByDate]);

  // Filter bookings by service and status
  const filteredBookings = useMemo(() => {
    let result = bookings;
    
    if (selectedServiceId) {
      result = result.filter(b => b.service_id === selectedServiceId);
    }
    
    if (selectedStatus) {
      result = result.filter(b => b.status === selectedStatus);
    }
    
    if (selectedDate) {
      const dateKey = selectedDate;
      result = result.filter(b => {
        const bookingDate = new Date(b.start_time).toISOString().split('T')[0];
        return bookingDate === dateKey;
      });
    }
    
    return result;
  }, [bookings, selectedServiceId, selectedStatus, selectedDate]);

  // Navigation handlers
  const handlePrevMonth = useCallback(() => {
    setCurrentMonth(getPreviousMonth(currentMonth.month, currentMonth.year));
  }, [currentMonth]);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth(getNextMonth(currentMonth.month, currentMonth.year));
  }, [currentMonth]);

  const handleToday = useCallback(() => {
    setCurrentMonth(getCurrentMonthAndYear());
    const today = formatDate(new Date());
    setSelectedDate(today);
  }, []);

  const handleDateSelect = useCallback((date: string) => {
    setSelectedDate(prev => prev === date ? null : date);
  }, []);

  const handleServiceFilter = useCallback((serviceId: string | null) => {
    setSelectedServiceId(serviceId);
  }, []);

  const handleStatusFilter = useCallback((status: string | null) => {
    setSelectedStatus(status);
  }, []);

  // Refresh bookings
  const refreshBookings = useCallback(async () => {
    try {
      setRefreshing(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('*, service:services(name, price, duration)')
        .eq('tenant_id', tenantId)
        .order('start_time', { ascending: false });
      
      if (error) throw error;
      setBookings((data || []) as BookingWithService[]);
      notifySuccess('Aktualizované', 'Rezervácie boli úspešne obnovené.');
    } catch (err: any) {
      console.error('Failed to refresh bookings:', err);
      notifyError('Chyba', 'Nepodarilo sa obnoviť rezervácie.');
    } finally {
      setRefreshing(false);
    }
  }, [tenantId, notifyError, notifySuccess]);

  // Cancel booking using RPC
  const handleCancelBooking = useCallback(async (bookingId: string) => {
    if (!confirm('Naozaj chcete zrušiť túto rezerváciu?')) {
      return;
    }
    
    try {
      setCancellingId(bookingId);
      setIsLoading(true);
      
      // Call cancel_booking RPC - DO NOT use direct update
      // RPC uses auth.uid() internally - never trust client-supplied user_id
      const success = await cancelBooking(bookingId);
      
      if (success) {
        await refreshBookings();
        notifySuccess('Zrušené', 'Rezervácia bola úspešne zrušená.');
      } else {
        notifyError('Chyba', 'Nepodarilo sa zrušiť rezerváciu.');
      }
    } catch (err: any) {
      console.error('Failed to cancel booking:', err);
      notifyError('Chyba', err.message || 'Nepodarilo sa zrušiť rezerváciu.');
    } finally {
      setCancellingId(null);
      setIsLoading(false);
    }
  }, [refreshBookings, notifyError, notifySuccess]);

  // Get booking count for a date
  const getBookingCountForDate = useCallback((date: string): number => {
    return bookingsByDate[date]?.length || 0;
  }, [bookingsByDate]);

  // Check if date is selected
  const isDateSelected = useCallback((day: CalendarDay): boolean => {
    if (!selectedDate) return false;
    return day.dateString === selectedDate;
  }, [selectedDate]);

  // Check if date is today
  const isDateToday = useCallback((day: CalendarDay): boolean => {
    return day.isToday;
  }, []);

  // Get booking density color
  const getDensityColor = useCallback((count: number): string => {
    if (count === 0) return 'transparent';
    if (count === 1) return 'rgba(59, 130, 246, 0.2)';
    if (count === 2) return 'rgba(59, 130, 246, 0.4)';
    if (count >= 3) return 'rgba(59, 130, 246, 0.7)';
    return 'rgba(59, 130, 246, 0.2)';
  }, []);

  // Format time for display
  const formatTime = useCallback((dateString: string): string => {
    return new Date(dateString).toLocaleTimeString('sk-SK', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  // Format status for display
  const formatStatus = useCallback((status: string): string => {
    const statusMap: Record<string, string> = {
      confirmed: 'Potvrdená',
      cancelled: 'Zrušená',
      pending: 'Čaká na potvrdenie',
    };
    return statusMap[status] || status;
  }, []);

  // Get status color
  const getStatusColor = useCallback((status: string): string => {
    switch (status) {
      case 'confirmed':
        return '#10b981';
      case 'cancelled':
        return '#ef4444';
      case 'pending':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  }, []);

  // Render day cell
  const renderDay = useCallback((day: CalendarDay) => {
    const dateString = day.dateString;
    const count = getBookingCountForDate(dateString);
    const isSelected = isDateSelected(day);
    const isToday = isDateToday(day);
    const densityColor = getDensityColor(count);
    
    return (
      <button
        key={dateString}
        type="button"
        className={`admin-calendar-day ${
          isSelected ? 'admin-calendar-day--selected' : ''
        } ${
          isToday ? 'admin-calendar-day--today' : ''
        }`}
        onClick={() => handleDateSelect(dateString)}
        style={{
          '--primary-color': primaryColor,
          '--density-color': densityColor,
        } as CSSProperties}
        title={`${day.date.toLocaleDateString('sk-SK')} - ${count} rezervácia${count !== 1 ? 'i' : ''}`}
      >
        <span className="admin-calendar-day-number">{day.dayOfMonth}</span>
        {count > 0 && (
          <span className="admin-calendar-day-count" style={{ backgroundColor: primaryColor }}>
            {count}
          </span>
        )}
        {isToday && !isSelected && (
          <span className="admin-calendar-day-today-marker" />
        )}
      </button>
    );
  }, [getBookingCountForDate, isDateSelected, isDateToday, getDensityColor, primaryColor, handleDateSelect]);

  // Render week header
  const renderWeekHeader = useCallback(() => {
    return (
      <thead className="admin-calendar-header">
        <tr>
          {DAY_NAMES_SHORT_SK.map((dayName) => (
            <th key={dayName} className="admin-calendar-weekday">
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
      <tbody className="admin-calendar-body">
        {calendarMonth.weeks.map((week) => (
          <tr key={`week-${week.weekNumber}`} className="admin-calendar-week">
            {week.days.map((day: CalendarDay) => (
              <td key={day.dateString} className="admin-calendar-cell">
                {renderDay(day)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    );
  }, [calendarMonth, renderDay]);

  // Render booking row
  const renderBookingRow = useCallback((booking: BookingWithService) => {
    const serviceName = booking.service?.name || booking.service_id.substring(0, 8);
    const bookingDate = new Date(booking.start_time).toISOString().split('T')[0];
    const startTime = formatTime(booking.start_time);
    const endTime = formatTime(booking.end_time);
    const status = formatStatus(booking.status);
    const statusColor = getStatusColor(booking.status);
    
    return (
      <tr key={booking.id} className="admin-booking-row">
        <td className="admin-booking-time">
          {startTime} - {endTime}
        </td>
        <td className="admin-booking-service">
          <strong>{serviceName}</strong>
          <div className="admin-booking-meta">
            {booking.service?.price} € · {booking.service?.duration} min
          </div>
        </td>
        <td className="admin-booking-user">
          {booking.user_id.substring(0, 8)}...
        </td>
        <td className="admin-booking-status">
          <span 
            className="admin-booking-status-badge"
            style={{ backgroundColor: statusColor }}
          >
            {status}
          </span>
        </td>
        <td className="admin-booking-actions">
          {booking.status !== 'cancelled' && (
            <button
              type="button"
              className="premium-button-danger premium-button-small"
              onClick={() => handleCancelBooking(booking.id)}
              disabled={cancellingId === booking.id || isLoading}
            >
              {cancellingId === booking.id ? 'Zrušenie...' : 'Zrušiť'}
            </button>
          )}
          {booking.status === 'cancelled' && (
            <span className="admin-booking-cancelled">Už zrušené</span>
          )}
        </td>
      </tr>
    );
  }, [formatTime, formatStatus, getStatusColor, handleCancelBooking, cancellingId, isLoading]);

  return (
    <div className="admin-booking-calendar" style={{ '--primary-color': primaryColor } as CSSProperties}>
      {/* Calendar */}
      <div className="admin-calendar-section">
        <div className="admin-calendar-header-bar">
          <div className="admin-calendar-navigation">
            <button
              type="button"
              className="admin-calendar-nav-button"
              onClick={handlePrevMonth}
              aria-label="Predchádzajúci mesiac"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18L9 12L15 6" />
              </svg>
            </button>
            
            <span className="admin-calendar-month-label">
              {MONTH_NAMES_SK[currentMonth.month]} {currentMonth.year}
            </span>
            
            <button
              type="button"
              className="admin-calendar-nav-button"
              onClick={handleNextMonth}
              aria-label="Ďalší mesiac"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18L15 12L9 6" />
              </svg>
            </button>
          </div>
          
          <div className="admin-calendar-actions">
            <button
              type="button"
              className="premium-button-secondary"
              onClick={handleToday}
            >
              Dnes
            </button>
            <button
              type="button"
              className="premium-button-secondary"
              onClick={refreshBookings}
              disabled={refreshing}
            >
              {refreshing ? 'Obnovuje sa...' : 'Obnoviť'}
            </button>
          </div>
        </div>
        
        <table className="admin-calendar-grid">
          {renderWeekHeader()}
          {renderCalendarGrid()}
        </table>
      </div>

      {/* Filters */}
      <div className="admin-bookings-filters">
        <div className="admin-filter-group">
          <label className="admin-filter-label">Služba:</label>
          <select
            className="premium-select"
            value={selectedServiceId || ''}
            onChange={(e) => handleServiceFilter(e.target.value || null)}
          >
            <option value="">Všetky služby</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="admin-filter-group">
          <label className="admin-filter-label">Stav:</label>
          <select
            className="premium-select"
            value={selectedStatus || ''}
            onChange={(e) => handleStatusFilter(e.target.value || null)}
          >
            <option value="">Všetky stavy</option>
            <option value="confirmed">Potvrdené</option>
            <option value="cancelled">Zrušené</option>
            <option value="pending">Čaká na potvrdenie</option>
          </select>
        </div>
      </div>

      {/* Bookings List for Selected Date */}
      {selectedDate && (
        <div className="admin-bookings-list">
          <div className="admin-bookings-list-header">
            <span className="admin-bookings-list-date">
              {new Date(selectedDate).toLocaleDateString('sk-SK', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
            <span className="admin-bookings-list-count">
              {selectedDateBookings.length} rezervácií
            </span>
          </div>
          
          {selectedDateBookings.length === 0 ? (
            <div className="premium-empty">
              <span className="premium-kicker">Žiadne rezervácie</span>
              <p className="premium-empty-copy">
                Pre tento deň nie sú žiadne rezervácie.
              </p>
            </div>
          ) : (
            <table className="premium-table admin-bookings-table">
              <thead>
                <tr>
                  <th>Čas</th>
                  <th>Služba</th>
                  <th>Používateľ</th>
                  <th>Stav</th>
                  <th>Akcie</th>
                </tr>
              </thead>
              <tbody>
                {selectedDateBookings.map(renderBookingRow)}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* All Bookings (when no date selected) */}
      {!selectedDate && filteredBookings.length > 0 && (
        <div className="admin-bookings-list">
          <div className="admin-bookings-list-header">
            <span className="admin-bookings-list-date">Všetky rezervácie</span>
            <span className="admin-bookings-list-count">
              {filteredBookings.length} rezervácií
            </span>
          </div>
          
          <table className="premium-table admin-bookings-table">
            <thead>
              <tr>
                <th>Dátum</th>
                <th>Čas</th>
                <th>Služba</th>
                <th>Používateľ</th>
                <th>Stav</th>
                <th>Akcie</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.slice(0, 50).map((booking) => {
                const date = new Date(booking.start_time).toLocaleDateString('sk-SK', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
                return (
                  <tr key={booking.id} className="admin-booking-row">
                    <td className="admin-booking-date">{date}</td>
                    <td className="admin-booking-time">
                      {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                    </td>
                    <td className="admin-booking-service">
                      <strong>{booking.service?.name || booking.service_id.substring(0, 8)}</strong>
                    </td>
                    <td className="admin-booking-user">
                      {booking.user_id.substring(0, 8)}...
                    </td>
                    <td className="admin-booking-status">
                      <span 
                        className="admin-booking-status-badge"
                        style={{ backgroundColor: getStatusColor(booking.status) }}
                      >
                        {formatStatus(booking.status)}
                      </span>
                    </td>
                    <td className="admin-booking-actions">
                      {booking.status !== 'cancelled' && (
                        <button
                          type="button"
                          className="premium-button-danger premium-button-small"
                          onClick={() => handleCancelBooking(booking.id)}
                          disabled={cancellingId === booking.id || isLoading}
                        >
                          {cancellingId === booking.id ? 'Zrušenie...' : 'Zrušiť'}
                        </button>
                      )}
                      {booking.status === 'cancelled' && (
                        <span className="admin-booking-cancelled">Už zrušené</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredBookings.length > 50 && (
            <div className="admin-bookings-more">
              Zobrazuje sa prvých 50 rezervácií. Vyberte dátum pre detailnejší zoznam.
            </div>
          )}
        </div>
      )}

      {!selectedDate && filteredBookings.length === 0 && (
        <div className="premium-empty">
          <span className="premium-kicker">Žiadne rezervácie</span>
          <p className="premium-empty-copy">
            Žiadne rezervácie nezodpovedajú vybraným filtrom.
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Styles
// ============================================================================

export const adminCalendarStyles = `
  .admin-booking-calendar {
    --primary-color: #3B82F6;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .admin-calendar-section {
    margin-bottom: 1.5rem;
  }

  .admin-calendar-header-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .admin-calendar-navigation {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .admin-calendar-month-label {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--primary-color);
  }

  .admin-calendar-nav-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    color: var(--primary-color);
    border-radius: 4px;
    transition: background-color 0.2s;
  }

  .admin-calendar-nav-button:hover {
    background-color: rgba(59, 130, 246, 0.1);
  }

  .admin-calendar-actions {
    display: flex;
    gap: 0.5rem;
  }

  .admin-calendar-grid {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }

  .admin-calendar-header {
    background: none;
  }

  .admin-calendar-weekday {
    text-align: center;
    padding: 0.75rem 0;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    color: #666;
    border-bottom: 1px solid #e5e7eb;
  }

  .admin-calendar-body {
    background: none;
  }

  .admin-calendar-week {
    border-bottom: none;
  }

  .admin-calendar-cell {
    padding: 0.25rem;
    vertical-align: top;
    height: 56px;
  }

  .admin-calendar-day {
    width: 100%;
    height: 100%;
    border: 2px solid transparent;
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
    background-color: var(--density-color);
  }

  .admin-calendar-day:hover {
    border-color: var(--primary-color);
    background-color: rgba(59, 130, 246, 0.1);
  }

  .admin-calendar-day--today {
    font-weight: 600;
    color: var(--primary-color);
  }

  .admin-calendar-day--selected {
    background-color: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
  }

  .admin-calendar-day-number {
    line-height: 1;
  }

  .admin-calendar-day-count {
    position: absolute;
    top: 2px;
    right: 2px;
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

  .admin-calendar-day-today-marker {
    position: absolute;
    bottom: 4px;
    left: 50%;
    transform: translateX(-50%);
    width: 4px;
    height: 4px;
    background-color: var(--primary-color);
    border-radius: 50%;
  }

  /* Selected day styling */
  .admin-calendar-day--selected .admin-calendar-day-count {
    background-color: white;
    color: var(--primary-color);
  }

  .admin-bookings-filters {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }

  .admin-filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .admin-filter-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: #666;
    text-transform: uppercase;
  }

  .premium-select {
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    background: white;
    min-width: 150px;
  }

  .admin-bookings-list {
    background: white;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    padding: 1rem;
    margin-top: 1rem;
  }

  .admin-bookings-list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .admin-bookings-list-date {
    font-weight: 600;
    color: #111827;
  }

  .admin-bookings-list-count {
    color: #666;
    font-size: 0.875rem;
  }

  .admin-bookings-table {
    width: 100%;
    margin-top: 0.5rem;
  }

  .admin-bookings-table th {
    text-align: left;
    padding: 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    color: #666;
    border-bottom: 1px solid #e5e7eb;
  }

  .admin-bookings-table td {
    padding: 0.75rem 0.5rem;
    border-bottom: 1px solid #f3f4f6;
    font-size: 0.875rem;
  }

  .admin-booking-time {
    white-space: nowrap;
  }

  .admin-booking-service {
    white-space: nowrap;
  }

  .admin-booking-meta {
    font-size: 0.75rem;
    color: #666;
    margin-top: 0.125rem;
  }

  .admin-booking-user {
    color: #666;
    font-family: monospace;
  }

  .admin-booking-status-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 9999px;
    color: white;
    font-size: 0.75rem;
    font-weight: 500;
    display: inline-block;
  }

  .admin-booking-actions {
    white-space: nowrap;
  }

  .premium-button-small {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
  }

  .admin-booking-cancelled {
    color: #9ca3af;
    font-size: 0.75rem;
    font-style: italic;
  }

  .admin-bookings-more {
    text-align: center;
    padding: 1rem;
    color: #666;
    font-size: 0.875rem;
    font-style: italic;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .admin-calendar-header-bar {
      flex-direction: column;
      align-items: stretch;
    }
    
    .admin-calendar-actions {
      justify-content: center;
    }
    
    .admin-bookings-filters {
      flex-direction: column;
    }
    
    .admin-bookings-table {
      display: block;
      overflow-x: auto;
    }
    
    .admin-calendar-day {
      height: 48px;
    }
    
    .admin-calendar-cell {
      height: 48px;
    }
  }
`;

import type { CSSProperties } from 'react';
