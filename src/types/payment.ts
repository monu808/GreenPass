// Payment-related types and interfaces

export type PaymentStatus =
  | 'pending'           // Payment intent created, awaiting user action
  | 'processing'        // Payment being processed by gateway
  | 'succeeded'         // Payment completed successfully
  | 'failed'            // Payment failed
  | 'cancelled'         // Payment cancelled by user
  | 'refunded'          // Payment refunded (full or partial)
  | 'requires_action';  // Requires additional authentication (3D Secure)

export type PaymentMethod =
  | 'card'
  | 'upi'
  | 'netbanking'
  | 'wallet';

export type RefundStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export type PaymentGateway = 'razorpay' | 'stripe';

export interface Payment {
  id: string;
  booking_id: string;
  user_id: string;
  amount: number;                    // Amount in smallest currency unit (paise for INR)
  currency: string;                  // ISO currency code (INR, USD, etc.)
  status: PaymentStatus;
  payment_method?: PaymentMethod;
  gateway: PaymentGateway;
  gateway_payment_id?: string | null;  // ID from payment gateway
  gateway_order_id?: string | null;    // Order ID from payment gateway
  metadata?: PaymentMetadata | null;
  failure_reason?: string | null;
  created_at: string;
  updated_at: string;
  paid_at?: string | null;
}

export interface PaymentMetadata {
  destination_name?: string;
  check_in_date?: string;
  check_out_date?: string;
  group_size?: number;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  carbon_offset_amount?: number;
  eco_points_earned?: number;
}

export interface Refund {
  id: string;
  payment_id: string;
  booking_id: string;
  amount: number;                    // Refund amount in smallest currency unit
  reason: string;
  status: RefundStatus;
  gateway_refund_id?: string | null;
  processed_by?: string | null;      // Admin user ID who processed refund
  notes?: string | null;
  created_at: string;
  updated_at: string;
  processed_at?: string | null;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  client_secret?: string;             // For client-side payment completion
  gateway_data: RazorpayOrderData | StripeIntentData;
}

export interface RazorpayOrderData {
  order_id: string;
  key_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
}

export interface StripeIntentData {
  client_secret: string;
  publishable_key: string;
}

export interface PaymentReceipt {
  id: string;
  payment_id: string;
  booking_id: string;
  receipt_number: string;
  amount: number;
  currency: string;
  paid_at: string;
  customer_details: {
    name: string;
    email: string;
    phone: string;
  };
  booking_details: {
    destination: string;
    check_in: string;
    check_out: string;
    group_size: number;
  };
  gateway_details: {
    gateway: PaymentGateway;
    transaction_id: string;
    payment_method: string;
  };
}

export interface PaymentStatistics {
  total_revenue: number;
  total_transactions: number;
  successful_payments: number;
  failed_payments: number;
  pending_payments: number;
  total_refunds: number;
  refund_amount: number;
  average_transaction_value: number;
  payment_method_breakdown: Record<PaymentMethod, number>;
  monthly_revenue: Array<{
    month: string;
    revenue: number;
    transactions: number;
  }>;
}

export interface CreatePaymentIntentInput {
  booking_id: string;
  amount: number;
  currency?: string;
  payment_method?: PaymentMethod;
  metadata?: PaymentMetadata;
}

export interface ProcessRefundInput {
  payment_id: string;
  amount?: number;  // If not provided, full refund
  reason: string;
  notes?: string;
}

export interface PaymentWebhookEvent {
  event_type: string;
  gateway: PaymentGateway;
  payment_id?: string;
  order_id?: string;
  status: PaymentStatus;
  metadata?: Record<string, any>;
  signature?: string;
}

// Pricing configuration
export interface PricingConfig {
  base_fee_per_person: number;       // Base fee per tourist
  destination_multipliers: Record<string, number>; // Sensitivity-based pricing
  seasonal_multipliers: Record<string, number>;    // Peak/off-peak pricing
  group_discounts: Array<{
    min_size: number;
    discount_percentage: number;
  }>;
  carbon_offset_fee_per_kg: number;  // Optional carbon offset pricing
  processing_fee_percentage: number;  // Gateway processing fee
}

// Booking pricing breakdown
export interface BookingPricing {
  base_amount: number;
  destination_fee: number;
  seasonal_adjustment: number;
  group_discount: number;
  carbon_offset_fee: number;
  processing_fee: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  breakdown: string[];  // Human-readable breakdown
}