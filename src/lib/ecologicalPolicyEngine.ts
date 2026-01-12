import { Destination, Alert } from '@/types';

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

  constructor() {
    this.loadFromStorage();
    this.setupStorageListener();
  }

  private setupStorageListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'ecological_policies') {
          this.loadFromStorage();
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

  getAdjustedCapacity(destination: Destination): number {
    const policy = this.getPolicy(destination.ecologicalSensitivity);
    return Math.floor(destination.maxCapacity * policy.capacityMultiplier);
  }

  getAvailableSpots(destination: Destination): number {
    const baseAvailable = destination.maxCapacity - destination.currentOccupancy;
    const policy = this.getPolicy(destination.ecologicalSensitivity);
    return Math.floor(Math.max(0, baseAvailable) * policy.capacityMultiplier);
  }

  isBookingAllowed(destination: Destination, groupSize: number): { allowed: boolean; reason: string | null } {
    const availableSpots = this.getAvailableSpots(destination);
    
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

export const policyEngine = new EcologicalPolicyEngine();
export default policyEngine;
