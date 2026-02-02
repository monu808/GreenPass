// File: src/app/api/payments/create-intent/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/paymentService';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

async function createSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}

// ---------------------------------------------------------------------------
// POST — create (or retry) a payment intent
// ---------------------------------------------------------------------------
// Idempotency logic:
//   • If the booking already has a SUCCEEDED payment  → reject (400).
//   • If the booking has only FAILED / CANCELLED payments → allow a new intent.
//   • If the booking has a PENDING / PROCESSING payment that is still within
//     the gateway's window → reject to avoid duplicate charges (400).
//   • Otherwise (first attempt, or all previous attempts are terminal) → proceed.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { booking_id, metadata, payment_method } = body;

    if (!booking_id) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch booking with destination details
    const { data: booking, error: bookingError } = await supabase
      .from('tourists')
      .select('*, destinations(*)')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (booking.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Guard: booking already cancelled (e.g. by the stale-booking cleanup job)
    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { error: 'This booking has been cancelled. Please create a new booking.' },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------------------------
    // Atomic idempotency: create payment record via DB function
    // ---------------------------------------------------------------------------
    // This uses a stored procedure with pg_advisory_xact_lock to atomically:
    // 1. Check for existing successful/active payments
    // 2. Create a new payment record if appropriate
    // The lock is transaction-scoped, so no manual unlock is needed.

    // First, calculate pricing
    const pricing = await paymentService.calculateBookingPrice(
      booking.destination_id,
      booking.group_size,
      booking.check_in_date,
      booking.carbon_footprint || 0
    );

    // Determine gateway
    const gateway = process.env.RAZORPAY_KEY_SECRET ? 'razorpay' : 'stripe';

    // Build metadata for the payment record
    const paymentMetadata = {
      ...metadata,
      destination_name: booking.destinations?.name,
      check_in_date: booking.check_in_date,
      check_out_date: booking.check_out_date,
      group_size: booking.group_size,
      customer_name: booking.name,
      customer_email: booking.email,
      customer_phone: booking.phone,
    };

    // Call the atomic function
    const { data: atomicResult, error: atomicError } = await (supabase.rpc as any)(
      'create_payment_intent_atomic',
      {
        p_booking_id: booking_id,
        p_user_id: user.id,
        p_amount: pricing.total_amount,
        p_currency: 'INR',
        p_gateway: gateway,
        p_payment_method: payment_method || null,
        p_metadata: paymentMetadata,
      }
    );

    if (atomicError) {
      logger.error(
        'Error calling create_payment_intent_atomic',
        atomicError,
        { component: 'payments-create-intent-route', operation: 'createIntentAtomic', metadata: { booking_id } }
      );
      return NextResponse.json(
        { error: 'Failed to create payment intent' },
        { status: 500 }
      );
    }

    // Handle the result status from the atomic function
    const result = atomicResult as {
      status: string;
      message: string;
      payment_id?: string;
      existing_payment_id?: string;
      retry_allowed?: boolean;
      previous_attempts?: number;
      error_code?: string;
    };

    switch (result.status) {
      case 'lock_contention':
        // Another request is creating a payment intent - return 409 Conflict
        return NextResponse.json(
          { error: result.message },
          { status: 409 }
        );

      case 'already_paid':
        // Booking already has a successful payment
        return NextResponse.json(
          { error: result.message },
          { status: 400 }
        );

      case 'active_payment':
        // An active (non-terminal) payment exists
        return NextResponse.json(
          { error: result.message },
          { status: 400 }
        );

      case 'error':
        // Database error during creation
        logger.error(
          'Database error in create_payment_intent_atomic',
          null,
          {
            component: 'payments-create-intent-route',
            operation: 'createIntentAtomic',
            metadata: { booking_id, errorMessage: result.message, errorCode: result.error_code }
          }
        );
        return NextResponse.json(
          { error: 'Failed to create payment intent' },
          { status: 500 }
        );

      case 'success':
        // Payment record created successfully - now create the gateway order
        if (result.previous_attempts && result.previous_attempts > 0) {
          logger.info(
            'Retrying payment intent after previous terminal payment(s)',
            { component: 'payments-create-intent-route', operation: 'retryIntent', metadata: { booking_id, previousAttempts: result.previous_attempts } }
          );
        }

        // Create gateway-specific order/intent
        const paymentIntent = await paymentService.createGatewayOrder(
          result.payment_id!,
          pricing.total_amount,
          'INR',
          booking
        );

        return NextResponse.json({
          success: true,
          payment_intent: paymentIntent,
          pricing,
        });

      default:
        logger.error(
          'Unexpected status from create_payment_intent_atomic',
          null,
          { component: 'payments-create-intent-route', operation: 'createIntentAtomic', metadata: { booking_id, status: result.status } }
        );
        return NextResponse.json(
          { error: 'Unexpected error creating payment intent' },
          { status: 500 }
        );
    }
  } catch (error: any) {
    logger.error(
      'Error creating payment intent',
      error,
      { component: 'payments-create-intent-route', operation: 'createIntent' }
    );
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// GET — fetch existing payments for a booking (used by payment page recovery)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  let bookingId: string | null = null;

  try {
    const searchParams = request.nextUrl.searchParams;
    bookingId = searchParams.get('booking_id');

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: booking, error: bookingError } = await supabase
      .from('tourists')
      .select('user_id')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (booking.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const payments = await paymentService.getPaymentsByBooking(bookingId);

    return NextResponse.json({
      success: true,
      payments,
    });
  } catch (error: any) {
    logger.error(
      'Error fetching payments',
      error,
      { component: 'payments-create-intent-route', operation: 'fetchPayments', metadata: { bookingId } }
    );
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}