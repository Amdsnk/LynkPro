import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { SafetyAudit, CorrectiveAction } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { isActionOverdue, getActionStatusBadge } from '@/lib/auditScoring';
import { format, parseISO } from 'date-fns';

export default function CorrectiveActionTracker() {
  const [loading, setLoading] = useState(true);
  const [audits, setAudits] = useState<SafetyAudit[]>([]);
  const [allActions, setAllActions] = useState<(CorrectiveAction & { auditId: string; projectName: string })[]>([]);

  useEffect(() => {
    fetchActions();
  }, []);

  async function fetchActions() {
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
        .select('*, projects(name)')
        .eq('firm_id', profile.firm_id)
        .order('audit_date', { ascending: false });

      if (error) throw error;

      const actions: (CorrectiveAction & { auditId: string; projectName: string })[] = [];
      data?.forEach(audit => {
        if (audit.corrective_actions && Array.isArray(audit.corrective_actions)) {
          audit.corrective_actions.forEach((action: CorrectiveAction) => {
            actions.push({
              ...action,
              auditId: audit.id,
              projectName: (audit as any).projects?.name || 'Unknown',
            });
          });
        }
      });

      setAudits(data || []);
      setAllActions(actions);
    } catch (error) {
      console.error('Error fetching actions:', error);
      toast.error('Failed to load corrective actions');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading corrective actions...</p>
        </div>
      </div>
    );
  }

  const openActions = allActions.filter(a => a.status === 'open');
  const inProgressActions = allActions.filter(a => a.status === 'in_progress');
  const completedActions = allActions.filter(a => a.status === 'completed');
  const overdueActions = allActions.filter(a => isActionOverdue(a));

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Corrective Action Tracker</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and manage safety corrective actions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{allActions.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Open
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{openActions.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{inProgressActions.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{completedActions.length}</div>
            </CardContent>
          </Card>
        </div>

        {overdueActions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Overdue Actions ({overdueActions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {overdueActions.map((action, index) => (
                  <div key={index} className="p-4 rounded-lg border border-destructive/50 bg-destructive/5">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium">{action.issue}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Project: {action.projectName}
                        </p>
                      </div>
                      <Badge variant="destructive">Overdue</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{action.action_required}</p>
                    {action.due_date && (
                      <p className="text-sm text-destructive mt-2">
                        Due: {format(parseISO(action.due_date), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>All Corrective Actions ({allActions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {allActions.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <p className="text-muted-foreground">No corrective actions. Great job!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allActions.map((action, index) => {
                  const statusBadge = getActionStatusBadge(action.status);
                  const overdue = isActionOverdue(action);

                  return (
                    <div key={index} className="p-4 rounded-lg border">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium">{action.issue}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Project: {action.projectName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {overdue && <Badge variant="destructive">Overdue</Badge>}
                          <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{action.action_required}</p>
                      {action.due_date && (
                        <p className={`text-sm mt-2 ${overdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                          Due: {format(parseISO(action.due_date), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
