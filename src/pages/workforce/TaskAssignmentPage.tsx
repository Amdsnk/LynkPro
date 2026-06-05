import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/db/supabase';
import { TaskAssignment, WorkerSkill, Profile, ProficiencyLevel } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { matchWorkersToTask, getSkillMatchPercentage } from '@/lib/skillMatching';
import { SkillBadge } from '@/components/workforce/SkillBadge';

interface TaskFormData {
  project_id: string;
  task_name: string;
  task_description: string;
  required_skills: Array<{ skill_name: string; proficiency_level: ProficiencyLevel }>;
  status: 'pending' | 'in_progress' | 'completed';
}

export default function TaskAssignmentPage() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<TaskAssignment[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [workers, setWorkers] = useState<Profile[]>([]);
  const [workerSkills, setWorkerSkills] = useState<WorkerSkill[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskAssignment | null>(null);
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);

  const form = useForm<TaskFormData>({
    defaultValues: {
      project_id: '',
      task_name: '',
      task_description: '',
      required_skills: [],
      status: 'pending',
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('firm_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.firm_id) return;

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('task_assignments')
        .select('*, projects(name)')
        .eq('firm_id', profile.firm_id)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, name')
        .eq('firm_id', profile.firm_id)
        .order('name');

      if (projectsError) throw projectsError;

      // Fetch workers
      const { data: workersData, error: workersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('firm_id', profile.firm_id)
        .order('full_name');

      if (workersError) throw workersError;

      // Fetch worker skills
      const { data: skillsData, error: skillsError } = await supabase
        .from('worker_skills')
        .select('*')
        .eq('firm_id', profile.firm_id);

      if (skillsError) throw skillsError;

      setTasks(tasksData || []);
      setProjects(projectsData || []);
      setWorkers(workersData || []);
      setWorkerSkills(skillsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load task assignments');
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(data: TaskFormData) {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('firm_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.firm_id) throw new Error('Firm not found');

      const { error } = await supabase
        .from('task_assignments')
        .insert([{
          ...data,
          firm_id: profile.firm_id,
          assigned_to: [],
          completion_percentage: 0,
        }]);

      if (error) throw error;

      toast.success('Task created successfully');
      setDialogOpen(false);
      form.reset();
      fetchData();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    } finally {
      setSubmitting(false);
    }
  }

  async function assignWorkers(taskId: string, workerIds: string[]) {
    try {
      const { error } = await supabase
        .from('task_assignments')
        .update({ assigned_to: workerIds })
        .eq('id', taskId);

      if (error) throw error;

      toast.success('Workers assigned successfully');
      setMatchDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error assigning workers:', error);
      toast.error('Failed to assign workers');
    }
  }

  function openMatchDialog(task: TaskAssignment) {
    setSelectedTask(task);
    setMatchDialogOpen(true);
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      pending: 'secondary',
      in_progress: 'default',
      completed: 'secondary',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status.replace('_', ' ')}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading task assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Task Assignment</h1>
            <p className="text-muted-foreground mt-2">
              Assign tasks to workers based on skill matching
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="project_id"
                    rules={{ required: 'Project is required' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select project" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {projects.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="task_name"
                    rules={{ required: 'Task name is required' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Task Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Install electrical wiring" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="task_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the task requirements..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? 'Creating...' : 'Create Task'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tasks List */}
        <Card>
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No tasks yet. Create your first task to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => {
                  const matches = matchWorkersToTask(task, workers, workerSkills);
                  const assignedWorkers = workers.filter(w => task.assigned_to?.includes(w.id));
                  
                  return (
                    <div
                      key={task.id}
                      className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-medium">{task.task_name}</p>
                            {getStatusBadge(task.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {(task as any).projects?.name || 'Unknown Project'}
                          </p>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {task.description}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openMatchDialog(task)}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Assign Workers
                        </Button>
                      </div>

                      {task.required_skills && task.required_skills.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-muted-foreground mb-2">Required Skills:</p>
                          <div className="flex flex-wrap gap-2">
                            {task.required_skills.map((skill, index) => (
                              <div key={index} className="flex items-center gap-1">
                                <span className="text-sm">{skill.skill_name}</span>
                                <SkillBadge proficiency={skill.proficiency_level} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {assignedWorkers.length > 0 && (
                        <div className="flex items-center gap-2 pt-3 border-t">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-muted-foreground">
                            Assigned to: {assignedWorkers.map(w => w.full_name).join(', ')}
                          </span>
                        </div>
                      )}

                      {assignedWorkers.length === 0 && matches.length > 0 && (
                        <div className="flex items-center gap-2 pt-3 border-t">
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                          <span className="text-sm text-muted-foreground">
                            {matches.length} potential matches available
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Worker Matching Dialog */}
        {selectedTask && (
          <Dialog open={matchDialogOpen} onOpenChange={setMatchDialogOpen}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Assign Workers to Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <p className="font-medium">{selectedTask.task_name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {(selectedTask as any).projects?.name}
                  </p>
                </div>

                {selectedTask.required_skills && selectedTask.required_skills.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Required Skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTask.required_skills.map((skill, index) => (
                        <div key={index} className="flex items-center gap-1">
                          <span className="text-sm">{skill.skill_name}</span>
                          <SkillBadge proficiency={skill.proficiency_level} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium mb-3">Recommended Workers:</p>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {matchWorkersToTask(selectedTask, workers, workerSkills).map((match) => {
                      const matchPercentage = getSkillMatchPercentage(
                        match.matchedSkills.length,
                        selectedTask.required_skills?.length || 0
                      );
                      
                      return (
                        <div
                          key={match.worker.id}
                          className="p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => assignWorkers(selectedTask.id, [match.worker.id])}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-medium">{match.worker.full_name}</p>
                              <p className="text-xs text-muted-foreground">{match.worker.role}</p>
                            </div>
                            <Badge variant={matchPercentage >= 80 ? 'default' : matchPercentage >= 50 ? 'secondary' : 'destructive'}>
                              {matchPercentage}% match
                            </Badge>
                          </div>
                          {match.matchedSkills.length > 0 && (
                            <div className="text-xs text-green-600">
                              ✓ {match.matchedSkills.join(', ')}
                            </div>
                          )}
                          {match.missingSkills.length > 0 && (
                            <div className="text-xs text-destructive mt-1">
                              ✗ Missing: {match.missingSkills.join(', ')}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
