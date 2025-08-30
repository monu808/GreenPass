import { NextRequest, NextResponse } from 'next/server';

// Simple API endpoint to trigger weather checks automatically
export async function GET(request: NextRequest) {
  try {
    // Trigger weather check by calling our weather-check API
    const baseUrl = request.url.split('/api/')[0];
    const response = await fetch(`${baseUrl}/api/weather-check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
        error: 'Failed to trigger automatic weather check',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
