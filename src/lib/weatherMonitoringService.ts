'use client'; 

import { weatherService, destinationCoordinates } from '@/lib/weatherService';
import { dbService } from '@/lib/databaseService';
import { Destination } from '@/types';

interface WeatherMonitoringService {
  isRunning: boolean;
  intervalId: NodeJS.Timeout | null;
  start: () => void;
  stop: () => void;
  checkWeatherNow: () => Promise<void>;
}

class WeatherMonitor implements WeatherMonitoringService {
  isRunning = false;
  intervalId: NodeJS.Timeout | null = null;
  private lastCheckedData: Map<string, any> = new Map();
  private lastApiCall: number = 0;
  private apiCallDelay: number = 10000; // 10 seconds between API calls
  private checkInterval: number = 300000; // 5 minutes between monitoring cycles

  start() {
    if (this.isRunning) {
      console.log('⚡ Weather monitoring is already running');
      return;
    }

    console.log('🌤️ Starting weather monitoring service...');
    console.log(`⏱️ Using monitoring interval: ${this.checkInterval}ms (${this.checkInterval/60000} minutes)`);
    console.log(`⏱️ Using API call delay: ${this.apiCallDelay}ms between destinations`);
    this.isRunning = true;

    // Check immediately when starting
    this.checkWeatherNow();

    

    console.log('✅ Weather monitoring started - checking every 5 minutes');
  }

  stop() {
    if (!this.isRunning) {
      console.log('⚡ Weather monitoring is not running');
      return;
    }

    console.log('🛑 Stopping weather monitoring service...');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('✅ Weather monitoring stopped');
  }

  async checkWeatherNow(): Promise<void> {
    if (!this.isRunning) return;

    try {
      console.log('🔍 Checking weather conditions...', new Date().toLocaleTimeString());

      // Get all destinations
      const destinations = await dbService.getDestinations();
      
      if (!destinations || destinations.length === 0) {
        console.log('⚠️ No destinations found for weather monitoring');
        return;
      }

      // Check weather for each destination with rate limiting
      for (const destination of destinations) {
        const coordinates = destinationCoordinates[destination.id] || 
                          destinationCoordinates[destination.name?.toLowerCase().replace(/\s+/g, '')] ||
                          destinationCoordinates[destination.name?.toLowerCase()];

        if (!coordinates) {
          console.log(`⚠️ No coordinates found for ${destination.name}`);
          continue;
        }

        try {
          console.log(`📍 Checking weather for ${destination.name}...`);
          
          // Rate limiting: ensure minimum delay between API calls
          const now = Date.now();
          if (now - this.lastApiCall < this.apiCallDelay) {
            const waitTime = this.apiCallDelay - (now - this.lastApiCall);
            console.log(`⏱️ Rate limiting: waiting ${waitTime}ms before API call...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
          
          this.lastApiCall = Date.now();
          
          const weatherData = await weatherService.getWeatherByCoordinates(
            coordinates.lat,
            coordinates.lon,
            coordinates.name || destination.name
          );

          if (!weatherData) {
            console.log(`❌ Failed to get weather data for ${destination.name} - using cached data if available`);
            
            // Try to use cached data for alerts if API fails
            const cachedData = this.lastCheckedData.get(destination.id);
            if (cachedData && Date.now() - cachedData.timestamp < 3600000) { // Use cache if less than 1 hour old
              console.log(`📋 Using cached weather data for ${destination.name}`);
              // Process cached data for alerts but don't save to database again
              this.processWeatherAlerts(destination, cachedData, false);
            } else {
              console.log(`❌ No valid cached data for ${destination.name}, skipping...`);
            }
            continue;
          }

          // Cache the successful data
          this.lastCheckedData.set(destination.id, {
            ...weatherData,
            timestamp: Date.now()
          });

          // Process weather data and alerts
          await this.processWeatherAlerts(destination, weatherData, true);

        } catch (error) {
          console.error(`❌ Error checking weather for ${destination.name}:`, error);
        }
      }

      console.log('✅ Weather monitoring cycle completed');

    } catch (error) {
      console.error('❌ Error in weather monitoring:', error);
    }
  }

  // Helper method to process weather alerts
  private async processWeatherAlerts(destination: any, weatherData: any, saveToDatabase: boolean = true): Promise<void> {
    try {
      const alertCheck = weatherService.shouldGenerateAlert(weatherData);
      let alertLevel: 'none' | 'low' | 'medium' | 'high' | 'critical' = 'none';
      let alertMessage: string | null = null;
      let alertReason: string | null = null;

      if (alertCheck.shouldAlert) {
        // Determine severity based on conditions
        if (weatherData.temperature > 45 || weatherData.temperature < -10) {
          alertLevel = 'critical';
        } else if (weatherData.windSpeed > 20 || weatherData.visibility < 500) {
          alertLevel = 'critical';
        } else if (weatherData.temperature > 40 || weatherData.temperature < 0) {
          alertLevel = 'high';
        } else if (weatherData.windSpeed > 15 || (weatherData.precipitationProbability && weatherData.precipitationProbability > 80)) {
          alertLevel = 'high';
        } else if (weatherData.windSpeed > 10 || (weatherData.uvIndex && weatherData.uvIndex > 8)) {
          alertLevel = 'medium';
        } else {
          alertLevel = 'low';
        }

        alertMessage = `${alertCheck.reason}. Current: ${weatherData.temperature}°C, ${weatherData.weatherDescription}. Wind: ${weatherData.windSpeed}m/s. ${weatherData.uvIndex ? `UV: ${weatherData.uvIndex}. ` : ''}${weatherData.precipitationProbability ? `Rain chance: ${weatherData.precipitationProbability}%.` : ''}`;
        alertReason = alertCheck.reason;

        console.log(`⚠️ Weather alert generated for ${destination.name}: ${alertLevel.toUpperCase()}`);
        console.log(`   Reason: ${alertCheck.reason}`);
      } else {
        console.log(`✅ Weather conditions normal for ${destination.name}`);
      }

      // Save weather data with alert info to database only if requested
      if (saveToDatabase) {
        await dbService.saveWeatherData(destination.id, weatherData, {
          level: alertLevel,
          message: alertMessage || undefined,
          reason: alertReason || undefined
        });
      }

      // Log current weather summary
      console.log(`   📊 ${destination.name}: ${weatherData.temperature}°C, ${weatherData.weatherDescription}, Wind: ${weatherData.windSpeed}m/s${weatherData.uvIndex ? `, UV: ${weatherData.uvIndex}` : ''}${weatherData.precipitationProbability ? `, Rain: ${weatherData.precipitationProbability}%` : ''}`);

    } catch (error) {
      console.error(`Error processing weather alerts for ${destination.name}:`, error);
    }
  }
}

// Create singleton instance
const weatherMonitoringService = new WeatherMonitor();



export { weatherMonitoringService };
export type { WeatherMonitoringService };
