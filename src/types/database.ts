export interface Database {
  public: {
    Tables: {
      tourists: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string;
          age: number;
          gender: 'male' | 'female' | 'other' | 'prefer-not-to-say';
          address: string;
          pin_code: string;
          id_proof_type: 'aadhaar' | 'pan' | 'passport' | 'driving-license' | 'voter-id';
          id_proof: string;
          group_name?: string | null;
          nationality: string;
          group_size: number;
          destination_id: string;
          check_in_date: string;
          check_out_date: string;
          status: 'pending' | 'approved' | 'checked-in' | 'checked-out' | 'cancelled';
          emergency_contact_name: string;
          emergency_contact_phone: string;
          emergency_contact_relationship: string;
          registration_date: string;
          user_id: string | null;
          carbon_footprint: number | null;
          origin_location_id: string | null;
          transport_type: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone: string;
          age: number;
          gender: 'male' | 'female' | 'other' | 'prefer-not-to-say';
          address: string;
          pin_code: string;
          id_proof_type: 'aadhaar' | 'pan' | 'passport' | 'driving-license' | 'voter-id';
          id_proof: string;
          group_name?: string | null;
          nationality: string;
          group_size: number;
          destination_id: string;
          check_in_date: string;
          check_out_date: string;
          status?: 'pending' | 'approved' | 'checked-in' | 'checked-out' | 'cancelled';
          emergency_contact_name: string;
          emergency_contact_phone: string;
          emergency_contact_relationship: string;
          registration_date?: string;
          user_id?: string | null;
          carbon_footprint?: number | null;
          origin_location_id?: string | null;
          transport_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string;
          age?: number;
          gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
          address?: string;
          pin_code?: string;
          id_proof_type?: 'aadhaar' | 'pan' | 'passport' | 'driving-license' | 'voter-id';
          id_proof?: string;
          nationality?: string;
          group_size?: number;
          destination_id?: string;
          check_in_date?: string;
          check_out_date?: string;
          status?: 'pending' | 'approved' | 'checked-in' | 'checked-out' | 'cancelled';
          emergency_contact_name?: string;
          emergency_contact_phone?: string;
          emergency_contact_relationship?: string;
          registration_date?: string;
          user_id?: string | null;
          carbon_footprint?: number | null;
          origin_location_id?: string | null;
          transport_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      destinations: {
        Row: {
          id: string;
          name: string;
          location: string;
          max_capacity: number;
          current_occupancy: number;
          description: string;
          guidelines: string[];
          is_active: boolean;
          ecological_sensitivity: 'low' | 'medium' | 'high' | 'critical';
          latitude: number;
          longitude: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          location: string;
          max_capacity: number;
          current_occupancy?: number;
          description: string;
          guidelines: string[];
          is_active?: boolean;
          ecological_sensitivity: 'low' | 'medium' | 'high' | 'critical';
          latitude: number;
          longitude: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          location?: string;
          max_capacity?: number;
          current_occupancy?: number;
          description?: string;
          guidelines?: string[];
          is_active?: boolean;
          ecological_sensitivity?: 'low' | 'medium' | 'high' | 'critical';
          latitude?: number;
          longitude?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      alerts: {
        Row: {
          id: string;
          type: 'capacity' | 'weather' | 'emergency' | 'maintenance' | 'ecological';
          title: string;
          message: string;
          severity: 'low' | 'medium' | 'high' | 'critical';
          destination_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: 'capacity' | 'weather' | 'emergency' | 'maintenance' | 'ecological';
          title: string;
          message: string;
          severity: 'low' | 'medium' | 'high' | 'critical';
          destination_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: 'capacity' | 'weather' | 'emergency' | 'maintenance' | 'ecological';
          title?: string;
          message?: string;
          severity?: 'low' | 'medium' | 'high' | 'critical';
          destination_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          role: 'tourist' | 'admin' | 'supervisor' | 'operator';
          is_admin: boolean;
          eco_points: number | null;
          total_carbon_offset: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          role?: 'tourist' | 'admin' | 'supervisor' | 'operator';
          is_admin?: boolean;
          eco_points?: number | null;
          total_carbon_offset?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          role?: 'tourist' | 'admin' | 'supervisor' | 'operator';
          is_admin?: boolean;
          eco_points?: number | null;
          total_carbon_offset?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      weather_data: {
        Row: {
          id: string;
          destination_id: string;
          temperature: number;
          humidity: number;
          pressure: number;
          weather_main: string;
          weather_description: string;
          wind_speed: number;
          wind_direction: number;
          visibility: number;
          recorded_at: string;
          created_at: string;
          // Alert fields
          alert_level: 'none' | 'low' | 'medium' | 'high' | 'critical';
          alert_message: string | null;
          alert_reason: string | null;
        };
        Insert: {
          id?: string;
          destination_id: string;
          temperature: number;
          humidity: number;
          pressure: number;
          weather_main: string;
          weather_description: string;
          wind_speed: number;
          wind_direction: number;
          visibility: number;
          recorded_at: string;
          created_at?: string;
          // Alert fields
          alert_level?: 'none' | 'low' | 'medium' | 'high' | 'critical';
          alert_message?: string | null;
          alert_reason?: string | null;
        };
        Update: {
          id?: string;
          destination_id?: string;
          temperature?: number;
          humidity?: number;
          pressure?: number;
          weather_main?: string;
          weather_description?: string;
          wind_speed?: number;
          wind_direction?: number;
          visibility?: number;
          recorded_at?: string;
          created_at?: string;
          // Alert fields
          alert_level?: 'none' | 'low' | 'medium' | 'high' | 'critical';
          alert_message?: string | null;
          alert_reason?: string | null;
        };
      };
      compliance_reports: {
        Row: {
          id: string;
          report_period: string;
          report_type: 'monthly' | 'quarterly';
          total_tourists: number;
          sustainable_capacity: number;
          compliance_score: number;
          waste_metrics: {
            total_waste: number;
            recycled_waste: number;
            waste_reduction_target: number;
          };
          carbon_footprint: number;
          ecological_impact_index: number;
          ecological_damage_indicators?: {
            soil_compaction: number;
            vegetation_disturbance: number;
            wildlife_disturbance: number;
            water_source_impact: number;
          };
          previous_period_score?: number;
          policy_violations_count: number;
          total_fines: number;
          status: 'pending' | 'approved';
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_period: string;
          report_type: 'monthly' | 'quarterly';
          total_tourists: number;
          sustainable_capacity: number;
          compliance_score: number;
          waste_metrics: {
            total_waste: number;
            recycled_waste: number;
            waste_reduction_target: number;
          };
          carbon_footprint: number;
          ecological_impact_index: number;
          ecological_damage_indicators?: {
            soil_compaction: number;
            vegetation_disturbance: number;
            wildlife_disturbance: number;
            water_source_impact: number;
          };
          previous_period_score?: number;
          policy_violations_count: number;
          total_fines: number;
          status?: 'pending' | 'approved';
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          report_period?: string;
          report_type?: 'monthly' | 'quarterly';
          total_tourists?: number;
          sustainable_capacity?: number;
          compliance_score?: number;
          waste_metrics?: {
            total_waste: number;
            recycled_waste: number;
            waste_reduction_target: number;
          };
          carbon_footprint?: number;
          ecological_impact_index?: number;
          ecological_damage_indicators?: {
            soil_compaction: number;
            vegetation_disturbance: number;
            wildlife_disturbance: number;
            water_source_impact: number;
          };
          previous_period_score?: number;
          policy_violations_count?: number;
          total_fines?: number;
          status?: 'pending' | 'approved';
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
        };
      };
      policy_violations: {
        Row: {
          id: string;
          destination_id: string;
          violation_type: string;
          description: string;
          severity: 'low' | 'medium' | 'high' | 'critical';
          fine_amount: number;
          status: 'pending' | 'paid' | 'contested';
          reported_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          destination_id: string;
          violation_type: string;
          description: string;
          severity: 'low' | 'medium' | 'high' | 'critical';
          fine_amount: number;
          status?: 'pending' | 'paid' | 'contested';
          reported_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          destination_id?: string;
          violation_type?: string;
          description?: string;
          severity?: 'low' | 'medium' | 'high' | 'critical';
          fine_amount?: number;
          status?: 'pending' | 'paid' | 'contested';
          reported_at?: string;
          created_at?: string;
        };
      };
      waste_data: {
        Row: {
          id: string;
          destination_id: string;
          waste_type: 'plastic' | 'glass' | 'metal' | 'organic' | 'paper' | 'other';
          quantity: number;
          unit: string;
          collected_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          destination_id: string;
          waste_type: 'plastic' | 'glass' | 'metal' | 'organic' | 'paper' | 'other';
          quantity: number;
          unit?: string;
          collected_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          destination_id?: string;
          waste_type?: 'plastic' | 'glass' | 'metal' | 'organic' | 'paper' | 'other';
          quantity?: number;
          unit?: string;
          collected_at?: string;
          created_at?: string;
        };
      };
      cleanup_activities: {
        Row: {
          id: string;
          destination_id: string;
          title: string;
          description: string;
          start_time: string;
          end_time: string;
          location: string;
          max_participants: number;
          current_participants: number;
          status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
          eco_points_reward: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          destination_id: string;
          title: string;
          description: string;
          start_time: string;
          end_time: string;
          location: string;
          max_participants: number;
          current_participants?: number;
          status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
          eco_points_reward?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          destination_id?: string;
          title?: string;
          description?: string;
          start_time?: string;
          end_time?: string;
          location?: string;
          max_participants?: number;
          current_participants?: number;
          status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
          eco_points_reward?: number;
          created_at?: string;
        };
      };
      cleanup_registrations: {
        Row: {
          id: string;
          activity_id: string;
          user_id: string;
          status: 'registered' | 'attended' | 'cancelled';
          registered_at: string;
          attended: boolean;
        };
        Insert: {
          id?: string;
          activity_id: string;
          user_id: string;
          status?: 'registered' | 'attended' | 'cancelled';
          registered_at?: string;
          attended?: boolean;
        };
        Update: {
          id?: string;
          activity_id?: string;
          user_id?: string;
          status?: 'registered' | 'attended' | 'cancelled';
          registered_at?: string;
          attended?: boolean;
        };
      };
      eco_points_transactions: {
        Row: {
          id: string;
          user_id: string;
          points: number;
          transaction_type: 'award' | 'redemption' | 'adjustment';
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          points: number;
          transaction_type: 'award' | 'redemption' | 'adjustment';
          description: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          points?: number;
          transaction_type?: 'award' | 'redemption' | 'adjustment';
          description?: string;
          created_at?: string;
        };
      };
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
