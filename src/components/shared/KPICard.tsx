import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
}

export function KPICard({
  title,
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  icon: Icon,
  trend,
  description,
}: KPICardProps) {
  const TrendIcon = trend
    ? trend.isPositive
      ? TrendingUp
      : trend.value === 0
      ? Minus
      : TrendingDown
    : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          <AnimatedCounter
            value={value}
            prefix={prefix}
            suffix={suffix}
            decimals={decimals}
          />
        </div>
        {(trend || description) && (
          <div className="flex items-center gap-2 mt-2">
            {trend && TrendIcon && (
              <div
                className={`flex items-center text-xs ${
                  trend.isPositive
                    ? 'text-green-600'
                    : trend.value === 0
                    ? 'text-muted-foreground'
                    : 'text-red-600'
                }`}
              >
                <TrendIcon className="h-3 w-3 mr-1" />
                <span>{Math.abs(trend.value)}%</span>
              </div>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
