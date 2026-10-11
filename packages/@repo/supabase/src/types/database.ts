export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          locale: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          locale?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          locale?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      tenant_users: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string;
          role: 'admin' | 'staff' | 'client';
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id: string;
          role: 'admin' | 'staff' | 'client';
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string;
          role?: 'admin' | 'staff' | 'client';
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          description: string | null;
          duration: number;
          price: number;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          description?: string | null;
          duration: number;
          price: number;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          description?: string | null;
          duration?: number;
          price?: number;
          is_active?: boolean;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string;
          service_id: string;
          start_time: string;
          end_time: string;
          status: 'confirmed' | 'cancelled' | 'pending' | 'completed' | 'no_show';
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id: string;
          service_id: string;
          start_time: string;
          end_time: string;
          status?: 'confirmed' | 'cancelled' | 'pending' | 'completed' | 'no_show';
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string;
          service_id?: string;
          start_time?: string;
          end_time?: string;
          status?: 'confirmed' | 'cancelled' | 'pending' | 'completed' | 'no_show';
        };
        Relationships: [];
      };
      notification_deliveries: {
        Row: {
          attempt_count: number;
          booking_id: string;
          channel: 'email' | 'push' | 'sms';
          created_at: string;
          error_message: string | null;
          id: string;
          idempotency_key: string;
          notification_type:
            | 'booking_confirmation'
            | 'booking_reminder'
            | 'booking_cancellation'
            | 'booking_update';
          payload: Json;
          provider_message_id: string | null;
          recipient_email: string;
          scheduled_for: string;
          sent_at: string | null;
          status: 'pending' | 'processing' | 'sent' | 'failed';
          subject: string | null;
          tenant_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          attempt_count?: number;
          booking_id: string;
          channel?: 'email' | 'push' | 'sms';
          created_at?: string;
          error_message?: string | null;
          id?: string;
          idempotency_key: string;
          notification_type:
            | 'booking_confirmation'
            | 'booking_reminder'
            | 'booking_cancellation'
            | 'booking_update';
          payload?: Json;
          provider_message_id?: string | null;
          recipient_email: string;
          scheduled_for?: string;
          sent_at?: string | null;
          status?: 'pending' | 'processing' | 'sent' | 'failed';
          subject?: string | null;
          tenant_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          attempt_count?: number;
          booking_id?: string;
          channel?: 'email' | 'push' | 'sms';
          created_at?: string;
          error_message?: string | null;
          id?: string;
          idempotency_key?: string;
          notification_type?:
            | 'booking_confirmation'
            | 'booking_reminder'
            | 'booking_cancellation'
            | 'booking_update';
          payload?: Json;
          provider_message_id?: string | null;
          recipient_email?: string;
          scheduled_for?: string;
          sent_at?: string | null;
          status?: 'pending' | 'processing' | 'sent' | 'failed';
          subject?: string | null;
          tenant_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
      };
      ai_conversions: {
        Row: {
          id: string;
          impression_id: string | null;
          user_id: string;
          converted_at: string;
        };
        Insert: {
          id?: string;
          impression_id?: string | null;
          user_id: string;
          converted_at?: string;
        };
        Update: {
          id?: string;
          impression_id?: string | null;
          user_id?: string;
          converted_at?: string;
        };
        Relationships: [];
      };
      platform_admins: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      staff: {
        Row: {
          id: string
          tenant_id: string
          display_name: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          display_name: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          display_name?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_staff: {
        Row: { tenant_id: string; service_id: string; staff_id: string }
        Insert: { tenant_id: string; service_id: string; staff_id: string }
        Update: { tenant_id?: string; service_id?: string; staff_id?: string }
        Relationships: []
      }
      staff_working_hours: {
        Row: { id: string; tenant_id: string; staff_id: string; weekday: number; start_time: string; end_time: string }
        Insert: { id?: string; tenant_id: string; staff_id: string; weekday: number; start_time: string; end_time: string }
        Update: { id?: string; tenant_id?: string; staff_id?: string; weekday?: number; start_time?: string; end_time?: string }
        Relationships: []
      }
      staff_breaks: {
        Row: { id: string; tenant_id: string; staff_id: string; weekday: number; start_time: string; end_time: string }
        Insert: { id?: string; tenant_id: string; staff_id: string; weekday: number; start_time: string; end_time: string }
        Update: { id?: string; tenant_id?: string; staff_id?: string; weekday?: number; start_time?: string; end_time?: string }
        Relationships: []
      }
      staff_time_off: {
        Row: { id: string; tenant_id: string; staff_id: string; starts_at: string; ends_at: string; reason: string | null }
        Insert: { id?: string; tenant_id: string; staff_id: string; starts_at: string; ends_at: string; reason?: string | null }
        Update: { id?: string; tenant_id?: string; staff_id?: string; starts_at?: string; ends_at?: string; reason?: string | null }
        Relationships: []
      }
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_booking: {
        Args: {
          p_tenant_id: string;
          p_service_id: string;
          p_start_time: string;
          p_end_time: string;
        };
        Returns: string;
      };
      claim_notification_deliveries: {
        Args: {
          p_booking_id?: string | null;
          p_limit?: number;
        };
        Returns: Database['public']['Tables']['notification_deliveries']['Row'][];
      };
      cancel_booking: {
        Args: {
          p_booking_id: string;
        };
        Returns: boolean;
      };
      get_booked_slots: {
        Args: {
          p_tenant_id: string;
          p_service_id: string;
          p_start_range: string;
          p_end_range: string;
        };
        Returns: {
          start_time: string;
          end_time: string;
        }[];
      };
      schedule_booking_reminders: {
        Args: {
          p_reminder_lead_time?: unknown;
          p_schedule_window?: unknown;
        };
        Returns: number;
      };
      };
    Enums: {
      booking_status: 'confirmed' | 'cancelled' | 'pending' | 'completed' | 'no_show';
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
