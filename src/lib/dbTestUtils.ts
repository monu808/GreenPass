// Database connection test utility
import { supabase } from './supabase';

export async function testDatabaseConnection(): Promise<{
  connected: boolean;
  tablesExist: boolean;
  error?: string;
}> {
  try {
    if (!supabase) {
      return {
        connected: false,
        tablesExist: false,
        error: 'Supabase environment variables are missing'
      };
    }
    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase!
      .from('destinations')
      .select('count', { count: 'exact', head: true });

    if (connectionError) {
      // Check if it's a table doesn't exist error
      if (connectionError.message?.includes('relation') && connectionError.message?.includes('does not exist')) {
        return {
          connected: true,
          tablesExist: false,
          error: 'Database connected but tables not found. Please run the schema from supabase/schema.sql'
        };
      }
      return {
        connected: false,
        tablesExist: false,
        error: connectionError.message
      };
    }

    return {
      connected: true,
      tablesExist: true
    };
  } catch (error) {
    return {
      connected: false,
      tablesExist: false,
      error: error instanceof Error ? error.message : 'Unknown connection error'
    };
  }
}

// Mock data for development when database is not set up
export const mockDestinations = [
  {
    id: '1',
    name: 'Vaishno Devi',
    location: 'Jammu & Kashmir',
    max_capacity: 1000,
    current_occupancy: 750,
    description: 'Sacred pilgrimage site in the Trikuta Mountains',
    guidelines: [
      'Carry valid ID proof',
      'Follow dress code guidelines',
      'Book slots in advance during peak season'
    ],
    is_active: true,
    ecological_sensitivity: 'high' as const,
    latitude: 33.0304,
    longitude: 74.9496,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Manali',
    location: 'Himachal Pradesh',
    max_capacity: 800,
    current_occupancy: 520,
    description: 'Popular hill station in the Kullu Valley',
    guidelines: [
      'Respect local culture and environment',
      'Avoid plastic usage',
      'Follow designated trekking routes'
    ],
    is_active: true,
    ecological_sensitivity: 'medium' as const,
    latitude: 32.2396,
    longitude: 77.1887,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Spiti Valley',
    location: 'Himachal Pradesh',
    max_capacity: 200,
    current_occupancy: 180,
    description: 'High-altitude cold desert mountain valley',
    guidelines: [
      'Obtain permits for restricted areas',
      'Carry warm clothing and medical supplies',
      'Travel in groups for safety'
    ],
    is_active: true,
    ecological_sensitivity: 'critical' as const,
    latitude: 32.2665,
    longitude: 78.0419,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const mockAlerts = [
  {
    id: '1',
    type: 'weather' as const,
    title: 'Heavy Rain Warning',
    message: 'Heavy rainfall expected in Manali region. Tourists are advised to avoid outdoor activities.',
    severity: 'high' as const,
    destination_id: '2',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    type: 'capacity' as const,
    title: 'Spiti Valley Near Capacity',
    message: 'Spiti Valley is approaching maximum capacity. Limited slots available.',
    severity: 'medium' as const,
    destination_id: '3',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];
