import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { calculateRiskScore, recommendMitigation } from '@/lib/riskScoring';

export default function RiskAssessmentPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [activity, setActivity] = useState('');
  const [location, setLocation] = useState('');
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [factors, setFactors] = useState({
    height: 0,
    weather: 0,
    equipment: 0,
    experience: 0,
    complexity: 0,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('firm_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.firm_id) throw new Error('Firm not found');

      const riskScore = calculateRiskScore(factors);
      const recommendations = recommendMitigation(factors);
      const mitigationMeasures = recommendations.map((rec, i) => ({
        id: `measure-${i}`,
        measure: rec,
        implemented: false,
      }));

      const { error } = await supabase
        .from('risk_assessments')
        .insert([{
          firm_id: profile.firm_id,
          project_id: projectId,
          activity,
          location: location || null,
          risk_score: riskScore,
          risk_factors: factors,
          mitigation_measures: mitigationMeasures,
          assessed_by: user.id,
          assessment_date: assessmentDate,
        }]);

      if (error) throw error;

      toast.success('Risk assessment completed');
      navigate('/safety/risk-heatmap');
    } catch (error) {
      console.error('Error creating assessment:', error);
      toast.error('Failed to create assessment');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/safety/risk-heatmap')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Risk Assessment</h1>
            <p className="text-muted-foreground mt-1">Conduct activity risk assessment</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Project ID *</label>
                <Input
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Activity *</label>
                <Input
                  value={activity}
                  onChange={(e) => setActivity(e.target.value)}
                  placeholder="e.g., Roofing work, Excavation"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Location</label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Building A, Floor 3"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Assessment Date *</label>
                <Input
                  type="date"
                  value={assessmentDate}
                  onChange={(e) => setAssessmentDate(e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk Factors (0-100)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(factors).map(([key, value]) => (
                <div key={key}>
                  <label className="text-sm font-medium capitalize">{key}</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => setFactors({ ...factors, [key]: parseInt(e.target.value) || 0 })}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/safety/risk-heatmap')} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Complete Assessment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
