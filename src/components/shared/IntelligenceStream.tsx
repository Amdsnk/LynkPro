import { useState } from 'react';
import { X, ChevronUp, ChevronDown, AlertCircle, CheckCircle, Info, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export interface StreamUpdate {
  id: string;
  type: 'critical' | 'warning' | 'success' | 'info';
  message: string;
  timestamp: Date;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface IntelligenceStreamProps {
  updates: StreamUpdate[];
  onDismiss?: (id: string) => void;
}

const typeConfig = {
  critical: {
    icon: AlertCircle,
    bgColor: 'bg-critical/10',
    borderColor: 'border-l-critical',
    iconColor: 'text-critical',
  },
  warning: {
    icon: AlertCircle,
    bgColor: 'bg-warning/10',
    borderColor: 'border-l-warning',
    iconColor: 'text-warning',
  },
  success: {
    icon: CheckCircle,
    bgColor: 'bg-healthy/10',
    borderColor: 'border-l-healthy',
    iconColor: 'text-healthy',
  },
  info: {
    icon: Info,
    bgColor: 'bg-insight/10',
    borderColor: 'border-l-insight',
    iconColor: 'text-insight',
  },
};

export function IntelligenceStream({ updates, onDismiss }: IntelligenceStreamProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visibleUpdates = updates.filter((u) => !dismissed.has(u.id));

  const handleDismiss = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
    onDismiss?.(id);
  };

  if (visibleUpdates.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-ai-primary" />
          <span className="text-sm font-medium">Intelligence Stream</span>
          <span className="text-xs text-muted-foreground">
            {visibleUpdates.length} {visibleUpdates.length === 1 ? 'update' : 'updates'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="h-7 w-7 p-0"
          >
            {collapsed ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Updates List */}
      {!collapsed && (
        <div className="max-h-[300px] overflow-y-auto">
          <div className="divide-y divide-border">
            {visibleUpdates.map((update) => {
              const config = typeConfig[update.type];
              const Icon = config.icon;

              return (
                <div
                  key={update.id}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 border-l-4 transition-all duration-300 animate-slide-up',
                    config.bgColor,
                    config.borderColor
                  )}
                >
                  <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', config.iconColor)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{update.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(update.timestamp, { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {update.action && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={update.action.onClick}
                        className="h-7 text-xs"
                      >
                        {update.action.label}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDismiss(update.id)}
                      className="h-7 w-7 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
