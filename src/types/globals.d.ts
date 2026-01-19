import { CarbonFootprintCalculator } from '../lib/carbonFootprintCalculator';
import { DatabaseService } from '../lib/databaseService';
import { EcologicalPolicyEngine } from '../lib/ecologicalPolicyEngine';
import { Database } from './database';

type DbWeatherData = Database['public']['Tables']['weather_data']['Row'];

declare global {
  var __carbonCalculator: CarbonFootprintCalculator | undefined;
  var __weatherCache: Map<string, DbWeatherData> | undefined;
  var __dbService: DatabaseService | undefined;
  var __policyEngine: EcologicalPolicyEngine | undefined;
}

export {};
