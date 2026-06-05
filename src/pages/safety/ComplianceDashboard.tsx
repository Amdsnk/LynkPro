import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { ComplianceTracking } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { calculateComplianceScore, generateComplianceReport, getComplianceScoreColor } from '@/lib/complianceEngine';

export default function ComplianceDashboard() {
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState<ComplianceTracking[]>([]);

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

      const { data, error } = await supabase
        .from('compliance_tracking')
        .select('*, projects(name)')
        .eq('firm_id', profile.firm_id);

      if (error) throw error;
      setTracking(data || []);
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
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const report = generateComplianceReport(tracking, []);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Compliance Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Firm-wide compliance overview and analytics
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Compliance Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getComplianceScoreColor(report.score)}`}>
                {report.score}%
              </div>
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
              <div className="text-3xl font-bold text-green-600">{report.compliant}</div>
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
              <div className="text-3xl font-bold text-destructive">{report.nonCompliant}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Overdue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{report.overdue}</div>
            </CardContent>
          </Card>
        </div>

        {report.upcomingChecks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Checks (Next 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {report.upcomingChecks.map((item) => (
                  <div key={item.id} className="p-3 rounded-lg border">
                    <p className="font-medium">
                      Project: {(item as any).projects?.name || 'Unknown'}
                    </p>
                    {item.next_check_due && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Due: {item.next_check_due}
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
