import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useZoom } from '@/contexts/ZoomContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { getProject, updateProject } from '@/lib/api';
import { AuditLogList } from '@/components/shared/AuditLogList';
import { FileUpload } from '@/components/files/FileUpload';
import { FileList } from '@/components/files/FileList';
import { TimeTracker } from '@/components/features/TimeTracker';
import { ZoomControls } from '@/components/shared/ZoomControls';
import { SimulationPanel } from '@/components/shared/SimulationPanel';
import { PredictiveBadge } from '@/components/shared/PredictiveBadge';
import { ExplainButton } from '@/components/shared/ExplainButton';
import { PagePresence } from '@/components/shared/PagePresence';
import { predictRiskTrend, calculateProjectRisk } from '@/lib/ai-utils';
import type { Project } from '@/types/types';
import { ArrowLeft, Edit, FolderOpen, FileText, Activity, StickyNote, Loader2, Play, Sparkles } from 'lucide-react';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isClient, profile } = useAuth();
  const { zoomState, zoomTo } = useZoom();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [fileRefreshKey, setFileRefreshKey] = useState(0);
  const [showSimulation, setShowSimulation] = useState(false);

  useEffect(() => {
    if (id) {
      zoomTo('detail', id, 'project');
    }
  }, [id, zoomTo]);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;
      try {
        const data = await getProject(id);
        if (data) {
          setProject(data);
          setNotes(data.internal_notes || '');
        }
      } catch (error) {
        console.error('Error fetching project:', error);
        toast.error('Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  const handleSaveNotes = async () => {
    if (!project) return;
    setSavingNotes(true);
    try {
      await updateProject(project.id, { internal_notes: notes });
      toast.success('Notes saved successfully');
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  if (loading) {
    return (
      <div className="section-spacing">
        <Skeleton className="h-12 w-96 bg-muted" />
        <Skeleton className="h-96 bg-muted" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="empty-state">
        <FolderOpen className="empty-state-icon" />
        <p className="empty-state-title">Project not found</p>
        <Button className="mt-4" onClick={() => navigate('/projects')}>
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="section-spacing">
      {/* AI Features Banner */}
      <div className="mb-6 p-4 rounded-xl border-2 border-primary/30 bg-gradient-to-r from-primary/10 via-ai-primary/10 to-insight/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            </div>
            <div>
              <p className="font-semibold text-sm flex items-center gap-2">
                AI-Enhanced Project View
                <Badge variant="default" className="text-xs">ACTIVE</Badge>
              </p>
              <p className="text-xs text-muted-foreground">
                Predictive analysis, simulation mode, and zoom navigation enabled
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Predictions ON
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Play className="h-3 w-3 mr-1" />
              Simulation Ready
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="page-title">{project.name}</h1>
              {(() => {
                const riskTrend = predictRiskTrend(project);
                const risk = calculateProjectRisk(project);
                if (riskTrend.trend === 'increasing') {
                  return (
                    <PredictiveBadge
                      type="risk"
                      prediction={`Risk ${riskTrend.trend}`}
                      confidence={riskTrend.confidence}
                      reasoning={riskTrend.reasoning}
                      suggestedAction="Consider running a simulation to test recovery scenarios"
                      onActionClick={() => setShowSimulation(true)}
                    />
                  );
                }
                return null;
              })()}
            </div>
            <p className="text-muted-foreground mt-1">
              Created {new Date(project.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PagePresence page={`project-${id}`} />
          <ZoomControls />
          {!isClient && (
            <>
              <Button
                variant={showSimulation ? "default" : "outline"}
                size="sm"
                onClick={() => setShowSimulation(!showSimulation)}
                className={showSimulation ? "animate-pulse" : ""}
              >
                <Play className="h-4 w-4 mr-2" />
                {showSimulation ? 'Simulation Active' : 'Run Simulation'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate(`/projects/${project.id}/timeline`)}>
                View Timeline
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate(`/projects/${project.id}/edit`)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Simulation Panel - VERY PROMINENT */}
      {showSimulation && (
        <div className="mb-6 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-ai-primary/10 rounded-2xl blur-xl" />
          <div className="relative">
            <SimulationPanel
              entityType="project"
              entityId={project.id}
            baselineData={{
              budget: 100000,
              teamSize: 5,
              duration: 60,
            }}
          />
          </div>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="time">Time Tracking</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle className="text-xl">Project Information</CardTitle>
              </CardHeader>
              <CardContent className="content-spacing">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Project Name</p>
                  <p className="font-medium">{project.name}</p>
                </div>
                {project.description && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Description</p>
                    <p className="text-sm">{project.description}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <p className="font-medium capitalize">{project.status}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Created</p>
                  <p className="text-sm">{new Date(project.created_at).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle className="text-xl">Client Information</CardTitle>
              </CardHeader>
              <CardContent className="content-spacing">
                {project.client ? (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Client Name</p>
                      <Link to={`/clients/${project.client.id}`}>
                        <p className="font-medium text-primary hover:underline">
                          {project.client.name}
                        </p>
                      </Link>
                    </div>
                    {project.client.email && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Email</p>
                        <p className="text-sm">{project.client.email}</p>
                      </div>
                    )}
                    {project.client.phone && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Phone</p>
                        <p className="text-sm">{project.client.phone}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No client assigned</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="time">
          <div className="max-w-2xl">
            <TimeTracker projectId={project.id} />
          </div>
        </TabsContent>

        <TabsContent value="files">
          <div className="space-y-6">
            {!isClient && profile && (
              <Card className="card-enhanced">
                <CardHeader>
                  <CardTitle className="text-xl">Upload Files</CardTitle>
                </CardHeader>
                <CardContent>
                  <FileUpload
                    projectId={project.id}
                    userId={profile.id}
                    onUploadComplete={() => setFileRefreshKey(prev => prev + 1)}
                  />
                </CardContent>
              </Card>
            )}

            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle className="text-xl">Files</CardTitle>
              </CardHeader>
              <CardContent>
                <FileList
                  key={fileRefreshKey}
                  projectId={project.id}
                  onFileDeleted={() => setFileRefreshKey(prev => prev + 1)}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notes">
          <Card className="card-enhanced">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Internal Notes</CardTitle>
                <Button size="sm" onClick={handleSaveNotes} disabled={savingNotes}>
                  {savingNotes ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Notes'
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter internal notes about this project..."
                rows={12}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-2">
                These notes are only visible to staff members
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="text-xl">Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <AuditLogList entityType="project" entityId={project.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
