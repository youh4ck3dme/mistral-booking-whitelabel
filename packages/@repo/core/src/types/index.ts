export interface Tenant {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface TenantUser {
  id: string;
  tenant_id: string;
  user_id: string;
  role: 'admin' | 'staff' | 'client';
}

export interface Service {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  duration: number; // in minutes
  price: number;
  is_active: boolean;
}

export interface Booking {
  id: string;
  tenant_id: string;
  user_id: string;
  service_id: string;
  start_time: string;
  end_time: string;
  status: 'confirmed' | 'cancelled' | 'pending';
}

export interface TimeSlotConfig {
  id: string;
  tenant_id: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface TenantBranding {
  id: string;
  tenant_id: string;
  logo_url?: string | null;
  favicon_url?: string | null;
  primary_color: string;
}

export interface AIExperiment {
  id: string;
  tenant_id: string;
  name: string;
  description?: string | null;
  created_at: string;
}

export interface AIImpression {
  id: string;
  experiment_id: string;
  user_id: string;
  variant: string;
  created_at: string;
}
