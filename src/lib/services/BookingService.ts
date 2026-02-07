import { BaseService } from './BaseService';
import { 
  DbTourist, 
  DbTouristInsert, 
  DbTouristUpdate 
} from './types';
import { Tourist } from '@/types';
import * as mockData from '@/data/mockData';
import { destinationService } from './DestinationService';

/**
 * BookingService
 * 
 * Handles all operations related to tourist registrations and bookings.
 */
export class BookingService extends BaseService {
  constructor() {
    super('BookingService');
  }

  /**
   * Fetches a list of tourists with optional filtering by userId and pagination.
   */
  async getTourists(userId?: string, page: number = 1, pageSize: number = 20): Promise<Tourist[]> {
    try {
      if (this.isPlaceholderMode()) {
        this.logInfo('Using mock tourists data');

        // Filter by userId if provided
        let filteredTourists = userId
          ? mockData.tourists.filter((t) => t.userId === userId)
          : [...mockData.tourists];

        // Sort by registration date descending to match DB behavior (created_at DESC)
        filteredTourists.sort(
          (a, b) =>
            new Date(b.registrationDate).getTime() -
            new Date(a.registrationDate).getTime()
        );

        const start = (page - 1) * pageSize;
        return filteredTourists.slice(start, start + pageSize);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = (this.db as any).from('tourists')
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
      this.logError('getTourists', error);
      return [];
    }
  }

  /**
   * Fetches a single tourist by ID.
   */
  async getTouristById(id: string): Promise<Tourist | null> {
    try {
      if (this.isPlaceholderMode()) {
        return mockData.tourists.find(t => t.id === id) || null;
      }

      const { data, error } = await (this.db as any)
        .from('tourists')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        this.logError('getTouristById', error, { touristId: id });
        return null;
      }

      return this.transformDbTouristToTourist(data);
    } catch (error) {
      this.logError('getTouristById', error, { touristId: id });
      return null;
    }
  }

  /**
   * Adds a new tourist registration.
   * Note: Capacity check should be performed before calling this or within this method.
   */
  async addTourist(tourist: DbTouristInsert): Promise<DbTourist | null> {
    try {
      if (this.isPlaceholderMode()) {
        this.logInfo('Using mock addTourist');
        
        const eligibility = await destinationService.checkBookingEligibility(tourist.destination_id, tourist.group_size);
        if (!eligibility.allowed) {
          this.logError('addTourist', `Booking blocked by ecological policy: ${eligibility.reason}`, { destinationId: tourist.destination_id });
          return null;
        }

        const newTourist: DbTourist = {
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
          payment_id: null,
          group_name: tourist.group_name || null
        };
        
        mockData.addTourist(this.transformDbTouristToTourist(newTourist));
        return newTourist;
      }

      if (!this.validateTouristInsert(tourist)) {
        return null;
      }

      // Use the atomic RPC call as in the original implementation
      const { data: rpcResult, error: rpcError } = await (this.db.rpc as any)('create_tourist_booking', {
        p_tourist_data: tourist
      });

      if (rpcError) {
        this.logError('addTourist', rpcError);
        return null;
      }

      if (!rpcResult || !rpcResult.success) {
        this.logError('addTourist', rpcResult?.error || 'Unknown error');
        return null;
      }

      return rpcResult.data as DbTourist;

    } catch (error) {
      this.logError('addTourist', error, { 
        destinationId: tourist.destination_id,
        userId: tourist.user_id,
        groupSize: tourist.group_size
      });
      return null;
    }
  }

  /**
   * Adds multiple tourist registrations in batch.
   */
  async batchAddTourists(tourists: DbTouristInsert[]): Promise<DbTourist[] | null> {
    try {
      if (this.isPlaceholderMode()) {
        const results: DbTourist[] = [];
        for (const t of tourists) {
          const res = await this.addTourist(t);
          if (res) results.push(res);
        }
        return results;
      }

      // In real DB mode, call addTourist(t) for each tourist to ensure 
      // each insert goes through the create_tourist_booking RPC and preserves 
      // server-side validation and atomicity.
      const results: DbTourist[] = [];
      for (const t of tourists) {
        const res = await this.addTourist(t);
        if (res) {
          results.push(res);
        } else {
          this.logError('batchAddTourists', 'Failed to add tourist in batch', { 
            destinationId: t.destination_id,
            userId: t.user_id 
          });
        }
      }

      return results.length > 0 ? results : null;
    } catch (error) {
      this.logError('batchAddTourists', error, { touristCount: tourists.length });
      return null;
    }
  }

  /**
   * Updates a tourist's status.
   */
  async updateTouristStatus(touristId: string, status: Tourist['status']): Promise<boolean> {
    try {
      if (this.isPlaceholderMode()) {
        const tourist = await this.getTouristById(touristId);
        if (!tourist) return false;

        const oldStatus = tourist.status;
        const destinationId = tourist.destination;

        const isNowOccupying = status === 'checked-in' || status === 'approved';
        const wasOccupying = oldStatus === 'checked-in' || oldStatus === 'approved';

        if (isNowOccupying && !wasOccupying) {
          const eligibility = await destinationService.checkBookingEligibility(destinationId, tourist.groupSize);
          if (!eligibility.allowed) {
            this.logError('updateTouristStatus', `Status update blocked: ${eligibility.reason}`, { touristId, status });
            return false;
          }
        }

        mockData.updateTouristStatus(touristId, status);
        return true;
      }

      // In real DB mode, we also need to check eligibility if status changes to occupying
      const tourist = await this.getTouristById(touristId);
      if (!tourist) return false;

      const oldStatus = tourist.status;
      const destinationId = tourist.destination;
      const isNowOccupying = status === 'checked-in' || status === 'approved';
      const wasOccupying = oldStatus === 'checked-in' || oldStatus === 'approved';

      if (isNowOccupying && !wasOccupying) {
        const eligibility = await destinationService.checkBookingEligibility(destinationId, tourist.groupSize);
        if (!eligibility.allowed) {
          this.logError('updateTouristStatus', `Status update blocked: ${eligibility.reason}`, { touristId, status });
          return false;
        }
      }

      const { error } = await (this.db as any)
        .from('tourists')
        .update({ status })
        .eq('id', touristId);

      if (error) {
        this.logError('updateTouristStatus', error, { touristId, status });
        return false;
      }

      return true;
    } catch (error) {
      this.logError('updateTouristStatus', error, { touristId, status });
      return false;
    }
  }

  /**
   * Helper: Validates tourist insert data.
   */
  private validateTouristInsert(tourist: Record<string, any>): tourist is DbTouristInsert {
    const required = [
      'name', 'email', 'phone', 'id_proof', 'nationality',
      'group_size', 'destination_id', 'check_in_date', 'check_out_date',
      'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship'
    ];

    for (const field of required) {
      const val = tourist[field];
      if (val === undefined || val === null || val === '') {
        this.logError('validateTouristInsert', `Missing required field "${field}"`, { field, touristData: tourist });
        return false;
      }
    }

    if (typeof tourist.group_size !== 'number' || tourist.group_size <= 0) {
      this.logError('validateTouristInsert', 'group_size must be a positive number', { groupSize: tourist.group_size });
      return false;
    }

    return true;
  }

  /**
   * Helper: Transforms a database row to a domain model.
   */
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
      status: dbTourist.status as Tourist['status'],
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
}

// Export a singleton instance with HMR support
export const getBookingService = (): BookingService => {
  if (typeof globalThis === 'undefined') return new BookingService();

  if (!(globalThis as any).__bookingService) {
    (globalThis as any).__bookingService = new BookingService();
  }
  return (globalThis as any).__bookingService;
};

export const bookingService = getBookingService();
export default BookingService;
