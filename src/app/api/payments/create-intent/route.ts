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
    // Idempotency: use advisory lock to prevent concurrent duplicate intents
    // ---------------------------------------------------------------------------
    // Acquire an advisory lock based on booking_id hash to serialize payment
    // intent creation for this booking across concurrent requests.
    const bookingHash = Buffer.from(booking_id, 'utf-8')
      .reduce((acc, byte) => (acc * 31 + byte) & 0x7fffffff, 0);

    const { data: lockAcquired } = await supabase.rpc('pg_try_advisory_lock', {
      key: bookingHash,
    });

    if (!lockAcquired) {
      // Another request is already creating a payment intent for this booking
      return NextResponse.json(
        { error: 'Payment intent creation already in progress. Please wait a moment and try again.' },
        { status: 409 }
      );
    }

    try {
      // Now that we hold the lock, inspect existing payments
      const existingPayments = await paymentService.getPaymentsByBooking(booking_id);

      // Already successfully paid → hard stop
      const successfulPayment = existingPayments.find(
        (p: { status: string }) => p.status === 'succeeded'
      );
      if (successfulPayment) {
        return NextResponse.json(
          { error: 'Payment already completed for this booking' },
          { status: 400 }
        );
      }

      // Active (non-terminal) payment in flight → don't create a duplicate
      const activePayment = existingPayments.find(
        (p: { status: string }) =>
          p.status === 'pending' ||
          p.status === 'processing' ||
          p.status === 'requires_action'
      );
      if (activePayment) {
        return NextResponse.json(
          { error: 'A payment is already in progress for this booking. Please wait or refresh the page.' },
          { status: 400 }
        );
      }

      // All previous payments are terminal (failed / cancelled) — safe to retry.
      if (existingPayments.length > 0) {
        logger.info(
          'Retrying payment intent after previous terminal payment(s)',
          { component: 'payments-create-intent-route', operation: 'retryIntent', metadata: { booking_id, previousAttempts: existingPayments.length } }
        );
      }

      // ---------------------------------------------------------------------------
      // Calculate pricing & create intent
      // ---------------------------------------------------------------------------
      const pricing = await paymentService.calculateBookingPrice(
        booking.destination_id,
        booking.group_size,
        booking.check_in_date,
        booking.carbon_footprint || 0
      );

      const paymentIntent = await paymentService.createPaymentIntent({
        booking_id,
        amount: pricing.total_amount,
        currency: pricing.currency,
        payment_method: payment_method,
        metadata: {
          ...metadata,
          destination_name: booking.destinations?.name,
          check_in_date: booking.check_in_date,
          check_out_date: booking.check_out_date,
          group_size: booking.group_size,
          customer_name: booking.name,
          customer_email: booking.email,
          customer_phone: booking.phone,
        },
      });

      return NextResponse.json({
        success: true,
        payment_intent: paymentIntent,
        pricing,
      });
    } finally {
      // Always release the advisory lock
      await supabase.rpc('pg_advisory_unlock', { key: bookingHash });
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