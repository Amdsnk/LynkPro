import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, DollarSign, Camera, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function AIInsightsDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [projectCount, setProjectCount] = useState(0);

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

      const { data: projects, error } = await supabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('firm_id', profile.firm_id)
        .eq('status', 'active');

      if (error) throw error;

      setProjectCount(projects?.length || 0);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load AI insights');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading AI insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">AI Insights</h1>
          </div>
          <p className="text-muted-foreground mt-2">
            Comprehensive AI-powered analytics and predictions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/ai/delay-predictions')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Delay Predictions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{projectCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Projects analyzed</p>
              <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => navigate('/ai/delay-prediction')}>
                View Details
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/ai/budget-prediction')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Budget Predictions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{projectCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Budget forecasts</p>
              <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => navigate('/ai/budget-prediction')}>
                View Details
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/ai/photo-analysis')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Photo Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">Photos analyzed</p>
              <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => navigate('/ai/photo-analysis')}>
                Upload Photo
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/safety/risk-prediction')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Risk Predictions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{projectCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Risk assessments</p>
              <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => navigate('/safety/risk-prediction')}>
                View Details
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Predictive Delay Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  AI-powered delay prediction using multi-factor analysis (weather, materials, workforce, equipment).
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 rounded-lg border">
                    <p className="font-medium">7-14 Days</p>
                    <p className="text-xs text-muted-foreground">Advance warning</p>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <p className="font-medium">75%+</p>
                    <p className="text-xs text-muted-foreground">Prediction accuracy</p>
                  </div>
                </div>
                <Button className="w-full" onClick={() => navigate('/ai/delay-predictions')}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Delay Predictions
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Budget Overrun Prediction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Real-time budget burn rate analysis with cost variance forecasting and AI-powered savings opportunities.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 rounded-lg border">
                    <p className="font-medium">85%+</p>
                    <p className="text-xs text-muted-foreground">Forecast accuracy</p>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <p className="font-medium">$10K+</p>
                    <p className="text-xs text-muted-foreground">Avg savings identified</p>
                  </div>
                </div>
                <Button className="w-full" onClick={() => navigate('/ai/budget-predictions')}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  View Budget Predictions
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Photo Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Computer vision-powered issue detection from construction site photos with automated recommendations.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 rounded-lg border">
                    <p className="font-medium">70%+</p>
                    <p className="text-xs text-muted-foreground">Detection accuracy</p>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <p className="font-medium">60%</p>
                    <p className="text-xs text-muted-foreground">Inspection time saved</p>
                  </div>
                </div>
                <Button className="w-full" onClick={() => navigate('/ai/photo-analysis')}>
                  <Camera className="h-4 w-4 mr-2" />
                  Analyze Photos
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Safety Risk Scoring</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Predictive risk analytics for next 7 days with activity-level risk scores and mitigation recommendations.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 rounded-lg border">
                    <p className="font-medium">7 Days</p>
                    <p className="text-xs text-muted-foreground">Prediction window</p>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <p className="font-medium">80%+</p>
                    <p className="text-xs text-muted-foreground">Risk identification</p>
                  </div>
                </div>
                <Button className="w-full" onClick={() => navigate('/safety/risk-predictions')}>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  View Risk Predictions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>AI Capabilities Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <p className="font-medium mb-2">Predictive Analytics</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Multi-factor delay forecasting</li>
                  <li>• Budget burn rate analysis</li>
                  <li>• Material demand prediction</li>
                  <li>• Safety risk scoring</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">Computer Vision</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Structural defect detection</li>
                  <li>• Safety violation identification</li>
                  <li>• Quality defect recognition</li>
                  <li>• Material issue detection</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
