import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIncidentInvestigations, useCorrectiveActions, createIncidentInvestigation, createCorrectiveAction, updateCorrectiveAction } from '@/hooks/useSafetyIncidents';
import { supabase } from '@/db/supabase';
import type { SafetyIncident } from '@/types/types';
import { Shield, ArrowLeft, Plus, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';

export default function SafetyIncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [incident, setIncident] = useState<SafetyIncident | null>(null);
  const [loading, setLoading] = useState(true);
  const { investigations } = useIncidentInvestigations(profile?.firm_id, id);
  const { actions } = useCorrectiveActions(profile?.firm_id, id);
  const [investigationDialogOpen, setInvestigationDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);

  useEffect(() => {
    const fetchIncident = async () => {
      if (!id) return;
      
      const { data, error } = await supabase
        .from('safety_incidents')
        .select('*, project:projects(*), reporter:profiles!reported_by(*), investigator:profiles!assigned_investigator(*)')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching incident:', error);
        toast.error('Failed to load incident');
        navigate('/safety/incidents');
        return;
      }

      if (data) {
        setIncident(data as SafetyIncident);
      }
      setLoading(false);
    };

    fetchIncident();
  }, [id, navigate]);

  if (loading || !incident) {
    return (
      <div className="min-h-screen w-full bg-background p-6">
        <Skeleton className="h-12 w-64 mb-6 bg-muted" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 bg-muted" />
          <Skeleton className="h-32 bg-muted" />
          <Skeleton className="h-32 bg-muted" />
        </div>
      </div>
    );
  }

  const completedActions = actions.filter(a => a.is_completed).length;
  const overdueActions = actions.filter(a => !a.is_completed && new Date(a.due_date) < new Date()).length;

  return (
    <div className="min-h-screen w-full bg-background">
      <PageHeader
        title={`Incident ${incident.incident_number}`}
        description={`${incident.incident_type.replace('_', ' ')} - ${incident.severity} severity`}
        actions={
          <Button variant="outline" onClick={() => navigate('/safety/incidents')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Incidents
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Incident Details */}
        <Card>
          <CardHeader>
            <CardTitle>Incident Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Date & Time</p>
                <p className="font-medium mt-1">{format(new Date(incident.incident_date), 'MMM d, yyyy HH:mm')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium mt-1">{incident.location}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Project</p>
                <p className="font-medium mt-1">{incident.project?.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reported By</p>
                <p className="font-medium mt-1">{incident.reporter?.full_name || '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="font-medium mt-1">{incident.description}</p>
              </div>
              {incident.immediate_action && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Immediate Action</p>
                  <p className="font-medium mt-1">{incident.immediate_action}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Investigations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Investigations</CardTitle>
            <Dialog open={investigationDialogOpen} onOpenChange={setInvestigationDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Investigation
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Investigation</DialogTitle>
                </DialogHeader>
                <AddInvestigationForm
                  firmId={profile?.firm_id!}
                  incidentId={incident.id}
                  userId={profile?.id!}
                  onSuccess={() => {
                    setInvestigationDialogOpen(false);
                    toast.success('Investigation added successfully');
                  }}
                />
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {investigations.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No investigations recorded yet</p>
            ) : (
              <div className="space-y-4">
                {investigations.map((inv) => (
                  <div key={inv.id} className="border border-border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm font-medium">Investigation Date: {format(new Date(inv.investigation_date), 'MMM d, yyyy')}</p>
                      <p className="text-sm text-muted-foreground">By: {inv.investigator?.full_name || '-'}</p>
                    </div>
                    <div className="space-y-2">
                      {inv.root_cause && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Root Cause:</p>
                          <p className="text-sm">{inv.root_cause}</p>
                        </div>
                      )}
                      {inv.contributing_factors && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Contributing Factors:</p>
                          <p className="text-sm">{inv.contributing_factors}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Findings:</p>
                        <p className="text-sm">{inv.findings}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Corrective Actions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Corrective Actions ({completedActions}/{actions.length} completed)</CardTitle>
            <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Action
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Corrective Action</DialogTitle>
                </DialogHeader>
                <AddCorrectiveActionForm
                  firmId={profile?.firm_id!}
                  incidentId={incident.id}
                  onSuccess={() => {
                    setActionDialogOpen(false);
                    toast.success('Corrective action added successfully');
                  }}
                />
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {actions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No corrective actions defined yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="text-left p-2 font-medium text-sm">Action</th>
                      <th className="text-left p-2 font-medium text-sm">Assigned To</th>
                      <th className="text-left p-2 font-medium text-sm">Due Date</th>
                      <th className="text-left p-2 font-medium text-sm">Status</th>
                      <th className="text-left p-2 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actions.map((action) => (
                      <tr key={action.id} className="border-b border-border">
                        <td className="p-2 text-sm">{action.action_description}</td>
                        <td className="p-2 text-sm">{action.assignee?.full_name || '-'}</td>
                        <td className="p-2 text-sm">
                          {format(new Date(action.due_date), 'MMM d, yyyy')}
                          {!action.is_completed && new Date(action.due_date) < new Date() && (
                            <Badge variant="destructive" className="ml-2">Overdue</Badge>
                          )}
                        </td>
                        <td className="p-2 text-sm">
                          <Badge variant={action.is_completed ? 'default' : 'secondary'}>
                            {action.is_completed ? 'Completed' : 'Pending'}
                          </Badge>
                        </td>
                        <td className="p-2 text-sm">
                          {!action.is_completed && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={async () => {
                                try {
                                  await updateCorrectiveAction(action.id, {
                                    is_completed: true,
                                    completed_date: format(new Date(), 'yyyy-MM-dd'),
                                  });
                                  toast.success('Action marked as completed');
                                } catch (error) {
                                  console.error('Error updating action:', error);
                                  toast.error('Failed to update action');
                                }
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Complete
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface AddInvestigationFormProps {
  firmId: string;
  incidentId: string;
  userId: string;
  onSuccess: () => void;
}

function AddInvestigationForm({ firmId, incidentId, userId, onSuccess }: AddInvestigationFormProps) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      investigation_date: format(new Date(), 'yyyy-MM-dd'),
      root_cause: '',
      contributing_factors: '',
      findings: '',
    },
  });

  const onSubmit = async (values: typeof form.formState.defaultValues) => {
    if (!values || !values.findings || !values.investigation_date) return;
    setSubmitting(true);
    try {
      await createIncidentInvestigation({
        firm_id: firmId,
        incident_id: incidentId,
        investigator_id: userId,
        root_cause: values.root_cause || null,
        contributing_factors: values.contributing_factors || null,
        findings: values.findings,
        investigation_date: values.investigation_date,
      });
      onSuccess();
    } catch (error) {
      console.error('Error creating investigation:', error);
      toast.error('Failed to add investigation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="investigation_date"
          rules={{ required: 'Investigation date is required' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Investigation Date *</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="root_cause"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Root Cause</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Identify the root cause" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contributing_factors"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contributing Factors</FormLabel>
              <FormControl>
                <Input {...field} placeholder="List contributing factors" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="findings"
          rules={{ required: 'Findings are required' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Findings *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Document investigation findings" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Adding...' : 'Add Investigation'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

interface AddCorrectiveActionFormProps {
  firmId: string;
  incidentId: string;
  onSuccess: () => void;
}

function AddCorrectiveActionForm({ firmId, incidentId, onSuccess }: AddCorrectiveActionFormProps) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      action_description: '',
      due_date: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    },
  });

  const onSubmit = async (values: typeof form.formState.defaultValues) => {
    if (!values || !values.action_description || !values.due_date) return;
    setSubmitting(true);
    try {
      await createCorrectiveAction({
        firm_id: firmId,
        incident_id: incidentId,
        action_description: values.action_description,
        assigned_to: null,
        due_date: values.due_date,
        completed_date: null,
        is_completed: false,
        notes: null,
      });
      onSuccess();
    } catch (error) {
      console.error('Error creating corrective action:', error);
      toast.error('Failed to add corrective action');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="action_description"
          rules={{ required: 'Action description is required' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Action Description *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Describe the corrective action" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="due_date"
          rules={{ required: 'Due date is required' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Due Date *</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Adding...' : 'Add Action'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
