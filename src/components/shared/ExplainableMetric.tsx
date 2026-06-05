import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExplainButton } from './ExplainButton';
import { ConfidenceIndicator } from './ConfidenceIndicator';
import { TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExplainableMetricProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  explanation: string;
  calculation?: string;
  dataSource: string;
  lastUpdated?: string;
  confidence?: number;
  factors?: string[];
  variant?: 'default' | 'success' | 'warning' | 'critical';
  predictive?: boolean;
  prediction?: string;
  className?: string;
}

export function ExplainableMetric({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  explanation,
  calculation,
  dataSource,
  lastUpdated,
  confidence,
  factors,
  variant = 'default',
  predictive = false,
  prediction,
  className,
}: ExplainableMetricProps) {
  const variantStyles = {
    default: 'border-border',
    success: 'border-green-500/30 bg-green-500/5',
    warning: 'border-warning/30 bg-warning/5',
    critical: 'border-critical/30 bg-critical/5',
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-critical" />;
      case 'neutral':
        return <Minus className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  return (
    <Card className={cn('relative', variantStyles[variant], className)}>
      {predictive && (
        <div className="absolute top-2 right-2">
          <Badge variant="outline" className="text-xs gap-1">
            <Sparkles className="h-3 w-3" />
            AI Predicted
          </Badge>
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {icon && <div className="text-muted-foreground">{icon}</div>}
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {title}
            </CardTitle>
          </div>
          <ExplainButton
            explanation={{
              title: `${title} Explanation`,
              description: explanation,
              calculation,
              dataSource,
              lastUpdated,
              confidence,
              factors: factors?.map(f => ({
                label: f,
                value: '',
                impact: 'neutral' as const
              }))
            }}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-bold">{value}</div>
          {trend && trendValue && (
            <div className="flex items-center gap-1 text-sm">
              {getTrendIcon()}
              <span className={cn(
                "font-medium",
                trend === 'up' && "text-green-600",
                trend === 'down' && "text-critical",
                trend === 'neutral' && "text-muted-foreground"
              )}>
                {trendValue}
              </span>
            </div>
          )}
        </div>

        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}

        {confidence !== undefined && (
          <div className="pt-2 border-t">
            <ConfidenceIndicator confidence={confidence} showLabel />
          </div>
        )}

        {prediction && (
          <div className="pt-2 border-t">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-medium text-foreground mb-1">Prediction:</p>
                <p className="text-muted-foreground">{prediction}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
