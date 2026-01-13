import { supabase } from '@/lib/supabase';
import { Tourist, Destination, Alert, DashboardStats } from '@/types';
import { Database } from '@/types/database';
import { policyEngine } from './ecologicalPolicyEngine';
import * as mockData from '@/data/mockData';

// Type aliases for database types
type DbTourist = Database['public']['Tables']['tourists']['Row'];
type DbDestination = Database['public']['Tables']['destinations']['Row'];
type DbAlert = Database['public']['Tables']['alerts']['Row'];
type DbWeatherData = Database['public']['Tables']['weather_data']['Row'];

class DatabaseService {
  // Tourist operations
  async getTourists(userId?: string): Promise<Tourist[]> {
    try {
      if (!supabase) {
        console.log('Using mock tourists data');
        return mockData.tourists;
      }
      let query = supabase!
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

      if (error || !data) {
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
      if (!supabase) {
        return mockData.tourists.find(t => t.id === id) || null;
      }
      const { data, error } = await supabase!
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
      if (!supabase) {
        console.log('Using mock addTourist');
        const newTourist: Database['public']['Tables']['tourists']['Row'] = {
          id: `mock-tourist-${Date.now()}`,
          name: tourist.name,
          email: tourist.email,
          phone: tourist.phone,
          id_proof: tourist.id_proof,
          nationality: tourist.nationality,
          group_size: tourist.group_size,
          destination_id: tourist.destination_id,
          check_in_date: tourist.check_in_date,
          check_out_date: tourist.check_out_date,
          status: tourist.status || 'pending',
          emergency_contact_name: tourist.emergency_contact_name,
          emergency_contact_phone: tourist.emergency_contact_phone,
          emergency_contact_relationship: tourist.emergency_contact_relationship,
          user_id: tourist.user_id,
          registration_date: tourist.registration_date || new Date().toISOString(),
          age: (tourist as any).age,
          gender: (tourist as any).gender,
          address: (tourist as any).address,
          pin_code: (tourist as any).pin_code,
          id_proof_type: (tourist as any).id_proof_type,
          created_at: new Date().toISOString()
        } as any;
        
        // Add to mock data array
        mockData.addTourist(this.transformDbTouristToTourist(newTourist));
        return newTourist;
      }
      // Check ecological eligibility before adding
      const eligibility = await this.checkBookingEligibility(tourist.destination_id, tourist.group_size);
      if (!eligibility.allowed) {
        console.error('Booking blocked by ecological policy:', eligibility.reason);
        return null;
      }

      console.log('Attempting to insert tourist:', tourist);
      
      const { data, error } = await supabase!
        .from('tourists')
        .insert(tourist as any)
        .select()
        .single();

      if (error) {
        console.error('Database error adding tourist:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      // Update occupancy if the tourist is immediately checked-in or approved
      const touristData = data as any;
      if (touristData.status === 'checked-in' || touristData.status === 'approved') {
        await this.updateDestinationOccupancy(touristData.destination_id);
      }

      return data;
    } catch (error) {
      console.error('Error in addTourist:', error);
      return null;
    }
  }

  async updateTouristStatus(touristId: string, status: Tourist['status']): Promise<boolean> {
    try {
      if (!supabase) {
        mockData.updateTouristStatus(touristId, status);
        return true;
      }
      // Get the tourist to find their destination and group size
      const tourist = await this.getTouristById(touristId);
      if (!tourist) {
        console.error('Tourist not found for status update');
        return false;
      }

      const oldStatus = tourist.status;
      const destinationId = tourist.destination;

      // If checking in or approving, verify capacity first
      const isNowOccupying = status === 'checked-in' || status === 'approved';
      const wasOccupying = oldStatus === 'checked-in' || oldStatus === 'approved';

      if (isNowOccupying && !wasOccupying) {
        const eligibility = await this.checkBookingEligibility(destinationId, tourist.groupSize);
        if (!eligibility.allowed) {
          console.error('Status update blocked by capacity/policy:', eligibility.reason);
          return false;
        }
      }

      const { error } = await (supabase!
        .from('tourists') as any)
        .update({ status })
        .eq('id', touristId);

      if (error) {
        console.error('Error updating tourist status:', error);
        return false;
      }

      // Update destination occupancy if status changed to/from checked-in or approved
      if (
        ((oldStatus !== 'checked-in' && oldStatus !== 'approved') && (status === 'checked-in' || status === 'approved')) ||
        ((oldStatus === 'checked-in' || oldStatus === 'approved') && (status !== 'checked-in' && status !== 'approved'))
      ) {
        await this.updateDestinationOccupancy(destinationId);
      }

      return true;
    } catch (error) {
      console.error('Error in updateTouristStatus:', error);
      return false;
    }
  }

  /**
   * Updates the current_occupancy field in the destinations table
   * based on the sum of group_size for all 'checked-in or approved' tourists.
   */
  async updateDestinationOccupancy(destinationId: string): Promise<void> {
    try {
      if (!supabase) return;

      const occupancy = await this.getCurrentOccupancy(destinationId);
      
      const { error } = await (supabase!
        .from('destinations') as any)
        .update({ current_occupancy: occupancy })
        .eq('id', destinationId);

      if (error) {
        console.error('Error updating destination occupancy:', error);
      } else {
        console.log(`Updated occupancy for destination ${destinationId} to ${occupancy}`);
      }
    } catch (error) {
      console.error('Error in updateDestinationOccupancy:', error);
    }
  }

  // Destination operations
  async getDestinations(): Promise<Database['public']['Tables']['destinations']['Row'][]> {
    try {
      if (!supabase) {
        console.log('Using mock destinations data');
        return mockData.destinations.map(d => ({
          id: d.id,
          name: d.name,
          location: d.location,
          max_capacity: d.maxCapacity,
          current_occupancy: d.currentOccupancy,
          description: d.description,
          guidelines: d.guidelines,
          is_active: d.isActive,
          ecological_sensitivity: d.ecologicalSensitivity as any,
          created_at: new Date().toISOString()
        } as any));
      }
      // Fetch destinations and their current occupancy from tourists table in one go
      const { data: destinations, error: destError } = await supabase!
        .from('destinations')
        .select('*')
        .order('name');

      if (destError) throw destError;
      if (!destinations) throw new Error('No destinations found');

      const { data: occupancyData, error: occError } = await supabase!
        .from('tourists')
        .select('destination_id, group_size')
        .or('status.eq.checked-in,status.eq.approved');

      if (occError) throw occError;

      // Calculate occupancy for each destination
      const occupancyMap: Record<string, number> = {};
      occupancyData?.forEach((t: any) => {
        occupancyMap[t.destination_id] = (occupancyMap[t.destination_id] || 0) + t.group_size;
      });

      // Merge occupancy into destinations
      const updatedDestinations = (destinations || []).map((dest: any) => ({
        ...dest,
        current_occupancy: occupancyMap[dest.id] || 0
      }));

      console.log('✅ Loaded', updatedDestinations.length, 'destinations with real-time occupancy');
      return updatedDestinations;
    } catch (error) {
      console.error('Error in getDestinations:', error);
      return [];
    }
  }

  async getDestinationById(id: string): Promise<Destination | null> {
    try {
      if (!supabase) {
        const mockDest = mockData.destinations.find(d => d.id === id);
        return mockDest || null;
      }
      const { data, error } = await supabase!
        .from('destinations')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error('Error fetching destination:', error);
        return null;
      }

      // Get real-time occupancy to ensure accuracy
      const realTimeOccupancy = await this.getCurrentOccupancy(id);
      const destination = this.transformDbDestinationToDestination(data);
      destination.currentOccupancy = realTimeOccupancy;

      return destination;
    } catch (error) {
      console.error('Error in getDestinationById:', error);
      return null;
    }
  }

  async getCurrentOccupancy(destinationId: string): Promise<number> {
    try {
      if (!supabase) {
        return mockData.getCurrentOccupancy(destinationId);
      }
      const { data, error } = await supabase!
        .from('tourists')
        .select('group_size')
        .eq('destination_id', destinationId)
        .or('status.eq.checked-in,status.eq.approved');

      if (error || !data) {
        if (error && Object.keys(error).length > 0) {
          console.error('Error fetching occupancy:', error);
        }
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

      return policyEngine.getAvailableSpots(destination);
    } catch (error) {
      console.error('Error in getAvailableCapacity:', error);
      return 0;
    }
  }

  async checkBookingEligibility(destinationId: string, groupSize: number): Promise<{ allowed: boolean; reason: string | null }> {
    try {
      const destination = await this.getDestinationById(destinationId);
      if (!destination) return { allowed: false, reason: 'Destination not found' };

      // Use real-time occupancy for eligibility check to avoid race conditions
      const realTimeOccupancy = await this.getCurrentOccupancy(destinationId);
      
      // Update the destination object with real-time occupancy before passing to policy engine
      const destinationWithRealTimeOccupancy = {
        ...destination,
        currentOccupancy: realTimeOccupancy
      };

      return policyEngine.isBookingAllowed(destinationWithRealTimeOccupancy, groupSize);
    } catch (error) {
      console.error('Error in checkBookingEligibility:', error);
      return { allowed: false, reason: 'Error checking eligibility' };
    }
  }

  // Alert operations
  async getAlerts(destinationId?: string): Promise<Alert[]> {
    try {
      if (!supabase) {
        console.log('Using mock alerts data');
        let alerts = [...mockData.alerts];
        if (destinationId) {
          alerts = alerts.filter(a => a.destinationId === destinationId);
        }
        return alerts;
      }
      let query = supabase!
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (destinationId) {
        query = query.eq('destination_id', destinationId);
      }

      const { data, error } = await query;

      if (error || !data) {
        return [];
      }

      const alerts = data.map(this.transformDbAlertToAlert);

      // Add ecological alerts from policy engine
      const destinations = await this.getDestinations();
      const destinationsToProcess = destinationId 
        ? destinations.filter(d => d.id === destinationId)
        : destinations;

      destinationsToProcess.forEach(dest => {
        const ecoAlert = policyEngine.generateEcologicalAlerts(this.transformDbDestinationToDestination(dest as any));
        if (ecoAlert) {
          const alertId = `eco-${dest.id}`;
          // Avoid duplication if an alert with this ID already exists
          if (!alerts.some(a => a.id === alertId)) {
            alerts.unshift({
              ...ecoAlert,
              id: alertId,
              timestamp: new Date(),
            } as Alert);
          }
        }
      });

      return alerts;
    } catch (error) {
      console.error('Error in getAlerts:', error);
      return [];
    }
  }

  async addAlert(alert: Omit<Alert, 'id' | 'timestamp'>): Promise<Alert | null> {
    try {
      if (!supabase) return null;
      const { data, error } = await supabase!
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
      if (!supabase) return;
      const { error } = await (supabase!
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
      if (!supabase) return true;
      const { error } = await (supabase!
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

      const physicalMaxCapacity = destinations.reduce((sum, dest) => sum + (dest.max_capacity || 0), 0);
      const adjustedMaxCapacity = destinations.reduce((sum, dest) => {
        const destinationObj = this.transformDbDestinationToDestination(dest as any);
        return sum + (policyEngine.getAdjustedCapacity(destinationObj) || 0);
      }, 0);
      
      // Calculate current occupancy from tourist records for accuracy
      const currentOccupancy = tourists
        .filter(t => t.status === 'checked-in' || t.status === 'approved')
        .reduce((sum, t) => sum + (Number(t.groupSize) || 0), 0);

      const pendingApprovals = tourists.filter(t => t.status === 'pending').length;
      
      const today = new Date().toDateString();
      const todayCheckIns = tourists.filter(t => 
        t.status === 'checked-in' && t.checkInDate && new Date(t.checkInDate).toDateString() === today
      ).length;
      const todayCheckOuts = tourists.filter(t => 
        t.status === 'checked-out' && t.checkOutDate && new Date(t.checkOutDate).toDateString() === today
      ).length;

      return {
        totalTourists: tourists.length,
        currentOccupancy,
        maxCapacity: physicalMaxCapacity,
        adjustedMaxCapacity,
        pendingApprovals,
        todayCheckIns,
        todayCheckOuts,
        capacityUtilization: adjustedMaxCapacity > 0 ? (currentOccupancy / adjustedMaxCapacity) * 100 : 0,
        alertsCount: alerts.length,
      };
    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      return {
        totalTourists: 0,
        currentOccupancy: 0,
        maxCapacity: 0,
        adjustedMaxCapacity: 0,
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
      if (!supabase) {
        console.warn('Supabase not initialized, skipping weather data save');
        return true;
      }
      console.log('Saving weather data for destination:', destinationId, weatherData);
      
      const { error } = await supabase!
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
      if (!supabase) {
        // Return dummy weather data for mock destinations
        return {
          id: 'mock-weather-id',
          destination_id: destinationId,
          temperature: 22,
          humidity: 60,
          pressure: 1013,
          weather_main: 'Clear',
          weather_description: 'clear sky',
          wind_speed: 5,
          wind_direction: 180,
          visibility: 10000,
          recorded_at: new Date().toISOString(),
          alert_level: 'none',
          alert_message: null,
          alert_reason: null,
          created_at: new Date().toISOString()
        } as DbWeatherData;
      }
      const { data, error } = await supabase!
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
      if (!supabase) {
        console.log('Using mock weather alerts');
        return mockData.alerts.filter(a => a.type === 'weather');
      }
      const { data: weatherData, error } = await supabase!
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
      groupSize: Number(dbTourist.group_size) || 0,
      destination: dbTourist.destination_id,
      checkInDate: dbTourist.check_in_date ? new Date(dbTourist.check_in_date) : new Date(),
      checkOutDate: dbTourist.check_out_date ? new Date(dbTourist.check_out_date) : new Date(),
      status: dbTourist.status as any,
      emergencyContact: {
        name: dbTourist.emergency_contact_name || '',
        phone: dbTourist.emergency_contact_phone || '',
        relationship: dbTourist.emergency_contact_relationship || '',
      },
      registrationDate: dbTourist.registration_date ? new Date(dbTourist.registration_date) : new Date(),
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
