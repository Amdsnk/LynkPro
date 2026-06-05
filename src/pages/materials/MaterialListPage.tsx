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
import { useRealtimeMaterials, createMaterial } from '@/hooks/useMaterials';
import type { Material, MaterialUnit, MaterialStatus } from '@/types/types';
import { Plus, Search, Package, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';

export default function MaterialListPage() {
  const { profile } = useAuth();
  const { materials, loading } = useRealtimeMaterials(profile?.firm_id);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<MaterialStatus | 'all'>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const filteredMaterials = materials.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         m.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const lowStockCount = materials.filter(m => m.status === 'low_stock').length;
  const outOfStockCount = materials.filter(m => m.status === 'out_of_stock').length;
  const totalValue = materials.reduce((sum, m) => sum + (m.current_quantity * (m.unit_cost || 0)), 0);

  const getStatusBadge = (status: MaterialStatus) => {
    switch (status) {
      case 'in_stock':
        return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" />In Stock</Badge>;
      case 'low_stock':
        return <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><AlertTriangle className="h-3 w-3" />Low Stock</Badge>;
      case 'out_of_stock':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Out of Stock</Badge>;
      case 'on_order':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />On Order</Badge>;
    }
  };

  return (
    <div className="min-h-screen w-full bg-background">
      <PageHeader
        title="Material Tracking"
        description="Manage inventory, track deliveries, and monitor consumption"
        actions={
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Material
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Material</DialogTitle>
              </DialogHeader>
              <CreateMaterialForm
                firmId={profile?.firm_id!}
                onSuccess={() => {
                  setCreateDialogOpen(false);
                  toast.success('Material added successfully');
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
                  <p className="text-sm text-muted-foreground">Total Materials</p>
                  <p className="text-2xl font-semibold mt-1">{materials.length}</p>
                </div>
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Low Stock Alerts</p>
                  <p className="text-2xl font-semibold mt-1 text-yellow-600">{lowStockCount}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Out of Stock</p>
                  <p className="text-2xl font-semibold mt-1 text-destructive">{outOfStockCount}</p>
                </div>
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-semibold mt-1">${totalValue.toLocaleString()}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-muted-foreground" />
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
                  placeholder="Search materials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as MaterialStatus | 'all')}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  <SelectItem value="on_order">On Order</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Materials Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full bg-muted" />
                ))}
              </div>
            ) : filteredMaterials.length === 0 ? (
              <div className="p-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No materials found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Add your first material to start tracking inventory'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border bg-muted/30">
                    <tr>
                      <th className="text-left p-4 font-medium">Material Name</th>
                      <th className="text-left p-4 font-medium">Current Quantity</th>
                      <th className="text-left p-4 font-medium">Min Quantity</th>
                      <th className="text-left p-4 font-medium">Unit Cost</th>
                      <th className="text-left p-4 font-medium">Total Value</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Supplier</th>
                      <th className="text-right p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMaterials.map((material) => (
                      <tr key={material.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{material.name}</p>
                            {material.description && (
                              <p className="text-sm text-muted-foreground">{material.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-medium">{material.current_quantity} {material.unit}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-muted-foreground">{material.min_quantity} {material.unit}</span>
                        </td>
                        <td className="p-4">
                          {material.unit_cost ? `$${material.unit_cost.toFixed(2)}` : '-'}
                        </td>
                        <td className="p-4">
                          <span className="font-medium">
                            ${(material.current_quantity * (material.unit_cost || 0)).toFixed(2)}
                          </span>
                        </td>
                        <td className="p-4">
                          {getStatusBadge(material.status)}
                        </td>
                        <td className="p-4">
                          <span className="text-sm">{material.supplier_name || '-'}</span>
                        </td>
                        <td className="p-4 text-right">
                          <Link to={`/materials/${material.id}`}>
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

interface CreateMaterialFormProps {
  firmId: string;
  onSuccess: () => void;
}

function CreateMaterialForm({ firmId, onSuccess }: CreateMaterialFormProps) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
      unit: 'piece' as MaterialUnit,
      current_quantity: 0,
      min_quantity: 0,
      unit_cost: 0,
      supplier_name: '',
      supplier_contact: '',
    },
  });

  const onSubmit = async (values: typeof form.formState.defaultValues) => {
    if (!values || !values.name || !values.unit) return;
    setSubmitting(true);
    try {
      await createMaterial({
        firm_id: firmId,
        name: values.name,
        description: values.description || null,
        unit: values.unit,
        current_quantity: values.current_quantity ?? 0,
        min_quantity: values.min_quantity ?? 0,
        unit_cost: values.unit_cost || null,
        status: 'in_stock',
        supplier_name: values.supplier_name || null,
        supplier_contact: values.supplier_contact || null,
      });
      onSuccess();
    } catch (error) {
      console.error('Error creating material:', error);
      toast.error('Failed to create material');
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
            rules={{ required: 'Material name is required' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Material Name *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., Concrete, Steel Rebar" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="kg">Kilogram (kg)</SelectItem>
                    <SelectItem value="ton">Ton</SelectItem>
                    <SelectItem value="liter">Liter</SelectItem>
                    <SelectItem value="m3">Cubic Meter (m³)</SelectItem>
                    <SelectItem value="piece">Piece</SelectItem>
                    <SelectItem value="box">Box</SelectItem>
                    <SelectItem value="bag">Bag</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Optional description" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="current_quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Quantity *</FormLabel>
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
            name="min_quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Min Quantity *</FormLabel>
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="supplier_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Optional" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="supplier_contact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier Contact</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Phone or email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Material'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
