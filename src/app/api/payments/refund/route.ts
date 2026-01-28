import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/paymentService';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { payment_id, amount, reason, notes } = body;

    if (!payment_id || !reason) {
      return NextResponse.json(
        { error: 'Payment ID and reason are required' },
        { status: 400 }
      );
    }

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

    // Process refund
    const refund = await paymentService.processRefund(
      {
        payment_id,
        amount,
        reason,
        notes,
      },
      user.id
    );

    return NextResponse.json({
      success: true,
      refund,
    });
  } catch (error: any) {
    console.error('Error processing refund:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process refund' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const paymentId = searchParams.get('payment_id');

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service unavailable' },
        { status: 503 }
      );
    }

    // Fetch refunds for payment
    const { data: refunds, error } = await supabase
      .from('refunds')
      .select('*')
      .eq('payment_id', paymentId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      refunds: refunds || [],
    });
  } catch (error: any) {
    console.error('Error fetching refunds:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch refunds' },
      { status: 500 }
    );
  }
}