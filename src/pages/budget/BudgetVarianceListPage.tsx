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
import { useBudgetVariance, createBudgetCategory } from '@/hooks/useBudgetVariance';
import { useRealtimeProjects } from '@/hooks/useRealtimeData';
import { DollarSign, Search, TrendingUp, TrendingDown, AlertTriangle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';

export default function BudgetVarianceListPage() {
  const { profile } = useAuth();
  const { varianceData } = useBudgetVariance(profile?.firm_id);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'under_budget' | 'over_budget'>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const filteredData = varianceData.filter((item) => {
    const matchesSearch = item.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalBudget = varianceData.reduce((sum, item) => sum + item.budgeted_amount, 0);
  const totalActual = varianceData.reduce((sum, item) => sum + item.total_actual, 0);
  const totalVariance = totalBudget - totalActual;
  const overBudgetCount = varianceData.filter(item => item.status === 'over_budget').length;

  const getVarianceBadge = (status: string, variance: number) => {
    if (status === 'under_budget') {
      return <Badge variant="default" className="gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><TrendingDown className="h-3 w-3" />Under Budget</Badge>;
    } else {
      return <Badge variant="destructive" className="gap-1"><TrendingUp className="h-3 w-3" />Over Budget</Badge>;
    }
  };

  return (
    <div className="min-h-screen w-full bg-background">
      <PageHeader
        title="Budget Variance Tracking"
        description="Monitor budget performance and track cost variances"
        actions={
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Budget Category
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Budget Category</DialogTitle>
              </DialogHeader>
              <CreateBudgetCategoryForm
                firmId={profile?.firm_id!}
                onSuccess={() => {
                  setCreateDialogOpen(false);
                  toast.success('Budget category added successfully');
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
                  <p className="text-sm text-muted-foreground">Total Budget</p>
                  <p className="text-2xl font-semibold mt-1">${totalBudget.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Actual</p>
                  <p className="text-2xl font-semibold mt-1">${totalActual.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Variance</p>
                  <p className={`text-2xl font-semibold mt-1 ${totalVariance >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                    ${Math.abs(totalVariance).toLocaleString()}
                  </p>
                </div>
                {totalVariance >= 0 ? (
                  <TrendingDown className="h-8 w-8 text-green-600" />
                ) : (
                  <TrendingUp className="h-8 w-8 text-destructive" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Over Budget</p>
                  <p className="text-2xl font-semibold mt-1 text-destructive">{overBudgetCount}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-destructive" />
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
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | 'under_budget' | 'over_budget')}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="under_budget">Under Budget</SelectItem>
                  <SelectItem value="over_budget">Over Budget</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Budget Categories Table */}
        <Card>
          <CardContent className="p-0">
            {filteredData.length === 0 ? (
              <div className="p-12 text-center">
                <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No budget categories found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Add your first budget category to start tracking'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border bg-muted/30">
                    <tr>
                      <th className="text-left p-4 font-medium">Category Name</th>
                      <th className="text-left p-4 font-medium">Project</th>
                      <th className="text-right p-4 font-medium">Budgeted Amount</th>
                      <th className="text-right p-4 font-medium">Actual Cost</th>
                      <th className="text-right p-4 font-medium">Variance</th>
                      <th className="text-right p-4 font-medium">Variance %</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-right p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((item) => (
                      <tr key={item.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="p-4">
                          <p className="font-medium">{item.category_name}</p>
                          {item.description && (
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="text-sm">{item.project?.name || '-'}</span>
                        </td>
                        <td className="p-4 text-right">
                          <span className="font-medium">${item.budgeted_amount.toLocaleString()}</span>
                        </td>
                        <td className="p-4 text-right">
                          <span className="font-medium">${item.total_actual.toLocaleString()}</span>
                        </td>
                        <td className="p-4 text-right">
                          <span className={`font-medium ${item.variance >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                            ${Math.abs(item.variance).toLocaleString()}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <span className={`font-medium ${item.variance_percent >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                            {item.variance_percent.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-4">
                          {getVarianceBadge(item.status, item.variance)}
                        </td>
                        <td className="p-4 text-right">
                          <Link to={`/budget/variance/${item.id}`}>
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

interface CreateBudgetCategoryFormProps {
  firmId: string;
  onSuccess: () => void;
}

function CreateBudgetCategoryForm({ firmId, onSuccess }: CreateBudgetCategoryFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const { projects } = useRealtimeProjects(firmId);

  const form = useForm<{
    name: string;
    category_type: 'labor' | 'materials' | 'equipment' | 'subcontractor' | 'overhead' | 'other';
    description: string;
    project_id: string;
    budgeted_amount: number;
  }>({
    defaultValues: {
      name: '',
      category_type: 'labor',
      description: '',
      project_id: '',
      budgeted_amount: 0,
    },
  });

  const onSubmit = async (values: typeof form.formState.defaultValues) => {
    if (!values || !values.name || !values.project_id) return;
    setSubmitting(true);
    try {
      await createBudgetCategory({
        firm_id: firmId,
        project_id: values.project_id,
        name: values.name,
        category_type: values.category_type,
        description: values.description || null,
        budgeted_amount: values.budgeted_amount ?? 0,
      });
      onSuccess();
    } catch (error) {
      console.error('Error creating budget category:', error);
      toast.error('Failed to create budget category');
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

        <FormField
          control={form.control}
          name="name"
          rules={{ required: 'Category name is required' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Name *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g., Labor Costs, Construction Materials" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category_type"
          rules={{ required: 'Category type is required' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Type *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="labor">Labor</SelectItem>
                  <SelectItem value="materials">Materials</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="subcontractor">Subcontractor</SelectItem>
                  <SelectItem value="overhead">Overhead</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

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

        <FormField
          control={form.control}
          name="budgeted_amount"
          rules={{ required: 'Budgeted amount is required', min: { value: 0, message: 'Amount must be positive' } }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Budgeted Amount ($) *</FormLabel>
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
            {submitting ? 'Creating...' : 'Create Category'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
