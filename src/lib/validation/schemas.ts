import { z } from 'zod';

// --- Enums ---
export const BookingStatusEnum = z.enum(['pending', 'approved', 'checked-in', 'checked-out', 'cancelled']);
export const EcologicalSensitivityEnum = z.enum(['low', 'medium', 'high', 'critical']);
export const AlertTypeEnum = z.enum(['weather', 'capacity', 'emergency', 'maintenance', 'ecological']);
export const AlertSeverityEnum = z.enum(['low', 'medium', 'high', 'critical']);
export const TransportTypeEnum = z.enum(['bus', 'train', 'car', 'flight', 'other']);
export const UserRoleEnum = z.enum(['tourist', 'admin', 'operator']);

export const AccountSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.email('Invalid email address'),
  role: UserRoleEnum.default('tourist'),
});

// --- Base Schemas ---
export const CoordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// --- Tourist Registration ---
export const TouristRegistrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.email('Invalid email address'),
  phone: z.string().regex(/^(?:\+?91)?[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  age: z.number().int().min(18, 'Must be at least 18 years old').max(120),
  address: z.string().min(10, 'Address must be at least 10 characters').max(500),
  pinCode: z.string().regex(/^[1-9]\d{5}$/, 'Invalid PIN code'),
  idProof: z.string().min(8).max(20),
  idType: z.enum(['aadhaar', 'pan', 'passport', 'driving-license', 'voter-id']),
});

// --- Booking Data ---
export const BookingDataSchema = z.object({
  groupSize: z.number().int().min(1).max(10),
  checkInDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid check-in date",
  }),
  checkOutDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid check-out date",
  }),
  emergencyContact: z.object({
    name: z.string().min(2),
    phone: z.string().regex(/^(?:\+?91)?[6-9]\d{9}$/, 'Invalid mobile number'),
    relationship: z.string().min(2),
  }),
  transportType: TransportTypeEnum,
  originLocationId: z.string().regex(/^[a-zA-Z]{2}$|^(domestic|international)$/).optional(),
});

// --- Search/Filter Inputs ---
export const SearchFilterSchema = z.object({
  searchTerm: z.string().max(100).optional(),
  status: BookingStatusEnum.optional(),
  destinationId: z.uuid().optional(),
});

export const AlertFilterSchema = z.object({
  searchTerm: z.string().max(100).optional(),
  type: AlertTypeEnum.optional(),
  severity: AlertSeverityEnum.optional(),
  destinationId: z.uuid().optional(),
});

// --- API Inputs ---
export const ApiInputSchema = z.object({
  coordinates: CoordinatesSchema.optional(),
  destinationId: z.uuid(),
});

// --- Weather API Schemas ---
export const WeatherCheckSchema = z.object({
  destinationId: z.uuid().optional(),
});

export const TestWeatherSchema = z.object({
  lat: z.string().regex(/^-?\d+(\.\d+)?$/).refine(val => {
    const lat = parseFloat(val);
    return lat >= -90 && lat <= 90;
  }, "Latitude must be between -90 and 90"),
  lon: z.string().regex(/^-?\d+(\.\d+)?$/).refine(val => {
    const lon = parseFloat(val);
    return lon >= -180 && lon <= 180;
  }, "Longitude must be between -180 and 180"),
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
