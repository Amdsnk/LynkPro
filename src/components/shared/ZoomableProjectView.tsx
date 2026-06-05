import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ExplainButton } from './ExplainButton';
import { PredictiveBadge } from './PredictiveBadge';
import { SimulationPanel } from './SimulationPanel';
import { ZoomIn, ZoomOut, Maximize2, ChevronRight, AlertCircle, TrendingUp, Calendar, DollarSign, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Project } from '@/types/types';
import { calculateProjectRisk, predictRiskTrend } from '@/lib/ai-utils';

interface ZoomableProjectViewProps {
  projects: Project[];
  onProjectSelect?: (project: Project) => void;
}

export function ZoomableProjectView({ projects, onProjectSelect }: ZoomableProjectViewProps) {
  // Local zoom state for this component
  const [zoomLevel, setZoomLevel] = useState<1 | 2 | 3 | 4>(1);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showSimulation, setShowSimulation] = useState(false);
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);

  // Zoom level definitions
  // Level 1: Overview grid (all projects)
  // Level 2: Single project summary
  // Level 3: Project details with tasks
  // Level 4: Deep dive into specific task

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setZoomLevel(Math.min(zoomLevel + 1, 4) as 1 | 2 | 3 | 4);
    onProjectSelect?.(project);
  };

  const handleZoomOut = () => {
    if (zoomLevel > 1) {
      setZoomLevel((zoomLevel - 1) as 1 | 2 | 3 | 4);
      if (zoomLevel === 2) {
        setSelectedProject(null);
      }
    }
  };

  const handleZoomIn = () => {
    if (zoomLevel < 4 && selectedProject) {
      setZoomLevel((zoomLevel + 1) as 1 | 2 | 3 | 4);
    }
  };

  // Zoom Level 1: Overview Grid
  if (zoomLevel === 1) {
    return (
      <div className="space-y-4">
        {/* Zoom Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Zoom Level 1: Overview
            </Badge>
            <span className="text-sm text-muted-foreground">
              {projects.length} projects
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setZoomLevel(1)} disabled>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setZoomLevel(2)} disabled={!selectedProject}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const riskData = calculateProjectRisk(project);
            const risk = riskData.score;
            const riskTrend = predictRiskTrend(project);
            const isHovered = hoveredProject === project.id;

            return (
              <Card
                key={project.id}
                className={cn(
                  "cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105",
                  isHovered && "ring-2 ring-primary",
                  risk > 70 && "border-critical/50"
                )}
                onClick={() => handleProjectClick(project)}
                onMouseEnter={() => setHoveredProject(project.id)}
                onMouseLeave={() => setHoveredProject(null)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base line-clamp-1">{project.name}</CardTitle>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={project.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                      {project.status}
                    </Badge>
                    {riskTrend.trend === 'increasing' && (
                      <Badge variant="destructive" className="text-[10px]">
                        Risk {riskTrend.trend}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Risk Score</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{risk}%</span>
                        <ExplainButton
                          explanation={{
                            title: "Risk Calculation",
                            description: `Risk score is calculated based on project status and AI analysis. Current: ${risk}% risk level.`,
                            dataSource: "Project metrics and AI analysis",
                            lastUpdated: "Real-time"
                          }}
                        />
                      </div>
                    </div>
                    <Progress value={risk} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Status:</span>
                      <span className="font-medium capitalize">{project.status}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Risk:</span>
                      <span className={cn(
                        "font-medium",
                        risk > 70 ? "text-critical" : risk > 40 ? "text-warning" : "text-green-600"
                      )}>
                        {risk}%
                      </span>
                    </div>
                  </div>

                  {isHovered && (
                    <div className="pt-2 border-t text-xs text-muted-foreground">
                      Click to zoom in and see details
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Zoom Level 2: Single Project Summary
  if (zoomLevel === 2 && selectedProject) {
    const riskData = calculateProjectRisk(selectedProject);
    const risk = riskData.score;
    const riskTrend = predictRiskTrend(selectedProject);

    return (
      <div className="space-y-4">
        {/* Zoom Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4 mr-2" />
              Back to Overview
            </Button>
            <Badge variant="outline" className="text-xs">
              Zoom Level 2: Project Summary
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4 mr-2" />
              View Details
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowSimulation(!showSimulation)}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Simulate
            </Button>
          </div>
        </div>

        {/* Simulation Panel */}
        {showSimulation && (
          <SimulationPanel
            entityType="project"
            entityId={selectedProject.id}
            baselineData={{
              budget: 100000, // Default budget since Project type doesn't have budget field
              teamSize: 5,
              duration: 60,
            }}
          />
        )}

        {/* Project Summary Card */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl">{selectedProject.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{selectedProject.description}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={selectedProject.status === 'active' ? 'default' : 'secondary'}>
                  {selectedProject.status}
                </Badge>
                {riskTrend.trend === 'increasing' && (
                  <PredictiveBadge
                    type="risk"
                    prediction={`Risk ${riskTrend.trend}`}
                    confidence={riskTrend.confidence}
                    reasoning={riskTrend.reasoning}
                    suggestedAction="Consider running a simulation to test recovery scenarios"
                    onActionClick={() => setShowSimulation(true)}
                  />
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Status
                    <ExplainButton
                      explanation={{
                        title: "Project Status",
                        description: `Current project status is ${selectedProject.status}. This indicates the current state of the project lifecycle.`,
                        dataSource: "Project data",
                        lastUpdated: "Real-time"
                      }}
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold capitalize">{selectedProject.status}</div>
                  <p className="text-xs text-muted-foreground mt-1">Current status</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Client
                    <ExplainButton
                      explanation={{
                        title: "Client Information",
                        description: `Project client: ${selectedProject.client?.name || 'Not assigned'}`,
                        dataSource: "Project data",
                        lastUpdated: "Real-time"
                      }}
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">{selectedProject.client?.name || 'Not assigned'}</div>
                  <p className="text-xs text-muted-foreground mt-1">Project client</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Risk Score
                    <ExplainButton
                      explanation={{
                        title: "Risk Calculation",
                        description: `Risk score: ${risk}%. Calculated based on project status and AI analysis.`,
                        factors: [
                          { label: "Status", value: selectedProject.status },
                          { label: "AI Analysis", value: riskData.factors[0] || 'No issues detected' },
                          { label: "Confidence", value: `${riskData.confidence}%` }
                        ],
                        dataSource: "Project metrics",
                        lastUpdated: "Real-time"
                      }}
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={cn(
                    "text-3xl font-bold",
                    risk > 70 ? "text-critical" : risk > 40 ? "text-warning" : "text-green-600"
                  )}>
                    {risk}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {risk > 70 ? 'High risk' : risk > 40 ? 'Medium risk' : 'Low risk'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">
                    {selectedProject.created_at ? new Date(selectedProject.created_at).toLocaleDateString() : 'Not set'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Created date</p>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-4 border-t">
              <Button onClick={handleZoomIn}>
                <Maximize2 className="h-4 w-4 mr-2" />
                View Full Details
              </Button>
              <Button variant="outline" onClick={() => setShowSimulation(!showSimulation)}>
                <TrendingUp className="h-4 w-4 mr-2" />
                Run Simulation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Zoom Level 3 & 4: Redirect to full project detail page
  if (zoomLevel >= 3 && selectedProject) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4 mr-2" />
            Back to Summary
          </Button>
          <Badge variant="outline" className="text-xs">
            Zoom Level {zoomLevel}: Deep Dive
          </Badge>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Navigate to full project detail page for deep dive view
            </p>
            <Button className="mt-4" onClick={() => window.location.href = `/projects/${selectedProject.id}`}>
              Go to Project Details
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
