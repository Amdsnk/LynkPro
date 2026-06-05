import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

interface UseRealtimeConnectionReturn {
  status: ConnectionStatus;
  isConnected: boolean;
  channel: RealtimeChannel | null;
}

export function useRealtimeConnection(channelName: string): UseRealtimeConnectionReturn {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    // Create a channel for this connection
    const realtimeChannel = supabase.channel(channelName);

    // Subscribe to the channel
    realtimeChannel
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setStatus('connected');
        } else if (status === 'CLOSED') {
          setStatus('disconnected');
        } else if (status === 'CHANNEL_ERROR') {
          setStatus('reconnecting');
        }
      });

    setChannel(realtimeChannel);

    // Cleanup on unmount
    return () => {
      realtimeChannel.unsubscribe();
    };
  }, [channelName]);

  return {
    status,
    isConnected: status === 'connected',
    channel,
  };
}
