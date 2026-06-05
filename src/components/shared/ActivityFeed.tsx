import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { 
  FileText, 
  Clock, 
  CheckSquare, 
  MessageSquare, 
  Activity,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: string;
  type: 'report' | 'time_entry' | 'task' | 'comment';
  action: 'created' | 'updated' | 'deleted';
  user_name: string;
  entity_name: string;
  created_at: string;
}

interface ActivityFeedProps {
  className?: string;
  maxItems?: number;
}

export function ActivityFeed({ className, maxItems = 10 }: ActivityFeedProps) {
  const { profile } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.firm_id) return;

    fetchRecentActivities();

    // Subscribe to real-time changes
    const reportsChannel = supabase
      .channel('activity-reports')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reports',
          filter: `firm_id=eq.${profile.firm_id}`,
        },
        (payload) => {
          handleRealtimeUpdate('report', payload);
        }
      )
      .subscribe();

    const tasksChannel = supabase
      .channel('activity-tasks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `firm_id=eq.${profile.firm_id}`,
        },
        (payload) => {
          handleRealtimeUpdate('task', payload);
        }
      )
      .subscribe();

    const timeEntriesChannel = supabase
      .channel('activity-time-entries')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_entries',
          filter: `firm_id=eq.${profile.firm_id}`,
        },
        (payload) => {
          handleRealtimeUpdate('time_entry', payload);
        }
      )
      .subscribe();

    return () => {
      reportsChannel.unsubscribe();
      tasksChannel.unsubscribe();
      timeEntriesChannel.unsubscribe();
    };
  }, [profile?.firm_id]);

  const fetchRecentActivities = async () => {
    if (!profile?.firm_id) return;

    try {
      setLoading(true);

      // Fetch recent reports
      const { data: reports } = await supabase
        .from('reports')
        .select('id, title, created_at, created_by')
        .eq('firm_id', profile.firm_id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch recent tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, created_at, created_by')
        .eq('firm_id', profile.firm_id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch recent time entries
      const { data: timeEntries } = await supabase
        .from('time_entries')
        .select('id, description, created_at, user_id')
        .eq('firm_id', profile.firm_id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Combine and sort activities
      const combined: ActivityItem[] = [
        ...(reports || []).map((r) => ({
          id: r.id,
          type: 'report' as const,
          action: 'created' as const,
          user_name: 'Team member',
          entity_name: r.title || 'Untitled Report',
          created_at: r.created_at,
        })),
        ...(tasks || []).map((t) => ({
          id: t.id,
          type: 'task' as const,
          action: 'created' as const,
          user_name: 'Team member',
          entity_name: t.title || 'Untitled Task',
          created_at: t.created_at,
        })),
        ...(timeEntries || []).map((te) => ({
          id: te.id,
          type: 'time_entry' as const,
          action: 'created' as const,
          user_name: 'Team member',
          entity_name: te.description || 'Time entry',
          created_at: te.created_at,
        })),
      ];

      combined.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setActivities(combined.slice(0, maxItems));
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRealtimeUpdate = (type: ActivityItem['type'], payload: any) => {
    if (payload.eventType === 'INSERT') {
      const newActivity: ActivityItem = {
        id: payload.new.id,
        type,
        action: 'created',
        user_name: 'Team member',
        entity_name: payload.new.title || payload.new.description || `New ${type}`,
        created_at: payload.new.created_at || new Date().toISOString(),
      };

      setActivities((prev) => [newActivity, ...prev].slice(0, maxItems));
    }
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'report':
        return <FileText className="h-4 w-4" />;
      case 'time_entry':
        return <Clock className="h-4 w-4" />;
      case 'task':
        return <CheckSquare className="h-4 w-4" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'report':
        return 'text-primary';
      case 'time_entry':
        return 'text-insight';
      case 'task':
        return 'text-healthy';
      case 'comment':
        return 'text-warning';
      default:
        return 'text-muted-foreground';
    }
  };

  const getActivityLabel = (type: ActivityItem['type']) => {
    switch (type) {
      case 'report':
        return 'Report';
      case 'time_entry':
        return 'Time';
      case 'task':
        return 'Task';
      case 'comment':
        return 'Comment';
      default:
        return 'Activity';
    }
  };

  if (loading) {
    return (
      <Card className={cn('shadow-sm', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-pulse" />
            <p className="text-sm text-muted-foreground">Loading activities...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('shadow-sm', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Recent Activity
          </CardTitle>
          <Badge variant="secondary">{activities.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-6">
            <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {activities.map((activity, index) => (
                <div key={activity.id}>
                  {index > 0 && <Separator className="my-3" />}
                  <div className="flex items-start gap-3">
                    <div className={cn('mt-0.5', getActivityColor(activity.type))}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {getActivityLabel(activity.type)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(parseISO(activity.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm font-medium truncate">
                        {activity.entity_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        by {activity.user_name}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
