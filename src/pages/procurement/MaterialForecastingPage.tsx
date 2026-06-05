import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { MaterialForecast } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

export default function MaterialForecastingPage() {
  const [loading, setLoading] = useState(true);
  const [forecasts, setForecasts] = useState<MaterialForecast[]>([]);

  useEffect(() => {
    fetchForecasts();
  }, []);

  async function fetchForecasts() {
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
        .from('material_forecasts')
        .select('*, materials(name, unit), projects(name)')
        .eq('firm_id', profile.firm_id)
        .order('forecast_date', { ascending: true });

      if (error) throw error;
      setForecasts(data || []);
    } catch (error) {
      console.error('Error fetching forecasts:', error);
      toast.error('Failed to load forecasts');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading forecasts...</p>
        </div>
      </div>
    );
  }

  const avgConfidence = forecasts.length > 0
    ? forecasts.reduce((sum, f) => sum + (f.confidence_level || 0), 0) / forecasts.length
    : 0;

  const highConfidence = forecasts.filter(f => (f.confidence_level || 0) >= 0.7).length;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Material Demand Forecasting</h1>
          <p className="text-muted-foreground mt-2">
            Predict future material needs based on historical consumption
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Total Forecasts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{forecasts.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                High Confidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{highConfidence}</div>
              <p className="text-xs text-muted-foreground mt-1">≥70% confidence</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Confidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{(avgConfidence * 100).toFixed(0)}%</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Forecasts ({forecasts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {forecasts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No forecasts available. Add consumption data to generate forecasts.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Material</th>
                      <th className="text-left py-3 px-4 font-medium">Project</th>
                      <th className="text-right py-3 px-4 font-medium">Predicted Qty</th>
                      <th className="text-center py-3 px-4 font-medium">Confidence</th>
                      <th className="text-right py-3 px-4 font-medium">Lead Time</th>
                      <th className="text-left py-3 px-4 font-medium">Forecast Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecasts.map((forecast) => {
                      const confidence = (forecast.confidence_level || 0) * 100;
                      const confidenceColor = confidence >= 70 ? 'text-green-600' :
                                             confidence >= 50 ? 'text-yellow-600' :
                                             'text-destructive';

                      return (
                        <tr key={forecast.id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="py-4 px-4 font-medium">
                            {(forecast as any).materials?.name || 'Unknown'}
                          </td>
                          <td className="py-4 px-4">
                            {(forecast as any).projects?.name || 'Unknown'}
                          </td>
                          <td className="py-4 px-4 text-right">
                            {forecast.predicted_quantity.toFixed(2)} {(forecast as any).materials?.unit || ''}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`font-medium ${confidenceColor}`}>
                              {confidence.toFixed(0)}%
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            {forecast.lead_time_days ? `${forecast.lead_time_days}d` : 'N/A'}
                          </td>
                          <td className="py-4 px-4">
                            {format(parseISO(forecast.forecast_date), 'MMM d, yyyy')}
                          </td>
                        </tr>
                      );
                    })}
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
