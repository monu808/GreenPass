import { NextRequest, NextResponse } from 'next/server';
import { weatherMonitoringService } from '@/lib/weatherMonitoringService';

// CHANGE 1: Move interval variable OUTSIDE the function to share it
let globalInterval: NodeJS.Timeout | null = null;

export async function POST(request: NextRequest) {
  try { 
    console.log('🔄 Manual weather monitoring trigger requested');
    
    if (!weatherMonitoringService.isRunning) {
      weatherMonitoringService.start();
    }
    
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
      { error: 'Failed to trigger weather monitoring' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  const sendUpdate = async (data: any) => {
    try {
      await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    } catch (e) {
      console.error("Stream write error:", e);
    }
  };

  // CHANGE 2: Only start the interval if it's not already running
  if (!globalInterval) {
    console.log("🚀 Starting Global Server-Side Monitoring (Singleton)...");
    globalInterval = setInterval(async () => {
      console.log("📡 Server: Checking weather...");
      await weatherMonitoringService.checkWeatherNow();
      
      // Note: This specific local sendUpdate will only trigger for the 
      // person who opened the first connection. The background service 
      // handles the database updates for everyone else.
    }, 300000); 
  }

  request.signal.onabort = () => {
    console.log("🛑 One Dashboard connection closed.");
    // CHANGE 3: DO NOT clearInterval here.
    // If you clear it, you stop the weather check for everyone else!
    writer.close();
  };

  return new Response(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}