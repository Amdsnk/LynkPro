import { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';
import type { AuditLog } from '@/types/types';
import { Activity, FileText, DollarSign, ClipboardList, FolderOpen, Users } from 'lucide-react';

const ENTITY_ICONS = {
  proposal: FileText,
  invoice: DollarSign,
  report: ClipboardList,
  project: FolderOpen,
  client: Users,
  user: Users,
};

interface AuditLogListProps {
  entityType?: string;
  entityId?: string;
  limit?: number;
}

export function AuditLogList({ entityType, entityId, limit = 20 }: AuditLogListProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        let query = supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (entityType) {
          query = query.eq('entity_type', entityType);
        }

        if (entityId) {
          query = query.eq('entity_id', entityId);
        }

        const { data, error } = await query;

        if (error) throw error;
        setLogs(data || []);
      } catch (error) {
        console.error('Error fetching logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [entityType, entityId, limit]);

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
    return <p className="text-sm text-muted-foreground">Loading activity...</p>;
  }

  if (logs.length === 0) {
    return (
      <div className="empty-state">
        <Activity className="empty-state-icon" />
        <p className="empty-state-title">No activity yet</p>
        <p className="empty-state-description">
          Activity will appear here as changes are made
        </p>
      </div>
    );
  }

  return (
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
  );
}
