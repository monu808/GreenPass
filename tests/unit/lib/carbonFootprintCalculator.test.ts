import { CarbonFootprintCalculator, EMISSION_FACTORS } from '@/lib/carbonFootprintCalculator';

describe('CarbonFootprintCalculator', () => {
  let calculator: CarbonFootprintCalculator;

  beforeEach(() => {
    calculator = CarbonFootprintCalculator.getInstance();
  });

  describe('calculateTravelDistance', () => {
    it('should calculate distance correctly using Haversine formula', () => {
      // New Delhi (28.6139, 77.2090) to Mumbai (19.0760, 72.8777)
      // Distance is approximately 1148 km
      const distance = calculator.calculateTravelDistance(28.6139, 77.2090, 19.0760, 72.8777);
      expect(distance).toBeGreaterThan(1140);
      expect(distance).toBeLessThan(1160);
    });

    it('should return 0 for same coordinates', () => {
      const distance = calculator.calculateTravelDistance(10, 10, 10, 10);
      expect(distance).toBe(0);
    });
  });

  describe('calculateBookingFootprint', () => {
    it('should calculate emissions correctly for a standard car trip', () => {
      // Srinagar (34.0837, 74.7973) to Gulmarg (34.0484, 74.3805)
      // Distance is ~38km
      const result = calculator.calculateBookingFootprint(
        'jk',        // originId (Srinagar)
        'gulmarg',   // destinationId
        2,           // groupSize
        'CAR_PER_KM',
        2,           // stayNights
        34.0484,     // destLat
        74.3805      // destLon
      );

      // Distance is ~38km. Car emission factor is 0.171.
      // Travel: 38 * 0.171 * 2 persons = ~13.0 kg
      // Accommodation: 15.4 * 2 nights * 2 persons = 61.6 kg
      // Total: ~74.6 kg
      expect(result.totalEmissions).toBeCloseTo(74.6, 0);
      expect(result.impactLevel).toBe('low');
      expect(result.ecoPointsReward).toBeGreaterThan(50);
    });

    it('should handle flight emissions and high impact level', () => {
      // Long distance trip
      const result = calculator.calculateBookingFootprint(
        'tn',        // originId (Chennai)
        'gulmarg',
        1,
        'FLIGHT_PER_KM',
        5,
        34.0484,
        74.3805
      );

      // Chennai to Srinagar is ~2400km
      // Travel: 2400 * 0.158 * 1 = ~379 kg
      // Accommodation: 15.4 * 5 * 1 = 77 kg
      // Total: ~456 kg
      // Per person: ~456 kg (> 200 kg = high impact)
      expect(result.impactLevel).toBe('high');
      expect(result.totalEmissions).toBeGreaterThan(400);
      expect(result.comparison.trees_equivalent).toBeGreaterThan(15);
    });

    it('should provide offset options with correct pricing', () => {
      const result = calculator.calculateBookingFootprint('jk', 'gulmarg', 1, 'CAR_PER_KM', 1);
      
      expect(result.offsetOptions).toHaveLength(2);
      expect(result.offsetOptions[0].id).toBe('reforestation');
      expect(result.offsetOptions[1].id).toBe('clean-energy');
      
      // Cost: emissions * 0.5
      const expectedCost = Math.ceil(result.totalEmissions * 0.5);
      expect(result.offsetOptions[0].cost).toBe(expectedCost);
    });

    it('should handle fallback for unknown origin', () => {
      const result = calculator.calculateBookingFootprint('unknown', 'gulmarg', 1, 'CAR_PER_KM', 1);
      // Fallback distance is 500km
      // Travel: 500 * 0.171 = 85.5
      // Accommodation: 15.4 * 1 = 15.4
      // Total: 100.9
      expect(result.totalEmissions).toBeCloseTo(100.9, 1);
    });
  });

  describe('getSustainabilityTips', () => {
    it('should return basic tips for low sensitivity', () => {
      const tips = calculator.getSustainabilityTips('low');
      expect(tips).toHaveLength(4);
      expect(tips[0]).toContain('reusable water bottle');
    });

    it('should handle extra tips for high/critical sensitivity', () => {
      const highTips = calculator.getSustainabilityTips('high');
      expect(highTips).toHaveLength(6);
      expect(highTips).toContain("Use eco-friendly sunscreens and toiletries to protect water sources.");
      
      const criticalTips = calculator.getSustainabilityTips('critical');
      expect(criticalTips).toHaveLength(6);
    });
  });

  describe('calculateBookingFootprint Edge Cases', () => {
    it('should validate groupSize and default to 1 if <= 0', () => {
      const result = calculator.calculateBookingFootprint('jk', 'gulmarg', 0, 'CAR_PER_KM', 1);
      const result2 = calculator.calculateBookingFootprint('jk', 'gulmarg', 1, 'CAR_PER_KM', 1);
      expect(result.totalEmissions).toBe(result2.totalEmissions);
    });

    it('should handle unknown transport type by defaulting to CAR_PER_KM', () => {
      const result = calculator.calculateBookingFootprint('jk', 'gulmarg', 1, 'UNKNOWN' as any, 1);
      const result2 = calculator.calculateBookingFootprint('jk', 'gulmarg', 1, 'CAR_PER_KM', 1);
      expect(result.totalEmissions).toBe(result2.totalEmissions);
    });

    it('should use default coordinates if none provided', () => {
      const result = calculator.calculateBookingFootprint('jk', 'gulmarg', 1, 'CAR_PER_KM', 1);
      // Srinagar (34.0837, 74.7973) to default (34.0837, 74.7973) = 0 distance
      // Travel: 0
      // Accommodation: 15.4 * 1 = 15.4
      expect(result.totalEmissions).toBeCloseTo(15.4, 1);
    });

    it('should categorize medium impact level', () => {
      // 150 kg per person
      const result = calculator.calculateBookingFootprint('jk', 'gulmarg', 1, 'CAR_PER_KM', 8);
      // Distance 0. Travel 0.
      // Accommodation 15.4 * 8 = 123.2
      // Let's force a longer distance
      const result2 = calculator.calculateBookingFootprint('dl', 'gulmarg', 1, 'CAR_PER_KM', 1);
      // DL to Srinagar is ~640km. 640 * 0.171 = 109.44.
      // Total 109.44 + 15.4 = 124.84
      expect(result2.impactLevel).toBe('medium');
    });
  });

  describe('getCarbonCalculator', () => {
    it('should return the same instance', () => {
      const { getCarbonCalculator } = require('@/lib/carbonFootprintCalculator');
      const calc1 = getCarbonCalculator();
      const calc2 = getCarbonCalculator();
      expect(calc1).toBe(calc2);
    });
  });
});
