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
import { useActualCosts, createActualCost } from '@/hooks/useBudgetVariance';
import { supabase } from '@/db/supabase';
import type { CostCategory } from '@/types/types';
import { DollarSign, ArrowLeft, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';

export default function BudgetVarianceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [category, setCategory] = useState<CostCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const { costs } = useActualCosts(profile?.firm_id, id);
  const [costDialogOpen, setCostDialogOpen] = useState(false);

  useEffect(() => {
    const fetchCategory = async () => {
      if (!id) return;
      
      const { data, error } = await supabase
        .from('cost_categories')
        .select('*, project:projects(*)')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching budget category:', error);
        toast.error('Failed to load budget category');
        navigate('/budget/variance');
        return;
      }

      if (data) {
        setCategory(data as CostCategory);
      }
      setLoading(false);
    };

    fetchCategory();
  }, [id, navigate]);

  if (loading || !category) {
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

  const totalActual = costs.reduce((sum, c) => sum + Number(c.amount), 0);
  const variance = Number(category.budgeted_amount) - totalActual;
  const variancePercent = Number(category.budgeted_amount) > 0 ? (variance / Number(category.budgeted_amount)) * 100 : 0;

  return (
    <div className="min-h-screen w-full bg-background">
      <PageHeader
        title={category.name}
        description={category.description || 'Budget category details'}
        actions={
          <Button variant="outline" onClick={() => navigate('/budget/variance')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Budget
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Budget Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Budgeted Amount</p>
                  <p className="text-2xl font-semibold mt-1">${category.budgeted_amount.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Actual Cost</p>
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
                  <p className="text-sm text-muted-foreground">Variance</p>
                  <p className={`text-2xl font-semibold mt-1 ${variance >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                    ${Math.abs(variance).toLocaleString()} ({variancePercent.toFixed(1)}%)
                  </p>
                </div>
                {variance >= 0 ? (
                  <TrendingDown className="h-8 w-8 text-green-600" />
                ) : (
                  <TrendingUp className="h-8 w-8 text-destructive" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Details */}
        <Card>
          <CardHeader>
            <CardTitle>Category Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Project</p>
                <p className="font-medium mt-1">{category.project?.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={variance >= 0 ? 'default' : 'destructive'} className="mt-1">
                  {variance >= 0 ? 'Under Budget' : 'Over Budget'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Remaining Budget</p>
                <p className={`font-medium mt-1 ${variance >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                  ${Math.max(0, variance).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="font-medium mt-1">{costs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actual Costs History */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Actual Costs</CardTitle>
            <Dialog open={costDialogOpen} onOpenChange={setCostDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Log Cost
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Log Actual Cost</DialogTitle>
                </DialogHeader>
                <LogCostForm
                  firmId={profile?.firm_id!}
                  categoryId={category.id}
                  projectId={category.project_id}
                  categoryName={category.name}
                  userId={profile?.id!}
                  onSuccess={() => {
                    setCostDialogOpen(false);
                    toast.success('Cost logged successfully');
                  }}
                />
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {costs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No costs recorded yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="text-left p-2 font-medium text-sm">Date</th>
                      <th className="text-left p-2 font-medium text-sm">Description</th>
                      <th className="text-right p-2 font-medium text-sm">Amount</th>
                      <th className="text-left p-2 font-medium text-sm">Vendor</th>
                      <th className="text-left p-2 font-medium text-sm">Recorded By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costs.map((cost) => (
                      <tr key={cost.id} className="border-b border-border">
                        <td className="p-2 text-sm">{format(new Date(cost.cost_date), 'MMM d, yyyy')}</td>
                        <td className="p-2 text-sm">{cost.description}</td>
                        <td className="p-2 text-sm text-right font-medium">${Number(cost.amount).toLocaleString()}</td>
                        <td className="p-2 text-sm">{cost.vendor || '-'}</td>
                        <td className="p-2 text-sm">{cost.recorded_by_user?.full_name || '-'}</td>
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

interface LogCostFormProps {
  firmId: string;
  categoryId: string;
  projectId: string;
  categoryName: string;
  userId: string;
  onSuccess: () => void;
}

function LogCostForm({ firmId, categoryId, projectId, categoryName, userId, onSuccess }: LogCostFormProps) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      cost_date: format(new Date(), 'yyyy-MM-dd'),
      description: '',
      amount: 0,
      vendor_name: '',
    },
  });

  const onSubmit = async (values: typeof form.formState.defaultValues) => {
    if (!values || !values.description || !values.cost_date) return;
    setSubmitting(true);
    try {
      await createActualCost({
        firm_id: firmId,
        cost_category_id: categoryId,
        project_id: projectId,
        cost_date: values.cost_date,
        description: values.description,
        amount: values.amount ?? 0,
        vendor: values.vendor_name || null,
        recorded_by: userId,
      });
      onSuccess();
    } catch (error) {
      console.error('Error logging cost:', error);
      toast.error('Failed to log cost');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium">Category: {categoryName}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="cost_date"
            rules={{ required: 'Cost date is required' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost Date *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            rules={{ required: 'Amount is required', min: { value: 0, message: 'Amount must be positive' } }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount ($) *</FormLabel>
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
          name="description"
          rules={{ required: 'Description is required' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Describe the cost" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vendor_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vendor Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Optional vendor name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Logging...' : 'Log Cost'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
