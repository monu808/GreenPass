import { Database } from '@/types/database';

/**
 * Standardized result wrapper for service operations.
 * Helps maintain consistency in how services return data and errors.
 */
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

/**
 * Convenience type aliases for database table rows, inserts, and updates.
 */
export type DbTourist = Database['public']['Tables']['tourists']['Row'];
export type DbTouristInsert = Database['public']['Tables']['tourists']['Insert'];
export type DbTouristUpdate = Database['public']['Tables']['tourists']['Update'];

export type DbDestination = Database['public']['Tables']['destinations']['Row'];
export type DbDestinationInsert = Database['public']['Tables']['destinations']['Insert'];
export type DbDestinationUpdate = Database['public']['Tables']['destinations']['Update'];

export type DbAlert = Database['public']['Tables']['alerts']['Row'];
export type DbAlertInsert = Database['public']['Tables']['alerts']['Insert'];
export type DbAlertUpdate = Database['public']['Tables']['alerts']['Update'];

export type DbWasteData = Database['public']['Tables']['waste_data']['Row'];
export type DbWasteDataInsert = Database['public']['Tables']['waste_data']['Insert'];
export type DbWasteDataUpdate = Database['public']['Tables']['waste_data']['Update'];

export type DbComplianceReport = Database['public']['Tables']['compliance_reports']['Row'];
export type DbComplianceReportInsert = Database['public']['Tables']['compliance_reports']['Insert'];

export type DbCleanupActivity = Database['public']['Tables']['cleanup_activities']['Row'];
export type DbCleanupActivityInsert = Database['public']['Tables']['cleanup_activities']['Insert'];
export type DbCleanupActivityUpdate = Database['public']['Tables']['cleanup_activities']['Update'];

export type DbCleanupRegistration = Database['public']['Tables']['cleanup_registrations']['Row'];
export type DbCleanupRegistrationInsert = Database['public']['Tables']['cleanup_registrations']['Insert'];
export type DbCleanupRegistrationUpdate = Database['public']['Tables']['cleanup_registrations']['Update'];

export type DbEcoPointsTransaction = Database['public']['Tables']['eco_points_transactions']['Row'];
export type DbEcoPointsTransactionInsert = Database['public']['Tables']['eco_points_transactions']['Insert'];

export type DbPolicyViolation = Database['public']['Tables']['policy_violations']['Row'];
export type DbPolicyViolationInsert = Database['public']['Tables']['policy_violations']['Insert'];
export type DbPolicyViolationUpdate = Database['public']['Tables']['policy_violations']['Update'];

/**
 * Common input interfaces used across multiple services.
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface DateRangeParams {
  startDate: Date;
  endDate: Date;
}

export interface SearchParams extends PaginationParams {
  searchTerm?: string;
}

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
  destination_id?: string;
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
  ecologicalDamageIndicators?: any;
  previousPeriodScore?: number;
  policyViolationsCount: number;
  totalFines: number;
  status?: "pending" | "approved";
}

export type DbWeatherData = Database['public']['Tables']['weather_data']['Row'];
