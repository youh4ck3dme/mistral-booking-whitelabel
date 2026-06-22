// Utility functions for leads module
// These are pure functions that don't access Supabase or any privileged data

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
