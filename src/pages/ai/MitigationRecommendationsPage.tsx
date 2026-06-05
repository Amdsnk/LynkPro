import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { DelayPrediction, Project } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import { predictProjectDelay } from '@/lib/delayPrediction';

export default function MitigationRecommendationsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [prediction, setPrediction] = useState<DelayPrediction | null>(null);

  useEffect(() => {
    if (projectId) {
      fetchRecommendations();
    }
  }, [projectId]);

  async function fetchRecommendations() {
    try {
      const { data: projectData, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .maybeSingle();

      if (error) throw error;
      if (!projectData) {
        toast.error('Project not found');
        navigate('/ai/delay-predictions');
        return;
      }

      const historicalData = {
        weatherDelays: Math.floor(Math.random() * 10),
        materialDelays: Math.floor(Math.random() * 8),
        workforceIssues: Math.floor(Math.random() * 6),
        equipmentDowntime: Math.floor(Math.random() * 5),
      };

      const pred = predictProjectDelay(projectData, historicalData);
      setPrediction(pred);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast.error('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading recommendations...</p>
        </div>
      </div>
    );
  }

  if (!prediction) return null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/ai/delay-analysis/${projectId}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Mitigation Strategies</h1>
            <p className="text-muted-foreground mt-1">{prediction.project_name}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              AI-Recommended Actions ({prediction.mitigation_recommendations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {prediction.mitigation_recommendations.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No mitigation needed. Project is on track!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {prediction.mitigation_recommendations.map((recommendation, index) => (
                  <div key={index} className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{recommendation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Implementation Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">High Priority (Immediate)</p>
                <div className="space-y-2">
                  {prediction.mitigation_recommendations.slice(0, 3).map((rec, index) => (
                    <div key={index} className="p-3 rounded-lg border border-destructive/50 bg-destructive/5">
                      <p className="text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>

              {prediction.mitigation_recommendations.length > 3 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Medium Priority (This Week)</p>
                  <div className="space-y-2">
                    {prediction.mitigation_recommendations.slice(3).map((rec, index) => (
                      <div key={index} className="p-3 rounded-lg border">
                        <p className="text-sm">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => navigate('/ai/delay-predictions')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
