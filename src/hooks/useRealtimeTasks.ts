import { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';
import { Task } from '@/types/types';
import { toast } from 'sonner';

export function useRealtimeTasks(firmId: string | undefined, projectId?: string) {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!firmId) {
      setLoading(false);
      return;
    }

    // Initial fetch
    const fetchTasks = async () => {
      try {
        let query = supabase
          .from('tasks')
          .select(`
            *,
            project:projects(*),
            assignee:profiles!tasks_assignee_id_fkey(*)
          `)
          .eq('firm_id', firmId)
          .order('created_at', { ascending: false });

        if (projectId) {
          query = query.eq('project_id', projectId);
        }

        const { data, error } = await query;

        if (error) throw error;
        setTasks(data as any);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`tasks-changes-${projectId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks',
          filter: projectId ? `project_id=eq.${projectId}` : `firm_id=eq.${firmId}`,
        },
        (payload) => {
          toast.success('New task created', {
            description: payload.new.title || 'A new task has been created',
          });
          fetchTasks();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks',
          filter: projectId ? `project_id=eq.${projectId}` : `firm_id=eq.${firmId}`,
        },
        (payload) => {
          const statusChanged = payload.old.status !== payload.new.status;
          if (statusChanged) {
            toast.info('Task status updated', {
              description: `${payload.new.title || 'Task'} → ${payload.new.status}`,
            });
          } else {
            toast.info('Task updated', {
              description: payload.new.title || 'A task has been updated',
            });
          }
          fetchTasks();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'tasks',
          filter: projectId ? `project_id=eq.${projectId}` : `firm_id=eq.${firmId}`,
        },
        () => {
          toast.info('Task deleted');
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [firmId, projectId]);

  return { tasks, loading, error };
}
