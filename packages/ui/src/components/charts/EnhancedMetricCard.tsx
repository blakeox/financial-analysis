import { Card, CardContent } from '../Card';
import { TrendIndicator } from './TrendIndicator';

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
  colorClass = 'text-blue-600 dark:text-blue-400',
}: EnhancedMetricCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</div>
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
                <span className="text-xs text-gray-500 dark:text-gray-400">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
