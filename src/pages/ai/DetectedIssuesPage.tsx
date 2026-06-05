import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react';
import { DetectedIssue } from '@/types/types';
import { getSeverityBadge, formatConfidence } from '@/lib/aiHelpers';

export default function DetectedIssuesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { issues, photoUrl } = location.state || { issues: [], photoUrl: null };

  const criticalIssues = issues.filter((i: DetectedIssue) => i.severity === 'critical');
  const highIssues = issues.filter((i: DetectedIssue) => i.severity === 'high');

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/ai/photo-analysis')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Detected Issues</h1>
            <p className="text-muted-foreground mt-1">
              AI analysis results
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{issues.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Critical
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{criticalIssues.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                High Priority
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{highIssues.length}</div>
            </CardContent>
          </Card>
        </div>

        {photoUrl && (
          <Card>
            <CardHeader>
              <CardTitle>Analyzed Photo</CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={photoUrl}
                alt="Analyzed"
                className="max-h-96 mx-auto rounded-lg"
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Detected Issues ({issues.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {issues.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No issues detected. Photo looks good!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {issues.map((issue: DetectedIssue) => (
                  <div key={issue.id} className="p-4 rounded-lg border">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant={getSeverityBadge(issue.severity)}>
                            {issue.severity}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Confidence: {formatConfidence(issue.confidence_score)}
                          </span>
                        </div>
                        <p className="font-medium">{issue.issue_type.replace(/_/g, ' ').toUpperCase()}</p>
                        <p className="text-sm text-muted-foreground mt-1">{issue.description}</p>
                      </div>
                    </div>

                    {issue.recommended_actions.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium mb-2">Recommended Actions:</p>
                        <ul className="space-y-1">
                          {issue.recommended_actions.map((action, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => navigate('/ai/photo-analysis')}>
            Analyze Another Photo
          </Button>
        </div>
      </div>
    </div>
  );
}
