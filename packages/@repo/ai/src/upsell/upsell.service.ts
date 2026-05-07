import { Service } from '@repo/core/types';
import { UpsellBundle } from '../types';

// Rule-based upsell bundles (fallback when AI is unavailable)
const DEFAULT_BUNDLES: UpsellBundle[] = [
  {
    id: 'premium-pack',
    name: 'Premium Balíček',
    services: [], // Will be populated dynamically
    discount: 0.2,
    description: '20% zľava na vybrané služby',
  },
  {
    id: 'family-pack',
    name: 'Rodinný Balíček',
    services: [],
    discount: 0.15,
    description: '15% zľava pre rodiny',
  },
  {
    id: 'wellness-pack',
    name: 'Wellness Balíček',
    services: [],
    discount: 0.25,
    description: '25% zľava na wellness služby',
  },
];

export async function getUpsellBundles(
  tenantId: string,
  cartServices: Service[]
): Promise<UpsellBundle[]> {
  // In production, this would call an AI service
  // For now, return rule-based bundles
  return DEFAULT_BUNDLES.map((bundle) => ({
    ...bundle,
    services: cartServices.slice(0, 2), // Demo: first 2 services in cart
  }));
}

export function getDeterministicFallbackBundles(
  services: Service[]
): UpsellBundle[] {
  // Fallback when AI is unavailable
  return [
    {
      id: 'fallback-bundle',
      name: 'Špeciálna Ponuka',
      services: services.slice(0, 2),
      discount: 0.1,
      description: '10% zľava na vybrané služby',
    },
  ];
}
