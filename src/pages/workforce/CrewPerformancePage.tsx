import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { ProductivityMetric } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { toast } from 'sonner';
import { calculateProductivityTrend } from '@/lib/productivityCalculations';

interface CrewData {
  crew_id: string;
  crew_name: string;
  totalHours: number;
  totalUnits: number;
  avgRate: number;
  projectCount: number;
  trend: 'up' | 'down' | 'stable';
  metrics: ProductivityMetric[];
}

export default function CrewPerformancePage() {
  const [loading, setLoading] = useState(true);
  const [crews, setCrews] = useState<CrewData[]>([]);
  const [selectedCrew, setSelectedCrew] = useState<CrewData | null>(null);

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

      // Fetch productivity metrics with crew_id
      const { data: metricsData, error: metricsError } = await supabase
        .from('productivity_metrics')
        .select('*')
        .eq('firm_id', profile.firm_id)
        .not('crew_id', 'is', null)
        .order('date', { ascending: true });

      if (metricsError) throw metricsError;

      // Group by crew
      const crewMap: Record<string, CrewData> = {};
      
      (metricsData || []).forEach((metric) => {
        const crewId = metric.crew_id!;
        if (!crewMap[crewId]) {
          crewMap[crewId] = {
            crew_id: crewId,
            crew_name: `Crew ${crewId.substring(0, 8)}`,
            totalHours: 0,
            totalUnits: 0,
            avgRate: 0,
            projectCount: 0,
            trend: 'stable',
            metrics: [],
          };
        }
        
        crewMap[crewId].totalHours += metric.hours_worked;
        crewMap[crewId].totalUnits += metric.units_completed;
        crewMap[crewId].metrics.push(metric);
      });

      // Calculate averages and trends
      const crewsArray = Object.values(crewMap).map((crew) => {
        crew.avgRate = crew.totalHours > 0 ? crew.totalUnits / crew.totalHours : 0;
        crew.projectCount = new Set(crew.metrics.map(m => m.project_id)).size;
        crew.trend = calculateProductivityTrend(crew.metrics);
        return crew;
      });

      // Sort by average rate
      crewsArray.sort((a, b) => b.avgRate - a.avgRate);

      setCrews(crewsArray);
      if (crewsArray.length > 0) {
        setSelectedCrew(crewsArray[0]);
      }
    } catch (error) {
      console.error('Error fetching crew performance:', error);
      toast.error('Failed to load crew performance data');
    } finally {
      setLoading(false);
    }
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendBadge = (trend: 'up' | 'down' | 'stable') => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive'; text: string }> = {
      up: { variant: 'default', text: 'Improving' },
      down: { variant: 'destructive', text: 'Declining' },
      stable: { variant: 'secondary', text: 'Stable' },
    };
    const config = variants[trend];
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading crew performance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Crew Performance</h1>
          <p className="text-muted-foreground mt-2">
            Track and compare crew-level productivity metrics
          </p>
        </div>

        {crews.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No crew performance data available. Start tracking productivity metrics with crew assignments.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Crew List */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Crews ({crews.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {crews.map((crew) => (
                    <div
                      key={crew.crew_id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedCrew?.crew_id === crew.crew_id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedCrew(crew)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-medium">{crew.crew_name}</div>
                        {getTrendIcon(crew.trend)}
                      </div>
                      <div className="text-2xl font-bold mb-1">
                        {crew.avgRate.toFixed(2)}
                        <span className="text-sm text-muted-foreground ml-1">units/hr</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{crew.totalHours.toFixed(0)} hrs</span>
                        <span>{crew.projectCount} projects</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Crew Details */}
            <div className="lg:col-span-2 space-y-6">
              {selectedCrew && (
                <>
                  {/* Overview */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{selectedCrew.crew_name}</CardTitle>
                        {getTrendBadge(selectedCrew.trend)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Avg Productivity</p>
                          <p className="text-2xl font-bold">{selectedCrew.avgRate.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">units per hour</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Total Hours</p>
                          <p className="text-2xl font-bold">{selectedCrew.totalHours.toFixed(1)}</p>
                          <p className="text-xs text-muted-foreground">hours worked</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Total Units</p>
                          <p className="text-2xl font-bold">{selectedCrew.totalUnits.toFixed(1)}</p>
                          <p className="text-xs text-muted-foreground">units completed</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Projects</p>
                          <p className="text-2xl font-bold">{selectedCrew.projectCount}</p>
                          <p className="text-xs text-muted-foreground">total projects</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Performance by Trade */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance by Trade</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const byTrade: Record<string, { hours: number; units: number; count: number }> = {};
                        selectedCrew.metrics.forEach((m) => {
                          const trade = m.trade || 'Unknown';
                          if (!byTrade[trade]) {
                            byTrade[trade] = { hours: 0, units: 0, count: 0 };
                          }
                          byTrade[trade].hours += m.hours_worked;
                          byTrade[trade].units += m.units_completed;
                          byTrade[trade].count += 1;
                        });

                        const trades = Object.entries(byTrade)
                          .map(([trade, data]) => ({
                            trade,
                            avgRate: data.hours > 0 ? data.units / data.hours : 0,
                            hours: data.hours,
                            units: data.units,
                            count: data.count,
                          }))
                          .sort((a, b) => b.avgRate - a.avgRate);

                        return trades.length === 0 ? (
                          <p className="text-muted-foreground text-center py-8">No trade data available</p>
                        ) : (
                          <div className="space-y-4">
                            {trades.map((trade) => (
                              <div key={trade.trade} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{trade.trade}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {trade.avgRate.toFixed(2)} units/hr
                                  </span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                  <div
                                    className="bg-primary rounded-full h-2 transition-all"
                                    style={{
                                      width: `${Math.min((trade.avgRate / (trades[0]?.avgRate || 1)) * 100, 100)}%`,
                                    }}
                                  />
                                </div>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>{trade.hours.toFixed(1)} hours</span>
                                  <span>{trade.count} entries</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedCrew.metrics.slice(-10).reverse().map((metric) => (
                          <div key={metric.id} className="flex items-center justify-between p-3 rounded-lg border">
                            <div>
                              <p className="font-medium">{metric.date}</p>
                              <p className="text-sm text-muted-foreground">{metric.trade || 'Unknown trade'}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{metric.productivity_rate.toFixed(2)} units/hr</p>
                              <p className="text-xs text-muted-foreground">
                                {metric.hours_worked.toFixed(1)} hrs, {metric.units_completed.toFixed(1)} units
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        )}

        {/* Crew Comparison */}
        {crews.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Crew Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {crews.map((crew, index) => (
                  <div key={crew.crew_id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant={index === 0 ? 'default' : 'secondary'}>
                          #{index + 1}
                        </Badge>
                        <span className="font-medium">{crew.crew_name}</span>
                        {getTrendIcon(crew.trend)}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {crew.avgRate.toFixed(2)} units/hr
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{
                          width: `${Math.min((crew.avgRate / (crews[0]?.avgRate || 1)) * 100, 100)}%`,
                        }}
                      />
                    </div>
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
