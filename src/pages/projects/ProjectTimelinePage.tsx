import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { Project } from '@/types/types';
import { GanttChart } from '@/components/gantt/GanttChart';
import { CreateTaskDialog } from '@/components/gantt/CreateTaskDialog';
import { ExplainableMetric } from '@/components/shared/ExplainableMetric';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Calendar, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ProjectTimelinePage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [taskStats, setTaskStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    overdue: 0
  });

  useEffect(() => {
    if (id) {
      loadProject();
      loadTaskStats();
    }
  }, [id]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*, client:clients(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error('Error loading project:', error);
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const loadTaskStats = async () => {
    try {
      const { data } = await supabase
        .from('tasks')
        .select('status, due_date')
        .eq('project_id', id);

      if (data) {
        const now = new Date();
        setTaskStats({
          total: data.length,
          completed: data.filter(t => t.status === 'done').length,
          inProgress: data.filter(t => t.status === 'in_progress').length,
          overdue: data.filter(t => {
            if (t.status === 'done') return false;
            if (!t.due_date) return false;
            return new Date(t.due_date) < now;
          }).length
        });
      }
    } catch (error) {
      console.error('Error loading task stats:', error);
    }
  };

  const handleTaskCreated = () => {
    setRefreshKey(prev => prev + 1);
    loadTaskStats();
  };

  const completionRate = taskStats.total > 0 
    ? Math.round((taskStats.completed / taskStats.total) * 100) 
    : 0;

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64 bg-muted" />
        <Skeleton className="h-96 w-full bg-muted" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-2">Project not found</h2>
          <p className="text-muted-foreground mb-4">
            The project you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button asChild>
            <Link to="/projects">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/projects/${id}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Project
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-semibold">{project.name}</h1>
          <p className="text-muted-foreground">
            {project.client?.name} • Timeline View
          </p>
        </div>
        <CreateTaskDialog projectId={id!} onTaskCreated={handleTaskCreated} />
      </div>

      {/* Timeline Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <ExplainableMetric
          title="Total Tasks"
          value={`${taskStats.total}`}
          icon={<Calendar className="h-4 w-4" />}
          trend="neutral"
          explanation="Total number of tasks in project timeline"
          calculation={`${taskStats.total} tasks across all phases`}
          dataSource="Tasks table"
          confidence={100}
          factors={['Project scope', 'Work breakdown', 'Team capacity']}
        />
        <ExplainableMetric
          title="Completion Rate"
          value={`${completionRate}%`}
          icon={<CheckCircle2 className="h-4 w-4" />}
          trend={completionRate >= 70 ? 'up' : completionRate >= 40 ? 'neutral' : 'down'}
          explanation="Percentage of tasks completed vs total tasks"
          calculation={`${taskStats.completed} completed / ${taskStats.total} total`}
          dataSource="Tasks table (status = 'done')"
          confidence={100}
          factors={['Team productivity', 'Task complexity', 'Resource availability']}
        />
        <ExplainableMetric
          title="In Progress"
          value={`${taskStats.inProgress}`}
          icon={<TrendingUp className="h-4 w-4" />}
          trend="neutral"
          explanation="Tasks currently being worked on by team members"
          calculation={`${taskStats.inProgress} tasks with status = 'in_progress'`}
          dataSource="Tasks table"
          confidence={100}
          factors={['Active work', 'Team allocation', 'Sprint planning']}
        />
        <ExplainableMetric
          title="Overdue Tasks"
          value={`${taskStats.overdue}`}
          icon={<AlertTriangle className="h-4 w-4" />}
          trend={taskStats.overdue === 0 ? 'up' : 'down'}
          explanation="Tasks past their due date that are not yet completed"
          calculation={`${taskStats.overdue} tasks with due_date < today and status != 'done'`}
          dataSource="Tasks table"
          confidence={95}
          factors={['Schedule adherence', 'Resource constraints', 'Scope changes']}
        />
      </div>

      {/* Gantt Chart */}
      <Card>
        <CardContent className="pt-6">
          <GanttChart key={refreshKey} projectId={id!} />
        </CardContent>
      </Card>
    </div>
  );
}
