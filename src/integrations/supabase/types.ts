export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          created_at: string
          current_value: number | null
          dryer_id: string
          id: string
          message: string
          notes: string | null
          resolved_at: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          status: Database["public"]["Enums"]["alert_status"]
          threshold_value: number | null
          type: string
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          current_value?: number | null
          dryer_id: string
          id?: string
          message: string
          notes?: string | null
          resolved_at?: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          status?: Database["public"]["Enums"]["alert_status"]
          threshold_value?: number | null
          type: string
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          current_value?: number | null
          dryer_id?: string
          id?: string
          message?: string
          notes?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          status?: Database["public"]["Enums"]["alert_status"]
          threshold_value?: number | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_dryer_id_fkey"
            columns: ["dryer_id"]
            isOneToOne: false
            referencedRelation: "dryers"
            referencedColumns: ["id"]
          },
        ]
      }
      dryer_owners: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          farm_business_name: string | null
          id: string
          id_number: string | null
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          farm_business_name?: string | null
          id?: string
          id_number?: string | null
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          farm_business_name?: string | null
          id?: string
          id_number?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      dryers: {
        Row: {
          active_alerts_count: number | null
          assigned_technician_id: string | null
          battery_capacity_ah: number | null
          battery_level: number | null
          battery_voltage: number | null
          created_at: string
          current_preset_id: string | null
          deployment_date: string
          dryer_id: string
          id: string
          last_communication: string | null
          location_address: string | null
          location_latitude: number | null
          location_longitude: number | null
          num_fans: number | null
          num_heaters: number | null
          num_humidity_sensors: number | null
          num_temp_sensors: number | null
          owner_id: string | null
          region_id: string | null
          serial_number: string
          signal_strength: number | null
          solar_capacity_w: number | null
          status: Database["public"]["Enums"]["dryer_status"]
          total_runtime_hours: number | null
          updated_at: string
        }
        Insert: {
          active_alerts_count?: number | null
          assigned_technician_id?: string | null
          battery_capacity_ah?: number | null
          battery_level?: number | null
          battery_voltage?: number | null
          created_at?: string
          current_preset_id?: string | null
          deployment_date: string
          dryer_id: string
          id?: string
          last_communication?: string | null
          location_address?: string | null
          location_latitude?: number | null
          location_longitude?: number | null
          num_fans?: number | null
          num_heaters?: number | null
          num_humidity_sensors?: number | null
          num_temp_sensors?: number | null
          owner_id?: string | null
          region_id?: string | null
          serial_number: string
          signal_strength?: number | null
          solar_capacity_w?: number | null
          status?: Database["public"]["Enums"]["dryer_status"]
          total_runtime_hours?: number | null
          updated_at?: string
        }
        Update: {
          active_alerts_count?: number | null
          assigned_technician_id?: string | null
          battery_capacity_ah?: number | null
          battery_level?: number | null
          battery_voltage?: number | null
          created_at?: string
          current_preset_id?: string | null
          deployment_date?: string
          dryer_id?: string
          id?: string
          last_communication?: string | null
          location_address?: string | null
          location_latitude?: number | null
          location_longitude?: number | null
          num_fans?: number | null
          num_heaters?: number | null
          num_humidity_sensors?: number | null
          num_temp_sensors?: number | null
          owner_id?: string | null
          region_id?: string | null
          serial_number?: string
          signal_strength?: number | null
          solar_capacity_w?: number | null
          status?: Database["public"]["Enums"]["dryer_status"]
          total_runtime_hours?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dryers_assigned_technician_id_fkey"
            columns: ["assigned_technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dryers_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "dryer_owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dryers_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_current_preset"
            columns: ["current_preset_id"]
            isOneToOne: false
            referencedRelation: "presets"
            referencedColumns: ["id"]
          },
        ]
      }
      presets: {
        Row: {
          created_at: string
          crop_type: string
          description: string | null
          duration_hours: number
          fan_speed_rpm: number
          id: string
          is_active: boolean | null
          max_temp_threshold: number | null
          min_temp_threshold: number | null
          preset_id: string
          region: string
          target_humidity_pct: number
          target_temp_c: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          crop_type: string
          description?: string | null
          duration_hours: number
          fan_speed_rpm: number
          id?: string
          is_active?: boolean | null
          max_temp_threshold?: number | null
          min_temp_threshold?: number | null
          preset_id: string
          region: string
          target_humidity_pct: number
          target_temp_c: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          crop_type?: string
          description?: string | null
          duration_hours?: number
          fan_speed_rpm?: number
          id?: string
          is_active?: boolean | null
          max_temp_threshold?: number | null
          min_temp_threshold?: number | null
          preset_id?: string
          region?: string
          target_humidity_pct?: number
          target_temp_c?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      regions: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      sensor_readings: {
        Row: {
          active_preset_id: string | null
          ambient_temp: number | null
          battery_level: number | null
          battery_voltage: number | null
          chamber_temp: number | null
          charging_status: string | null
          created_at: string
          door_status: boolean | null
          dryer_id: string
          external_humidity: number | null
          fan_speed_rpm: number | null
          fan_status: boolean | null
          heater_status: boolean | null
          heater_temp: number | null
          id: string
          internal_humidity: number | null
          power_consumption_w: number | null
          solar_voltage: number | null
          timestamp: string
        }
        Insert: {
          active_preset_id?: string | null
          ambient_temp?: number | null
          battery_level?: number | null
          battery_voltage?: number | null
          chamber_temp?: number | null
          charging_status?: string | null
          created_at?: string
          door_status?: boolean | null
          dryer_id: string
          external_humidity?: number | null
          fan_speed_rpm?: number | null
          fan_status?: boolean | null
          heater_status?: boolean | null
          heater_temp?: number | null
          id?: string
          internal_humidity?: number | null
          power_consumption_w?: number | null
          solar_voltage?: number | null
          timestamp?: string
        }
        Update: {
          active_preset_id?: string | null
          ambient_temp?: number | null
          battery_level?: number | null
          battery_voltage?: number | null
          chamber_temp?: number | null
          charging_status?: string | null
          created_at?: string
          door_status?: boolean | null
          dryer_id?: string
          external_humidity?: number | null
          fan_speed_rpm?: number | null
          fan_status?: boolean | null
          heater_status?: boolean | null
          heater_temp?: number | null
          id?: string
          internal_humidity?: number | null
          power_consumption_w?: number | null
          solar_voltage?: number | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "sensor_readings_active_preset_id_fkey"
            columns: ["active_preset_id"]
            isOneToOne: false
            referencedRelation: "presets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sensor_readings_dryer_id_fkey"
            columns: ["dryer_id"]
            isOneToOne: false
            referencedRelation: "dryers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          region: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          region?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          region?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_profile: {
        Args: Record<string, never>
        Returns: Database["public"]["Tables"]["profiles"]["Row"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id?: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: { _user_id?: string }
        Returns: boolean
      }
    }
    Enums: {
      alert_severity: "critical" | "warning" | "info"
      alert_status: "active" | "acknowledged" | "resolved" | "dismissed"
      app_role:
        | "super_admin"
        | "admin"
        | "regional_manager"
        | "field_technician"
      dryer_status:
        | "active"
        | "idle"
        | "offline"
        | "maintenance"
        | "decommissioned"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      alert_severity: ["critical", "warning", "info"],
      alert_status: ["active", "acknowledged", "resolved", "dismissed"],
      app_role: [
        "super_admin",
        "admin",
        "regional_manager",
        "field_technician",
      ],
      dryer_status: [
        "active",
        "idle",
        "offline",
        "maintenance",
        "decommissioned",
      ],
    },
  },
} as const
