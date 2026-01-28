import { NextRequest, NextResponse } from 'next/server';
import { weatherService } from '@/lib/weatherService';
import { validateInput, TestWeatherSchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
  // Production Warning: This route should be protected or disabled in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Test routes are disabled in production' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const latParam = searchParams.get('lat') || '32.2396'; // Default to Manali
  const lonParam = searchParams.get('lon') || '77.1887';
  const cityParam = searchParams.get('city') || 'Manali';

  // Validate parameters
  const validation = validateInput(TestWeatherSchema, {
    lat: latParam,
    lon: lonParam,
    city: cityParam
  });

  if (!validation.success) {
    return NextResponse.json({
      success: false,
      error: 'Invalid query parameters',
      details: validation.errors,
      timestamp: new Date().toISOString()
    }, { status: 400 });
  }

  const { lat, lon, city } = validation.data;

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
  let errorMsg = 'weather test failed.';
  let statusCode = 500;
  
  if (error instanceof Error) {
    if (error.message.includes('connection')) {
      errorMsg = 'Access to weather service failed.';
      statusCode = 503;
    } else if (error.message.includes('timeout')) {
      errorMsg = 'Weather service timed out.';
      statusCode = 504;
    } else if (error.message.includes('authentication')) {
      errorMsg = 'Invalid weather service credentials.';
      statusCode = 401;
    } else if (error.message.includes('validation')) {
      errorMsg = 'Invalid test data.';
      statusCode = 400;
    } else {
      errorMsg = `Error in test: ${error.message}`;
    }
  }
  
  return NextResponse.json(
    { error: errorMsg, status: 'failed' },
    { status: statusCode }
  );
}
}
