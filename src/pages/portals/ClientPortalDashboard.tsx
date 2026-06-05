import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Eye, 
  Building2, 
  FileText, 
  DollarSign, 
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  paid_amount: number;
  status: string;
  due_date: string;
  issue_date: string;
}

interface Report {
  id: string;
  title: string;
  report_date: string;
  created_at: string;
}

export default function ClientPortalDashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState<{
    client: { id: string; name: string; email: string } | null;
    projects: Project[];
    invoices: Invoice[];
    reports: Report[];
  }>({
    client: null,
    projects: [],
    invoices: [],
    reports: [],
  });

  useEffect(() => {
    async function fetchClientData() {
      if (!profile?.email) return;

      try {
        // Get client record
        const { data: client } = await supabase
          .from('clients')
          .select('id, name, email')
          .eq('email', profile.email)
          .maybeSingle();

        if (!client) {
          setLoading(false);
          return;
        }

        // Get projects for this client
        const { data: projects } = await supabase
          .from('projects')
          .select('*')
          .eq('client_id', client.id)
          .order('created_at', { ascending: false });

        // Get invoices for these projects
        const projectIds = projects?.map(p => p.id) || [];
        const { data: invoices } = await supabase
          .from('invoices')
          .select('*')
          .in('project_id', projectIds)
          .order('issue_date', { ascending: false });

        // Get reports for these projects
        const { data: reports } = await supabase
          .from('reports')
          .select('*')
          .in('project_id', projectIds)
          .order('report_date', { ascending: false })
          .limit(10);

        setClientData({
          client,
          projects: projects || [],
          invoices: invoices || [],
          reports: reports || [],
        });
      } catch (error) {
        console.error('Error fetching client data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchClientData();
  }, [profile?.email]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <Skeleton className="h-12 w-64 bg-muted" />
          <div className="grid gap-6 md:grid-cols-3">
            <Skeleton className="h-32 bg-muted" />
            <Skeleton className="h-32 bg-muted" />
            <Skeleton className="h-32 bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!clientData.client) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center gap-2">
            <Eye className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Client Portal</h1>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Access</h3>
                <p className="text-muted-foreground">
                  Your account is not linked to any client profile. Please contact your project manager.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const totalInvoiced = clientData.invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  const totalPaid = clientData.invoices.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0);
  const outstandingAmount = totalInvoiced - totalPaid;
  const activeProjects = clientData.projects.filter(p => p.status === 'active').length;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Client Portal</h1>
          </div>
          <p className="text-muted-foreground">
            Welcome, {clientData.client.name}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeProjects}</div>
              <p className="text-xs text-muted-foreground">
                {clientData.projects.length} total projects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoiced</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${totalInvoiced.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                ${totalPaid.toLocaleString()} paid
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${outstandingAmount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {clientData.invoices.filter(i => i.status !== 'paid').length} unpaid invoices
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Your Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clientData.projects.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No projects yet</p>
            ) : (
              <div className="space-y-4">
                {clientData.projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <h3 className="font-semibold">{project.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {project.description || 'No description'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Updated {format(new Date(project.updated_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Badge
                      variant={
                        project.status === 'active'
                          ? 'default'
                          : project.status === 'completed'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {project.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clientData.invoices.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No invoices yet</p>
            ) : (
              <div className="space-y-4">
                {clientData.invoices.slice(0, 5).map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      {invoice.status === 'paid' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : invoice.status === 'sent' ? (
                        <Clock className="h-5 w-5 text-yellow-600" />
                      ) : (
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium">{invoice.invoice_number}</p>
                        <p className="text-sm text-muted-foreground">
                          Due {format(new Date(invoice.due_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        ${invoice.total_amount.toLocaleString()}
                      </p>
                      <Badge
                        variant={
                          invoice.status === 'paid'
                            ? 'secondary'
                            : invoice.status === 'sent'
                            ? 'default'
                            : 'outline'
                        }
                      >
                        {invoice.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clientData.reports.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No reports yet</p>
            ) : (
              <div className="space-y-3">
                {clientData.reports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{report.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(report.report_date), 'MMM d, yyyy')}
                        </p>
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
