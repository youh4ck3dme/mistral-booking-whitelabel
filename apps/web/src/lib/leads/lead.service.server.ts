// Server-only leads service
// This file should only be imported in server components or server actions

import { createServiceRoleClient } from '@repo/web/src/lib/supabase/service-role';
import type {
  SalesLead,
  SalesMessage,
  SalesOffer,
  SalesLeadWithMessagesAndOffers,
  LeadFilters,
  LeadSort,
  LeadListResponse,
  LeadDetailResponse,
} from './lead.types';

// Use service role client for server-side operations
const supabase = createServiceRoleClient({ requireServiceRole: false });

// Constants for table names
const SALES_LEADS_TABLE = 'sales_leads';
const SALES_MESSAGES_TABLE = 'sales_messages';
const SALES_OFFERS_TABLE = 'sales_offers';

/**
 * Fetch a paginated list of leads with optional filtering and sorting
 * SERVER-ONLY: This function should only be called from server components
 */
export async function getLeadsServer(
  filters: LeadFilters = {},
  sort: LeadSort = { field: 'priority', order: 'asc' },
  page: number = 1,
  pageSize: number = 20
): Promise<LeadListResponse> {
  try {
    let query = supabase
      .from(SALES_LEADS_TABLE)
      .select('*', { count: 'exact' })
      .order(sort.field, { ascending: sort.order === 'asc' });

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.vertical) {
      query = query.eq('vertical', filters.vertical);
    }
    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }

    // Apply pagination
    const offset = (page - 1) * pageSize;
    query = query.range(offset, offset + pageSize - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error('Error fetching leads:', error);
      throw new Error('Failed to fetch leads');
    }

    return {
      leads: (data || []) as SalesLead[],
      total: count || 0,
    };
  } catch (error) {
    console.error('Error in getLeadsServer:', error);
    throw error;
  }
}

/**
 * Fetch a single lead by ID with its messages and offers
 * SERVER-ONLY: This function should only be called from server components
 */
export async function getLeadByIdServer(leadId: string): Promise<LeadDetailResponse | null> {
  try {
    // Fetch lead
    const { data: lead, error: leadError } = await supabase
      .from(SALES_LEADS_TABLE)
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      console.error('Error fetching lead:', leadError);
      return null;
    }

    // Fetch messages for this lead
    const { data: messages, error: messagesError } = await supabase
      .from(SALES_MESSAGES_TABLE)
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
    }

    // Fetch offers for this lead
    const { data: offers, error: offersError } = await supabase
      .from(SALES_OFFERS_TABLE)
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (offersError) {
      console.error('Error fetching offers:', offersError);
    }

    return {
      ...(lead as SalesLead),
      messages: (messages || []) as SalesMessage[],
      offers: (offers || []) as SalesOffer[],
    };
  } catch (error) {
    console.error('Error in getLeadByIdServer:', error);
    throw error;
  }
}

/**
 * Fetch all leads with their messages and offers (for admin dashboard)
 * SERVER-ONLY: This function should only be called from server components
 */
export async function getLeadsWithMessagesAndOffersServer(): Promise<SalesLeadWithMessagesAndOffers[]> {
  try {
    // Fetch all leads
    const { data: leads, error: leadsError } = await supabase
      .from(SALES_LEADS_TABLE)
      .select('*')
      .order('priority', { ascending: true });

    if (leadsError) {
      console.error('Error fetching leads:', leadsError);
      throw new Error('Failed to fetch leads');
    }

    // Fetch all messages and offers in parallel
    const [messagesResult, offersResult] = await Promise.all([
      supabase.from(SALES_MESSAGES_TABLE).select('*'),
      supabase.from(SALES_OFFERS_TABLE).select('*'),
    ]);

    const messages = messagesResult.data || [];
    const offers = offersResult.data || [];

    // Map messages and offers to leads
    const leadsWithRelations = (leads || []).map((lead) => ({
      ...(lead as SalesLead),
      messages: messages.filter((msg) => msg.lead_id === lead.id) as SalesMessage[],
      offers: offers.filter((offer) => offer.lead_id === lead.id) as SalesOffer[],
    }));

    return leadsWithRelations;
  } catch (error) {
    console.error('Error in getLeadsWithMessagesAndOffersServer:', error);
    throw error;
  }
}

// Re-export helper functions (these are safe as they don't access Supabase)
export {
  getLeadStatusOptions,
  getVerticalOptions,
  getPriorityOptions,
  getChannelOptions,
  getOfferTypeOptions,
} from './lead.utils';
