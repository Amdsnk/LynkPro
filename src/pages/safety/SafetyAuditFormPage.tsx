import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { calculateAuditScore, identifyCorrectiveActions } from '@/lib/auditScoring';

export default function SafetyAuditFormPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [auditDate, setAuditDate] = useState(new Date().toISOString().split('T')[0]);
  const [results, setResults] = useState([{ question: '', passed: true, notes: '' }]);

  function addResult() {
    setResults([...results, { question: '', passed: true, notes: '' }]);
  }

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

      const auditResults = results.map((r, i) => ({
        item_id: `item-${i}`,
        question: r.question,
        response: r.passed,
        passed: r.passed,
        notes: r.notes || undefined,
      }));

      const score = calculateAuditScore(auditResults);
      const correctiveActions = identifyCorrectiveActions(auditResults);

      const { error } = await supabase
        .from('safety_audits')
        .insert([{
          firm_id: profile.firm_id,
          project_id: projectId,
          audit_date: auditDate,
          auditor_id: user.id,
          results: auditResults,
          overall_score: score,
          corrective_actions: correctiveActions,
          status: 'completed',
        }]);

      if (error) throw error;

      toast.success('Audit completed successfully');
      navigate('/safety/audits');
    } catch (error) {
      console.error('Error creating audit:', error);
      toast.error('Failed to create audit');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/safety/audits')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">New Safety Audit</h1>
            <p className="text-muted-foreground mt-1">Conduct a safety inspection</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Audit Information</CardTitle>
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
                <label className="text-sm font-medium">Audit Date *</label>
                <Input
                  type="date"
                  value={auditDate}
                  onChange={(e) => setAuditDate(e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Checklist Items</span>
                <Button type="button" size="sm" onClick={addResult}>
                  Add Item
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <Input
                    placeholder="Question"
                    value={result.question}
                    onChange={(e) => {
                      const newResults = [...results];
                      newResults[index].question = e.target.value;
                      setResults(newResults);
                    }}
                    required
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={result.passed}
                      onChange={(e) => {
                        const newResults = [...results];
                        newResults[index].passed = e.target.checked;
                        setResults(newResults);
                      }}
                    />
                    <label className="text-sm">Passed</label>
                  </div>
                  <Textarea
                    placeholder="Notes"
                    value={result.notes}
                    onChange={(e) => {
                      const newResults = [...results];
                      newResults[index].notes = e.target.value;
                      setResults(newResults);
                    }}
                    rows={2}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/safety/audits')} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Complete Audit'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
