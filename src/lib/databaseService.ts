import { supabase, createServerComponentClient } from '@/lib/supabase';
import {
  Tourist,
  Destination,
  Alert,
  DashboardStats,
  ComplianceReport,
  PolicyViolation,
  HistoricalOccupancy,
  EcologicalMetrics,
  AdjustmentLog,
  WasteData,
  WasteMetricsSummary,
  CleanupActivity,
  CleanupRegistration,
  EcoPointsTransaction,
  EcoPointsLeaderboardEntry,
  EcologicalDamageIndicators
} from '@/types';
import { Database } from '@/types/database';
import { isWithinInterval, format } from 'date-fns';
import {
  weatherCache,
  ecologicalIndicatorCache,
  withCache
} from './cache';
import { getPolicyEngine } from './ecologicalPolicyEngine';
import * as mockData from '@/data/mockData';
import { logger } from './logger';

// Type aliases for database types
export type DbTourist = Database['public']['Tables']['tourists']['Row'];
export type DbDestination = Database['public']['Tables']['destinations']['Row'];
export type DbAlert = Database['public']['Tables']['alerts']['Row'];
export type DbWeatherData = Database['public']['Tables']['weather_data']['Row'];
export type DbWasteData = Database['public']['Tables']['waste_data']['Row'];
export type DbCleanupActivity = Database['public']['Tables']['cleanup_activities']['Row'];
export type DbCleanupRegistration = Database['public']['Tables']['cleanup_registrations']['Row'];
export type DbEcoPointsTransaction = Database['public']['Tables']['eco_points_transactions']['Row'];
export type DbComplianceReport = Database['public']['Tables']['compliance_reports']['Row'];
export type DbPolicyViolation = Database['public']['Tables']['policy_violations']['Row'];

// Input types for database operations
export interface WeatherDataInput {
  destination_id: string;
  temperature: number;
  humidity: number;
  pressure: number;
  weather_main: string;
  weather_description: string;
  wind_speed: number;
  wind_direction: number;
  visibility: number;
  recorded_at: string;
  alert_level?: 'none' | 'low' | 'medium' | 'high' | 'critical';
  alert_message?: string | null;
  alert_reason?: string | null;
}

export interface ComplianceReportInput {
  reportPeriod: string;
  reportType: "monthly" | "quarterly";
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
  status?: "pending" | "approved";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

class DatabaseService {
  constructor() {
    // Migration: Removed old weatherCache Map initialization
  }

  private persistCache() {
    // Migration: No longer persisting Map to localStorage as we use lru-cache
  }

  private isPlaceholderMode(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return !supabase || !url || url.includes('placeholder') || url.includes('your-project');
  }

  // Tourist operations
  private validateTouristInsert(tourist: Record<string, unknown>): tourist is Database['public']['Tables']['tourists']['Insert'] {
    const required = [
      'name', 'email', 'phone', 'id_proof', 'nationality',
      'group_size', 'destination_id', 'check_in_date', 'check_out_date',
      'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship'
    ];

    for (const field of required) {
      const val = tourist[field];
      if (val === undefined || val === null || val === '') {
        logger.error(
          `Validation failed: Missing required field "${field}"`,
          null,
          { component: 'databaseService', operation: 'validateTourist', metadata: { field, touristData: tourist } }
        );
        return false;
      }
    }

    // Type-specific validation
    if (typeof tourist.group_size !== 'number' || tourist.group_size <= 0) {
      logger.error(
        'Validation failed: group_size must be a positive number',
        null,
        { component: 'databaseService', operation: 'validateTourist', metadata: { groupSize: tourist.group_size } }
      );
      return false;
    }

    return true;
  }

  async getTourists(userId?: string, page: number = 1, pageSize: number = 20): Promise<Tourist[]> {
    try {
      if (this.isPlaceholderMode() || !db) {
        console.log('Using mock tourists data');
        const start = (page - 1) * pageSize;
        return mockData.tourists.slice(start, start + pageSize);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = db.from('tourists')
        .select(`
          *,
          destinations (
            name,
            location
          )
        `)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error || !data) {
        return [];
      }

      return data.map(this.transformDbTouristToTourist);
    } catch (error) {
      logger.error('Error in getTourists', error, { component: 'databaseService', operation: 'getTourists' });
      return [];
    }
  }

  async getTouristById(id: string): Promise<Tourist | null> {
    try {
      if (this.isPlaceholderMode() || !db) {
        return mockData.tourists.find(t => t.id === id) || null;
      }
      const { data, error } = await db
        .from('tourists')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        logger.error('Error fetching tourist', error, { component: 'databaseService', operation: 'getTouristById', metadata: { touristId: id } });
        return null;
      }

      return this.transformDbTouristToTourist(data);
    } catch (error) {
      logger.error('Error in getTouristById', error, { component: 'databaseService', operation: 'getTouristById', metadata: { touristId: id } });
      return null;
    }
  }

  async addTourist(tourist: Database['public']['Tables']['tourists']['Insert']): Promise<Database['public']['Tables']['tourists']['Row'] | null> {
    try {
      if (this.isPlaceholderMode() || !db) {
        console.log('Using mock addTourist');

        // Check ecological eligibility before adding (consistent with real DB path)
        const eligibility = await this.checkBookingEligibility(tourist.destination_id, tourist.group_size);
        if (!eligibility.allowed) {
          logger.error(
            'Booking blocked by ecological policy',
            eligibility.reason ? new Error(eligibility.reason) : new Error('Ecological policy violation'),
            { component: 'databaseService', operation: 'createBooking', metadata: { destinationId: tourist.destination_id, groupSize: tourist.group_size, reason: eligibility.reason } }
          );
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
          user_id: tourist.user_id || null,
          registration_date: tourist.registration_date || new Date().toISOString(),
          carbon_footprint: tourist.carbon_footprint || null,
          origin_location_id: tourist.origin_location_id || null,
          transport_type: tourist.transport_type || null,
          age: tourist.age,
          gender: tourist.gender,
          address: tourist.address,
          pin_code: tourist.pin_code,
          id_proof_type: tourist.id_proof_type,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          payment_status: 'pending',
          payment_amount: 0,
          payment_id: null
        };

        // Add to mock data array
        mockData.addTourist(this.transformDbTouristToTourist(newTourist));
        return newTourist;
      }
      // Check ecological eligibility before adding
      const eligibility = await this.checkBookingEligibility(tourist.destination_id, tourist.group_size);
      if (!eligibility.allowed) {
        logger.error(
          'Booking blocked by ecological policy',
          eligibility.reason ? new Error(eligibility.reason) : new Error('Ecological policy violation'),
          { component: 'databaseService', operation: 'addTourist', metadata: { destinationId: tourist.destination_id, groupSize: tourist.group_size, reason: eligibility.reason } }
        );
        return null;
      }

      console.log('Attempting to insert tourist:', tourist);

      if (!db) {
        logger.error(
          'Database client not initialized',
          null,
          { component: 'databaseService', operation: 'addTourist' }
        );
        return null;
      }

      // 1. Prepare and validate the record
      const touristToInsert: Database['public']['Tables']['tourists']['Insert'] = {
        name: tourist.name,
        email: tourist.email,
        phone: tourist.phone,
        id_proof: tourist.id_proof,
        nationality: tourist.nationality,
        group_size: tourist.group_size,
        destination_id: tourist.destination_id,
        check_in_date: tourist.check_in_date,
        check_out_date: tourist.check_out_date,
        emergency_contact_name: tourist.emergency_contact_name,
        emergency_contact_phone: tourist.emergency_contact_phone,
        emergency_contact_relationship: tourist.emergency_contact_relationship,
        // Optional fields with proper handling
        id: tourist.id,
        age: tourist.age,
        gender: tourist.gender,
        address: tourist.address,
        pin_code: tourist.pin_code,
        id_proof_type: tourist.id_proof_type,
        group_name: tourist.group_name,
        user_id: tourist.user_id,
        carbon_footprint: tourist.carbon_footprint,
        origin_location_id: tourist.origin_location_id,
        transport_type: tourist.transport_type,
        status: tourist.status || 'pending',
        registration_date: tourist.registration_date || new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (!this.validateTouristInsert(touristToInsert)) {
        return null;
      }

      // 2. Perform insert operation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (db.from('tourists') as any)
        .insert([touristToInsert])
        .select()
        .single();

      if (error) {
        logger.error(
          'Database error adding tourist',
          error,
          { component: 'databaseService', operation: 'addTourist', metadata: { touristData: tourist } }
        );
        return null;
      }

      if (!data) {
        return null;
      }

      // Update occupancy if the tourist is immediately checked-in or approved
      const touristData = data as DbTourist;
      if (touristData.status === 'checked-in' || touristData.status === 'approved') {
        await this.updateDestinationOccupancy(touristData.destination_id);
      }

      return data as DbTourist;
    } catch (error) {
      logger.error('Error in addTourist', error, { component: 'databaseService', operation: 'addTourist', metadata: { touristData: tourist } });
      return null;
    }
  }

  async batchAddTourists(tourists: Database['public']['Tables']['tourists']['Insert'][]): Promise<Database['public']['Tables']['tourists']['Row'][] | null> {
    try {
      if (this.isPlaceholderMode() || !db) {
        console.log('Using mock batchAddTourists');
        const results: DbTourist[] = [];
        for (const t of tourists) {
          const res = await this.addTourist(t);
          if (res) results.push(res as DbTourist);
        }
        return results;
      }

      // Validate all records
      const validatedTourists = tourists.map(t => ({
        ...t,
        created_at: t.created_at || new Date().toISOString(),
        updated_at: t.updated_at || new Date().toISOString(),
        status: t.status || 'pending'
      }));

      for (const t of validatedTourists) {
        if (!this.validateTouristInsert(t)) {
          throw new Error('Batch validation failed');
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (db.from('tourists') as any)
        .insert(validatedTourists)
        .select();

      if (error) {
        logger.error(
          'Database error batch adding tourists',
          error,
          { component: 'databaseService', operation: 'batchAddTourists', metadata: { touristCount: tourists.length } }
        );
        return null;
      }

      return data as DbTourist[];
    } catch (error) {
      logger.error('Error in batchAddTourists', error, { component: 'databaseService', operation: 'batchAddTourists', metadata: { touristCount: tourists.length } });
      return null;
    }
  }

  async updateTouristStatus(touristId: string, status: Tourist['status']): Promise<boolean> {
    try {
      if (this.isPlaceholderMode() || !db) {
        // Get the tourist to find their destination and group size
        const tourist = await this.getTouristById(touristId);
        if (!tourist) {
          logger.error(
            'Tourist not found for status update',
            null,
            { component: 'databaseService', operation: 'updateTouristStatus', metadata: { touristId } }
          );
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
            logger.error(
              'Status update blocked by capacity/policy',
              eligibility.reason ? new Error(eligibility.reason) : new Error('Capacity/policy violation'),
              { component: 'databaseService', operation: 'updateTouristStatus', metadata: { touristId, destinationId, reason: eligibility.reason } }
            );
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

      const { error } = await db
        .from('tourists')
        .update({ status })
        .eq('id', touristId);

      if (error) {
        logger.error(
          'Error updating tourist status',
          error,
          { component: 'databaseService', operation: 'updateTouristStatus', metadata: { touristId, status } }
        );
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
      logger.error('Error in updateTouristStatus', error, { component: 'databaseService', operation: 'updateTouristStatus', metadata: { touristId, status } });
      return false;
    }
  }

  /**
   * Updates the current_occupancy field in the destinations table
   * based on the sum of group_size for all 'checked-in or approved' tourists.
   */
  async updateDestinationOccupancy(destinationId: string): Promise<void> {
    try {
      if (this.isPlaceholderMode() || !db) return;

      const occupancy = await this.getCurrentOccupancy(destinationId);

      const { error } = await db
        .from('destinations')
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
  async getDestinations(page: number = 1, pageSize: number = 20): Promise<Database['public']['Tables']['destinations']['Row'][]> {
    try {
      if (this.isPlaceholderMode() || !db) {
        console.log('Using mock destinations data');
        const start = (page - 1) * pageSize;
        return mockData.destinations.slice(start, start + pageSize).map(d => ({
          id: d.id,
          name: d.name,
          location: d.location,
          max_capacity: d.maxCapacity,
          current_occupancy: d.currentOccupancy,
          description: d.description,
          guidelines: d.guidelines,
          is_active: d.isActive,
          ecological_sensitivity: d.ecologicalSensitivity,
          sustainability_features: d.sustainabilityFeatures,
          latitude: d.coordinates.latitude,
          longitude: d.coordinates.longitude,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Fetch destinations and their current occupancy from tourists table in one go
      const { data: destinations, error: destError } = await db
        .from('destinations')
        .select('*')
        .order('name')
        .range(from, to);

      if (destError) throw destError;
      if (!destinations) throw new Error('No destinations found');

      const destinationIds = (destinations as DbDestination[]).map(d => d.id);

      const { data: occupancyData, error: occError } = await db
        .from('tourists')
        .select('destination_id, group_size')
        .in('destination_id', destinationIds)
        .or('status.eq.checked-in,status.eq.approved');

      if (occError) throw occError;

      // Calculate occupancy for each destination
      const occupancyMap: Record<string, number> = {};
      occupancyData?.forEach((t: { destination_id: string; group_size: number }) => {
        occupancyMap[t.destination_id] = (occupancyMap[t.destination_id] || 0) + t.group_size;
      });

      // Merge occupancy into destinations
      const updatedDestinations = (destinations || []).map((dest: DbDestination): DbDestination => ({
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
      if (this.isPlaceholderMode() || !db) {
        const mockDest = mockData.destinations.find(d => d.id === id);
        return mockDest || null;
      }
      const { data, error } = await db
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
      if (this.isPlaceholderMode() || !db) {
        return mockData.getCurrentOccupancy(destinationId);
      }
      const { data, error } = await db
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

      return (data).reduce((total: number, tourist: { group_size: number }): number => total + tourist.group_size, 0);
    } catch (error) {
      console.error('Error in getCurrentOccupancy:', error);
      return 0;
    }
  }

  async getAvailableCapacity(destinationId: string): Promise<number> {
    try {
      const destination = await this.getDestinationById(destinationId);
      if (!destination) return 0;

      return await getPolicyEngine().getAvailableSpots(destination);
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

      return await getPolicyEngine().isBookingAllowed(destinationWithRealTimeOccupancy, groupSize);
    } catch (error) {
      console.error('Error in checkBookingEligibility:', error);
      return { allowed: false, reason: 'Error checking eligibility' };
    }
  }

  // Alert operations
  async getAlerts(destinationId?: string): Promise<Alert[]> {
    try {
      if (this.isPlaceholderMode() || !db) {
        console.log('Using mock alerts data');
        let alerts = [...mockData.alerts];
        if (destinationId) {
          alerts = alerts.filter(a => a.destinationId === destinationId);
        }
        return alerts;
      }
      let query = db
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
        const ecoAlert = policyEngine.generateEcologicalAlerts(this.transformDbDestinationToDestination(dest));
        if (ecoAlert) {
          const alertId = `eco-${dest.id}`;
          // Avoid duplication if an alert with this ID already exists
          if (!alerts.some((a: Alert) => a.id === alertId)) {
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
      if (this.isPlaceholderMode() || !db) return null;
      const { data, error } = await db
        .from('alerts')
        .insert({
          type: alert.type,
          title: alert.title,
          message: alert.message,
          severity: alert.severity,
          destination_id: alert.destinationId,
          is_active: alert.isActive,
        })
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
      if (this.isPlaceholderMode() || !db) return;
      const { error } = await db
        .from('alerts')
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
      if (this.isPlaceholderMode() || !db) return true;
      const { error } = await db
        .from('alerts')
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

  // Waste Data Operations
  async getWasteData(destinationId?: string): Promise<WasteData[]> {
    try {
      if (this.isPlaceholderMode() || !db) {
        let data = [...mockData.wasteData];
        if (destinationId) {
          data = data.filter(w => w.destinationId === destinationId);
        }
        return data;
      }

      let query = db.from('waste_data').select('*');
      if (destinationId) {
        query = query.eq('destination_id', destinationId);
      }

      const { data, error } = await query.order('collected_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(this.transformDbWasteToWaste);
    } catch (error) {
      console.error('Error in getWasteData:', error);
      return [];
    }
  }

  async getWasteDataByDateRange(startDate: Date, endDate: Date, destinationId?: string): Promise<WasteData[]> {
    try {
      if (this.isPlaceholderMode() || !db) {
        let data = mockData.wasteData.filter(w =>
          isWithinInterval(new Date(w.collectedAt), { start: startDate, end: endDate })
        );
        if (destinationId) {
          data = data.filter(w => w.destinationId === destinationId);
        }
        return data;
      }

      let query = db
        .from('waste_data')
        .select('*')
        .gte('collected_at', startDate.toISOString())
        .lte('collected_at', endDate.toISOString());

      if (destinationId) {
        query = query.eq('destination_id', destinationId);
      }

      const { data, error } = await query.order('collected_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(this.transformDbWasteToWaste);
    } catch (error) {
      console.error('Error in getWasteDataByDateRange:', error);
      return [];
    }
  }

  async addWasteData(waste: Database['public']['Tables']['waste_data']['Insert']): Promise<WasteData | null> {
    try {
      if (this.isPlaceholderMode() || !db) {
        const newData: DbWasteData = {
          id: `mock-waste-${Date.now()}`,
          destination_id: waste.destination_id,
          waste_type: waste.waste_type,
          quantity: waste.quantity,
          unit: waste.unit || 'kg',
          collected_at: waste.collected_at || new Date().toISOString(),
          created_at: new Date().toISOString()
        };
        const transformed = this.transformDbWasteToWaste(newData);
        mockData.wasteData.push(transformed);
        return transformed;
      }

      const { data, error } = await db
        .from('waste_data')
        .insert(waste)
        .select()
        .single();

      if (error || !data) throw error;
      return this.transformDbWasteToWaste(data);
    } catch (error) {
      console.error('Error in addWasteData:', error);
      return null;
    }
  }

  async updateWasteData(id: string, updates: Database['public']['Tables']['waste_data']['Update']): Promise<WasteData | null> {
    try {
      if (this.isPlaceholderMode() || !db) {
        const index = mockData.wasteData.findIndex(w => w.id === id);
        if (index === -1) return null;
        const transformedUpdates = this.transformUpdateWasteToWaste(updates);
        mockData.wasteData[index] = { ...mockData.wasteData[index], ...transformedUpdates };
        return mockData.wasteData[index];
      }

      const { data, error } = await db
        .from('waste_data')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error || !data) throw error;
      return this.transformDbWasteToWaste(data);
    } catch (error) {
      console.error('Error in updateWasteData:', error);
      return null;
    }
  }

  async deleteWasteData(id: string): Promise<boolean> {
    try {
      if (this.isPlaceholderMode() || !db) {
        const index = mockData.wasteData.findIndex(w => w.id === id);
        if (index === -1) return false;
        mockData.wasteData.splice(index, 1);
        return true;
      }

      const { error } = await db
        .from('waste_data')
        .delete()
        .eq('id', id);

      return !error;
    } catch (error) {
      console.error('Error in deleteWasteData:', error);
      return false;
    }
  }

  async getCollectiveImpactMetrics(): Promise<{ totalWaste: number, totalVolunteers: number }> {
    try {
      const summary = await this.getWasteMetricsSummary('all', 365); // Get metrics for the last year
      return {
        totalWaste: summary.totalWaste,
        totalVolunteers: summary.totalVolunteers
      };
    } catch (error) {
      console.error('Error in getCollectiveImpactMetrics:', error);
      return { totalWaste: 0, totalVolunteers: 0 };
    }
  }

  async getWasteMetricsSummary(destinationId: string = 'all', days: number = 30): Promise<WasteMetricsSummary> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      let data: WasteData[] = [];
      if (destinationId === 'all') {
        data = await this.getWasteDataByDateRange(startDate, endDate);
      } else {
        data = await this.getWasteDataByDateRange(startDate, endDate, destinationId);
      }

      const byType: Record<string, number> = {};
      let total = 0;
      let recycled = 0;

      data.forEach(w => {
        byType[w.wasteType] = (byType[w.wasteType] || 0) + w.quantity;
        total += w.quantity;
        if (['plastic', 'glass', 'metal', 'paper'].includes(w.wasteType)) {
          recycled += w.quantity;
        }
      });

      const activities = await this.getCleanupActivities(destinationId === 'all' ? undefined : destinationId);
      const activeCleanupEvents = activities.filter(a => a.status === 'ongoing' || a.status === 'upcoming').length;
      const totalVolunteers = activities.reduce((sum, a) => sum + a.currentParticipants, 0);

      return {
        totalWaste: total,
        totalQuantity: total,
        recyclingRate: total > 0 ? (recycled / total) * 100 : 0,
        activeCleanupEvents,
        totalVolunteers,
        byType,
        period: `last-${days}-days`,
        trend: 'stable'
      };
    } catch (error) {
      console.error('Error in getWasteMetricsSummary:', error);
      return {
        totalWaste: 0,
        totalQuantity: 0,
        recyclingRate: 0,
        activeCleanupEvents: 0,
        totalVolunteers: 0,
        byType: {},
        period: `last-${days}-days`,
        trend: 'stable'
      };
    }
  }

  // Cleanup Activity Operations
  async updateCleanupRegistration(registrationId: string, updates: Partial<CleanupRegistration>): Promise<boolean> {
    try {
      if (this.isPlaceholderMode()) {
        const index = mockData.cleanupRegistrations.findIndex(r => r.id === registrationId);
        if (index === -1) return false;

        mockData.cleanupRegistrations[index] = {
          ...mockData.cleanupRegistrations[index],
          ...updates,
          // Handle specific field mapping if necessary
          attended: updates.attended !== undefined ? updates.attended : mockData.cleanupRegistrations[index].attended,
        };
        return true;
      } else {
        if (!db) return false;
        const dbUpdates: Database['public']['Tables']['cleanup_registrations']['Update'] = {};
        if (updates.activityId !== undefined) dbUpdates.activity_id = updates.activityId;
        if (updates.userId !== undefined) dbUpdates.user_id = updates.userId;
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.registeredAt !== undefined) {
          dbUpdates.registered_at = updates.registeredAt instanceof Date
            ? updates.registeredAt.toISOString()
            : updates.registeredAt;
        }
        if (updates.attended !== undefined) dbUpdates.attended = updates.attended;

        const { error } = await db
          .from('cleanup_registrations')
          .update(dbUpdates)
          .eq('id', registrationId);

        if (error) throw error;
        return true;
      }
    } catch (error) {
      console.error('Error in updateCleanupRegistration:', error);
      return false;
    }
  }

  async getCleanupActivities(destinationId?: string): Promise<CleanupActivity[]> {
    try {
      if (this.isPlaceholderMode() || !db) {
        let activities = [...mockData.cleanupActivities];
        if (destinationId) {
          activities = activities.filter(a => a.destinationId === destinationId);
        }
        return activities;
      }

      let query = db.from('cleanup_activities').select('*');
      if (destinationId) {
        query = query.eq('destination_id', destinationId);
      }

      const { data, error } = await query.order('start_time', { ascending: true });
      if (error) throw error;
      return (data || []).map(this.transformDbCleanupActivityToCleanupActivity);
    } catch (error) {
      console.error('Error in getCleanupActivities:', error);
      return [];
    }
  }

  async getUpcomingCleanupActivities(): Promise<CleanupActivity[]> {
    try {
      if (this.isPlaceholderMode() || !db) {
        return mockData.cleanupActivities.filter(a =>
          new Date(a.startTime) > new Date() && a.status === 'upcoming'
        );
      }

      const { data, error } = await db
        .from('cleanup_activities')
        .select('*')
        .gt('start_time', new Date().toISOString())
        .eq('status', 'upcoming')
        .order('start_time', { ascending: true });

      if (error) throw error;
      return (data || []).map(this.transformDbCleanupActivityToCleanupActivity);
    } catch (error) {
      console.error('Error in getUpcomingCleanupActivities:', error);
      return [];
    }
  }

  async getCleanupActivityById(id: string): Promise<CleanupActivity | null> {
    try {
      if (this.isPlaceholderMode() || !db) {
        return mockData.cleanupActivities.find(a => a.id === id) || null;
      }

      const { data, error } = await db
        .from('cleanup_activities')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return null;
      return this.transformDbCleanupActivityToCleanupActivity(data);
    } catch (error) {
      console.error('Error in getCleanupActivityById:', error);
      return null;
    }
  }

  async createCleanupActivity(activity: Database['public']['Tables']['cleanup_activities']['Insert']): Promise<CleanupActivity | null> {
    try {
      if (this.isPlaceholderMode() || !db) {
        const newActivity: DbCleanupActivity = {
          id: `mock-cleanup-${Date.now()}`,
          destination_id: activity.destination_id,
          title: activity.title,
          description: activity.description || '',
          start_time: activity.start_time,
          end_time: activity.end_time,
          location: activity.location || '',
          max_participants: activity.max_participants,
          current_participants: 0,
          status: 'upcoming',
          eco_points_reward: activity.eco_points_reward || 0,
          created_at: new Date().toISOString()
        };
        const transformed = this.transformDbCleanupActivityToCleanupActivity(newActivity);
        mockData.cleanupActivities.push(transformed);
        return transformed;
      }

      const { data, error } = await db
        .from('cleanup_activities')
        .insert(activity)
        .select()
        .single();

      if (error || !data) throw error;
      return this.transformDbCleanupActivityToCleanupActivity(data);
    } catch (error) {
      console.error('Error in createCleanupActivity:', error);
      return null;
    }
  }

  async updateCleanupActivity(id: string, updates: Database['public']['Tables']['cleanup_activities']['Update']): Promise<CleanupActivity | null> {
    try {
      if (this.isPlaceholderMode() || !db) {
        const index = mockData.cleanupActivities.findIndex(a => a.id === id);
        if (index === -1) return null;

        // Transform the snake_case updates to camelCase before merging
        const transformedUpdates = this.transformUpdateCleanupToCleanup(updates);
        mockData.cleanupActivities[index] = {
          ...mockData.cleanupActivities[index],
          ...transformedUpdates
        };
        return mockData.cleanupActivities[index];
      }

      const { data, error } = await db
        .from('cleanup_activities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error || !data) throw error;
      return this.transformDbCleanupActivityToCleanupActivity(data);
    } catch (error) {
      console.error('Error in updateCleanupActivity:', error);
      return null;
    }
  }

  async cancelCleanupActivity(id: string): Promise<boolean> {
    try {
      if (this.isPlaceholderMode() || !db) {
        const index = mockData.cleanupActivities.findIndex(a => a.id === id);
        if (index === -1) return false;
        mockData.cleanupActivities[index].status = 'cancelled';
        return true;
      }

      const { error } = await db
        .from('cleanup_activities')
        .update({ status: 'cancelled' })
        .eq('id', id);

      return !error;
    } catch (error) {
      console.error('Error in cancelCleanupActivity:', error);
      return false;
    }
  }

  // Registration Operations
  async registerForCleanup(activityId: string, userId: string): Promise<boolean> {
    try {
      if (this.isPlaceholderMode() || !db) {
        const activity = await this.getCleanupActivityById(activityId);
        if (!activity || activity.status !== 'upcoming') return false;

        // Duplicate check in mock mode
        const existingReg = mockData.cleanupRegistrations.find(
          r => r.activityId === activityId && r.userId === userId
        );
        if (existingReg) return false;

        // Atomic check and increment in mock mode
        const actIndex = mockData.cleanupActivities.findIndex(a => a.id === activityId);
        if (actIndex === -1) return false;

        const targetActivity = mockData.cleanupActivities[actIndex];
        if (targetActivity.currentParticipants >= targetActivity.maxParticipants) {
          return false;
        }

        const newReg: DbCleanupRegistration = {
          id: `mock-reg-${Date.now()}`,
          activity_id: activityId,
          user_id: userId,
          status: 'registered',
          attended: false,
          registered_at: new Date().toISOString()
        };

        mockData.cleanupRegistrations.push(this.transformDbCleanupRegistrationToCleanupRegistration(newReg));
        targetActivity.currentParticipants += 1;

        return true;
      }

      // Use an atomic RPC call to handle registration and participant increment
      // This prevents race conditions and overbooking.

      // Duplicate check in production mode as a guard
      const { data: existingReg, error: checkError } = await db
        .from('cleanup_registrations')
        .select('id')
        .eq('activity_id', activityId)
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking for duplicate registration:', checkError);
      } else if (existingReg) {
        return false;
      }

      // SQL for this RPC (register_for_cleanup):
      /*
      CREATE OR REPLACE FUNCTION register_for_cleanup(p_activity_id UUID, p_user_id UUID)
      RETURNS BOOLEAN AS $$
      DECLARE
        v_current INT;
        v_max INT;
        v_status TEXT;
      BEGIN
        -- Get current status and capacity with a row-level lock
        SELECT current_participants, max_participants, status 
        INTO v_current, v_max, v_status
        FROM cleanup_activities 
        WHERE id = p_activity_id 
        FOR UPDATE;

        IF v_status != 'upcoming' THEN
          RETURN FALSE;
        END IF;

        -- Check for duplicate registration
        IF EXISTS (
          SELECT 1 FROM cleanup_registrations 
          WHERE activity_id = p_activity_id AND user_id = p_user_id
        ) THEN
          RETURN FALSE;
        END IF;

        IF v_current >= v_max THEN
          RETURN FALSE;
        END IF;

        -- Insert registration
        INSERT INTO cleanup_registrations (activity_id, user_id, status)
        VALUES (p_activity_id, p_user_id, 'registered');

        -- Increment participants
        UPDATE cleanup_activities 
        SET current_participants = current_participants + 1 
        WHERE id = p_activity_id;

        RETURN TRUE;
      EXCEPTION WHEN OTHERS THEN
        RETURN FALSE;
      END;
      $$ LANGUAGE plpgsql;
      */
      const { data, error } = await db.rpc('register_for_cleanup', {
        p_activity_id: activityId,
        p_user_id: userId
      });

      if (error) {
        console.error('RPC Error in registerForCleanup:', error);
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error in registerForCleanup:', error);
      return false;
    }
  }

  async cancelCleanupRegistration(registrationId: string): Promise<boolean> {
    try {
      if (this.isPlaceholderMode() || !db) {
        const reg = mockData.cleanupRegistrations.find(r => r.id === registrationId);
        if (!reg) return false;

        const index = mockData.cleanupRegistrations.findIndex(r => r.id === registrationId);
        mockData.cleanupRegistrations.splice(index, 1);

        const actIndex = mockData.cleanupActivities.findIndex(a => a.id === reg.activityId);
        if (actIndex !== -1) {
          mockData.cleanupActivities[actIndex].currentParticipants -= 1;
        }
        return true;
      }

      // Use an atomic RPC call to handle cancellation and participant decrement
      // SQL for this RPC (cancel_cleanup_registration):
      /*
      CREATE OR REPLACE FUNCTION cancel_cleanup_registration(p_registration_id UUID)
      RETURNS BOOLEAN AS $$
      DECLARE
        v_activity_id UUID;
      BEGIN
        -- Get activity_id before deleting
        SELECT activity_id INTO v_activity_id
        FROM cleanup_registrations
        WHERE id = p_registration_id;

        IF v_activity_id IS NULL THEN
          RETURN FALSE;
        END IF;

        -- Delete registration
        DELETE FROM cleanup_registrations
        WHERE id = p_registration_id;

        -- Decrement participants (ensure it doesn't go below 0)
        UPDATE cleanup_activities
        SET current_participants = GREATEST(0, current_participants - 1)
        WHERE id = v_activity_id;

        RETURN TRUE;
      EXCEPTION WHEN OTHERS THEN
        RETURN FALSE;
      END;
      $$ LANGUAGE plpgsql;
      */
      const { data, error } = await db.rpc('cancel_cleanup_registration', {
        p_registration_id: registrationId
      });

      if (error) {
        console.error('RPC Error in cancelCleanupRegistration:', error);
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error in cancelCleanupRegistration:', error);
      return false;
    }
  }

  async confirmCleanupAttendance(registrationId: string): Promise<boolean> {
    try {
      let reg: DbCleanupRegistration | null = null;
      if (this.isPlaceholderMode() || !db) {
        const index = mockData.cleanupRegistrations.findIndex(r => r.id === registrationId);
        if (index === -1) return false;

        // Only award if not already attended
        if (mockData.cleanupRegistrations[index].attended) return true;

        mockData.cleanupRegistrations[index].attended = true;
        mockData.cleanupRegistrations[index].status = 'attended';

        // Convert mock back to DbCleanupRegistration for consistent processing
        const mock = mockData.cleanupRegistrations[index];
        reg = {
          id: mock.id,
          activity_id: mock.activityId,
          user_id: mock.userId,
          status: mock.status,
          attended: mock.attended,
          registered_at: mock.registeredAt.toISOString()
        };
      } else {
        // Atomic update only if attended is false
        const { data, error } = await db
          .from('cleanup_registrations')
          .update({ attended: true, status: 'attended' })
          .eq('id', registrationId)
          .eq('attended', false)
          .select()
          .single();

        // If error or no row returned, check if it's already attended
        if (error || !data) {
          // If the record exists but was already attended, just return true
          const { data: existing } = await db
            .from('cleanup_registrations')
            .select('attended')
            .eq('id', registrationId)
            .single();

          if (existing?.attended) return true;
          if (error) throw error;
          return false;
        }

        reg = data;
      }

      if (!reg) return false;

      // Award eco-points
      const activityId = reg.activity_id;
      const activity = await this.getCleanupActivityById(activityId);
      if (activity && activity.ecoPointsReward > 0) {
        const userId = reg.user_id;
        await this.awardEcoPoints(userId, activity.ecoPointsReward, `Participated in ${activity.title}`);
      }

      return true;
    } catch (error) {
      console.error('Error in confirmCleanupAttendance:', error);
      return false;
    }
  }

  async getUserCleanupRegistrations(userId: string): Promise<CleanupRegistration[]> {
    try {
      if (this.isPlaceholderMode() || !db) {
        if (userId === 'all') return mockData.cleanupRegistrations;
        return mockData.cleanupRegistrations.filter(r => r.userId === userId);
      }

      let query = db.from('cleanup_registrations').select('*');
      if (userId !== 'all') {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(this.transformDbCleanupRegistrationToCleanupRegistration);
    } catch (error) {
      console.error('Error in getUserCleanupRegistrations:', error);
      return [];
    }
  }

  async getCleanupRegistrationsByActivity(activityId: string): Promise<CleanupRegistration[]> {
    try {
      if (this.isPlaceholderMode() || !db) {
        return mockData.cleanupRegistrations.filter(r => r.activityId === activityId);
      }

      const { data, error } = await db
        .from('cleanup_registrations')
        .select('*')
        .eq('activity_id', activityId);

      if (error) throw error;
      return (data || []).map(this.transformDbCleanupRegistrationToCleanupRegistration);
    } catch (error) {
      console.error('Error in getCleanupRegistrationsByActivity:', error);
      return [];
    }
  }

  // Eco-points Operations
  async getEcoPointsBalance(userId: string): Promise<number> {
    try {
      if (this.isPlaceholderMode() || !db) {
        return 450; // Mock balance
      }

      const { data, error } = await db
        .from('users')
        .select('eco_points')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data?.eco_points || 0;
    } catch (error) {
      console.error('Error in getEcoPointsBalance:', error);
      return 0;
    }
  }

  async awardEcoPoints(userId: string, points: number, description: string): Promise<boolean> {
    try {
      if (this.isPlaceholderMode() || !db) {
        mockData.ecoPointsTransactions.push({
          id: `mock-trans-${Date.now()}`,
          userId,
          points,
          transactionType: 'award',
          description,
          createdAt: new Date(),
        });
        return true;
      }

      // Use an atomic RPC call to award points and log the transaction.
      // This avoids race conditions (lost increments) that occur with read-then-write patterns.
      // SQL for this RPC (award_eco_points):
      /*
      CREATE OR REPLACE FUNCTION award_eco_points(p_user_id UUID, p_points INTEGER, p_description TEXT)
      RETURNS BOOLEAN AS $$
      BEGIN
        -- Add transaction record
        INSERT INTO eco_points_transactions (user_id, points, transaction_type, description)
        VALUES (p_user_id, p_points, 'award', p_description);

        -- Atomic increment of user balance
        UPDATE users 
        SET eco_points = COALESCE(eco_points, 0) + p_points 
        WHERE id = p_user_id;

        RETURN TRUE;
      EXCEPTION WHEN OTHERS THEN
        RETURN FALSE;
      END;
      $$ LANGUAGE plpgsql;
      */
      const { data, error } = await db.rpc('award_eco_points', {
        p_user_id: userId,
        p_points: points,
        p_description: description
      });

      if (error) {
        console.error('RPC Error in awardEcoPoints:', error);
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error in awardEcoPoints:', error);
      return false;
    }
  }

  async getEcoPointsHistory(userId: string): Promise<EcoPointsTransaction[]> {
    try {
      if (this.isPlaceholderMode() || !db) {
        return mockData.ecoPointsTransactions.filter(t => t.userId === userId);
      }

      const { data, error } = await db
        .from('eco_points_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(this.transformDbEcoPointsTransactionToEcoPointsTransaction);
    } catch (error) {
      console.error('Error in getEcoPointsHistory:', error);
      return [];
    }
  }

  async getUserImpactTier(userId: string): Promise<string> {
    try {
      const balance = await this.getEcoPointsBalance(userId);
      if (balance >= 1000) return 'Diamond Guardian';
      if (balance >= 500) return 'Gold Guardian';
      if (balance >= 200) return 'Silver Guardian';
      if (balance >= 50) return 'Bronze Guardian';
      return 'Eco Novice';
    } catch (error) {
      console.error('Error in getUserImpactTier:', error);
      return 'Eco Novice';
    }
  }

  async getEcoPointsLeaderboard(limit: number = 10): Promise<EcoPointsLeaderboardEntry[]> {
    try {
      if (this.isPlaceholderMode() || !db) {
        return [
          { userId: 'u1', name: 'Eco Warrior', points: 1200, rank: 1 },
          { userId: 'u2', name: 'Green Traveler', points: 950, rank: 2 },
          { userId: 'u3', name: 'Nature Lover', points: 800, rank: 3 },
        ];
      }

      const { data, error } = await db
        .from('users')
        .select('id, name, eco_points')
        .order('eco_points', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []).map((u: { id: string; name: string | null; eco_points: number | null }, index: number) => ({
        userId: u.id,
        name: u.name || 'Anonymous',
        points: u.eco_points || 0,
        rank: index + 1
      }));
    } catch (error) {
      console.error('Error in getEcoPointsLeaderboard:', error);
      return [];
    }
  }

  async getLatestEcologicalIndicators(destinationId: string): Promise<{ soil_compaction: number; vegetation_disturbance: number; wildlife_disturbance: number; water_source_impact: number } | null> {
    try {
      if (this.isPlaceholderMode() || !db) return null;

      const { data, error } = await db
        .from('compliance_reports')
        .select('ecological_damage_indicators')
        .eq('destination_id', destinationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data || !data.ecological_damage_indicators) {
        return null;
      }

      return data.ecological_damage_indicators as { soil_compaction: number; vegetation_disturbance: number; wildlife_disturbance: number; water_source_impact: number };
    } catch (error) {
      console.error('Error fetching ecological indicators:', error);
      return null;
    }
  }

  // Batch query methods for eliminating N+1 queries
  async getWeatherDataForDestinations(destinationIds: string[]): Promise<Map<string, DbWeatherData>> {
    try {
      if (this.isPlaceholderMode() || !db) {
        // Return mock data for placeholder mode
        const result = new Map<string, DbWeatherData>();
        for (const id of destinationIds) {
          result.set(id, {
            id: `mock-w-${id}`,
            destination_id: id,
            temperature: 22,
            humidity: 60,
            pressure: 1013,
            weather_main: 'Clear',
            weather_description: 'Mock data',
            wind_speed: 5,
            wind_direction: 180,
            visibility: 10000,
            recorded_at: new Date().toISOString(),
            alert_level: 'none',
            alert_message: null,
            alert_reason: null,
            created_at: new Date().toISOString()
          });
        }
        return result;
      }

      // Check cache first for all requested IDs
      const result = new Map<string, DbWeatherData>();
      const missingIds: string[] = [];

      for (const id of destinationIds) {
        const cached = weatherCache.get(id) as DbWeatherData;
        if (cached) {
          result.set(id, cached);
        } else {
          missingIds.push(id);
        }
      }

      if (missingIds.length === 0) {
        return result;
      }

      // Fetch missing data in a single batch query
      const { data, error } = await db
        .from('weather_data')
        .select('*')
        .in('destination_id', missingIds)
        .order('recorded_at', { ascending: false });

      if (error) {
        console.error('Error batch fetching weather:', error);
        return result; // Return what we have from cache
      }

      // Process results: deduplicate to keep only the latest per destination
      // The query is ordered by recorded_at desc, so first occurrence is the latest
      if (data) {
        const processedIds = new Set<string>();

        for (const record of data) {
          const destId = record.destination_id;
          if (!processedIds.has(destId)) {
            processedIds.add(destId);
            // Cache the result
            weatherCache.set(destId, record);
            result.set(destId, record);
          }
        }
      }

      return result;
    } catch (error) {
      console.error('Error in getWeatherDataForDestinations:', error);
      return new Map();
    }
  }

  async getEcologicalIndicatorsForDestinations(destinationIds: string[]): Promise<Map<string, { soil_compaction: number; vegetation_disturbance: number; wildlife_disturbance: number; water_source_impact: number }>> {
    try {
      if (this.isPlaceholderMode() || !db) return new Map();

      // Check cache first
      const result = new Map<string, { soil_compaction: number; vegetation_disturbance: number; wildlife_disturbance: number; water_source_impact: number }>();
      const missingIds: string[] = [];

      for (const id of destinationIds) {
        const cached = ecologicalIndicatorCache.get(id);
        if (cached !== undefined) {
          result.set(id, cached);
        } else {
          missingIds.push(id);
        }
      }

      if (missingIds.length === 0) {
        return result;
      }

      // Batch fetch latest compliance reports for missing IDs
      // Note: This is tricky because we need the latest report PER destination
      // A common pattern is to fetch reports for these destinations created recently

      // Since supabase-js .select() with distinct on specific columns isn't straightforward for "latest per group"
      // without a stored procedure or complex query, we'll fetch recent reports and filter in memory
      // for the sake of this implementation, assuming reasonable data volume.
      // A better approach for production would be a Postgres function or view.

      const { data, error } = await db
        .from('compliance_reports')
        .select('destination_id, ecological_damage_indicators, created_at')
        .in('destination_id', missingIds)
        .order('created_at', { ascending: false })
        .limit(missingIds.length * 5); // Fetch enough recent records to likely cover all destinations

      if (error) {
        console.error('Error batch fetching indicators:', error);
        return result;
      }

      if (data) {
        const processedIds = new Set<string>();

        for (const record of data) {
          if (!processedIds.has(record.destination_id) && record.ecological_damage_indicators) {
            processedIds.add(record.destination_id);
            const indicators = record.ecological_damage_indicators;

            // Cache it
            ecologicalIndicatorCache.set(record.destination_id, indicators);
            result.set(record.destination_id, indicators);
          }
        }
      }

      return result;
    } catch (error) {
      console.error('Error in getEcologicalIndicatorsForDestinations:', error);
      return new Map();
    }
  }

  async getDestinationsWithWeather(): Promise<Destination[]> {
    try {
      const destinations = await this.getDestinations();
      if (!destinations.length) return [];

      const destinationIds = destinations.map(d => d.id);
      const weatherMap = await this.getWeatherDataForDestinations(destinationIds);

      return destinations.map(dbDest => {
        const dest = this.transformDbDestinationToDestination(dbDest);
        const weather = weatherMap.get(dbDest.id);

        if (weather) {
          dest.weather = {
            temperature: weather.temperature,
            humidity: weather.humidity,
            weatherMain: weather.weather_main,
            weatherDescription: weather.weather_description,
            windSpeed: weather.wind_speed,
            alertLevel: weather.alert_level || 'none',
            recordedAt: weather.recorded_at
          };
        }

        return dest;
      });
    } catch (error) {
      console.error('Error in getDestinationsWithWeather:', error);
      return [];
    }
  }

  // Dashboard statistics
  getPolicyEngine() {
    return getPolicyEngine();
  }

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const [tourists, destinations, alerts, wasteMetrics] = await Promise.all([
        this.getTourists(),
        this.getDestinations(),
        this.getAlerts(),
        this.getWasteMetricsSummary()
      ]);

      const physicalMaxCapacity = destinations.reduce((sum, dest) => sum + (dest.max_capacity || 0), 0);

      const policyEngine = getPolicyEngine();
      const destinationIds = destinations.map(d => d.id);

      // Batch-fetch weather and indicators for capacity calculations
      const [weatherBatch, indicatorsBatch] = await Promise.all([
        this.getWeatherDataForDestinations(destinationIds),
        this.getEcologicalIndicatorsForDestinations(destinationIds)
      ]);

      const batchCapacitiesMap = await policyEngine.getBatchAdjustedCapacities(
        destinations.map(d => this.transformDbDestinationToDestination(d)),
        weatherBatch,
        indicatorsBatch
      );

      const adjustedMaxCapacity = Array.from(batchCapacitiesMap.values()).reduce((sum, cap) => sum + cap, 0);

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
        totalWasteCollected: wasteMetrics.totalWaste,
        activeCleanupEvents: wasteMetrics.activeCleanupEvents,
        totalVolunteers: wasteMetrics.totalVolunteers,
        recyclingRate: wasteMetrics.recyclingRate
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
        totalWasteCollected: 0,
        activeCleanupEvents: 0,
        totalVolunteers: 0,
        recyclingRate: 0
      };
    }
  }

  // Capacity adjustment history operations
  async logCapacityAdjustment(log: AdjustmentLog): Promise<void> {
    try {
      if (this.isPlaceholderMode()) {
        const historyKey = 'greenpass_capacity_history';
        const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
        history.push({
          ...log,
          timestamp: log.timestamp instanceof Date ? log.timestamp.toISOString() : log.timestamp
        });
        // Keep only last 1000 records
        if (history.length > 1000) history.shift();
        localStorage.setItem(historyKey, JSON.stringify(history));
        return;
      }

      // Fallback to compliance_reports or a dedicated table if available
      // For now, using localStorage even in "Supabase" mode if table doesn't exist
      // is a safe bet for this specific requirement unless we have the schema.
      const historyKey = 'greenpass_capacity_history';
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
      history.push(log);
      localStorage.setItem(historyKey, JSON.stringify(history));
    } catch (error) {
      console.error('Error logging capacity adjustment:', error);
    }
  }

  async getCapacityAdjustmentHistory(destinationId?: string, days: number = 7): Promise<AdjustmentLog[]> {
    try {
      const historyKey = 'greenpass_capacity_history';
      const rawHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');

      let history = rawHistory.map((item: { timestamp: string;[key: string]: unknown }) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      } as AdjustmentLog));

      // Filter by date
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      history = history.filter((item: AdjustmentLog) => item.timestamp >= cutoff);

      // Filter by destination
      if (destinationId) {
        history = history.filter((item: AdjustmentLog) => item.destinationId === destinationId);
      }

      return history.sort((a: AdjustmentLog, b: AdjustmentLog) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error('Error fetching capacity history:', error);
      return [];
    }
  }

  // Weather data operations
  async saveWeatherData(data: WeatherDataInput): Promise<boolean> {
    try {
      if (this.isPlaceholderMode()) {
        console.log('Mock saving weather data for destination:', data.destination_id);
        const mockEntry: DbWeatherData = {
          id: `mock-w-${Date.now()}`,
          destination_id: data.destination_id,
          temperature: data.temperature,
          humidity: data.humidity,
          pressure: data.pressure || 1013,
          weather_main: data.weather_main || 'Clear',
          weather_description: data.weather_description || 'clear sky',
          wind_speed: data.wind_speed || 0,
          wind_direction: data.wind_direction || 0,
          visibility: data.visibility || 10000,
          recorded_at: data.recorded_at || new Date().toISOString(),
          alert_level: data.alert_level || 'none',
          alert_message: data.alert_message || null,
          alert_reason: data.alert_reason || null,
          created_at: new Date().toISOString()
        };
        weatherCache.set(data.destination_id, mockEntry);
        return true;
      }
      console.log('Saving weather data for destination:', data.destination_id, data);

      // Use service role client to bypass RLS policies for system operations
      const client = createServerComponentClient();
      if (!client) {
        console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY is missing. Skipping database operation.');
        return false;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (client.from('weather_data') as any)
        .insert([data]);

      if (error) {
        console.error('Error saving weather data:', error);
        return false;
      }

      // Update cache
      weatherCache.delete(data.destination_id);

      console.log('✅ Weather data saved successfully');
      return true;
    } catch (error) {
      console.error('Error in saveWeatherData:', error);
      return false;
    }
  }

  async getLatestWeatherData(destinationId: string): Promise<DbWeatherData | null> {
    return withCache(weatherCache, destinationId, async () => {
      try {
        if (this.isPlaceholderMode() || !db) {
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
        const { data, error } = await db
          .from('weather_data')
          .select('*')
          .eq('destination_id', destinationId)
          .order('recorded_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error || !data) {
          return null;
        }

        return data;
      } catch (error) {
        console.error('Error in getLatestWeatherData:', error);
        return null;
      }
    });
  }

  // Get weather alerts from weather data (replaces alerts table for weather alerts)
  async getWeatherAlerts(): Promise<Alert[]> {
    try {
      if (this.isPlaceholderMode() || !db) {
        return mockData.alerts.filter(a => a.type === 'weather');
      }
      const { data: weatherData, error } = await db
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
      type WeatherAlertRecord = DbWeatherData & { destinations: { name: string; location: string } };
      const latestAlerts = new Map<string, WeatherAlertRecord>();
      (weatherData as unknown as WeatherAlertRecord[]).forEach((record) => {
        if (!latestAlerts.has(record.destination_id) ||
          new Date(record.recorded_at) > new Date(latestAlerts.get(record.destination_id)!.recorded_at)) {
          latestAlerts.set(record.destination_id, record);
        }
      });

      return Array.from(latestAlerts.values()).map((record): Alert => ({
        id: record.id,
        type: 'weather' as const,
        title: `Weather Alert - ${record.destinations.name}`,
        message: record.alert_message || `Weather conditions in ${record.destinations.name} require attention. ${record.alert_reason || ''}`,
        severity: (record.alert_level as 'low' | 'medium' | 'high' | 'critical') || 'low',
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
      if (this.isPlaceholderMode() || !db) {
        console.log('Using mock compliance reports');
        return mockData.complianceReports || [];
      }
      const { data, error } = await db
        .from('compliance_reports')
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
      if (this.isPlaceholderMode() || !db) {
        return (mockData.complianceReports || []).find(r => r.id === id) || null;
      }
      const { data, error } = await db
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

  async createComplianceReport(report: ComplianceReportInput): Promise<ComplianceReport | null> {
    try {
      if (this.isPlaceholderMode() || !db) {
        const newReport: ComplianceReport = {
          ...report,
          id: `mock-report-${Date.now()}`,
          status: report.status || 'pending',
          createdAt: new Date()
        };
        mockData.complianceReports.push(newReport);
        return newReport;
      }

      const dbReport: Database['public']['Tables']['compliance_reports']['Insert'] = {
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
          soil_compaction: report.ecologicalDamageIndicators.soilCompaction ?? report.ecologicalDamageIndicators.soil_compaction ?? 0,
          vegetation_disturbance: report.ecologicalDamageIndicators.vegetationDisturbance ?? report.ecologicalDamageIndicators.vegetation_disturbance ?? 0,
          wildlife_disturbance: report.ecologicalDamageIndicators.wildlifeDisturbance ?? report.ecologicalDamageIndicators.wildlife_disturbance ?? 0,
          water_source_impact: report.ecologicalDamageIndicators.waterSourceImpact ?? report.ecologicalDamageIndicators.water_source_impact ?? 0,
        } : undefined,
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
        } as DbComplianceReport;
        const transformed = this.transformDbReportToReport(newReport);
        mockData.complianceReports.push(transformed);
        return transformed;
      }

      const { data, error } = await db
        .from('compliance_reports')
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
      if (!db) return false;
      const { error } = await db.from('compliance_reports')
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
      if (this.isPlaceholderMode() || !db) return [];
      const { data, error } = await db
        .from('policy_violations')
        .select('*, destinations(name)')
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      type ViolationWithDestination = Database['public']['Tables']['policy_violations']['Row'] & {
        destinations: { name: string } | null
      };
      return (data as unknown as ViolationWithDestination[]).map(v => ({
        ...this.transformDbViolationToViolation(v),
        destinationName: v.destinations?.name || undefined
      }));
    } catch (error) {
      console.error('Error in getPolicyViolations:', error);
      return [];
    }
  }

  async addPolicyViolation(violation: Database['public']['Tables']['policy_violations']['Insert']): Promise<PolicyViolation | null> {
    try {
      if (this.isPlaceholderMode() || !db) {
        const newViolation = {
          ...violation,
          id: `violation-${Date.now()}`,
          created_at: new Date().toISOString(),
          status: 'pending'
        } as DbPolicyViolation;
        const transformed = this.transformDbViolationToViolation(newViolation);
        mockData.policyViolations.push(transformed);
        return transformed;
      }
      const { data, error } = await db
        .from('policy_violations')
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

    return Promise.all(destinations.map(async (d) => {
      const destinationObj = this.transformDbDestinationToDestination(d);
      const adjustedCapacity = await policyEngine.getAdjustedCapacity(destinationObj);
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
    }));
  }

  async getHistoricalOccupancyTrends(destinationId?: string, days: number = 7): Promise<{ date: string, occupancy: number }[]> {
    if (this.isPlaceholderMode()) {
      // Generate mock historical data
      const trends: { date: string, occupancy: number }[] = [];
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

      if (!db) return [];

      // Get destination max capacity
      const { data: dest } = await db
        .from('destinations')
        .select('max_capacity')
        .eq('id', destinationId)
        .single();

      const maxCapacity = dest?.max_capacity || 100;

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const displayDate = format(date, 'MMM dd');
        const isoDate = date.toISOString();

        // Query tourists table for occupancy on this specific date using sum of group_size
        const { data, error } = await db
          .from('tourists')
          .select('group_size')
          .eq('destination_id', destinationId)
          .lte('check_in_date', dateStr)
          .gte('check_out_date', dateStr);

        if (error) throw error;

        const occupancy = data?.reduce((sum: number, t: { group_size: number }) => sum + (Number(t.group_size) || 0), 0) || 0;

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

  // Environmental and Eco-Points operations
  async updateUserEcoPoints(userId: string, pointsToAdd: number, carbonOffset: number = 0): Promise<boolean> {
    try {
      if (this.isPlaceholderMode()) return true;

      // Use an atomic RPC call to update eco-points and carbon offset.
      // This prevents race conditions (lost increments) that occur with read-then-write patterns.
      // SQL for this RPC (update_user_eco_metrics):
      /*
      CREATE OR REPLACE FUNCTION update_user_eco_metrics(p_user_id UUID, p_points_to_add INTEGER, p_offset_to_add DOUBLE PRECISION)
      RETURNS BOOLEAN AS $$
      BEGIN
        UPDATE users 
        SET 
          eco_points = COALESCE(eco_points, 0) + p_points_to_add,
          total_carbon_offset = COALESCE(total_carbon_offset, 0) + p_offset_to_add,
          updated_at = NOW()
        WHERE id = p_user_id;

        RETURN TRUE;
      EXCEPTION WHEN OTHERS THEN
        RETURN FALSE;
      END;
      $$ LANGUAGE plpgsql;
      */
      if (!db) return false;
      const { data, error } = await db.rpc('update_user_eco_metrics', {
        p_user_id: userId,
        p_points_to_add: pointsToAdd,
        p_offset_to_add: carbonOffset
      });

      if (error) {
        console.error('RPC Error in updateUserEcoPoints:', error);
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error in updateUserEcoPoints:', error);
      return false;
    }
  }

  async getUserEcoStats(userId: string): Promise<{ ecoPoints: number; totalCarbonOffset: number; tripsCount: number; totalCarbonFootprint: number } | null> {
    try {
      if (this.isPlaceholderMode() || !db) {
        return { ecoPoints: 450, totalCarbonOffset: 120.5, tripsCount: 3, totalCarbonFootprint: 254.8 };
      }

      const { data: user, error: userError } = await db
        .from('users')
        .select('eco_points, total_carbon_offset')
        .eq('id', userId)
        .single();

      if (userError || !user) return null;

      const { data: bookings, error: bookingsError, count } = await db
        .from('tourists')
        .select('carbon_footprint', { count: 'exact' })
        .eq('user_id', userId);

      if (bookingsError) {
        console.error('Error fetching tourist count:', bookingsError);
      }

      const totalCarbonFootprint = bookings ? bookings.reduce((sum: number, b: { carbon_footprint: number | null }) => sum + (b.carbon_footprint || 0), 0) : 0;

      return {
        ecoPoints: user.eco_points || 0,
        totalCarbonOffset: user.total_carbon_offset || 0,
        tripsCount: count || 0,
        totalCarbonFootprint
      };
    } catch (error) {
      console.error('Error in getUserEcoStats:', error);
      return null;
    }
  }

  async getAggregatedEnvironmentalStats(): Promise<{ totalCarbonFootprint: number; totalEcoPoints: number; averageFootprintPerTourist: number }> {
    try {
      if (this.isPlaceholderMode() || !db) {
        return { totalCarbonFootprint: 12500, totalEcoPoints: 45000, averageFootprintPerTourist: 15.4 };
      }

      const { data, error } = await db
        .from('tourists')
        .select('carbon_footprint');

      if (error || !data) return { totalCarbonFootprint: 0, totalEcoPoints: 0, averageFootprintPerTourist: 0 };

      const totalCarbonFootprint = data.reduce((sum: number, t: { carbon_footprint: number | null }) => sum + (t.carbon_footprint || 0), 0);
      const touristCount = data.length;

      const { data: userData, error: userError } = await db
        .from('users')
        .select('eco_points');

      const totalEcoPoints = userError || !userData ? 0 : userData.reduce((sum: number, u: { eco_points: number | null }) => sum + (u.eco_points || 0), 0);

      return {
        totalCarbonFootprint,
        totalEcoPoints,
        averageFootprintPerTourist: touristCount > 0 ? totalCarbonFootprint / touristCount : 0
      };
    } catch (error) {
      console.error('Error in getAggregatedEnvironmentalStats:', error);
      return { totalCarbonFootprint: 0, totalEcoPoints: 0, averageFootprintPerTourist: 0 };
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

  public transformDbTouristToTourist(dbTourist: DbTourist): Tourist {
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
      status: dbTourist.status as 'pending' | 'approved' | 'checked-in' | 'checked-out' | 'cancelled',
      emergencyContact: {
        name: dbTourist.emergency_contact_name || '',
        phone: dbTourist.emergency_contact_phone || '',
        relationship: dbTourist.emergency_contact_relationship || '',
      },
      registrationDate: dbTourist.registration_date ? new Date(dbTourist.registration_date) : new Date(),
      userId: dbTourist.user_id,
      carbonFootprint: dbTourist.carbon_footprint,
      originLocationId: dbTourist.origin_location_id,
      transportType: dbTourist.transport_type,
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

  private transformDbWasteToWaste(db: DbWasteData): WasteData {
    return {
      id: db.id,
      destinationId: db.destination_id,
      wasteType: db.waste_type as 'plastic' | 'glass' | 'metal' | 'organic' | 'paper' | 'other',
      quantity: db.quantity,
      unit: db.unit,
      collectedAt: new Date(db.collected_at),
      createdAt: new Date(db.created_at),
    };
  }

  private transformUpdateWasteToWaste(updates: Database['public']['Tables']['waste_data']['Update']): Partial<WasteData> {
    const result: Partial<WasteData> = {};
    if (updates.destination_id) result.destinationId = updates.destination_id;
    if (updates.waste_type) result.wasteType = updates.waste_type as 'plastic' | 'glass' | 'metal' | 'organic' | 'paper' | 'other';
    if (updates.quantity !== undefined) result.quantity = updates.quantity;
    if (updates.unit) result.unit = updates.unit;
    if (updates.collected_at) result.collectedAt = new Date(updates.collected_at);
    if (updates.created_at) result.createdAt = new Date(updates.created_at);
    return result;
  }

  private transformDbCleanupActivityToCleanupActivity(db: DbCleanupActivity): CleanupActivity {
    return {
      id: db.id,
      destinationId: db.destination_id,
      title: db.title,
      description: db.description,
      startTime: new Date(db.start_time),
      endTime: new Date(db.end_time),
      location: db.location,
      maxParticipants: db.max_participants,
      currentParticipants: db.current_participants,
      status: db.status as 'upcoming' | 'ongoing' | 'completed' | 'cancelled',
      ecoPointsReward: db.eco_points_reward,
      createdAt: new Date(db.created_at),
    };
  }

  private transformUpdateCleanupToCleanup(updates: Database['public']['Tables']['cleanup_activities']['Update']): Partial<CleanupActivity> {
    const result: Partial<CleanupActivity> = {};
    if (updates.destination_id) result.destinationId = updates.destination_id;
    if (updates.title) result.title = updates.title;
    if (updates.description) result.description = updates.description;
    if (updates.start_time) result.startTime = new Date(updates.start_time);
    if (updates.end_time) result.endTime = new Date(updates.end_time);
    if (updates.location) result.location = updates.location;
    if (updates.max_participants !== undefined) result.maxParticipants = updates.max_participants;
    if (updates.current_participants !== undefined) result.currentParticipants = updates.current_participants;
    if (updates.status) result.status = updates.status as 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
    if (updates.eco_points_reward !== undefined) result.ecoPointsReward = updates.eco_points_reward;
    if (updates.created_at) result.createdAt = new Date(updates.created_at);
    return result;
  }

  private transformDbCleanupRegistrationToCleanupRegistration(db: DbCleanupRegistration): CleanupRegistration {
    return {
      id: db.id,
      activityId: db.activity_id,
      userId: db.user_id,
      status: db.status as 'registered' | 'attended' | 'cancelled',
      registeredAt: new Date(db.registered_at),
      attended: db.attended,
    };
  }

  private transformDbEcoPointsTransactionToEcoPointsTransaction(db: DbEcoPointsTransaction): EcoPointsTransaction {
    return {
      id: db.id,
      userId: db.user_id,
      points: db.points,
      transactionType: db.transaction_type as 'award' | 'redemption' | 'adjustment',
      description: db.description,
      createdAt: new Date(db.created_at),
    };
  }
}

// Create singleton instance with HMR support
export const getDbService = (): DatabaseService => {
  if (typeof globalThis === 'undefined') return new DatabaseService();

  if (!globalThis.__dbService) {
    globalThis.__dbService = new DatabaseService();
  }
  return globalThis.__dbService;
};

export default DatabaseService;
