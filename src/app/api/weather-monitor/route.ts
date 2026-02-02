import { NextRequest, NextResponse } from 'next/server';
import { weatherMonitoringService } from '@/lib/weatherMonitoringService';
import { RealtimeChannel } from '@supabase/supabase-js';
import { validateInput, WeatherMonitorSchema } from '@/lib/validation';

import { createServerComponentClient } from '@/lib/supabase';
import { distributedBroadcast, BroadcastPayload } from '@/lib/messagingService';

// Local instance state for SSE connections
const activeWriters = new Set<WritableStreamDefaultWriter>();
const encoder = new TextEncoder();

// Instance-wide Supabase channel for distributed broadcasts
let sharedChannel: RealtimeChannel | null = null;
let heartbeatInterval: NodeJS.Timeout | null = null;

type LocalFlushData = BroadcastPayload | { type: 'heartbeat'; timestamp: string };

/**
 * localFlush sends a message to all SSE connections connected to THIS instance.
 */
const localFlush = async (data: LocalFlushData) => {
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

/**
 * Ensures a single shared subscription for the whole instance
 */
const ensureSharedSubscription = () => {
  if (sharedChannel || activeWriters.size === 0) return;

  const supabase = createServerComponentClient();
  if (!supabase) {
    console.warn('⚠️ Cannot establish shared subscription: Supabase client unavailable');
    return;
  }

  console.log('📡 Establishing instance-wide shared channel subscription');
  sharedChannel = supabase.channel('weather-monitor-shared')
    .on('broadcast', { event: 'weather_update' }, ({ payload }) => {
      console.log('📥 Shared broadcast received, flushing to local clients');
      localFlush(payload);
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Instance-wide shared channel subscribed');
      }
    });

  // Start heartbeat if not already running
  if (!heartbeatInterval) {
    heartbeatInterval = setInterval(() => {
      if (activeWriters.size > 0) {
        localFlush({ type: 'heartbeat', timestamp: new Date().toISOString() });
      } else {
        stopSharedSubscription();
      }
    }, 15000); // 15s heartbeat
  }
};

/**
 * Stops the shared subscription if no local clients remain
 */
const stopSharedSubscription = () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  if (sharedChannel) {
    console.log('🔌 Closing instance-wide shared channel subscription');
    sharedChannel.unsubscribe();
    sharedChannel = null;
  }
};

export async function POST(request: NextRequest) {
  try { 
    console.log('🔄 Weather monitoring trigger received');
    
    // Validate request body if present
    let body = {};
    try {
      if (request.headers.get('content-type')?.includes('application/json')) {
        body = await request.json();
      }
    } catch {
      // Body might be empty
    }

    const validation = validateInput(WeatherMonitorSchema, body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input parameters',
        details: validation.errors,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // In serverless, we just run the check once. No more background intervals.
    // The "coordinator" (cron) will hit this endpoint periodically.
    await weatherMonitoringService.checkWeatherNow();
    
    // After checking, we broadcast to everyone
    await distributedBroadcast({ 
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
    let errorMsg = 'Realtime weather monitoring failed.';
    let statusCode = 500;
  
    if (error instanceof Error) {
      if (error.message.includes('validation')) {
        errorMsg = 'Invalid monitoring parameters.';
        statusCode = 400;
      } else if (error.message.includes('destination')) {
        errorMsg = 'Destination not found for monitoring.';
        statusCode = 404;
      } else if (error.message.includes('weather service')) {
        errorMsg = 'Weather service temporarily unavailable.';
        statusCode = 503;
      } else if (error.message.includes('database')) {
        errorMsg = 'Error accessing the database.';
        statusCode = 500;
      } else if (error.message.includes('timeout')) {
        errorMsg = 'Monitoring request timed out.';
        statusCode = 504;
      } else {
        errorMsg = `Error monitoring weather: ${error.message}`;
      }
    }

    return NextResponse.json(
      { error: errorMsg, destinations: [] },
      { status: statusCode }
    );
  }
}
export async function GET(_request: NextRequest) {
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  activeWriters.add(writer);

  // Set up shared channel subscription if this is the first client
  const supabase = createServerComponentClient();
  ensureSharedSubscription();

  // Send initial connection success
  await writer.write(encoder.encode(`data: ${JSON.stringify({ 
    type: 'connection_established', 
    timestamp: new Date().toISOString(),
    mode: supabase ? 'distributed' : 'local'
  })}\n\n`));

  _request.signal.onabort = () => {
    console.log("🛑 One Dashboard connection closed.");
    activeWriters.delete(writer);
    
    // Cleanup shared subscription if no clients left
    if (activeWriters.size === 0) {
      stopSharedSubscription();
    }
    
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
