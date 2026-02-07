import { Destination, Tourist, BookingSlot, Alert, ComplianceReport, PolicyViolation, WasteData, CleanupActivity, CleanupRegistration, EcoPointsTransaction } from '@/types';

// Mock data for waste tracking
export const wasteData: WasteData[] = [
  {
    id: 'waste-1',
    destinationId: 'dest-1',
    wasteType: 'plastic',
    quantity: 150,
    unit: 'kg',
    collectedAt: new Date('2026-01-15'),
    createdAt: new Date('2026-01-15'),
  },
  {
    id: 'waste-2',
    destinationId: 'dest-1',
    wasteType: 'organic',
    quantity: 350,
    unit: 'kg',
    collectedAt: new Date('2026-01-16'),
    createdAt: new Date('2026-01-16'),
  }
];

// Mock data for cleanup activities
export const cleanupActivities: CleanupActivity[] = [
  {
    id: 'cleanup-1',
    destinationId: 'dest-1',
    title: 'Trikuta Hills Spring Cleanup',
    description: 'Annual spring cleanup event to preserve the ecological balance of the Trikuta Hills.',
    startTime: new Date('2026-02-15T09:00:00'),
    endTime: new Date('2026-02-15T13:00:00'),
    location: 'Trikuta Hills Base Camp',
    maxParticipants: 50,
    currentParticipants: 25,
    status: 'upcoming',
    ecoPointsReward: 100,
    createdAt: new Date('2026-01-10'),
  },
  {
    id: 'cleanup-2',
    destinationId: 'dest-2',
    title: 'Beas River Bank Restoration',
    description: 'Volunteer event to remove waste from the banks of Beas River.',
    startTime: new Date('2026-02-20T10:00:00'),
    endTime: new Date('2026-02-20T14:00:00'),
    location: 'Beas River Bank, Manali',
    maxParticipants: 30,
    currentParticipants: 25,
    status: 'upcoming',
    ecoPointsReward: 150,
    createdAt: new Date('2026-01-12'),
  }
];

// Mock data for cleanup registrations
export const cleanupRegistrations: CleanupRegistration[] = [
  {
    id: 'reg-1',
    activityId: 'cleanup-1',
    userId: 'user-1',
    status: 'attended',
    registeredAt: new Date('2026-01-15'),
    attended: true,
  },
  {
    id: 'reg-2',
    activityId: 'cleanup-1',
    userId: 'user-2',
    status: 'attended',
    registeredAt: new Date('2026-01-15'),
    attended: true,
  },
  {
    id: 'reg-3',
    activityId: 'cleanup-2',
    userId: 'user-3',
    status: 'attended',
    registeredAt: new Date('2026-01-16'),
    attended: true,
  }
];

// Mock data for eco-points transactions
export const ecoPointsTransactions: EcoPointsTransaction[] = [
  {
    id: 'trans-1',
    userId: 'user-1',
    points: 50,
    transactionType: 'award',
    description: 'Participated in Beach Cleanup',
    createdAt: new Date('2026-01-10'),
  },
  {
    id: 'trans-2',
    userId: 'user-1',
    points: -10,
    transactionType: 'redemption',
    description: 'Redeemed for eco-friendly kit',
    createdAt: new Date('2026-01-12'),
  }
];


// Mock data for compliance reports
export const complianceReports: ComplianceReport[] = [
  {
    id: 'report-1',
    destinationId: 'dest-1',
    reportPeriod: '2025-12',
    reportType: 'monthly',
    totalTourists: 5240,
    sustainableCapacity: 5000,
    complianceScore: 85.5,
    wasteMetrics: {
      totalWaste: 7860,
      recycledWaste: 3144,
      wasteReductionTarget: 7000,
    },
    carbonFootprint: 65500,
    ecologicalImpactIndex: 1.45,
    policyViolationsCount: 12,
    totalFines: 12500,
    status: 'approved',
    approvedBy: 'admin-1',
    approvedAt: new Date('2026-01-02'),
    createdAt: new Date('2026-01-01'),
  },
  {
    id: 'report-2',
    destinationId: 'dest-2',
    reportPeriod: '2026-01',
    reportType: 'monthly',
    totalTourists: 4120,
    sustainableCapacity: 5000,
    complianceScore: 92.0,
    wasteMetrics: {
      totalWaste: 6180,
      recycledWaste: 2781,
      wasteReductionTarget: 6000,
    },
    carbonFootprint: 51500,
    ecologicalImpactIndex: 0.8,
    policyViolationsCount: 5,
    totalFines: 4500,
    status: 'pending',
    createdAt: new Date('2026-01-17'),
  }
];

// Mock data for policy violations
export const policyViolations: PolicyViolation[] = [
  {
    id: 'violation-1',
    destinationId: 'dest-1',
    destinationName: 'Vaishno Devi',
    violationType: 'Illegal Camping',
    description: 'Group of 5 found camping in restricted ecological zone.',
    severity: 'high',
    fineAmount: 2500,
    status: 'paid',
    reportedAt: new Date('2026-01-10'),
    createdAt: new Date('2026-01-10'),
  },
  {
    id: 'violation-2',
    destinationId: 'dest-2',
    destinationName: 'Manali',
    violationType: 'Waste Disposal',
    description: 'Improper disposal of non-biodegradable waste near river bank.',
    severity: 'medium',
    fineAmount: 1000,
    status: 'pending',
    reportedAt: new Date('2026-01-15'),
    createdAt: new Date('2026-01-15'),
  }
];

export const destinations: Destination[] = [
  {
    id: 'dest-1',
    name: 'Vaishno Devi',
    location: 'Jammu and Kashmir',
    maxCapacity: 1000,
    currentOccupancy: 0,
    description: 'Sacred Hindu temple dedicated to Goddess Vaishno Devi, located in the Trikuta Hills.',
    guidelines: [
      'Carry valid ID proof',
      'Follow designated trekking routes',
      'Respect religious customs',
      'Do not litter',
      'Emergency contact: 1950'
    ],
    isActive: true,
    ecologicalSensitivity: 'high',
    coordinates: {
      latitude: 33.0305,
      longitude: 74.9496
    },
    sustainabilityFeatures: {
      hasRenewableEnergy: false,
      wasteManagementLevel: 'basic',
      localEmploymentRatio: 0.45,
      communityFundShare: 0.03,
      wildlifeProtectionProgram: true
    }
  },
  {
    id: 'dest-2',
    name: 'Manali',
    location: 'Himachal Pradesh',
    maxCapacity: 800,
    currentOccupancy: 0,
    description: 'Popular hill station in the Beas River valley, known for adventure sports and scenic beauty.',
    guidelines: [
      'Respect local culture and traditions',
      'Avoid plastic usage',
      'Stay on marked trails',
      'Book accommodations in advance',
      'Follow traffic rules on mountain roads'
    ],
    isActive: true,
    ecologicalSensitivity: 'medium',
    coordinates: {
      latitude: 32.2396,
      longitude: 77.1887
    },
    sustainabilityFeatures: {
      hasRenewableEnergy: true,
      wasteManagementLevel: 'advanced',
      localEmploymentRatio: 0.75, // Increased for community-friendly
      communityFundShare: 0.08,
      wildlifeProtectionProgram: false
    }
  },
  {
    id: 'dest-3',
    name: 'Shimla',
    location: 'Himachal Pradesh',
    maxCapacity: 1200,
    currentOccupancy: 0,
    description: 'Former summer capital of British India, famous for colonial architecture and Mall Road.',
    guidelines: [
      'Use public transport or walk when possible',
      'Respect heritage buildings',
      'Maintain cleanliness',
      'Follow parking regulations',
      'Support local businesses'
    ],
    isActive: true,
    ecologicalSensitivity: 'medium',
    coordinates: {
      latitude: 31.1048,
      longitude: 77.1734
    },
    sustainabilityFeatures: {
      hasRenewableEnergy: false,
      wasteManagementLevel: 'advanced',
      localEmploymentRatio: 0.55,
      communityFundShare: 0.04,
      wildlifeProtectionProgram: false
    }
  },
  {
    id: 'dest-4',
    name: 'Dharamshala',
    location: 'Himachal Pradesh',
    maxCapacity: 600,
    currentOccupancy: 0,
    description: 'Home to the Dalai Lama and Tibetan government in exile, offering spiritual experiences.',
    guidelines: [
      'Respect Tibetan culture and Buddhism',
      'Maintain silence in monasteries',
      'Remove shoes before entering religious places',
      'Do not disturb meditation sessions',
      'Carry warm clothing'
    ],
    isActive: true,
    ecologicalSensitivity: 'high',
    coordinates: {
      latitude: 32.2190,
      longitude: 76.3234
    },
    sustainabilityFeatures: {
      hasRenewableEnergy: true,
      wasteManagementLevel: 'certified',
      localEmploymentRatio: 0.85, // Increased
      communityFundShare: 0.12,
      wildlifeProtectionProgram: true // Should be wildlife-safe
    }
  },
  {
    id: 'dest-5',
    name: 'Spiti Valley',
    location: 'Himachal Pradesh',
    maxCapacity: 200,
    currentOccupancy: 0,
    description: 'Cold desert mountain valley known for ancient monasteries and unique landscape.',
    guidelines: [
      'Obtain inner line permits',
      'Carry sufficient warm clothing',
      'Respect local customs',
      'Do not feed wild animals',
      'Emergency evacuation may take time - plan accordingly'
    ],
    isActive: true,
    ecologicalSensitivity: 'critical',
    coordinates: {
      latitude: 32.2985,
      longitude: 78.0339
    },
    sustainabilityFeatures: {
      hasRenewableEnergy: true,
      wasteManagementLevel: 'certified',
      localEmploymentRatio: 0.95, // Increased
      communityFundShare: 0.15,
      wildlifeProtectionProgram: true // Should be wildlife-safe
    }
  }
];

// Mock data for tourists (will be replaced with database in production)
export const tourists: Tourist[] = [];

// Mock data for booking slots
export const bookingSlots: BookingSlot[] = [];

// Mock data for alerts
export const alerts: Alert[] = [
  {
    id: 'alert-1',
    type: 'weather',
    title: 'Weather Advisory',
    message: 'Heavy rainfall expected in Manali region for next 48 hours. Please check road conditions.',
    severity: 'medium',
    destinationId: 'dest-2',
    timestamp: new Date(),
    isActive: true
  }
];

// Helper functions for data management
export const getTouristsByDestination = (destinationId: string): Tourist[] => {
  return tourists.filter(tourist => 
    tourist.destination === destinationId && 
    (tourist.status === 'checked-in' || tourist.status === 'approved')
  );
};

export const getCurrentOccupancy = (destinationId: string): number => {
  return getTouristsByDestination(destinationId).reduce((total, tourist) => 
    total + tourist.groupSize, 0
  );
};

export const getAvailableCapacity = (destinationId: string): number => {
  const destination = destinations.find(d => d.id === destinationId);
  if (!destination) return 0;
  
  const currentOccupancy = getCurrentOccupancy(destinationId);
  return destination.maxCapacity - currentOccupancy;
};

export const addTourist = (tourist: Tourist): void => {
  (tourists as Tourist[]).push(tourist);
  updateDestinationOccupancy(tourist.destination);
};

export const updateTouristStatus = (touristId: string, status: Tourist['status']): void => {
  const tourist = tourists.find(t => t.id === touristId);
  if (tourist) {
    const oldStatus = tourist.status;
    tourist.status = status;
    
    // Update occupancy when status changes to/from checked-in or approved
    const wasOccupying = oldStatus === 'checked-in' || oldStatus === 'approved';
    const isOccupying = status === 'checked-in' || status === 'approved';
    
    if (wasOccupying !== isOccupying) {
      updateDestinationOccupancy(tourist.destination);
    }
  }
};

export const updateDestinationOccupancy = (destinationId: string): void => {
  const destination = destinations.find(d => d.id === destinationId);
  if (destination) {
    destination.currentOccupancy = getCurrentOccupancy(destinationId);
  }
};

export const generateBookingSlots = (destinationId: string, date: Date): BookingSlot => {
  const destination = destinations.find(d => d.id === destinationId);
  if (!destination) throw new Error('Destination not found');
  
  const slot: BookingSlot = {
    id: `slot-${destinationId}-${date.toISOString().split('T')[0]}`,
    destinationId,
    date,
    availableSlots: destination.maxCapacity,
    bookedSlots: 0,
    maxSlots: destination.maxCapacity
  };
  
  (bookingSlots as BookingSlot[]).push(slot);
  return slot;
};
