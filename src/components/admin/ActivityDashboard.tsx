import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import type { AuditLog } from '@/types/types';
import { Activity, FileText, DollarSign, ClipboardList, Users, FolderOpen } from 'lucide-react';

const ENTITY_ICONS = {
  proposal: FileText,
  invoice: DollarSign,
  report: ClipboardList,
  project: FolderOpen,
  client: Users,
  user: Users,
};

export function ActivityDashboard() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState<string>('all');

  useEffect(() => {
    fetchLogs();
  }, [entityFilter]);

  const fetchLogs = async () => {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (entityFilter !== 'all') {
        query = query.eq('entity_type', entityFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'text-success';
      case 'updated':
      case 'status_changed':
        return 'text-info';
      case 'deleted':
        return 'text-destructive';
      case 'sent':
      case 'approved':
        return 'text-primary';
      default:
        return 'text-muted-foreground';
    }
  };

  const getActionLabel = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 bg-muted" />
        <Skeleton className="h-96 bg-muted" />
      </div>
    );
  }

  return (
    <div className="content-spacing">
      <Card className="card-enhanced">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Recent Activity</CardTitle>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activity</SelectItem>
                <SelectItem value="proposal">Proposals</SelectItem>
                <SelectItem value="invoice">Invoices</SelectItem>
                <SelectItem value="report">Reports</SelectItem>
                <SelectItem value="project">Projects</SelectItem>
                <SelectItem value="client">Clients</SelectItem>
                <SelectItem value="user">Users</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="empty-state">
              <Activity className="empty-state-icon" />
              <p className="empty-state-title">No activity found</p>
              <p className="empty-state-description">
                {entityFilter !== 'all' 
                  ? 'Try selecting a different filter'
                  : 'Activity will appear here as users interact with the system'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => {
                const Icon = ENTITY_ICONS[log.entity_type as keyof typeof ENTITY_ICONS] || Activity;
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-accent/50 transition-smooth"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground capitalize">
                          {log.entity_type}
                        </span>
                        <span className={`text-sm font-medium ${getActionColor(log.action)}`}>
                          {getActionLabel(log.action)}
                        </span>
                      </div>
                      {log.details && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {typeof log.details === 'object' 
                            ? Object.entries(log.details)
                                .map(([key, value]) => `${key}: ${value}`)
                                .join(', ')
                            : String(log.details)}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
