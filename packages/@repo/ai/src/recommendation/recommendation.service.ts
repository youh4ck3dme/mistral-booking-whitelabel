import { supabase } from '@repo/supabase';
import { Service, TenantUser } from '@repo/core/types';
import { RecommendationResult } from '../types';

export async function getRecommendedServices(
  tenantId: string,
  userId: string
): Promise<RecommendationResult[]> {
  try {
    // Get user's past bookings to avoid recommending the same services
    const { data: pastBookings } = await supabase
      .from('bookings')
      .select('service_id')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId);

    const pastServiceIds = pastBookings?.map((b) => b.service_id) || [];

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
    await supabase.from('ai_impressions').insert({
      experiment_id: experimentId,
      user_id: userId,
      variant,
    });
  } catch (error) {
    console.error('Error logging impression:', error);
  }
}
