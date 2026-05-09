import { Service, Tenant, Booking } from '@repo/core';

export interface RecommendationResult {
  service: Service;
  score: number;
  reason: string;
}

export interface UpsellBundle {
  id: string;
  name: string;
  services: Service[];
  discount: number;
  description: string;
}

export interface AIConfig {
  tenantId: string;
  userId: string;
  locale: string;
  device: 'mobile' | 'desktop' | 'tablet';
}

export interface ExperimentTracking {
  experimentId: string;
  variant: string;
  userId: string;
  timestamp: string;
}
