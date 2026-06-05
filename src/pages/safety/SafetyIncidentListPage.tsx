import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRealtimeSafetyIncidents, createSafetyIncident } from '@/hooks/useSafetyIncidents';
import { useRealtimeProjects } from '@/hooks/useRealtimeData';
import type { SafetyIncident, IncidentType, IncidentSeverity, InvestigationStatus } from '@/types/types';
import { Shield, Search, AlertTriangle, AlertCircle, XCircle, CheckCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';

export default function SafetyIncidentListPage() {
  const { profile } = useAuth();
  const { incidents, loading } = useRealtimeSafetyIncidents(profile?.firm_id);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<IncidentSeverity | 'all'>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const filteredIncidents = incidents.filter((i) => {
    const matchesSearch = i.incident_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         i.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         i.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || i.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const criticalCount = incidents.filter(i => i.severity === 'critical').length;
  const highCount = incidents.filter(i => i.severity === 'high').length;
  const pendingInvestigations = incidents.filter(i => i.investigation_status === 'pending').length;
  const totalIncidents = incidents.length;

  const getSeverityBadge = (severity: IncidentSeverity) => {
    switch (severity) {
      case 'low':
        return <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="h-3 w-3" />Low</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><AlertCircle className="h-3 w-3" />Medium</Badge>;
      case 'high':
        return <Badge variant="secondary" className="gap-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"><AlertTriangle className="h-3 w-3" />High</Badge>;
      case 'critical':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Critical</Badge>;
    }
  };

  const getStatusBadge = (status: InvestigationStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">In Progress</Badge>;
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'closed':
        return <Badge variant="secondary">Closed</Badge>;
    }
  };

  return (
    <div className="min-h-screen w-full bg-background">
      <PageHeader
        title="Safety Incident Reporting"
        description="Track incidents, manage investigations, and ensure compliance"
        actions={
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Report Incident
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Report Safety Incident</DialogTitle>
              </DialogHeader>
              <CreateIncidentForm
                firmId={profile?.firm_id!}
                userId={profile?.id!}
                onSuccess={() => {
                  setCreateDialogOpen(false);
                  toast.success('Incident reported successfully');
                }}
              />
            </DialogContent>
          </Dialog>
        }
      />

      <div className="p-6 space-y-6">
        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Incidents</p>
                  <p className="text-2xl font-semibold mt-1">{totalIncidents}</p>
                </div>
                <Shield className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Critical Incidents</p>
                  <p className="text-2xl font-semibold mt-1 text-destructive">{criticalCount}</p>
                </div>
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">High Severity</p>
                  <p className="text-2xl font-semibold mt-1 text-orange-600">{highCount}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Investigations</p>
                  <p className="text-2xl font-semibold mt-1 text-yellow-600">{pendingInvestigations}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search incidents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={severityFilter} onValueChange={(value) => setSeverityFilter(value as IncidentSeverity | 'all')}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Incidents Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full bg-muted" />
                ))}
              </div>
            ) : filteredIncidents.length === 0 ? (
              <div className="p-12 text-center">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No incidents found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchTerm || severityFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'No safety incidents reported yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border bg-muted/30">
                    <tr>
                      <th className="text-left p-4 font-medium">Incident #</th>
                      <th className="text-left p-4 font-medium">Date</th>
                      <th className="text-left p-4 font-medium">Type</th>
                      <th className="text-left p-4 font-medium">Severity</th>
                      <th className="text-left p-4 font-medium">Location</th>
                      <th className="text-left p-4 font-medium">Project</th>
                      <th className="text-left p-4 font-medium">Investigation Status</th>
                      <th className="text-right p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIncidents.map((incident) => (
                      <tr key={incident.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="p-4">
                          <p className="font-medium font-mono">{incident.incident_number}</p>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">{format(new Date(incident.incident_date), 'MMM d, yyyy')}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm capitalize">{incident.incident_type.replace('_', ' ')}</span>
                        </td>
                        <td className="p-4">
                          {getSeverityBadge(incident.severity)}
                        </td>
                        <td className="p-4">
                          <span className="text-sm">{incident.location}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">{incident.project?.name || '-'}</span>
                        </td>
                        <td className="p-4">
                          {getStatusBadge(incident.investigation_status)}
                        </td>
                        <td className="p-4 text-right">
                          <Link to={`/safety/incidents/${incident.id}`}>
                            <Button variant="ghost" size="sm">
                              View Details
                            </Button>
                          </Link>
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

interface CreateIncidentFormProps {
  firmId: string;
  userId: string;
  onSuccess: () => void;
}

function CreateIncidentForm({ firmId, userId, onSuccess }: CreateIncidentFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const { projects } = useRealtimeProjects(firmId);

  const form = useForm({
    defaultValues: {
      project_id: '',
      incident_type: 'injury' as IncidentType,
      severity: 'medium' as IncidentSeverity,
      incident_date: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
      location: '',
      description: '',
      immediate_action: '',
    },
  });

  const onSubmit = async (values: typeof form.formState.defaultValues) => {
    if (!values || !values.project_id || !values.description || !values.location || !values.incident_type || !values.severity || !values.incident_date) return;
    setSubmitting(true);
    try {
      await createSafetyIncident({
        firm_id: firmId,
        project_id: values.project_id,
        incident_type: values.incident_type,
        severity: values.severity,
        incident_date: values.incident_date,
        location: values.location,
        description: values.description,
        immediate_action: values.immediate_action || null,
        photos: [],
        reported_by: userId,
        investigation_status: 'pending',
        assigned_investigator: null,
      });
      onSuccess();
    } catch (error) {
      console.error('Error creating incident:', error);
      toast.error('Failed to report incident');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="project_id"
          rules={{ required: 'Project is required' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="incident_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Incident Type *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="injury">Injury</SelectItem>
                    <SelectItem value="near_miss">Near Miss</SelectItem>
                    <SelectItem value="property_damage">Property Damage</SelectItem>
                    <SelectItem value="environmental">Environmental</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="severity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Severity *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="incident_date"
            rules={{ required: 'Incident date is required' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Incident Date & Time *</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            rules={{ required: 'Location is required' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., Building A, Floor 3" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          rules={{ required: 'Description is required' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Describe what happened" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="immediate_action"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Immediate Action Taken</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Describe immediate response" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Reporting...' : 'Report Incident'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
