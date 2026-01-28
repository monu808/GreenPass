import { 
  calculateSustainabilityScore, 
  calculateCarbonOffset, 
  getCommunityBenefitMetrics, 
  getEcoImpactCategory,
  findLowImpactAlternatives
} from '@/lib/sustainabilityScoring';
import { getEcoFriendlyAlternatives } from '@/lib/recommendationEngine';
import { Destination } from '@/types';

describe('Sustainability Scoring System', () => {
  const mockDestination: Destination = {
    id: 'dest-1',
    name: 'Eco Resort',
    description: 'A beautiful eco resort',
    location: { lat: 10, lng: 20 },
    maxCapacity: 100,
    currentOccupancy: 20,
    ecologicalSensitivity: 'medium',
    sustainabilityFeatures: {
      hasRenewableEnergy: true,
      wasteManagementLevel: 'advanced',
      localEmploymentRatio: 0.7,
      communityFundShare: 0.1,
      wildlifeProtectionProgram: true
    },
    images: []
  };

  describe('calculateSustainabilityScore', () => {
    it('should calculate overall score with correct weights', () => {
      // Ecological: medium -> 75 (40% weight -> 30)
      // Capacity: 20/100 -> 80 (30% weight -> 24)
      // Carbon: 70 + renewable(15) + advanced(10) -> 95 (30% weight -> 28.5)
      // Total: 30 + 24 + 28.5 = 82.5 -> round to 83
      
      const score = calculateSustainabilityScore(mockDestination);
      expect(score.overallScore).toBe(83);
      expect(score.ecologicalSensitivity).toBe(75);
      expect(score.capacityUtilization).toBe(80);
      expect(score.carbonFootprint).toBe(95);
    });

    it('should handle critical sensitivity correctly', () => {
      const criticalDest = { ...mockDestination, ecologicalSensitivity: 'critical' as const };
      const score = calculateSustainabilityScore(criticalDest);
      // Ecological: critical -> 10 (40% weight -> 4)
      // Others same: 24 + 28.5
      // Total: 4 + 24 + 28.5 = 56.5 -> 57
      expect(score.overallScore).toBe(57);
    });
  });

  describe('calculateCarbonOffset', () => {
    it('should calculate CO2 and cost for a group', () => {
      // baseCO2: 15 * 0.7 (renewable) = 10.5
      // groupSize: 4
      // estimatedCO2: 10.5 * 4 = 42
      // offsetCost: 42 * 0.5 = 21
      
      const offset = calculateCarbonOffset(mockDestination, 4);
      expect(offset.estimatedCO2).toBe(42);
      expect(offset.offsetCost).toBe(21);
      expect(offset.offsetProjects).toContain('Himalayan Reforestation');
    });
  });

  describe('getCommunityBenefitMetrics', () => {
    it('should extract correct metrics', () => {
      const metrics = getCommunityBenefitMetrics(mockDestination);
      expect(metrics.localEmploymentRate).toBe(0.7);
      expect(metrics.communityFundContribution).toBe(0.1);
      expect(metrics.localSourcingPercentage).toBe(0.5); // advanced != certified
    });
  });

  describe('getEcoImpactCategory', () => {
    it('should categorize as community-friendly if ratio >= 0.8', () => {
      const highEmployment = { 
        ...mockDestination, 
        sustainabilityFeatures: { ...mockDestination.sustainabilityFeatures!, localEmploymentRatio: 0.85 } 
      };
      expect(getEcoImpactCategory(highEmployment)).toBe('community-friendly');
    });

    it('should categorize as wildlife-safe for high sensitivity with protection program', () => {
      const wildlifeSafe = { 
        ...mockDestination, 
        ecologicalSensitivity: 'high' as const,
        sustainabilityFeatures: { ...mockDestination.sustainabilityFeatures!, wildlifeProtectionProgram: true, localEmploymentRatio: 0.4 } 
      };
      expect(getEcoImpactCategory(wildlifeSafe)).toBe('wildlife-safe');
    });
  });

  describe('findLowImpactAlternatives', () => {
    const destinations: Destination[] = [
      { ...mockDestination, id: '1', name: 'D1', ecologicalSensitivity: 'low' }, // High score
      { ...mockDestination, id: '2', name: 'D2', ecologicalSensitivity: 'critical' }, // Low score
      { ...mockDestination, id: '3', name: 'D3', ecologicalSensitivity: 'medium' } // Medium score
    ];

    it('should return destinations with higher scores than current', () => {
      const alternatives = findLowImpactAlternatives(destinations, destinations[1]); // Current is D2 (low score)
      expect(alternatives.length).toBeGreaterThan(0);
      expect(alternatives[0].id).toBe('1'); // D1 should be first
    });
  });

  describe('Recommendation Engine', () => {
    const destinations: Destination[] = [
      { ...mockDestination, id: '1', name: 'Low Sens 1', ecologicalSensitivity: 'low', currentOccupancy: 10, isActive: true },
      { ...mockDestination, id: '2', name: 'Med Sens 1', ecologicalSensitivity: 'medium', currentOccupancy: 10, isActive: true },
      { ...mockDestination, id: '3', name: 'High Sens 1', ecologicalSensitivity: 'high', currentOccupancy: 10, isActive: true },
      { ...mockDestination, id: '4', name: 'Low Sens 2', ecologicalSensitivity: 'low', currentOccupancy: 50, isActive: true },
      { ...mockDestination, id: '5', name: 'Inactive', ecologicalSensitivity: 'low', currentOccupancy: 10, isActive: false },
    ];

    it('getEcoFriendlyAlternatives should prioritize lower sensitivity', () => {
      const current = { ...mockDestination, id: 'current', ecologicalSensitivity: 'critical' };
      const capacities = { '1': 100, '2': 100, '3': 100, '4': 100 };
      const alternatives = getEcoFriendlyAlternatives(current, destinations, capacities);
      
      expect(alternatives[0].ecologicalSensitivity).toBe('low');
      expect(alternatives[1].ecologicalSensitivity).toBe('low');
      expect(alternatives[2].ecologicalSensitivity).toBe('medium');
      expect(alternatives.find(d => d.id === '5')).toBeUndefined(); // Inactive excluded
    });

    it('getEcoFriendlyAlternatives should sort by occupancy for same sensitivity', () => {
      const current = { ...mockDestination, id: 'current', ecologicalSensitivity: 'critical' };
      const capacities = { '1': 100, '4': 100 };
      const alternatives = getEcoFriendlyAlternatives(current, destinations, capacities);
      
      expect(alternatives[0].id).toBe('1'); // 10/100 < 50/100
      expect(alternatives[1].id).toBe('4');
    });
  });
});
