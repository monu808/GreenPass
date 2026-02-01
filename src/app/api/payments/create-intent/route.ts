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

    // Create authenticated Supabase client for route handler
    const supabase = await createSupabaseClient();

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get booking details to calculate price
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

    // Verify the booking belongs to the authenticated user
    if (booking.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Check if payment already exists for this booking
    const existingPayments = await paymentService.getPaymentsByBooking(booking_id);
    const successfulPayment = existingPayments.find(p => p.status === 'succeeded');

    if (successfulPayment) {
      return NextResponse.json(
        { error: 'Payment already completed for this booking' },
        { status: 400 }
      );
    }

    // Calculate pricing
    const pricing = await paymentService.calculateBookingPrice(
      booking.destination_id,
      booking.group_size,
      booking.check_in_date,
      booking.carbon_footprint || 0
    );

    // Create payment intent with payment method preference
    const paymentIntent = await paymentService.createPaymentIntent({
      booking_id,
      amount: pricing.total_amount,
      currency: pricing.currency,
      payment_method: payment_method, // Pass selected payment method
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
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}

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

    // Create authenticated Supabase client for route handler
    const supabase = await createSupabaseClient();

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get booking to verify ownership
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

    // Verify the booking belongs to the authenticated user
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