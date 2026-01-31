import { z } from 'zod';
import { parsePhoneNumberWithError } from 'libphonenumber-js';

// ============================================================================
// HELPER FUNCTIONS & ALGORITHMS
// ============================================================================

/**
 * Verhoeff algorithm for Aadhaar validation
 */
function verhoeffCheck(aadhaar: string): boolean {
  const d = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
  ];
  const p = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
  ];
  
  let c = 0;
  const digits = aadhaar.split('').reverse().map(Number);
  
  digits.forEach((digit, i) => {
    c = d[c][p[(i % 8)][digit]];
  });
  
  return c === 0;
}

// ============================================================================
// PRIMITIVE VALIDATION SCHEMAS
// ============================================================================

/**
 * Enhanced phone validation with international format support
 */
export const phoneSchema = z.string().refine(
  (phone) => {
    try {
      const phoneNumber = parsePhoneNumberWithError(phone, 'IN');
      return phoneNumber.isValid();
    } catch {
      return false;
    }
  },
  { message: 'Invalid phone number format' }
);

/**
 * Aadhaar validation with Verhoeff checksum
 */
export const aadhaarSchema = z.string().refine(
  (aadhaar) => {
    const cleaned = aadhaar.replace(/\s/g, '');
    if (!/^\d{12}$/.test(cleaned)) return false;
    return verhoeffCheck(cleaned);
  },
  { message: 'Invalid Aadhaar number (must be 12 digits with valid checksum)' }
);

/**
 * PAN card validation
 */
export const panSchema = z.string().refine(
  (pan) => {
    const cleaned = pan.toUpperCase().trim();
    return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(cleaned);
  },
  { message: 'Invalid PAN format (e.g., ABCDE1234F)' }
);

/**
 * Passport validation (Indian format)
 */
export const passportSchema = z.string().refine(
  (passport) => {
    const cleaned = passport.toUpperCase().trim();
    return /^[A-Z][0-9]{7}$/.test(cleaned);
  },
  { message: 'Invalid Indian Passport format (e.g., A1234567)' }
);

/**
 * Driving License validation
 */
export const drivingLicenseSchema = z.string().refine(
  (dl) => {
    const cleaned = dl.toUpperCase().replace(/[\s-]/g, '');
    return /^[A-Z]{2}[0-9]{13}$/.test(cleaned);
  },
  { message: 'Invalid Driving License format' }
);

/**
 * Voter ID validation
 */
export const voterIdSchema = z.string().refine(
  (voterId) => {
    const cleaned = voterId.toUpperCase().trim();
    return /^[A-Z]{3}[0-9]{7}$/.test(cleaned);
  },
  { message: 'Invalid Voter ID format (e.g., ABC1234567)' }
);

/**
 * Future date validation
 */
export const futureDateSchema = z.string().refine(
  (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return !isNaN(date.getTime()) && date >= now;
  },
  { message: 'Date must be today or in the future' }
);

/**
 * File validation
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

export const fileSchema = z.object({
  name: z.string(),
  size: z.number().max(MAX_FILE_SIZE, 'File size must be less than 5MB'),
  type: z.string().refine(
    (type) => ACCEPTED_FILE_TYPES.includes(type),
    'Only JPG, PNG, or PDF files are allowed'
  ),
});

// ============================================================================
// ENUMS
// ============================================================================

export const BookingStatusEnum = z.enum([
  'pending',
  'approved',
  'checked-in',
  'checked-out',
  'cancelled',
]);
export const EcologicalSensitivityEnum = z.enum(['low', 'medium', 'high', 'critical']);
export const AlertTypeEnum = z.enum(['weather', 'capacity', 'emergency', 'maintenance', 'ecological']);
export const AlertSeverityEnum = z.enum(['low', 'medium', 'high', 'critical']);
export const TransportTypeEnum = z.enum(['bus', 'train', 'car', 'flight', 'other']);
export const UserRoleEnum = z.enum(['tourist', 'admin', 'operator']);
export const IdTypeEnum = z.enum(['aadhaar', 'pan', 'passport', 'driving-license', 'voter-id']);

// ============================================================================
// BASE SCHEMAS
// ============================================================================

export const AccountSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  role: UserRoleEnum.default('tourist'),
});

export const CoordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// ============================================================================
// BUSINESS LOGIC SCHEMAS
// ============================================================================

/**
 * Tourist Registration Schema
 * Validates all registration fields with proper ID proof validation
 */
export const TouristRegistrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: phoneSchema,
  age: z.number().int().min(18, 'Must be at least 18 years old').max(120),
  address: z.string().min(10, 'Address must be at least 10 characters').max(500),
  pinCode: z.string().regex(/^[1-9]\d{5}$/, 'Invalid PIN code'),
  idProof: z.string().min(8).max(20),
  idType: IdTypeEnum,
}).refine(
  (data) => {
    switch (data.idType) {
      case 'aadhaar':
        return aadhaarSchema.safeParse(data.idProof).success;
      case 'pan':
        return panSchema.safeParse(data.idProof).success;
      case 'passport':
        return passportSchema.safeParse(data.idProof).success;
      case 'driving-license':
        return drivingLicenseSchema.safeParse(data.idProof).success;
      case 'voter-id':
        return voterIdSchema.safeParse(data.idProof).success;
      default:
        return true;
    }
  },
  {
    message: 'Invalid ID proof number for selected ID type',
    path: ['idProof'],
  }
);

/**
 * Booking Data Schema
 * Validates booking information with date range checks
 */
export const BookingDataSchema = z.object({
  groupSize: z.number().int().min(1, 'At least 1 person required').max(50, 'Maximum 50 people per group'),
  checkInDate: futureDateSchema,
  checkOutDate: futureDateSchema,
  emergencyContact: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: phoneSchema,
    relationship: z.string().min(2, 'Relationship must be specified'),
  }),
  transportType: TransportTypeEnum,
  originLocationId: z.string()
    .regex(/^[a-zA-Z]{2}$|^(domestic|international)$/)
    .optional(),
}).refine(
  (data) => {
    const checkIn = new Date(data.checkInDate);
    const checkOut = new Date(data.checkOutDate);
    return checkOut > checkIn;
  },
  {
    message: 'Check-out date must be after check-in date',
    path: ['checkOutDate'],
  }
).refine(
  (data) => {
    const checkIn = new Date(data.checkInDate);
    const maxAdvanceBooking = new Date();
    maxAdvanceBooking.setMonth(maxAdvanceBooking.getMonth() + 12);
    return checkIn <= maxAdvanceBooking;
  },
  {
    message: 'Cannot book more than 12 months in advance',
    path: ['checkInDate'],
  }
);

// ============================================================================
// SEARCH & FILTER SCHEMAS
// ============================================================================

export const SearchFilterSchema = z.object({
  searchTerm: z.string().max(100).optional(),
  status: BookingStatusEnum.optional(),
  destinationId: z.string().uuid('Invalid destination ID').optional(),
});

export const AlertFilterSchema = z.object({
  searchTerm: z.string().max(100).optional(),
  type: AlertTypeEnum.optional(),
  severity: AlertSeverityEnum.optional(),
  destinationId: z.string().uuid('Invalid destination ID').optional(),
});

// ============================================================================
// API SCHEMAS
// ============================================================================

export const ApiInputSchema = z.object({
  coordinates: CoordinatesSchema.optional(),
  destinationId: z.string().uuid('Invalid destination ID'),
});

export const WeatherCheckSchema = z.object({
  destinationId: z.string().uuid('Invalid destination ID').optional(),
});

export const TestWeatherSchema = z.object({
  lat: z.string().regex(/^-?\d+(\.\d+)?$/).refine(
    (val) => {
      const lat = parseFloat(val);
      return lat >= -90 && lat <= 90;
    },
    'Latitude must be between -90 and 90'
  ),
  lon: z.string().regex(/^-?\d+(\.\d+)?$/).refine(
    (val) => {
      const lon = parseFloat(val);
      return lon >= -180 && lon <= 180;
    },
    'Longitude must be between -180 and 180'
  ),
  city: z.string().min(1).max(100),
});

export const WeatherMonitorSchema = z.object({
  // Add any specific monitoring parameters if needed
});


export type TouristRegistration = z.infer<typeof TouristRegistrationSchema>;
export type BookingData = z.infer<typeof BookingDataSchema>;
export type SearchFilter = z.infer<typeof SearchFilterSchema>;
export type AlertFilter = z.infer<typeof AlertFilterSchema>;
export type ApiInput = z.infer<typeof ApiInputSchema>;
export type WeatherCheck = z.infer<typeof WeatherCheckSchema>;
export type TestWeather = z.infer<typeof TestWeatherSchema>;
export type User = z.infer<typeof AccountSchema>;