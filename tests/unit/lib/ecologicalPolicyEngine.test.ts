import { EcologicalPolicyEngine, DEFAULT_POLICIES } from '@/lib/ecologicalPolicyEngine';
import { getDbService } from '@/lib/databaseService';
import { Destination, WeatherData } from '@/types';

// Mock the database service
jest.mock('@/lib/databaseService', () => ({
  getDbService: jest.fn(() => ({
    getLatestWeatherData: jest.fn(),
    getLatestEcologicalIndicators: jest.fn(),
    logCapacityAdjustment: jest.fn(),
    createAlert: jest.fn(),
    addAlert: jest.fn(),
  })),
}));

describe('EcologicalPolicyEngine', () => {
  let engine: EcologicalPolicyEngine;
  let mockDbService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    engine = new EcologicalPolicyEngine();
    mockDbService = getDbService();
    
    // Clear localStorage to ensure clean state
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('getPolicy', () => {
    it('should return the correct policy for each sensitivity level', () => {
      expect(engine.getPolicy('low')).toEqual(DEFAULT_POLICIES.low);
      expect(engine.getPolicy('critical')).toEqual(DEFAULT_POLICIES.critical);
    });

    it('should fallback to low policy for unknown sensitivity', () => {
      // @ts-ignore - testing invalid input
      expect(engine.getPolicy('unknown')).toEqual(DEFAULT_POLICIES.low);
    });
  });

  describe('checkWeatherAlerts', () => {
    const mockDestination: any = { id: 'dest-1', name: 'Test Destination' };

    it('should return shouldAlert: false for normal weather', () => {
      const weather: any = {
        temperature: 25,
        windSpeed: 5,
        precipitationProbability: 10,
        visibility: 5000,
        weatherMain: 'Clear'
      };
      const result = engine.checkWeatherAlerts(mockDestination, weather);
      expect(result.shouldAlert).toBe(false);
    });

    it('should detect extreme heat', () => {
      const weather: any = {
        temperature: 45,
        windSpeed: 5,
        precipitationProbability: 10,
        visibility: 5000,
        weatherMain: 'Clear'
      };
      const result = engine.checkWeatherAlerts(mockDestination, weather);
      expect(result.shouldAlert).toBe(true);
      expect(result.severity).toBe('high');
      expect(result.reason).toContain('Extreme heat');
    });

    it('should detect thunderstorms', () => {
      const weather: any = {
        temperature: 20,
        windSpeed: 5,
        precipitationProbability: 90,
        visibility: 2000,
        weatherMain: 'Thunderstorm'
      };
      const result = engine.checkWeatherAlerts(mockDestination, weather);
      expect(result.shouldAlert).toBe(true);
      expect(result.severity).toBe('high');
      expect(result.reason).toContain('Thunderstorm');
    });
  });

  describe('getSeasonFactor', () => {
    it('should return 0.8 during high season (May to October)', () => {
      const may = new Date(2024, 4, 15); // May is index 4
      const october = new Date(2024, 9, 15); // Oct is index 9
      expect(engine.getSeasonFactor(may)).toBe(0.8);
      expect(engine.getSeasonFactor(october)).toBe(0.8);
    });

    it('should return 1.0 during low season', () => {
      const january = new Date(2024, 0, 15);
      expect(engine.getSeasonFactor(january)).toBe(1.0);
    });
  });

  describe('getDynamicCapacity', () => {
    const mockDestination: any = {
      id: 'dest-1',
      maxCapacity: 100,
      currentOccupancy: 20,
      ecologicalSensitivity: 'medium'
    };

    it('should calculate capacity based on multiple factors', async () => {
      // Medium sensitivity has 0.8 multiplier
      // Weather alert 'medium' has 0.85 multiplier
      // Low season has 1.0 multiplier
      // Low utilization has 1.0 multiplier
      // No ecological strain has 1.0 multiplier
      // Total multiplier: 0.8 * 0.85 * 1.0 * 1.0 * 1.0 = 0.68
      // Adjusted capacity: 100 * 0.68 = 68
      
      const weatherData: any = { alert_level: 'medium' };
      const indicators: any = { soil_compaction: 10, vegetation_disturbance: 10, wildlife_disturbance: 10, water_source_impact: 10 };
      
      // Use fixed date for season factor (January)
      jest.spyOn(engine, 'getSeasonFactor').mockReturnValue(1.0);

      const result = await engine.getDynamicCapacity(mockDestination, weatherData, indicators);
      
      expect(result.adjustedCapacity).toBe(68);
      expect(result.availableSpots).toBe(48); // 68 - 20
      expect(result.factors.combinedMultiplier).toBeCloseTo(0.68);
      expect(result.activeFactorFlags.ecological).toBe(true);
      expect(result.activeFactorFlags.weather).toBe(true);
    });

    it('should respect manual overrides', async () => {
      engine.setCapacityOverride({
        destinationId: 'dest-1',
        multiplier: 0.5,
        reason: 'Maintenance',
        active: true
      });

      // Medium (0.8) * Override (0.5) = 0.4
      // 100 * 0.4 = 40
      
      const result = await engine.getDynamicCapacity(mockDestination, { alert_level: 'none' }, { soil_compaction: 0, vegetation_disturbance: 0, wildlife_disturbance: 0, water_source_impact: 0 });
      expect(result.adjustedCapacity).toBe(40);
      expect(result.activeFactorFlags.override).toBe(true);
    });
  });

  describe('isBookingAllowed', () => {
    const mockDestination: any = {
      id: 'dest-1',
      maxCapacity: 100,
      currentOccupancy: 20,
      ecologicalSensitivity: 'medium'
    };

    it('should allow booking when capacity is available', async () => {
      // Mock getAvailableSpots to return 10
      jest.spyOn(engine, 'getAvailableSpots').mockResolvedValue(10);
      const result = await engine.isBookingAllowed(mockDestination, 5);
      expect(result.allowed).toBe(true);
    });

    it('should deny booking when group size exceeds available spots', async () => {
      jest.spyOn(engine, 'getAvailableSpots').mockResolvedValue(10);
      const result = await engine.isBookingAllowed(mockDestination, 15);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('exceeds the available spots');
    });

    it('should deny booking for critical sensitivity regardless of spots', async () => {
      const criticalDest = { ...mockDestination, ecologicalSensitivity: 'critical' };
      jest.spyOn(engine, 'getAvailableSpots').mockResolvedValue(50);
      const result = await engine.isBookingAllowed(criticalDest, 5);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Access is strictly limited');
    });
  });

  describe('generateEcologicalAlerts', () => {
    it('should return null for low sensitivity', () => {
      const lowDest: any = { id: '1', name: 'Low', ecologicalSensitivity: 'low' };
      expect(engine.generateEcologicalAlerts(lowDest)).toBeNull();
    });

    it('should return alert for critical sensitivity', () => {
      const criticalDest: any = { id: '2', name: 'Critical', ecologicalSensitivity: 'critical' };
      const alert = engine.generateEcologicalAlerts(criticalDest);
      expect(alert).not.toBeNull();
      expect(alert?.severity).toBe('critical');
      expect(alert?.title).toContain('Ecological Sensitivity Alert');
    });
  });

  describe('getEcologicalIndicatorFactor', () => {
    it('should return 1.0 for low strain', async () => {
      const indicators = { soil_compaction: 10, vegetation_disturbance: 10, wildlife_disturbance: 10, water_source_impact: 10 };
      const factor = await engine.getEcologicalIndicatorFactor('dest-1', indicators);
      expect(factor).toBe(1.0);
    });

    it('should return 0.9 for medium strain', async () => {
      // (50 * 4) / 400 = 0.5 (between 0.4 and 0.7)
      const indicators = { soil_compaction: 50, vegetation_disturbance: 50, wildlife_disturbance: 50, water_source_impact: 50 };
      const factor = await engine.getEcologicalIndicatorFactor('dest-1', indicators);
      expect(factor).toBe(0.9);
    });

    it('should return 0.8 for high strain', async () => {
      // (80 * 4) / 400 = 0.8 (> 0.7)
      const indicators = { soil_compaction: 80, vegetation_disturbance: 80, wildlife_disturbance: 80, water_source_impact: 80 };
      const factor = await engine.getEcologicalIndicatorFactor('dest-1', indicators);
      expect(factor).toBe(0.8);
    });
  });
});
