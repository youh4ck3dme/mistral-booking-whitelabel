'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getLeadById,
  getLeadStatusOptions,
  getVerticalOptions,
  getPriorityOptions,
  getChannelOptions,
  getOfferTypeOptions,
  type SalesLeadWithMessagesAndOffers,
  type SalesLeadStatus,
  type SalesVertical,
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

const MESSAGE_STATUS_COLORS: Record<string, string> = {
  draft: '#6B7280',
  ready: '#3B82F6',
  sent: '#10B981',
  failed: '#EF4444',
};

const OFFER_STATUS_COLORS: Record<string, string> = {
  draft: '#6B7280',
  sent: '#3B82F6',
  accepted: '#10B981',
  rejected: '#EF4444',
};

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenant = useTenant();
  const primaryColor = tenant.branding?.primary_color || '#3B82F6';

  const leadId = params.leadId as string;
  const tenantSlug = params.tenantSlug as string;

  const [lead, setLead] = useState<SalesLeadWithMessagesAndOffers | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch lead details
  useEffect(() => {
    async function fetchLead() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getLeadById(leadId);
        setLead(data);
      } catch (err) {
        console.error('Error fetching lead:', err);
        setError('Failed to load lead details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    if (leadId) {
      fetchLead();
    }
  }, [leadId]);

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

  // Get status badge
  const getStatusBadge = (status: string, colors: Record<string, string>) => (
    <span
      className="premium-status"
      style={{
        backgroundColor: `${colors[status] || '#6B7280'}20`,
        color: colors[status] || '#6B7280',
      }}
    >
      {status.replace('_', ' ')}
    </span>
  );

  // Get channel icon
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return '✉️';
      case 'linkedin':
        return '💼';
      case 'contact_form':
        return '📝';
      default:
        return '📩';
    }
  };

  // Get offer type label
  const getOfferTypeLabel = (offerType: string): string => {
    const option = getOfferTypeOptions().find((opt) => opt.value === offerType);
    return option ? option.label : offerType.replace('_', ' ').replace('pwa', 'PWA').toUpperCase();
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
          <span className="premium-copy">Loading lead details…</span>
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
          onClick={() => router.push(`/${tenantSlug}/admin/leads`)}
        >
          Back to Leads
        </button>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="premium-stack" style={{ '--accent': primaryColor } as CSSProperties}>
        <div className="premium-alert premium-alert--warning">Lead not found</div>
        <Link href={`/${tenantSlug}/admin/leads`} className="premium-button">
          Back to Leads
        </Link>
      </div>
    );
  }

  return (
    <div className="premium-stack" style={{ '--accent': primaryColor } as CSSProperties}>
      {/* Header */}
      <section className="premium-card premium-card--soft premium-stack">
        <div className="premium-toolbar">
          <div>
            <Link href={`/${tenantSlug}/admin/leads`} className="premium-button-secondary" style={{ marginRight: '1rem' }}>
              ← Back to Leads
            </Link>
            <span className="premium-section-label">Lead Details</span>
            <h1 className="premium-section-title">{lead.company_name}</h1>
          </div>
          <div className="premium-inline-actions">
            {getStatusBadge(lead.status, STATUS_COLORS)}
          </div>
        </div>
      </section>

      {/* Lead Overview */}
      <div className="premium-grid-2" style={{ gap: '1rem' }}>
        {/* Company Info */}
        <section className="premium-card premium-stack">
          <h2 className="premium-card-title">Company Information</h2>
          <div className="premium-form">
            <div className="premium-field">
              <label className="premium-label">Company Name</label>
              <div className="premium-input" style={{ backgroundColor: '#f8f9fa', padding: '0.5rem' }}>
                {lead.company_name}
              </div>
            </div>

            <div className="premium-field">
              <label className="premium-label">Vertical</label>
              <div className="premium-inline-actions">
                <span
                  className="premium-status"
                  style={{
                    backgroundColor: `${VERTICAL_COLORS[lead.vertical] || '#6B7280'}20`,
                    color: VERTICAL_COLORS[lead.vertical] || '#6B7280',
                  }}
                >
                  {lead.vertical}
                </span>
              </div>
            </div>

            <div className="premium-field">
              <label className="premium-label">Location</label>
              <div className="premium-input" style={{ backgroundColor: '#f8f9fa', padding: '0.5rem' }}>
                {lead.city ? `${lead.city}, ${lead.country}` : lead.country || '—'}
              </div>
            </div>

            <div className="premium-field">
              <label className="premium-label">Website</label>
              <div className="premium-input" style={{ backgroundColor: '#f8f9fa', padding: '0.5rem' }}>
                {lead.website_url ? (
                  <a href={lead.website_url} target="_blank" rel="noopener noreferrer">
                    {lead.website_url}
                  </a>
                ) : '—'}
              </div>
            </div>
          </div>
        </section>

        {/* Contact Info */}
        <section className="premium-card premium-stack">
          <h2 className="premium-card-title">Contact Information</h2>
          <div className="premium-form">
            <div className="premium-field">
              <label className="premium-label">Contact Name</label>
              <div className="premium-input" style={{ backgroundColor: '#f8f9fa', padding: '0.5rem' }}>
                {lead.contact_name || '—'}
              </div>
            </div>

            <div className="premium-field">
              <label className="premium-label">Contact Role</label>
              <div className="premium-input" style={{ backgroundColor: '#f8f9fa', padding: '0.5rem' }}>
                {lead.contact_role || '—'}
              </div>
            </div>

            <div className="premium-field">
              <label className="premium-label">Email</label>
              <div className="premium-input" style={{ backgroundColor: '#f8f9fa', padding: '0.5rem' }}>
                {lead.email ? (
                  <a href={`mailto:${lead.email}`}>{lead.email}</a>
                ) : '—'}
              </div>
            </div>

            <div className="premium-field">
              <label className="premium-label">LinkedIn</label>
              <div className="premium-input" style={{ backgroundColor: '#f8f9fa', padding: '0.5rem' }}>
                {lead.linkedin_url ? (
                  <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer">
                    {lead.linkedin_url}
                  </a>
                ) : '—'}
              </div>
            </div>

            <div className="premium-field">
              <label className="premium-label">Contact Form</label>
              <div className="premium-input" style={{ backgroundColor: '#f8f9fa', padding: '0.5rem' }}>
                {lead.contact_form_url ? (
                  <a href={lead.contact_form_url} target="_blank" rel="noopener noreferrer">
                    {lead.contact_form_url}
                  </a>
                ) : '—'}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Lead Details */}
      <div className="premium-grid-2" style={{ gap: '1rem' }}>
        {/* Lead Details */}
        <section className="premium-card premium-stack">
          <h2 className="premium-card-title">Lead Details</h2>
          <div className="premium-form">
            <div className="premium-field">
              <label className="premium-label">Score</label>
              <div className="premium-inline-actions" style={{ alignItems: 'center' }}>
                <span className="premium-copy" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {lead.score}
                </span>
                <span className="premium-copy" style={{ color: '#6B7280' }}>
                  / 12
                </span>
              </div>
            </div>

            <div className="premium-field">
              <label className="premium-label">Priority</label>
              <div className="premium-inline-actions">
                <span className="premium-status" style={{ backgroundColor: '#3B82F620', color: '#3B82F6' }}>
                  P{lead.priority}
                </span>
              </div>
            </div>

            <div className="premium-field">
              <label className="premium-label">Proposed Service</label>
              <div className="premium-input" style={{ backgroundColor: '#f8f9fa', padding: '0.5rem' }}>
                {lead.proposed_service.replace('_booking_pwa', '').replace('_', ' ')}
              </div>
            </div>

            <div className="premium-field">
              <label className="premium-label">Estimated Setup Price</label>
              <div className="premium-input" style={{ backgroundColor: '#f8f9fa', padding: '0.5rem' }}>
                {formatCurrency(lead.estimated_setup_price_eur)}
              </div>
            </div>

            <div className="premium-field">
              <label className="premium-label">Estimated Monthly Price</label>
              <div className="premium-input" style={{ backgroundColor: '#f8f9fa', padding: '0.5rem' }}>
                {formatCurrency(lead.estimated_monthly_price_eur)}
              </div>
            </div>
          </div>
        </section>

        {/* Problem & Offer */}
        <section className="premium-card premium-stack">
          <h2 className="premium-card-title">Problem & Solution</h2>
          <div className="premium-form">
            <div className="premium-field">
              <label className="premium-label">Problem Summary</label>
              <div
                className="premium-input"
                style={{ backgroundColor: '#f8f9fa', padding: '0.5rem', minHeight: '100px' }}
              >
                {lead.problem_summary}
              </div>
            </div>

            <div className="premium-field">
              <label className="premium-label">Offer Angle</label>
              <div
                className="premium-input"
                style={{ backgroundColor: '#f8f9fa', padding: '0.5rem', minHeight: '100px' }}
              >
                {lead.offer_angle}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Messages */}
      <section className="premium-card premium-stack">
        <div className="premium-toolbar">
          <div>
            <h2 className="premium-section-title">Drafted Messages</h2>
            <span className="premium-section-label">{lead.messages.length} messages</span>
          </div>
        </div>

        {lead.messages.length > 0 ? (
          <div className="premium-stack">
            {lead.messages.map((message) => (
              <div
                key={message.id}
                className="premium-card premium-card--tight"
                style={{
                  borderLeft: `4px solid ${MESSAGE_STATUS_COLORS[message.status] || '#6B7280'}`,
                }}
              >
                <div className="premium-toolbar" style={{ justifyContent: 'space-between' }}>
                  <div className="premium-inline-actions">
                    <span style={{ fontWeight: 'bold' }}>
                      {getChannelIcon(message.channel)} {message.channel.replace('_', ' ')}
                    </span>
                    {message.subject && (
                      <span className="premium-copy" style={{ marginLeft: '1rem' }}>
                        {message.subject}
                      </span>
                    )}
                  </div>
                  <div>{getStatusBadge(message.status, MESSAGE_STATUS_COLORS)}</div>
                </div>
                <div
                  className="premium-copy"
                  style={{
                    whiteSpace: 'pre-wrap',
                    backgroundColor: '#f8f9fa',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    marginTop: '0.5rem',
                  }}
                >
                  {message.body}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="premium-empty">
            <span className="premium-kicker">No messages</span>
            <p className="premium-empty-copy">No drafted messages for this lead yet.</p>
          </div>
        )}
      </section>

      {/* Offers */}
      <section className="premium-card premium-stack">
        <div className="premium-toolbar">
          <div>
            <h2 className="premium-section-title">Drafted Offers</h2>
            <span className="premium-section-label">{lead.offers.length} offers</span>
          </div>
        </div>

        {lead.offers.length > 0 ? (
          <div className="premium-table-wrap">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Offer Type</th>
                  <th>Title</th>
                  <th>Setup Price</th>
                  <th>Monthly Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lead.offers.map((offer) => (
                  <tr key={offer.id}>
                    <td>{getOfferTypeLabel(offer.offer_type)}</td>
                    <td><strong>{offer.title}</strong></td>
                    <td>{formatCurrency(offer.setup_price_eur)}</td>
                    <td>{formatCurrency(offer.monthly_price_eur)}</td>
                    <td>{getStatusBadge(offer.status, OFFER_STATUS_COLORS)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="premium-empty">
            <span className="premium-kicker">No offers</span>
            <p className="premium-empty-copy">No drafted offers for this lead yet.</p>
          </div>
        )}
      </section>

      {/* Metadata */}
      <section className="premium-card premium-card--tight">
        <div className="premium-grid-3" style={{ gap: '1rem' }}>
          <div>
            <label className="premium-label">Created</label>
            <div className="premium-copy">
              {new Date(lead.created_at).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
          <div>
            <label className="premium-label">Last Updated</label>
            <div className="premium-copy">
              {new Date(lead.updated_at).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
          <div>
            <label className="premium-label">Lead ID</label>
            <div className="premium-copy" style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
              {lead.id}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
