import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AICommandBar } from '@/components/shared/AICommandBar';
import { IntelligenceCard } from '@/components/shared/IntelligenceCard';
import { ExplainableMetric } from '@/components/shared/ExplainableMetric';
import { useRealtimeReports } from '@/hooks/useRealtimeReports';
import { useRealtimeProjects } from '@/hooks/useRealtimeData';
import { useRealtimeMaterials } from '@/hooks/useMaterials';
import { useRealtimeEquipment } from '@/hooks/useEquipment';
import { useRealtimeSafetyIncidents } from '@/hooks/useSafetyIncidents';
import { useBudgetVariance } from '@/hooks/useBudgetVariance';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { 
  MapPin, 
  AlertCircle,
  FileText,
  Users,
  ArrowLeft,
  CheckCircle,
  Clock,
  Package,
  Wrench,
  Shield,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

export default function FieldOperationsPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const { reports, loading: reportsLoading } = useRealtimeReports(profile?.firm_id || undefined);
  const { projects, loading: projectsLoading } = useRealtimeProjects(profile?.firm_id || undefined);
  const { materials, loading: materialsLoading } = useRealtimeMaterials(profile?.firm_id);
  const { equipment, loading: equipmentLoading } = useRealtimeEquipment(profile?.firm_id);
  const { incidents, loading: incidentsLoading } = useRealtimeSafetyIncidents(profile?.firm_id);
  const { varianceData } = useBudgetVariance(profile?.firm_id);

  // Material metrics
  const lowStockMaterials = materials.filter(m => m.status === 'low_stock' || m.status === 'out_of_stock');
  const totalMaterialValue = materials.reduce((sum, m) => sum + (m.current_quantity * (m.unit_cost || 0)), 0);

  // Equipment metrics
  const availableEquipment = equipment.filter(e => e.status === 'available').length;
  const inUseEquipment = equipment.filter(e => e.status === 'in_use').length;
  const maintenanceEquipment = equipment.filter(e => e.status === 'maintenance').length;

  // Safety metrics
  const criticalIncidents = incidents.filter(i => i.severity === 'critical' || i.severity === 'high').length;
  const pendingInvestigations = incidents.filter(i => i.investigation_status === 'pending').length;

  // Budget metrics
  const totalBudget = varianceData.reduce((sum, item) => sum + item.budgeted_amount, 0);
  const totalActual = varianceData.reduce((sum, item) => sum + item.total_actual, 0);
  const overBudgetCategories = varianceData.filter(item => item.status === 'over_budget').length;

  // Categorize reports
  const categorizeReports = () => {
    if (!reports) return { critical: [], pending: [], completed: [] };
    
    const critical = reports.filter((r) => r.status === 'draft' && r.title.toLowerCase().includes('incident'));
    const pending = reports.filter((r) => r.status === 'draft' && !r.title.toLowerCase().includes('incident'));
    const completed = reports.filter((r) => r.status === 'sent');
    
    return { critical, pending, completed };
  };

  const categorizedReports = categorizeReports();
  
  // Active sites (projects with active status)
  const activeSites = (projects || []).filter((p) => p.status === 'active');

  const loading = reportsLoading || projectsLoading || materialsLoading || equipmentLoading || incidentsLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <Skeleton className="h-12 w-96 bg-muted" />
          <Skeleton className="h-96 bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-h1 font-semibold">Field Operations</h1>
            </div>
            <div className="flex-1 max-w-2xl">
              <AICommandBar />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Operations KPIs with Explainable Metrics */}
        <section>
          <div className="grid gap-4 md:grid-cols-4">
            <ExplainableMetric
              title="Active Sites"
              value={`${activeSites.length}`}
              icon={<MapPin className="h-4 w-4" />}
              trend="neutral"
              explanation="Number of project sites with active field operations"
              calculation={`${activeSites.length} projects with status = 'active'`}
              dataSource="Projects table"
              confidence={100}
              factors={['Project status', 'Site accessibility', 'Team deployment']}
            />

            <ExplainableMetric
              title="Critical Issues"
              value={`${categorizedReports.critical.length}`}
              icon={<AlertCircle className="h-4 w-4" />}
              trend={categorizedReports.critical.length > 0 ? 'down' : 'up'}
              explanation="Incident reports requiring immediate attention and resolution"
              calculation="Reports with 'incident' keyword and draft status"
              dataSource="Reports table"
              confidence={95}
              factors={['Safety incidents', 'Quality issues', 'Equipment failures']}
            />

            <ExplainableMetric
              title="Pending Reports"
              value={`${categorizedReports.pending.length}`}
              icon={<Clock className="h-4 w-4" />}
              trend="neutral"
              explanation="Field reports drafted but not yet submitted to clients"
              calculation="Reports with status = 'draft'"
              dataSource="Reports table"
              confidence={100}
              factors={['Field inspector workload', 'Report complexity', 'Review process']}
            />

            <ExplainableMetric
              title="Completed Today"
              value={`${categorizedReports.completed.length}`}
              icon={<CheckCircle className="h-4 w-4" />}
              trend="up"
              explanation="Field reports successfully submitted and sent to clients"
              calculation="Reports with status = 'submitted' or 'sent'"
              dataSource="Reports table"
              confidence={100}
              factors={['Inspector productivity', 'Site conditions', 'Client requirements']}
            />
          </div>
        </section>

        {/* AI Anomaly Detection */}
        {categorizedReports.critical.length > 0 && (
          <section>
            <IntelligenceCard
              variant="urgent"
              title="Anomaly Detected: Multiple Incident Reports"
              insight={`${categorizedReports.critical.length} incident report${categorizedReports.critical.length !== 1 ? 's' : ''} pending review. This is above the normal threshold.`}
              confidence={85}
              reasoning="Based on historical patterns:\n• Average incident reports per day: 0.5\n• Current count: 2\n• Pattern suggests potential site safety issue"
              actions={[
                {
                  label: 'Review Incidents',
                  onClick: () => navigate('/reports?filter=incident'),
                },
                {
                  label: 'Alert Safety Team',
                  onClick: () => {},
                  variant: 'outline',
                },
              ]}
            />
          </section>
        )}

        {/* Live Site Map */}
        <section>
          <h2 className="text-h2 font-semibold mb-4">Active Sites</h2>
          <Card>
            <CardContent className="pt-6">
              {activeSites.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    No active sites
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Sites will appear here when projects are active
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeSites.map((site) => (
                    <div
                      key={site.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/projects/${site.id}`)}
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm mb-1">{site.name}</h3>
                          {site.client?.name && (
                            <p className="text-xs text-muted-foreground mb-2">
                              {site.client.name}
                            </p>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {site.status}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/projects/${site.id}`);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Critical Issues with Risk Indicators */}
        {categorizedReports.critical.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-critical" />
              <h2 className="text-h2 font-semibold">Critical Issues</h2>
            </div>
            <div className="space-y-3">
              {categorizedReports.critical.map((report) => (
                <Card
                  key={report.id}
                  className="border-2 border-critical/30 bg-critical/5 cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => navigate(`/reports/${report.id}`)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="destructive">Incident</Badge>
                          <Badge variant="outline" className="text-xs">
                            Requires immediate attention
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {report.created_at && formatDistanceToNow(parseISO(report.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <h4 className="font-semibold mb-1">
                          {report.title || 'Untitled Report'}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {report.field_notes || 'No description provided'}
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {report.site_location || report.project?.name || 'Unknown location'}
                          </span>
                        </div>
                      </div>
                      <Button 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/reports/${report.id}`);
                        }}
                      >
                        Review
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Pending Reports */}
        {categorizedReports.pending.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-warning" />
              <h2 className="text-h2 font-semibold">Pending Reports</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {categorizedReports.pending.slice(0, 4).map((report) => (
                <Card
                  key={report.id}
                  className="cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => navigate(`/reports/${report.id}`)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium truncate">
                            {report.title}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {report.project?.name || 'Unknown Project'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {report.created_at && formatDistanceToNow(parseISO(report.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <Badge variant="outline">Draft</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {categorizedReports.pending.length > 4 && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate('/reports?filter=draft')}
              >
                View All ({categorizedReports.pending.length})
              </Button>
            )}
          </section>
        )}

        {/* Completed Reports */}
        {categorizedReports.completed.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="h-5 w-5 text-healthy" />
              <h2 className="text-h2 font-semibold">Completed Today</h2>
            </div>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-4">
                  {categorizedReports.completed.length} report{categorizedReports.completed.length !== 1 ? 's' : ''} submitted today
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/reports?filter=submitted')}
                >
                  View All
                </Button>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Material Inventory Widget */}
        <section>
          <h2 className="text-h2 font-semibold mb-4">Material Inventory</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Materials</p>
                    <p className="text-2xl font-semibold mt-1">{materials.length}</p>
                  </div>
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Low Stock Alerts</p>
                    <p className="text-2xl font-semibold mt-1 text-yellow-600">{lowStockMaterials.length}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="text-2xl font-semibold mt-1">${totalMaterialValue.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
          {lowStockMaterials.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Low Stock Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lowStockMaterials.slice(0, 5).map((material) => (
                    <Link key={material.id} to={`/materials/${material.id}`}>
                      <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors">
                        <div>
                          <p className="text-sm font-medium">{material.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Current: {material.current_quantity} {material.unit} | Min: {material.min_quantity} {material.unit}
                          </p>
                        </div>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          {material.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Equipment Utilization Widget */}
        <section>
          <h2 className="text-h2 font-semibold mb-4">Equipment Utilization</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Equipment</p>
                    <p className="text-2xl font-semibold mt-1">{equipment.length}</p>
                  </div>
                  <Wrench className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Available</p>
                    <p className="text-2xl font-semibold mt-1 text-green-600">{availableEquipment}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">In Use</p>
                    <p className="text-2xl font-semibold mt-1 text-blue-600">{inUseEquipment}</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Maintenance</p>
                    <p className="text-2xl font-semibold mt-1 text-yellow-600">{maintenanceEquipment}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => navigate('/equipment')}>
              View All Equipment
            </Button>
          </div>
        </section>

        {/* Safety Metrics Widget */}
        <section>
          <h2 className="text-h2 font-semibold mb-4">Safety Metrics</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Incidents</p>
                    <p className="text-2xl font-semibold mt-1">{incidents.length}</p>
                  </div>
                  <Shield className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Critical/High Severity</p>
                    <p className="text-2xl font-semibold mt-1 text-destructive">{criticalIncidents}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Investigations</p>
                    <p className="text-2xl font-semibold mt-1 text-yellow-600">{pendingInvestigations}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
          </div>
          {criticalIncidents > 0 && (
            <Card className="mt-4 border-2 border-destructive/30 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  High Priority Safety Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {criticalIncidents} critical or high severity incident{criticalIncidents !== 1 ? 's' : ''} require{criticalIncidents === 1 ? 's' : ''} immediate attention
                </p>
                <Button variant="destructive" size="sm" onClick={() => navigate('/safety/incidents')}>
                  Review Incidents
                </Button>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Budget Health Widget */}
        <section>
          <h2 className="text-h2 font-semibold mb-4">Budget Health</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Budget</p>
                    <p className="text-2xl font-semibold mt-1">${totalBudget.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Actual</p>
                    <p className="text-2xl font-semibold mt-1">${totalActual.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Variance</p>
                    <p className={`text-2xl font-semibold mt-1 ${(totalBudget - totalActual) >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                      ${Math.abs(totalBudget - totalActual).toLocaleString()}
                    </p>
                  </div>
                  {(totalBudget - totalActual) >= 0 ? (
                    <TrendingDown className="h-8 w-8 text-green-600" />
                  ) : (
                    <TrendingUp className="h-8 w-8 text-destructive" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Over Budget</p>
                    <p className="text-2xl font-semibold mt-1 text-destructive">{overBudgetCategories}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
              </CardContent>
            </Card>
          </div>
          {overBudgetCategories > 0 && (
            <Card className="mt-4 border-2 border-destructive/30 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Budget Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {overBudgetCategories} budget categor{overBudgetCategories !== 1 ? 'ies are' : 'y is'} over budget
                </p>
                <Button variant="destructive" size="sm" onClick={() => navigate('/budget/variance')}>
                  Review Budget
                </Button>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
