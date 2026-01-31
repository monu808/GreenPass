import { NextRequest, NextResponse } from 'next/server';
import { getDbService } from '@/lib/databaseService';
import { SearchFilterSchema } from '@/lib/validation/schemas';
import { z } from 'zod';

/**
 * GET /api/bookings
 * Query params: searchTerm, status, destinationId (all optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Convert URLSearchParams to object for validation
    const queryData = {
      searchTerm: searchParams.get('searchTerm') || undefined,
      status: searchParams.get('status') || undefined,
      destinationId: searchParams.get('destinationId') || undefined,
    };

    // Validate query parameters
    const validation = SearchFilterSchema.safeParse(queryData);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid query parameters',
          errors: validation.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const filters = validation.data;

    const dbService = getDbService();
    let bookings = await dbService.getTourists();

    // Apply filters
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      bookings = bookings.filter(
        (b) =>
          b.name.toLowerCase().includes(searchLower) ||
          b.email.toLowerCase().includes(searchLower) ||
          b.phone.includes(searchLower)
      );
    }

    if (filters.status) {
      bookings = bookings.filter((b) => b.status === filters.status);
    }

    if (filters.destinationId) {
      bookings = bookings.filter((b) => b.destination === filters.destinationId);
    }

    return NextResponse.json({
      success: true,
      count: bookings.length,
      data: bookings,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch bookings',
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}