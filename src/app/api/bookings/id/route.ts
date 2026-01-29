import { NextRequest, NextResponse } from 'next/server';
import { getDbService } from '@/lib/databaseService';
import { z } from 'zod';
import { BookingStatusEnum } from '@/lib/validation/schemas';

/**
 * Schema for route parameters (booking ID)
 */
const IdParamSchema = z.object({
  id: z.string().refine(
    (val) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val),
    { message: 'Invalid booking ID format' }
  ),
});

/**
 * Schema for updating booking status
 */
const UpdateStatusSchema = z.object({
  status: BookingStatusEnum,
});

/**
 * GET /api/bookings/[id]
 * Get a single booking by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate route parameters
    const paramsValidation = IdParamSchema.safeParse(params);

    if (!paramsValidation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid booking ID',
          errors: paramsValidation.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const { id } = paramsValidation.data;

    const dbService = getDbService();
    const booking = await dbService.getTouristById(id);

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          message: 'Booking not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error('Error fetching booking:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch booking',
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/bookings/[id]
 * Update booking status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate route parameters
    const paramsValidation = IdParamSchema.safeParse(params);

    if (!paramsValidation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid booking ID',
          errors: paramsValidation.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    // Validate request body
    const body = await request.json();
    const bodyValidation = UpdateStatusSchema.safeParse(body);

    if (!bodyValidation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request body',
          errors: bodyValidation.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const { id } = paramsValidation.data;
    const { status } = bodyValidation.data;

    const dbService = getDbService();

    // Check if booking exists
    const existingBooking = await dbService.getTouristById(id);
    if (!existingBooking) {
      return NextResponse.json(
        {
          success: false,
          message: 'Booking not found',
        },
        { status: 404 }
      );
    }

    // Validate status transition (optional business logic)
    // Example: Can't go from 'cancelled' to 'approved'
    if (existingBooking.status === 'cancelled' && status !== 'cancelled') {
      return NextResponse.json(
        {
          success: false,
          message: 'Cannot change status of a cancelled booking',
          errors: [
            {
              field: 'status',
              message: 'Cancelled bookings cannot be reactivated',
            },
          ],
        },
        { status: 400 }
      );
    }

    // Update status
    const result = await dbService.updateTouristStatus(id, status);

    if (!result) {
      throw new Error('Failed to update booking status - database operation returned null');
    }

    return NextResponse.json({
      success: true,
      message: 'Booking status updated successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error updating booking:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation error',
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update booking',
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/bookings/[id]
 * Cancel a booking (sets status to 'cancelled')
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate route parameters
    const paramsValidation = IdParamSchema.safeParse(params);

    if (!paramsValidation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid booking ID',
          errors: paramsValidation.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const { id } = paramsValidation.data;

    const dbService = getDbService();

    // Check if booking exists
    const existingBooking = await dbService.getTouristById(id);
    if (!existingBooking) {
      return NextResponse.json(
        {
          success: false,
          message: 'Booking not found',
        },
        { status: 404 }
      );
    }

    // Check if already cancelled
    if (existingBooking.status === 'cancelled') {
      return NextResponse.json(
        {
          success: false,
          message: 'Booking is already cancelled',
        },
        { status: 400 }
      );
    }

    // Cancel the booking (set status to cancelled)
    const result = await dbService.updateTouristStatus(id, 'cancelled');

    if (!result) {
      throw new Error('Failed to cancel booking - database operation returned null');
    }

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to cancel booking',
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}