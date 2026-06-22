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

const supabase = createServiceRoleClient({ requireServiceRole: false });

// Constants for table names
const SALES_LEADS_TABLE = 'sales_leads';
const SALES_MESSAGES_TABLE = 'sales_messages';
const SALES_OFFERS_TABLE = 'sales_offers';

/**
 * Fetch a paginated list of leads with optional filtering and sorting
 */
export async function getLeads(
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
    console.error('Error in getLeads:', error);
    throw error;
  }
}

/**
 * Fetch a single lead by ID with its messages and offers
 */
export async function getLeadById(leadId: string): Promise<LeadDetailResponse | null> {
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
    console.error('Error in getLeadById:', error);
    throw error;
  }
}

/**
 * Fetch all leads with their messages and offers (for admin dashboard)
 */
export async function getLeadsWithMessagesAndOffers(): Promise<SalesLeadWithMessagesAndOffers[]> {
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
    console.error('Error in getLeadsWithMessagesAndOffers:', error);
    throw error;
  }
}

/**
 * Create a new lead
 */
export async function createLead(leadData: Omit<SalesLead, 'id' | 'created_at' | 'updated_at'>): Promise<SalesLead> {
  try {
    const { data, error } = await supabase
      .from(SALES_LEADS_TABLE)
      .insert([leadData])
      .select()
      .single();

    if (error || !data) {
      console.error('Error creating lead:', error);
      throw new Error('Failed to create lead');
    }

    return data as SalesLead;
  } catch (error) {
    console.error('Error in createLead:', error);
    throw error;
  }
}

/**
 * Update a lead
 */
export async function updateLead(
  leadId: string,
  leadData: Partial<Omit<SalesLead, 'id' | 'created_at' | 'updated_at'>>
): Promise<SalesLead> {
  try {
    const { data, error } = await supabase
      .from(SALES_LEADS_TABLE)
      .update(leadData)
      .eq('id', leadId)
      .select()
      .single();

    if (error || !data) {
      console.error('Error updating lead:', error);
      throw new Error('Failed to update lead');
    }

    return data as SalesLead;
  } catch (error) {
    console.error('Error in updateLead:', error);
    throw error;
  }
}

/**
 * Delete a lead
 */
export async function deleteLead(leadId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from(SALES_LEADS_TABLE)
      .delete()
      .eq('id', leadId);

    if (error) {
      console.error('Error deleting lead:', error);
      throw new Error('Failed to delete lead');
    }
  } catch (error) {
    console.error('Error in deleteLead:', error);
    throw error;
  }
}

/**
 * Create a message for a lead
 */
export async function createMessage(
  leadId: string,
  messageData: Omit<SalesMessage, 'id' | 'lead_id' | 'created_at'>
): Promise<SalesMessage> {
  try {
    const { data, error } = await supabase
      .from(SALES_MESSAGES_TABLE)
      .insert([{ ...messageData, lead_id: leadId }])
      .select()
      .single();

    if (error || !data) {
      console.error('Error creating message:', error);
      throw new Error('Failed to create message');
    }

    return data as SalesMessage;
  } catch (error) {
    console.error('Error in createMessage:', error);
    throw error;
  }
}

/**
 * Update a message
 */
export async function updateMessage(
  messageId: string,
  messageData: Partial<Omit<SalesMessage, 'id' | 'lead_id' | 'created_at'>>
): Promise<SalesMessage> {
  try {
    const { data, error } = await supabase
      .from(SALES_MESSAGES_TABLE)
      .update(messageData)
      .eq('id', messageId)
      .select()
      .single();

    if (error || !data) {
      console.error('Error updating message:', error);
      throw new Error('Failed to update message');
    }

    return data as SalesMessage;
  } catch (error) {
    console.error('Error in updateMessage:', error);
    throw error;
  }
}

/**
 * Create an offer for a lead
 */
export async function createOffer(
  leadId: string,
  offerData: Omit<SalesOffer, 'id' | 'lead_id' | 'created_at'>
): Promise<SalesOffer> {
  try {
    const { data, error } = await supabase
      .from(SALES_OFFERS_TABLE)
      .insert([{ ...offerData, lead_id: leadId }])
      .select()
      .single();

    if (error || !data) {
      console.error('Error creating offer:', error);
      throw new Error('Failed to create offer');
    }

    return data as SalesOffer;
  } catch (error) {
    console.error('Error in createOffer:', error);
    throw error;
  }
}

/**
 * Update an offer
 */
export async function updateOffer(
  offerId: string,
  offerData: Partial<Omit<SalesOffer, 'id' | 'lead_id' | 'created_at'>>
): Promise<SalesOffer> {
  try {
    const { data, error } = await supabase
      .from(SALES_OFFERS_TABLE)
      .update(offerData)
      .eq('id', offerId)
      .select()
      .single();

    if (error || !data) {
      console.error('Error updating offer:', error);
      throw new Error('Failed to update offer');
    }

    return data as SalesOffer;
  } catch (error) {
    console.error('Error in updateOffer:', error);
    throw error;
  }
}

/**
 * Get status options for leads
 */
export function getLeadStatusOptions(): { value: string; label: string }[] {
  return [
    { value: 'new', label: 'New' },
    { value: 'ready_to_contact', label: 'Ready to Contact' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'replied', label: 'Replied' },
    { value: 'call_booked', label: 'Call Booked' },
    { value: 'proposal_sent', label: 'Proposal Sent' },
    { value: 'won', label: 'Won' },
    { value: 'lost', label: 'Lost' },
    { value: 'do_not_contact', label: 'Do Not Contact' },
  ];
}

/**
 * Get vertical options for leads
 */
export function getVerticalOptions(): { value: string; label: string }[] {
  return [
    { value: 'fitness', label: 'Fitness' },
    { value: 'chauffeur', label: 'Chauffeur/Transport' },
    { value: 'barber', label: 'Barber Shop' },
    { value: 'salon', label: 'Salon' },
    { value: 'service', label: 'Service Business' },
    { value: 'transport', label: 'Transport' },
  ];
}

/**
 * Get priority options for leads
 */
export function getPriorityOptions(): { value: number; label: string }[] {
  return [
    { value: 1, label: 'P1 - Highest' },
    { value: 2, label: 'P2 - High' },
    { value: 3, label: 'P3 - Medium' },
    { value: 4, label: 'P4 - Low' },
    { value: 5, label: 'P5 - Lowest' },
  ];
}

/**
 * Get channel options for messages
 */
export function getChannelOptions(): { value: string; label: string }[] {
  return [
    { value: 'email', label: 'Email' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'contact_form', label: 'Contact Form' },
  ];
}

/**
 * Get offer type options
 */
export function getOfferTypeOptions(): { value: string; label: string }[] {
  return [
    { value: 'fitness_booking_pwa', label: 'Fitness Booking PWA' },
    { value: 'chauffeur_booking_pwa', label: 'Chauffeur Booking PWA' },
    { value: 'barber_booking_pwa', label: 'Barber Booking PWA' },
    { value: 'custom_booking_pwa', label: 'Custom Booking PWA' },
  ];
}
