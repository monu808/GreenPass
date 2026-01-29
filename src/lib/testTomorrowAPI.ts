// Test file for Tomorrow.io Weather API integration
import { weatherService } from '@/lib/weatherService';
import { logger } from '@/lib/logger'; // ✅ NEW IMPORT

async function testTomorrowWeatherAPI() {
  logger.info('🌤️ Testing Tomorrow.io Weather API Integration');
  logger.info('====================================================');

  // Test coordinates for Manali, Himachal Pradesh
  const testLocation = {
    lat: 32.2396,
    lon: 77.1887,
    name: 'Manali'
  };

  try {
    logger.info(`📍 Fetching weather data for ${testLocation.name}...`);
    
    const weatherData = await weatherService.getWeatherByCoordinates(
      testLocation.lat,
      testLocation.lon,
      testLocation.name
    );

    if (weatherData) {
      logger.info('✅ Weather data fetched successfully!');
      logger.info('📊 Weather Details:');
      logger.info(`   🌡️  Temperature: ${weatherData.temperature}°C`);
      logger.info(`   💧 Humidity: ${weatherData.humidity}%`);
      logger.info(`   🎈 Pressure: ${weatherData.pressure} hPa`);
      logger.info(`   🌤️  Condition: ${weatherData.weatherMain} - ${weatherData.weatherDescription}`);
      logger.info(`   💨 Wind: ${weatherData.windSpeed} m/s from ${weatherData.windDirection}°`);
      logger.info(`   👁️  Visibility: ${weatherData.visibility} km`);
      logger.info(`   ☀️  UV Index: ${weatherData.uvIndex || 'N/A'}`);
      logger.info(`   ☁️  Cloud Cover: ${weatherData.cloudCover || 'N/A'}%`);
      logger.info(`   🌧️  Precipitation Probability: ${weatherData.precipitationProbability || 'N/A'}%`);
      logger.info(`   💧 Precipitation Type: ${weatherData.precipitationType || 'N/A'}`);

      // Test alert generation
      const alertCheck = weatherService.shouldGenerateAlert(weatherData);
      if (alertCheck.shouldAlert) {
        logger.info('⚠️  WEATHER ALERT:');
        logger.info(`   📢 Reason: ${alertCheck.reason}`);
      } else {
        logger.info('✅ No weather alerts needed');
      }

    } else {
      logger.error('❌ Failed to fetch weather data');
    }
  } catch (error) {
    logger.error('❌ Error testing Tomorrow.io API:', error);
  }
}

export { testTomorrowWeatherAPI };

function checkRainIntensity(intensity: number) {
  const ALERT_LIMIT = 10; 

  if (intensity > ALERT_LIMIT) {
    logger.warn("⚠️  HEAVY RAIN ALERT: Intensity is " + intensity + ". Triggering warning system!");
  } else {
    logger.info("✅ Weather is within normal limits. Intensity: " + intensity);
  }
}

export function runWeatherTest() {
  logger.info("--- RUNNING MANUAL WEATHER TEST ---");
  checkRainIntensity(15);
}