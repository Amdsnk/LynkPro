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
import { useRealtimeEquipment, createEquipment } from '@/hooks/useEquipment';
import type { Equipment, EquipmentStatus } from '@/types/types';
import { Wrench, Search, CheckCircle, Clock, AlertTriangle, XCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';

export default function EquipmentListPage() {
  const { profile } = useAuth();
  const { equipment, loading } = useRealtimeEquipment(profile?.firm_id);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | 'all'>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const filteredEquipment = equipment.filter((e) => {
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         e.equipment_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         e.model?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const availableCount = equipment.filter(e => e.status === 'available').length;
  const inUseCount = equipment.filter(e => e.status === 'in_use').length;
  const maintenanceCount = equipment.filter(e => e.status === 'maintenance').length;
  const totalValue = equipment.reduce((sum, e) => sum + (e.purchase_cost || 0), 0);

  const getStatusBadge = (status: EquipmentStatus) => {
    switch (status) {
      case 'available':
        return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" />Available</Badge>;
      case 'in_use':
        return <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"><Clock className="h-3 w-3" />In Use</Badge>;
      case 'maintenance':
        return <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><AlertTriangle className="h-3 w-3" />Maintenance</Badge>;
      case 'out_of_service':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Out of Service</Badge>;
    }
  };

  return (
    <div className="min-h-screen w-full bg-background">
      <PageHeader
        title="Equipment Management"
        description="Track equipment, log usage, and schedule maintenance"
        actions={
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Equipment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Equipment</DialogTitle>
              </DialogHeader>
              <CreateEquipmentForm
                firmId={profile?.firm_id!}
                onSuccess={() => {
                  setCreateDialogOpen(false);
                  toast.success('Equipment added successfully');
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
                  <p className="text-sm text-muted-foreground">Total Equipment</p>
                  <p className="text-2xl font-semibold mt-1">{equipment.length}</p>
                </div>
                <Wrench className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Available</p>
                  <p className="text-2xl font-semibold mt-1 text-green-600">{availableCount}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Use</p>
                  <p className="text-2xl font-semibold mt-1 text-blue-600">{inUseCount}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Maintenance</p>
                  <p className="text-2xl font-semibold mt-1 text-yellow-600">{maintenanceCount}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
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
                  placeholder="Search equipment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as EquipmentStatus | 'all')}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="in_use">In Use</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="out_of_service">Out of Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Equipment Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full bg-muted" />
                ))}
              </div>
            ) : filteredEquipment.length === 0 ? (
              <div className="p-12 text-center">
                <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No equipment found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Add your first equipment to start tracking'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border bg-muted/30">
                    <tr>
                      <th className="text-left p-4 font-medium">Equipment Name</th>
                      <th className="text-left p-4 font-medium">Type</th>
                      <th className="text-left p-4 font-medium">Model</th>
                      <th className="text-left p-4 font-medium">Serial Number</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Current Location</th>
                      <th className="text-left p-4 font-medium">Current Project</th>
                      <th className="text-right p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEquipment.map((equip) => (
                      <tr key={equip.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="p-4">
                          <p className="font-medium">{equip.name}</p>
                          {equip.notes && (
                            <p className="text-sm text-muted-foreground">{equip.notes}</p>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="text-sm">{equip.equipment_type}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">{equip.model || '-'}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm font-mono">{equip.serial_number || '-'}</span>
                        </td>
                        <td className="p-4">
                          {getStatusBadge(equip.status)}
                        </td>
                        <td className="p-4">
                          <span className="text-sm">{equip.current_location || '-'}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">{equip.current_project?.name || '-'}</span>
                        </td>
                        <td className="p-4 text-right">
                          <Link to={`/equipment/${equip.id}`}>
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

interface CreateEquipmentFormProps {
  firmId: string;
  onSuccess: () => void;
}

function CreateEquipmentForm({ firmId, onSuccess }: CreateEquipmentFormProps) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      name: '',
      equipment_type: '',
      model: '',
      serial_number: '',
      purchase_date: '',
      purchase_cost: 0,
      current_location: '',
      notes: '',
    },
  });

  const onSubmit = async (values: typeof form.formState.defaultValues) => {
    if (!values || !values.name || !values.equipment_type) return;
    setSubmitting(true);
    try {
      await createEquipment({
        firm_id: firmId,
        name: values.name,
        equipment_type: values.equipment_type,
        model: values.model || null,
        serial_number: values.serial_number || null,
        purchase_date: values.purchase_date || null,
        purchase_cost: values.purchase_cost || null,
        status: 'available',
        current_location: values.current_location || null,
        current_project_id: null,
        notes: values.notes || null,
      });
      onSuccess();
    } catch (error) {
      console.error('Error creating equipment:', error);
      toast.error('Failed to create equipment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            rules={{ required: 'Equipment name is required' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Equipment Name *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., Excavator, Crane" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="equipment_type"
            rules={{ required: 'Equipment type is required' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., Heavy Machinery, Tool" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Model</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Optional" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="serial_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Serial Number</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Optional" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="purchase_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="purchase_cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase Cost ($)</FormLabel>
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
          name="current_location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Location</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g., Warehouse, Site A" />
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
            {submitting ? 'Creating...' : 'Create Equipment'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
