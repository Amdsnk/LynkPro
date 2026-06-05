import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { DelayPrediction, Project } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp, Clock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { predictProjectDelay, analyzeDelayTrends, getDelayRiskColor, getDelayRiskBadge } from '@/lib/delayPrediction';
import { format, parseISO } from 'date-fns';

export default function DelayPredictionDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState<DelayPrediction[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    fetchDataAndPredict();
  }, []);

  async function fetchDataAndPredict() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('firm_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.firm_id) return;

      // Fetch all projects (not just active)
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('firm_id', profile.firm_id)
        .order('end_date', { ascending: true });

      if (projectsError) throw projectsError;

      setProjects(projectsData || []);

      // Fetch real ML predictions from database
      const { data: mlPredictions, error: mlError } = await supabase
        .from('ml_predictions')
        .select('*')
        .eq('firm_id', profile.firm_id)
        .eq('prediction_type', 'delay_prediction')
        .order('created_at', { ascending: false });

      if (mlError) throw mlError;

      // Convert ML predictions to DelayPrediction format
      const generatedPredictions: DelayPrediction[] = [];

      for (const mlPred of mlPredictions || []) {
        const project = projectsData?.find(p => p.id === mlPred.project_id);
        if (!project) continue;

        const predData = mlPred.prediction_data as any;
        
        const prediction: DelayPrediction = {
          projectId: project.id,
          projectName: project.name,
          currentEndDate: project.end_date,
          predictedEndDate: predData.completion_date || project.end_date,
          predictedDelayDays: predData.predicted_delay_days || 0,
          confidence: (mlPred.confidence_score || 0) * 100,
          riskLevel: predData.predicted_delay_days > 10 ? 'high' : predData.predicted_delay_days > 5 ? 'medium' : 'low',
          factors: predData.risk_factors || [],
          recommendations: predData.mitigation_suggestions || [],
          generatedAt: mlPred.created_at,
        };

        generatedPredictions.push(prediction);
      }

      // If no predictions in database, generate fallback predictions
      if (generatedPredictions.length === 0) {
        for (const project of projectsData || []) {
          const historicalData = {
            weatherDelays: Math.floor(Math.random() * 10),
            materialDelays: Math.floor(Math.random() * 8),
            workforceIssues: Math.floor(Math.random() * 6),
            equipmentDowntime: Math.floor(Math.random() * 5),
          };

          const prediction = predictProjectDelay(project, historicalData);
          generatedPredictions.push(prediction);
        }
      }

      setPredictions(generatedPredictions);
    } catch (error) {
      console.error('Error fetching predictions:', error);
      toast.error('Failed to load delay predictions');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Generating AI predictions...</p>
        </div>
      </div>
    );
  }

  const trends = analyzeDelayTrends(predictions);
  const criticalProjects = predictions.filter(p => p.risk_level === 'critical');
  const highRiskProjects = predictions.filter(p => p.risk_level === 'high' || p.risk_level === 'critical');

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">AI Delay Predictions</h1>
            </div>
            <p className="text-muted-foreground mt-2">
              Predictive analytics for project delays and mitigation strategies
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Projects Analyzed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{predictions.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                High Risk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{highRiskProjects.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Avg Delay
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{trends.averageDelay.toFixed(1)} days</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${
                trends.trend === 'improving' ? 'text-green-600' :
                trends.trend === 'worsening' ? 'text-destructive' :
                'text-muted-foreground'
              }`}>
                {trends.trend === 'improving' ? '↓' : trends.trend === 'worsening' ? '↑' : '→'}
              </div>
              <p className="text-xs text-muted-foreground mt-1 capitalize">{trends.trend}</p>
            </CardContent>
          </Card>
        </div>

        {criticalProjects.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Critical Delay Alerts ({criticalProjects.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {criticalProjects.map((prediction) => (
                  <div
                    key={prediction.project_id}
                    className="p-4 rounded-lg border border-destructive/50 bg-destructive/5 cursor-pointer hover:bg-destructive/10 transition-colors"
                    onClick={() => navigate(`/ai/delay-analysis/${prediction.project_id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{prediction.project_name}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Predicted delay: {prediction.predicted_delay_days} days ({Math.round(prediction.delay_probability * 100)}% probability)
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          New completion: {format(parseISO(prediction.predicted_completion_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <Badge variant="destructive">Critical</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>All Predictions ({predictions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {predictions.length === 0 ? (
              <div className="text-center py-12">
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No active projects to analyze. AI predictions will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {predictions.map((prediction) => (
                  <div
                    key={prediction.project_id}
                    className="p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/ai/delay-analysis/${prediction.project_id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-medium">{prediction.project_name}</p>
                          <Badge variant={getDelayRiskBadge(prediction.risk_level)}>
                            {prediction.risk_level}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">Predicted Delay</p>
                            <p className={`font-medium ${getDelayRiskColor(prediction.risk_level)}`}>
                              {prediction.predicted_delay_days} days
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Probability</p>
                            <p className="font-medium">{Math.round(prediction.delay_probability * 100)}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Root Causes</p>
                            <p className="font-medium">{prediction.root_causes.length}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Confidence</p>
                            <p className="font-medium">{Math.round(prediction.confidence_score * 100)}%</p>
                          </div>
                        </div>
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
