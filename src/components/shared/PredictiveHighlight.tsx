import { ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  TrendingDown, 
  Clock, 
  DollarSign, 
  Users,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type PredictionType = 
  | 'likely_late' 
  | 'budget_overrun' 
  | 'resource_shortage'
  | 'quality_risk'
  | 'trending_risk'
  | 'opportunity';

interface PredictiveHighlightProps {
  type: PredictionType;
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  timeframe?: string;
  suggestedAction?: string;
  onActionClick?: () => void;
  className?: string;
}

const predictionConfig: Record<PredictionType, {
  icon: ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  likely_late: {
    icon: <Clock className="h-5 w-5" />,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30',
  },
  budget_overrun: {
    icon: <DollarSign className="h-5 w-5" />,
    color: 'text-critical',
    bgColor: 'bg-critical/10',
    borderColor: 'border-critical/30',
  },
  resource_shortage: {
    icon: <Users className="h-5 w-5" />,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30',
  },
  quality_risk: {
    icon: <AlertTriangle className="h-5 w-5" />,
    color: 'text-critical',
    bgColor: 'bg-critical/10',
    borderColor: 'border-critical/30',
  },
  trending_risk: {
    icon: <TrendingDown className="h-5 w-5" />,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30',
  },
  opportunity: {
    icon: <Sparkles className="h-5 w-5" />,
    color: 'text-green-600',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
  },
};

const impactConfig = {
  low: { label: 'Low Impact', variant: 'secondary' as const },
  medium: { label: 'Medium Impact', variant: 'default' as const },
  high: { label: 'High Impact', variant: 'default' as const },
  critical: { label: 'Critical Impact', variant: 'destructive' as const },
};

export function PredictiveHighlight({
  type,
  title,
  description,
  confidence,
  impact,
  timeframe,
  suggestedAction,
  onActionClick,
  className,
}: PredictiveHighlightProps) {
  const config = predictionConfig[type];
  const impactInfo = impactConfig[impact];

  return (
    <Alert 
      className={cn(
        'border-2 relative overflow-hidden',
        config.borderColor,
        config.bgColor,
        className
      )}
    >
      {/* Animated pulse indicator */}
      <div className={cn(
        'absolute top-0 left-0 w-1 h-full animate-pulse',
        impact === 'critical' ? 'bg-critical' : 
        impact === 'high' ? 'bg-warning' : 
        'bg-primary'
      )} />

      <div className="flex items-start gap-3 pl-2">
        <div className={cn('flex-shrink-0 mt-0.5', config.color)}>
          {config.icon}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-sm">{title}</h4>
                <Badge variant={impactInfo.variant} className="text-xs">
                  {impactInfo.label}
                </Badge>
                <Badge variant="outline" className="text-xs gap-1">
                  <Sparkles className="h-3 w-3" />
                  {confidence}% confidence
                </Badge>
                {timeframe && (
                  <Badge variant="outline" className="text-xs">
                    {timeframe}
                  </Badge>
                )}
              </div>
              <AlertDescription className="text-sm">
                {description}
              </AlertDescription>
            </div>
          </div>

          {suggestedAction && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <span className="text-xs font-medium text-muted-foreground">
                Suggested Action:
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={onActionClick}
              >
                {suggestedAction}
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Alert>
  );
}

// Utility function to generate predictive highlights for projects
export function generateProjectPredictions(project: any): PredictiveHighlightProps[] {
  const predictions: PredictiveHighlightProps[] = [];

  // Check for likely delays
  if (project.completion_percentage < 50 && project.status === 'active') {
    predictions.push({
      type: 'likely_late',
      title: 'Likely to Miss Deadline',
      description: `Project is ${project.completion_percentage}% complete. Based on current velocity, completion may be delayed by 2-3 weeks.`,
      confidence: 78,
      impact: 'high',
      timeframe: 'Next 2 weeks',
      suggestedAction: 'Run timeline simulation',
    });
  }

  // Check for budget concerns
  if (project.budget && project.budget > 100000) {
    predictions.push({
      type: 'budget_overrun',
      title: 'Budget Overrun Risk',
      description: 'Current spending rate suggests 15% budget overrun if pace continues.',
      confidence: 65,
      impact: 'medium',
      timeframe: 'End of quarter',
      suggestedAction: 'Review budget allocation',
    });
  }

  // Check for trending risks
  if (project.status === 'active' && !project.start_date) {
    predictions.push({
      type: 'trending_risk',
      title: 'Risk Trend Increasing',
      description: 'Project risk score has increased 12% over the past week due to resource constraints.',
      confidence: 82,
      impact: 'medium',
      timeframe: 'This week',
      suggestedAction: 'Review resource allocation',
    });
  }

  // Identify opportunities
  if (project.completion_percentage > 80) {
    predictions.push({
      type: 'opportunity',
      title: 'Early Completion Possible',
      description: 'Project is ahead of schedule. Consider reallocating resources to other projects.',
      confidence: 71,
      impact: 'low',
      timeframe: 'Next week',
      suggestedAction: 'Optimize resource allocation',
    });
  }

  return predictions;
}
