import { useEffect } from 'react';
import { usePresence } from '@/contexts/PresenceContext';
import { PresenceAvatar } from './PresenceAvatar';
import { Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PagePresenceProps {
  page: string;
  className?: string;
}

export function PagePresence({ page, className }: PagePresenceProps) {
  const { usersOnPage, trackPresence, untrackPresence } = usePresence();

  useEffect(() => {
    trackPresence(page);
    return () => {
      untrackPresence();
    };
  }, [page]);

  const viewers = usersOnPage(page);

  if (viewers.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border', className)}>
      <Eye className="h-3 w-3 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">
        {viewers.length} {viewers.length === 1 ? 'person' : 'people'} viewing
      </span>
      <div className="flex -space-x-2">
        {viewers.slice(0, 5).map((user) => (
          <PresenceAvatar key={user.user_id} user={user} size="sm" />
        ))}
        {viewers.length > 5 && (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium ring-2 ring-background">
            +{viewers.length - 5}
          </div>
        )}
      </div>
    </div>
  );
}
