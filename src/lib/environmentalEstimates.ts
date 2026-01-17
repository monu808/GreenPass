import { SensitivityLevel } from './ecologicalPolicyEngine';

/**
 * Constants for environmental impact calculations based on industry averages
 */
export const ENV_CONSTANTS = {
  // Base CO2e per visitor per day in kg
  BASE_CO2_PER_VISITOR: 20,
  
  // Base waste generated per visitor per day in kg
  BASE_WASTE_PER_VISITOR: 1.5,
  
  // Multipliers based on ecological sensitivity
  SENSITIVITY_MULTIPLIERS: {
    low: 1.0,
    medium: 1.2,
    high: 1.5,
    critical: 2.0
  } as Record<SensitivityLevel, number>,
  
  // Multipliers for specific destinations if needed (placeholder for future expansion)
  DESTINATION_FACTORS: {} as Record<string, number>
};

/**
 * Estimates carbon footprint for a given occupancy and sensitivity
 */
export function estimateCarbonFootprint(occupancy: number, sensitivity: SensitivityLevel): number {
  const multiplier = ENV_CONSTANTS.SENSITIVITY_MULTIPLIERS[sensitivity] || 1.0;
  return Math.round(occupancy * ENV_CONSTANTS.BASE_CO2_PER_VISITOR * multiplier);
}

/**
 * Estimates waste generation for a given occupancy and sensitivity
 */
export function estimateWasteGeneration(occupancy: number, sensitivity: SensitivityLevel): number {
  const multiplier = ENV_CONSTANTS.SENSITIVITY_MULTIPLIERS[sensitivity] || 1.0;
  return Math.round(occupancy * ENV_CONSTANTS.BASE_WASTE_PER_VISITOR * multiplier * 10) / 10;
}

/**
 * Returns a risk color for waste levels
 */
export function getWasteRiskColor(wasteAmount: number, destinationCount: number = 1): string {
  const perDestThreshold = 150; // Threshold in kg
  const threshold = perDestThreshold * destinationCount;
  
  if (wasteAmount > threshold * 0.85) return 'text-red-600';
  if (wasteAmount > threshold * 0.70) return 'text-orange-600';
  return 'text-green-600';
}
