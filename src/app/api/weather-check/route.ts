import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { validateInput, WeatherCheckSchema } from '@/lib/validation';
import { logger } from '@/lib/logger';

interface WeatherData {
  temperature: number;
  humidity: number;
  pressure: number;
  weatherMain: string;
  weatherDescription: string;
  windSpeed: number;
  windDirection: number;
  visibility: number;
  cityName: string;
  icon: string;
  uvIndex: number;
  cloudCover: number;
  precipitationProbability: number;
  precipitationType: string;
}

interface WeatherAlert {
  type: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  destinationId: string;
  isActive: boolean;
}

interface DatabaseDestination {
  id: string;
  name: string;
  location: string;
  is_active: boolean;
}

// Server-side weather service (secure)
class ServerWeatherService {
  private apiKey: string;
  private baseUrl = 'https://api.tomorrow.io/v4/weather';
  private supabase: SupabaseClient;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_TOMORROW_API_KEY || '';
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  private weatherCodeMap: { [key: number]: { main: string; description: string; icon: string } } = {
    0: { main: 'Unknown', description: 'Unknown weather condition', icon: '01d' },
    1000: { main: 'Clear', description: 'Clear skies', icon: '01d' },
    1001: { main: 'Clouds', description: 'Cloudy', icon: '02d' },
    1100: { main: 'Clear', description: 'Mostly clear', icon: '01d' },
    1101: { main: 'Clouds', description: 'Partly cloudy', icon: '02d' },
    1102: { main: 'Clouds', description: 'Mostly cloudy', icon: '03d' },
    1103: { main: 'Clouds', description: 'Overcast', icon: '04d' },
    2000: { main: 'Fog', description: 'Fog', icon: '50d' },
    2100: { main: 'Fog', description: 'Light fog', icon: '50d' },
    4000: { main: 'Rain', description: 'Drizzle', icon: '09d' },
    4001: { main: 'Rain', description: 'Rain', icon: '10d' },
    4200: { main: 'Rain', description: 'Light rain', icon: '10d' },
    4201: { main: 'Rain', description: 'Heavy rain', icon: '10d' },
    5000: { main: 'Snow', description: 'Snow', icon: '13d' },
    5100: { main: 'Snow', description: 'Light snow', icon: '13d' },
    5101: { main: 'Snow', description: 'Heavy snow', icon: '13d' },
    8000: { main: 'Thunderstorm', description: 'Thunderstorm', icon: '11d' },
  };

  async getWeatherByCoordinates(lat: number, lon: number, cityName: string): Promise<WeatherData> {
    const fields = [
      'temperature',
      'humidity',
      'pressureSeaLevel',
      'windSpeed',
      'windDirection',
      'visibility',
      'uvIndex',
      'cloudCover',
      'precipitationProbability',
      'precipitationType',
      'weatherCode'
    ].join(',');

    const url = `${this.baseUrl}/realtime?location=${lat},${lon}&fields=${fields}&units=metric&apikey=${this.apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Tomorrow.io API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json() as { data?: { values?: Record<string, number> } };
    return this.transformWeatherData(data, cityName);
  }

  private transformWeatherData(data: { data?: { values?: Record<string, number> } }, cityName: string): WeatherData {
    const values = data.data?.values || {};
    const weatherCode = values.weatherCode || 0;
    const weatherInfo = this.weatherCodeMap[weatherCode] || this.weatherCodeMap[0];

    return {
      temperature: values.temperature || 0,
      humidity: values.humidity || 0,
      pressure: values.pressureSeaLevel || 0,
      weatherMain: weatherInfo.main,
      weatherDescription: weatherInfo.description,
      windSpeed: values.windSpeed || 0,
      windDirection: values.windDirection || 0,
      visibility: values.visibility || 0,
      cityName,
      icon: weatherInfo.icon,
      uvIndex: values.uvIndex || 0,
      cloudCover: values.cloudCover || 0,
      precipitationProbability: values.precipitationProbability || 0,
      precipitationType: this.getPrecipitationType(values.precipitationType || 0)
    };
  }

  private getPrecipitationType(code: number): string {
    const types: { [key: number]: string } = {
      0: 'None',
      1: 'Rain',
      2: 'Snow',
      3: 'Freezing Rain',
      4: 'Ice Pellets'
    };
    return types[code] || 'Unknown';
  }

  shouldGenerateAlert(weatherData: WeatherData): { shouldAlert: boolean; reason: string } {
    const alerts: string[] = [];
    if (weatherData.temperature > 40) alerts.push('Extreme heat warning');
    if (weatherData.temperature < 0) alerts.push('Freezing temperature alert');
    if (weatherData.windSpeed > 15) alerts.push('High wind warning');
    if (weatherData.precipitationProbability > 80) alerts.push('Heavy precipitation expected');
    if (weatherData.visibility < 1) alerts.push('Low visibility conditions');
    if (weatherData.uvIndex > 8) alerts.push('High UV index - extreme sun exposure risk');
    if (weatherData.weatherMain === 'Thunderstorm') alerts.push('Thunderstorm warning');

    return {
      shouldAlert: alerts.length > 0,
      reason: alerts.join(', ')
    };
  }

  async saveWeatherData(destinationId: string, weatherData: WeatherData): Promise<boolean> {
    try {
      console.log(`📊 Saving weather data for destination: ${destinationId}`);
      console.log('Weather data:', {
        temperature: weatherData.temperature,
        humidity: weatherData.humidity,
        pressure: weatherData.pressure,
        weatherMain: weatherData.weatherMain,
        weatherDescription: weatherData.weatherDescription,
        windSpeed: weatherData.windSpeed,
        windDirection: weatherData.windDirection,
        visibility: weatherData.visibility
      });

      const { data, error } = await this.supabase
        .from('weather_data')
        .insert({
          destination_id: destinationId,
          temperature: Number(weatherData.temperature) || 0,
          humidity: Number(weatherData.humidity) || 0,
          pressure: Number(weatherData.pressure) || 0,
          weather_main: String(weatherData.weatherMain) || 'Unknown',
          weather_description: String(weatherData.weatherDescription) || 'Unknown',
          wind_speed: Number(weatherData.windSpeed) || 0,
          wind_direction: Number(weatherData.windDirection) || 0,
          visibility: Number(weatherData.visibility) || 0,
          recorded_at: new Date().toISOString()
        })
        .select();

      if (error) {
        logger.error(
          'Error saving weather data',
          error,
          { component: 'weather-check-route', operation: 'saveWeatherData', metadata: { destinationId: destinationId, location: weatherData.cityName } }
        );
        logger.error(
          'Error details',
          null,
          { component: 'weather-check-route', operation: 'saveWeatherData', metadata: { errorDetails: JSON.stringify(error, null, 2) } }
        );
        return false;
      }

      console.log('✅ Weather data saved successfully:', data);
      return true;
    } catch (error) {
      if (error instanceof Error) {
        const isDbError = error.message.includes('Database');
        logger.error(
          error.message.includes('Database') ? 'Database error occurred while saving weather data' : 'Error saving weather data',
          error,
          { component: 'weather-check-route', operation: 'saveWeatherData', metadata: { destinationId: destinationId, isDbError: error.message.includes('Database') } }
        );
      } else {
        logger.error('Unknown error saving weather data', error, { component: 'weather-check-route', operation: 'saveWeatherData', metadata: { destinationId: destinationId } });
      }
      return false;
    }
  }

  async addAlert(alert: WeatherAlert): Promise<boolean> {
    try {
      console.log(`🚨 Adding alert for destination: ${alert.destinationId}`);
      console.log('Alert data:', {
        type: alert.type,
        title: alert.title,
        message: alert.message,
        severity: alert.severity,
        destinationId: alert.destinationId,
        isActive: alert.isActive
      });

      const { data, error } = await this.supabase
        .from('alerts')
        .insert({
          type: alert.type,
          title: alert.title,
          message: alert.message,
          severity: alert.severity,
          destination_id: alert.destinationId,
          is_active: alert.isActive
        })
        .select();

      if (error) {
        logger.error(
          'Error adding alert',
          error,
          { component: 'weather-check-route', operation: 'addWeatherAlert', metadata: { alertType: alert.type, destinationId: alert.destinationId } }
        );
        logger.error(
          'Error details',
          null,
          { component: 'weather-check-route', operation: 'addWeatherAlert', metadata: { errorDetails: JSON.stringify(error, null, 2) } }
        );
        return false;
      }

      console.log('✅ Alert added successfully:', data);
      return true;
    } catch (error) {
       if (error instanceof Error) {
         logger.error(
           'Failed to add alert',
           new Error(error.message),
           { component: 'weather-check-route', operation: 'addWeatherAlert', metadata: { alertType: alert.type, destinationId: alert.destinationId } }
         );
     } 
     return false;
  }
}
  async getDestinations(): Promise<DatabaseDestination[]> {
    try {
      console.log('📍 Fetching destinations from database...');
      
      const { data, error } = await this.supabase
        .from('destinations')
        .select('id, name, location, is_active')
        .eq('is_active', true);

      if (error) {
        logger.error(
          'Error fetching destinations',
          error,
          { component: 'weather-check-route', operation: 'fetchDestinations' }
        );
        throw error;
      }

      console.log('✅ Destinations found:', data?.map(d => ({ id: d.id, name: d.name })));
      
      if (data && data.length > 0) {
        return data;
      }
      
      // If no active destinations found, fall through to fallback
      throw new Error('No active destinations found in database');
      
    } catch (error) {
      logger.error(
        'Database destinations query failed',
        error,
        { component: 'weather-check-route', operation: 'fetchDestinations' }
      );
      console.log('🔄 Using fallback destinations for testing...');
      
      // Return fallback destinations for Jammu and Himachal Pradesh
      return [
        {
          id: 'manali-fallback',
          name: 'Manali',
          location: 'Himachal Pradesh',
          is_active: true
        },
        {
          id: 'shimla-fallback',
          name: 'Shimla',
          location: 'Himachal Pradesh',
          is_active: true
        },
        {
          id: 'jammu-fallback',
          name: 'Jammu',
          location: 'Jammu and Kashmir',
          is_active: true
        },
        {
          id: 'srinagar-fallback',
          name: 'Srinagar',
          location: 'Jammu and Kashmir',
          is_active: true
        },
        {
          id: 'dharamshala-fallback',
          name: 'Dharamshala',
          location: 'Himachal Pradesh',
          is_active: true
        }
      ];
    }
  }

  async deactivateOldWeatherAlerts() {
    try {
      // First, deactivate old weather alerts
      const { error: deactivateError } = await this.supabase
        .from('alerts')
        .update({ is_active: false })
        .eq('type', 'weather')
        .eq('is_active', true);

      if (deactivateError) {
        logger.error(
          'Error deactivating old weather alerts',
          deactivateError,
          { component: 'weather-check-route', operation: 'deactivateOldWeatherAlerts' }
        );
      } else {
        console.log('✅ Deactivated old weather alerts');
      }

      // Then, delete very old inactive weather alerts (older than 1 hour) to prevent clutter
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { error: deleteError } = await this.supabase
        .from('alerts')
        .delete()
        .eq('type', 'weather')
        .eq('is_active', false)
        .lt('created_at', oneHourAgo);

      if (deleteError) {
        logger.error(
          'Error cleaning up old weather alerts',
          deleteError,
          { component: 'weather-check-route', operation: 'cleanupOldWeatherAlerts' }
        );
      } else {
        console.log('✅ Cleaned up old inactive weather alerts');
      }
    } catch (error) {
      logger.error(
        'Error in deactivateOldWeatherAlerts',
        error,
        { component: 'weather-check-route', operation: 'deactivateOldWeatherAlerts' }
      );
    }
  }
}

// Destination coordinates - will match by destination name if ID not found
const destinationCoordinates: { [key: string]: { lat: number; lon: number; name: string } } = {
  // By destination ID (UUIDs from database)
  'dest-1': { lat: 33.0305, lon: 74.9496, name: 'Vaishno Devi' },
  'dest-2': { lat: 32.2396, lon: 77.1887, name: 'Manali' },
  'dest-3': { lat: 31.1048, lon: 77.1734, name: 'Shimla' },
  'dest-4': { lat: 32.2190, lon: 76.3234, name: 'Dharamshala' },
  'dest-5': { lat: 32.2985, lon: 78.0339, name: 'Spiti Valley' },
  
  // By destination name (fallback)
  'vaishno devi': { lat: 33.0305, lon: 74.9496, name: 'Vaishno Devi' },
  'manali': { lat: 32.2396, lon: 77.1887, name: 'Manali' },
  'shimla': { lat: 31.1048, lon: 77.1734, name: 'Shimla' },
  'dharamshala': { lat: 32.2190, lon: 76.3234, name: 'Dharamshala' },
  'spiti valley': { lat: 32.2985, lon: 78.0339, name: 'Spiti Valley' },
  'mcleod ganj': { lat: 32.2190, lon: 76.3234, name: 'McLeod Ganj' },
  'dalhousie': { lat: 32.5448, lon: 75.9600, name: 'Dalhousie' },
  'kasol': { lat: 32.0998, lon: 77.3152, name: 'Kasol' },
  'srinagar': { lat: 34.0837, lon: 74.7973, name: 'Srinagar' },
  'jammu': { lat: 32.7266, lon: 74.8570, name: 'Jammu' },
  'gulmarg': { lat: 34.0484, lon: 74.3858, name: 'Gulmarg' },
  'pahalgam': { lat: 34.0169, lon: 75.3312, name: 'Pahalgam' },
  'sonamarg': { lat: 34.2996, lon: 75.2941, name: 'Sonamarg' },
  'leh': { lat: 34.1526, lon: 77.5771, name: 'Leh' },
  'ladakh': { lat: 34.2268, lon: 77.5619, name: 'Ladakh' },
  'katra': { lat: 32.9916, lon: 74.9455, name: 'Katra' }
};

// Helper function to find coordinates for a destination
function findCoordinatesForDestination(destination: DatabaseDestination) {
  // Try by ID first
  if (destinationCoordinates[destination.id]) {
    return destinationCoordinates[destination.id];
  }
  
  // Try by name (lowercase)
  const nameKey = destination.name.toLowerCase();
  if (destinationCoordinates[nameKey]) {
    return destinationCoordinates[nameKey];
  }
  
  // Try partial name matching
  const nameParts = destination.name.toLowerCase().split(' ');
  for (const part of nameParts) {
    if (destinationCoordinates[part]) {
      return destinationCoordinates[part];
    }
  }
  
  return null;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🌤️ Server-side weather monitoring started [v2]...');
    
    // Validate request body if present
    let body = {};
    try {
      if (request.headers.get('content-type')?.includes('application/json')) {
        body = await request.json();
      }
    } catch {
      // Body might be empty, which is fine for this trigger
    }

    const validation = validateInput(WeatherCheckSchema, body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input parameters',
        details: validation.errors,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const validData = validation.data;
    const weatherService = new ServerWeatherService();
    
    let destinations = [];
    if (validData.destinationId) {
      // Validate specific destination ID
      const { data, error } = await createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
        .from('destinations')
        .select('id, name, location, is_active')
        .eq('id', validData.destinationId)
        .eq('is_active', true)
        .single();
      
      if (error || !data) {
        return NextResponse.json({
          success: false,
          error: 'Destination not found or inactive',
          timestamp: new Date().toISOString()
        }, { status: 404 });
      }
      destinations = [data];
    } else {
      destinations = await weatherService.getDestinations();
    }
    
    if (!destinations || destinations.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No destinations found',
        timestamp: new Date().toISOString()
      });
    }

    const alerts: WeatherAlert[] = [];

    // Deactivate old weather alerts FIRST to prevent duplicates
    console.log('🔄 Deactivating old weather alerts...');
    await weatherService.deactivateOldWeatherAlerts();

    // Check weather for each destination
    for (const destination of destinations) {
      const coordinates = findCoordinatesForDestination(destination);
      
      if (!coordinates) {
        console.log(`⚠️ No coordinates found for destination: ${destination.name} (ID: ${destination.id})`);
        continue;
      }

      try {
        console.log(`📍 Checking weather for ${destination.name} (${coordinates.lat}, ${coordinates.lon})...`);
        
        const weatherData = await weatherService.getWeatherByCoordinates(
          coordinates.lat,
          coordinates.lon,
          destination.name
        );

        if (!weatherData) {
          console.log(`❌ Failed to get weather data for ${destination.name}`);
          continue;
        }

        console.log(`🌤️ Weather data for ${destination.name}:`, {
          temperature: weatherData.temperature,
          condition: weatherData.weatherDescription,
          windSpeed: weatherData.windSpeed,
          visibility: weatherData.visibility,
          uvIndex: weatherData.uvIndex
        });

        // Save weather data
        const saved = await weatherService.saveWeatherData(destination.id, weatherData);
        if (!saved) {
          console.log(`⚠️ Failed to save weather data for ${destination.name}`);
        }

        // Generate alerts
        const alertCheck = weatherService.shouldGenerateAlert(weatherData);
        
        if (alertCheck.shouldAlert) {
          let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
          
          if (weatherData.temperature > 45 || weatherData.temperature < -10) {
            severity = 'critical';
          } else if (weatherData.windSpeed > 20 || weatherData.visibility < 0.5) {
            severity = 'critical';
          } else if (weatherData.temperature > 40 || weatherData.temperature < 0) {
            severity = 'high';
          } else if (weatherData.windSpeed > 15 || weatherData.precipitationProbability > 80) {
            severity = 'high';
          }

          const alertData: WeatherAlert = {
            type: 'weather',
            title: `Weather Alert - ${destination.name}`,
            message: `${alertCheck.reason}. Current: ${weatherData.temperature}°C, ${weatherData.weatherDescription}. Wind: ${weatherData.windSpeed}m/s. ${weatherData.uvIndex ? `UV: ${weatherData.uvIndex}. ` : ''}${weatherData.precipitationProbability ? `Rain chance: ${weatherData.precipitationProbability}%.` : ''}`,
            severity,
            destinationId: destination.id,
            isActive: true
          };

          alerts.push(alertData);
          
          // Add the alert to database
          const alertAdded = await weatherService.addAlert(alertData);
          if (alertAdded) {
            console.log(`⚠️ Generated weather alert for ${destination.name}: ${severity.toUpperCase()}`);
          } else {
            console.log(`❌ Failed to add alert for ${destination.name}`);
          }
        } else {
          console.log(`✅ Weather conditions normal for ${destination.name}`);
        }

      } catch (error) {
        logger.error(
          `Error checking weather for ${destination.name}`,
          error,
          { component: 'weather-check-route', operation: 'checkDestinationWeather', metadata: { destinationId: destination.id, destinationName: destination.name } }
        );
      }
    }

    const message = alerts.length > 0 
      ? `Generated ${alerts.length} weather alert(s)`
      : 'No weather alerts needed - all conditions normal';

    console.log(`✅ ${message}`);

    return NextResponse.json({
      success: true,
      message,
      alertsGenerated: alerts.length,
      destinations: destinations.length,
      alerts: alerts.map((a: WeatherAlert) => ({ 
        destination: a.title, 
        severity: a.severity,
        reason: a.message.split('.')[0] // First sentence
      })),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error(
      'Error in server-side weather monitoring',
      error,
      { component: 'weather-check-route', operation: 'weatherMonitoring' }
    );
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Weather monitoring failed',
        message: 'An internal error occurred while processing weather data',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Weather monitoring API endpoint',
    timestamp: new Date().toISOString(),
    note: 'Use POST to trigger weather monitoring'
  });
}
