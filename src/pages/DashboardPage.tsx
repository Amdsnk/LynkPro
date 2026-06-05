import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { KPICard } from '@/components/shared/KPICard';
import { LineChart, BarChart, PieChart, AreaChart } from '@/components/charts';
import { ConnectionStatusIndicator } from '@/components/shared/ConnectionStatus';
import { useRealtimeDashboardMetrics } from '@/hooks/useRealtimeDashboardMetrics';
import { useRealtimeActivity } from '@/hooks/useRealtimeData';
import { useRealtimeConnection } from '@/hooks/useRealtimeConnection';
import { formatDistanceToNow } from 'date-fns';
import { 
  FolderKanban, 
  FileText, 
  Receipt, 
  Users,
  DollarSign,
  TrendingUp,
  Plus,
  ArrowRight,
  Activity,
  AlertCircle
} from 'lucide-react';

export default function DashboardPage() {
  const { profile, isClient } = useAuth();
  
  // Real-time connection status
  const { status: connectionStatus } = useRealtimeConnection('dashboard-main');
  
  // Real-time dashboard metrics
  const {
    metrics,
    revenueData,
    projectStatusData,
    invoiceStatusData,
    loading,
  } = useRealtimeDashboardMetrics(profile?.firm_id, 6);
  
  // Real-time activity feed
  const { activity: recentActivity } = useRealtimeActivity(profile?.firm_id, 10);

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
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-80 bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const projectStatusColors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  return (
    <div className="section-spacing">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="page-title">Dashboard</h1>
            <ConnectionStatusIndicator status={connectionStatus} />
          </div>
          <p className="text-muted-foreground mt-1">
            Welcome back, {profile?.full_name}
          </p>
        </div>
        {!isClient && (
          <div className="flex gap-2">
            <Link to="/projects/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <KPICard
          title="Total Projects"
          value={metrics?.totalProjects || 0}
          icon={FolderKanban}
          description={`${metrics?.activeProjects || 0} active`}
        />
        <KPICard
          title="Total Clients"
          value={metrics?.totalClients || 0}
          icon={Users}
        />
        <KPICard
          title="Pending Proposals"
          value={metrics?.pendingProposals || 0}
          icon={FileText}
        />
        <KPICard
          title="Total Revenue"
          value={metrics?.totalRevenue || 0}
          prefix="$"
          decimals={2}
          icon={DollarSign}
          description={`${metrics?.paidInvoices || 0} paid invoices`}
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
                height={300}
              />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>No revenue data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5" />
              Project Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projectStatusData.length > 0 ? (
              <PieChart
                data={projectStatusData}
                colors={projectStatusColors}
                height={300}
                innerRadius={60}
              />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>No projects yet</p>
                  <Link to="/projects/new">
                    <Button variant="outline" size="sm" className="mt-2">
                      Create First Project
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Status by Month */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Invoice Status
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
                height={300}
                stacked
              />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>No invoice data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <Link to="/admin">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 text-sm">
                    <div className="mt-0.5">
                      {activity.entity_type === 'project' && <FolderKanban className="h-4 w-4 text-muted-foreground" />}
                      {activity.entity_type === 'proposal' && <FileText className="h-4 w-4 text-muted-foreground" />}
                      {activity.entity_type === 'invoice' && <Receipt className="h-4 w-4 text-muted-foreground" />}
                      {activity.entity_type === 'report' && <FileText className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-foreground">
                        <span className="font-medium">{activity.user?.full_name || 'User'}</span>
                        {' '}
                        <span className="text-muted-foreground">{activity.action}</span>
                        {' '}
                        <span className="text-muted-foreground">{activity.entity_type}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>No recent activity</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {!isClient && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Link to="/projects/new">
                <Button variant="outline" className="w-full justify-start">
                  <FolderKanban className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </Link>
              <Link to="/proposals/new">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  New Proposal
                </Button>
              </Link>
              <Link to="/invoices/new">
                <Button variant="outline" className="w-full justify-start">
                  <Receipt className="mr-2 h-4 w-4" />
                  New Invoice
                </Button>
              </Link>
              <Link to="/reports/new">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  New Report
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
