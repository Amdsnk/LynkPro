import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { ComplianceTracking, ComplianceRequirement } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { calculateComplianceScore, getComplianceStatusBadge, isOverdue } from '@/lib/complianceEngine';

export default function ComplianceChecklistPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState<ComplianceTracking[]>([]);
  const [requirements, setRequirements] = useState<Map<string, ComplianceRequirement>>(new Map());

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

      const [trackingRes, requirementsRes] = await Promise.all([
        supabase
          .from('compliance_tracking')
          .select('*, projects(name)')
          .eq('firm_id', profile.firm_id)
          .order('next_check_due', { ascending: true }),
        supabase
          .from('compliance_requirements')
          .select('*')
          .eq('firm_id', profile.firm_id),
      ]);

      if (trackingRes.error) throw trackingRes.error;
      if (requirementsRes.error) throw requirementsRes.error;

      const reqMap = new Map<string, ComplianceRequirement>();
      requirementsRes.data?.forEach(req => reqMap.set(req.id, req));

      setTracking(trackingRes.data || []);
      setRequirements(reqMap);
    } catch (error) {
      console.error('Error fetching compliance data:', error);
      toast.error('Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading compliance data...</p>
        </div>
      </div>
    );
  }

  const score = calculateComplianceScore(tracking);
  const compliant = tracking.filter(t => t.status === 'compliant').length;
  const nonCompliant = tracking.filter(t => t.status === 'non_compliant').length;
  const pending = tracking.filter(t => t.status === 'pending').length;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Compliance Checklist</h1>
          <p className="text-muted-foreground mt-2">
            Track project compliance status and requirements
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Compliance Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{score}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Compliant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{compliant}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Non-Compliant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{nonCompliant}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{pending}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Compliance Items ({tracking.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {tracking.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No compliance tracking records yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {tracking.map((item) => {
                  const requirement = requirements.get(item.requirement_id);
                  const statusBadge = getComplianceStatusBadge(item.status);
                  const overdue = isOverdue(item);

                  return (
                    <div key={item.id} className="p-4 rounded-lg border">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium">
                            {requirement?.requirement_name || 'Unknown Requirement'}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Project: {(item as any).projects?.name || 'Unknown'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {overdue && <Badge variant="destructive">Overdue</Badge>}
                          <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                        </div>
                      </div>
                      {item.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{item.notes}</p>
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
