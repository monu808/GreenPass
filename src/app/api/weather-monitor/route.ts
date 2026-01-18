import { NextRequest, NextResponse } from 'next/server';
import { weatherMonitoringService } from '@/lib/weatherMonitoringService';

import { createServerComponentClient } from '@/lib/supabase';
import { broadcast } from '@/lib/messagingService';

// Local instance state for SSE connections
const activeWriters = new Set<WritableStreamDefaultWriter>();
const encoder = new TextEncoder();

/**
 * localFlush sends a message to all SSE connections connected to THIS instance.
 */
const localFlush = async (data: any) => {
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
    
    // In serverless, we just run the check once. No more background intervals.
    // The "coordinator" (cron) will hit this endpoint periodically.
    await weatherMonitoringService.checkWeatherNow();
    
    // After checking, we broadcast to everyone
    await broadcast({ 
      type: 'weather_update_available', 
      timestamp: new Date().toISOString(),
      source: 'manual_trigger'
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Weather check completed and broadcasted',
      timestamp: new Date().toISOString()
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

  // Set up shared channel subscription for THIS instance's connections
  const supabase = createServerComponentClient();
  let channel: any = null;
  
  if (supabase) {
    channel = supabase.channel('weather-monitor-shared')
      .on('broadcast', { event: 'weather_update' }, ({ payload }) => {
        console.log('📥 Received shared broadcast, flushing to local SSE clients');
        localFlush(payload);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Instance subscribed to shared weather channel');
        }
      });
  } else {
    console.warn('⚠️ Skipping Supabase channel subscription due to missing client');
  }

  // Send initial connection success
  await writer.write(encoder.encode(`data: ${JSON.stringify({ 
    type: 'connection_established', 
    timestamp: new Date().toISOString(),
    mode: supabase ? 'distributed' : 'local'
  })}\n\n`));

  request.signal.onabort = () => {
    console.log("🛑 One Dashboard connection closed.");
    activeWriters.delete(writer);
    if (channel) channel.unsubscribe();
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