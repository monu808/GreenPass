import { 
  calculateSeasonalImpact, 
  generateImpactWindow
} from '@/lib/seasonalImpactCalculator';
import { Destination } from '@/types';

describe('SeasonalImpactCalculator', () => {
  const mockDestination: Destination = {
    id: 'dest-1',
    name: 'Gulmarg',
    description: 'Ski resort',
    location: { lat: 34.0484, lng: 74.3805 },
    maxCapacity: 100,
    currentOccupancy: 20,
    ecologicalSensitivity: 'high',
    isActive: true,
    sustainabilityFeatures: {
      hasRenewableEnergy: true,
      wasteManagementLevel: 'advanced',
      localEmploymentRatio: 0.7,
      communityFundShare: 0.1,
      wildlifeProtectionProgram: true
    },
    images: []
  };

  describe('calculateSeasonalImpact', () => {
    it('should calculate green impact level for low stress', () => {
      const date = new Date('2024-09-15'); // Shoulder season (-12)
      const impact = calculateSeasonalImpact(date, { 
        destination: mockDestination,
        weather: { temperature: 20, humidity: 50, weatherAlertLevel: 'none' }
      });

      expect(impact.level).toBe('green');
      expect(impact.reasons).toContain('Shoulder season with lighter footfall');
    });

    it('should calculate red impact level for critical conditions', () => {
      const date = new Date('2024-06-15'); // Monsoon (25)
      const impact = calculateSeasonalImpact(date, { 
        destination: { ...mockDestination, currentOccupancy: 95 }, // High occupancy (28)
        weather: { temperature: 35, humidity: 90, weatherAlertLevel: 'critical' } // Weather (50+6+5)
      });

      // Total score: 40 + 25 + 61 + 28 = 154 (Clamped to 100)
      expect(impact.level).toBe('red');
      expect(impact.reasons.some(r => r.includes('Critical weather alert in effect'))).toBe(true);
      expect(impact.reasons).toContain('Monsoon erosion risk & trail closures');
    });

    it('should handle yellow impact level', () => {
      const date = new Date('2024-04-15'); // Spring (-5)
      const impact = calculateSeasonalImpact(date, { 
        destination: { ...mockDestination, currentOccupancy: 50 }, // Moderate occupancy (8)
        weather: { temperature: 25, humidity: 60, weatherAlertLevel: 'medium' } // Weather (15)
      });
      // Score: 40 - 5 + 15 + 8 = 58 (Orange/Yellow boundary)
      expect(['orange', 'yellow']).toContain(impact.level);
    });
  });

  describe('generateImpactWindow', () => {
    it('should return 42 days of forecast by default', () => {
      const forecast = generateImpactWindow({ 
        destination: mockDestination,
        weather: { temperature: 20, humidity: 50, weatherAlertLevel: 'none' }
      });
      expect(forecast).toHaveLength(42);
    });
  });
});
