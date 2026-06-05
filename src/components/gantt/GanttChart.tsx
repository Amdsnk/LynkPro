import { useState, useEffect, useMemo } from 'react';
import { Gantt, Task, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import { format, addDays, parseISO } from 'date-fns';
import { supabase } from '@/db/supabase';
import { GanttTask } from '@/types/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Calendar, ZoomIn, ZoomOut } from 'lucide-react';

interface GanttChartProps {
  projectId: string;
}

export function GanttChart({ projectId }: GanttChartProps) {
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Week);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, [projectId]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('gantt_tasks')
        .select(`
          *,
          assignee:profiles!gantt_tasks_assignee_id_fkey(id, full_name),
          dependencies:task_dependencies!task_dependencies_successor_task_id_fkey(*)
        `)
        .eq('project_id', projectId)
        .order('start_date');

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const ganttTasks: Task[] = useMemo(() => {
    return tasks.map(task => ({
      id: task.id,
      name: task.name,
      start: parseISO(task.start_date),
      end: parseISO(task.end_date),
      progress: task.progress,
      type: task.is_milestone ? 'milestone' : 'task',
      isDisabled: false,
      styles: {
        progressColor: task.status === 'completed' ? '#10b981' : 
                       task.status === 'in_progress' ? '#3b82f6' :
                       task.status === 'blocked' ? '#ef4444' : '#94a3b8',
        progressSelectedColor: task.status === 'completed' ? '#059669' : 
                               task.status === 'in_progress' ? '#2563eb' :
                               task.status === 'blocked' ? '#dc2626' : '#64748b',
      },
      dependencies: task.dependencies?.map(d => d.predecessor_task_id) || [],
    }));
  }, [tasks]);

  const handleTaskChange = async (task: Task) => {
    try {
      const { error } = await supabase
        .from('gantt_tasks')
        .update({
          start_date: format(task.start, 'yyyy-MM-dd'),
          end_date: format(task.end, 'yyyy-MM-dd'),
          progress: task.progress,
        })
        .eq('id', task.id);

      if (error) throw error;
      
      toast.success('Task updated successfully');
      await loadTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const handleTaskDelete = async (task: Task) => {
    try {
      const { error } = await supabase
        .from('gantt_tasks')
        .delete()
        .eq('id', task.id);

      if (error) throw error;
      
      toast.success('Task deleted successfully');
      await loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const handleProgressChange = async (task: Task) => {
    try {
      const { error } = await supabase
        .from('gantt_tasks')
        .update({ progress: task.progress })
        .eq('id', task.id);

      if (error) throw error;
      
      await loadTasks();
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No tasks yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create tasks to visualize your project timeline
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Project Timeline</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ViewMode.Day}>Day</SelectItem>
                <SelectItem value={ViewMode.Week}>Week</SelectItem>
                <SelectItem value={ViewMode.Month}>Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="gantt-container">
          <Gantt
            tasks={ganttTasks}
            viewMode={viewMode}
            onDateChange={handleTaskChange}
            onDelete={handleTaskDelete}
            onProgressChange={handleProgressChange}
            listCellWidth="200px"
            columnWidth={viewMode === ViewMode.Month ? 300 : viewMode === ViewMode.Week ? 250 : 60}
          />
        </div>
      </CardContent>
    </Card>
  );
}
