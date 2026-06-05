import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { RiskAssessment } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { generateRiskHeatmap, getRiskBadgeVariant } from '@/lib/riskScoring';

export default function RiskHeatmapPage() {
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);

  useEffect(() => {
    fetchAssessments();
  }, []);

  async function fetchAssessments() {
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
        .from('risk_assessments')
        .select('*, projects(name)')
        .eq('firm_id', profile.firm_id)
        .order('risk_score', { ascending: false });

      if (error) throw error;
      setAssessments(data || []);
    } catch (error) {
      console.error('Error fetching assessments:', error);
      toast.error('Failed to load risk assessments');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading risk heatmap...</p>
        </div>
      </div>
    );
  }

  const heatmapData = generateRiskHeatmap(assessments);
  const highRisk = heatmapData.filter(d => d.level === 'high' || d.level === 'critical');
  const avgRisk = assessments.length > 0
    ? assessments.reduce((sum, a) => sum + (a.risk_score || 0), 0) / assessments.length
    : 0;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Risk Heatmap</h1>
          <p className="text-muted-foreground mt-2">
            Visual risk map and activity analysis
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Assessments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{assessments.length}</div>
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
              <div className="text-3xl font-bold text-destructive">{highRisk.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Average Risk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{avgRisk.toFixed(0)}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Risk Heatmap ({heatmapData.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {heatmapData.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No risk assessments yet. Conduct your first assessment to see the heatmap.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {heatmapData.map((item, index) => (
                  <div key={index} className="p-4 rounded-lg border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{item.activity}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Location: {item.location}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold">{item.score.toFixed(0)}</span>
                        <Badge variant={getRiskBadgeVariant(item.score)}>
                          {item.level}
                        </Badge>
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
