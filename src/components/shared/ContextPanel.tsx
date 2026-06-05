import { ReactNode, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, DollarSign, Users, Activity, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ContextPanelProps {
  contextType: 'project' | 'invoice' | 'client' | 'task' | null;
  contextId: string | null;
  className?: string;
}

export function ContextPanel({ contextType, contextId, className }: ContextPanelProps) {
  const [loading, setLoading] = useState(true);
  const [contextData, setContextData] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!contextType || !contextId) {
      setLoading(false);
      return;
    }

    // Simulate loading context data
    setLoading(true);
    setTimeout(() => {
      // In real implementation, fetch related data based on contextType and contextId
      setContextData({
        relatedInvoices: [
          { id: '1', number: 'INV-001', amount: 5000, status: 'paid' },
          { id: '2', number: 'INV-002', amount: 3500, status: 'sent' },
        ],
        relatedReports: [
          { id: '1', title: 'Site Inspection Report', date: '2024-04-20' },
          { id: '2', title: 'Progress Update', date: '2024-04-18' },
        ],
        teamMembers: [
          { id: '1', name: 'John Doe', role: 'Project Manager' },
          { id: '2', name: 'Jane Smith', role: 'Engineer' },
        ],
        recentActivity: [
          { id: '1', action: 'Invoice created', time: '2 hours ago' },
          { id: '2', action: 'Task completed', time: '5 hours ago' },
          { id: '3', action: 'File uploaded', time: '1 day ago' },
        ],
      });
      setLoading(false);
    }, 500);
  }, [contextType, contextId]);

  if (!contextType || !contextId) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Select an item to view context</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Context
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="related" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="related">Related</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="related" className="space-y-3 mt-4">
            {/* Related Invoices */}
            {contextData?.relatedInvoices && contextData.relatedInvoices.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <DollarSign className="h-3 w-3" />
                  Invoices
                </div>
                {contextData.relatedInvoices.map((invoice: any) => (
                  <button
                    key={invoice.id}
                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                    className="w-full p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{invoice.number}</span>
                      <Badge variant={invoice.status === 'paid' ? 'default' : 'outline'}>
                        {invoice.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      ${invoice.amount.toLocaleString()}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {/* Related Reports */}
            {contextData?.relatedReports && contextData.relatedReports.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  Reports
                </div>
                {contextData.relatedReports.map((report: any) => (
                  <button
                    key={report.id}
                    onClick={() => navigate(`/reports/${report.id}`)}
                    className="w-full p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
                  >
                    <p className="text-sm font-medium">{report.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{report.date}</p>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="team" className="space-y-2 mt-4">
            {contextData?.teamMembers && contextData.teamMembers.length > 0 ? (
              contextData.teamMembers.map((member: any) => (
                <div
                  key={member.id}
                  className="p-3 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No team members assigned
              </p>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-2 mt-4">
            {contextData?.recentActivity && contextData.recentActivity.length > 0 ? (
              contextData.recentActivity.map((activity: any) => (
                <div
                  key={activity.id}
                  className="p-3 rounded-lg border border-border"
                >
                  <p className="text-sm">{activity.action}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent activity
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
