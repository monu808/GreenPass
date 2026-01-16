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
  type: 'capacity' | 'weather' | 'emergency' | 'maintenance';
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
