import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/paymentService';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { booking_id, metadata } = body;

    if (!booking_id) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Get booking details to calculate price
    if (!supabase) {
      return NextResponse.json(
        { error: 'Payment service unavailable' },
        { status: 503 }
      );
    }

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

    // Create payment intent
    const paymentIntent = await paymentService.createPaymentIntent({
      booking_id,
      amount: pricing.total_amount,
      currency: pricing.currency,
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
  try {
    const searchParams = request.nextUrl.searchParams;
    const bookingId = searchParams.get('booking_id');

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    const payments = await paymentService.getPaymentsByBooking(bookingId);

    return NextResponse.json({
      success: true,
      payments,
    });
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}