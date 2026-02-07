export interface Tourist {
  id: string;
  name: string;
  email: string;
  phone: string;
  idProof: string;
  nationality: string;
  groupSize: number;
  destination: string;
  checkInDate: Date;
  checkOutDate: Date;
  status: 'pending' | 'approved' | 'checked-in' | 'checked-out' | 'cancelled';
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  registrationDate: Date;
  userId?: string | null;
  carbonFootprint?: number | null;
  originLocationId?: string | null;
  transportType?: string | null;
}

export interface CarbonFootprintResult {
  totalEmissions: number;
  emissionsPerPerson: number;
  travelEmissions: number;
  accommodationEmissions: number;
  impactLevel: 'low' | 'medium' | 'high';
  ecoPointsReward: number;
  comparison: {
    trees_equivalent: number;
    car_miles_equivalent: number;
    smartphone_charges: number;
  };
  offsetOptions: CarbonOffsetOption[];
}

export interface CarbonOffsetOption {
  id: string;
  name: string;
  description: string;
  cost: number;
  ecoPointsBonus: number;
}

export interface SustainabilityFeatures {
  hasRenewableEnergy: boolean;
  wasteManagementLevel: 'basic' | 'advanced' | 'certified';
  localEmploymentRatio: number;
  communityFundShare: number;
  wildlifeProtectionProgram: boolean;
}

export interface Destination {
  id: string;
  name: string;
  location: string;
  maxCapacity: number;
  currentOccupancy: number;
  description: string;
  guidelines: string[];
  isActive: boolean;
  ecologicalSensitivity: 'low' | 'medium' | 'high' | 'critical';
  coordinates: {
    latitude: number;
    longitude: number;
  };
  sustainabilityFeatures?: SustainabilityFeatures;
  weather?: {
    temperature: number;
    humidity: number;
    weatherMain: string;
    weatherDescription: string;
    windSpeed: number;
    alertLevel: string;
    recordedAt: string;
  };
}

export interface BookingSlot {
  id: string;
  destinationId: string;
  date: Date;
  availableSlots: number;
  bookedSlots: number;
  maxSlots: number;
}

export interface Alert {
  id: string;
  type: 'capacity' | 'weather' | 'emergency' | 'maintenance' | 'ecological';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  destinationId?: string;
  timestamp: Date;
  isActive: boolean;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'supervisor' | 'operator';
  permissions: string[];
}

export interface DashboardStats {
  totalTourists: number;
  currentOccupancy: number;
  maxCapacity: number;
  adjustedMaxCapacity: number;
  pendingApprovals: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  capacityUtilization: number;
  alertsCount: number;
  totalWasteCollected: number;
  activeCleanupEvents: number;
  totalVolunteers: number;
  recyclingRate: number;
}

export interface EcologicalDamageIndicators {
  soilCompaction: number;
  vegetationDisturbance: number;
  wildlifeDisturbance: number;
  waterSourceImpact: number;
  // Support snake_case from DB
  soil_compaction?: number;
  vegetation_disturbance?: number;
  wildlife_disturbance?: number;
  water_source_impact?: number;
}

export interface ComplianceReport {
  id: string;
  destinationId: string;
  reportPeriod: string;
  reportType: 'monthly' | 'quarterly';
  totalTourists: number;
  sustainableCapacity: number;
  complianceScore: number;
  wasteMetrics: {
    totalWaste: number;
    recycledWaste: number;
    wasteReductionTarget: number;
  };
  carbonFootprint: number;
  ecologicalImpactIndex: number;
  ecologicalDamageIndicators?: EcologicalDamageIndicators;
  previousPeriodScore?: number;
  policyViolationsCount: number;
  totalFines: number;
  status: 'pending' | 'approved';
  approvedBy?: string | null;
  approvedAt?: Date | null;
  createdAt: Date;
}

export interface HistoricalOccupancy {
  date: string;
  isoDate: string;
  occupancy: number;
  adjustedCapacity: number;
}

export interface EcologicalMetrics {
  id: string;
  name: string;
  currentOccupancy: number;
  maxCapacity: number;
  adjustedCapacity: number;
  utilization: number;
  carbonFootprint: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  sensitivity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ReportApproval {
  status: 'pending' | 'approved';
  approvedBy?: string | null;
  approvedAt?: Date | null;
  createdAt: Date;
}

export interface PolicyViolation {
  id: string;
  destinationId: string;
  destinationName?: string;
  violationType: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  fineAmount: number;
  status: 'pending' | 'paid' | 'contested';
  reportedAt: Date;
  createdAt: Date;
}

export interface DynamicCapacityFactors {
  ecologicalMultiplier: number;
  weatherMultiplier: number;
  seasonMultiplier: number;
  utilizationMultiplier: number;
  ecologicalIndicatorMultiplier: number;
  overrideMultiplier: number;
  combinedMultiplier: number;
}

export interface AdjustmentLog {
  id: string;
  destinationId: string;
  timestamp: Date;
  originalCapacity: number;
  adjustedCapacity: number;
  factors: DynamicCapacityFactors;
  reason: string;
}

export interface CapacityOverride {
  destinationId: string;
  multiplier: number;
  reason: string;
  expiresAt?: Date;
  active: boolean;
}

export interface DynamicCapacityResult {
  adjustedCapacity: number;
  availableSpots: number;
  factors: DynamicCapacityFactors;
  activeFactors: string[];
  activeFactorFlags: {
    ecological: boolean;
    weather: boolean;
    season: boolean;
    utilization: boolean;
    infrastructure: boolean;
    override: boolean;
  };
  displayMessage: string;
}

export interface WasteData {
  id: string;
  destinationId: string;
  wasteType: 'plastic' | 'glass' | 'metal' | 'organic' | 'paper' | 'other';
  quantity: number;
  unit: string;
  collectedAt: Date;
  createdAt: Date;
}

export interface WasteMetricsSummary {
  totalWaste: number;
  totalQuantity: number;
  recyclingRate: number;
  activeCleanupEvents: number;
  totalVolunteers: number;
  byType: Record<string, number>;
  period: string;
  trend: 'increasing' | 'decreasing' | 'stable';    
}

export interface CleanupActivity {
  id: string;
  destinationId: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  location: string;
  maxParticipants: number;
  currentParticipants: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  ecoPointsReward: number;
  createdAt: Date;
}

export interface CleanupRegistration {
  id: string;
  activityId: string;
  userId: string;
  status: 'registered' | 'attended' | 'cancelled';
  registeredAt: Date;
  attended: boolean;
}

export interface EcoPointsTransaction {
  id: string;
  userId: string;
  points: number;
  transactionType: 'award' | 'redemption' | 'adjustment';
  description: string;
  createdAt: Date;
}

export interface EcoPointsLeaderboardEntry {
  userId: string;
  name: string;
  points: number;
  rank: number;
}

export type EcoImpactCategory = 'low-carbon' | 'community-friendly' | 'wildlife-safe';

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface EventSourceOptions {
  reconnect?: boolean;
  maxRetries?: number;
  heartbeatTimeout?: number; // ms to wait before considering connection dead
  onMessage?: (event: MessageEvent) => void;
  onStateChange?: (state: ConnectionState) => void;
}

export interface UseEventSourceReturn {
  connectionState: ConnectionState;
  error: Error | null;
  reconnect: () => void;
  disconnect: () => void;
}

export interface SustainabilityScore {
  overallScore: number;
  ecologicalSensitivity: number;
  capacityUtilization: number;
  carbonFootprint: number;
  breakdown: {
    ecologicalWeight: number;
    capacityWeight: number;
    carbonWeight: number;
  };
}

export interface CarbonOffsetInfo {
  estimatedCO2: number;
  offsetCost: number;
  offsetProjects: string[];
}

export interface CommunityMetrics {
  localEmploymentRate: number;
  communityFundContribution: number;
  localSourcingPercentage: number;
  culturalPreservationIndex: number;
}

export interface EcoComparisonData {
  destinationId: string;
  destinationName: string;
  sustainabilityScore: SustainabilityScore;
  impactCategory: EcoImpactCategory;
  carbonOffset: CarbonOffsetInfo;
}

export interface WeatherCheckResult {
  success: boolean;
  message?: string;
  error?: string;
  destinations?: number;
  alertsGenerated?: number;
  alerts?: {
    destination: string;
    severity: string;
    reason: string;
  }[];
  timestamp: string;
}

