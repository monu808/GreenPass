import { 
  Destination, 
  SustainabilityScore, 
  CarbonOffsetInfo, 
  CommunityMetrics, 
  EcoImpactCategory
} from '@/types';

/**
 * Calculates a 0-100 sustainability score for a destination
 * Weights: Ecological Sensitivity (40%), Capacity Utilization (30%), Carbon Footprint (30%)
 */
export const calculateSustainabilityScore = (destination: Destination): SustainabilityScore => {
  // 1. Ecological Sensitivity (40%)
  const sensitivityScores: Record<string, number> = {
    'low': 100,
    'medium': 75,
    'high': 40,
    'critical': 10
  };
  const ecologicalScore = sensitivityScores[destination.ecologicalSensitivity] || 50;

  // 2. Capacity Utilization (30%)
  // Lower utilization is better for sustainability
  const utilizationRate = destination.maxCapacity > 0 
    ? destination.currentOccupancy / destination.maxCapacity 
    : 0;
  const capacityScore = Math.max(0, 100 - (utilizationRate * 100));

  // 3. Carbon Footprint (30%)
  // Base score 100, reduced by features and estimated impact
  let carbonScore = 70; // Base starting point
  if (destination.sustainabilityFeatures?.hasRenewableEnergy) carbonScore += 15;
  if (destination.sustainabilityFeatures?.wasteManagementLevel === 'certified') carbonScore += 15;
  else if (destination.sustainabilityFeatures?.wasteManagementLevel === 'advanced') carbonScore += 10;
  
  carbonScore = Math.min(100, carbonScore);

  const overallScore = Math.round(
    (ecologicalScore * 0.4) + 
    (capacityScore * 0.3) + 
    (carbonScore * 0.3)
  );

  return {
    overallScore,
    ecologicalSensitivity: ecologicalScore,
    capacityUtilization: capacityScore,
    carbonFootprint: carbonScore,
    breakdown: {
      ecologicalWeight: 0.4,
      capacityWeight: 0.3,
      carbonWeight: 0.3
    }
  };
};

/**
 * Estimates CO2 emissions and offset costs for a destination
 */
export const calculateCarbonOffset = (destination: Destination, groupSize: number = 1): CarbonOffsetInfo => {
  // Rough estimate: 15kg CO2 per person per day base
  // Adjusted by destination features
  let baseCO2 = 15; 
  if (destination.sustainabilityFeatures?.hasRenewableEnergy) baseCO2 *= 0.7;
  
  const estimatedCO2 = baseCO2 * groupSize;
  const offsetCost = Math.round(estimatedCO2 * 0.5); // ₹0.5 per kg CO2

  return {
    estimatedCO2,
    offsetCost,
    offsetProjects: [
      'Himalayan Reforestation',
      'Local Solar Grid',
      'Community Waste-to-Energy'
    ]
  };
};

/**
 * Extracts community benefit metrics from destination features
 */
export const getCommunityBenefitMetrics = (destination: Destination): CommunityMetrics => {
  const features = destination.sustainabilityFeatures;
  
  return {
    localEmploymentRate: features?.localEmploymentRatio || 0.4, // Default 40% if unknown
    communityFundContribution: features?.communityFundShare || 0.05, // Default 5% if unknown
    localSourcingPercentage: features?.wasteManagementLevel === 'certified' ? 0.8 : 0.5,
    culturalPreservationIndex: destination.ecologicalSensitivity === 'critical' ? 0.9 : 0.7
  };
};

/**
 * Categorizes destinations based on their sustainability profile
 */
export const getEcoImpactCategory = (destination: Destination): EcoImpactCategory => {
  const features = destination.sustainabilityFeatures;
  
  // 1. High Community Impact (Priority 1)
  if (features?.localEmploymentRatio && features.localEmploymentRatio >= 0.8) {
    return 'community-friendly';
  }
  
  // 2. Wildlife Protection in Sensitive Areas (Priority 2)
  if (features?.wildlifeProtectionProgram === true && 
      (destination.ecologicalSensitivity === 'high' || destination.ecologicalSensitivity === 'critical')) {
    return 'wildlife-safe';
  }
  
  // 3. Moderate Community Impact (Priority 3)
  if (features?.localEmploymentRatio && features.localEmploymentRatio > 0.6) {
    return 'community-friendly';
  }
  
  // 4. Default to Low Carbon
  return 'low-carbon';
};

/**
 * Finds alternative destinations with higher sustainability scores
 */
export const findLowImpactAlternatives = (
  allDestinations: Destination[],
  current?: Destination | number
): Destination[] => {
  const minScore = typeof current === 'number' 
    ? current 
    : current 
      ? calculateSustainabilityScore(current).overallScore 
      : 70; // Default threshold if nothing provided
  
  return allDestinations
    .filter(d => {
      if (typeof current === 'object' && d.id === current.id) return false;
      return calculateSustainabilityScore(d).overallScore > minScore;
    })
    .sort((a, b) => {
      const scoreA = calculateSustainabilityScore(a).overallScore;
      const scoreB = calculateSustainabilityScore(b).overallScore;
      return scoreB - scoreA;
    })
    .slice(0, 3);
};
