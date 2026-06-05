import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { ProductivityMetric } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, TrendingDown, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format, subDays, startOfWeek, startOfMonth, parseISO } from 'date-fns';

export default function ProductivityAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<ProductivityMetric[]>([]);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter'>('month');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [tradeFilter, setTradeFilter] = useState<string>('all');
  const [projects, setProjects] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'bottleneck'>('table');

  useEffect(() => {
    fetchData();
  }, [dateRange, projectFilter, tradeFilter]);

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

      // Calculate date range
      let startDate: Date;
      const today = new Date();
      
      switch (dateRange) {
        case 'week':
          startDate = startOfWeek(today);
          break;
        case 'month':
          startDate = startOfMonth(today);
          break;
        case 'quarter':
          startDate = subDays(today, 90);
          break;
        default:
          startDate = subDays(today, 30);
      }

      // Fetch productivity metrics
      let query = supabase
        .from('productivity_metrics')
        .select('*, projects(name)')
        .eq('firm_id', profile.firm_id)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .order('date', { ascending: false });

      if (projectFilter !== 'all') {
        query = query.eq('project_id', projectFilter);
      }

      if (tradeFilter !== 'all') {
        query = query.eq('trade', tradeFilter);
      }

      const { data: metricsData, error: metricsError } = await query;

      if (metricsError) throw metricsError;

      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, name')
        .eq('firm_id', profile.firm_id)
        .order('name');

      if (projectsError) throw projectsError;

      setMetrics(metricsData || []);
      setProjects(projectsData || []);
    } catch (error) {
      console.error('Error fetching productivity analytics:', error);
      toast.error('Failed to load productivity analytics');
    } finally {
      setLoading(false);
    }
  }

  function exportReport() {
    const csv = [
      ['Date', 'Project', 'Trade', 'Crew', 'Hours', 'Units', 'Rate', 'Weather', 'Notes'],
      ...metrics.map(m => [
        m.date,
        (m as any).projects?.name || m.project_id,
        m.trade || '',
        m.crew_id || '',
        m.hours_worked.toString(),
        m.units_completed.toString(),
        m.productivity_rate.toString(),
        m.weather_condition || '',
        m.notes || '',
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `productivity-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
  }

  // Calculate bottlenecks
  const avgProductivity = metrics.length > 0
    ? metrics.reduce((sum, m) => sum + m.productivity_rate, 0) / metrics.length
    : 0;

  const bottlenecks = metrics
    .filter(m => m.productivity_rate < avgProductivity * 0.7) // 30% below average
    .sort((a, b) => a.productivity_rate - b.productivity_rate)
    .slice(0, 10);

  // Unique trades
  const uniqueTrades = Array.from(new Set(metrics.map(m => m.trade).filter(Boolean)));

  // Time series data (group by week)
  const weeklyData: Record<string, { hours: number; units: number; count: number }> = {};
  metrics.forEach((m) => {
    const weekStart = format(startOfWeek(parseISO(m.date)), 'yyyy-MM-dd');
    if (!weeklyData[weekStart]) {
      weeklyData[weekStart] = { hours: 0, units: 0, count: 0 };
    }
    weeklyData[weekStart].hours += m.hours_worked;
    weeklyData[weekStart].units += m.units_completed;
    weeklyData[weekStart].count += 1;
  });

  const weeklyAvg = Object.entries(weeklyData).map(([week, data]) => ({
    week,
    avgRate: data.hours > 0 ? data.units / data.hours : 0,
    hours: data.hours,
    units: data.units,
  })).sort((a, b) => a.week.localeCompare(b.week));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading productivity analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Productivity Analytics</h1>
            <p className="text-muted-foreground mt-2">
              Historical productivity analysis and bottleneck identification
            </p>
          </div>
          <Button onClick={exportReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Date Range</label>
                <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Project</label>
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Trade</label>
                <Select value={tradeFilter} onValueChange={setTradeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Trades</SelectItem>
                    {uniqueTrades.map((trade) => (
                      <SelectItem key={trade} value={trade!}>
                        {trade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">View Mode</label>
                <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="table">Data Table</SelectItem>
                    <SelectItem value="bottleneck">Bottleneck Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Productivity Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyAvg.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No data available for the selected period</p>
              </div>
            ) : (
              <div className="space-y-4">
                {weeklyAvg.map((week) => (
                  <div key={week.week} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Week of {format(parseISO(week.week), 'MMM d, yyyy')}</span>
                      <span className="text-sm text-muted-foreground">
                        {week.avgRate.toFixed(2)} units/hr
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{
                          width: `${Math.min((week.avgRate / (weeklyAvg[0]?.avgRate || 1)) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{week.hours.toFixed(1)} hours</span>
                      <span>{week.units.toFixed(1)} units</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content */}
        {viewMode === 'table' ? (
          <Card>
            <CardHeader>
              <CardTitle>Productivity Data</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No productivity data available</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Date</th>
                        <th className="text-left py-3 px-4 font-medium">Project</th>
                        <th className="text-left py-3 px-4 font-medium">Trade</th>
                        <th className="text-right py-3 px-4 font-medium">Hours</th>
                        <th className="text-right py-3 px-4 font-medium">Units</th>
                        <th className="text-right py-3 px-4 font-medium">Rate</th>
                        <th className="text-left py-3 px-4 font-medium">Weather</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.map((metric) => (
                        <tr key={metric.id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="py-4 px-4">{format(parseISO(metric.date), 'MMM d, yyyy')}</td>
                          <td className="py-4 px-4">{(metric as any).projects?.name || 'Unknown'}</td>
                          <td className="py-4 px-4">{metric.trade || '-'}</td>
                          <td className="py-4 px-4 text-right">{metric.hours_worked.toFixed(1)}</td>
                          <td className="py-4 px-4 text-right">{metric.units_completed.toFixed(1)}</td>
                          <td className="py-4 px-4 text-right">
                            <Badge variant={metric.productivity_rate < avgProductivity * 0.7 ? 'destructive' : 'secondary'}>
                              {metric.productivity_rate.toFixed(2)}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">{metric.weather_condition || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-destructive" />
                Bottleneck Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bottlenecks.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No bottlenecks identified. All productivity is within acceptable range.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-2 p-4 bg-muted/50 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Bottlenecks Identified</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        The following entries show productivity 30% or more below average ({avgProductivity.toFixed(2)} units/hr)
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">Date</th>
                          <th className="text-left py-3 px-4 font-medium">Project</th>
                          <th className="text-left py-3 px-4 font-medium">Trade</th>
                          <th className="text-right py-3 px-4 font-medium">Rate</th>
                          <th className="text-left py-3 px-4 font-medium">Weather</th>
                          <th className="text-left py-3 px-4 font-medium">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bottlenecks.map((metric) => (
                          <tr key={metric.id} className="border-b hover:bg-muted/50 transition-colors">
                            <td className="py-4 px-4">{format(parseISO(metric.date), 'MMM d')}</td>
                            <td className="py-4 px-4">{(metric as any).projects?.name || 'Unknown'}</td>
                            <td className="py-4 px-4">{metric.trade || '-'}</td>
                            <td className="py-4 px-4 text-right">
                              <Badge variant="destructive">{metric.productivity_rate.toFixed(2)}</Badge>
                            </td>
                            <td className="py-4 px-4">{metric.weather_condition || '-'}</td>
                            <td className="py-4 px-4 text-sm text-muted-foreground">
                              {metric.notes || 'No notes'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
