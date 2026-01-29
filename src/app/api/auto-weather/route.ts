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
    console.error('Error in auto weather trigger:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to trigger automatic weather check',
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
