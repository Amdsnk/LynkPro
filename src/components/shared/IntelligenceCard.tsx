import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, AlertTriangle, Lightbulb, Sparkles, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type IntelligenceVariant = 'urgent' | 'warning' | 'insight' | 'neutral';

interface IntelligenceCardProps {
  variant?: IntelligenceVariant;
  title: string;
  insight: string;
  reasoning?: string;
  confidence?: number;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost';
  }>;
  children?: ReactNode;
  className?: string;
}

const variantConfig = {
  urgent: {
    icon: AlertCircle,
    borderColor: 'border-critical',
    bgColor: 'bg-critical/5',
    iconColor: 'text-critical',
  },
  warning: {
    icon: AlertTriangle,
    borderColor: 'border-warning',
    bgColor: 'bg-warning/5',
    iconColor: 'text-warning',
  },
  insight: {
    icon: Lightbulb,
    borderColor: 'border-insight',
    bgColor: 'bg-insight/5',
    iconColor: 'text-insight',
  },
  neutral: {
    icon: Sparkles,
    borderColor: 'border-border',
    bgColor: 'bg-muted/30',
    iconColor: 'text-ai-primary',
  },
};

export function IntelligenceCard({
  variant = 'neutral',
  title,
  insight,
  reasoning,
  confidence,
  actions,
  children,
  className,
}: IntelligenceCardProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <Card
      className={cn(
        'border-2',
        config.borderColor,
        config.bgColor,
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Icon className={cn('h-5 w-5 mt-0.5', config.iconColor)} />
            <div className="flex-1 space-y-1">
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
              {confidence !== undefined && (
                <ConfidenceScore score={confidence} />
              )}
            </div>
          </div>
          {reasoning && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>AI Explanation</DialogTitle>
                  <DialogDescription>
                    Understanding the analysis behind this insight
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Insight</h4>
                    <p className="text-sm text-muted-foreground">{insight}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Reasoning</h4>
                    <div className="text-sm text-muted-foreground whitespace-pre-line">
                      {reasoning}
                    </div>
                  </div>
                  {confidence !== undefined && (
                    <div>
                      <h4 className="font-semibold mb-2">Confidence</h4>
                      <p className="text-sm text-muted-foreground">
                        This prediction has a {confidence}% confidence score based on historical data and current patterns.
                      </p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-foreground leading-relaxed">{insight}</p>
        
        {children}

        {actions && actions.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'default'}
                size="sm"
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ConfidenceScore({ score }: { score: number }) {
  const getColor = (score: number) => {
    if (score >= 80) return 'text-healthy';
    if (score >= 50) return 'text-warning';
    return 'text-critical';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        <Sparkles className="h-3 w-3 text-ai-primary" />
        <span className={cn('text-xs font-medium', getColor(score))}>
          {score}% confident
        </span>
      </div>
    </div>
  );
}
