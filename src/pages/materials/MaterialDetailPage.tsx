import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMaterialDeliveries, useMaterialConsumption, createMaterialDelivery, createMaterialConsumption } from '@/hooks/useMaterials';
import { useRealtimeProjects } from '@/hooks/useRealtimeData';
import { supabase } from '@/db/supabase';
import type { Material } from '@/types/types';
import { Package, TrendingUp, TrendingDown, Calendar, User, ArrowLeft, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';

export default function MaterialDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const { deliveries, loading: deliveriesLoading } = useMaterialDeliveries(profile?.firm_id, id);
  const { consumption, loading: consumptionLoading } = useMaterialConsumption(profile?.firm_id, id);
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  const [consumptionDialogOpen, setConsumptionDialogOpen] = useState(false);

  useEffect(() => {
    const fetchMaterial = async () => {
      if (!id) return;
      
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching material:', error);
        toast.error('Failed to load material');
        navigate('/materials');
        return;
      }

      if (data) {
        setMaterial(data as Material);
      }
      setLoading(false);
    };

    fetchMaterial();
  }, [id, navigate]);

  if (loading) {
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

  if (!material) {
    return null;
  }

  const totalDelivered = deliveries.reduce((sum, d) => sum + d.quantity, 0);
  const totalConsumed = consumption.reduce((sum, c) => sum + c.quantity, 0);
  const totalValue = material.current_quantity * (material.unit_cost || 0);

  return (
    <div className="min-h-screen w-full bg-background">
      <PageHeader
        title={material.name}
        description={material.description || 'Material details and history'}
        actions={
          <Button variant="outline" onClick={() => navigate('/materials')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Materials
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Material Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Stock</p>
                  <p className="text-2xl font-semibold mt-1">{material.current_quantity} {material.unit}</p>
                </div>
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Delivered</p>
                  <p className="text-2xl font-semibold mt-1 text-green-600">{totalDelivered} {material.unit}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Consumed</p>
                  <p className="text-2xl font-semibold mt-1 text-orange-600">{totalConsumed} {material.unit}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-semibold mt-1">${totalValue.toFixed(2)}</p>
                </div>
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Material Details */}
        <Card>
          <CardHeader>
            <CardTitle>Material Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Unit</p>
                <p className="font-medium mt-1">{material.unit}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Min Quantity</p>
                <p className="font-medium mt-1">{material.min_quantity} {material.unit}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unit Cost</p>
                <p className="font-medium mt-1">{material.unit_cost ? `$${material.unit_cost.toFixed(2)}` : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className="mt-1" variant={material.status === 'in_stock' ? 'default' : 'secondary'}>
                  {material.status.replace('_', ' ')}
                </Badge>
              </div>
              {material.supplier_name && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Supplier</p>
                    <p className="font-medium mt-1">{material.supplier_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Supplier Contact</p>
                    <p className="font-medium mt-1">{material.supplier_contact || '-'}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Delivery History */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Delivery History</CardTitle>
            <Dialog open={deliveryDialogOpen} onOpenChange={setDeliveryDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Log Delivery
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Log Material Delivery</DialogTitle>
                </DialogHeader>
                <LogDeliveryForm
                  firmId={profile?.firm_id!}
                  materialId={material.id}
                  materialName={material.name}
                  onSuccess={() => {
                    setDeliveryDialogOpen(false);
                    toast.success('Delivery logged successfully');
                  }}
                />
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {deliveriesLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full bg-muted" />
                ))}
              </div>
            ) : deliveries.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No deliveries recorded yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="text-left p-2 font-medium text-sm">Date</th>
                      <th className="text-left p-2 font-medium text-sm">Supplier</th>
                      <th className="text-left p-2 font-medium text-sm">Quantity</th>
                      <th className="text-left p-2 font-medium text-sm">Unit Cost</th>
                      <th className="text-left p-2 font-medium text-sm">Total Cost</th>
                      <th className="text-left p-2 font-medium text-sm">Project</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.map((delivery) => (
                      <tr key={delivery.id} className="border-b border-border">
                        <td className="p-2 text-sm">{format(new Date(delivery.delivery_date), 'MMM d, yyyy')}</td>
                        <td className="p-2 text-sm">{delivery.supplier_name}</td>
                        <td className="p-2 text-sm font-medium">{delivery.quantity} {material.unit}</td>
                        <td className="p-2 text-sm">{delivery.unit_cost ? `$${delivery.unit_cost.toFixed(2)}` : '-'}</td>
                        <td className="p-2 text-sm font-medium">{delivery.total_cost ? `$${delivery.total_cost.toFixed(2)}` : '-'}</td>
                        <td className="p-2 text-sm">{delivery.project?.name || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Consumption History */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Consumption History</CardTitle>
            <Dialog open={consumptionDialogOpen} onOpenChange={setConsumptionDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Log Consumption
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Log Material Consumption</DialogTitle>
                </DialogHeader>
                <LogConsumptionForm
                  firmId={profile?.firm_id!}
                  materialId={material.id}
                  materialName={material.name}
                  userId={profile?.id!}
                  onSuccess={() => {
                    setConsumptionDialogOpen(false);
                    toast.success('Consumption logged successfully');
                  }}
                />
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {consumptionLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full bg-muted" />
                ))}
              </div>
            ) : consumption.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No consumption recorded yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="text-left p-2 font-medium text-sm">Date</th>
                      <th className="text-left p-2 font-medium text-sm">Project</th>
                      <th className="text-left p-2 font-medium text-sm">Quantity</th>
                      <th className="text-left p-2 font-medium text-sm">Activity</th>
                      <th className="text-left p-2 font-medium text-sm">Consumed By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consumption.map((record) => (
                      <tr key={record.id} className="border-b border-border">
                        <td className="p-2 text-sm">{format(new Date(record.consumed_date), 'MMM d, yyyy')}</td>
                        <td className="p-2 text-sm">{record.project?.name || '-'}</td>
                        <td className="p-2 text-sm font-medium">{record.quantity} {material.unit}</td>
                        <td className="p-2 text-sm">{record.activity || '-'}</td>
                        <td className="p-2 text-sm">{record.consumer?.full_name || '-'}</td>
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

interface LogDeliveryFormProps {
  firmId: string;
  materialId: string;
  materialName: string;
  onSuccess: () => void;
}

function LogDeliveryForm({ firmId, materialId, materialName, onSuccess }: LogDeliveryFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const { projects } = useRealtimeProjects(firmId);

  const form = useForm({
    defaultValues: {
      supplier_name: '',
      quantity: 0,
      unit_cost: 0,
      delivery_date: format(new Date(), 'yyyy-MM-dd'),
      project_id: '',
      notes: '',
    },
  });

  const onSubmit = async (values: typeof form.formState.defaultValues) => {
    if (!values || !values.supplier_name || !values.delivery_date) return;
    setSubmitting(true);
    try {
      await createMaterialDelivery({
        firm_id: firmId,
        material_id: materialId,
        supplier_name: values.supplier_name,
        quantity: values.quantity ?? 0,
        unit_cost: values.unit_cost || null,
        delivery_date: values.delivery_date,
        project_id: (values.project_id && values.project_id !== 'none') ? values.project_id : null,
        received_by: null,
        notes: values.notes || null,
      });
      onSuccess();
    } catch (error) {
      console.error('Error logging delivery:', error);
      toast.error('Failed to log delivery');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium">Material: {materialName}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="supplier_name"
            rules={{ required: 'Supplier name is required' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier Name *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter supplier name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="delivery_date"
            rules={{ required: 'Delivery date is required' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Delivery Date *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            rules={{ required: 'Quantity is required', min: { value: 0.01, message: 'Quantity must be greater than 0' } }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity *</FormLabel>
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

          <FormField
            control={form.control}
            name="unit_cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit Cost ($)</FormLabel>
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
        </div>

        <FormField
          control={form.control}
          name="project_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project (Optional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">No Project</SelectItem>
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
            {submitting ? 'Logging...' : 'Log Delivery'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

interface LogConsumptionFormProps {
  firmId: string;
  materialId: string;
  materialName: string;
  userId: string;
  onSuccess: () => void;
}

function LogConsumptionForm({ firmId, materialId, materialName, userId, onSuccess }: LogConsumptionFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const { projects } = useRealtimeProjects(firmId);

  const form = useForm({
    defaultValues: {
      project_id: '',
      quantity: 0,
      consumed_date: format(new Date(), 'yyyy-MM-dd'),
      activity: '',
      notes: '',
    },
  });

  const onSubmit = async (values: typeof form.formState.defaultValues) => {
    if (!values || !values.project_id || !values.consumed_date) return;
    setSubmitting(true);
    try {
      await createMaterialConsumption({
        firm_id: firmId,
        material_id: materialId,
        project_id: values.project_id,
        quantity: values.quantity ?? 0,
        consumed_date: values.consumed_date,
        consumed_by: userId,
        activity: values.activity || null,
        notes: values.notes || null,
      });
      onSuccess();
    } catch (error) {
      console.error('Error logging consumption:', error);
      toast.error('Failed to log consumption');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium">Material: {materialName}</p>
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            rules={{ required: 'Quantity is required', min: { value: 0.01, message: 'Quantity must be greater than 0' } }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity *</FormLabel>
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

          <FormField
            control={form.control}
            name="consumed_date"
            rules={{ required: 'Consumption date is required' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Consumption Date *</FormLabel>
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
          name="activity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Activity</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g., Foundation work, Wall construction" />
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
            {submitting ? 'Logging...' : 'Log Consumption'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
