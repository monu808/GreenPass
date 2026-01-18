import { Destination, Tourist, BookingSlot, Alert } from '@/types';

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
