import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/db/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

interface AssignmentFormData {
  subcontractor_id: string;
  project_id: string;
  task_description: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'terminated';
}

export default function SubcontractorAssignmentPage() {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [subcontractors, setSubcontractors] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<AssignmentFormData>({
    defaultValues: {
      subcontractor_id: '',
      project_id: '',
      task_description: '',
      start_date: '',
      end_date: '',
      status: 'active',
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

      // Fetch assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('subcontractor_assignments')
        .select('*, subcontractors(company_name), projects(name)')
        .eq('firm_id', profile.firm_id)
        .order('start_date', { ascending: false });

      if (assignmentsError) throw assignmentsError;

      // Fetch subcontractors
      const { data: subcontractorsData, error: subcontractorsError } = await supabase
        .from('subcontractors')
        .select('id, company_name, specialty')
        .eq('firm_id', profile.firm_id)
        .eq('status', 'active')
        .order('company_name');

      if (subcontractorsError) throw subcontractorsError;

      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, name')
        .eq('firm_id', profile.firm_id)
        .order('name');

      if (projectsError) throw projectsError;

      setAssignments(assignmentsData || []);
      setSubcontractors(subcontractorsData || []);
      setProjects(projectsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(data: AssignmentFormData) {
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
        .from('subcontractor_assignments')
        .insert([{
          ...data,
          firm_id: profile.firm_id,
        }]);

      if (error) throw error;

      toast.success('Assignment created successfully');
      setDialogOpen(false);
      form.reset();
      fetchData();
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast.error('Failed to create assignment');
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteAssignment(id: string) {
    if (!confirm('Are you sure you want to delete this assignment?')) return;

    try {
      const { error } = await supabase
        .from('subcontractor_assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Assignment deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error('Failed to delete assignment');
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      active: 'default',
      completed: 'secondary',
      terminated: 'destructive',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading assignments...</p>
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
            <h1 className="text-3xl font-bold">Subcontractor Assignments</h1>
            <p className="text-muted-foreground mt-2">
              Manage subcontractor assignments to projects
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Assignment</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="subcontractor_id"
                      rules={{ required: 'Subcontractor is required' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subcontractor *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select subcontractor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {subcontractors.map((sub) => (
                                <SelectItem key={sub.id} value={sub.id}>
                                  {sub.company_name} - {sub.specialty}
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
                  </div>

                  <FormField
                    control={form.control}
                    name="task_description"
                    rules={{ required: 'Task description is required' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Task Description *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the scope of work..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="start_date"
                      rules={{ required: 'Start date is required' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="end_date"
                      rules={{ required: 'End date is required' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="terminated">Terminated</SelectItem>
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
                      {submitting ? 'Creating...' : 'Create Assignment'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Assignments List */}
        <Card>
          <CardHeader>
            <CardTitle>Current Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No assignments yet. Create your first assignment to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-start justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <p className="font-medium">
                          {(assignment as any).subcontractors?.company_name || 'Unknown'}
                        </p>
                        <span className="text-muted-foreground">→</span>
                        <p className="font-medium">
                          {(assignment as any).projects?.name || 'Unknown'}
                        </p>
                        {getStatusBadge(assignment.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {assignment.task_description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          Start: {format(parseISO(assignment.start_date), 'MMM d, yyyy')}
                        </span>
                        <span>
                          End: {format(parseISO(assignment.end_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteAssignment(assignment.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
