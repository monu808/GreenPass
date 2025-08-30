export interface Database {
  public: {
    Tables: {
      tourists: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string;
          id_proof: string;
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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone: string;
          id_proof: string;
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
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string;
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
          type: 'capacity' | 'weather' | 'emergency' | 'maintenance';
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
          type: 'capacity' | 'weather' | 'emergency' | 'maintenance';
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
          type?: 'capacity' | 'weather' | 'emergency' | 'maintenance';
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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          role?: 'tourist' | 'admin' | 'supervisor' | 'operator';
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          role?: 'tourist' | 'admin' | 'supervisor' | 'operator';
          is_admin?: boolean;
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
