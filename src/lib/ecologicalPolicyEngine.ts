import { 
  Destination, 
  Alert, 
  DynamicCapacityResult, 
  DynamicCapacityFactors, 
  CapacityOverride,
  EcologicalDamageIndicators,
  WeatherConditions
} from '@/types';
import { getDbService } from './databaseService';
import { WeatherData } from './weatherService';
import { logger } from './logger';

export type SensitivityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface AlertCheckResult {
  shouldAlert: boolean;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface EcologicalPolicy {
  sensitivityLevel: SensitivityLevel;
  capacityMultiplier: number;
  requiresPermit: boolean;
  requiresEcoBriefing: boolean;
  alertSeverity: 'low' | 'medium' | 'high' | 'critical' | 'none';
  bookingRestrictionMessage: string | null;
}

export const DEFAULT_POLICIES: Record<SensitivityLevel, EcologicalPolicy> = {
  low: {
    sensitivityLevel: 'low',
    capacityMultiplier: 1.0,
    requiresPermit: false,
    requiresEcoBriefing: false,
    alertSeverity: 'none',
    bookingRestrictionMessage: null,
  },
  medium: {
    sensitivityLevel: 'medium',
    capacityMultiplier: 0.8,
    requiresPermit: false,
    requiresEcoBriefing: true,
    alertSeverity: 'low',
    bookingRestrictionMessage: 'Please review ecological guidelines before visiting.',
  },
  high: {
    sensitivityLevel: 'high',
    capacityMultiplier: 0.5,
    requiresPermit: true,
    requiresEcoBriefing: true,
    alertSeverity: 'high',
    bookingRestrictionMessage: 'This is a high-sensitivity area. Special permits are required for entry.',
  },
  critical: {
    sensitivityLevel: 'critical',
    capacityMultiplier: 0.2,
    requiresPermit: true,
    requiresEcoBriefing: true,
    alertSeverity: 'critical',
    bookingRestrictionMessage: 'Access is strictly limited to authorized research and conservation personnel only.',
  },
};

export class EcologicalPolicyEngine {
  private policies: Record<SensitivityLevel, EcologicalPolicy> = DEFAULT_POLICIES;
  private overrides: Map<string, CapacityOverride> = new Map();
  private lastLoggedFactors: Map<string, DynamicCapacityFactors> = new Map();

  constructor() {
    this.loadFromStorage();
    this.loadOverridesFromStorage();
    this.setupStorageListener();
  }

  private setupStorageListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'ecological_policies') {
          this.loadFromStorage();
        } else if (e.key === 'capacity_overrides') {
          this.loadOverridesFromStorage();
        }
      });
    }
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('ecological_policies');
        if (saved) {
          this.policies = { ...DEFAULT_POLICIES, ...JSON.parse(saved) };
        }
      } catch (e) {
        logger.error(
          'Failed to load policies from storage',
          e,
          { component: 'ecologicalPolicyEngine', operation: 'loadPolicies' }
        );
      }
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('ecological_policies', JSON.stringify(this.policies));
      } catch (e) {
        logger.error(
          'Failed to save policies to storage',
          e,
          { component: 'ecologicalPolicyEngine', operation: 'savePolicies' }
        );
      }
    }
  }

  private loadOverridesFromStorage() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('capacity_overrides');
        if (saved) {
          const parsed = JSON.parse(saved) as Record<string, unknown>;
          this.overrides = new Map(Object.entries(parsed).map(([id, override]): [string, Partial<CapacityOverride>] => {
            const raw = override as { expiresAt?: string; [key: string]: unknown };
            return [
              id,
              {
                ...raw,
                expiresAt: raw.expiresAt ? new Date(raw.expiresAt) : undefined
              } as Partial<CapacityOverride>
            ];
          }) as [string, CapacityOverride][]);
        }
      } catch (e) {
        logger.error(
          'Failed to load overrides from storage',
          e,
          { component: 'ecologicalPolicyEngine', operation: 'loadOverrides' }
        );
      }
    }
  }

  private saveOverridesToStorage() {
    if (typeof window !== 'undefined') {
      try {
        const obj = Object.fromEntries(this.overrides.entries());
        localStorage.setItem('capacity_overrides', JSON.stringify(obj));
      } catch (e) {
        logger.error(
          'Failed to save overrides to storage',
          e,
          { component: 'ecologicalPolicyEngine', operation: 'saveOverrides' }
        );
      }
    }
  }

  getPolicy(sensitivity: SensitivityLevel): EcologicalPolicy {
    return this.policies[sensitivity] || this.policies.low;
  }

  updatePolicy(sensitivity: SensitivityLevel, updates: Partial<EcologicalPolicy>) {
    this.policies[sensitivity] = { ...this.policies[sensitivity], ...updates };
    this.saveToStorage();
  }

  getAllPolicies(): Record<SensitivityLevel, EcologicalPolicy> {
    return { ...this.policies };
  }

  setCapacityOverride(override: CapacityOverride) {
    this.overrides.set(override.destinationId, override);
    this.saveOverridesToStorage();
  }

  getCapacityOverride(destinationId: string): CapacityOverride | undefined {
    const override = this.overrides.get(destinationId);
    if (override && override.active && (!override.expiresAt || override.expiresAt > new Date())) {
      return override;
    }
    return undefined;
  }

  clearCapacityOverride(destinationId: string) {
    this.overrides.delete(destinationId);
    this.saveOverridesToStorage();
    logger.info(`Capacity override cleared for destination ${destinationId}`);
  }


/**
   * Evaluates weather data against safety thresholds to generate alerts.
   */
  checkWeatherAlerts(destination: Destination, weatherData: WeatherData): AlertCheckResult {
    const alerts = [];
    const severityRanks: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };
    let maxRank = 0;

    // Temperature alerts
    if (weatherData.temperature > 40) {
      alerts.push(`Extreme heat warning (${weatherData.temperature}°C)`);
      maxRank = Math.max(maxRank, severityRanks.high);
    } else if (weatherData.temperature < 0) {
      alerts.push(`Freezing temperature alert (${weatherData.temperature}°C)`);
      maxRank = Math.max(maxRank, severityRanks.medium);
    }

    // Wind alerts
    if (weatherData.windSpeed > 15) { 
      alerts.push(`High wind warning (${weatherData.windSpeed} m/s)`);
      maxRank = Math.max(maxRank, severityRanks.medium);
    }

    // Precipitation alerts
    if (weatherData.precipitationProbability && weatherData.precipitationProbability > 80) {
      alerts.push(`Heavy precipitation expected (${weatherData.precipitationProbability}%)`);
      maxRank = Math.max(maxRank, severityRanks.medium);
    }

    // Visibility alerts
    if (weatherData.visibility < 1000) {
      alerts.push(`Low visibility conditions (${weatherData.visibility}m)`);
      maxRank = Math.max(maxRank, severityRanks.low);
    }

    // Weather condition specific alerts
    const main = weatherData.weatherMain.toLowerCase();
    if (main === 'thunderstorm') {
      alerts.push('Thunderstorm warning');
      maxRank = Math.max(maxRank, severityRanks.high);
    } else if (main === 'snow' && weatherData.temperature > -2) {
      alerts.push('Heavy snow warning');
      maxRank = Math.max(maxRank, severityRanks.medium);
    }

    // Map rank back to severity level
    const severityMap: Record<number, 'low' | 'medium' | 'high' | 'critical'> = {
      1: 'low',
      2: 'medium',
      3: 'high',
      4: 'critical'
    };
    
    const finalSeverity = severityMap[maxRank] || 'low';

    return {
      shouldAlert: alerts.length > 0,
      reason: alerts.join(', '),
      severity: finalSeverity
    };
  }

  async getWeatherFactor(destinationId: string, weatherData?: WeatherConditions): Promise<number> {
    const weather = weatherData || await getDbService().getLatestWeatherData(destinationId);
    
    if (!weather || !weather.alertLevel || weather.alertLevel === 'none') {
      return 1.0;
    }

    const multipliers: Record<string, number> = {
      none: 1.0,
      low: 0.90,
      medium: 0.85,
      high: 0.80,
      critical: 0.75
    };

    return multipliers[weather.alertLevel] || 1.0;
  }

  getSeasonFactor(date: Date = new Date()): number {
    const month = date.getMonth(); // 0-indexed, so 4 is May, 9 is October
    const isHighSeason = month >= 4 && month <= 9;
    return isHighSeason ? 0.80 : 1.0;
  }

  getUtilizationFactor(destination: Destination): number {
    const utilization = destination.maxCapacity > 0 
      ? destination.currentOccupancy / destination.maxCapacity 
      : 0;
    
    return utilization > 0.85 ? 0.90 : 1.0;
  }

  async getEcologicalIndicatorFactor(destinationId: string, indicators?: EcologicalDamageIndicators): Promise<number> {
    const data = indicators || await getDbService().getLatestEcologicalIndicators(destinationId);
    if (!data) return 1.0;

    // Calculate a combined strain factor from 0 to 1
    // Higher values (approaching 1) mean more damage/strain
    const soil = data.soilCompaction ?? 0;
    const veg = data.vegetationDisturbance ?? 0;
    const wildlife = data.wildlifeDisturbance ?? 0;
    const water = data.waterSourceImpact ?? 0;
    
    const avgStrain = (soil + veg + wildlife + water) / 400; // Assuming each is 0-100
    
    if (avgStrain > 0.7) return 0.80; // High strain
    if (avgStrain > 0.4) return 0.90; // Medium strain
    return 1.0;
  }

  async getDynamicCapacity(
    destination: Destination, 
    weatherData?: WeatherConditions, 
    indicators?: EcologicalDamageIndicators
  ): Promise<DynamicCapacityResult> {
    const policy = this.getPolicy(destination.ecologicalSensitivity);
    const ecologicalMultiplier = policy.capacityMultiplier;
    
    // Get weather factor - use provided data if available, otherwise fetch
    const weatherMultiplier = await this.getWeatherFactor(destination.id, weatherData);

    const seasonMultiplier = this.getSeasonFactor();
    const utilizationMultiplier = this.getUtilizationFactor(destination);
    const ecologicalIndicatorMultiplier = await this.getEcologicalIndicatorFactor(destination.id, indicators);
    
    const override = this.getCapacityOverride(destination.id);
    const overrideMultiplier = override ? override.multiplier : 1.0;

    const combinedMultiplier = ecologicalMultiplier * weatherMultiplier * seasonMultiplier * utilizationMultiplier * ecologicalIndicatorMultiplier * overrideMultiplier;
    
    const adjustedCapacity = Math.floor(destination.maxCapacity * combinedMultiplier);
    const availableSpots = Math.max(0, adjustedCapacity - destination.currentOccupancy);

    const activeFactors = [];
    const activeFactorFlags = {
      ecological: ecologicalMultiplier < 1.0,
      weather: weatherMultiplier < 1.0,
      season: seasonMultiplier < 1.0,
      utilization: utilizationMultiplier < 1.0,
      infrastructure: ecologicalIndicatorMultiplier < 1.0,
      override: overrideMultiplier !== 1.0
    };

    if (activeFactorFlags.ecological) activeFactors.push(`Ecological Sensitivity (${ecologicalMultiplier}x)`);
    if (activeFactorFlags.weather) activeFactors.push(`Weather Conditions (${weatherMultiplier}x)`);
    if (activeFactorFlags.season) activeFactors.push(`Peak Season (${seasonMultiplier}x)`);
    if (activeFactorFlags.utilization) activeFactors.push(`High Utilization (${utilizationMultiplier}x)`);
    if (activeFactorFlags.infrastructure) activeFactors.push(`Infrastructure Strain (${ecologicalIndicatorMultiplier}x)`);
    if (activeFactorFlags.override) activeFactors.push(`Manual Override (${overrideMultiplier}x)`);

    const factors: DynamicCapacityFactors = {
      ecologicalMultiplier,
      weatherMultiplier,
      seasonMultiplier,
      utilizationMultiplier,
      ecologicalIndicatorMultiplier,
      overrideMultiplier,
      combinedMultiplier
    };

    // Detect state changes and log
    const prevFactors = this.lastLoggedFactors.get(destination.id);
    const factorsChanged = !prevFactors || 
      Math.abs(prevFactors.combinedMultiplier - combinedMultiplier) > 0.001 ||
      Math.abs(prevFactors.weatherMultiplier - weatherMultiplier) > 0.001 ||
      Math.abs(prevFactors.overrideMultiplier - overrideMultiplier) > 0.001;

    if (factorsChanged) {
      this.lastLoggedFactors.set(destination.id, factors);
      const dbService = getDbService();
      await dbService.logCapacityAdjustment({
        id: `adj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        destinationId: destination.id,
        timestamp: new Date(),
        originalCapacity: destination.maxCapacity,
        adjustedCapacity,
        factors,
        reason: activeFactors.join(', ') || 'Normal conditions'
      });
      
      // Generate alert if reduction is > 15%
      await this.generateCapacityAdjustmentAlert(destination, factors);
    }

    let displayMessage = `Capacity adjusted by ${Math.round((1 - combinedMultiplier) * 100)}% based on environmental factors.`;
    if (activeFactors.length > 0) {
      displayMessage += ` Active factors: ${activeFactors.join(', ')}.`;
    }

    return {
      adjustedCapacity,
      availableSpots,
      factors,
      activeFactors,
      activeFactorFlags,
      displayMessage
    };
  }

  async generateCapacityAdjustmentAlert(destination: Destination, factors: DynamicCapacityFactors) {
    const reduction = 1 - factors.combinedMultiplier;
    if (reduction > 0.15) {
      const dbService = getDbService();
      await dbService.addAlert({
        type: "ecological",
        title: `Significant Capacity Reduction - ${destination.name}`,
        message: `Capacity reduced by ${Math.round(reduction * 100)}% due to environmental factors and current conditions.`,
        severity: reduction > 0.3 ? "high" : "medium",
        destinationId: destination.id,
        isActive: true,
      });
    }
  }

  async getAdjustedCapacity(
    destination: Destination, 
    weatherData?: WeatherConditions, 
    indicators?: EcologicalDamageIndicators
  ): Promise<number> {
    const result = await this.getDynamicCapacity(destination, weatherData, indicators);
    return result.adjustedCapacity;
  }

  async getBatchAdjustedCapacities(
    destinations: Destination[], 
    weatherMap: Map<string, WeatherConditions>, 
    indicatorsMap: Map<string, EcologicalDamageIndicators>
  ): Promise<Map<string, number>> {
    const resultMap = new Map<string, number>();
    
    const results = await Promise.all(destinations.map(async (dest) => {
      const weather = weatherMap.get(dest.id);
      const indicators = indicatorsMap.get(dest.id);
      
      const capacity = await this.getAdjustedCapacity(dest, weather, indicators);
      return { id: dest.id, capacity };
    }));

    results.forEach(res => resultMap.set(res.id, res.capacity));
    return resultMap;
  }

  async getAvailableSpots(destination: Destination): Promise<number> {
    const result = await this.getDynamicCapacity(destination);
    return result.availableSpots;
  }

  async isBookingAllowed(destination: Destination, groupSize: number): Promise<{ allowed: boolean; reason: string | null }> {
    const availableSpots = await this.getAvailableSpots(destination);
    
    if (groupSize > availableSpots) {
      return { 
        allowed: false, 
        reason: `Booking exceeds the available spots (${availableSpots}) adjusted for ${destination.ecologicalSensitivity} ecological sensitivity.` 
      };
    }

    const policy = this.getPolicy(destination.ecologicalSensitivity);
    if (destination.ecologicalSensitivity === 'critical') {
      return {
        allowed: false,
        reason: policy.bookingRestrictionMessage
      };
    }

    return { allowed: true, reason: null };
  }

  generateEcologicalAlerts(destination: Destination): Partial<Alert> | null {
    const policy = this.getPolicy(destination.ecologicalSensitivity);
    
    if (policy.alertSeverity === 'none') return null;

    return {
      type: 'emergency',
      title: `Ecological Sensitivity Alert: ${destination.name}`,
      message: policy.bookingRestrictionMessage || `This area has ${destination.ecologicalSensitivity} ecological sensitivity.`,
      severity: policy.alertSeverity as 'low' | 'medium' | 'high' | 'critical',
      destinationId: destination.id,
      isActive: true,
    };
  }
}

// Export a singleton factory function to support Turbopack HMR and consistent state
export const getPolicyEngine = (): EcologicalPolicyEngine => {
  if (typeof globalThis === 'undefined') return new EcologicalPolicyEngine();
  
  if (!globalThis.__policyEngine) {
    globalThis.__policyEngine = new EcologicalPolicyEngine();
  }
  return globalThis.__policyEngine;
};

export default getPolicyEngine;
