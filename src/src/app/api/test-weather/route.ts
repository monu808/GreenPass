import { NextRequest, NextResponse } from 'next/server';
import { weatherService } from '@/lib/weatherService';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat') || '32.2396'; // Default to Manali
  const lon = searchParams.get('lon') || '77.1887';
  const city = searchParams.get('city') || 'Manali';

  try {
    console.log(`🌤️ Testing Tomorrow.io API for ${city} (${lat}, ${lon})`);
    
    const weatherData = await weatherService.getWeatherByCoordinates(
      parseFloat(lat),
      parseFloat(lon),
      city
    );

    if (!weatherData) {
      return NextResponse.json(
        { error: 'Failed to fetch weather data' },
        { status: 500 }
      );
    }

    // Test alert generation
    const alertCheck = weatherService.shouldGenerateAlert(weatherData);

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      location: {
        city,
        coordinates: { lat: parseFloat(lat), lon: parseFloat(lon) }
      },
      weather: weatherData,
      alert: alertCheck,
      message: '✅ Tomorrow.io API integration working successfully!'
    };

    console.log('✅ Weather API test successful:', response);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Weather API test failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Weather API test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
