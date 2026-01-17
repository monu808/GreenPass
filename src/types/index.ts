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
}

export interface ComplianceReport {
  id: string;
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
  ecologicalDamageIndicators?: {
    soilCompaction: number;
    vegetationDisturbance: number;
    wildlifeDisturbance: number;
    waterSourceImpact: number;
  };
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
