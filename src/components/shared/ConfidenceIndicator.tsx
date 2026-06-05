import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ConfidenceIndicatorProps {
  confidence: number; // 0-100
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ConfidenceIndicator({
  confidence,
  showLabel = true,
  size = 'md',
  className,
}: ConfidenceIndicatorProps) {
  const getConfidenceLevel = () => {
    if (confidence >= 80) return { label: 'High', color: 'bg-green-500', textColor: 'text-green-700' };
    if (confidence >= 60) return { label: 'Moderate', color: 'bg-yellow-500', textColor: 'text-yellow-700' };
    return { label: 'Low', color: 'bg-red-500', textColor: 'text-red-700' };
  };

  const level = getConfidenceLevel();

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Confidence</span>
          <Badge variant="outline" className={cn('text-xs', level.textColor)}>
            {confidence}% {level.label}
          </Badge>
        </div>
      )}
      <div className="w-full bg-muted rounded-full overflow-hidden">
        <div
          className={cn('transition-all duration-500', level.color, sizeClasses[size])}
          style={{ width: `${confidence}%` }}
        />
      </div>
    </div>
  );
}

interface TrendIndicatorProps {
  direction: 'up' | 'down' | 'flat';
  value?: string | number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TrendIndicator({
  direction,
  value,
  label,
  size = 'md',
  className,
}: TrendIndicatorProps) {
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const getIcon = () => {
    switch (direction) {
      case 'up':
        return <TrendingUp className={cn(iconSizes[size], 'text-green-600')} />;
      case 'down':
        return <TrendingDown className={cn(iconSizes[size], 'text-red-600')} />;
      case 'flat':
        return <Minus className={cn(iconSizes[size], 'text-gray-600')} />;
    }
  };

  const getColor = () => {
    switch (direction) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'flat':
        return 'text-gray-600';
    }
  };

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {getIcon()}
      {value && (
        <span className={cn('font-medium', textSizes[size], getColor())}>{value}</span>
      )}
      {label && (
        <span className={cn('text-muted-foreground', textSizes[size])}>{label}</span>
      )}
    </div>
  );
}
