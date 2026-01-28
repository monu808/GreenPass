import { supabase } from './supabase';
import { Database } from '@/types/database';
import {
  Payment,
  PaymentStatus,
  PaymentIntent,
  PaymentReceipt,
  Refund,
  RefundStatus,
  CreatePaymentIntentInput,
  ProcessRefundInput,
  PaymentStatistics,
  BookingPricing,
  PaymentGateway,
  RazorpayOrderData,
} from '@/types/payment';

type DbPayment = Database['public']['Tables']['payments']['Row'];
type DbRefund = Database['public']['Tables']['refunds']['Row'];

const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

class PaymentService {
  private gateway: PaymentGateway;

  constructor() {
    // Default to Razorpay for Indian market, fallback to Stripe
    this.gateway = RAZORPAY_KEY_ID ? 'razorpay' : 'stripe';
  }

  /**
   * Calculate pricing for a booking
   */
  async calculateBookingPrice(
    destinationId: string,
    groupSize: number,
    checkInDate: string,
    carbonFootprint: number = 0
  ): Promise<BookingPricing> {
    if (!supabase) {
      throw new Error('Payment service unavailable');
    }

    try {
      // Call database function to calculate price
      const { data, error } = await supabase.rpc('calculate_booking_price', {
        p_destination_id: destinationId,
        p_group_size: groupSize,
        p_check_in_date: checkInDate,
        p_carbon_footprint: carbonFootprint,
      });

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Failed to calculate booking price');
      }

      const pricing = data[0];
      
      return {
        base_amount: pricing.base_amount,
        destination_fee: pricing.destination_fee,
        seasonal_adjustment: pricing.seasonal_adjustment,
        group_discount: pricing.group_discount,
        carbon_offset_fee: pricing.carbon_offset_fee,
        processing_fee: pricing.processing_fee,
        tax_amount: pricing.tax_amount,
        total_amount: pricing.total_amount,
        currency: 'INR',
        breakdown: this.generatePriceBreakdown(pricing),
      };
    } catch (error) {
      console.error('Error calculating booking price:', error);
      throw new Error('Failed to calculate booking price');
    }
  }

  /**
   * Generate human-readable price breakdown
   */
  private generatePriceBreakdown(pricing: any): string[] {
    const breakdown: string[] = [];
    const formatAmount = (amount: number) => `₹${(amount / 100).toFixed(2)}`;

    breakdown.push(`Base Fee: ${formatAmount(pricing.base_amount)}`);
    
    if (pricing.destination_fee !== 0) {
      breakdown.push(`Destination Fee: ${formatAmount(pricing.destination_fee)}`);
    }
    
    if (pricing.seasonal_adjustment !== 0) {
      breakdown.push(`Seasonal Adjustment: ${formatAmount(pricing.seasonal_adjustment)}`);
    }
    
    if (pricing.group_discount !== 0) {
      breakdown.push(`Group Discount: ${formatAmount(Math.abs(pricing.group_discount))}`);
    }
    
    if (pricing.carbon_offset_fee !== 0) {
      breakdown.push(`Carbon Offset: ${formatAmount(pricing.carbon_offset_fee)}`);
    }
    
    if (pricing.processing_fee !== 0) {
      breakdown.push(`Processing Fee: ${formatAmount(pricing.processing_fee)}`);
    }
    
    if (pricing.tax_amount !== 0) {
      breakdown.push(`Tax: ${formatAmount(pricing.tax_amount)}`);
    }
    
    breakdown.push(`Total: ${formatAmount(pricing.total_amount)}`);
    
    return breakdown;
  }

  /**
   * Create a payment intent for a booking
   */
  async createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntent> {
    if (!supabase) {
      throw new Error('Payment service unavailable');
    }

    try {
      // Get booking details
      const { data: booking, error: bookingError } = await supabase
        .from('tourists')
        .select('*, destinations(*)')
        .eq('id', input.booking_id)
        .single();

      if (bookingError || !booking) {
        throw new Error('Booking not found');
      }

      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          booking_id: input.booking_id,
          user_id: booking.user_id,
          amount: input.amount,
          currency: input.currency || 'INR',
          status: 'pending',
          gateway: this.gateway,
          metadata: input.metadata || {},
        })
        .select()
        .single();

      if (paymentError || !payment) {
        throw new Error('Failed to create payment record');
      }

      // Create gateway-specific order
      if (this.gateway === 'razorpay') {
        return await this.createRazorpayOrder(payment as any, booking);
      } else {
        return await this.createStripeIntent(payment as any);
      }
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  /**
   * Create Razorpay order
   */
  private async createRazorpayOrder(payment: DbPayment, booking: any): Promise<PaymentIntent> {
    try {
      // In production, this should call Razorpay API
      // For now, creating a mock order structure
      const Razorpay = await import('razorpay').then(m => m.default).catch(() => null);
      
      if (!Razorpay || !RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
        throw new Error('Razorpay not configured');
      }

      const razorpay = new Razorpay({
        key_id: RAZORPAY_KEY_ID,
        key_secret: RAZORPAY_KEY_SECRET,
      });

      const order = await razorpay.orders.create({
        amount: payment.amount,
        currency: payment.currency,
        receipt: `receipt_${payment.id}`,
        notes: {
          booking_id: payment.booking_id,
          payment_id: payment.id,
        },
      });

      // Update payment with gateway order ID
      await supabase
        ?.from('payments')
        .update({ gateway_order_id: order.id })
        .eq('id', payment.id);

      const orderData: RazorpayOrderData = {
        order_id: order.id,
        key_id: RAZORPAY_KEY_ID,
        amount: payment.amount,
        currency: payment.currency,
        name: 'GreenPass Tourism',
        description: `Booking for ${booking.destinations?.name || 'destination'}`,
        prefill: {
          name: booking.name,
          email: booking.email,
          contact: booking.phone,
        },
      };

      return {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        gateway_data: orderData,
      };
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw error;
    }
  }

  /**
   * Create Stripe payment intent
   */
  private async createStripeIntent(payment: DbPayment): Promise<PaymentIntent> {
    try {
      const Stripe = await import('stripe').then(m => m.default).catch(() => null);
      
      if (!Stripe || !STRIPE_SECRET_KEY || !STRIPE_PUBLISHABLE_KEY) {
        throw new Error('Stripe not configured');
      }

      const stripe = new Stripe(STRIPE_SECRET_KEY, {
        apiVersion: '2024-12-18.acacia',
      });

      const intent = await stripe.paymentIntents.create({
        amount: payment.amount,
        currency: payment.currency.toLowerCase(),
        metadata: {
          booking_id: payment.booking_id,
          payment_id: payment.id,
        },
      });

      // Update payment with gateway payment ID
      await supabase
        ?.from('payments')
        .update({ gateway_payment_id: intent.id })
        .eq('id', payment.id);

      return {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        client_secret: intent.client_secret || undefined,
        gateway_data: {
          client_secret: intent.client_secret || '',
          publishable_key: STRIPE_PUBLISHABLE_KEY,
        },
      };
    } catch (error) {
      console.error('Error creating Stripe intent:', error);
      throw error;
    }
  }

  /**
   * Verify and update payment status from webhook
   */
  async handlePaymentWebhook(
    gatewayPaymentId: string,
    status: PaymentStatus,
    paymentMethod?: string
  ): Promise<void> {
    if (!supabase) {
      throw new Error('Payment service unavailable');
    }

    try {
      // Find payment by gateway ID
      const { data: payment, error: fetchError } = await supabase
        .from('payments')
        .select('*')
        .eq('gateway_payment_id', gatewayPaymentId)
        .single();

      if (fetchError || !payment) {
        console.error('Payment not found for webhook:', gatewayPaymentId);
        return;
      }

      // Update payment status
      const updates: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (paymentMethod) {
        updates.payment_method = paymentMethod;
      }

      if (status === 'succeeded') {
        updates.paid_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('payments')
        .update(updates)
        .eq('id', payment.id);

      if (updateError) {
        throw updateError;
      }

      // Update booking status based on payment
      if (status === 'succeeded') {
        await supabase
          .from('tourists')
          .update({
            payment_status: 'paid',
            payment_id: payment.id,
            payment_amount: payment.amount,
            status: 'approved', // Auto-approve on successful payment
          })
          .eq('id', payment.booking_id);

        // Generate receipt
        await this.generateReceipt(payment.id);
      } else if (status === 'failed' || status === 'cancelled') {
        await supabase
          .from('tourists')
          .update({ payment_status: status })
          .eq('id', payment.booking_id);
      }
    } catch (error) {
      console.error('Error handling payment webhook:', error);
      throw error;
    }
  }

  /**
   * Generate payment receipt
   */
  async generateReceipt(paymentId: string): Promise<PaymentReceipt | null> {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('payment_summary')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (error || !data) {
        throw new Error('Payment not found');
      }

      const receiptNumber = `RCP-${Date.now()}-${paymentId.slice(0, 8)}`;

      // Create receipt record
      await supabase.from('payment_receipts').insert({
        payment_id: paymentId,
        booking_id: data.booking_id,
        receipt_number: receiptNumber,
      });

      return {
        id: paymentId,
        payment_id: paymentId,
        booking_id: data.booking_id,
        receipt_number: receiptNumber,
        amount: data.amount,
        currency: data.currency,
        paid_at: data.paid_at,
        customer_details: {
          name: data.customer_name,
          email: data.customer_email,
          phone: data.customer_phone,
        },
        booking_details: {
          destination: data.destination_name,
          check_in: data.check_in_date,
          check_out: data.check_out_date,
          group_size: data.group_size,
        },
        gateway_details: {
          gateway: data.gateway,
          transaction_id: data.gateway_payment_id || data.gateway_order_id || '',
          payment_method: data.payment_method || 'card',
        },
      };
    } catch (error) {
      console.error('Error generating receipt:', error);
      return null;
    }
  }

  /**
   * Process refund
   */
  async processRefund(input: ProcessRefundInput, adminUserId: string): Promise<Refund> {
    if (!supabase) {
      throw new Error('Payment service unavailable');
    }

    try {
      // Get payment details
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', input.payment_id)
        .single();

      if (paymentError || !payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'succeeded') {
        throw new Error('Can only refund successful payments');
      }

      const refundAmount = input.amount || payment.amount;

      // Create refund record
      const { data: refund, error: refundError } = await supabase
        .from('refunds')
        .insert({
          payment_id: input.payment_id,
          booking_id: payment.booking_id,
          amount: refundAmount,
          reason: input.reason,
          notes: input.notes,
          processed_by: adminUserId,
          status: 'processing',
        })
        .select()
        .single();

      if (refundError || !refund) {
        throw new Error('Failed to create refund record');
      }

      // Process gateway refund
      try {
        if (this.gateway === 'razorpay') {
          await this.processRazorpayRefund(payment as any, refundAmount);
        } else {
          await this.processStripeRefund(payment as any, refundAmount);
        }

        // Update refund status
        await supabase
          .from('refunds')
          .update({
            status: 'succeeded',
            processed_at: new Date().toISOString(),
          })
          .eq('id', refund.id);

        // Update payment status
        await supabase
          .from('payments')
          .update({ status: 'refunded' })
          .eq('id', input.payment_id);

        // Update booking payment status
        await supabase
          .from('tourists')
          .update({ payment_status: 'refunded', status: 'cancelled' })
          .eq('id', payment.booking_id);

        return refund as any;
      } catch (gatewayError) {
        // Update refund status to failed
        await supabase
          .from('refunds')
          .update({ status: 'failed' })
          .eq('id', refund.id);

        throw gatewayError;
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }

  /**
   * Process Razorpay refund
   */
  private async processRazorpayRefund(payment: DbPayment, amount: number): Promise<void> {
    const Razorpay = await import('razorpay').then(m => m.default).catch(() => null);
    
    if (!Razorpay || !RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay not configured');
    }

    const razorpay = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });

    if (!payment.gateway_payment_id) {
      throw new Error('Gateway payment ID not found');
    }

    await razorpay.payments.refund(payment.gateway_payment_id, {
      amount,
    });
  }

  /**
   * Process Stripe refund
   */
  private async processStripeRefund(payment: DbPayment, amount: number): Promise<void> {
    const Stripe = await import('stripe').then(m => m.default).catch(() => null);
    
    if (!Stripe || !STRIPE_SECRET_KEY) {
      throw new Error('Stripe not configured');
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    });

    if (!payment.gateway_payment_id) {
      throw new Error('Gateway payment ID not found');
    }

    await stripe.refunds.create({
      payment_intent: payment.gateway_payment_id,
      amount,
    });
  }

  /**
   * Get payment statistics
   */
  async getPaymentStatistics(
    startDate?: Date,
    endDate?: Date
  ): Promise<PaymentStatistics | null> {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase.rpc('get_payment_statistics', {
        p_start_date: startDate?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        p_end_date: endDate?.toISOString() || new Date().toISOString(),
      });

      if (error) throw error;

      // Get payment method breakdown
      const { data: methodData } = await supabase
        .from('payments')
        .select('payment_method, amount')
        .eq('status', 'succeeded')
        .gte('created_at', startDate?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .lte('created_at', endDate?.toISOString() || new Date().toISOString());

      const methodBreakdown: Record<string, number> = {
        card: 0,
        upi: 0,
        netbanking: 0,
        wallet: 0,
      };

      methodData?.forEach(payment => {
        if (payment.payment_method) {
          methodBreakdown[payment.payment_method] = 
            (methodBreakdown[payment.payment_method] || 0) + payment.amount;
        }
      });

      return {
        total_revenue: Number(data[0].total_revenue),
        total_transactions: Number(data[0].total_transactions),
        successful_payments: Number(data[0].successful_payments),
        failed_payments: Number(data[0].failed_payments),
        pending_payments: Number(data[0].pending_payments),
        total_refunds: Number(data[0].total_refunds),
        refund_amount: Number(data[0].refund_amount),
        average_transaction_value: Number(data[0].average_transaction_value),
        payment_method_breakdown: methodBreakdown as any,
        monthly_revenue: [], // Can be enhanced with more detailed query
      };
    } catch (error) {
      console.error('Error fetching payment statistics:', error);
      return null;
    }
  }

  /**
   * Get payment by ID
   */
  async getPayment(paymentId: string): Promise<Payment | null> {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (error || !data) return null;

      return data as any;
    } catch (error) {
      console.error('Error fetching payment:', error);
      return null;
    }
  }

  /**
   * Get payments for a booking
   */
  async getPaymentsByBooking(bookingId: string): Promise<Payment[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];

      return data as any[];
    } catch (error) {
      console.error('Error fetching payments:', error);
      return [];
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
export default paymentService;