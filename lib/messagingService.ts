import { createServerComponentClient } from './supabase';

/**
 * broadcast publishes a message to the SHARED channel (Supabase Realtime),
 * which will then be received by ALL server instances and flushed to their local SSE clients.
 */
export const broadcast = async (data: any) => {
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
    console.error('❌ Failed to send distributed broadcast:', error);
  }
};
