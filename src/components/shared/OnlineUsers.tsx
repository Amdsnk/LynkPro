import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { usePresence } from '@/contexts/PresenceContext';
import { PresenceAvatar } from './PresenceAvatar';
import { Users, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnlineUsersProps {
  className?: string;
  compact?: boolean;
}

export function OnlineUsers({ className, compact = false }: OnlineUsersProps) {
  const { onlineUsers } = usePresence();

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="flex items-center gap-1">
          <Circle className="h-2 w-2 fill-healthy text-healthy animate-pulse" />
          <span className="text-xs text-muted-foreground">
            {onlineUsers.length} online
          </span>
        </div>
        <div className="flex -space-x-2">
          {onlineUsers.slice(0, 3).map((user) => (
            <PresenceAvatar key={user.user_id} user={user} size="sm" />
          ))}
          {onlineUsers.length > 3 && (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium ring-2 ring-background">
              +{onlineUsers.length - 3}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={cn('shadow-sm', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Online Team
          </CardTitle>
          <Badge variant="secondary" className="gap-1">
            <Circle className="h-2 w-2 fill-healthy text-healthy animate-pulse" />
            {onlineUsers.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {onlineUsers.length === 0 ? (
          <div className="text-center py-6">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No team members online
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {onlineUsers.map((user, index) => (
              <div key={user.user_id}>
                {index > 0 && <Separator className="my-2" />}
                <div className="flex items-center gap-3">
                  <PresenceAvatar user={user} size="md" showTooltip={false} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.full_name || user.email}
                    </p>
                    {user.page && (
                      <p className="text-xs text-muted-foreground truncate">
                        Viewing: {user.page}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
