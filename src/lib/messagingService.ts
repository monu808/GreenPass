import { createServerComponentClient } from '@/lib/supabase';
import { logger } from './logger';

export type BroadcastPayload = 
  | { 
      type: 'weather_update'; 
      destinationId: string; 
      weather: {
        temperature: number;
        humidity: number;
        weatherMain: string;
        weatherDescription: string;
        windSpeed: number;
      }; 
      alert: {
        level: 'low' | 'medium' | 'high' | 'critical' | 'none';
        message: string | null;
      } | null; 
      timestamp: string; 
    }
  | { type: 'weather_update_available'; timestamp: string; source: string }
  | { type: 'connection_established'; timestamp: string; mode: string };

/**
 * broadcast publishes a message to the SHARED channel (Supabase Realtime),
 * which will then be received by ALL server instances and flushed to their local SSE clients.
 */
export const distributedBroadcast = async (data: BroadcastPayload) => {
  try {
    const supabase = createServerComponentClient();
    if (!supabase) {
      console.warn('⚠️ Supabase client is not available for broadcast (missing service role key)');
      return;
    }
    const channel = supabase.channel('weather-monitor-shared');
    
    // Publish to the shared channel
    await channel.send({
      type: 'broadcast',
      event: 'weather_update',
      payload: data,
    });
    
    console.log('📡 Distributed broadcast sent to shared channel');
  } catch (error) {
    logger.error(
      'Failed to send distributed broadcast',
      error,
      { component: 'messagingService', operation: 'distributedBroadcast' }
    );
  }
};
