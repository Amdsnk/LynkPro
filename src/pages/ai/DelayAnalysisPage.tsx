import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { DelayPrediction, Project } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { predictProjectDelay, getDelayRiskBadge } from '@/lib/delayPrediction';
import { format, parseISO } from 'date-fns';

export default function DelayAnalysisPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [prediction, setPrediction] = useState<DelayPrediction | null>(null);
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    if (projectId) {
      fetchAndAnalyze();
    }
  }, [projectId]);

  async function fetchAndAnalyze() {
    try {
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .maybeSingle();

      if (projectError) throw projectError;
      if (!projectData) {
        toast.error('Project not found');
        navigate('/ai/delay-predictions');
        return;
      }

      setProject(projectData);

      // Generate prediction
      const historicalData = {
        weatherDelays: Math.floor(Math.random() * 10),
        materialDelays: Math.floor(Math.random() * 8),
        workforceIssues: Math.floor(Math.random() * 6),
        equipmentDowntime: Math.floor(Math.random() * 5),
      };

      const pred = predictProjectDelay(projectData, historicalData);
      setPrediction(pred);
    } catch (error) {
      console.error('Error analyzing project:', error);
      toast.error('Failed to analyze project');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Analyzing project...</p>
        </div>
      </div>
    );
  }

  if (!prediction || !project) return null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/ai/delay-predictions')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Delay Analysis</h1>
            <p className="text-muted-foreground mt-1">{prediction.project_name}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Prediction Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Predicted Delay</p>
                <p className="text-2xl font-bold text-destructive">{prediction.predicted_delay_days} days</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Delay Probability</p>
                <p className="text-2xl font-bold">{Math.round(prediction.delay_probability * 100)}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Risk Level</p>
                <Badge variant={getDelayRiskBadge(prediction.risk_level)} className="text-sm">
                  {prediction.risk_level}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline Impact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Original Completion</p>
                <p className="font-medium">{format(parseISO(prediction.original_completion_date), 'MMM d, yyyy')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Predicted Completion</p>
                <p className="font-medium text-destructive">{format(parseISO(prediction.predicted_completion_date), 'MMM d, yyyy')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Confidence Score</p>
                <p className="font-medium">{Math.round(prediction.confidence_score * 100)}%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Root Cause Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {prediction.root_causes.length === 0 ? (
              <p className="text-muted-foreground">No significant delay factors identified</p>
            ) : (
              <div className="space-y-3">
                {prediction.root_causes.map((cause, index) => (
                  <div key={index} className="p-4 rounded-lg border">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium capitalize">{cause.category.replace('_', ' ')}</p>
                        <p className="text-sm text-muted-foreground mt-1">{cause.description}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-lg font-bold text-destructive">{cause.impact_days} days</p>
                        <p className="text-xs text-muted-foreground">{Math.round(cause.probability * 100)}% probability</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => navigate('/ai/delay-predictions')}>
            Back to Dashboard
          </Button>
          <Button onClick={() => navigate(`/ai/mitigation/${projectId}`)}>
            View Mitigation Strategies
          </Button>
        </div>
      </div>
    </div>
  );
}
