import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { ProductivityMetric } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, TrendingUp, Target, Award, Cloud, CloudRain, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { aggregateProductivityByTrade, getWeatherImpact } from '@/lib/productivityCalculations';
import { format, subDays, startOfWeek, startOfMonth } from 'date-fns';

export default function ProductivityDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<ProductivityMetric[]>([]);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('week');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [tradeFilter, setTradeFilter] = useState<string>('all');
  const [projects, setProjects] = useState<any[]>([]);

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
        case 'today':
          startDate = today;
          break;
        case 'week':
          startDate = startOfWeek(today);
          break;
        case 'month':
          startDate = startOfMonth(today);
          break;
        default:
          startDate = subDays(today, 7);
      }

      // Fetch productivity metrics
      let query = supabase
        .from('productivity_metrics')
        .select('*')
        .eq('firm_id', profile.firm_id)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .order('date', { ascending: true });

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
      console.error('Error fetching productivity data:', error);
      toast.error('Failed to load productivity dashboard');
    } finally {
      setLoading(false);
    }
  }

  // Calculate KPIs
  const totalHours = metrics.reduce((sum, m) => sum + m.hours_worked, 0);
  const totalUnits = metrics.reduce((sum, m) => sum + m.units_completed, 0);
  const avgProductivityRate = metrics.length > 0
    ? metrics.reduce((sum, m) => sum + m.productivity_rate, 0) / metrics.length
    : 0;

  // Productivity by trade
  const byTrade = aggregateProductivityByTrade(metrics);
  const topTrade = Object.entries(byTrade).sort((a, b) => b[1].avgRate - a[1].avgRate)[0];
  const bottomTrade = Object.entries(byTrade).sort((a, b) => a[1].avgRate - b[1].avgRate)[0];

  // Weather impact
  const weatherImpact = getWeatherImpact(metrics);

  // Unique trades
  const uniqueTrades = Array.from(new Set(metrics.map(m => m.trade).filter(Boolean)));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading productivity dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Productivity Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Real-time productivity metrics and performance insights
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Date Range</label>
                <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
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
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Avg Productivity Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{avgProductivityRate.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">units per hour</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Total Hours Worked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalHours.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {dateRange === 'today' ? 'today' : dateRange === 'week' ? 'this week' : 'this month'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Total Units Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalUnits.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                across all projects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Award className="h-4 w-4" />
                Top Performing Trade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate">
                {topTrade ? topTrade[0] : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {topTrade ? `${topTrade[1].avgRate.toFixed(2)} units/hr` : 'No data'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Productivity by Trade */}
        <Card>
          <CardHeader>
            <CardTitle>Productivity by Trade</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(byTrade).length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No productivity data available for the selected filters</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(byTrade)
                  .sort((a, b) => b[1].avgRate - a[1].avgRate)
                  .map(([trade, data]) => (
                    <div key={trade} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{trade}</span>
                        <span className="text-sm text-muted-foreground">
                          {data.avgRate.toFixed(2)} units/hr
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{
                            width: `${Math.min((data.avgRate / (topTrade?.[1].avgRate || 1)) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{data.totalHours.toFixed(1)} hours</span>
                        <span>{data.totalUnits.toFixed(1)} units</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weather Impact */}
        <Card>
          <CardHeader>
            <CardTitle>Weather Impact Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Sun className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium">Sunny</span>
                </div>
                <div className="text-2xl font-bold">{weatherImpact.sunny.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">units per hour</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Cloud className="h-5 w-5 text-gray-500" />
                  <span className="font-medium">Cloudy</span>
                </div>
                <div className="text-2xl font-bold">{weatherImpact.cloudy.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">units per hour</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CloudRain className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">Rainy</span>
                </div>
                <div className="text-2xl font-bold">{weatherImpact.rainy.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">units per hour</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Trade</CardTitle>
            </CardHeader>
            <CardContent>
              {topTrade ? (
                <div className="space-y-4">
                  <div className="text-2xl font-bold">{topTrade[0]}</div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Productivity Rate</p>
                      <p className="font-semibold">{topTrade[1].avgRate.toFixed(2)} units/hr</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Hours</p>
                      <p className="font-semibold">{topTrade[1].totalHours.toFixed(1)} hrs</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Units</p>
                      <p className="font-semibold">{topTrade[1].totalUnits.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Data Points</p>
                      <p className="font-semibold">{topTrade[1].count}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No data available</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bottom Performing Trade</CardTitle>
            </CardHeader>
            <CardContent>
              {bottomTrade ? (
                <div className="space-y-4">
                  <div className="text-2xl font-bold">{bottomTrade[0]}</div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Productivity Rate</p>
                      <p className="font-semibold">{bottomTrade[1].avgRate.toFixed(2)} units/hr</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Hours</p>
                      <p className="font-semibold">{bottomTrade[1].totalHours.toFixed(1)} hrs</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Units</p>
                      <p className="font-semibold">{bottomTrade[1].totalUnits.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Data Points</p>
                      <p className="font-semibold">{bottomTrade[1].count}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No data available</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
