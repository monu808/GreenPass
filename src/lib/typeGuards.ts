import { Destination, SustainabilityFeatures } from '@/types';

/**
 * Type guard to validate ecological sensitivity enum values
 */
export function isValidEcologicalSensitivity(value: unknown): value is Destination['ecologicalSensitivity'] {
  return typeof value === 'string' && ['low', 'medium', 'high', 'critical'].includes(value);
}

/**
 * Type guard to validate waste management level enum values
 */
export function isValidWasteManagementLevel(value: unknown): value is SustainabilityFeatures['wasteManagementLevel'] {
  return typeof value === 'string' && ['basic', 'advanced', 'certified'].includes(value);
}
