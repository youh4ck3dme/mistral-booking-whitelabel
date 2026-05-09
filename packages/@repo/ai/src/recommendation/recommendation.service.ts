import { supabase, type Database } from '@repo/supabase';
import { Service } from '@repo/core';
import { RecommendationResult } from '../types';

type BookingSelection = Pick<Database['public']['Tables']['bookings']['Row'], 'service_id'>;
type AIImpressionInsert = Database['public']['Tables']['ai_impressions']['Insert'];

export async function getRecommendedServices(
  tenantId: string,
  userId: string
): Promise<RecommendationResult[]> {
  try {
    // Get user's past bookings to avoid recommending the same services
    const { data } = await supabase
      .from('bookings')
      .select('service_id')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId);

    const pastBookings: BookingSelection[] = data ?? [];
    const pastServiceIds = pastBookings.map((booking) => booking.service_id);

    // Get all services for the tenant
    const { data: allServices } = await supabase
      .from('services')
      .select('*')
      .eq('tenant_id', tenantId)
      .not('id', 'in', `(${pastServiceIds.join(',')})`);

    if (!allServices || allServices.length === 0) {
      return [];
    }

    // Simple recommendation logic: sort by price (ascending) for demo
    // In production, replace with AI model or more complex logic
    const recommended = allServices
      .sort(() => Math.random() - 0.5) // Random for demo
      .slice(0, 3)
      .map((service) => ({
        service,
        score: Math.random(),
        reason: `Recommended based on your past bookings`,
      }));

    return recommended;
  } catch (error) {
    console.error('Error in getRecommendedServices:', error);
    return [];
  }
}

export async function logRecommendationImpression(
  experimentId: string,
  userId: string,
  variant: string
): Promise<void> {
  try {
    const impression: AIImpressionInsert = {
      experiment_id: experimentId,
      user_id: userId,
      variant,
    };

    await supabase.from('ai_impressions').insert(impression);
  } catch (error) {
    console.error('Error logging impression:', error);
  }
}
