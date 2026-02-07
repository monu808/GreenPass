import { BaseService } from './BaseService';
import { 
  DbEcoPointsTransaction, 
  DbEcoPointsTransactionInsert
} from './types';
import { EcoPointsTransaction, EcoPointsLeaderboardEntry } from '@/types';
import * as mockData from '@/data/mockData';

/**
 * EcoPointsService
 * 
 * Manages the eco-points system, including awarding points, balance tracking, and leaderboards.
 */
export class EcoPointsService extends BaseService {
  constructor() {
    super('EcoPointsService');
  }

  /**
   * Awards eco-points to a user.
   */
  async awardEcoPoints(userId: string, points: number, reason: string): Promise<boolean> {
    try {
      if (this.isPlaceholderMode()) {
        const newTransaction: EcoPointsTransaction = {
          id: `mock-tx-${Date.now()}`,
          userId: userId,
          points: points,
          transactionType: 'award',
          description: reason,
          createdAt: new Date()
        };
        mockData.ecoPointsTransactions.push(newTransaction);
        return true;
      }

      const { error } = await (this.db as any)
        .from('eco_points_transactions')
        .insert({
          user_id: userId,
          points: points,
          description: reason,
          transaction_type: 'award'
        });

      if (error) throw error;
      return true;
    } catch (error) {
      this.logError('awardEcoPoints', error, { userId, points, reason });
      return false;
    }
  }

  /**
   * Fetches the total eco-points for a user.
   */
  async getUserEcoPoints(userId: string): Promise<number> {
    try {
      if (this.isPlaceholderMode()) {
        return mockData.ecoPointsTransactions
          .filter(t => t.userId === userId)
          .reduce((sum, t) => sum + t.points, 0);
      }

      const { data, error } = await (this.db as any)
        .from('eco_points_transactions')
        .select('points')
        .eq('user_id', userId);

      if (error) throw error;
      return (data as any[] || []).reduce((sum, t) => sum + (t.points || 0), 0);
    } catch (error) {
      this.logError('getUserEcoPoints', error, { userId });
      return 0;
    }
  }

  /**
   * Fetches the eco-points history for a user.
   */
  async getEcoPointsHistory(userId: string): Promise<EcoPointsTransaction[]> {
    try {
      if (this.isPlaceholderMode()) {
        return mockData.ecoPointsTransactions.filter(t => t.userId === userId);
      }

      const { data, error } = await (this.db as any)
        .from('eco_points_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(this.transformDbEcoPointsTransactionToEcoPointsTransaction);
    } catch (error) {
      this.logError('getEcoPointsHistory', error, { userId });
      return [];
    }
  }

  /**
   * Fetches the eco-points leaderboard.
   */
  async getEcoPointsLeaderboard(limit: number = 10): Promise<EcoPointsLeaderboardEntry[]> {
    try {
      if (this.isPlaceholderMode()) {
        // Group by userId and sum points from mock transactions
        const userPointsMap: Record<string, number> = {};
        mockData.ecoPointsTransactions.forEach(t => {
          userPointsMap[t.userId] = (userPointsMap[t.userId] || 0) + t.points;
        });

        const leaderboard: EcoPointsLeaderboardEntry[] = Object.entries(userPointsMap)
          .map(([userId, points]) => ({
            userId,
            points,
            // In real app we'd fetch user name, for mock we just use ID
            name: userId.startsWith('user-') ? `User ${userId.split('-')[1]}` : userId,
            rank: 0
          }))
          .sort((a, b) => b.points - a.points)
          .slice(0, limit)
          .map((entry, index) => ({ ...entry, rank: index + 1 }));

        return leaderboard;
      }

      // Use atomic RPC for leaderboard calculation
      const { data, error } = await (this.db.rpc as any)('get_eco_points_leaderboard', {
        p_limit: limit
      });

      if (error) throw error;
      return (data as any[]) || [];
    } catch (error) {
      this.logError('getEcoPointsLeaderboard', error);
      return [];
    }
  }

  /**
   * Fetches the environmental impact tier for a user based on their eco-points balance.
   */
  async getUserImpactTier(userId: string): Promise<string> {
    try {
      const balance = await this.getUserEcoPoints(userId);
      if (balance >= 1000) return 'Diamond Guardian';
      if (balance >= 500) return 'Gold Guardian';
      if (balance >= 200) return 'Silver Guardian';
      if (balance >= 50) return 'Bronze Guardian';
      return 'Eco Novice';
    } catch (error) {
      this.logError('getUserImpactTier', error, { userId });
      return 'Eco Novice';
    }
  }

  /**
   * Helper: Transforms a database row to an EcoPointsTransaction model.
   */
  public transformDbEcoPointsTransactionToEcoPointsTransaction(db: DbEcoPointsTransaction): EcoPointsTransaction {
    return {
      id: db.id,
      userId: db.user_id,
      points: db.points,
      transactionType: db.transaction_type as 'award' | 'redemption' | 'adjustment',
      description: db.description,
      createdAt: new Date(db.created_at),
    };
  }

  /**
   * Updates user eco metrics (eco-points and carbon offset) using an atomic operation.
   */
  async updateUserEcoMetrics(userId: string, pointsToAdd: number, carbonOffset: number = 0): Promise<boolean> {
    try {
      if (this.isPlaceholderMode()) return true;

      const { data, error } = await (this.db.rpc as any)('update_user_eco_metrics', {
        p_user_id: userId,
        p_points_to_add: pointsToAdd,
        p_offset_to_add: carbonOffset
      });

      if (error) throw error;
      return !!data;
    } catch (error) {
      this.logError('updateUserEcoMetrics', error, { userId, pointsToAdd, carbonOffset });
      return false;
    }
  }

  /**
   * Fetches user eco stats including points, carbon offset, and trip data.
   */
  async getUserEcoStats(userId: string): Promise<{ ecoPoints: number; totalCarbonOffset: number; tripsCount: number; totalCarbonFootprint: number } | null> {
    try {
      if (this.isPlaceholderMode()) {
        return { ecoPoints: 450, totalCarbonOffset: 120.5, tripsCount: 3, totalCarbonFootprint: 254.8 };
      }

      const { data: user, error: userError } = await (this.db as any)
        .from('users')
        .select('eco_points, total_carbon_offset')
        .eq('id', userId)
        .single();

      if (userError || !user) return null;

      const { data: bookings, error: bookingsError, count } = await (this.db as any)
        .from('tourists')
        .select('carbon_footprint', { count: 'exact' })
        .eq('user_id', userId);

      if (bookingsError) throw bookingsError;

      const totalCarbonFootprint = bookings ? bookings.reduce((sum: number, b: any) => sum + (b.carbon_footprint || 0), 0) : 0;

      return {
        ecoPoints: user.eco_points || 0,
        totalCarbonOffset: user.total_carbon_offset || 0,
        tripsCount: count || 0,
        totalCarbonFootprint
      };
    } catch (error) {
      this.logError('getUserEcoStats', error, { userId });
      return null;
    }
  }

  /**
   * Fetches aggregated environmental stats across all users.
   */
  async getAggregatedEnvironmentalStats(): Promise<{ totalCarbonFootprint: number; totalEcoPoints: number; averageFootprintPerTourist: number }> {
    try {
      if (this.isPlaceholderMode()) {
        return { totalCarbonFootprint: 12500, totalEcoPoints: 45000, averageFootprintPerTourist: 15.4 };
      }

      const { data, error } = await (this.db as any)
        .from('tourists')
        .select('carbon_footprint');

      if (error || !data) throw error;

      const totalCarbonFootprint = data.reduce((sum: number, t: any) => sum + (t.carbon_footprint || 0), 0);
      const touristCount = data.length;

      const { data: userData, error: userError } = await (this.db as any)
        .from('users')
        .select('eco_points');

      if (userError) throw userError;

      const totalEcoPoints = userData ? userData.reduce((sum: number, u: any) => sum + (u.eco_points || 0), 0) : 0;

      return {
        totalCarbonFootprint,
        totalEcoPoints,
        averageFootprintPerTourist: touristCount > 0 ? totalCarbonFootprint / touristCount : 0
      };
    } catch (error) {
      this.logError('getAggregatedEnvironmentalStats', error);
      return { totalCarbonFootprint: 0, totalEcoPoints: 0, averageFootprintPerTourist: 0 };
    }
  }
}

// Export a singleton instance with HMR support
export const getEcoPointsService = (): EcoPointsService => {
  if (typeof globalThis === 'undefined') return new EcoPointsService();

  if (!(globalThis as any).__ecoPointsService) {
    (globalThis as any).__ecoPointsService = new EcoPointsService();
  }
  return (globalThis as any).__ecoPointsService;
};

export const ecoPointsService = getEcoPointsService();
export default EcoPointsService;