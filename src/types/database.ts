// File: src/types/database.ts

import { SustainabilityFeatures } from './index';

export type Database = {
  public: {
    Tables: {
      tourists: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string;
          age?: number;
          gender?: string;
          address?: string;
          pin_code?: string;
          id_proof_type?: string;
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
          // Payment-related fields (added via payment-schema.sql ALTER TABLE)
          payment_status: 'unpaid' | 'pending' | 'paid' | 'refunded' | 'failed' | null;
          payment_amount: number | null;
          payment_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone: string;
          age?: number;
          gender?: string;
          address?: string;
          pin_code?: string;
          id_proof_type?: string;
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
          // Payment-related fields
          payment_status?: 'unpaid' | 'pending' | 'paid' | 'refunded' | 'failed' | null;
          payment_amount?: number | null;
          payment_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string;
          age?: number;
          gender?: string;
          address?: string;
          pin_code?: string;
          id_proof_type?: string;
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
          // Payment-related fields
          payment_status?: 'unpaid' | 'pending' | 'paid' | 'refunded' | 'failed' | null;
          payment_amount?: number | null;
          payment_id?: string | null;
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
          sustainability_features?: SustainabilityFeatures | null;
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
          sustainability_features?: SustainabilityFeatures | null;
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
          sustainability_features?: SustainabilityFeatures | null;
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

      payments: {
        Row: {
          id: string;
          booking_id: string;
          user_id: string;
          amount: number;
          currency: string;
          status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled' | 'refunded' | 'requires_action';
          payment_method: 'card' | 'upi' | 'netbanking' | 'wallet' | null;
          gateway: 'razorpay' | 'stripe';
          gateway_payment_id: string | null;
          gateway_order_id: string | null;
          metadata: any | null;
          failure_reason: string | null;
          created_at: string;
          updated_at: string;
          paid_at: string | null;
        };
        Insert: {
          id?: string;
          booking_id: string;
          user_id: string;
          amount: number;
          currency?: string;
          status?: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled' | 'refunded' | 'requires_action';
          payment_method?: 'card' | 'upi' | 'netbanking' | 'wallet' | null;
          gateway: 'razorpay' | 'stripe';
          gateway_payment_id?: string | null;
          gateway_order_id?: string | null;
          metadata?: any | null;
          failure_reason?: string | null;
          created_at?: string;
          updated_at?: string;
          paid_at?: string | null;
        };
        Update: {
          id?: string;
          booking_id?: string;
          user_id?: string;
          amount?: number;
          currency?: string;
          status?: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled' | 'refunded' | 'requires_action';
          payment_method?: 'card' | 'upi' | 'netbanking' | 'wallet' | null;
          gateway?: 'razorpay' | 'stripe';
          gateway_payment_id?: string | null;
          gateway_order_id?: string | null;
          metadata?: any | null;
          failure_reason?: string | null;
          created_at?: string;
          updated_at?: string;
          paid_at?: string | null;
        };
      };

      refunds: {
        Row: {
          id: string;
          payment_id: string;
          booking_id: string;
          amount: number;
          reason: string;
          status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
          gateway_refund_id: string | null;
          processed_by: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          processed_at: string | null;
        };
        Insert: {
          id?: string;
          payment_id: string;
          booking_id: string;
          amount: number;
          reason: string;
          status?: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
          gateway_refund_id?: string | null;
          processed_by?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          processed_at?: string | null;
        };
        Update: {
          id?: string;
          payment_id?: string;
          booking_id?: string;
          amount?: number;
          reason?: string;
          status?: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
          gateway_refund_id?: string | null;
          processed_by?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          processed_at?: string | null;
        };
      };

      payment_receipts: {
        Row: {
          id: string;
          payment_id: string;
          booking_id: string;
          receipt_number: string;
          receipt_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          payment_id: string;
          booking_id: string;
          receipt_number: string;
          receipt_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          payment_id?: string;
          booking_id?: string;
          receipt_number?: string;
          receipt_url?: string | null;
          created_at?: string;
        };
      };

      pricing_config: {
        Row: {
          id: string;
          base_fee_per_person: number;
          processing_fee_percentage: number;
          tax_percentage: number;
          destination_multipliers: any;
          seasonal_multipliers: any;
          group_discounts: any;
          carbon_offset_fee_per_kg: number;
          version: number;
          is_active: boolean;
          effective_from: string;
          effective_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          base_fee_per_person?: number;
          processing_fee_percentage?: number;
          tax_percentage?: number;
          destination_multipliers?: any;
          seasonal_multipliers?: any;
          group_discounts?: any;
          carbon_offset_fee_per_kg?: number;
          version?: number;
          is_active?: boolean;
          effective_from?: string;
          effective_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          base_fee_per_person?: number;
          processing_fee_percentage?: number;
          tax_percentage?: number;
          destination_multipliers?: any;
          seasonal_multipliers?: any;
          group_discounts?: any;
          carbon_offset_fee_per_kg?: number;
          version?: number;
          is_active?: boolean;
          effective_from?: string;
          effective_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Reviews table for user destination reviews
      reviews: {
        Row: {
          id: string;
          user_id: string;
          destination_id: string;
          rating: number;
          title: string;
          content: string;
          photos: string[];
          tags: string[];
          trip_type: 'solo' | 'couple' | 'family' | 'friends' | 'business';
          user_name: string;
          user_avatar: string | null;
          helpful_count: number;
          likes_count: number;
          is_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          destination_id: string;
          rating: number;
          title: string;
          content: string;
          photos?: string[];
          tags?: string[];
          trip_type: 'solo' | 'couple' | 'family' | 'friends' | 'business';
          user_name: string;
          user_avatar?: string | null;
          helpful_count?: number;
          likes_count?: number;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          destination_id?: string;
          rating?: number;
          title?: string;
          content?: string;
          photos?: string[];
          tags?: string[];
          trip_type?: 'solo' | 'couple' | 'family' | 'friends' | 'business';
          user_name?: string;
          user_avatar?: string | null;
          helpful_count?: number;
          likes_count?: number;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Review likes table
      review_likes: {
        Row: {
          id: string;
          review_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          review_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          review_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      // Review helpful votes table
      review_helpful: {
        Row: {
          id: string;
          review_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          review_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          review_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      // Favorites table for saved destinations/activities
      favorites: {
        Row: {
          id: string;
          user_id: string;
          item_type: 'destination' | 'activity';
          item_id: string;
          notes: string | null;
          is_bucket_list: boolean;
          visited_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_type: 'destination' | 'activity';
          item_id: string;
          notes?: string | null;
          is_bucket_list?: boolean;
          visited_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          item_type?: 'destination' | 'activity';
          item_id?: string;
          notes?: string | null;
          is_bucket_list?: boolean;
          visited_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      payment_summary: {
        Row: {
          id: string;
          booking_id: string;
          user_id: string;
          amount: number;
          currency: string;
          payment_status: string;
          payment_method: string | null;
          gateway: string;
          created_at: string;
          paid_at: string | null;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          booking_status: string;
          destination_name: string;
          check_in_date: string;
          check_out_date: string;
          group_size: number;
          effective_status: string;
          gateway_payment_id: string | null;
          gateway_order_id: string | null;
        };
      };
    };
    Functions: {
      register_for_cleanup: {
        Args: {
          p_activity_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      award_eco_points: {
        Args: {
          p_user_id: string
          p_points: number
          p_description: string
        }
        Returns: boolean
      }
      update_user_eco_metrics: {
        Args: {
          p_user_id: string
          p_points_to_add: number
          p_offset_to_add: number
        }
        Returns: boolean
      }
      cancel_cleanup_registration: {
        Args: {
          p_registration_id: string
        }
        Returns: boolean
      }
      calculate_booking_price: {
        Args: {
          p_destination_id: string;
          p_group_size: number;
          p_check_in_date: string;
          p_carbon_footprint?: number;
        };
        Returns: Array<{
          base_amount: number;
          destination_fee: number;
          seasonal_adjustment: number;
          group_discount: number;
          carbon_offset_fee: number;
          processing_fee: number;
          tax_amount: number;
          total_amount: number;
        }>;
      };
      get_payment_statistics: {
        Args: {
          p_start_date: string;
          p_end_date: string;
        };
        Returns: Array<{
          total_revenue: number;
          total_transactions: number;
          successful_payments: number;
          failed_payments: number;
          pending_payments: number;
          total_refunds: number;
          refund_amount: number;
          average_transaction_value: number;
        }>;
      };
      // Cleanup function for stale unpaid bookings (added via migration)
      cleanup_stale_bookings: {
        Args: {
          p_expiry_minutes?: number;
        };
        Returns: number; // returns count of cancelled bookings
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}