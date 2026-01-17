import { supabase, createServerComponentClient } from '@/lib/supabase';
import { Tourist, Destination, Alert, DashboardStats, ComplianceReport, PolicyViolation, HistoricalOccupancy, EcologicalMetrics } from '@/types';
import { Database } from '@/types/database';
import { getPolicyEngine } from './ecologicalPolicyEngine';
import { format } from 'date-fns';
import * as mockData from '@/data/mockData';

// Type aliases for database types
type DbTourist = Database['public']['Tables']['tourists']['Row'];
type DbDestination = Database['public']['Tables']['destinations']['Row'];
type DbAlert = Database['public']['Tables']['alerts']['Row'];
type DbWeatherData = Database['public']['Tables']['weather_data']['Row'];

// Global cache for weather data to persist across HMR in development
const WEATHER_CACHE_KEY = 'greenpass.weather_cache';
const getGlobalWeatherCache = (): Map<string, DbWeatherData> => {
  if (typeof globalThis === 'undefined') return new Map<string, DbWeatherData>();
  
  const g = globalThis as any;
  if (!g[WEATHER_CACHE_KEY]) {
    g[WEATHER_CACHE_KEY] = new Map<string, DbWeatherData>();
  }
  return g[WEATHER_CACHE_KEY];
};

class DatabaseService {
  private weatherCache: Map<string, DbWeatherData>;

  constructor() {
    this.weatherCache = getGlobalWeatherCache();
    // Initialize cache from localStorage if available (for browser environment)
    if (typeof window !== 'undefined') {
      try {
        const savedCache = localStorage.getItem('greenpass_weather_cache');
        if (savedCache) {
          const parsed = JSON.parse(savedCache);
          Object.entries(parsed).forEach(([id, data]) => {
            this.weatherCache.set(id, data as DbWeatherData);
          });
          console.log('✅ Browser weather cache restored from localStorage');
        }
      } catch (e) {
        console.error('Failed to restore weather cache:', e);
      }
    }
  }

  private persistCache() {
    if (typeof window !== 'undefined' && this.isPlaceholderMode()) {
      try {
        const cacheObj = Object.fromEntries(this.weatherCache.entries());
        localStorage.setItem('greenpass_weather_cache', JSON.stringify(cacheObj));
      } catch (e) {
        console.error('Failed to persist weather cache:', e);
      }
    }
  }

  private isPlaceholderMode(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return !supabase || !url || url.includes('placeholder') || url.includes('your-project');
  }

  // Tourist operations
  async getTourists(userId?: string): Promise<Tourist[]> {
    try {
      if (this.isPlaceholderMode()) {
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
      if (this.isPlaceholderMode()) {
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
      if (this.isPlaceholderMode()) {
        console.log('Using mock addTourist');
        
        // Check ecological eligibility before adding (consistent with real DB path)
        const eligibility = await this.checkBookingEligibility(tourist.destination_id, tourist.group_size);
        if (!eligibility.allowed) {
          console.error('Booking blocked by ecological policy:', eligibility.reason);
          return null;
        }

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
      if (this.isPlaceholderMode()) {
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
      if (this.isPlaceholderMode()) {
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
      if (this.isPlaceholderMode()) {
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

      return getPolicyEngine().getAvailableSpots(destination);
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
      
      return getPolicyEngine().isBookingAllowed(destinationWithRealTimeOccupancy, groupSize);
    } catch (error) {
      console.error('Error in checkBookingEligibility:', error);
      return { allowed: false, reason: 'Error checking eligibility' };
    }
  }

  // Alert operations
  async getAlerts(destinationId?: string): Promise<Alert[]> {
    try {
      if (this.isPlaceholderMode()) {
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
        const policyEngine = getPolicyEngine();
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
      if (this.isPlaceholderMode()) return null;
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
      if (this.isPlaceholderMode()) return;
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
      if (this.isPlaceholderMode()) return true;
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
  getPolicyEngine() {
    return getPolicyEngine();
  }

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
        const policyEngine = getPolicyEngine();
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
      if (this.isPlaceholderMode()) {
        console.log('Mock saving weather data for destination:', destinationId);
        const mockEntry: DbWeatherData = {
          id: `mock-w-${Date.now()}`,
          destination_id: destinationId,
          temperature: parseFloat(weatherData.temperature.toString()),
          humidity: parseInt(weatherData.humidity.toString()),
          pressure: parseFloat((weatherData.pressure || 1013).toString()),
          weather_main: weatherData.weatherMain || weatherData.weather_main || 'Clear',
          weather_description: weatherData.weatherDescription || weatherData.weather_description || 'clear sky',
          wind_speed: parseFloat((weatherData.windSpeed || weatherData.wind_speed || 0).toString()),
          wind_direction: parseInt((weatherData.windDirection || weatherData.wind_direction || 0).toString()),
          visibility: parseInt((weatherData.visibility || 10000).toString()),
          recorded_at: new Date().toISOString(),
          alert_level: alertInfo?.level || 'none',
          alert_message: alertInfo?.message || null,
          alert_reason: alertInfo?.reason || null,
          created_at: new Date().toISOString()
        } as DbWeatherData;
        this.weatherCache.set(destinationId, mockEntry);
        this.persistCache();
        return true;
      }
      console.log('Saving weather data for destination:', destinationId, weatherData);
      
      // Use service role client to bypass RLS policies for system operations
      const client = createServerComponentClient();
      if (!client) {
        console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY is missing. Skipping database operation.');
        return false;
      }
      
      const { error } = await client
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

      console.log('✅ Weather data saved successfully');
      return true;
    } catch (error) {
      console.error('Error in saveWeatherData:', error);
      return false;
    }
  }

  async getLatestWeatherData(destinationId: string): Promise<DbWeatherData | null> {
    try {
      if (this.isPlaceholderMode()) {
        // Return cached weather data if available
        if (this.weatherCache.has(destinationId)) {
          return this.weatherCache.get(destinationId) || null;
        }
        
        // Return dummy weather data for mock destinations if not in cache
        // Use an old timestamp to trigger the first fetch
        return {
          id: 'mock-weather-id',
          destination_id: destinationId,
          temperature: 22,
          humidity: 60,
          pressure: 1013,
          weather_main: 'Initial',
          weather_description: 'Initial data (fetching soon...)',
          wind_speed: 5,
          wind_direction: 180,
          visibility: 10000,
          recorded_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago to trigger fetch
          alert_level: 'none',
          alert_message: null,
          alert_reason: null,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
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
      if (this.isPlaceholderMode()) {
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

  // Compliance and Reporting operations
  async getComplianceReports(): Promise<ComplianceReport[]> {
    try {
      if (this.isPlaceholderMode()) {
        console.log('Using mock compliance reports');
        return mockData.complianceReports || [];
      }
      const { data, error } = await (supabase!
        .from('compliance_reports') as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data.map(this.transformDbReportToReport);
    } catch (error) {
      console.error('Error in getComplianceReports:', error);
      return [];
    }
  }

  async getComplianceReportById(id: string): Promise<ComplianceReport | null> {
    try {
      if (this.isPlaceholderMode()) {
        return (mockData.complianceReports || []).find(r => r.id === id) || null;
      }
      const { data, error } = await supabase!
        .from('compliance_reports')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return null;
      return this.transformDbReportToReport(data);
    } catch (error) {
      console.error('Error in getComplianceReportById:', error);
      return null;
    }
  }

  async createComplianceReport(report: any): Promise<ComplianceReport | null> {
    try {
      const dbReport = {
        report_period: report.reportPeriod,
        report_type: report.reportType,
        total_tourists: report.totalTourists,
        sustainable_capacity: report.sustainableCapacity,
        compliance_score: report.complianceScore,
        waste_metrics: {
          total_waste: report.wasteMetrics.totalWaste,
          recycled_waste: report.wasteMetrics.recycledWaste,
          waste_reduction_target: report.wasteMetrics.wasteReductionTarget,
        },
        carbon_footprint: report.carbonFootprint,
        ecological_impact_index: report.ecologicalImpactIndex,
        ecological_damage_indicators: report.ecologicalDamageIndicators ? {
          soil_compaction: report.ecologicalDamageIndicators.soilCompaction,
          vegetation_disturbance: report.ecologicalDamageIndicators.vegetationDisturbance,
          wildlife_disturbance: report.ecologicalDamageIndicators.wildlifeDisturbance,
          water_source_impact: report.ecologicalDamageIndicators.waterSourceImpact,
        } : null,
        previous_period_score: report.previousPeriodScore,
        policy_violations_count: report.policyViolationsCount,
        total_fines: report.totalFines,
        status: report.status || 'pending',
      };

      if (this.isPlaceholderMode()) {
        const newReport = {
          ...dbReport,
          id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          created_at: new Date().toISOString(),
        } as any;
        const transformed = this.transformDbReportToReport(newReport);
        mockData.complianceReports.push(transformed);
        return transformed;
      }

      const { data, error } = await (supabase!
        .from('compliance_reports') as any)
        .insert(dbReport)
        .select()
        .single();

      if (error || !data) {
        console.error('Error inserting compliance report:', error);
        return null;
      }
      return this.transformDbReportToReport(data);
    } catch (error) {
      console.error('Error in createComplianceReport:', error);
      return null;
    }
  }

  async updateComplianceReportStatus(id: string, status: 'approved', approvedBy: string): Promise<boolean> {
    try {
      if (this.isPlaceholderMode()) {
        const report = (mockData.complianceReports || []).find(r => r.id === id);
        if (report) {
          report.status = status;
          report.approvedBy = approvedBy;
          report.approvedAt = new Date();
          return true;
        }
        return false;
      }
      const { error } = await (supabase!.from('compliance_reports') as any)
        .update({
          status,
          approved_by: approvedBy,
          approved_at: new Date().toISOString()
        })
        .eq('id', id);

      return !error;
    } catch (error) {
      console.error('Error in updateComplianceReportStatus:', error);
      return false;
    }
  }

  async getPolicyViolations(): Promise<PolicyViolation[]> {
    try {
      if (this.isPlaceholderMode()) {
        return mockData.policyViolations || [];
      }
      const { data, error } = await supabase!
        .from('policy_violations')
        .select('*, destinations(name)')
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data.map(v => ({
        ...this.transformDbViolationToViolation(v),
        destinationName: (v as any).destinations?.name
      }));
    } catch (error) {
      console.error('Error in getPolicyViolations:', error);
      return [];
    }
  }

  async addPolicyViolation(violation: Database['public']['Tables']['policy_violations']['Insert']): Promise<PolicyViolation | null> {
    try {
      if (this.isPlaceholderMode()) {
        const newViolation = {
          ...violation,
          id: `violation-${Date.now()}`,
          created_at: new Date().toISOString(),
          status: 'pending'
        } as any;
        mockData.policyViolations.push(this.transformDbViolationToViolation(newViolation));
        return this.transformDbViolationToViolation(newViolation);
      }
      const { data, error } = await (supabase!
        .from('policy_violations') as any)
        .insert(violation)
        .select()
        .single();

      if (error || !data) return null;
      return this.transformDbViolationToViolation(data);
    } catch (error) {
      console.error('Error in addPolicyViolation:', error);
      return null;
    }
  }

  async getComplianceMetrics(period: string, type: 'monthly' | 'quarterly'): Promise<Omit<ComplianceReport, 'id' | 'status' | 'createdAt'>> {
    const tourists = await this.getTourists();
    const destinations = await this.getDestinations();
    const violations = await this.getPolicyViolations();

    // Filter by period
    const filteredTourists = tourists.filter(t => {
      const date = new Date(t.checkInDate);
      const tMonth = date.getMonth();
      const tYear = date.getFullYear();
      
      if (type === 'monthly') {
        const [year, month] = period.split('-').map(Number);
        return tYear === year && (tMonth + 1) === month;
      } else {
        // Quarterly: period is "2024-Q1" or similar
        const [year, qPart] = period.split('-');
        const quarter = parseInt(qPart.replace('Q', ''));
        const startMonth = (quarter - 1) * 3;
        const endMonth = startMonth + 2;
        return tYear === parseInt(year) && tMonth >= startMonth && tMonth <= endMonth;
      }
    });

    const filteredViolations = violations.filter(v => {
      const date = new Date(v.reportedAt);
      const vMonth = date.getMonth();
      const vYear = date.getFullYear();
      
      if (type === 'monthly') {
        const [year, month] = period.split('-').map(Number);
        return vYear === year && (vMonth + 1) === month;
      } else {
        const [year, qPart] = period.split('-');
        const quarter = parseInt(qPart.replace('Q', ''));
        const startMonth = (quarter - 1) * 3;
        const endMonth = startMonth + 2;
        return vYear === parseInt(year) && vMonth >= startMonth && vMonth <= endMonth;
      }
    });

    const totalTourists = filteredTourists.reduce((sum, t) => sum + t.groupSize, 0);
    const sustainableCapacity = destinations.reduce((sum, d) => sum + d.max_capacity, 0);
    
    // Mock metrics calculation
    const wastePerTourist = 1.5; // kg
    const totalWaste = totalTourists * wastePerTourist;
    const recycledWaste = totalWaste * 0.4;
    
    const carbonPerTourist = 12.5; // kg CO2
    const carbonFootprint = totalTourists * carbonPerTourist;
    
    const totalFines = filteredViolations.reduce((sum, v) => sum + v.fineAmount, 0);
    
    // Get previous period report for comparison
    const reports = await this.getComplianceReports();
    const prevPeriod = type === 'monthly' 
      ? format(new Date(new Date(period).setMonth(new Date(period).getMonth() - 1)), "yyyy-MM")
      : period; // Simple MoM for now
    const previousReport = reports.find(r => r.reportPeriod === prevPeriod);
    
    // Compliance score (0-100)
    const capacityViolationFactor = sustainableCapacity > 0 ? Math.max(0, (totalTourists / sustainableCapacity) - 1) * 100 : 0;
    const violationFactor = filteredViolations.length * 5;
    const complianceScore = Math.max(0, 100 - capacityViolationFactor - violationFactor);

    return {
      reportPeriod: period,
      reportType: type,
      totalTourists,
      sustainableCapacity,
      complianceScore,
      previousPeriodScore: previousReport?.complianceScore,
      wasteMetrics: {
        totalWaste,
        recycledWaste,
        wasteReductionTarget: totalWaste * 0.9,
      },
      carbonFootprint,
      ecologicalImpactIndex: (100 - complianceScore) / 10,
      ecologicalDamageIndicators: {
        soilCompaction: sustainableCapacity > 0 ? (totalTourists / sustainableCapacity) * 0.5 : 0,
        vegetationDisturbance: filteredViolations.filter(v => v.violationType.includes('vegetation')).length * 2,
        wildlifeDisturbance: filteredViolations.filter(v => v.violationType.includes('wildlife')).length * 2,
        waterSourceImpact: totalWaste / 1000,
      },
      policyViolationsCount: filteredViolations.length,
      totalFines,
    };
  }

  async getEcologicalImpactData(): Promise<EcologicalMetrics[]> {
    const destinations = await this.getDestinations();
    const policyEngine = getPolicyEngine();
    
    return destinations.map(d => {
      const adjustedCapacity = policyEngine.getAdjustedCapacity(d as any);
      const utilization = adjustedCapacity > 0 ? (d.current_occupancy / adjustedCapacity) * 100 : 0;
      
      // Carbon footprint estimate: 12.5kg CO2 per tourist (mock)
      const carbonFootprint = d.current_occupancy * 12.5;
      
      return {
        id: d.id,
        name: d.name,
        currentOccupancy: d.current_occupancy,
        maxCapacity: d.max_capacity,
        adjustedCapacity,
        utilization,
        carbonFootprint,
        sensitivity: d.ecological_sensitivity as 'low' | 'medium' | 'high' | 'critical',
        // Risk zone: Green <50%, Yellow 50-70%, Orange 70-85%, Red >85%
        riskLevel: utilization > 85 ? 'critical' : 
                   utilization > 70 ? 'high' : 
                   utilization > 50 ? 'medium' : 'low'
      } as EcologicalMetrics;
    });
  }

  async getHistoricalOccupancyTrends(destinationId?: string, days: number = 7): Promise<{date: string, occupancy: number}[]> {
    if (this.isPlaceholderMode()) {
      // Generate mock historical data
      const trends: {date: string, occupancy: number}[] = [];
      const now = new Date();
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Random occupancy between 40% and 90%
        const occupancy = 40 + Math.random() * 50;
        
        trends.push({
          date: dateStr,
          occupancy: Math.round(occupancy)
        });
      }
      
      return trends;
    }

    // Real data path
    if (!destinationId) return [];

    try {
      // In production, this would query a dedicated historical table or aggregate tourists table
      // For now, return empty until the historical tracking table is implemented
      console.log(`Retrieving real historical trends for destination ${destinationId}`);
      return [];
    } catch (error) {
      console.error('Error in getHistoricalOccupancyTrends:', error);
      return [];
    }
  }

  async getHistoricalOccupancy(destinationId: string, days: number = 7): Promise<HistoricalOccupancy[]> {
    if (this.isPlaceholderMode()) {
      // Mock data fallback for demonstration
      const trends: HistoricalOccupancy[] = [];
      const now = new Date();
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = format(date, 'MMM dd');
        const isoDate = date.toISOString();
        
        // Base capacity for mock
        const adjustedCapacity = 100;
        // Random occupancy between 30 and 95
        const occupancy = Math.floor(Math.random() * 65) + 30;
        
        trends.push({
          date: dateStr,
          isoDate,
          occupancy,
          adjustedCapacity
        });
      }
      
      return trends;
    }

    try {
      const now = new Date();
      const trends: HistoricalOccupancy[] = [];

      // Get destination max capacity
      const { data: dest } = await supabase!
        .from('destinations')
        .select('max_capacity')
        .eq('id', destinationId)
        .single();
      
      const maxCapacity = (dest as any)?.max_capacity || 100;

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const displayDate = format(date, 'MMM dd');
        const isoDate = date.toISOString();

        // Query tourists table for occupancy on this specific date using sum of group_size
        const { data, error } = await supabase!
          .from('tourists')
          .select('sum:group_size.sum()')
          .eq('destination_id', destinationId)
          .lte('check_in_date', dateStr)
          .gte('check_out_date', dateStr);

        if (error) throw error;

        const occupancy = data && data[0] ? Number((data[0] as any).sum) || 0 : 0;

        trends.push({
          date: displayDate,
          isoDate,
          occupancy,
          adjustedCapacity: maxCapacity // In a real scenario, this would be adjusted by the policy engine
        });
      }

      return trends;
    } catch (error) {
      console.error('Error in getHistoricalOccupancy:', error);
      // Return empty array or mock data on error as fallback
      // To avoid infinite recursion, we don't call this.getHistoricalOccupancy recursively here
      // instead we return a simple mock or empty list
      return [];
    }
  }

  // Transform functions
  private transformDbReportToReport(db: Database['public']['Tables']['compliance_reports']['Row']): ComplianceReport {
    return {
      id: db.id,
      reportPeriod: db.report_period,
      reportType: db.report_type,
      totalTourists: db.total_tourists,
      sustainableCapacity: db.sustainable_capacity,
      complianceScore: db.compliance_score,
      wasteMetrics: db.waste_metrics ? {
        totalWaste: db.waste_metrics.total_waste,
        recycledWaste: db.waste_metrics.recycled_waste,
        wasteReductionTarget: db.waste_metrics.waste_reduction_target,
      } : {
        totalWaste: 0,
        recycledWaste: 0,
        wasteReductionTarget: 0,
      },
      carbonFootprint: db.carbon_footprint,
      ecologicalImpactIndex: db.ecological_impact_index,
      ecologicalDamageIndicators: db.ecological_damage_indicators ? {
        soilCompaction: db.ecological_damage_indicators.soil_compaction,
        vegetationDisturbance: db.ecological_damage_indicators.vegetation_disturbance,
        wildlifeDisturbance: db.ecological_damage_indicators.wildlife_disturbance,
        waterSourceImpact: db.ecological_damage_indicators.water_source_impact,
      } : undefined,
      previousPeriodScore: db.previous_period_score,
      policyViolationsCount: db.policy_violations_count,
      totalFines: db.total_fines,
      status: db.status,
      approvedBy: db.approved_by,
      approvedAt: db.approved_at ? new Date(db.approved_at) : null,
      createdAt: new Date(db.created_at)
    };
  }

  private transformDbViolationToViolation(db: Database['public']['Tables']['policy_violations']['Row']): PolicyViolation {
    return {
      id: db.id,
      destinationId: db.destination_id,
      violationType: db.violation_type,
      description: db.description,
      severity: db.severity,
      fineAmount: db.fine_amount,
      status: db.status,
      reportedAt: new Date(db.reported_at),
      createdAt: new Date(db.created_at)
    };
  }

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

  public transformDbDestinationToDestination(dbDestination: DbDestination): Destination {
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

// Create singleton instance with HMR support
const DB_SERVICE_KEY = 'greenpass.db_service';
export const getDbService = (): DatabaseService => {
  if (typeof globalThis === 'undefined') return new DatabaseService();
  
  const g = globalThis as any;
  if (!g[DB_SERVICE_KEY]) {
    g[DB_SERVICE_KEY] = new DatabaseService();
  }
  return g[DB_SERVICE_KEY];
};

export default DatabaseService;
