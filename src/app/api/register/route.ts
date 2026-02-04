import { NextRequest, NextResponse } from 'next/server';
import { getDbService } from '@/lib/databaseService';
import { normalizePhone } from '@/lib/utils';
import { z } from 'zod';
import { 
  TouristRegistrationSchema, 
  BookingDataSchema,
} from '@/lib/validation/schemas';
import { Destination } from '@/types';
/**
 * POST /api/register
 * Handles tourist registration with full validation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Split validation into two parts (matching your form structure)
    const touristData = {
      name: body.name,
      email: body.email,
      phone: body.phone,
      age: parseInt(body.age, 10),
      address: body.address,
      pinCode: body.pinCode,
      idProof: body.idProof,
      idType: body.idProofType,
    };

    const bookingData = {
      groupSize: parseInt(body.groupSize, 10),
      checkInDate: body.checkInDate,
      checkOutDate: body.checkOutDate,
      emergencyContact: {
        name: body.emergencyContactName,
        phone: body.emergencyContactPhone,
        relationship: body.emergencyContactRelationship,
      },
      transportType: 'other' as const,
      originLocationId: body.nationality === 'Indian' ? 'domestic' : 'international',
    };

    // Validate tourist registration
    const touristValidation = TouristRegistrationSchema.safeParse(touristData);
    if (!touristValidation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Tourist information validation failed',
          errors: touristValidation.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    // Validate booking data
    const bookingValidation = BookingDataSchema.safeParse(bookingData);
    if (!bookingValidation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Booking information validation failed',
          errors: bookingValidation.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    // Validate destination is provided
    if (!body.destination) {
      return NextResponse.json(
        {
          success: false,
          message: 'Destination is required',
          errors: [
            {
              field: 'destination',
              message: 'Please select a destination',
            },
          ],
        },
        { status: 400 }
      );
    }

    // Check destination capacity
    const dbService = getDbService();
    const destination = await dbService.getDestinationById(body.destination);

    if (!destination) {
      return NextResponse.json(
        {
          success: false,
          message: 'Destination not found',
        },
        { status: 404 }
      );
    }

    const availableCapacity = destination.maxCapacity - destination.currentOccupancy;
    if (parseInt(body.groupSize, 10) > availableCapacity) {
      return NextResponse.json(
        {
          success: false,
          message: 'Insufficient capacity',
          errors: [
            {
              field: 'groupSize',
              message: `Only ${availableCapacity} slots available`,
            },
          ],
        },
        { status: 400 }
      );
    }

    // Normalize phones (E.164 format)
    const normalizedPhone = normalizePhone(body.phone);
    const normalizedEmergencyPhone = normalizePhone(body.emergencyContactPhone);

    // Create booking
    const result = await dbService.addTourist({
      name: body.name,
      email: body.email,
      phone: normalizedPhone,
      age: parseInt(body.age, 10),
      gender: body.gender as 'male' | 'female' | 'other' | 'prefer-not-to-say',
      address: body.address,
      pin_code: body.pinCode,
      id_proof: body.idProof,
      id_proof_type: body.idProofType as 'aadhaar' | 'pan' | 'passport' | 'driving-license' | 'voter-id',
      nationality: body.nationality,
      group_name: body.group_name || null,
      group_size: parseInt(body.groupSize, 10),
      destination_id: body.destination,
      check_in_date: body.checkInDate,
      check_out_date: body.checkOutDate,
      emergency_contact_name: body.emergencyContactName,
      emergency_contact_phone: normalizedEmergencyPhone,
      emergency_contact_relationship: body.emergencyContactRelationship,
      status: 'pending' as const,
      registration_date: new Date().toISOString(),
      user_id: null,
    });
     if (!result) {
      throw new Error('Failed to create booking - database operation returned null');
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful',
        data: {
          id: result.id,
          status: result.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);

    // Handle Zod validation errors that might slip through
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
        message: 'Registration failed',
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}