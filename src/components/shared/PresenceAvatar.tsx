import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { PresenceUser } from '@/contexts/PresenceContext';

interface PresenceAvatarProps {
  user: PresenceUser;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

export function PresenceAvatar({ user, size = 'md', showTooltip = true, className }: PresenceAvatarProps) {
  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-base',
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const avatar = (
    <div className="relative inline-block">
      <Avatar className={cn(sizeClasses[size], className)}>
        <AvatarFallback className="bg-primary text-primary-foreground">
          {getInitials(user.full_name || user.email)}
        </AvatarFallback>
      </Avatar>
      {/* Online indicator */}
      <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-healthy ring-2 ring-background" />
    </div>
  );

  if (!showTooltip) {
    return avatar;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {avatar}
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{user.full_name || user.email}</p>
          {user.page && (
            <p className="text-xs text-muted-foreground">
              Viewing: {user.page}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
