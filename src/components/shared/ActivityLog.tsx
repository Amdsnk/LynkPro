import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import {
  FileText,
  Users,
  Receipt,
  FolderKanban,
  FileBarChart,
  UserPlus,
  Building2,
  Plus,
  Edit,
  Trash2,
  Send,
  DollarSign,
  Check,
  X,
  Archive
} from 'lucide-react';

interface ActivityLog {
  id: string;
  firm_id: string;
  user_id: string;
  entity_type: string;
  entity_id: string | null;
  action: string;
  entity_name: string | null;
  changes: Record<string, any> | null;
  created_at: string;
  user: {
    full_name: string;
    email: string;
  };
}

interface ActivityLogProps {
  entityType?: string;
  entityId?: string;
  firmId: string;
  limit?: number;
  showTitle?: boolean;
}

const actionIcons: Record<string, any> = {
  created: Plus,
  updated: Edit,
  deleted: Trash2,
  sent: Send,
  paid: DollarSign,
  accepted: Check,
  rejected: X,
  archived: Archive,
};

const actionColors: Record<string, string> = {
  created: 'bg-green-500/10 text-green-500',
  updated: 'bg-blue-500/10 text-blue-500',
  deleted: 'bg-red-500/10 text-red-500',
  sent: 'bg-purple-500/10 text-purple-500',
  paid: 'bg-emerald-500/10 text-emerald-500',
  accepted: 'bg-green-500/10 text-green-500',
  rejected: 'bg-red-500/10 text-red-500',
  archived: 'bg-gray-500/10 text-gray-500',
};

const entityIcons: Record<string, any> = {
  project: FolderKanban,
  client: Users,
  invoice: Receipt,
  proposal: FileText,
  report: FileBarChart,
  user: UserPlus,
  firm: Building2,
};

export function ActivityLog({
  entityType,
  entityId,
  firmId,
  limit = 20,
  showTitle = true,
}: ActivityLogProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('activity-logs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs',
          filter: entityId ? `entity_id=eq.${entityId}` : `firm_id=eq.${firmId}`,
        },
        () => {
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [entityType, entityId, firmId, limit]);

  const fetchActivities = async () => {
    let query = supabase
      .from('activity_logs')
      .select(`
        *,
        user:profiles!activity_logs_user_id_fkey(full_name, email)
      `)
      .eq('firm_id', firmId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (entityType && entityId) {
      query = query.eq('entity_type', entityType).eq('entity_id', entityId);
    }

    const { data, error } = await query;

    if (!error && data) {
      setActivities(data as any);
    }
    setLoading(false);
  };

  const getActionText = (activity: ActivityLog) => {
    const entityName = activity.entity_name || activity.entity_type;
    switch (activity.action) {
      case 'created':
        return `created ${entityName}`;
      case 'updated':
        return `updated ${entityName}`;
      case 'deleted':
        return `deleted ${entityName}`;
      case 'sent':
        return `sent ${entityName}`;
      case 'paid':
        return `marked ${entityName} as paid`;
      case 'accepted':
        return `accepted ${entityName}`;
      case 'rejected':
        return `rejected ${entityName}`;
      case 'archived':
        return `archived ${entityName}`;
      default:
        return `${activity.action} ${entityName}`;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4 bg-muted" />
                  <Skeleton className="h-3 w-1/2 bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No activity yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {activities.map((activity) => {
              const ActionIcon = actionIcons[activity.action] || Edit;
              const EntityIcon = entityIcons[activity.entity_type] || FileText;

              return (
                <div key={activity.id} className="flex gap-3 group">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="text-xs">
                      {getInitials(activity.user.full_name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{activity.user.full_name}</span>{' '}
                          <span className="text-muted-foreground">{getActionText(activity)}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className={`${actionColors[activity.action]} border-0`}>
                          <ActionIcon className="h-3 w-3 mr-1" />
                          {activity.action}
                        </Badge>
                        <EntityIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>

                    {activity.changes && Object.keys(activity.changes).length > 0 && (
                      <div className="mt-2 p-2 rounded-md bg-muted/50 text-xs space-y-1">
                        {Object.entries(activity.changes).map(([key, value]: [string, any]) => (
                          <div key={key} className="flex items-start gap-2">
                            <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                            <span className="text-muted-foreground">
                              {value.from && <span className="line-through">{String(value.from)}</span>}
                              {value.from && ' → '}
                              <span className="font-medium">{String(value.to)}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
