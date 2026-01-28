import { Tourist, Destination, Alert, CarbonFootprintResult } from '@/types';

export const createMockTourist = (overrides?: Partial<Tourist>): Tourist => ({
  id: 'tourist-123',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '1234567890',
  idProof: 'ID-12345',
  nationality: 'US',
  groupSize: 2,
  destination: 'destination-123',
  checkInDate: new Date('2024-01-01'),
  checkOutDate: new Date('2024-01-05'),
  status: 'approved',
  emergencyContact: {
    name: 'Jane Doe',
    phone: '0987654321',
    relationship: 'Spouse',
  },
  registrationDate: new Date('2023-12-01'),
  userId: 'user-123',
  carbonFootprint: 150,
  originLocationId: 'origin-1',
  transportType: 'flight',
  ...overrides,
});

export const createMockDestination = (overrides?: Partial<Destination>): Destination => ({
  id: 'destination-123',
  name: 'Eco Valley',
  location: 'Mountain Region',
  maxCapacity: 100,
  currentOccupancy: 45,
  description: 'A beautiful eco-friendly valley',
  guidelines: ['No littering', 'Stay on paths'],
  isActive: true,
  ecologicalSensitivity: 'medium',
  coordinates: {
    latitude: 34.0522,
    longitude: -118.2437,
  },
  sustainabilityFeatures: {
    hasRenewableEnergy: true,
    wasteManagementLevel: 'advanced',
    localEmploymentRatio: 0.8,
    communityFundShare: 0.1,
    wildlifeProtectionProgram: true,
  },
  weather: {
    temperature: 22,
    humidity: 45,
    weatherMain: 'Clear',
    weatherDescription: 'clear sky',
    windSpeed: 5,
    alertLevel: 'low',
    recordedAt: new Date().toISOString(),
  },
  ...overrides,
});

export const createMockAlert = (overrides?: Partial<Alert>): Alert => ({
  id: 'alert-123',
  type: 'weather',
  title: 'High Winds',
  message: 'Strong winds expected in the afternoon',
  severity: 'medium',
  destinationId: 'destination-123',
  timestamp: new Date(),
  isActive: true,
  ...overrides,
});

export const createMockCarbonFootprint = (overrides?: Partial<CarbonFootprintResult>): CarbonFootprintResult => ({
  totalEmissions: 500,
  emissionsPerPerson: 250,
  travelEmissions: 400,
  accommodationEmissions: 100,
  impactLevel: 'medium',
  ecoPointsReward: 50,
  comparison: {
    trees_equivalent: 2,
    car_miles_equivalent: 1000,
    smartphone_charges: 50000,
  },
  offsetOptions: [
    {
      id: 'offset-1',
      name: 'Tree Planting',
      description: 'Plant trees to offset carbon',
      cost: 10,
      ecoPointsBonus: 20,
    },
  ],
  ...overrides,
});
