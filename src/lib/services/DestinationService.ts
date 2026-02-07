import { BaseService } from './BaseService';
import { 
  DbDestination, 
  DbDestinationInsert, 
  DbDestinationUpdate,
  DbTourist,
  DbWeatherData
} from './types';
import { Destination, AdjustmentLog, HistoricalOccupancy, EcologicalDamageIndicators, WeatherConditions } from '@/types';
import * as mockData from '@/data/mockData';
import { getPolicyEngine } from '../ecologicalPolicyEngine';
import { format } from 'date-fns';

/**
 * DestinationService
 * 
 * Manages destination data, capacity, and real-time occupancy.
 */
export class DestinationService extends BaseService {
  constructor() {
    super('DestinationService');
  }

  /**
   * Fetches all destinations with real-time occupancy.
   */
  async getDestinations(page: number = 1, pageSize: number = 20): Promise<DbDestination[]> {
    try {
      if (this.isPlaceholderMode()) {
        this.logInfo('Using mock destinations data');
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
          latitude: d.coordinates?.latitude ?? 0,
          longitude: d.coordinates?.longitude ?? 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data: destinations, error: destError } = await (this.db as any)
        .from('destinations')
        .select('*')
        .order('name')
        .range(from, to);

      if (destError) throw destError;
      if (!destinations) throw new Error('No destinations found');

      const destinationIds = (destinations as DbDestination[]).map(d => d.id);

      // Fetch real-time occupancy from tourists table
      const { data: occupancyData, error: occError } = await (this.db as any)
        .from('tourists')
        .select('destination_id, group_size')
        .in('destination_id', destinationIds)
        .or('status.eq.checked-in,status.eq.approved');

      if (occError) throw occError;

      const occupancyMap: Record<string, number> = {};
      occupancyData?.forEach((t: { destination_id: string; group_size: number }) => {
        occupancyMap[t.destination_id] = (occupancyMap[t.destination_id] || 0) + t.group_size;
      });

      return (destinations || []).map((dest: DbDestination): DbDestination => ({
        ...dest,
        current_occupancy: occupancyMap[dest.id] || 0
      }));
    } catch (error) {
      this.logError('getDestinations', error);
      return [];
    }
  }

  /**
   * Fetches a single destination by ID with real-time occupancy.
   */
  async getDestinationById(id: string): Promise<Destination | null> {
    try {
      if (this.isPlaceholderMode()) {
        const mockDest = mockData.destinations.find(d => d.id === id);
        return mockDest || null;
      }

      const { data, error } = await (this.db as any)
        .from('destinations')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        this.logError('getDestinationById', error, { destinationId: id });
        return null;
      }

      const realTimeOccupancy = await this.getCurrentOccupancy(id);
      const destination = this.transformDbDestinationToDestination(data);
      destination.currentOccupancy = realTimeOccupancy;

      return destination;
    } catch (error) {
      this.logError('getDestinationById', error, { destinationId: id });
      return null;
    }
  }

  /**
   * Calculates real-time occupancy for a destination.
   */
  async getCurrentOccupancy(destinationId: string): Promise<number> {
    try {
      if (this.isPlaceholderMode()) {
        return mockData.getCurrentOccupancy(destinationId);
      }

      const { data, error } = await (this.db as any)
        .from('tourists')
        .select('group_size')
        .eq('destination_id', destinationId)
        .or('status.eq.checked-in,status.eq.approved');

      if (error || !data) return 0;

      return (data).reduce((total: number, tourist: { group_size: number }): number => total + tourist.group_size, 0);
    } catch (error) {
      this.logError('getCurrentOccupancy', error, { destinationId });
      return 0;
    }
  }

  /**
   * Fetches available capacity for a destination.
   */
  async getAvailableCapacity(destinationId: string): Promise<number> {
    try {
      const destination = await this.getDestinationById(destinationId);
      if (!destination) return 0;

      return await getPolicyEngine().getAvailableSpots(destination);
    } catch (error) {
      this.logError('getAvailableCapacity', error, { destinationId });
      return 0;
    }
  }

  /**
   * Checks if a booking is allowed based on ecological policy and capacity.
   */
  async checkBookingEligibility(destinationId: string, groupSize: number): Promise<{ allowed: boolean; reason: string | null }> {
    try {
      const destination = await this.getDestinationById(destinationId);
      if (!destination) return { allowed: false, reason: 'Destination not found' };

      const realTimeOccupancy = await this.getCurrentOccupancy(destinationId);
      const destinationWithRealTimeOccupancy = {
        ...destination,
        currentOccupancy: realTimeOccupancy
      };

      return await getPolicyEngine().isBookingAllowed(destinationWithRealTimeOccupancy, groupSize);
    } catch (error) {
      this.logError('checkBookingEligibility', error, { destinationId, groupSize });
      return { allowed: false, reason: 'Error checking eligibility' };
    }
  }

  /**
   * Updates the current_occupancy field in the destinations table.
   */
  async updateDestinationOccupancy(destinationId: string): Promise<void> {
    try {
      if (this.isPlaceholderMode()) return;

      const occupancy = await this.getCurrentOccupancy(destinationId);

      const { error } = await (this.db as any)
        .from('destinations')
        .update({ current_occupancy: occupancy })
        .eq('id', destinationId);

      if (error) {
        this.logError('updateDestinationOccupancy', error, { destinationId, occupancy });
      }
    } catch (error) {
      this.logError('updateDestinationOccupancy', error, { destinationId });
    }
  }

  /**
   * Logs a capacity adjustment event.
   */
  async logCapacityAdjustment(log: AdjustmentLog): Promise<void> {
    try {
      if (this.isPlaceholderMode()) {
        if (typeof window === 'undefined' || !window.localStorage) return;
        const historyKey = 'greenpass_capacity_history';
        const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
        history.push({
          ...log,
          timestamp: log.timestamp instanceof Date ? log.timestamp.toISOString() : log.timestamp
        });
        if (history.length > 1000) history.shift();
        localStorage.setItem(historyKey, JSON.stringify(history));
        return;
      }

      // Real persistence in non-placeholder branch
      const { error } = await (this.db as any)
        .from('capacity_adjustment_logs')
        .insert({
          id: log.id,
          destination_id: log.destinationId,
          timestamp: log.timestamp instanceof Date ? log.timestamp.toISOString() : log.timestamp,
          original_capacity: log.originalCapacity,
          adjusted_capacity: log.adjustedCapacity,
          factors: log.factors,
          reason: log.reason
        });

      if (error) throw error;
    } catch (error) {
      this.logError('logCapacityAdjustment', error);
    }
  }

  /**
   * Fetches capacity adjustment history.
   */
  async getCapacityAdjustmentHistory(destinationId?: string, days: number = 7): Promise<AdjustmentLog[]> {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    try {
      const historyKey = 'greenpass_capacity_history';
      const rawHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');

      let history = rawHistory.map((item: { timestamp: string;[key: string]: unknown }) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      } as AdjustmentLog));

      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      history = history.filter((item: AdjustmentLog) => item.timestamp >= cutoff);

      if (destinationId) {
        history = history.filter((item: AdjustmentLog) => item.destinationId === destinationId);
      }

      return history.sort((a: AdjustmentLog, b: AdjustmentLog) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      this.logError('getCapacityAdjustmentHistory', error);
      return [];
    }
  }

  /**
   * Helper: Transforms a database row to a domain model.
   */
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
}

// Export a singleton instance with HMR support
export const getDestinationService = (): DestinationService => {
  if (typeof globalThis === 'undefined') return new DestinationService();

  if (!(globalThis as any).__destinationService) {
    (globalThis as any).__destinationService = new DestinationService();
  }
  return (globalThis as any).__destinationService;
};

export const destinationService = getDestinationService();
export default DestinationService;
