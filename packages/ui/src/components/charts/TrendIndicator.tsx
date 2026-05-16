export interface TrendIndicatorProps {
  value: number;
  formatter?: (value: number) => string;
  showPercentage?: boolean;
  invertColors?: boolean;
}

export function TrendIndicator({
  value,
  formatter,
  showPercentage = true,
  invertColors = false,
}: TrendIndicatorProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;

  // For metrics like expenses, positive is bad (red), negative is good (green)
  const colorClass = invertColors
    ? isPositive
      ? 'text-rose-600 dark:text-rose-300'
      : isNegative
        ? 'text-emerald-600 dark:text-emerald-300'
        : 'text-slate-600 dark:text-slate-400'
    : isPositive
      ? 'text-emerald-600 dark:text-emerald-300'
      : isNegative
        ? 'text-rose-600 dark:text-rose-300'
        : 'text-slate-600 dark:text-slate-400';

  const icon = isPositive ? '↑' : isNegative ? '↓' : '→';

  const displayValue = formatter
    ? formatter(Math.abs(value))
    : showPercentage
      ? `${Math.abs(value).toFixed(1)}%`
      : Math.abs(value).toFixed(2);

  return (
    <span className={`inline-flex items-center gap-1 text-sm font-medium ${colorClass}`}>
      <span className="text-base">{icon}</span>
      <span>{displayValue}</span>
    </span>
  );
}
