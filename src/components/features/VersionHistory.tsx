import { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import type { DocumentVersion, DocumentEntityType } from '@/types/types';

interface VersionHistoryProps {
  entityType: DocumentEntityType;
  entityId: string;
}

export function VersionHistory({ entityType, entityId }: VersionHistoryProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVersions();
  }, [entityType, entityId]);

  const fetchVersions = async () => {
    const { data } = await supabase
      .from('document_versions')
      .select('*, creator:profiles!created_by(full_name, email)')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('version_number', { ascending: false });

    if (data) setVersions(data);
    setLoading(false);
  };

  if (loading) return <div>Loading versions...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Version History ({versions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {versions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No version history available
          </p>
        ) : (
          <div className="space-y-3">
            {versions.map((version) => (
              <div key={version.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge>Version {version.version_number}</Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(version.created_at), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
                {version.changes_summary && (
                  <p className="text-sm">{version.changes_summary}</p>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  {version.creator?.full_name || version.creator?.email}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
