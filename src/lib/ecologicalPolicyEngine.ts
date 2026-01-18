import { 
  Destination, 
  Alert, 
  DynamicCapacityResult, 
  DynamicCapacityFactors, 
  CapacityOverride 
} from '@/types';
import { getDbService } from './databaseService';

export type SensitivityLevel = 'low' | 'medium' | 'high' | 'critical';

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

class EcologicalPolicyEngine {
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
        console.error('Failed to load policies from storage', e);
      }
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('ecological_policies', JSON.stringify(this.policies));
      } catch (e) {
        console.error('Failed to save policies to storage', e);
      }
    }
  }

  private loadOverridesFromStorage() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('capacity_overrides');
        if (saved) {
          const parsed = JSON.parse(saved);
          this.overrides = new Map(Object.entries(parsed).map(([id, override]: [string, any]) => [
            id,
            {
              ...override,
              expiresAt: override.expiresAt ? new Date(override.expiresAt) : undefined
            }
          ]));
        }
      } catch (e) {
        console.error('Failed to load overrides from storage', e);
      }
    }
  }

  private saveOverridesToStorage() {
    if (typeof window !== 'undefined') {
      try {
        const obj = Object.fromEntries(this.overrides.entries());
        localStorage.setItem('capacity_overrides', JSON.stringify(obj));
      } catch (e) {
        console.error('Failed to save overrides to storage', e);
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
  }

  async getWeatherFactor(destinationId: string): Promise<number> {
    const dbService = getDbService();
    const weather = await dbService.getLatestWeatherData(destinationId);
    
    if (!weather || !weather.alert_level || weather.alert_level === 'none') {
      return 1.0;
    }

    const multipliers: Record<string, number> = {
      none: 1.0,
      low: 0.90,
      medium: 0.85,
      high: 0.80,
      critical: 0.75
    };

    return multipliers[weather.alert_level] || 1.0;
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

  async getEcologicalIndicatorFactor(destinationId: string): Promise<number> {
    const dbService = getDbService();
    const indicators = await dbService.getLatestEcologicalIndicators(destinationId);
    
    if (!indicators) return 1.0;

    // Calculate a combined strain factor from 0 to 1
    // Higher values (approaching 1) mean more damage/strain
    const { soil_compaction, vegetation_disturbance, wildlife_disturbance, water_source_impact } = indicators;
    const avgStrain = (soil_compaction + vegetation_disturbance + wildlife_disturbance + water_source_impact) / 400; // Assuming each is 0-100

    if (avgStrain > 0.7) return 0.80; // High strain
    if (avgStrain > 0.4) return 0.90; // Medium strain
    return 1.0;
  }

  async getDynamicCapacity(destination: Destination, weatherData?: any): Promise<DynamicCapacityResult> {
    const policy = this.getPolicy(destination.ecologicalSensitivity);
    const ecologicalMultiplier = policy.capacityMultiplier;
    
    // Get weather factor - use provided data if available, otherwise fetch
    let weatherMultiplier = 1.0;
    if (weatherData && weatherData.alert_level) {
      const multipliers: Record<string, number> = {
        none: 1.0, low: 0.90, medium: 0.85, high: 0.80, critical: 0.75
      };
      weatherMultiplier = multipliers[weatherData.alert_level] || 1.0;
    } else {
      weatherMultiplier = await this.getWeatherFactor(destination.id);
    }

    const seasonMultiplier = this.getSeasonFactor();
    const utilizationMultiplier = this.getUtilizationFactor(destination);
    const ecologicalIndicatorMultiplier = await this.getEcologicalIndicatorFactor(destination.id);
    
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

  async getAdjustedCapacity(destination: Destination): Promise<number> {
    const result = await this.getDynamicCapacity(destination);
    return result.adjustedCapacity;
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
let globalPolicyEngine: EcologicalPolicyEngine | null = null;

export const getPolicyEngine = (): EcologicalPolicyEngine => {
  if (typeof window !== 'undefined') {
    // Client-side: use a global on window to persist across HMR
    const win = window as any;
    if (!win.__policyEngine) {
      win.__policyEngine = new EcologicalPolicyEngine();
    }
    return win.__policyEngine;
  }
  
  // Server-side or non-browser
  if (!globalPolicyEngine) {
    globalPolicyEngine = new EcologicalPolicyEngine();
  }
  return globalPolicyEngine;
};

export default getPolicyEngine;
