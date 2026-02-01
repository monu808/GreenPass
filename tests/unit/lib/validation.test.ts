import { validateInput } from '@/lib/validation';
import { 
  TouristRegistrationSchema, 
  BookingDataSchema, 
  CoordinatesSchema,
  TestWeatherSchema
} from '@/lib/validation/schemas';

describe('Validation Engine', () => {
  describe('validateInput', () => {
    it('should return success: true and data for valid input', () => {
      const schema = CoordinatesSchema;
      const data = { latitude: 34.0837, longitude: 74.7973 };
      const result = validateInput(schema, data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(data);
      }
    });

    it('should return success: false and structured errors for invalid input', () => {
      const schema = CoordinatesSchema;
      const data = { latitude: 100, longitude: 200 };
      const result = validateInput(schema, data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toHaveProperty('latitude');
        expect(result.errors).toHaveProperty('longitude');
      }
    });
  });

  describe('Schemas', () => {
    describe('TouristRegistrationSchema', () => {
      const validTourist = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '9876543210',
        age: 25,
        address: '123 Main St, Anytown, USA',
        pinCode: '123456',
        idProof: 'ABCDE1234F',
        idType: 'aadhaar' as const
      };

      it('should validate a valid tourist', () => {
        expect(TouristRegistrationSchema.safeParse(validTourist).success).toBe(true);
      });

      it('should fail for invalid phone number', () => {
        const invalid = { ...validTourist, phone: '12345' };
        expect(TouristRegistrationSchema.safeParse(invalid).success).toBe(false);
      });

      it('should fail for underaged tourist', () => {
        const invalid = { ...validTourist, age: 17 };
        expect(TouristRegistrationSchema.safeParse(invalid).success).toBe(false);
      });

      it('should fail for invalid PIN code', () => {
        const invalid = { ...validTourist, pinCode: '012345' }; // Starts with 0
        expect(TouristRegistrationSchema.safeParse(invalid).success).toBe(false);
      });
    });

    describe('BookingDataSchema', () => {
      const validBooking = {
        groupSize: 4,
        checkInDate: '2024-06-01',
        checkOutDate: '2024-06-05',
        emergencyContact: {
          name: 'Jane Doe',
          phone: '9876543211',
          relationship: 'Sister'
        },
        transportType: 'bus' as const,
        originLocationId: 'DL'
      };

      it('should validate a valid booking', () => {
        expect(BookingDataSchema.safeParse(validBooking).success).toBe(true);
      });

      it('should fail for invalid dates', () => {
        const invalid = { ...validBooking, checkInDate: 'not-a-date' };
        expect(BookingDataSchema.safeParse(invalid).success).toBe(false);
      });

      it('should fail for group size > 10', () => {
        const invalid = { ...validBooking, groupSize: 11 };
        expect(BookingDataSchema.safeParse(invalid).success).toBe(false);
      });
    });

    describe('TestWeatherSchema', () => {
      it('should validate valid coordinates and city', () => {
        const valid = { lat: '34.0837', lon: '74.7973', city: 'Srinagar' };
        expect(TestWeatherSchema.safeParse(valid).success).toBe(true);
      });

      it('should fail for invalid lat/lon strings', () => {
        const invalid = { lat: 'abc', lon: '74.7973', city: 'Srinagar' };
        expect(TestWeatherSchema.safeParse(invalid).success).toBe(false);
      });

      it('should fail for out of range coordinates', () => {
        const invalid = { lat: '95', lon: '74.7973', city: 'Srinagar' };
        expect(TestWeatherSchema.safeParse(invalid).success).toBe(false);
      });
    });
  });
});
