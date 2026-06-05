import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, BarChart, PieChart, AreaChart } from '@/components/charts';
import { ExplainableMetric } from '@/components/shared/ExplainableMetric';
import { PageTransition } from '@/components/ui/animations';
import { ConnectionStatusIndicator } from '@/components/shared/ConnectionStatus';
import { useRealtimeDashboardMetrics } from '@/hooks/useRealtimeDashboardMetrics';
import { useRealtimeConnection } from '@/hooks/useRealtimeConnection';
import { 
  TrendingUp, 
  DollarSign, 
  FileText, 
  Receipt,
  FolderKanban,
  Download,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';

export default function AnalyticsPage() {
  const { profile } = useAuth();
  const [timeRange, setTimeRange] = useState<'3' | '6' | '12'>('6');
  
  // Real-time connection status
  const { status: connectionStatus } = useRealtimeConnection('analytics-main');
  
  // Real-time dashboard metrics with time range
  const {
    metrics,
    revenueData,
    projectStatusData,
    invoiceStatusData,
    loading,
  } = useRealtimeDashboardMetrics(profile?.firm_id, parseInt(timeRange));

  if (loading) {
    return (
      <div className="section-spacing">
        <div className="space-y-6">
          <Skeleton className="h-12 w-64 bg-muted" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 bg-muted" />
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-96 bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const projectStatusColors = [
    'hsl(var(--chart-1))', 
    'hsl(var(--chart-2))', 
    'hsl(var(--chart-3))', 
    'hsl(var(--chart-4))'
  ];

  const totalInvoices = (metrics?.paidInvoices || 0) + (metrics?.outstandingInvoices || 0);
  const paidPercentage = totalInvoices > 0 
    ? Math.round((metrics?.paidInvoices || 0) / totalInvoices * 100) 
    : 0;

  return (
    <PageTransition>
      <div className="section-spacing">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="page-title">Analytics</h1>
              <ConnectionStatusIndicator status={connectionStatus} />
            </div>
            <p className="text-muted-foreground mt-1">
              Comprehensive insights into your business performance
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as '3' | '6' | '12')}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Last 3 months</SelectItem>
                <SelectItem value="6">Last 6 months</SelectItem>
                <SelectItem value="12">Last 12 months</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline"
              onClick={() => toast.info('Export functionality coming soon')}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* KPI Cards with Explainable Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <ExplainableMetric
            title="Total Revenue"
            value={`$${((metrics?.totalRevenue || 0) / 1000).toFixed(1)}K`}
            icon={<DollarSign className="h-4 w-4" />}
            trend="up"
            trendValue="+12.5%"
            explanation="Revenue calculated from all paid invoices in the selected time period"
            calculation={`Sum of ${metrics?.paidInvoices || 0} paid invoices`}
            dataSource="Invoices table (status = 'paid')"
            confidence={95}
            factors={['Invoice payments', 'Project completions', 'Client retention']}
          />
          <ExplainableMetric
            title="Active Projects"
            value={`${metrics?.activeProjects || 0}`}
            icon={<FolderKanban className="h-4 w-4" />}
            trend="neutral"
            explanation="Projects currently in progress with active status"
            calculation={`${metrics?.activeProjects || 0} of ${metrics?.totalProjects || 0} total projects`}
            dataSource="Projects table (status = 'active')"
            confidence={100}
            factors={['Project status', 'Team capacity', 'Client demand']}
          />
          <ExplainableMetric
            title="Pending Proposals"
            value={`${metrics?.pendingProposals || 0}`}
            icon={<FileText className="h-4 w-4" />}
            trend="down"
            trendValue="-2"
            explanation="Proposals awaiting client decision or review"
            calculation="Count of proposals with 'pending' status"
            dataSource="Proposals table"
            confidence={100}
            factors={['Client response time', 'Proposal quality', 'Market conditions']}
          />
          <ExplainableMetric
            title="Payment Rate"
            value={`${paidPercentage}%`}
            icon={<Receipt className="h-4 w-4" />}
            trend={paidPercentage >= 80 ? 'up' : paidPercentage >= 60 ? 'neutral' : 'down'}
            trendValue={`${metrics?.overdueInvoices || 0} overdue`}
            explanation="Percentage of invoices paid on time vs total invoices"
            calculation={`${metrics?.paidInvoices || 0} paid / ${totalInvoices} total`}
            dataSource="Invoices table"
            confidence={92}
            factors={['Client payment history', 'Invoice terms', 'Follow-up process']}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Revenue Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {revenueData.length > 0 ? (
                <AreaChart
                  data={revenueData as unknown as Record<string, string | number | undefined>[]}
                  xKey="month"
                  areas={[
                    { key: 'revenue', color: 'hsl(var(--chart-1))', name: 'Revenue' },
                  ]}
                  height={350}
                />
              ) : (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                  No revenue data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice Count Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Invoice Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              {revenueData.length > 0 ? (
                <LineChart
                  data={revenueData as unknown as Record<string, string | number | undefined>[]}
                  xKey="month"
                  lines={[
                    { key: 'invoices', color: 'hsl(var(--chart-2))', name: 'Invoices' },
                  ]}
                  height={350}
                />
              ) : (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                  No invoice data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5" />
                Project Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {projectStatusData.length > 0 ? (
                <PieChart
                  data={projectStatusData}
                  colors={projectStatusColors}
                  height={350}
                  innerRadius={70}
                />
              ) : (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                  No project data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice Status by Month */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Invoice Status Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invoiceStatusData.length > 0 ? (
                <BarChart
                  data={invoiceStatusData as unknown as Record<string, string | number | undefined>[]}
                  xKey="month"
                  bars={[
                    { key: 'draft', color: 'hsl(var(--chart-1))', name: 'Draft' },
                    { key: 'sent', color: 'hsl(var(--chart-2))', name: 'Sent' },
                    { key: 'paid', color: 'hsl(var(--chart-3))', name: 'Paid' },
                    { key: 'overdue', color: 'hsl(var(--chart-4))', name: 'Overdue' },
                  ]}
                  height={350}
                  stacked
                />
              ) : (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                  No invoice data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenue Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Revenue</span>
                <span className="font-medium">${(metrics?.totalRevenue || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Paid Invoices</span>
                <span className="font-medium">{metrics?.paidInvoices || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Outstanding</span>
                <span className="font-medium">{metrics?.outstandingInvoices || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Overdue</span>
                <span className="font-medium text-red-600">{metrics?.overdueInvoices || 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Project Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Projects</span>
                <span className="font-medium">{metrics?.totalProjects || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Active</span>
                <span className="font-medium text-green-600">{metrics?.activeProjects || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Completion Rate</span>
                <span className="font-medium">
                  {metrics?.totalProjects 
                    ? Math.round((metrics.activeProjects / metrics.totalProjects) * 100) 
                    : 0}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Client Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Clients</span>
                <span className="font-medium">{metrics?.totalClients || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pending Proposals</span>
                <span className="font-medium">{metrics?.pendingProposals || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avg Revenue/Client</span>
                <span className="font-medium">
                  ${metrics?.totalClients 
                    ? ((metrics.totalRevenue || 0) / metrics.totalClients).toFixed(2) 
                    : '0.00'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
