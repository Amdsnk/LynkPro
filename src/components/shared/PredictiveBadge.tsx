import { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { AlertTriangle, TrendingUp, TrendingDown, Lightbulb, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConfidenceIndicator } from './ConfidenceIndicator';

export type PredictionType = 'risk' | 'opportunity' | 'trend' | 'insight';

interface PredictiveBadgeProps {
  type: PredictionType;
  prediction: string;
  confidence: number;
  reasoning?: string;
  suggestedAction?: string;
  onActionClick?: () => void;
  className?: string;
  children?: ReactNode;
}

const typeConfig = {
  risk: {
    icon: AlertTriangle,
    color: 'bg-red-500/10 text-red-700 border-red-500/20',
    iconColor: 'text-red-600',
    label: 'Risk Prediction',
  },
  opportunity: {
    icon: TrendingUp,
    color: 'bg-green-500/10 text-green-700 border-green-500/20',
    iconColor: 'text-green-600',
    label: 'Opportunity',
  },
  trend: {
    icon: TrendingDown,
    color: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
    iconColor: 'text-blue-600',
    label: 'Trend Prediction',
  },
  insight: {
    icon: Lightbulb,
    color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
    iconColor: 'text-yellow-600',
    label: 'AI Insight',
  },
};

export function PredictiveBadge({
  type,
  prediction,
  confidence,
  reasoning,
  suggestedAction,
  onActionClick,
  className,
  children,
}: PredictiveBadgeProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge
          variant="outline"
          className={cn(
            'cursor-pointer hover:shadow-md transition-all gap-1.5 px-2 py-1',
            config.color,
            className
          )}
        >
          <Icon className={cn('h-3 w-3', config.iconColor)} />
          <span className="text-xs font-medium">{prediction}</span>
          <Sparkles className="h-2.5 w-2.5 opacity-60" />
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          {/* Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Icon className={cn('h-4 w-4', config.iconColor)} />
              <h4 className="text-sm font-semibold">{config.label}</h4>
            </div>
            <p className="text-sm text-foreground">{prediction}</p>
          </div>

          {/* Confidence */}
          <ConfidenceIndicator confidence={confidence} size="sm" />

          {/* Reasoning */}
          {reasoning && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Why this prediction?</p>
              <p className="text-xs text-foreground">{reasoning}</p>
            </div>
          )}

          {/* Suggested Action */}
          {suggestedAction && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Suggested Action</p>
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="text-xs text-foreground mb-2">{suggestedAction}</p>
                {onActionClick && (
                  <Button size="sm" onClick={onActionClick} className="w-full">
                    Take Action
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Additional Content */}
          {children}

          {/* Footer */}
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              AI-powered prediction
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
