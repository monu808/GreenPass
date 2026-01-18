import { Destination } from '@/types';

/**
 * Sensitivity values for comparison
 */
const SENSITIVITY_VALUES = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

/**
 * Suggests lower-impact alternative destinations.
 * 
 * @param currentDestination The destination currently being viewed
 * @param allDestinations List of all available destinations
 * @param adjustedCapacities Pre-calculated adjusted capacities for all destinations
 * @returns At least 3 alternatives sorted by available eco-capacity and impact
 */
export function getEcoFriendlyAlternatives(
  currentDestination: Destination,
  allDestinations: Destination[],
  adjustedCapacities: Record<string, number>
): Destination[] {
  return allDestinations
    .filter(dest => {
      // Exclude current destination
      if (dest.id === currentDestination.id) return false;
      // Must be active
      if (!dest.isActive) return false;
      return true;
    })
    .sort((a, b) => {
      const capA = adjustedCapacities[a.id] || a.maxCapacity;
      const capB = adjustedCapacities[b.id] || b.maxCapacity;
      const occupancyRateA = a.currentOccupancy / capA;
      const occupancyRateB = b.currentOccupancy / capB;

      // 1. Prioritize lower sensitivity level
      const sensitivityA = SENSITIVITY_VALUES[a.ecologicalSensitivity];
      const sensitivityB = SENSITIVITY_VALUES[b.ecologicalSensitivity];
      if (sensitivityA !== sensitivityB) {
        return sensitivityA - sensitivityB;
      }

      // 2. Sort by available eco-capacity (ascending occupancy %)
      if (occupancyRateA !== occupancyRateB) {
        return occupancyRateA - occupancyRateB;
      }

      // 3. Consider region/location as secondary sorting criteria (similar region preferred)
      const sameRegionA = a.location === currentDestination.location ? 0 : 1;
      const sameRegionB = b.location === currentDestination.location ? 0 : 1;
      return sameRegionA - sameRegionB;
    })
    .slice(0, 3);
}
