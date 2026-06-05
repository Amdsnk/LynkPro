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
import { useEquipmentUsage, useEquipmentMaintenance, createEquipmentUsage, createEquipmentMaintenance, updateEquipmentUsage } from '@/hooks/useEquipment';
import { useRealtimeProjects } from '@/hooks/useRealtimeData';
import { supabase } from '@/db/supabase';
import type { Equipment } from '@/types/types';
import { Wrench, ArrowLeft, Plus, Clock, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';

export default function EquipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const { usage } = useEquipmentUsage(profile?.firm_id, id);
  const { maintenance } = useEquipmentMaintenance(profile?.firm_id, id);
  const [usageDialogOpen, setUsageDialogOpen] = useState(false);
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);

  useEffect(() => {
    const fetchEquipment = async () => {
      if (!id) return;
      
      const { data, error } = await supabase
        .from('equipment')
        .select('*, current_project:projects(*)')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching equipment:', error);
        toast.error('Failed to load equipment');
        navigate('/equipment');
        return;
      }

      if (data) {
        setEquipment(data as Equipment);
      }
      setLoading(false);
    };

    fetchEquipment();
  }, [id, navigate]);

  if (loading || !equipment) {
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

  const activeUsage = usage.find(u => !u.end_time);
  const totalHours = usage.reduce((sum, u) => sum + (u.duration_hours || 0), 0);
  const upcomingMaintenance = maintenance.filter(m => !m.is_completed).length;

  return (
    <div className="min-h-screen w-full bg-background">
      <PageHeader
        title={equipment.name}
        description={`${equipment.equipment_type} - ${equipment.model || 'No model'}`}
        actions={
          <Button variant="outline" onClick={() => navigate('/equipment')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Equipment
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Equipment Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className="mt-2">{equipment.status.replace('_', ' ')}</Badge>
                </div>
                <Wrench className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Usage Hours</p>
                  <p className="text-2xl font-semibold mt-1">{totalHours.toFixed(1)}h</p>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Upcoming Maintenance</p>
                  <p className="text-2xl font-semibold mt-1">{upcomingMaintenance}</p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Equipment Details */}
        <Card>
          <CardHeader>
            <CardTitle>Equipment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Serial Number</p>
                <p className="font-medium mt-1 font-mono">{equipment.serial_number || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Purchase Date</p>
                <p className="font-medium mt-1">{equipment.purchase_date ? format(new Date(equipment.purchase_date), 'MMM d, yyyy') : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Purchase Cost</p>
                <p className="font-medium mt-1">{equipment.purchase_cost ? `$${equipment.purchase_cost.toLocaleString()}` : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Location</p>
                <p className="font-medium mt-1">{equipment.current_location || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage History */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Usage History</CardTitle>
            <Dialog open={usageDialogOpen} onOpenChange={setUsageDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  {activeUsage ? 'End Usage' : 'Start Usage'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{activeUsage ? 'End Equipment Usage' : 'Start Equipment Usage'}</DialogTitle>
                </DialogHeader>
                {activeUsage ? (
                  <EndUsageForm
                    usageId={activeUsage.id}
                    equipmentName={equipment.name}
                    onSuccess={() => {
                      setUsageDialogOpen(false);
                      toast.success('Usage ended successfully');
                    }}
                  />
                ) : (
                  <StartUsageForm
                    firmId={profile?.firm_id!}
                    equipmentId={equipment.id}
                    equipmentName={equipment.name}
                    userId={profile?.id!}
                    onSuccess={() => {
                      setUsageDialogOpen(false);
                      toast.success('Usage started successfully');
                    }}
                  />
                )}
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {usage.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No usage recorded yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="text-left p-2 font-medium text-sm">Start Time</th>
                      <th className="text-left p-2 font-medium text-sm">End Time</th>
                      <th className="text-left p-2 font-medium text-sm">Duration</th>
                      <th className="text-left p-2 font-medium text-sm">Project</th>
                      <th className="text-left p-2 font-medium text-sm">Operator</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usage.map((u) => (
                      <tr key={u.id} className="border-b border-border">
                        <td className="p-2 text-sm">{format(new Date(u.start_time), 'MMM d, yyyy HH:mm')}</td>
                        <td className="p-2 text-sm">{u.end_time ? format(new Date(u.end_time), 'MMM d, yyyy HH:mm') : 'In Progress'}</td>
                        <td className="p-2 text-sm font-medium">{u.duration_hours ? `${u.duration_hours.toFixed(1)}h` : '-'}</td>
                        <td className="p-2 text-sm">{u.project?.name || '-'}</td>
                        <td className="p-2 text-sm">{u.operator?.full_name || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Maintenance Schedule */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Maintenance Schedule</CardTitle>
            <Dialog open={maintenanceDialogOpen} onOpenChange={setMaintenanceDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Maintenance
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Schedule Maintenance</DialogTitle>
                </DialogHeader>
                <ScheduleMaintenanceForm
                  firmId={profile?.firm_id!}
                  equipmentId={equipment.id}
                  equipmentName={equipment.name}
                  userId={profile?.id!}
                  onSuccess={() => {
                    setMaintenanceDialogOpen(false);
                    toast.success('Maintenance scheduled successfully');
                  }}
                />
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {maintenance.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No maintenance scheduled</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="text-left p-2 font-medium text-sm">Type</th>
                      <th className="text-left p-2 font-medium text-sm">Scheduled Date</th>
                      <th className="text-left p-2 font-medium text-sm">Completed Date</th>
                      <th className="text-left p-2 font-medium text-sm">Description</th>
                      <th className="text-left p-2 font-medium text-sm">Cost</th>
                      <th className="text-left p-2 font-medium text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenance.map((m) => (
                      <tr key={m.id} className="border-b border-border">
                        <td className="p-2 text-sm capitalize">{m.maintenance_type}</td>
                        <td className="p-2 text-sm">{format(new Date(m.scheduled_date), 'MMM d, yyyy')}</td>
                        <td className="p-2 text-sm">{m.completed_date ? format(new Date(m.completed_date), 'MMM d, yyyy') : '-'}</td>
                        <td className="p-2 text-sm">{m.description}</td>
                        <td className="p-2 text-sm">{m.cost ? `$${m.cost.toFixed(2)}` : '-'}</td>
                        <td className="p-2 text-sm">
                          <Badge variant={m.is_completed ? 'default' : 'secondary'}>
                            {m.is_completed ? 'Completed' : 'Pending'}
                          </Badge>
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

interface StartUsageFormProps {
  firmId: string;
  equipmentId: string;
  equipmentName: string;
  userId: string;
  onSuccess: () => void;
}

function StartUsageForm({ firmId, equipmentId, equipmentName, userId, onSuccess }: StartUsageFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const { projects } = useRealtimeProjects(firmId);

  const form = useForm({
    defaultValues: {
      project_id: '',
      notes: '',
    },
  });

  const onSubmit = async (values: typeof form.formState.defaultValues) => {
    if (!values || !values.project_id) return;
    setSubmitting(true);
    try {
      await createEquipmentUsage({
        firm_id: firmId,
        equipment_id: equipmentId,
        project_id: values.project_id,
        operator_id: userId,
        start_time: new Date().toISOString(),
        end_time: null,
        fuel_consumed: null,
        notes: values.notes || null,
      });
      onSuccess();
    } catch (error) {
      console.error('Error starting usage:', error);
      toast.error('Failed to start usage');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium">Equipment: {equipmentName}</p>
        </div>

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

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Optional notes" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Starting...' : 'Start Usage'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

interface EndUsageFormProps {
  usageId: string;
  equipmentName: string;
  onSuccess: () => void;
}

function EndUsageForm({ usageId, equipmentName, onSuccess }: EndUsageFormProps) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      fuel_consumed: 0,
      notes: '',
    },
  });

  const onSubmit = async (values: typeof form.formState.defaultValues) => {
    setSubmitting(true);
    try {
      await updateEquipmentUsage(usageId, {
        end_time: new Date().toISOString(),
        fuel_consumed: values?.fuel_consumed || null,
        notes: values?.notes || null,
      });
      onSuccess();
    } catch (error) {
      console.error('Error ending usage:', error);
      toast.error('Failed to end usage');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium">Equipment: {equipmentName}</p>
        </div>

        <FormField
          control={form.control}
          name="fuel_consumed"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fuel Consumed (liters)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.1"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Optional notes" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Ending...' : 'End Usage'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

interface ScheduleMaintenanceFormProps {
  firmId: string;
  equipmentId: string;
  equipmentName: string;
  userId: string;
  onSuccess: () => void;
}

function ScheduleMaintenanceForm({ firmId, equipmentId, equipmentName, userId, onSuccess }: ScheduleMaintenanceFormProps) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      maintenance_type: 'preventive' as 'preventive' | 'corrective' | 'inspection',
      scheduled_date: format(new Date(), 'yyyy-MM-dd'),
      description: '',
      cost: 0,
    },
  });

  const onSubmit = async (values: typeof form.formState.defaultValues) => {
    if (!values || !values.description || !values.maintenance_type || !values.scheduled_date) return;
    setSubmitting(true);
    try {
      await createEquipmentMaintenance({
        firm_id: firmId,
        equipment_id: equipmentId,
        maintenance_type: values.maintenance_type,
        scheduled_date: values.scheduled_date,
        completed_date: null,
        performed_by: userId,
        cost: values.cost || null,
        description: values.description,
        notes: null,
        is_completed: false,
      });
      onSuccess();
    } catch (error) {
      console.error('Error scheduling maintenance:', error);
      toast.error('Failed to schedule maintenance');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium">Equipment: {equipmentName}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="maintenance_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maintenance Type *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="preventive">Preventive</SelectItem>
                    <SelectItem value="corrective">Corrective</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="scheduled_date"
            rules={{ required: 'Scheduled date is required' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Scheduled Date *</FormLabel>
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
          name="description"
          rules={{ required: 'Description is required' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Describe the maintenance work" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estimated Cost ($)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Scheduling...' : 'Schedule Maintenance'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
