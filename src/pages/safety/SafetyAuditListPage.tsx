import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { SafetyAudit } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { getAuditScoreColor, generateAuditSummary } from '@/lib/auditScoring';
import { format, parseISO } from 'date-fns';

export default function SafetyAuditListPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [audits, setAudits] = useState<SafetyAudit[]>([]);

  useEffect(() => {
    fetchAudits();
  }, []);

  async function fetchAudits() {
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
        .from('safety_audits')
        .select('*, projects(name), profiles!safety_audits_auditor_id_fkey(full_name)')
        .eq('firm_id', profile.firm_id)
        .order('audit_date', { ascending: false });

      if (error) throw error;
      setAudits(data || []);
    } catch (error) {
      console.error('Error fetching audits:', error);
      toast.error('Failed to load audits');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading audits...</p>
        </div>
      </div>
    );
  }

  const summary = generateAuditSummary(audits);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Safety Audits</h1>
            <p className="text-muted-foreground mt-2">
              Track safety inspections and compliance audits
            </p>
          </div>
          <Button onClick={() => navigate('/safety/audits/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Audit
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Audits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.totalAudits}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Average Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getAuditScoreColor(summary.averageScore)}`}>
                {summary.averageScore}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pass Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{summary.passRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">≥75% score</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Open Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{summary.openActions}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Audits ({audits.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {audits.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No audits yet. Conduct your first safety audit to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {audits.map((audit) => (
                  <div
                    key={audit.id}
                    className="p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/safety/audits/${audit.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-medium">
                            {(audit as any).projects?.name || 'Unknown Project'}
                          </p>
                          {audit.overall_score !== null && (
                            <Badge variant={audit.overall_score >= 75 ? 'default' : 'destructive'}>
                              {audit.overall_score}%
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          Auditor: {(audit as any).profiles?.full_name || 'Unknown'}
                        </p>
                        
                        <div className="flex items-center gap-4 mt-3 text-sm">
                          <span className="text-muted-foreground">
                            {format(parseISO(audit.audit_date), 'MMM d, yyyy')}
                          </span>
                          {audit.corrective_actions && audit.corrective_actions.length > 0 && (
                            <span className="text-muted-foreground">
                              {audit.corrective_actions.length} corrective actions
                            </span>
                          )}
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
