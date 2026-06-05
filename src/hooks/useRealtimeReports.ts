import { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';
import { Report } from '@/types/types';
import { toast } from 'sonner';

export function useRealtimeReports(firmId: string | undefined) {
  const [reports, setReports] = useState<Report[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!firmId) {
      setLoading(false);
      return;
    }

    // Initial fetch
    const fetchReports = async () => {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select(`
            *,
            project:projects(*),
            author:profiles(*)
          `)
          .eq('firm_id', firmId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setReports(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('reports-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reports',
          filter: `firm_id=eq.${firmId}`,
        },
        (payload) => {
          toast.success('New report created', {
            description: payload.new.title || 'A new field report has been created',
          });
          fetchReports();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reports',
          filter: `firm_id=eq.${firmId}`,
        },
        (payload) => {
          toast.info('Report updated', {
            description: payload.new.title || 'A report has been updated',
          });
          fetchReports();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'reports',
          filter: `firm_id=eq.${firmId}`,
        },
        () => {
          toast.info('Report deleted');
          fetchReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [firmId]);

  return { reports, loading, error };
}
