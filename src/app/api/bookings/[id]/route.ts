// File: src/app/api/bookings/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
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

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: bookingId } = await params;

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

        // Fetch booking with destination details
        const { data: booking, error: bookingError } = await supabase
            .from('tourists')
            .select(`
        id,
        name,
        email,
        phone,
        user_id,
        status,
        payment_status,
        payment_amount,
        payment_id,
        destination_id,
        check_in_date,
        check_out_date,
        group_size,
        created_at,
        updated_at,
        destinations:destination_id (
          id,
          name,
          location,
          ecological_sensitivity
        )
      `)
            .eq('id', bookingId)
            .single();

        if (bookingError || !booking) {
            logger.error(
                'Booking not found',
                bookingError,
                { component: 'bookings-route', operation: 'getBooking', metadata: { bookingId } }
            );
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

        // Extract destination (Supabase returns it as an object when using : syntax)
        const destination = booking.destinations as any;

        // Transform the response to match what the payment page expects
        const response = {
            id: booking.id,
            name: booking.name,
            email: booking.email,
            phone: booking.phone,
            status: booking.status,
            payment_status: booking.payment_status,
            payment_amount: booking.payment_amount,
            payment_id: booking.payment_id,
            destination_id: booking.destination_id,
            destination_name: destination?.name,
            destination: destination,
            check_in_date: booking.check_in_date,
            check_out_date: booking.check_out_date,
            group_size: booking.group_size,
            created_at: booking.created_at,
            updated_at: booking.updated_at,
        };

        return NextResponse.json(response);
    } catch (error: any) {
        logger.error(
            'Error fetching booking',
            error,
            { component: 'bookings-route', operation: 'getBooking' }
        );
        return NextResponse.json(
            { error: error.message || 'Failed to fetch booking' },
            { status: 500 }
        );
    }
}