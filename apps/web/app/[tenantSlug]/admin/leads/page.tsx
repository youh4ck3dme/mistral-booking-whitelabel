'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import {
  client as leadsClient,
  getLeadStatusOptions,
  getVerticalOptions,
  getPriorityOptions,
  type SalesLeadWithMessagesAndOffers,
  type SalesLeadStatus,
  type SalesVertical,
  type LeadFilters,
  type LeadSort,
} from '@repo/web/src/lib/leads';
import { useTenant } from '@repo/web/src/lib/tenant/TenantProvider';

const STATUS_COLORS: Record<string, string> = {
  new: '#6B7280',
  ready_to_contact: '#3B82F6',
  contacted: '#93C5FD',
  replied: '#10B981',
  call_booked: '#059669',
  proposal_sent: '#84CC16',
  won: '#22C55E',
  lost: '#EF4444',
  do_not_contact: '#7F1D1D',
};

const VERTICAL_COLORS: Record<string, string> = {
  fitness: '#06B6D4',
  chauffeur: '#8B5CF6',
  barber: '#F59E0B',
  salon: '#EC4899',
  transport: '#10B981',
  service: '#6366F1',
};

const PRIORITY_LABELS: Record<number, string> = {
  1: 'P1',
  2: 'P2',
  3: 'P3',
  4: 'P4',
  5: 'P5',
};

const { getLeadsWithMessagesAndOffersClient } = leadsClient;

export default function LeadsAdminPage() {
  const tenant = useTenant();
  const primaryColor = tenant.branding?.primary_color || '#3B82F6';

  const [leads, setLeads] = useState<SalesLeadWithMessagesAndOffers[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [filters, setFilters] = useState<LeadFilters>({
    status: undefined,
    vertical: undefined,
    priority: undefined,
  });

  // Sort state
  const [sort, setSort] = useState<LeadSort>({
    field: 'priority',
    order: 'asc',
  });

  // Fetch leads
  useEffect(() => {
    async function fetchLeads() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getLeadsWithMessagesAndOffersClient();
        setLeads(data);
      } catch (err) {
        console.error('Error fetching leads:', err);
        setError('Failed to load leads. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchLeads();
  }, []);

  // Filter and sort leads
  const filteredAndSortedLeads = useMemo(() => {
    return leads
      .filter((lead) => {
        if (filters.status && lead.status !== filters.status) return false;
        if (filters.vertical && lead.vertical !== filters.vertical) return false;
        if (filters.priority && lead.priority !== filters.priority) return false;
        return true;
      })
      .sort((a, b) => {
        let comparison = 0;

        switch (sort.field) {
          case 'priority':
            comparison = a.priority - b.priority;
            break;
          case 'score':
            comparison = b.score - a.score;
            break;
          case 'created_at':
            comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            break;
        }

        return sort.order === 'asc' ? comparison : -comparison;
      });
  }, [leads, filters, sort]);

  // Handle filter change
  const handleFilterChange = (key: keyof LeadFilters, value: string | number | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
    }));
  };

  // Handle sort change
  const handleSortChange = (field: LeadSort['field']) => {
    if (sort.field === field) {
      setSort((prev) => ({
        ...prev,
        order: prev.order === 'asc' ? 'desc' : 'asc',
      }));
    } else {
      setSort({ field, order: 'asc' });
    }
  };

  // Get sort indicator
  const getSortIndicator = (field: LeadSort['field']) => {
    if (sort.field !== field) return null;
    return sort.order === 'asc' ? '↑' : '↓';
  };

  // Get primary contact method
  const getPrimaryContactMethod = (lead: SalesLeadWithMessagesAndOffers): string => {
    if (lead.email) return 'Email';
    if (lead.linkedin_url) return 'LinkedIn';
    if (lead.contact_form_url) return 'Contact Form';
    return 'None';
  };

  // Get next action
  const getNextAction = (lead: SalesLeadWithMessagesAndOffers): string => {
    switch (lead.status) {
      case 'new':
        return 'Review lead';
      case 'ready_to_contact':
        return 'Send message';
      case 'contacted':
        return 'Follow up';
      case 'replied':
        return 'Schedule call';
      case 'call_booked':
        return 'Conduct call';
      case 'proposal_sent':
        return 'Follow up';
      case 'won':
        return 'Onboard';
      case 'lost':
        return 'Review';
      case 'do_not_contact':
        return 'None';
      default:
        return 'Unknown';
    }
  };

  // Format currency
  const formatCurrency = (amount: number | null): string => {
    if (amount === null) return '—';
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!tenant.isRoleResolved || tenant?.userRole !== 'admin') {
    return (
      <div className="premium-card premium-stack" style={{ '--accent': primaryColor } as CSSProperties}>
        <div className="premium-inline-actions">
          <div className="premium-spinner" />
          <span className="premium-copy">Checking admin access…</span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="premium-card premium-stack" style={{ '--accent': primaryColor } as CSSProperties}>
        <div className="premium-inline-actions">
          <div className="premium-spinner" />
          <span className="premium-copy">Loading leads…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="premium-stack" style={{ '--accent': primaryColor } as CSSProperties}>
        <div className="premium-alert premium-alert--error">{error}</div>
        <button
          type="button"
          className="premium-button"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="premium-stack" style={{ '--accent': primaryColor } as CSSProperties}>
      <section className="premium-card premium-card--soft premium-stack">
        <div className="premium-toolbar">
          <div>
            <span className="premium-section-label">Sales Pipeline</span>
            <h1 className="premium-section-title">Booking Growth Leads</h1>
          </div>
          <div className="premium-inline-actions">
            <Link href={`/${tenant.tenant.slug}/admin`} className="premium-button-secondary">
              Back to Admin
            </Link>
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="premium-card premium-stack">
        <div className="premium-grid-3" style={{ gap: '1rem' }}>
          <div className="premium-field">
            <label className="premium-label">Status</label>
            <select
              className="premium-input"
              value={filters.status || 'all'}
              onChange={(e) => handleFilterChange('status', e.target.value === 'all' ? undefined : e.target.value as SalesLeadStatus)}
            >
              <option value="all">All Statuses</option>
              {getLeadStatusOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="premium-field">
            <label className="premium-label">Vertical</label>
            <select
              className="premium-input"
              value={filters.vertical || 'all'}
              onChange={(e) => handleFilterChange('vertical', e.target.value === 'all' ? undefined : e.target.value as SalesVertical)}
            >
              <option value="all">All Verticals</option>
              {getVerticalOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="premium-field">
            <label className="premium-label">Priority</label>
            <select
              className="premium-input"
              value={filters.priority || 'all'}
              onChange={(e) => handleFilterChange('priority', e.target.value === 'all' ? undefined : Number(e.target.value))}
            >
              <option value="all">All Priorities</option>
              {getPriorityOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="premium-card premium-card--tight">
        <span className="premium-copy">
          Showing {filteredAndSortedLeads.length} of {leads.length} leads
        </span>
      </div>

      {/* Leads Table */}
      <div className="premium-card premium-stack">
        <div className="premium-table-wrap">
          <table className="premium-table">
            <thead>
              <tr>
                <th onClick={() => handleSortChange('priority')} style={{ cursor: 'pointer' }}>
                  Priority {getSortIndicator('priority')}
                </th>
                <th>Company</th>
                <th>Contact</th>
                <th>Vertical</th>
                <th onClick={() => handleSortChange('score')} style={{ cursor: 'pointer' }}>
                  Score {getSortIndicator('score')}
                </th>
                <th>Service</th>
                <th>Setup Price</th>
                <th>Monthly Price</th>
                <th>Status</th>
                <th>Contact Method</th>
                <th>Next Action</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedLeads.length > 0 ? (
                filteredAndSortedLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <span
                        className="premium-status"
                        style={{
                          backgroundColor: `${STATUS_COLORS[lead.status]}20`,
                          color: STATUS_COLORS[lead.status],
                        }}
                      >
                        {PRIORITY_LABELS[lead.priority] || `P${lead.priority}`}
                      </span>
                    </td>
                    <td>
                      <strong>{lead.company_name}</strong>
                    </td>
                    <td>{lead.contact_name || '—'}</td>
                    <td>
                      <span
                        className="premium-status"
                        style={{
                          backgroundColor: `${VERTICAL_COLORS[lead.vertical] || '#6B7280'}20`,
                          color: VERTICAL_COLORS[lead.vertical] || '#6B7280',
                        }}
                      >
                        {lead.vertical}
                      </span>
                    </td>
                    <td>
                      <span className="premium-copy">
                        {lead.score} / 12
                      </span>
                    </td>
                    <td>{lead.proposed_service.replace('_booking_pwa', '').replace('_', ' ')}</td>
                    <td>{formatCurrency(lead.estimated_setup_price_eur)}</td>
                    <td>{formatCurrency(lead.estimated_monthly_price_eur)}</td>
                    <td>
                      <span
                        className="premium-status"
                        style={{
                          backgroundColor: `${STATUS_COLORS[lead.status]}20`,
                          color: STATUS_COLORS[lead.status],
                        }}
                      >
                        {lead.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>{getPrimaryContactMethod(lead)}</td>
                    <td>{getNextAction(lead)}</td>
                    <td>
                      <Link
                        href={`/${tenant.tenant.slug}/admin/leads/${lead.id}`}
                        className="premium-button-secondary"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={12}>
                    <div className="premium-empty">
                      <span className="premium-kicker">No leads found</span>
                      <p className="premium-empty-copy">
                        Try adjusting your filters or add new leads to get started.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
