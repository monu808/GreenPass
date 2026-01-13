// Test file for Tomorrow.io Weather API integration
// This file demonstrates how to use the new weather service

import { weatherService } from '@/lib/weatherService';

async function testTomorrowWeatherAPI() {
  console.log('🌤️ Testing Tomorrow.io Weather API Integration');
  console.log('====================================================');

  // Test coordinates for Manali, Himachal Pradesh
  const testLocation = {
    lat: 32.2396,
    lon: 77.1887,
    name: 'Manali'
  };

  try {
    console.log(`📍 Fetching weather data for ${testLocation.name}...`);
    
    const weatherData = await weatherService.getWeatherByCoordinates(
      testLocation.lat,
      testLocation.lon,
      testLocation.name
    );

    if (weatherData) {
      console.log('✅ Weather data fetched successfully!');
      console.log('📊 Weather Details:');
      console.log(`   🌡️  Temperature: ${weatherData.temperature}°C`);
      console.log(`   💧 Humidity: ${weatherData.humidity}%`);
      console.log(`   🎈 Pressure: ${weatherData.pressure} hPa`);
      console.log(`   🌤️  Condition: ${weatherData.weatherMain} - ${weatherData.weatherDescription}`);
      console.log(`   💨 Wind: ${weatherData.windSpeed} m/s from ${weatherData.windDirection}°`);
      console.log(`   👁️  Visibility: ${weatherData.visibility} km`);
      console.log(`   ☀️  UV Index: ${weatherData.uvIndex || 'N/A'}`);
      console.log(`   ☁️  Cloud Cover: ${weatherData.cloudCover || 'N/A'}%`);
      console.log(`   🌧️  Precipitation Probability: ${weatherData.precipitationProbability || 'N/A'}%`);
      console.log(`   💧 Precipitation Type: ${weatherData.precipitationType || 'N/A'}`);

      // Test alert generation
      const alertCheck = weatherService.shouldGenerateAlert(weatherData);
      if (alertCheck.shouldAlert) {
        console.log('⚠️  WEATHER ALERT:');
        console.log(`   📢 Reason: ${alertCheck.reason}`);
      } else {
        console.log('✅ No weather alerts needed');
      }

    } else {
      console.log('❌ Failed to fetch weather data');
    }
  } catch (error) {
    console.error('❌ Error testing Tomorrow.io API:', error);
  }
}

export { testTomorrowWeatherAPI };


/*
  This function checks if the rain intensity requires a warning.
 */
function checkRainIntensity(intensity: number) {
  const ALERT_LIMIT = 10; // Threshold for heavy rain

  if (intensity > ALERT_LIMIT) {
    console.log("⚠️  HEAVY RAIN ALERT: Intensity is " + intensity + ". Triggering warning system!");
  } else {
    console.log("✅ Weather is within normal limits. Intensity: " + intensity);
  }
}

// Test Case: Simulate heavy rain with an intensity of 15
checkRainIntensity(15);