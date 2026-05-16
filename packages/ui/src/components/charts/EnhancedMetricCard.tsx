import { Card, CardContent } from '../Card';
import { TrendIndicator } from './TrendIndicator';
import { cn, textColors } from '../../lib/classNames';

export interface EnhancedMetricCardProps {
  title: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  formatter?: (value: number) => string;
  invertTrendColors?: boolean;
  icon?: string;
  colorClass?: string;
}

export function EnhancedMetricCard({
  title,
  value,
  trend,
  trendLabel,
  formatter,
  invertTrendColors = false,
  icon,
  colorClass = 'text-violet-600 dark:text-violet-300',
}: EnhancedMetricCardProps) {
  return (
    <Card variant="interactive">
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className={cn('text-sm font-medium', textColors.secondary)}>{title}</div>
            {icon && <span className="text-xl">{icon}</span>}
          </div>
          <div className={`text-2xl font-bold ${colorClass}`}>
            {typeof value === 'number' && formatter ? formatter(value) : value}
          </div>
          {trend !== undefined && (
            <div className="flex items-center gap-2">
              <TrendIndicator
                value={trend}
                {...(formatter ? { formatter } : {})}
                invertColors={invertTrendColors}
              />
              {trendLabel && (
                <span className={cn('text-xs', textColors.muted)}>{trendLabel}</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
