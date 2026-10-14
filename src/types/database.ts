export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  core: {
    Tables: {
      calls: {
        Row: {
          created_at: string;
          direction: Database["core"]["Enums"]["call_direction"];
          duration_seconds: number;
          from_number: string;
          id: string;
          organization_id: string;
          outcome: Database["core"]["Enums"]["call_outcome"];
          retell_call_id: string | null;
          started_at: string;
          summary: string | null;
          to_number: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          direction?: Database["core"]["Enums"]["call_direction"];
          duration_seconds?: number;
          from_number: string;
          id?: string;
          organization_id: string;
          outcome: Database["core"]["Enums"]["call_outcome"];
          retell_call_id?: string | null;
          started_at: string;
          summary?: string | null;
          to_number: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          direction?: Database["core"]["Enums"]["call_direction"];
          duration_seconds?: number;
          from_number?: string;
          id?: string;
          organization_id?: string;
          outcome?: Database["core"]["Enums"]["call_outcome"];
          retell_call_id?: string | null;
          started_at?: string;
          summary?: string | null;
          to_number?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "calls_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organization_overview";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "calls_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      integration_events: {
        Row: {
          event_type: string;
          id: string;
          organization_id: string;
          payload: NonNullable<Json>;
          received_at: string;
          source: Database["core"]["Enums"]["event_source"];
        };
        ComputedFields: never;
        Insert: {
          event_type: string;
          id?: string;
          organization_id: string;
          payload?: NonNullable<Json>;
          received_at?: string;
          source: Database["core"]["Enums"]["event_source"];
        };
        Update: {
          event_type?: string;
          id?: string;
          organization_id?: string;
          payload?: NonNullable<Json>;
          received_at?: string;
          source?: Database["core"]["Enums"]["event_source"];
        };
        Relationships: [
          {
            foreignKeyName: "integration_events_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organization_overview";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "integration_events_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_members: {
        Row: {
          created_at: string;
          organization_id: string;
          role: Database["core"]["Enums"]["member_role"];
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          organization_id: string;
          role?: Database["core"]["Enums"]["member_role"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          organization_id?: string;
          role?: Database["core"]["Enums"]["member_role"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organization_overview";
            referencedColumns: ["organization_id"];
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          address: string | null;
          city: string | null;
          created_at: string;
          id: string;
          industry: Database["core"]["Enums"]["industry"];
          name: string;
          phone_e164: string | null;
          plan: string;
          slug: string;
          state: string | null;
          status: Database["core"]["Enums"]["organization_status"];
          timezone: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          address?: string | null;
          city?: string | null;
          created_at?: string;
          id?: string;
          industry: Database["core"]["Enums"]["industry"];
          name: string;
          phone_e164?: string | null;
          plan?: string;
          slug: string;
          state?: string | null;
          status?: Database["core"]["Enums"]["organization_status"];
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          city?: string | null;
          created_at?: string;
          id?: string;
          industry?: Database["core"]["Enums"]["industry"];
          name?: string;
          phone_e164?: string | null;
          plan?: string;
          slug?: string;
          state?: string | null;
          status?: Database["core"]["Enums"]["organization_status"];
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      platform_admins: {
        Row: {
          created_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      bookings: {
        Row: {
          assigned_to: string | null;
          booked_via: Database["core"]["Enums"]["booking_channel"] | null;
          contact_name: string | null;
          id: string | null;
          industry: Database["core"]["Enums"]["industry"] | null;
          organization_id: string | null;
          scheduled_end: string | null;
          scheduled_start: string | null;
          status: string | null;
          title: string | null;
        };
        ComputedFields: never;
        Relationships: [];
      };
      organization_overview: {
        Row: {
          ai_booked_pct: number | null;
          ai_bookings: number | null;
          calls_7d: number | null;
          city: string | null;
          contacts: number | null;
          industry: Database["core"]["Enums"]["industry"] | null;
          missed_calls_7d: number | null;
          name: string | null;
          organization_id: string | null;
          slug: string | null;
          state: string | null;
          status: Database["core"]["Enums"]["organization_status"] | null;
          total_bookings: number | null;
          upcoming_bookings_7d: number | null;
        };
        ComputedFields: never;
        Relationships: [];
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      booking_channel: "ai_call" | "manual" | "online";
      call_direction: "inbound" | "outbound";
      call_outcome: "booked" | "answered_question" | "transferred" | "missed" | "voicemail";
      event_source: "retell" | "n8n" | "manual";
      industry: "medical" | "field_service";
      member_role: "owner" | "admin" | "staff";
      organization_status: "active" | "onboarding" | "paused";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  field_service: {
    Tables: {
      customers: {
        Row: {
          created_at: string;
          full_name: string;
          id: string;
          organization_id: string;
          phone_e164: string;
          service_address: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          full_name: string;
          id?: string;
          organization_id: string;
          phone_e164: string;
          service_address?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          full_name?: string;
          id?: string;
          organization_id?: string;
          phone_e164?: string;
          service_address?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      job_visits: {
        Row: {
          created_at: string;
          id: string;
          job_id: string;
          organization_id: string;
          scheduled_end: string;
          scheduled_start: string;
          status: Database["field_service"]["Enums"]["visit_status"];
          technician_name: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          job_id: string;
          organization_id: string;
          scheduled_end: string;
          scheduled_start: string;
          status?: Database["field_service"]["Enums"]["visit_status"];
          technician_name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          job_id?: string;
          organization_id?: string;
          scheduled_end?: string;
          scheduled_start?: string;
          status?: Database["field_service"]["Enums"]["visit_status"];
          technician_name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "job_visits_organization_id_job_id_fkey";
            columns: ["organization_id", "job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      jobs: {
        Row: {
          booked_via: Database["core"]["Enums"]["booking_channel"];
          call_id: string | null;
          created_at: string;
          customer_id: string;
          description: string | null;
          id: string;
          organization_id: string;
          priority: Database["field_service"]["Enums"]["job_priority"];
          quoted_amount: number | null;
          service_type: string;
          status: Database["field_service"]["Enums"]["job_status"];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          booked_via?: Database["core"]["Enums"]["booking_channel"];
          call_id?: string | null;
          created_at?: string;
          customer_id: string;
          description?: string | null;
          id?: string;
          organization_id: string;
          priority?: Database["field_service"]["Enums"]["job_priority"];
          quoted_amount?: number | null;
          service_type: string;
          status?: Database["field_service"]["Enums"]["job_status"];
          updated_at?: string;
        };
        Update: {
          booked_via?: Database["core"]["Enums"]["booking_channel"];
          call_id?: string | null;
          created_at?: string;
          customer_id?: string;
          description?: string | null;
          id?: string;
          organization_id?: string;
          priority?: Database["field_service"]["Enums"]["job_priority"];
          quoted_amount?: number | null;
          service_type?: string;
          status?: Database["field_service"]["Enums"]["job_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "jobs_organization_id_customer_id_fkey";
            columns: ["organization_id", "customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      job_priority: "low" | "normal" | "urgent";
      job_status: "new" | "scheduled" | "in_progress" | "completed" | "cancelled";
      visit_status: "scheduled" | "in_progress" | "completed" | "cancelled";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  medical: {
    Tables: {
      appointments: {
        Row: {
          booked_via: Database["core"]["Enums"]["booking_channel"];
          call_id: string | null;
          created_at: string;
          id: string;
          organization_id: string;
          patient_id: string;
          provider_id: string;
          reason_for_visit: string | null;
          scheduled_end: string;
          scheduled_start: string;
          status: Database["medical"]["Enums"]["appointment_status"];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          booked_via?: Database["core"]["Enums"]["booking_channel"];
          call_id?: string | null;
          created_at?: string;
          id?: string;
          organization_id: string;
          patient_id: string;
          provider_id: string;
          reason_for_visit?: string | null;
          scheduled_end: string;
          scheduled_start: string;
          status?: Database["medical"]["Enums"]["appointment_status"];
          updated_at?: string;
        };
        Update: {
          booked_via?: Database["core"]["Enums"]["booking_channel"];
          call_id?: string | null;
          created_at?: string;
          id?: string;
          organization_id?: string;
          patient_id?: string;
          provider_id?: string;
          reason_for_visit?: string | null;
          scheduled_end?: string;
          scheduled_start?: string;
          status?: Database["medical"]["Enums"]["appointment_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "appointments_organization_id_patient_id_fkey";
            columns: ["organization_id", "patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "appointments_organization_id_provider_id_fkey";
            columns: ["organization_id", "provider_id"];
            isOneToOne: false;
            referencedRelation: "providers";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      patients: {
        Row: {
          created_at: string;
          date_of_birth: string | null;
          full_name: string;
          id: string;
          organization_id: string;
          phone_e164: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          date_of_birth?: string | null;
          full_name: string;
          id?: string;
          organization_id: string;
          phone_e164: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          date_of_birth?: string | null;
          full_name?: string;
          id?: string;
          organization_id?: string;
          phone_e164?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      providers: {
        Row: {
          created_at: string;
          full_name: string;
          id: string;
          organization_id: string;
          specialty: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          full_name: string;
          id?: string;
          organization_id: string;
          specialty?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          full_name?: string;
          id?: string;
          organization_id?: string;
          specialty?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      appointment_status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
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
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  core: {
    Enums: {
      booking_channel: ["ai_call", "manual", "online"],
      call_direction: ["inbound", "outbound"],
      call_outcome: ["booked", "answered_question", "transferred", "missed", "voicemail"],
      event_source: ["retell", "n8n", "manual"],
      industry: ["medical", "field_service"],
      member_role: ["owner", "admin", "staff"],
      organization_status: ["active", "onboarding", "paused"],
    },
  },
  field_service: {
    Enums: {
      job_priority: ["low", "normal", "urgent"],
      job_status: ["new", "scheduled", "in_progress", "completed", "cancelled"],
      visit_status: ["scheduled", "in_progress", "completed", "cancelled"],
    },
  },
  graphql_public: {
    Enums: {},
  },
  medical: {
    Enums: {
      appointment_status: ["scheduled", "confirmed", "completed", "cancelled", "no_show"],
    },
  },
  public: {
    Enums: {},
  },
} as const;
