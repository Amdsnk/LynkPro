import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export interface ExplanationData {
  title: string;
  description: string;
  calculation?: string;
  dataSource?: string;
  lastUpdated?: string;
  confidence?: number;
  factors?: Array<{
    label: string;
    value: string | number;
    impact?: 'positive' | 'negative' | 'neutral';
  }>;
  reasoning?: string;
  alternatives?: Array<{
    label: string;
    value: string | number;
    description: string;
  }>;
}

interface ExplainButtonProps {
  explanation: ExplanationData;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'ghost' | 'outline' | 'default';
}

export function ExplainButton({ explanation, size = 'sm', variant = 'ghost' }: ExplainButtonProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size={size} variant={variant} className="h-6 w-6 p-0">
          <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {explanation.title}
            {explanation.confidence !== undefined && (
              <Badge variant="outline" className="ml-auto">
                {explanation.confidence}% confidence
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>{explanation.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Confidence Score */}
          {explanation.confidence !== undefined && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Confidence Level</span>
                <span className="text-muted-foreground">{explanation.confidence}%</span>
              </div>
              <Progress value={explanation.confidence} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {explanation.confidence >= 80
                  ? 'High confidence - based on comprehensive data'
                  : explanation.confidence >= 60
                  ? 'Moderate confidence - based on available data'
                  : 'Low confidence - limited data available'}
              </p>
            </div>
          )}

          {/* Calculation Method */}
          {explanation.calculation && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">How it's calculated</h4>
              <div className="bg-muted/50 rounded-lg p-3">
                <code className="text-xs">{explanation.calculation}</code>
              </div>
            </div>
          )}

          {/* Contributing Factors */}
          {explanation.factors && explanation.factors.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Contributing Factors</h4>
              <div className="space-y-2">
                {explanation.factors.map((factor, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-2">
                      {factor.impact && (
                        <div
                          className={`h-2 w-2 rounded-full ${
                            factor.impact === 'positive'
                              ? 'bg-green-500'
                              : factor.impact === 'negative'
                              ? 'bg-red-500'
                              : 'bg-gray-500'
                          }`}
                        />
                      )}
                      <span className="text-sm">{factor.label}</span>
                    </div>
                    <span className="text-sm font-medium">{factor.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reasoning */}
          {explanation.reasoning && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Reasoning</h4>
              <p className="text-sm text-muted-foreground">{explanation.reasoning}</p>
            </div>
          )}

          {/* Alternative Scenarios */}
          {explanation.alternatives && explanation.alternatives.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Alternative Scenarios</h4>
              <div className="space-y-2">
                {explanation.alternatives.map((alt, index) => (
                  <div key={index} className="p-3 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{alt.label}</span>
                      <span className="text-sm text-muted-foreground">{alt.value}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{alt.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Source & Freshness */}
          <div className="pt-4 border-t border-border space-y-1">
            {explanation.dataSource && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Data source:</span> {explanation.dataSource}
              </p>
            )}
            {explanation.lastUpdated && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Last updated:</span> {explanation.lastUpdated}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
