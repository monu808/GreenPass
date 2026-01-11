import { supabase } from '@/lib/supabase';
import { Tourist, Destination, Alert, DashboardStats } from '@/types';
import { Database } from '@/types/database';
import { testDatabaseConnection, mockDestinations, mockAlerts } from './dbTestUtils';

// Type aliases for database types
type DbTourist = Database['public']['Tables']['tourists']['Row'];
type DbDestination = Database['public']['Tables']['destinations']['Row'];
type DbAlert = Database['public']['Tables']['alerts']['Row'];
type DbWeatherData = Database['public']['Tables']['weather_data']['Row'];

class DatabaseService {
  // Tourist operations
  async getTourists(userId?: string): Promise<Tourist[]> {
    try {
      let query = supabase
        .from('tourists')
        .select(`
          *,
          destinations (
            name,
            location
          )
        `)
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Development Mode: Database not configured');
        if (error.message) {
          console.log('Database error:', error.message);
        }
        console.log('To use real data, configure Supabase in .env.local');
        return [];
      }

      return data.map(this.transformDbTouristToTourist);
    } catch (error) {
      console.error('Error in getTourists:', error);
      return [];
    }
  }

  async getTouristById(id: string): Promise<Tourist | null> {
    try {
      const { data, error } = await supabase
        .from('tourists')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error('Error fetching tourist:', error);
        return null;
      }

      return this.transformDbTouristToTourist(data);
    } catch (error) {
      console.error('Error in getTouristById:', error);
      return null;
    }
  }

  async addTourist(tourist: Database['public']['Tables']['tourists']['Insert']): Promise<Database['public']['Tables']['tourists']['Row'] | null> {
    try {
      console.log('Attempting to insert tourist:', tourist);
      
      const { data, error } = await supabase
        .from('tourists')
        .insert(tourist as any)
        .select()
        .single();

      if (error) {
        console.error('Database error adding tourist:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return null;
      }

      if (!data) {
        console.error('No data returned from insert operation');
        return null;
      }

      console.log('Successfully added tourist:', data);
      return data;
    } catch (error) {
      console.error('Error in addTourist:', error);
      return null;
    }
  }

  async updateTouristStatus(touristId: string, status: Tourist['status']): Promise<boolean> {
    try {
      const { error } = await (supabase
        .from('tourists') as any)
        .update({ status })
        .eq('id', touristId);

      if (error) {
        console.error('Error updating tourist status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateTouristStatus:', error);
      return false;
    }
  }

  // Destination operations
  async getDestinations(): Promise<Database['public']['Tables']['destinations']['Row'][]> {
    try {
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .order('name');

      if (error) {
        console.warn('🔧 Development Mode: Using mock destinations data');
        if (error.message) {
          console.log('Database error:', error.message);
        }
        console.log('💡 To use real data, configure Supabase in .env.local');
        return mockDestinations;
      }

      // If we got real data, use it
      if (data && data.length > 0) {
        console.log('✅ Loaded', data.length, 'destinations from database');
        return data;
      }
      
      // If database is empty, use mock data
      console.warn('📊 Database is empty, using mock destinations data');
      return mockDestinations;
    } catch (error) {
      console.warn('🔧 Development Mode: Using mock destinations data');
      if (error instanceof Error) {
        console.log('Connection error:', error.message);
      }
      console.log('💡 To use real data, configure Supabase in .env.local');
      return mockDestinations;
    }
  }

  async getDestinationById(id: string): Promise<Destination | null> {
    try {
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error('Error fetching destination:', error);
        return null;
      }

      return this.transformDbDestinationToDestination(data);
    } catch (error) {
      console.error('Error in getDestinationById:', error);
      return null;
    }
  }

  async getCurrentOccupancy(destinationId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('tourists')
        .select('group_size')
        .eq('destination_id', destinationId)
        .eq('status', 'checked-in');

      if (error) {
        console.error('Error fetching occupancy:', error);
        return 0;
      }

      return (data as any).reduce((total: number, tourist: any) => total + tourist.group_size, 0);
    } catch (error) {
      console.error('Error in getCurrentOccupancy:', error);
      return 0;
    }
  }

  async getAvailableCapacity(destinationId: string): Promise<number> {
    try {
      const destination = await this.getDestinationById(destinationId);
      if (!destination) return 0;

      const currentOccupancy = await this.getCurrentOccupancy(destinationId);
      return destination.maxCapacity - currentOccupancy;
    } catch (error) {
      console.error('Error in getAvailableCapacity:', error);
      return 0;
    }
  }

  // Alert operations
  async getAlerts(destinationId?: string): Promise<Alert[]> {
    try {
      let query = supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (destinationId) {
        query = query.eq('destination_id', destinationId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching alerts:', error);
        console.error('Make sure your Supabase database is set up and the schema is applied.');
        console.error('Check the SETUP.md file for database configuration instructions.');
        console.warn('Falling back to mock data for development...');
        const mockFilteredAlerts = destinationId 
          ? mockAlerts.filter(alert => alert.destination_id === destinationId)
          : mockAlerts;
        return mockFilteredAlerts.map(this.transformDbAlertToAlert);
      }

      return data.map(this.transformDbAlertToAlert);
    } catch (error) {
      console.error('Error in getAlerts:', error);
      console.warn('Falling back to mock data for development...');
      const mockFilteredAlerts = destinationId 
        ? mockAlerts.filter(alert => alert.destination_id === destinationId)
        : mockAlerts;
      return mockFilteredAlerts.map(this.transformDbAlertToAlert);
    }
  }

  async addAlert(alert: Omit<Alert, 'id' | 'timestamp'>): Promise<Alert | null> {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .insert({
          type: alert.type,
          title: alert.title,
          message: alert.message,
          severity: alert.severity,
          destination_id: alert.destinationId,
          is_active: alert.isActive,
        } as any)
        .select()
        .single();

      if (error || !data) {
        console.error('Error adding alert:', error);
        return null;
      }

      return this.transformDbAlertToAlert(data);
    } catch (error) {
      console.error('Error in addAlert:', error);
      return null;
    }
  }

  async updateAlert(alertId: string, updates: Partial<{ isActive: boolean }>): Promise<void> {
    try {
      const { error } = await (supabase
        .from('alerts') as any)
        .update({
          is_active: updates.isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error updating alert:', error);
      throw error;
    }
  }

  async deactivateAlert(alertId: string): Promise<boolean> {
    try {
      const { error } = await (supabase
        .from('alerts') as any)
        .update({ is_active: false })
        .eq('id', alertId);

      if (error) {
        console.error('Error deactivating alert:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deactivateAlert:', error);
      return false;
    }
  }

  // Dashboard statistics
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const [tourists, destinations, alerts] = await Promise.all([
        this.getTourists(),
        this.getDestinations(),
        this.getAlerts(),
      ]);

      const totalCapacity = destinations.reduce((sum, dest) => sum + dest.max_capacity, 0);
      const currentOccupancy = destinations.reduce((sum, dest) => sum + dest.current_occupancy, 0);
      const pendingApprovals = tourists.filter(t => t.status === 'pending').length;
      
      const today = new Date().toDateString();
      const todayCheckIns = tourists.filter(t => 
        t.status === 'checked-in' && new Date(t.checkInDate).toDateString() === today
      ).length;
      const todayCheckOuts = tourists.filter(t => 
        t.status === 'checked-out' && new Date(t.checkOutDate).toDateString() === today
      ).length;

      return {
        totalTourists: tourists.length,
        currentOccupancy,
        maxCapacity: totalCapacity,
        pendingApprovals,
        todayCheckIns,
        todayCheckOuts,
        capacityUtilization: totalCapacity > 0 ? (currentOccupancy / totalCapacity) * 100 : 0,
        alertsCount: alerts.length,
      };
    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      return {
        totalTourists: 0,
        currentOccupancy: 0,
        maxCapacity: 0,
        pendingApprovals: 0,
        todayCheckIns: 0,
        todayCheckOuts: 0,
        capacityUtilization: 0,
        alertsCount: 0,
      };
    }
  }

  // Weather data operations
  async saveWeatherData(destinationId: string, weatherData: any, alertInfo?: { level: string; message?: string; reason?: string }): Promise<boolean> {
    try {
      console.log('Saving weather data for destination:', destinationId, weatherData);
      
      const { error } = await supabase
        .from('weather_data')
        .insert({
          destination_id: destinationId,
          temperature: parseFloat(weatherData.temperature.toString()),
          humidity: parseInt(weatherData.humidity.toString()),
          pressure: parseFloat(weatherData.pressure.toString()),
          weather_main: weatherData.weatherMain || weatherData.weather_main,
          weather_description: weatherData.weatherDescription || weatherData.weather_description,
          wind_speed: parseFloat((weatherData.windSpeed || weatherData.wind_speed || 0).toString()),
          wind_direction: parseInt((weatherData.windDirection || weatherData.wind_direction || 0).toString()),
          visibility: parseInt((weatherData.visibility || 10000).toString()),
          recorded_at: new Date().toISOString(),
          alert_level: alertInfo?.level || 'none',
          alert_message: alertInfo?.message || null,
          alert_reason: alertInfo?.reason || null,
        } as any);

      if (error) {
        console.error('Error saving weather data:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return false;
      }

      console.log('Weather data saved successfully');
      return true;
    } catch (error) {
      console.error('Error in saveWeatherData:', error);
      return false;
    }
  }

  async getLatestWeatherData(destinationId: string): Promise<DbWeatherData | null> {
    try {
      const { data, error } = await supabase
        .from('weather_data')
        .select('*')
        .eq('destination_id', destinationId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getLatestWeatherData:', error);
      return null;
    }
  }

  // Get weather alerts from weather data (replaces alerts table for weather alerts)
  async getWeatherAlerts(): Promise<Alert[]> {
    try {
      const { data: weatherData, error } = await supabase
        .from('weather_data')
        .select(`
          *,
          destinations!inner(name, location)
        `)
        .neq('alert_level', 'none')
        .order('recorded_at', { ascending: false });

      if (error || !weatherData) {
        console.error('Error fetching weather alerts:', error);
        return [];
      }

      // Get the latest alert for each destination
      const latestAlerts = new Map();
      weatherData.forEach((record: any) => {
        if (!latestAlerts.has(record.destination_id) || 
            new Date(record.recorded_at) > new Date(latestAlerts.get(record.destination_id).recorded_at)) {
          latestAlerts.set(record.destination_id, record);
        }
      });

      return Array.from(latestAlerts.values()).map((record: any): Alert => ({
        id: record.id,
        type: 'weather' as const,
        title: `Weather Alert - ${record.destinations.name}`,
        message: record.alert_message || `Weather conditions in ${record.destinations.name} require attention. ${record.alert_reason || ''}`,
        severity: record.alert_level as 'low' | 'medium' | 'high' | 'critical',
        destinationId: record.destination_id,
        timestamp: new Date(record.recorded_at),
        isActive: true
      }));

    } catch (error) {
      console.error('Error in getWeatherAlerts:', error);
      return [];
    }
  }

  // Transform functions
  private transformDbTouristToTourist(dbTourist: DbTourist): Tourist {
    return {
      id: dbTourist.id,
      name: dbTourist.name,
      email: dbTourist.email,
      phone: dbTourist.phone,
      idProof: dbTourist.id_proof,
      nationality: dbTourist.nationality,
      groupSize: dbTourist.group_size,
      destination: dbTourist.destination_id,
      checkInDate: new Date(dbTourist.check_in_date),
      checkOutDate: new Date(dbTourist.check_out_date),
      status: dbTourist.status,
      emergencyContact: {
        name: dbTourist.emergency_contact_name,
        phone: dbTourist.emergency_contact_phone,
        relationship: dbTourist.emergency_contact_relationship,
      },
      registrationDate: new Date(dbTourist.registration_date),
      userId: dbTourist.user_id,
    };
  }

  private transformDbDestinationToDestination(dbDestination: DbDestination): Destination {
    return {
      id: dbDestination.id,
      name: dbDestination.name,
      location: dbDestination.location,
      maxCapacity: dbDestination.max_capacity,
      currentOccupancy: dbDestination.current_occupancy,
      description: dbDestination.description || '',
      guidelines: dbDestination.guidelines || [],
      isActive: dbDestination.is_active,
      ecologicalSensitivity: dbDestination.ecological_sensitivity,
      coordinates: {
        latitude: Number(dbDestination.latitude),
        longitude: Number(dbDestination.longitude),
      },
    };
  }

  private transformDbAlertToAlert(dbAlert: DbAlert): Alert {
    return {
      id: dbAlert.id,
      type: dbAlert.type,
      title: dbAlert.title,
      message: dbAlert.message,
      severity: dbAlert.severity,
      destinationId: dbAlert.destination_id || undefined,
      timestamp: new Date(dbAlert.created_at),
      isActive: dbAlert.is_active,
    };
  }
}

// Create singleton instance
export const dbService = new DatabaseService();
export default DatabaseService;
