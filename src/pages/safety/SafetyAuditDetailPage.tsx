import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { SafetyAudit } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getAuditScoreColor, trackActionCompletion } from '@/lib/auditScoring';
import { format, parseISO } from 'date-fns';

export default function SafetyAuditDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [audit, setAudit] = useState<SafetyAudit | null>(null);

  useEffect(() => {
    if (id) {
      fetchAudit();
    }
  }, [id]);

  async function fetchAudit() {
    try {
      const { data, error } = await supabase
        .from('safety_audits')
        .select('*, projects(name), profiles!safety_audits_auditor_id_fkey(full_name)')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error('Audit not found');
        navigate('/safety/audits');
        return;
      }

      setAudit(data);
    } catch (error) {
      console.error('Error fetching audit:', error);
      toast.error('Failed to load audit');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading audit...</p>
        </div>
      </div>
    );
  }

  if (!audit) return null;

  const actionStats = trackActionCompletion(audit.corrective_actions || []);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/safety/audits')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Safety Audit Details</h1>
            <p className="text-muted-foreground mt-1">
              {(audit as any).projects?.name || 'Unknown Project'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Audit Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Auditor</p>
                <p className="font-medium">{(audit as any).profiles?.full_name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Audit Date</p>
                <p className="font-medium">{format(parseISO(audit.audit_date), 'MMM d, yyyy')}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-5xl font-bold ${getAuditScoreColor(audit.overall_score || 0)}`}>
                {audit.overall_score || 0}%
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {audit.overall_score && audit.overall_score >= 75 ? 'Passed' : 'Needs Improvement'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Checklist Results</CardTitle>
          </CardHeader>
          <CardContent>
            {audit.results && audit.results.length > 0 ? (
              <div className="space-y-3">
                {audit.results.map((result, index) => (
                  <div key={index} className="p-3 rounded-lg border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{result.question}</p>
                        {result.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{result.notes}</p>
                        )}
                      </div>
                      {result.passed ? (
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 ml-2" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive flex-shrink-0 ml-2" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No results</p>
            )}
          </CardContent>
        </Card>

        {audit.corrective_actions && audit.corrective_actions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Corrective Actions ({actionStats.total})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {audit.corrective_actions.map((action, index) => (
                  <div key={index} className="p-3 rounded-lg border">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium">{action.issue}</p>
                      <Badge variant={action.status === 'completed' ? 'default' : 'destructive'}>
                        {action.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{action.action_required}</p>
                    {action.due_date && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Due: {format(parseISO(action.due_date), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
