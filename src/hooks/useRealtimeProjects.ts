import { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';
import { Project } from '@/types/types';

export function useRealtimeProjects(firmId: string | undefined) {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!firmId) {
      setLoading(false);
      return;
    }

    // Initial fetch
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select(`
            *,
            client:clients(*)
          `)
          .eq('firm_id', firmId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProjects(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('projects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `firm_id=eq.${firmId}`,
        },
        () => {
          // Refetch on any change
          fetchProjects();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [firmId]);

  return { projects, loading, error };
}
