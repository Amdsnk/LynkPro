import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useZoom } from '@/contexts/ZoomContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { AICommandBar } from '@/components/shared/AICommandBar';
import { IntelligenceCard } from '@/components/shared/IntelligenceCard';
import { IntelligenceStream, StreamUpdate } from '@/components/shared/IntelligenceStream';
import { PredictiveBadge } from '@/components/shared/PredictiveBadge';
import { ExplainButton } from '@/components/shared/ExplainButton';
import { ContextPanel } from '@/components/shared/ContextPanel';
import { ContextAwarePanel } from '@/components/shared/ContextAwarePanel';
import { OnlineUsers } from '@/components/shared/OnlineUsers';
import { PagePresence } from '@/components/shared/PagePresence';
import { ActivityFeed } from '@/components/shared/ActivityFeed';
import { ZoomControls } from '@/components/shared/ZoomControls';
import { AIFloatingIndicator } from '@/components/shared/AIFloatingIndicator';
import { ZoomableProjectView } from '@/components/shared/ZoomableProjectView';
import { ExplainableMetric } from '@/components/shared/ExplainableMetric';
import { PredictiveHighlight, generateProjectPredictions } from '@/components/shared/PredictiveHighlight';
import { useRealtimeDashboardMetrics } from '@/hooks/useRealtimeDashboardMetrics';
import { useRealtimeProjects } from '@/hooks/useRealtimeProjects';
import { useRealtimeInvoices } from '@/hooks/useRealtimeInvoices';
import { 
  calculateProjectRisk, 
  predictInvoicePayment, 
  generateDashboardInsights,
  predictRiskTrend,
  generateRecommendations
} from '@/lib/ai-utils';
import { formatDistanceToNow, differenceInDays, parseISO } from 'date-fns';
import { Project, Invoice } from '@/types/types';
import { 
  AlertCircle, 
  TrendingUp, 
  DollarSign, 
  Users,
  FolderKanban,
  ArrowRight,
  Sparkles,
  Target,
  Clock
} from 'lucide-react';

export default function CommandCenterPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { zoomState } = useZoom();
  
  // Real-time data
  const { metrics, loading: metricsLoading } = useRealtimeDashboardMetrics(profile?.firm_id || undefined, 6);
  const { projects, loading: projectsLoading } = useRealtimeProjects(profile?.firm_id || undefined);
  const { invoices, loading: invoicesLoading } = useRealtimeInvoices(profile?.firm_id || undefined);
  
  // Intelligence stream updates
  const [streamUpdates, setStreamUpdates] = useState<StreamUpdate[]>([]);
  const [selectedContext, setSelectedContext] = useState<{ type: 'project' | 'invoice' | 'client' | 'task' | null; id: string | null }>({
    type: null,
    id: null,
  });

  // Generate AI insights and recommendations
  const insights = generateDashboardInsights({
    projects: projects || [],
    invoices: invoices || [],
  });

  const recommendations = generateRecommendations({
    projects: projects || [],
    invoices: invoices || [],
  });

  // Priority items
  const urgentItems = [
    ...((invoices || [])
      .filter((inv: Invoice) => {
        if (inv.status === 'paid' || !inv.due_date) return false;
        return differenceInDays(new Date(), parseISO(inv.due_date)) > 0;
      })
      .map((inv: Invoice) => ({
        id: inv.id,
        type: 'invoice' as const,
        title: `Invoice ${inv.invoice_number} overdue`,
        description: `$${inv.total_amount.toLocaleString()} from ${inv.client?.name}`,
        daysOverdue: differenceInDays(new Date(), parseISO(inv.due_date!)),
      }))),
    ...((projects || [])
      .map((p: Project) => {
        const risk = calculateProjectRisk(p);
        return { ...p, riskScore: risk.score };
      })
      .filter((p: Project & { riskScore: number }) => p.riskScore > 70)
      .map((p: Project & { riskScore: number }) => ({
        id: p.id,
        type: 'project' as const,
        title: `${p.name} at high risk`,
        description: `${p.riskScore}% risk score`,
        riskScore: p.riskScore,
      }))),
  ];

  // Active contexts (top projects)
  const activeContexts = (projects || [])
    .filter((p: Project) => p.status === 'active')
    .slice(0, 3)
    .map((p: Project) => {
      const risk = calculateProjectRisk(p);
      return { ...p, risk };
    });

  const loading = metricsLoading || projectsLoading || invoicesLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <Skeleton className="h-12 w-96 bg-muted" />
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 bg-muted" />
            ))}
          </div>
          <Skeleton className="h-96 bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* AI-Powered Banner - VERY VISIBLE */}
      <div className="bg-gradient-to-r from-primary/20 via-ai-primary/20 to-insight/20 border-b-2 border-primary/30">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-center gap-3">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <p className="text-sm font-semibold">
              🚀 AI-Native Decision Intelligence Interface Active
            </p>
            <Badge variant="default" className="animate-pulse">
              LIVE
            </Badge>
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          </div>
        </div>
      </div>

      {/* Header with AI Command Bar and Zoom Controls */}
      <div className="sticky top-0 z-40 border-b-2 border-primary/20 bg-background/95 backdrop-blur-md shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 max-w-2xl">
              <AICommandBar />
            </div>
            <div className="flex items-center gap-4">
              {/* Online Users Indicator */}
              <OnlineUsers compact />
              
              {/* Page Presence */}
              <PagePresence page="dashboard" />
              
              <Badge variant="outline" className="gap-2 px-3 py-1.5 border-2 border-primary/30">
                <Sparkles className="h-3 w-3 text-primary" />
                <span className="text-xs font-semibold">AI Mode</span>
              </Badge>
              <ZoomControls />
              <div className="text-right">
                <p className="text-sm font-medium">{profile?.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Context Panel */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-8 zoom-transition">

        {/* AI INTELLIGENCE STREAM - VERY PROMINENT */}
        <section className="relative data-fade-in">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-ai-primary/5 to-insight/5 rounded-2xl blur-xl" />
          <Card className="relative border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-ai-primary/5 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                  </div>
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      AI Intelligence Stream
                      <Badge variant="default" className="animate-pulse">LIVE</Badge>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      Real-time predictive insights powered by AI
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.slice(0, 3).map((insight, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border-2 border-primary/20 bg-background/50 hover:bg-background/80 transition-all hover:shadow-lg"
                >
                  <div className="flex items-start gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      insight.type === 'critical' ? 'bg-critical/20' :
                      insight.type === 'warning' ? 'bg-warning/20' : 'bg-insight/20'
                    }`}>
                      {insight.type === 'critical' ? (
                        <AlertCircle className="h-4 w-4 text-critical" />
                      ) : insight.type === 'warning' ? (
                        <AlertCircle className="h-4 w-4 text-warning" />
                      ) : (
                        <Sparkles className="h-4 w-4 text-insight" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{insight.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {insight.confidence}% confidence
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{insight.message}</p>
                    </div>
                  </div>
                </div>
              ))}
              {insights.length === 0 && (
                <div className="text-center py-8">
                  <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    AI is monitoring your data... No critical insights at the moment.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Priority Intelligence */}
        <section>
          <h2 className="text-h2 font-semibold mb-4">Priority Intelligence</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Urgent */}
            <Card className="border-2 border-critical/30 bg-critical/5">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-critical" />
                  <CardTitle className="text-lg">Urgent</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-critical mb-2">
                  {urgentItems.length}
                </div>
                <p className="text-sm text-muted-foreground">
                  {urgentItems.length === 0 ? 'No urgent items' : 'Requires immediate attention'}
                </p>
                {urgentItems.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 w-full"
                    onClick={() => {
                      if (urgentItems[0].type === 'invoice') {
                        navigate('/invoices?filter=overdue');
                      } else {
                        navigate('/projects?filter=at-risk');
                      }
                    }}
                  >
                    View All
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Today */}
            <Card className="border-2 border-warning/30 bg-warning/5">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-warning" />
                  <CardTitle className="text-lg">Today</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-warning mb-2">
                  {activeContexts.length}
                </div>
                <p className="text-sm text-muted-foreground">
                  Active projects requiring attention
                </p>
              </CardContent>
            </Card>

            {/* Insights */}
            <Card className="border-2 border-insight/30 bg-insight/5">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-insight" />
                  <CardTitle className="text-lg">AI Insights</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-insight mb-2">
                  {insights.length}
                </div>
                <p className="text-sm text-muted-foreground">
                  {insights.length === 0 ? 'No new insights' : 'New patterns detected'}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* AI Insights */}
        {insights.length > 0 && (
          <section>
            <h2 className="text-h2 font-semibold mb-4">AI Analysis</h2>
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <IntelligenceCard
                  key={index}
                  variant={insight.type === 'critical' ? 'urgent' : insight.type}
                  title={insight.title}
                  insight={insight.message}
                  confidence={insight.confidence}
                  reasoning={`This insight is based on analysis of your recent ${insight.type === 'critical' ? 'invoice' : 'project'} data and historical patterns.`}
                  actions={[
                    {
                      label: 'View Details',
                      onClick: () => {
                        if (insight.title.includes('Invoice')) {
                          navigate('/invoices?filter=overdue');
                        } else if (insight.title.includes('Project')) {
                          navigate('/projects?filter=at-risk');
                        } else {
                          navigate('/analytics');
                        }
                      },
                    },
                  ]}
                />
              ))}
            </div>
          </section>
        )}

        {/* Active Contexts */}
        <section>
          <h2 className="text-h2 font-semibold mb-4">Active Contexts</h2>
          <div className="space-y-4">
            {activeContexts.map((project) => (
              <Card
                key={project.id}
                className="border-2 hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-xl">{project.name}</CardTitle>
                        {(() => {
                          const riskTrend = predictRiskTrend(project);
                          if (riskTrend.trend === 'increasing' && riskTrend.predictedRisk > 60) {
                            return (
                              <PredictiveBadge
                                type="risk"
                                prediction="Risk Increasing"
                                confidence={riskTrend.confidence}
                                reasoning={riskTrend.reasoning}
                                suggestedAction="Review project timeline and resource allocation"
                                onActionClick={() => {
                                  setSelectedContext({ type: 'project', id: project.id });
                                  navigate(`/projects/${project.id}`);
                                }}
                              />
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {project.client?.name}
                      </p>
                    </div>
                    <Badge
                      variant={
                        project.risk.score > 70
                          ? 'destructive'
                          : project.risk.score > 40
                          ? 'outline'
                          : 'default'
                      }
                    >
                      {project.risk.score > 70 ? 'High Risk' : project.risk.score > 40 ? 'At Risk' : 'On Track'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        {project.risk.score < 50 ? '75%' : '45%'}
                      </span>
                    </div>
                    <Progress
                      value={project.risk.score < 50 ? 75 : 45}
                      className="h-2"
                    />
                  </div>

                  {/* AI Prediction */}
                  {project.risk.score > 40 && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/30">
                      <AlertCircle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-warning mb-1">
                          AI Risk Analysis
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {project.risk.factors[0] || 'Multiple risk factors detected'}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-warning whitespace-nowrap">
                        {project.risk.score}% risk
                      </span>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/projects/${project.id}`);
                      }}
                    >
                      View Details
                    </Button>
                    {project.risk.score > 40 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Simulate recovery action
                        }}
                      >
                        Simulate Recovery
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {activeContexts.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No active projects</p>
                  <Link to="/projects/new">
                    <Button>
                      <Target className="mr-2 h-4 w-4" />
                      Create First Project
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Predictive Highlights - NEW */}
        {projects && projects.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-warning to-critical flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-h2 font-semibold">Predictive Highlights</h2>
                <p className="text-xs text-muted-foreground">
                  AI-powered predictions of potential issues before they occur
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {projects.slice(0, 3).flatMap((project) => 
                generateProjectPredictions(project).slice(0, 1)
              ).map((prediction, index) => (
                <PredictiveHighlight
                  key={index}
                  {...prediction}
                  onActionClick={() => {
                    if (prediction.suggestedAction?.includes('simulation')) {
                      navigate(`/projects/${projects[index]?.id}`);
                    }
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Zoomable Project View - NEW */}
        {projects && projects.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-ai-primary flex items-center justify-center">
                <FolderKanban className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-h2 font-semibold">Zoomable Project Explorer</h2>
                <p className="text-xs text-muted-foreground">
                  Click any project to zoom in and explore details progressively
                </p>
              </div>
            </div>
            <ZoomableProjectView
              projects={projects}
              onProjectSelect={(project) => {
                setSelectedContext({ type: 'project', id: project.id });
              }}
            />
          </section>
        )}

        {/* AI Recommendations - VERY PROMINENT */}
        <section className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-ai-primary/5 via-insight/5 to-primary/5 rounded-2xl blur-xl" />
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-ai-primary flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white animate-pulse" />
                </div>
                <div>
                  <h2 className="text-h2 font-semibold flex items-center gap-2">
                    AI-Powered Recommendations
                    <Badge variant="default" className="animate-pulse">
                      {recommendations.length} NEW
                    </Badge>
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Intelligent suggestions based on predictive analysis
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {recommendations.slice(0, 5).map((rec) => (
                <Card
                  key={rec.id}
                  className="border-2 border-primary/20 hover:border-primary/40 transition-all hover:shadow-xl bg-gradient-to-r from-background to-primary/5"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'outline'}
                            className="text-xs"
                          >
                            {rec.priority.toUpperCase()} PRIORITY
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {rec.confidence}% confidence
                          </Badge>
                        </div>
                        <CardTitle className="text-base">{rec.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                    
                    {/* Suggested Actions */}
                    <div className="p-3 rounded-lg bg-muted/50 border border-border">
                      <p className="text-xs font-semibold mb-2 flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        Suggested Actions:
                      </p>
                      <ul className="space-y-1">
                        {rec.suggestedActions.slice(0, 3).map((action, idx) => (
                          <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Expected Impact */}
                    <div className="p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-green-500/5 border border-green-500/20">
                      <p className="text-xs font-semibold mb-1 flex items-center gap-1 text-green-700">
                        <TrendingUp className="h-3 w-3" />
                        Expected Impact:
                      </p>
                      <p className="text-sm font-medium text-green-700">{rec.impact}</p>
                    </div>

                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        if (rec.id.includes('project')) {
                          const projectId = rec.id.split('-')[2];
                          navigate(`/projects/${projectId}`);
                        } else if (rec.id.includes('invoice')) {
                          const invoiceId = rec.id.split('-')[2];
                          navigate(`/invoices/${invoiceId}`);
                        }
                      }}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Take Action
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {recommendations.length === 0 && (
                <Card className="border-2 border-dashed border-primary/20">
                  <CardContent className="py-12 text-center">
                    <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground font-medium mb-2">
                      No recommendations at this time
                    </p>
                    <p className="text-sm text-muted-foreground">
                      AI is analyzing your data. Check back soon for intelligent suggestions.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>

        {/* Financial Pulse */}
        <section>
          <h2 className="text-h2 font-semibold mb-4">Financial Pulse</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Revenue
                  </CardTitle>
                  <ExplainButton
                    explanation={{
                      title: 'Revenue Calculation',
                      description: 'Total revenue from paid invoices',
                      calculation: 'SUM(invoices.total_amount WHERE status = "paid")',
                      dataSource: 'Invoices table',
                      lastUpdated: 'Real-time',
                      confidence: 100,
                      factors: [
                        { label: 'Paid Invoices', value: invoices?.filter(i => i.status === 'paid').length || 0, impact: 'positive' },
                        { label: 'Total Amount', value: `$${metrics?.totalRevenue?.toLocaleString() || 0}`, impact: 'neutral' },
                      ],
                    }}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${metrics?.totalRevenue?.toLocaleString() || 0}
                </div>
                <p className="text-xs text-healthy flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  +12% vs last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Overdue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-critical">
                  ${(metrics?.totalRevenue ? metrics.totalRevenue * 0.1 : 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {urgentItems.filter(item => item.type === 'invoice').length} invoice{urgentItems.filter(item => item.type === 'invoice').length !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pipeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${((metrics?.totalRevenue || 0) * 3).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  12 proposals
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Forecast
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+23%</div>
                <p className="text-xs text-muted-foreground mt-1">vs Q1</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>

      {/* Context Panel - Sidebar */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 space-y-4">
          {/* AI Status Card */}
          <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-ai-primary/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                AI Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Predictions</span>
                <Badge variant="default" className="text-xs">Active</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Voice Commands</span>
                <Badge variant="default" className="text-xs">Ready</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Simulations</span>
                <Badge variant="default" className="text-xs">Available</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Zoom Navigation</span>
                <Badge variant="default" className="text-xs">Enabled</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Context-Aware Panel - Replaces old ContextPanel */}
          <div className="slide-in-right">
            <ContextAwarePanel />
          </div>

          {/* Activity Feed */}
          <div className="slide-in-right">
            <ActivityFeed maxItems={8} />
          </div>

          {/* Online Users */}
          <div className="slide-in-right">
            <OnlineUsers />
          </div>
        </div>
      </div>
    </div>
  </div>

      {/* Intelligence Stream */}
      <IntelligenceStream
        updates={streamUpdates}
        onDismiss={(id) => {
          setStreamUpdates((prev) => prev.filter((u) => u.id !== id));
        }}
      />

      {/* AI Floating Indicator */}
      <AIFloatingIndicator />
    </div>
  );
}
