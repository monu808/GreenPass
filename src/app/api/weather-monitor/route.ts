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
  // This creates a "Live Pipe" (SSE) to push data to the Dashboard
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // Helper to send messages through the pipe
  const sendUpdate = async (data: any) => {
    try {
      await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    } catch (e) {
      console.error("Stream write error:", e);
    }
  };

  // Move the 5-minute timer to the server side
  const interval = setInterval(async () => {
    console.log("📡 Server: Checking weather and pushing live updates...");
    await weatherMonitoringService.checkWeatherNow();
    
    await sendUpdate({ 
      status: 'updated', 
      timestamp: new Date().toISOString(),
      isRunning: true 
    });
  }, 300000); // 300,000ms = 5 minutes

  // Important: Clean up the timer when the user leaves the Dashboard
  request.signal.onabort = () => {
    console.log("🛑 Dashboard connection closed, stopping server interval");
    clearInterval(interval);
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