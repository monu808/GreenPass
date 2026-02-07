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
  EcologicalDamageIndicators,
  WeatherConditions
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
import { bookingService } from './services/BookingService';
import { destinationService } from './services/DestinationService';
import { ecologicalService } from './services/EcologicalService';
import { ecoPointsService } from './services/EcoPointsService';

import {
  DbTourist,
  DbDestination,
  DbAlert,
  DbWeatherData,
  DbWasteData,
  DbCleanupActivity,
  DbCleanupRegistration,
  DbEcoPointsTransaction,
  DbComplianceReport,
  DbPolicyViolation,
  WeatherDataInput,
  ComplianceReportInput
} from './services/types';

class DatabaseService {
  constructor() {}

  /**
   * Checks if the service is running in placeholder/mock mode.
   * Inherited from domain services' BaseService.
   */
  isPlaceholderMode(): boolean {
    // All services share the same placeholder logic via BaseService
    return ecologicalService.isPlaceholderMode();
  }

  async getTourists(userId?: string, page: number = 1, pageSize: number = 20): Promise<Tourist[]> {
    return bookingService.getTourists(userId, page, pageSize);
  }

  async getTouristById(id: string): Promise<Tourist | null> {
    return bookingService.getTouristById(id);
  }

  async addTourist(tourist: Database['public']['Tables']['tourists']['Insert']): Promise<Database['public']['Tables']['tourists']['Row'] | null> {
    return bookingService.addTourist(tourist);
  }

  async batchAddTourists(tourists: Database['public']['Tables']['tourists']['Insert'][]): Promise<Database['public']['Tables']['tourists']['Row'][] | null> {
    return bookingService.batchAddTourists(tourists);
  }

  async updateTouristStatus(touristId: string, status: Tourist['status']): Promise<boolean> {
    const success = await bookingService.updateTouristStatus(touristId, status);
    if (success) {
      const tourist = await bookingService.getTouristById(touristId);
      if (tourist) {
        await destinationService.updateDestinationOccupancy(tourist.destination);
      }
    }
    return success;
  }

  /**
   * Updates the current_occupancy field in the destinations table
   * based on the sum of group_size for all 'checked-in or approved' tourists.
   */
  async updateDestinationOccupancy(destinationId: string): Promise<void> {
    return destinationService.updateDestinationOccupancy(destinationId);
  }

  // Destination operations
  async getDestinations(page: number = 1, pageSize: number = 20): Promise<Destination[]> {
    const dbDestinations = await destinationService.getDestinations(page, pageSize);
    return dbDestinations.map(d => destinationService.transformDbDestinationToDestination(d));
  }

  async getDestinationById(id: string): Promise<Destination | null> {
    return destinationService.getDestinationById(id);
  }

  async getCurrentOccupancy(destinationId: string): Promise<number> {
    return destinationService.getCurrentOccupancy(destinationId);
  }

  async getAvailableCapacity(destinationId: string): Promise<number> {
    return destinationService.getAvailableCapacity(destinationId);
  }

  async checkBookingEligibility(destinationId: string, groupSize: number): Promise<{ allowed: boolean; reason: string | null }> {
    return destinationService.checkBookingEligibility(destinationId, groupSize);
  }

  // Alert operations
  async getAlerts(destinationId?: string): Promise<Alert[]> {
    return ecologicalService.getAlerts(destinationId);
  }

  async addAlert(alert: Omit<Alert, 'id' | 'timestamp'>): Promise<Alert | null> {
    return ecologicalService.addAlert(alert);
  }

  async updateAlert(alertId: string, updates: Partial<{ isActive: boolean }>): Promise<void> {
    return ecologicalService.updateAlert(alertId, updates);
  }

  async deactivateAlert(alertId: string): Promise<boolean> {
    return ecologicalService.deactivateAlert(alertId);
  }

  // Waste Data Operations
  async getWasteData(destinationId?: string): Promise<WasteData[]> {
    return ecologicalService.getWasteData(destinationId);
  }

  async getWasteDataByDateRange(startDate: Date, endDate: Date, destinationId?: string): Promise<WasteData[]> {
    return ecologicalService.getWasteDataByDateRange(startDate, endDate, destinationId);
  }

  async addWasteData(waste: Database['public']['Tables']['waste_data']['Insert']): Promise<WasteData | null> {
    return ecologicalService.addWasteData(waste);
  }

  async updateWasteData(id: string, updates: Database['public']['Tables']['waste_data']['Update']): Promise<WasteData | null> {
    return ecologicalService.updateWasteData(id, updates);
  }

  async deleteWasteData(id: string): Promise<boolean> {
    return ecologicalService.deleteWasteData(id);
  }

  async getCollectiveImpactMetrics(): Promise<{ totalWaste: number, totalVolunteers: number }> {
    return ecologicalService.getCollectiveImpactMetrics();
  }

  async getWasteMetricsSummary(destinationId: string = 'all', days: number = 30): Promise<WasteMetricsSummary> {
    return ecologicalService.getWasteMetricsSummary(destinationId, days);
  }

  // Cleanup Activity Operations
  async getCleanupActivities(destinationId?: string): Promise<CleanupActivity[]> {
    return ecologicalService.getCleanupActivities(destinationId);
  }

  async getUpcomingCleanupActivities(): Promise<CleanupActivity[]> {
    return ecologicalService.getUpcomingCleanupActivities();
  }

  async getCleanupActivityById(id: string): Promise<CleanupActivity | null> {
    return ecologicalService.getCleanupActivityById(id);
  }

  async createCleanupActivity(activity: Database['public']['Tables']['cleanup_activities']['Insert']): Promise<CleanupActivity | null> {
    return ecologicalService.createCleanupActivity(activity);
  }

  async updateCleanupActivity(id: string, updates: Database['public']['Tables']['cleanup_activities']['Update']): Promise<CleanupActivity | null> {
    return ecologicalService.updateCleanupActivity(id, updates);
  }

  async cancelCleanupActivity(id: string): Promise<boolean> {
    return ecologicalService.cancelCleanupActivity(id);
  }

  async registerForCleanup(activityId: string, userId: string): Promise<boolean> {
    return ecologicalService.registerForCleanup(activityId, userId);
  }

  async cancelCleanupRegistration(registrationId: string): Promise<boolean> {
    return ecologicalService.cancelCleanupRegistration(registrationId);
  }

  async confirmCleanupAttendance(registrationId: string): Promise<boolean> {
    return ecologicalService.confirmCleanupAttendance(registrationId);
  }

  async getUserCleanupRegistrations(userId: string): Promise<CleanupRegistration[]> {
    return ecologicalService.getUserCleanupRegistrations(userId);
  }

  async getCleanupRegistrationsByActivity(activityId: string): Promise<CleanupRegistration[]> {
    return ecologicalService.getCleanupRegistrationsByActivity(activityId);
  }

  async updateCleanupRegistration(registrationId: string, updates: Partial<CleanupRegistration>): Promise<boolean> {
    return ecologicalService.updateCleanupRegistration(registrationId, updates);
  }

  // Eco-points Operations
  async getEcoPointsBalance(userId: string): Promise<number> {
    return ecoPointsService.getUserEcoPoints(userId);
  }

  async awardEcoPoints(userId: string, points: number, description: string): Promise<boolean> {
    return ecoPointsService.awardEcoPoints(userId, points, description);
  }

  async getEcoPointsHistory(userId: string): Promise<EcoPointsTransaction[]> {
    return ecoPointsService.getEcoPointsHistory(userId);
  }

  async getUserImpactTier(userId: string): Promise<string> {
    return ecoPointsService.getUserImpactTier(userId);
  }

  async getEcoPointsLeaderboard(limit: number = 10): Promise<EcoPointsLeaderboardEntry[]> {
    return ecoPointsService.getEcoPointsLeaderboard(limit);
  }

  async updateUserEcoMetrics(userId: string, pointsToAdd: number, carbonOffset: number = 0): Promise<boolean> {
    return ecoPointsService.updateUserEcoMetrics(userId, pointsToAdd, carbonOffset);
  }

  async getUserEcoStats(userId: string): Promise<{ ecoPoints: number; totalCarbonOffset: number; tripsCount: number; totalCarbonFootprint: number } | null> {
    return ecoPointsService.getUserEcoStats(userId);
  }

  async getAggregatedEnvironmentalStats(): Promise<{ totalCarbonFootprint: number; totalEcoPoints: number; averageFootprintPerTourist: number }> {
    return ecoPointsService.getAggregatedEnvironmentalStats();
  }

  async getLatestEcologicalIndicators(destinationId: string): Promise<EcologicalDamageIndicators | undefined> {
    return ecologicalService.getLatestEcologicalIndicators(destinationId);
  }

  // Batch query methods for eliminating N+1 queries
  async getWeatherDataForDestinations(destinationIds: string[]): Promise<Map<string, WeatherConditions>> {
    return ecologicalService.getWeatherDataForDestinations(destinationIds);
  }

  async getEcologicalIndicatorsForDestinations(destinationIds: string[]): Promise<Map<string, EcologicalDamageIndicators>> {
    return ecologicalService.getEcologicalIndicatorsForDestinations(destinationIds);
  }

  async getDestinationsWithWeather(): Promise<Destination[]> {
    return ecologicalService.getDestinationsWithWeather();
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

      const physicalMaxCapacity = destinations.reduce((sum, dest) => sum + (dest.maxCapacity || 0), 0);

      const policyEngine = getPolicyEngine();
      const destinationIds = destinations.map(d => d.id);

      // Batch-fetch weather and indicators for capacity calculations
      const [weatherBatch, indicatorsBatch] = await Promise.all([
        this.getWeatherDataForDestinations(destinationIds),
        this.getEcologicalIndicatorsForDestinations(destinationIds)
      ]);

      const batchCapacitiesMap = await policyEngine.getBatchAdjustedCapacities(
        destinations,
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
    return destinationService.logCapacityAdjustment(log);
  }

  async getCapacityAdjustmentHistory(destinationId?: string, days: number = 7): Promise<AdjustmentLog[]> {
    return destinationService.getCapacityAdjustmentHistory(destinationId, days);
  }

  // Weather data operations
  async saveWeatherData(data: WeatherDataInput): Promise<boolean> {
    return ecologicalService.saveWeatherData(data);
  }

  async getLatestWeatherData(destinationId: string): Promise<WeatherConditions | null> {
    return ecologicalService.getLatestWeatherData(destinationId);
  }

  // Get weather alerts from weather data (replaces alerts table for weather alerts)
  async getWeatherAlerts(): Promise<Alert[]> {
    return ecologicalService.getWeatherAlerts();
  }

  // Compliance and Reporting operations
  async getComplianceReports(): Promise<ComplianceReport[]> {
    return ecologicalService.getComplianceReports();
  }

  async getComplianceReportById(id: string): Promise<ComplianceReport | null> {
    return ecologicalService.getComplianceReportById(id);
  }

  async createComplianceReport(report: ComplianceReportInput): Promise<ComplianceReport | null> {
    return ecologicalService.createComplianceReport(report);
  }

  async updateComplianceReportStatus(id: string, status: 'approved', approvedBy: string): Promise<boolean> {
    return ecologicalService.updateComplianceReportStatus(id, status, approvedBy);
  }

  async getPolicyViolations(): Promise<PolicyViolation[]> {
    return ecologicalService.getPolicyViolations();
  }

  async addPolicyViolation(violation: Database['public']['Tables']['policy_violations']['Insert']): Promise<PolicyViolation | null> {
    return ecologicalService.addPolicyViolation(violation);
  }

  async getComplianceMetrics(period: string, type: 'monthly' | 'quarterly'): Promise<Omit<ComplianceReport, 'id' | 'status' | 'createdAt'>> {
    return ecologicalService.getComplianceMetrics(period, type);
  }

  async getEcologicalImpactData(): Promise<EcologicalMetrics[]> {
    return ecologicalService.getEcologicalImpactData();
  }

  async getHistoricalOccupancyTrends(destinationId?: string, days: number = 7): Promise<{ date: string, occupancy: number }[]> {
    return ecologicalService.getHistoricalOccupancyTrends(destinationId, days);
  }

  async getHistoricalOccupancy(destinationId: string, days: number = 7): Promise<HistoricalOccupancy[]> {
    return ecologicalService.getHistoricalOccupancy(destinationId, days);
  }

  // --- Transformation Methods for Backward Compatibility ---

  transformDbTouristToTourist(dbTourist: DbTourist): Tourist {
    return bookingService.transformDbTouristToTourist(dbTourist);
  }

  transformDbDestinationToDestination(dbDestination: DbDestination): Destination {
    return destinationService.transformDbDestinationToDestination(dbDestination);
  }

  transformDbAlertToAlert(dbAlert: DbAlert): Alert {
    return ecologicalService.transformDbAlertToAlert(dbAlert);
  }

  transformDbWasteToWaste(dbWaste: DbWasteData): WasteData {
    return ecologicalService.transformDbWasteToWaste(dbWaste);
  }

  transformDbCleanupActivityToCleanupActivity(db: DbCleanupActivity): CleanupActivity {
    return ecologicalService.transformDbCleanupActivityToCleanupActivity(db);
  }

  transformDbCleanupRegistrationToCleanupRegistration(db: DbCleanupRegistration): CleanupRegistration {
    return ecologicalService.transformDbCleanupRegistrationToCleanupRegistration(db);
  }

  transformDbEcoPointsTransactionToEcoPointsTransaction(db: DbEcoPointsTransaction): EcoPointsTransaction {
    return ecoPointsService.transformDbEcoPointsTransactionToEcoPointsTransaction(db);
  }

  transformDbViolationToViolation(db: DbPolicyViolation): PolicyViolation {
    return ecologicalService.transformDbViolationToViolation(db);
  }

  transformDbReportToReport(db: DbComplianceReport): ComplianceReport {
    return ecologicalService.transformDbReportToReport(db);
  }

  // Helper method for legacy code that might still need this
}

export const getDbService = (): DatabaseService => {
  if (typeof globalThis === 'undefined') return new DatabaseService();

  if (!(globalThis as any).__databaseService) {
    (globalThis as any).__databaseService = new DatabaseService();
  }
  return (globalThis as any).__databaseService;
};

export const databaseService = getDbService();
export default DatabaseService;