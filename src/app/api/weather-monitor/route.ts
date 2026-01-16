import { NextRequest, NextResponse } from 'next/server';
import { weatherMonitoringService } from '@/lib/weatherMonitoringService';

// CHANGE 1: Move interval variable OUTSIDE the function to share it
let globalInterval: NodeJS.Timeout | null = null;
const activeWriters = new Set<WritableStreamDefaultWriter>();
const encoder = new TextEncoder();

const broadcast = async (data: any) => {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  const encoded = encoder.encode(message);
  
  const writePromises = Array.from(activeWriters).map(async (writer) => {
    try {
      await writer.write(encoded);
    } catch (e) {
      console.error("Broadcast write error:", e);
      activeWriters.delete(writer);
    }
  });
  
  await Promise.all(writePromises);
};

export async function POST(request: NextRequest) {
  try { 
    console.log('🔄 Weather monitoring trigger received');
    
    if (!weatherMonitoringService.isRunning) {
      weatherMonitoringService.start();
    } else {
      // If already running, trigger a check in the background
      // without making the request wait for it to complete
      weatherMonitoringService.checkWeatherNow().catch(err => {
        console.error('Background weather check failed:', err);
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Weather monitoring process initiated',
      timestamp: new Date().toISOString(),
      isRunning: weatherMonitoringService.isRunning
    });
  } catch (error) {
    console.error('❌ Error in weather-monitor API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  activeWriters.add(writer);

  // Send initial connection success
  await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'connection_established', timestamp: new Date().toISOString() })}\n\n`));

  // CHANGE 2: Only start the interval if it's not already running
  if (!globalInterval) {
    console.log("🚀 Starting Global Server-Side Monitoring (Singleton)...");
    globalInterval = setInterval(async () => {
      console.log("📡 Server: Checking weather...");
      await weatherMonitoringService.checkWeatherNow();
      
      // Broadcast that weather was updated
      await broadcast({ type: 'weather_update_available', timestamp: new Date().toISOString() });
    }, 21600000); // 6 hours
  }

  request.signal.onabort = () => {
    console.log("🛑 One Dashboard connection closed.");
    activeWriters.delete(writer);
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