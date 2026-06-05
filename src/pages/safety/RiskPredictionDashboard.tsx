import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { RiskPrediction, RiskAssessment } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, Target } from 'lucide-react';
import { toast } from 'sonner';
import { predictFutureRisk, getRiskBadgeVariant } from '@/lib/riskScoring';

export default function RiskPredictionDashboard() {
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState<RiskPrediction[]>([]);
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('firm_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.firm_id) return;

      const [predictionsRes, assessmentsRes] = await Promise.all([
        supabase
          .from('risk_predictions')
          .select('*, projects(name)')
          .eq('firm_id', profile.firm_id)
          .order('prediction_date', { ascending: false }),
        supabase
          .from('risk_assessments')
          .select('*')
          .eq('firm_id', profile.firm_id),
      ]);

      if (predictionsRes.error) throw predictionsRes.error;
      if (assessmentsRes.error) throw assessmentsRes.error;

      setPredictions(predictionsRes.data || []);
      setAssessments(assessmentsRes.data || []);
    } catch (error) {
      console.error('Error fetching predictions:', error);
      toast.error('Failed to load predictions');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading predictions...</p>
        </div>
      </div>
    );
  }

  const futurePrediction = predictFutureRisk(assessments, 7);
  const avgConfidence = predictions.length > 0
    ? predictions.reduce((sum, p) => sum + (p.confidence_level || 0), 0) / predictions.length
    : 0;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Risk Prediction Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Predictive risk alerts and recommendations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Predicted Risk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{futurePrediction.score.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground mt-1">next 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Confidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{(futurePrediction.confidence * 100).toFixed(0)}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                High Risk Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">
                {futurePrediction.activities.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {futurePrediction.activities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>High Risk Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {futurePrediction.activities.map((activity, index) => (
                  <div key={index} className="p-4 rounded-lg border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{activity.activity}</p>
                        {activity.factors.length > 0 && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Risk Factors: {activity.factors.join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold">{activity.risk_score.toFixed(0)}</span>
                        <Badge variant={getRiskBadgeVariant(activity.risk_score)}>
                          High Risk
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Historical Predictions ({predictions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {predictions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No predictions yet. Predictions are generated based on historical risk assessments.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {predictions.map((pred) => (
                  <div key={pred.id} className="p-4 rounded-lg border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">
                          Project: {(pred as any).projects?.name || 'Unknown'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Prediction Date: {pred.prediction_date}
                        </p>
                        {pred.recommendations && (
                          <p className="text-sm text-muted-foreground mt-2">{pred.recommendations}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{pred.predicted_risk_score?.toFixed(0) || 'N/A'}</div>
                        {pred.confidence_level && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {(pred.confidence_level * 100).toFixed(0)}% confidence
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
