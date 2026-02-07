import { BaseService } from './BaseService';
import { 
  DbAlert, 
  DbAlertInsert, 
  DbAlertUpdate,
  DbWasteData,
  DbWasteDataInsert,
  DbWasteDataUpdate,
  DbCleanupActivity, 
  DbCleanupActivityInsert, 
  DbCleanupActivityUpdate,
  DbCleanupRegistration,
  DbCleanupRegistrationInsert,
  DbCleanupRegistrationUpdate,
  DbWeatherData, 
  WeatherDataInput, 
  ComplianceReportInput, 
  DbComplianceReport,
  DbPolicyViolation,
  DbPolicyViolationInsert,
  DbDestination,
  DbTourist
} from './types';
import { 
  Alert, 
  WasteData, 
  WasteMetricsSummary, 
  Destination, 
  ComplianceReport,
  PolicyViolation,
  EcologicalMetrics,
  HistoricalOccupancy,
  CleanupActivity,
  CleanupRegistration,
  Tourist,
  EcologicalDamageIndicators,
  WeatherConditions
} from '@/types';
import * as mockData from '@/data/mockData';
import { getPolicyEngine } from '../ecologicalPolicyEngine';
import { isWithinInterval, format } from 'date-fns';
import { weatherCache, ecologicalIndicatorCache, withCache } from '../cache';
import { createServerComponentClient } from '@/lib/supabase';

// Lazy accessors to break circular dependencies
const getDestinationService = () => {
  const { destinationService } = require('./DestinationService');
  return destinationService;
};

const getBookingService = () => {
  const { bookingService } = require('./BookingService');
  return bookingService;
};

const getEcoPointsService = () => {
  const { ecoPointsService } = require('./EcoPointsService');
  return ecoPointsService;
};

/**
 * EcologicalService
 * 
 * Handles environmental alerts, waste tracking, and sustainability metrics.
 * Now also includes cleanup activities and volunteer registrations (consolidated from CleanupService).
 */
export class EcologicalService extends BaseService {
  constructor() {
    super('EcologicalService');
  }

  /**
   * Fetches alerts with optional filtering by destination.
   * Also injects real-time ecological alerts from the policy engine.
   */
  async getAlerts(destinationId?: string): Promise<Alert[]> {
    try {
      if (this.isPlaceholderMode()) {
        this.logInfo('Using mock alerts data');
        let alerts = [...mockData.alerts];
        if (destinationId) {
          alerts = alerts.filter(a => a.destinationId === destinationId);
        }
        return alerts;
      }

      let query = (this.db as any)
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
      const destinations = await getDestinationService().getDestinations() as DbDestination[];
      const destinationsToProcess = destinationId
        ? destinations.filter((d: DbDestination) => d.id === destinationId)
        : destinations;

      destinationsToProcess.forEach((dest: DbDestination) => {
        const policyEngine = getPolicyEngine();
        const ecoAlert = policyEngine.generateEcologicalAlerts(getDestinationService().transformDbDestinationToDestination(dest));
        if (ecoAlert) {
          const alertId = `eco-${dest.id}`;
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
      this.logError('getAlerts', error);
      return [];
    }
  }

  /**
   * Adds a new alert.
   */
  async addAlert(alert: Omit<Alert, 'id' | 'timestamp'>): Promise<Alert | null> {
    try {
      if (this.isPlaceholderMode()) return null;

      const { data, error } = await (this.db as any)
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
        this.logError('addAlert', error);
        return null;
      }

      return this.transformDbAlertToAlert(data);
    } catch (error) {
      this.logError('addAlert', error);
      return null;
    }
  }

  /**
   * Updates an alert's status.
   */
  async updateAlert(alertId: string, updates: Partial<{ isActive: boolean }>): Promise<void> {
    try {
      if (this.isPlaceholderMode()) return;

      const { data, error } = await (this.db as any)
        .from('alerts')
        .update({
          is_active: updates.isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;
    } catch (error) {
      this.logError('updateAlert', error, { alertId });
      throw error;
    }
  }

  /**
   * Deactivates an alert.
   */
  async deactivateAlert(alertId: string): Promise<boolean> {
    try {
      if (this.isPlaceholderMode()) return true;

      const { error } = await (this.db as any)
        .from('alerts')
        .update({ is_active: false })
        .eq('id', alertId);

      if (error) {
        this.logError('deactivateAlert', error, { alertId });
        return false;
      }

      return true;
    } catch (error) {
      this.logError('deactivateAlert', error, { alertId });
      return false;
    }
  }

  /**
   * Fetches waste data with optional filtering by destination.
   */
  async getWasteData(destinationId?: string): Promise<WasteData[]> {
    try {
      if (this.isPlaceholderMode()) {
        let data = [...mockData.wasteData];
        if (destinationId) {
          data = data.filter(w => w.destinationId === destinationId);
        }
        return data;
      }

      let query = (this.db as any).from('waste_data').select('*');
      if (destinationId) {
        query = query.eq('destination_id', destinationId);
      }

      const { data, error } = await query.order('collected_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(this.transformDbWasteToWaste);
    } catch (error) {
      this.logError('getWasteData', error);
      return [];
    }
  }

  /**
   * Fetches waste data within a specific date range.
   */
  async getWasteDataByDateRange(startDate: Date, endDate: Date, destinationId?: string): Promise<WasteData[]> {
    try {
      if (this.isPlaceholderMode()) {
        let data = mockData.wasteData.filter(w =>
          isWithinInterval(new Date(w.collectedAt), { start: startDate, end: endDate })
        );
        if (destinationId) {
          data = data.filter(w => w.destinationId === destinationId);
        }
        return data;
      }

      let query = (this.db as any)
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
      this.logError('getWasteDataByDateRange', error);
      return [];
    }
  }

  /**
   * Adds new waste tracking data.
   */
  async addWasteData(waste: DbWasteDataInsert): Promise<WasteData | null> {
    try {
      if (this.isPlaceholderMode()) {
        const newData: WasteData = {
          id: `mock-waste-${Date.now()}`,
          destinationId: waste.destination_id || '',
          wasteType: (waste as any).waste_type || 'other',
          quantity: waste.quantity || 0,
          unit: waste.unit || 'kg',
          collectedAt: waste.collected_at ? new Date(waste.collected_at) : new Date(),
          createdAt: new Date()
        };
        mockData.wasteData.push(newData);
        return newData;
      }

      const { data, error } = await (this.db as any)
        .from('waste_data')
        .insert(waste)
        .select()
        .single();

      if (error || !data) {
        this.logError('addWasteData', error);
        return null;
      }

      return this.transformDbWasteToWaste(data);
    } catch (error) {
      this.logError('addWasteData', error);
      return null;
    }
  }

  /**
   * Updates existing waste tracking data.
   */
  async updateWasteData(id: string, updates: DbWasteDataUpdate): Promise<WasteData | null> {
    try {
      if (this.isPlaceholderMode()) {
        const index = mockData.wasteData.findIndex(w => w.id === id);
        if (index === -1) return null;
        
        const transformedUpdates = this.transformUpdateWasteToWaste(updates);
        mockData.wasteData[index] = { ...mockData.wasteData[index], ...transformedUpdates };
        return mockData.wasteData[index];
      }

      const { data, error } = await (this.db as any)
        .from('waste_data')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error || !data) throw error;
      return this.transformDbWasteToWaste(data);
    } catch (error) {
      this.logError('updateWasteData', error, { id });
      return null;
    }
  }

  /**
   * Deletes waste tracking data.
   */
  async deleteWasteData(id: string): Promise<boolean> {
    try {
      if (this.isPlaceholderMode()) {
        const index = mockData.wasteData.findIndex(w => w.id === id);
        if (index === -1) return false;
        mockData.wasteData.splice(index, 1);
        return true;
      }

      const { error } = await (this.db as any)
        .from('waste_data')
        .delete()
        .eq('id', id);

      return !error;
    } catch (error) {
      this.logError('deleteWasteData', error, { id });
      return false;
    }
  }

  /**
   * Gets collective impact metrics (total waste and volunteers).
   */
  async getCollectiveImpactMetrics(): Promise<{ totalWaste: number, totalVolunteers: number }> {
    try {
      const summary = await this.getWasteMetricsSummary('all', 365);
      return {
        totalWaste: summary.totalWaste,
        totalVolunteers: summary.totalVolunteers
      };
    } catch (error) {
      this.logError('getCollectiveImpactMetrics', error);
      return { totalWaste: 0, totalVolunteers: 0 };
    }
  }

  /**
   * Gets a summary of waste metrics for a destination and period.
   */
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
        const type = w.wasteType;
        byType[type] = (byType[type] || 0) + w.quantity;
        total += w.quantity;
        if (['plastic', 'glass', 'metal', 'paper'].includes(type)) {
          recycled += w.quantity;
        }
      });

      let activeCleanupEvents = 0;
      let totalVolunteers = 0;

      const activities = await this.getCleanupActivities(destinationId === 'all' ? undefined : destinationId);
      activeCleanupEvents = activities.filter(a => a.status === 'ongoing' || a.status === 'upcoming').length;
      totalVolunteers = activities.reduce((sum, a) => sum + (a.currentParticipants || 0), 0);

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
      this.logError('getWasteMetricsSummary', error);
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

  /**
   * Transforms database indicators to the application-friendly EcologicalDamageIndicators interface.
   */
  private transformDbIndicatorsToIndicators(dbIndicators: any): EcologicalDamageIndicators {
    return {
      soilCompaction: dbIndicators.soil_compaction ?? dbIndicators.soilCompaction ?? 0,
      vegetationDisturbance: dbIndicators.vegetation_disturbance ?? dbIndicators.vegetationDisturbance ?? 0,
      wildlifeDisturbance: dbIndicators.wildlife_disturbance ?? dbIndicators.wildlifeDisturbance ?? 0,
      waterSourceImpact: dbIndicators.water_source_impact ?? dbIndicators.waterSourceImpact ?? 0,
    };
  }

  /**
   * Fetches latest ecological indicators for a destination.
   */
  async getLatestEcologicalIndicators(destinationId: string): Promise<EcologicalDamageIndicators | undefined> {
    try {
      if (this.isPlaceholderMode()) return undefined;

      const { data, error } = await (this.db as any)
        .from('compliance_reports')
        .select('ecological_damage_indicators')
        .eq('destination_id', destinationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data || !data.ecological_damage_indicators) {
        return undefined;
      }

      return this.transformDbIndicatorsToIndicators(data.ecological_damage_indicators);
    } catch (error) {
      this.logError('getLatestEcologicalIndicators', error, { destinationId });
      return undefined;
    }
  }

  /**
   * Batch query method for weather data across multiple destinations.
   */
  async getWeatherDataForDestinations(destinationIds: string[]): Promise<Map<string, WeatherConditions>> {
    try {
      if (this.isPlaceholderMode()) {
        const result = new Map<string, WeatherConditions>();
        for (const id of destinationIds) {
          result.set(id, {
            alertLevel: 'none',
            temperature: 22,
            humidity: 60,
            recordedAt: new Date().toISOString(),
            weatherMain: 'Clear',
            weatherDescription: 'Mock data',
            windSpeed: 5,
          });
        }
        return result;
      }

      const result = new Map<string, WeatherConditions>();
      const missingIds: string[] = [];

      for (const id of destinationIds) {
        const cached = weatherCache.get(id) as DbWeatherData;
        if (cached) {
          result.set(id, this.transformDbWeatherToWeather(cached));
        } else {
          missingIds.push(id);
        }
      }

      if (missingIds.length === 0) {
        return result;
      }

      const { data, error } = await (this.db as any)
        .from('weather_data')
        .select('*')
        .in('destination_id', missingIds)
        .order('recorded_at', { ascending: false });

      if (error) {
        this.logError('getWeatherDataForDestinations', error);
        return result;
      }

      if (data) {
        const processedIds = new Set<string>();
        for (const record of data) {
          const destId = record.destination_id;
          if (!processedIds.has(destId)) {
            processedIds.add(destId);
            weatherCache.set(destId, record);
            result.set(destId, this.transformDbWeatherToWeather(record));
          }
        }
      }

      return result;
    } catch (error) {
      this.logError('getWeatherDataForDestinations', error);
      return new Map();
    }
  }

  /**
   * Batch query method for ecological indicators across multiple destinations.
   */
  async getEcologicalIndicatorsForDestinations(destinationIds: string[]): Promise<Map<string, EcologicalDamageIndicators>> {
    try {
      if (this.isPlaceholderMode()) return new Map();

      const result = new Map<string, EcologicalDamageIndicators>();
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

      const { data, error } = await (this.db as any)
        .from('compliance_reports')
        .select('destination_id, ecological_damage_indicators, created_at')
        .in('destination_id', missingIds)
        .order('created_at', { ascending: false })
        .limit(missingIds.length * 5);

      if (error) {
        this.logError('getEcologicalIndicatorsForDestinations', error);
        return result;
      }

      if (data) {
        const processedIds = new Set<string>();
        for (const record of data) {
          if (!processedIds.has(record.destination_id) && record.ecological_damage_indicators) {
            processedIds.add(record.destination_id);
            const indicators = this.transformDbIndicatorsToIndicators(record.ecological_damage_indicators);
            ecologicalIndicatorCache.set(record.destination_id, indicators);
            result.set(record.destination_id, indicators);
          }
        }
      }

      return result;
    } catch (error) {
      this.logError('getEcologicalIndicatorsForDestinations', error);
      return new Map();
    }
  }

  /**
   * Saves weather data for a destination.
   */
  async saveWeatherData(data: WeatherDataInput): Promise<boolean> {
    try {
      if (this.isPlaceholderMode()) {
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
        } as DbWeatherData;
        weatherCache.set(data.destination_id, mockEntry);
        return true;
      }

      const client = createServerComponentClient();
      if (!client) {
        this.logInfo('SUPABASE_SERVICE_ROLE_KEY is missing. Skipping database operation.');
        return false;
      }

      const { error } = await (client.from('weather_data') as any).insert([data]);

      if (error) {
        this.logError('saveWeatherData', error);
        return false;
      }

      weatherCache.delete(data.destination_id);
      return true;
    } catch (error) {
      this.logError('saveWeatherData', error);
      return false;
    }
  }

  /**
   * Fetches latest weather data for a destination.
   */
  async getLatestWeatherData(destinationId: string): Promise<WeatherConditions | null> {
    return withCache(weatherCache, destinationId, async () => {
      try {
        if (this.isPlaceholderMode()) {
          return {
            alertLevel: 'none',
            temperature: 22,
            humidity: 60,
            recordedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            weatherMain: 'Initial',
            weatherDescription: 'Initial data (fetching soon...)',
            windSpeed: 5,
          };
        }

        const { data, error } = await (this.db as any)
          .from('weather_data')
          .select('*')
          .eq('destination_id', destinationId)
          .order('recorded_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error || !data) return null;
        return this.transformDbWeatherToWeather(data);
      } catch (error) {
        this.logError('getLatestWeatherData', error, { destinationId });
        return null;
      }
    });
  }

  /**
   * Fetches weather alerts from weather data.
   */
  async getWeatherAlerts(): Promise<Alert[]> {
    try {
      if (this.isPlaceholderMode()) {
        return mockData.alerts.filter(a => a.type === 'weather');
      }

      const { data: weatherData, error } = await (this.db as any)
        .from('weather_data')
        .select(`
          *,
          destinations!inner(name, location)
        `)
        .neq('alert_level', 'none')
        .order('recorded_at', { ascending: false });

      if (error || !weatherData) {
        this.logError('getWeatherAlerts', error);
        return [];
      }

      const latestAlerts = new Map<string, any>();
      (weatherData as any[]).forEach((record) => {
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
        severity: (record.alert_level as any) || 'low',
        destinationId: record.destination_id,
        timestamp: new Date(record.recorded_at),
        isActive: true
      }));
    } catch (error) {
      this.logError('getWeatherAlerts', error);
      return [];
    }
  }

  /**
   * Fetches destinations with their current weather data.
   */
  async getDestinationsWithWeather(): Promise<Destination[]> {
    try {
      const destinations = await getDestinationService().getDestinations() as DbDestination[];
      if (!destinations.length) return [];

      const destinationIds = destinations.map((d: DbDestination) => d.id);
      const weatherMap = await this.getWeatherDataForDestinations(destinationIds);

      return destinations.map((dbDest: DbDestination) => {
        const dest = getDestinationService().transformDbDestinationToDestination(dbDest);
        const weather = weatherMap.get(dbDest.id);

        if (weather) {
          dest.weather = weather;
        }

        return dest;
      });
    } catch (error) {
      this.logError('getDestinationsWithWeather', error);
      return [];
    }
  }

  /**
   * Fetches all compliance reports.
   */
  async getComplianceReports(): Promise<ComplianceReport[]> {
    try {
      if (this.isPlaceholderMode()) {
        return mockData.complianceReports || [];
      }

      const { data, error } = await (this.db as any)
        .from('compliance_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data.map(this.transformDbReportToReport);
    } catch (error) {
      this.logError('getComplianceReports', error);
      return [];
    }
  }

  /**
   * Fetches a single compliance report by ID.
   */
  async getComplianceReportById(id: string): Promise<ComplianceReport | null> {
    try {
      if (this.isPlaceholderMode()) {
        return (mockData.complianceReports || []).find(r => r.id === id) || null;
      }

      const { data, error } = await (this.db as any)
        .from('compliance_reports')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return null;
      return this.transformDbReportToReport(data);
    } catch (error) {
      this.logError('getComplianceReportById', error, { id });
      return null;
    }
  }

  /**
   * Creates a new compliance report.
   */
  async createComplianceReport(report: ComplianceReportInput): Promise<ComplianceReport | null> {
    try {
      if (this.isPlaceholderMode()) {
        const newReport: ComplianceReport = {
          id: `report-${Date.now()}`,
          destinationId: report.destination_id || 'all',
          reportPeriod: report.reportPeriod,
          reportType: report.reportType,
          totalTourists: report.totalTourists,
          sustainableCapacity: report.sustainableCapacity,
          complianceScore: report.complianceScore,
          wasteMetrics: report.wasteMetrics,
          carbonFootprint: report.carbonFootprint,
          ecologicalImpactIndex: report.ecologicalImpactIndex,
          policyViolationsCount: report.policyViolationsCount,
          totalFines: report.totalFines,
          status: report.status || 'pending',
          createdAt: new Date()
        };
        mockData.complianceReports.unshift(newReport);
        return newReport;
      }

      const { data, error } = await (this.db as any)
        .from('compliance_reports')
        .insert({
          destination_id: report.destination_id,
          report_period: report.reportPeriod,
          report_type: report.reportType,
          total_tourists: report.totalTourists,
          sustainable_capacity: report.sustainableCapacity,
          compliance_score: report.complianceScore,
          waste_metrics: report.wasteMetrics,
          carbon_footprint: report.carbonFootprint,
          ecological_impact_index: report.ecologicalImpactIndex,
          ecological_damage_indicators: report.ecologicalDamageIndicators,
          previous_period_score: report.previousPeriodScore,
          policy_violations_count: report.policyViolationsCount,
          total_fines: report.totalFines,
          status: report.status || 'pending'
        })
        .select()
        .single();

      if (error || !data) {
        this.logError('createComplianceReport', error);
        return null;
      }

      return this.transformDbReportToReport(data);
    } catch (error) {
      this.logError('createComplianceReport', error);
      return null;
    }
  }

  /**
   * Updates a compliance report's status.
   */
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

      const { error } = await (this.db as any).from('compliance_reports')
        .update({
          status,
          approved_by: approvedBy,
          approved_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      this.logError('updateComplianceReportStatus', error, { id, status });
      return false;
    }
  }

  /**
   * Fetches all policy violations.
   */
  async getPolicyViolations(): Promise<PolicyViolation[]> {
    try {
      if (this.isPlaceholderMode()) {
        return mockData.policyViolations || [];
      }

      const { data, error } = await (this.db as any)
        .from('policy_violations')
        .select('*, destinations(name)')
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      
      type ViolationWithDestination = DbPolicyViolation & {
        destinations: { name: string } | null
      };

      return (data as unknown as ViolationWithDestination[]).map(v => ({
        ...this.transformDbViolationToViolation(v),
        destinationName: v.destinations?.name || undefined
      }));
    } catch (error) {
      this.logError('getPolicyViolations', error);
      return [];
    }
  }

  /**
   * Adds a new policy violation.
   */
  async addPolicyViolation(violation: DbPolicyViolationInsert): Promise<PolicyViolation | null> {
    try {
      if (this.isPlaceholderMode()) {
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

      const { data, error } = await (this.db as any)
        .from('policy_violations')
        .insert(violation)
        .select()
        .single();

      if (error || !data) return null;
      return this.transformDbViolationToViolation(data);
    } catch (error) {
      this.logError('addPolicyViolation', error);
      return null;
    }
  }

  /**
   * Calculates compliance metrics for a specific period and type.
   */
  async getComplianceMetrics(period: string, type: 'monthly' | 'quarterly'): Promise<Omit<ComplianceReport, 'id' | 'status' | 'createdAt'>> {
    try {
      const tourists = await getBookingService().getTourists() as Tourist[];
      const destinations = await getDestinationService().getDestinations() as DbDestination[];
      const violations = await this.getPolicyViolations();

      // Filter by period
      const filteredTourists = tourists.filter((t: Tourist) => {
        const date = new Date(t.checkInDate);
        const tMonth = date.getMonth();
        const tYear = date.getFullYear();

        if (type === 'monthly') {
          const [year, month] = period.split('-').map(Number);
          return tYear === year && (tMonth + 1) === month;
        } else {
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

      const totalTourists = filteredTourists.reduce((sum: number, t: Tourist) => sum + t.groupSize, 0);
      const sustainableCapacity = destinations.reduce((sum: number, d: DbDestination) => sum + d.max_capacity, 0);

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
        : period;
      const previousReport = reports.find(r => r.reportPeriod === prevPeriod);

      // Compliance score (0-100)
      const capacityViolationFactor = sustainableCapacity > 0 ? Math.max(0, (totalTourists / sustainableCapacity) - 1) * 100 : 0;
      const violationFactor = filteredViolations.length * 5;
      const complianceScore = Math.max(0, 100 - capacityViolationFactor - violationFactor);

      return {
        destinationId: 'all',
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
    } catch (error) {
      this.logError('getComplianceMetrics', error, { period, type });
      throw error;
    }
  }

  /**
   * Fetches ecological impact data across all destinations.
   */
  async getEcologicalImpactData(): Promise<EcologicalMetrics[]> {
    try {
      const destinations = await getDestinationService().getDestinations() as DbDestination[];
      const policyEngine = getPolicyEngine();

      return Promise.all(destinations.map(async (d: DbDestination) => {
        const destinationObj = getDestinationService().transformDbDestinationToDestination(d);
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
        sensitivity: d.ecological_sensitivity as any,
        riskLevel: utilization > 85 ? 'critical' :
          utilization > 70 ? 'high' :
            utilization > 50 ? 'medium' : 'low'
      } as EcologicalMetrics;
      }));
    } catch (error) {
      this.logError('getEcologicalImpactData', error);
      return [];
    }
  }

  /**
   * Fetches historical occupancy trends for a destination.
   */
  async getHistoricalOccupancyTrends(destinationId?: string, days: number = 7): Promise<{ date: string, occupancy: number }[]> {
    try {
      if (this.isPlaceholderMode()) {
        const trends: { date: string, occupancy: number }[] = [];
        const now = new Date();

        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          const occupancy = 40 + Math.random() * 50;

          trends.push({
            date: dateStr,
            occupancy: Math.round(occupancy)
          });
        }
        return trends;
      }

      if (!destinationId) return [];
      
      // Real data path - currently returns empty as historical tracking is not yet implemented
      return [];
    } catch (error) {
      this.logError('getHistoricalOccupancyTrends', error, { destinationId, days });
      return [];
    }
  }

  /**
   * Fetches detailed historical occupancy for a destination.
   */
  async getHistoricalOccupancy(destinationId: string, days: number = 7): Promise<HistoricalOccupancy[]> {
    try {
      if (this.isPlaceholderMode()) {
        const trends: HistoricalOccupancy[] = [];
        const now = new Date();

        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const dateStr = format(date, 'MMM dd');
          const isoDate = date.toISOString();
          const adjustedCapacity = 100;
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

      const now = new Date();
      const trends: HistoricalOccupancy[] = [];

      const dbDest = await getDestinationService().getDestinationById(destinationId);
      const maxCapacity = dbDest?.maxCapacity || 100;

      // Single batch query to fetch all potential tourist records for the date window
      const startDateStr = format(new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      const endDateStr = format(now, 'yyyy-MM-dd');

      const { data: tourists, error } = await (this.db as any)
        .from('tourists')
        .select('group_size, check_in_date, check_out_date')
        .eq('destination_id', destinationId)
        .or(`check_in_date.lte.${endDateStr},check_out_date.gte.${startDateStr}`);

      if (error) throw error;

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const displayDate = format(date, 'MMM dd');
        const isoDate = date.toISOString();

        // Calculate occupancy from in-memory records
        const occupancy = tourists?.reduce((sum: number, t: any) => {
          const checkIn = t.check_in_date;
          const checkOut = t.check_out_date;
          // Check if the current dateStr falls within the tourist's stay
          if (dateStr >= checkIn && dateStr <= checkOut) {
            return sum + (Number(t.group_size) || 0);
          }
          return sum;
        }, 0) || 0;

        trends.push({
          date: displayDate,
          isoDate,
          occupancy,
          adjustedCapacity: maxCapacity
        });
      }

      return trends;
    } catch (error) {
      this.logError('getHistoricalOccupancy', error, { destinationId, days });
      return [];
    }
  }

  /**
   * Helper: Transforms a database row to a PolicyViolation model.
   */
  public transformDbViolationToViolation(db: DbPolicyViolation): PolicyViolation {
    return {
      id: db.id,
      destinationId: db.destination_id,
      violationType: db.violation_type,
      description: db.description,
      severity: db.severity as 'low' | 'medium' | 'high' | 'critical',
      fineAmount: db.fine_amount,
      reportedAt: new Date(db.reported_at),
      status: ((db.status as any) === 'resolved' ? 'paid' : db.status) as any,
      createdAt: new Date(db.created_at)
    };
  }

  /**
   * Helper: Transforms a database row to a ComplianceReport model.
   */
  public transformDbReportToReport(db: DbComplianceReport): ComplianceReport {
    return {
      id: db.id,
      destinationId: (db as any).destination_id || 'all',
      reportPeriod: db.report_period,
      reportType: db.report_type as 'monthly' | 'quarterly',
      totalTourists: db.total_tourists,
      sustainableCapacity: db.sustainable_capacity,
      complianceScore: db.compliance_score,
      wasteMetrics: db.waste_metrics as any,
      carbonFootprint: db.carbon_footprint,
      ecologicalImpactIndex: db.ecological_impact_index,
      ecologicalDamageIndicators: db.ecological_damage_indicators as any,
      previousPeriodScore: db.previous_period_score || undefined,
      policyViolationsCount: db.policy_violations_count,
      totalFines: db.total_fines,
      status: db.status as 'pending' | 'approved',
      createdAt: new Date(db.created_at)
    };
  }

  /**
   * Helper: Transforms a database row to a WeatherConditions model.
   */
  public transformDbWeatherToWeather(dbWeather: DbWeatherData): WeatherConditions {
    return {
      alertLevel: (dbWeather.alert_level as any) || 'none',
      temperature: dbWeather.temperature,
      humidity: dbWeather.humidity,
      recordedAt: dbWeather.recorded_at,
      weatherMain: dbWeather.weather_main,
      weatherDescription: dbWeather.weather_description,
      windSpeed: dbWeather.wind_speed,
    };
  }

  /**
   * Helper: Transforms a database row to an Alert model.
   */
  public transformDbAlertToAlert(dbAlert: DbAlert): Alert {
    return {
      id: dbAlert.id,
      type: dbAlert.type as any,
      title: dbAlert.title,
      message: dbAlert.message,
      severity: dbAlert.severity as any,
      destinationId: dbAlert.destination_id || undefined,
      timestamp: new Date(dbAlert.created_at),
      isActive: dbAlert.is_active,
    };
  }

  /**
   * Helper: Transforms a database row to a WasteData model.
   */
  public transformDbWasteToWaste(dbWaste: DbWasteData): WasteData {
    return {
      id: dbWaste.id,
      destinationId: dbWaste.destination_id || '',
      wasteType: (dbWaste as any).waste_type || 'other',
      quantity: dbWaste.quantity || 0,
      unit: dbWaste.unit || 'kg',
      collectedAt: new Date(dbWaste.collected_at),
      createdAt: new Date(dbWaste.created_at),
    };
  }

  /**
   * Helper: Transforms updates to a partial WasteData model for mock mode.
   */
  private transformUpdateWasteToWaste(updates: DbWasteDataUpdate): Partial<WasteData> {
    const transformed: Partial<WasteData> = {};
    if (updates.destination_id !== undefined) transformed.destinationId = updates.destination_id || '';
    if ((updates as any).waste_type !== undefined) transformed.wasteType = (updates as any).waste_type;
    if (updates.quantity !== undefined) transformed.quantity = updates.quantity;
    if (updates.unit !== undefined) transformed.unit = updates.unit;
    if (updates.collected_at !== undefined) transformed.collectedAt = new Date(updates.collected_at as string);
    return transformed;
  }

  // --- Cleanup Activity Methods ---

  /**
   * Fetches cleanup activities with optional filtering by destination.
   */
  async getCleanupActivities(destinationId?: string): Promise<CleanupActivity[]> {
    try {
      if (this.isPlaceholderMode()) {
        let activities = [...mockData.cleanupActivities];
        if (destinationId) {
          activities = activities.filter(a => a.destinationId === destinationId);
        }
        return activities;
      }

      let query = (this.db as any).from('cleanup_activities').select('*');
      if (destinationId) {
        query = query.eq('destination_id', destinationId);
      }

      const { data, error } = await query.order('start_time', { ascending: true });
      if (error) throw error;
      return (data || []).map(this.transformDbCleanupActivityToCleanupActivity);
    } catch (error) {
      this.logError('getCleanupActivities', error);
      return [];
    }
  }

  /**
   * Fetches upcoming cleanup activities.
   */
  async getUpcomingCleanupActivities(): Promise<CleanupActivity[]> {
    try {
      if (this.isPlaceholderMode()) {
        return mockData.cleanupActivities.filter(a =>
          new Date(a.startTime) > new Date() && a.status === 'upcoming'
        );
      }

      const { data, error } = await (this.db as any)
        .from('cleanup_activities')
        .select('*')
        .gt('start_time', new Date().toISOString())
        .eq('status', 'upcoming')
        .order('start_time', { ascending: true });

      if (error) throw error;
      return (data || []).map(this.transformDbCleanupActivityToCleanupActivity);
    } catch (error) {
      this.logError('getUpcomingCleanupActivities', error);
      return [];
    }
  }

  /**
   * Fetches a cleanup activity by ID.
   */
  async getCleanupActivityById(id: string): Promise<CleanupActivity | null> {
    try {
      if (this.isPlaceholderMode()) {
        return mockData.cleanupActivities.find(a => a.id === id) || null;
      }

      const { data, error } = await (this.db as any)
        .from('cleanup_activities')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return null;
      return this.transformDbCleanupActivityToCleanupActivity(data);
    } catch (error) {
      this.logError('getCleanupActivityById', error, { id });
      return null;
    }
  }

  /**
   * Creates a new cleanup activity.
   */
  async createCleanupActivity(activity: DbCleanupActivityInsert): Promise<CleanupActivity | null> {
    try {
      if (this.isPlaceholderMode()) {
        const newActivity: CleanupActivity = {
          id: `mock-cleanup-${Date.now()}`,
          destinationId: activity.destination_id || '',
          title: activity.title || '',
          description: activity.description || '',
          startTime: activity.start_time ? new Date(activity.start_time) : new Date(),
          endTime: activity.end_time ? new Date(activity.end_time) : new Date(),
          location: activity.location || '',
          maxParticipants: activity.max_participants || 0,
          currentParticipants: 0,
          status: 'upcoming',
          ecoPointsReward: activity.eco_points_reward || 0,
          createdAt: new Date()
        };
        mockData.cleanupActivities.push(newActivity);
        return newActivity;
      }

      const { data, error } = await (this.db as any)
        .from('cleanup_activities')
        .insert(activity)
        .select()
        .single();

      if (error || !data) throw error;
      return this.transformDbCleanupActivityToCleanupActivity(data);
    } catch (error) {
      this.logError('createCleanupActivity', error);
      return null;
    }
  }

  /**
   * Updates an existing cleanup activity.
   */
  async updateCleanupActivity(id: string, updates: DbCleanupActivityUpdate): Promise<CleanupActivity | null> {
    try {
      if (this.isPlaceholderMode()) {
        const index = mockData.cleanupActivities.findIndex(a => a.id === id);
        if (index === -1) return null;

        const transformedUpdates = this.transformUpdateCleanupToCleanup(updates);
        mockData.cleanupActivities[index] = {
          ...mockData.cleanupActivities[index],
          ...transformedUpdates
        };
        return mockData.cleanupActivities[index];
      }

      const { data, error } = await (this.db as any)
        .from('cleanup_activities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error || !data) throw error;
      return this.transformDbCleanupActivityToCleanupActivity(data);
    } catch (error) {
      this.logError('updateCleanupActivity', error, { id });
      return null;
    }
  }

  /**
   * Cancels a cleanup activity.
   */
  async cancelCleanupActivity(id: string): Promise<boolean> {
    try {
      if (this.isPlaceholderMode()) {
        const index = mockData.cleanupActivities.findIndex(a => a.id === id);
        if (index === -1) return false;
        mockData.cleanupActivities[index].status = 'cancelled';
        return true;
      }

      const { error } = await (this.db as any)
        .from('cleanup_activities')
        .update({ status: 'cancelled' })
        .eq('id', id);

      return !error;
    } catch (error) {
      this.logError('cancelCleanupActivity', error, { id });
      return false;
    }
  }

  /**
   * Registers a user for a cleanup activity using an atomic operation.
   */
  async registerForCleanup(activityId: string, userId: string): Promise<boolean> {
    try {
      if (this.isPlaceholderMode()) {
        const activity = await this.getCleanupActivityById(activityId);
        if (!activity || activity.status !== 'upcoming') return false;

        const existingReg = mockData.cleanupRegistrations.find(
          r => r.activityId === activityId && r.userId === userId
        );
        if (existingReg) return false;

        const actIndex = mockData.cleanupActivities.findIndex(a => a.id === activityId);
        if (actIndex === -1) return false;

        const targetActivity = mockData.cleanupActivities[actIndex];
        if (targetActivity.currentParticipants >= targetActivity.maxParticipants) {
          return false;
        }

        const newReg: CleanupRegistration = {
          id: `mock-reg-${Date.now()}`,
          activityId: activityId,
          userId: userId,
          status: 'registered',
          attended: false,
          registeredAt: new Date()
        };

        mockData.cleanupRegistrations.push(newReg);
        targetActivity.currentParticipants += 1;

        return true;
      }

      // Use atomic RPC to handle registration and participant increment
      const { data, error } = await (this.db.rpc as any)('register_for_cleanup', {
        p_activity_id: activityId,
        p_user_id: userId
      });

      if (error) throw error;
      return !!data;
    } catch (error) {
      this.logError('registerForCleanup', error, { activityId, userId });
      return false;
    }
  }

  /**
   * Cancels a cleanup registration using an atomic operation.
   */
  async cancelCleanupRegistration(registrationId: string): Promise<boolean> {
    try {
      if (this.isPlaceholderMode()) {
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

      // Use atomic RPC for cancellation
      const { data, error } = await (this.db.rpc as any)('cancel_cleanup_registration', {
        p_registration_id: registrationId
      });

      if (error) throw error;
      return !!data;
    } catch (error) {
      this.logError('cancelCleanupRegistration', error, { registrationId });
      return false;
    }
  }

  /**
   * Confirms attendance for a cleanup activity and awards eco-points.
   */
  async confirmCleanupAttendance(registrationId: string): Promise<boolean> {
    try {
      let reg: DbCleanupRegistration | null = null;
      if (this.isPlaceholderMode()) {
        const index = mockData.cleanupRegistrations.findIndex(r => r.id === registrationId);
        if (index === -1) return false;

        if (mockData.cleanupRegistrations[index].attended) return true;

        mockData.cleanupRegistrations[index].attended = true;
        mockData.cleanupRegistrations[index].status = 'attended';

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
          const { data, error } = await (this.db as any)
            .from('cleanup_registrations')
            .update({ attended: true, status: 'attended' })
            .eq('id', registrationId)
          .eq('attended', false)
          .select()
          .single();

        if (error || !data) {
          const { data: existing } = await (this.db as any)
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
        await getEcoPointsService().awardEcoPoints(userId, activity.ecoPointsReward, `Participated in ${activity.title}`);
      }

      return true;
    } catch (error) {
      this.logError('confirmCleanupAttendance', error, { registrationId });
      return false;
    }
  }

  /**
   * Fetches cleanup registrations for a user.
   */
  async getUserCleanupRegistrations(userId: string): Promise<CleanupRegistration[]> {
    try {
      if (this.isPlaceholderMode()) {
        if (userId === 'all') return mockData.cleanupRegistrations;
        return mockData.cleanupRegistrations.filter(r => r.userId === userId);
      }

      let query = (this.db as any).from('cleanup_registrations').select('*');
      if (userId !== 'all') {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(this.transformDbCleanupRegistrationToCleanupRegistration);
    } catch (error) {
      this.logError('getUserCleanupRegistrations', error, { userId });
      return [];
    }
  }

  /**
   * Fetches registrations for a specific cleanup activity.
   */
  async getCleanupRegistrationsByActivity(activityId: string): Promise<CleanupRegistration[]> {
    try {
      if (this.isPlaceholderMode()) {
        return mockData.cleanupRegistrations.filter(r => r.activityId === activityId);
      }

      const { data, error } = await (this.db as any)
        .from('cleanup_registrations')
        .select('*')
        .eq('activity_id', activityId);

      if (error) throw error;
      return (data || []).map(this.transformDbCleanupRegistrationToCleanupRegistration);
    } catch (error) {
      this.logError('getCleanupRegistrationsByActivity', error, { activityId });
      return [];
    }
  }

  /**
   * Updates a cleanup registration.
   */
  async updateCleanupRegistration(registrationId: string, updates: Partial<CleanupRegistration>): Promise<boolean> {
    try {
      if (this.isPlaceholderMode()) {
        const index = mockData.cleanupRegistrations.findIndex(r => r.id === registrationId);
        if (index === -1) return false;

        mockData.cleanupRegistrations[index] = {
          ...mockData.cleanupRegistrations[index],
          ...updates,
          attended: updates.attended !== undefined ? updates.attended : mockData.cleanupRegistrations[index].attended,
        };
        return true;
      }

      const dbUpdates: DbCleanupRegistrationUpdate = {};
      if (updates.activityId !== undefined) dbUpdates.activity_id = updates.activityId;
      if (updates.userId !== undefined) dbUpdates.user_id = updates.userId;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.registeredAt !== undefined) {
        dbUpdates.registered_at = updates.registeredAt instanceof Date
          ? updates.registeredAt.toISOString()
          : updates.registeredAt;
      }
      if (updates.attended !== undefined) dbUpdates.attended = updates.attended;

      const { error } = await (this.db as any)
        .from('cleanup_registrations')
        .update(dbUpdates)
        .eq('id', registrationId);

      if (error) throw error;
      return true;
    } catch (error) {
      this.logError('updateCleanupRegistration', error, { registrationId });
      return false;
    }
  }

  /**
   * Helper: Transforms a database row to a CleanupActivity model.
   */
  public transformDbCleanupActivityToCleanupActivity(db: DbCleanupActivity): CleanupActivity {
    return {
      id: db.id,
      destinationId: db.destination_id,
      title: db.title,
      description: db.description || '',
      startTime: new Date(db.start_time),
      endTime: new Date(db.end_time),
      location: db.location || '',
      maxParticipants: db.max_participants,
      currentParticipants: db.current_participants,
      status: db.status as any,
      ecoPointsReward: db.eco_points_reward,
      createdAt: new Date(db.created_at),
    };
  }

  /**
   * Helper: Transforms a database row to a CleanupRegistration model.
   */
  public transformDbCleanupRegistrationToCleanupRegistration(db: DbCleanupRegistration): CleanupRegistration {
    return {
      id: db.id,
      activityId: db.activity_id,
      userId: db.user_id,
      status: db.status as any,
      registeredAt: new Date(db.registered_at),
      attended: db.attended,
    };
  }

  /**
   * Helper: Transforms updates to a partial CleanupActivity model for mock mode.
   */
  private transformUpdateCleanupToCleanup(updates: DbCleanupActivityUpdate): Partial<CleanupActivity> {
    const transformed: Partial<CleanupActivity> = {};
    if (updates.destination_id !== undefined) transformed.destinationId = updates.destination_id;
    if (updates.title !== undefined) transformed.title = updates.title;
    if (updates.description !== undefined) transformed.description = updates.description || '';
    if (updates.start_time !== undefined) transformed.startTime = new Date(updates.start_time);
    if (updates.end_time !== undefined) transformed.endTime = new Date(updates.end_time);
    if (updates.location !== undefined) transformed.location = updates.location || '';
    if (updates.max_participants !== undefined) transformed.maxParticipants = updates.max_participants;
    if (updates.current_participants !== undefined) transformed.currentParticipants = updates.current_participants;
    if (updates.status !== undefined) transformed.status = updates.status as any;
    if (updates.eco_points_reward !== undefined) transformed.ecoPointsReward = updates.eco_points_reward;
    return transformed;
  }
}

// Export a singleton instance with HMR support
export const getEcologicalService = (): EcologicalService => {
  if (typeof globalThis === 'undefined') return new EcologicalService();

  if (!(globalThis as any).__ecologicalService) {
    (globalThis as any).__ecologicalService = new EcologicalService();
  }
  return (globalThis as any).__ecologicalService;
};

export const ecologicalService = getEcologicalService();
export default EcologicalService;
