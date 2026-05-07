export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
        };
      };
      tenant_users: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string;
          role: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id: string;
          role: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string;
          role?: string;
        };
      };
      services: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          description: string | null;
          duration: number;
          price: number;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          description?: string | null;
          duration: number;
          price: number;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          description?: string | null;
          duration?: number;
          price?: number;
        };
      };
      bookings: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string;
          service_id: string;
          start_time: string;
          end_time: string;
          status: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id: string;
          service_id: string;
          start_time: string;
          end_time: string;
          status?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string;
          service_id?: string;
          start_time?: string;
          end_time?: string;
          status?: string;
        };
      };
      tenant_branding: {
        Row: {
          id: string;
          tenant_id: string;
          logo_url: string | null;
          favicon_url: string | null;
          primary_color: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          logo_url?: string | null;
          favicon_url?: string | null;
          primary_color: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          logo_url?: string | null;
          favicon_url?: string | null;
          primary_color?: string;
        };
      };
      time_slots_config: {
        Row: {
          id: string;
          tenant_id: string;
          start_time: string;
          end_time: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          start_time: string;
          end_time: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          start_time?: string;
          end_time?: string;
          is_active?: boolean;
        };
      };
      ai_experiments: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      ai_impressions: {
        Row: {
          id: string;
          experiment_id: string;
          user_id: string;
          variant: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          experiment_id: string;
          user_id: string;
          variant: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          experiment_id?: string;
          user_id?: string;
          variant?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_booking: {
        Args: {
          p_tenant_id: string;
          p_user_id: string;
          p_service_id: string;
          p_start_time: string;
          p_end_time: string;
        };
        Returns: string;
      };
      cancel_booking: {
        Args: {
          p_booking_id: string;
          p_user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      booking_status: 'confirmed' | 'cancelled' | 'pending';
      user_role: 'admin' | 'staff' | 'client';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  storage: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Insert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Update<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];