import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/paymentService';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Verify user is admin
    if (!supabase) {
      return NextResponse.json(
        { error: 'Service unavailable' },
        { status: 503 }
      );
    }

    const { data: { user } } = await supabase.auth.getUser();
    
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDateStr = searchParams.get('start_date');
    const endDateStr = searchParams.get('end_date');

    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    // Fetch statistics
    const statistics = await paymentService.getPaymentStatistics(startDate, endDate);

    if (!statistics) {
      return NextResponse.json(
        { error: 'Failed to fetch statistics' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      statistics,
    });
  } catch (error: any) {
    console.error('Error fetching payment statistics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payment statistics' },
      { status: 500 }
    );
  }
}