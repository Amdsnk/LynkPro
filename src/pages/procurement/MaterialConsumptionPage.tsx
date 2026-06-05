import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { MaterialConsumption } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { toast } from 'sonner';
import { analyzeConsumptionTrend } from '@/lib/demandForecasting';
import { format, parseISO } from 'date-fns';

export default function MaterialConsumptionPage() {
  const [loading, setLoading] = useState(true);
  const [consumption, setConsumption] = useState<MaterialConsumption[]>([]);

  useEffect(() => {
    fetchConsumption();
  }, []);

  async function fetchConsumption() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('firm_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.firm_id) return;

      const { data, error } = await supabase
        .from('material_consumption')
        .select('*, materials(name, unit), projects(name)')
        .eq('firm_id', profile.firm_id)
        .order('date_used', { ascending: false });

      if (error) throw error;
      setConsumption(data || []);
    } catch (error) {
      console.error('Error fetching consumption:', error);
      toast.error('Failed to load consumption data');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading consumption data...</p>
        </div>
      </div>
    );
  }

  const totalQuantity = consumption.reduce((sum, c) => sum + c.quantity_used, 0);
  const uniqueMaterials = new Set(consumption.map(c => c.material_id)).size;

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Material Consumption History</h1>
          <p className="text-muted-foreground mt-2">
            Track historical material usage across projects
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Total Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{consumption.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Unique Materials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{uniqueMaterials}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Quantity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalQuantity.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground mt-1">all units</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Consumption History ({consumption.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {consumption.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No consumption data yet. Start tracking material usage.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Date</th>
                      <th className="text-left py-3 px-4 font-medium">Material</th>
                      <th className="text-left py-3 px-4 font-medium">Project</th>
                      <th className="text-right py-3 px-4 font-medium">Quantity</th>
                      <th className="text-left py-3 px-4 font-medium">Phase</th>
                      <th className="text-left py-3 px-4 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consumption.map((record) => (
                      <tr key={record.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-4 px-4">
                          {format(parseISO(record.date_used), 'MMM d, yyyy')}
                        </td>
                        <td className="py-4 px-4 font-medium">
                          {(record as any).materials?.name || 'Unknown'}
                        </td>
                        <td className="py-4 px-4">
                          {(record as any).projects?.name || 'Unknown'}
                        </td>
                        <td className="py-4 px-4 text-right">
                          {record.quantity_used.toFixed(2)} {record.unit}
                        </td>
                        <td className="py-4 px-4">
                          {record.project_phase || '-'}
                        </td>
                        <td className="py-4 px-4 text-sm text-muted-foreground">
                          {record.notes || '-'}
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
