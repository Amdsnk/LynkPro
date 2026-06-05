import { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';
import { TimeEntry } from '@/types/types';
import { toast } from 'sonner';

export function useRealtimeTimeEntries(firmId: string | undefined) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!firmId) {
      setLoading(false);
      return;
    }

    // Initial fetch
    const fetchTimeEntries = async () => {
      try {
        const { data, error } = await supabase
          .from('time_entries')
          .select(`
            *,
            user:profiles!time_entries_user_id_fkey(*),
            project:projects(*)
          `)
          .eq('firm_id', firmId)
          .order('start_time', { ascending: false });

        if (error) throw error;
        setTimeEntries(data as any);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeEntries();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('time-entries-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'time_entries',
          filter: `firm_id=eq.${firmId}`,
        },
        (payload) => {
          const duration = payload.new.duration_minutes 
            ? `${Math.round(payload.new.duration_minutes / 60 * 10) / 10}h`
            : '';
          toast.success('New time entry logged', {
            description: `${payload.new.description || 'Time entry'} ${duration}`,
          });
          fetchTimeEntries();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'time_entries',
          filter: `firm_id=eq.${firmId}`,
        },
        (payload) => {
          toast.info('Time entry updated', {
            description: payload.new.description || 'A time entry has been updated',
          });
          fetchTimeEntries();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'time_entries',
          filter: `firm_id=eq.${firmId}`,
        },
        () => {
          toast.info('Time entry deleted');
          fetchTimeEntries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [firmId]);

  return { timeEntries, loading, error };
}
