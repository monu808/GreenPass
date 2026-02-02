import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/paymentService';
import { logger } from '@/lib/logger';
import { createSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  let user: any = null;
  let limit = 100;
  let offset = 0;

  try {
    // Create authenticated Supabase client for route handler
    const supabase = await createSupabaseClient();

    // Get authenticated user
    const { data: { user: authUser } } = await supabase.auth.getUser();
    user = authUser;

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: userProfile } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!userProfile?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    limit = parseInt(searchParams.get('limit') || '100');
    offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('payment_summary')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      query = query.eq('payment_status', status);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: payments, error } = await query;

    if (error) {
      throw error;
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('payments')
      .select('*', { count: 'exact', head: true });

    if (status) {
      countQuery = countQuery.eq('status', status);
    }

    const { count } = await countQuery;

    return NextResponse.json({
      success: true,
      payments: payments || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error: any) {
    logger.error(
      'Error fetching payments',
      error,
      { component: 'payments-list-route', operation: 'fetchPayments', metadata: { userId: user.id, limit, offset } }
    );
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}