// Sales Lead Types for Booking Growth Pipeline

export type SalesLeadStatus = 
  | 'new'
  | 'ready_to_contact'
  | 'contacted'
  | 'replied'
  | 'call_booked'
  | 'proposal_sent'
  | 'won'
  | 'lost'
  | 'do_not_contact';

export type SalesVertical = 
  | 'fitness'
  | 'chauffeur'
  | 'barber'
  | 'salon'
  | 'transport'
  | 'service'
  | string;

export type SalesMessageChannel = 'email' | 'linkedin' | 'contact_form';

export type SalesMessageStatus = 'draft' | 'ready' | 'sent' | 'failed';

export type SalesOfferType = 
  | 'fitness_booking_pwa'
  | 'chauffeur_booking_pwa'
  | 'barber_booking_pwa'
  | 'custom_booking_pwa';

export type SalesOfferStatus = 'draft' | 'sent' | 'accepted' | 'rejected';

// Main Lead type
export interface SalesLead {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_role: string | null;
  vertical: SalesVertical;
  country: string | null;
  city: string | null;
  email: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  contact_form_url: string | null;
  score: number;
  score_reason: Record<string, unknown>;
  problem_summary: string;
  offer_angle: string;
  proposed_service: SalesOfferType | string;
  estimated_setup_price_eur: number | null;
  estimated_monthly_price_eur: number | null;
  status: SalesLeadStatus;
  priority: number; // 1-5
  created_at: string;
  updated_at: string;
}

// Message type
export interface SalesMessage {
  id: string;
  lead_id: string;
  channel: SalesMessageChannel;
  subject: string | null;
  body: string;
  status: SalesMessageStatus;
  sent_at: string | null;
  created_at: string;
}

// Offer type
export interface SalesOffer {
  id: string;
  lead_id: string;
  offer_type: SalesOfferType | string;
  title: string;
  setup_price_eur: number;
  monthly_price_eur: number;
  scope: Record<string, unknown>;
  status: SalesOfferStatus;
  created_at: string;
}

// Combined type for lead with messages and offers
export interface SalesLeadWithMessagesAndOffers extends SalesLead {
  messages: SalesMessage[];
  offers: SalesOffer[];
}

// Filter types for UI
export interface LeadFilters {
  status?: SalesLeadStatus;
  vertical?: SalesVertical;
  priority?: number;
}

// Sort types for UI
export type LeadSortField = 'priority' | 'score' | 'created_at';
export type LeadSortOrder = 'asc' | 'desc';

export interface LeadSort {
  field: LeadSortField;
  order: LeadSortOrder;
}

// API response types
export interface LeadListResponse {
  leads: SalesLead[];
  total: number;
}

export interface LeadDetailResponse extends SalesLead {
  messages: SalesMessage[];
  offers: SalesOffer[];
}
