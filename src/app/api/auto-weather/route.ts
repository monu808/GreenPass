import { NextRequest, NextResponse } from 'next/server';
import { validateInput, WeatherCheckSchema } from '@/lib/validation';

// Simple API endpoint to trigger weather checks automatically
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const destinationId = searchParams.get('destinationId');

    // Validate parameters
    const validation = validateInput(WeatherCheckSchema, {
      destinationId: destinationId || undefined
    });

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid query parameters',
        details: validation.errors,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const validData = validation.data;

    // Trigger weather check by calling our weather-check API
    const baseUrl = request.url.split('/api/')[0];
    const response = await fetch(`${baseUrl}/api/weather-check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        destinationId: validData.destinationId
      })
    });

    const result = await response.json();
    
    return NextResponse.json({
      triggered: true,
      result,
      timestamp: new Date().toISOString(),
      message: 'Weather check triggered automatically'
    });
  } catch (error) {
  let errorMsg = 'automatic weather check failed.';
  let statusCode = 500;
  
  if (error instanceof Error) {
    if (error.message.includes('database')) {
      errorMsg = 'Database access error.';
      statusCode = 500;
    } else if (error.message.includes('weather service')) {
      errorMsg = 'Weather service temporarily unavailable.';
      statusCode = 503;
    } else if (error.message.includes('timeout')) {
      errorMsg = 'Request to weather service timed out.';
      statusCode = 504;
    } else if (error.message.includes('validation')) {
      errorMsg = 'Invalid destination configuration.';
      statusCode = 400;
    } else {
      errorMsg = `Error: ${error.message}`;
    }
  }
  
  return NextResponse.json(
    { error: errorMsg, timestamp: new Date().toISOString() },
    { status: statusCode }
  );
}
}