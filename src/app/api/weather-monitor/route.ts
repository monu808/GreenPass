import { NextRequest, NextResponse } from 'next/server';
import { weatherMonitoringService } from '@/lib/weatherMonitoringService';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Manual weather monitoring trigger requested');
    
    // Start monitoring if not running
    if (!weatherMonitoringService.isRunning) {
      weatherMonitoringService.start();
    }
    
    // Trigger immediate weather check
    await weatherMonitoringService.checkWeatherNow();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Weather monitoring triggered successfully',
      timestamp: new Date().toISOString(),
      isRunning: weatherMonitoringService.isRunning
    });
  } catch (error) {
    console.error('❌ Error triggering weather monitoring:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to trigger weather monitoring',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    isRunning: weatherMonitoringService.isRunning,
    timestamp: new Date().toISOString(),
    message: weatherMonitoringService.isRunning 
      ? 'Weather monitoring is active'
      : 'Weather monitoring is stopped'
  });
}
