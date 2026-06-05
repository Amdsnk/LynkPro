import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { identifyReorderNeeds } from '@/lib/demandForecasting';

interface ReorderAlert {
  material_id: string;
  material_name: string;
  current_stock: number;
  reorder_point: number;
  unit: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
}

export default function ReorderAlertsPage() {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<ReorderAlert[]>([]);

  useEffect(() => {
    fetchReorderAlerts();
  }, []);

  async function fetchReorderAlerts() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('firm_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.firm_id) return;

      // Fetch materials with current stock
      const { data: materials, error: materialsError } = await supabase
        .from('materials')
        .select('id, name, current_stock, unit')
        .eq('firm_id', profile.firm_id);

      if (materialsError) throw materialsError;

      // Fetch forecasts with reorder points
      const { data: forecasts, error: forecastsError } = await supabase
        .from('material_forecasts')
        .select('material_id, reorder_point')
        .eq('firm_id', profile.firm_id);

      if (forecastsError) throw forecastsError;

      // Create map of reorder points
      const reorderMap = new Map<string, number>();
      forecasts?.forEach(f => {
        if (f.reorder_point) {
          reorderMap.set(f.material_id, f.reorder_point);
        }
      });

      // Identify materials that need reordering
      const reorderAlerts: ReorderAlert[] = [];
      materials?.forEach(material => {
        const reorderPoint = reorderMap.get(material.id);
        if (reorderPoint) {
          const { needsReorder, urgency } = identifyReorderNeeds(
            material.current_stock || 0,
            reorderPoint,
            material.name
          );

          if (needsReorder) {
            reorderAlerts.push({
              material_id: material.id,
              material_name: material.name,
              current_stock: material.current_stock || 0,
              reorder_point: reorderPoint,
              unit: material.unit || '',
              urgency,
            });
          }
        }
      });

      // Sort by urgency
      reorderAlerts.sort((a, b) => {
        const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      });

      setAlerts(reorderAlerts);
    } catch (error) {
      console.error('Error fetching reorder alerts:', error);
      toast.error('Failed to load reorder alerts');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading reorder alerts...</p>
        </div>
      </div>
    );
  }

  const criticalAlerts = alerts.filter(a => a.urgency === 'critical').length;
  const highAlerts = alerts.filter(a => a.urgency === 'high').length;
  const mediumAlerts = alerts.filter(a => a.urgency === 'medium').length;

  const getUrgencyBadge = (urgency: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive'; icon: any }> = {
      critical: { variant: 'destructive', icon: AlertTriangle },
      high: { variant: 'destructive', icon: AlertCircle },
      medium: { variant: 'secondary', icon: AlertCircle },
      low: { variant: 'secondary', icon: Info },
    };
    const config = variants[urgency] || variants.low;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {urgency}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Reorder Alerts</h1>
          <p className="text-muted-foreground mt-2">
            Materials that need to be reordered based on current stock levels
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{alerts.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Critical
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{criticalAlerts}</div>
              <p className="text-xs text-muted-foreground mt-1">≤25% stock</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                High
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{highAlerts}</div>
              <p className="text-xs text-muted-foreground mt-1">≤50% stock</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Medium
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{mediumAlerts}</div>
              <p className="text-xs text-muted-foreground mt-1">≤75% stock</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reorder Alerts ({alerts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No reorder alerts. All materials are adequately stocked.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => {
                  const stockPercentage = (alert.current_stock / alert.reorder_point) * 100;

                  return (
                    <div
                      key={alert.material_id}
                      className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-medium">{alert.material_name}</p>
                            {getUrgencyBadge(alert.urgency)}
                          </div>
                          
                          <div className="flex items-center gap-6 text-sm">
                            <div>
                              <span className="text-muted-foreground">Current Stock: </span>
                              <span className="font-medium">
                                {alert.current_stock.toFixed(2)} {alert.unit}
                              </span>
                            </div>
                            
                            <div>
                              <span className="text-muted-foreground">Reorder Point: </span>
                              <span className="font-medium">
                                {alert.reorder_point.toFixed(2)} {alert.unit}
                              </span>
                            </div>
                            
                            <div>
                              <span className="text-muted-foreground">Stock Level: </span>
                              <span className={`font-medium ${
                                stockPercentage <= 25 ? 'text-destructive' :
                                stockPercentage <= 50 ? 'text-yellow-600' :
                                'text-muted-foreground'
                              }`}>
                                {stockPercentage.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
