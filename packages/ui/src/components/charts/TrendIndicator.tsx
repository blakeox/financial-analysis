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
      ? 'text-red-600 dark:text-red-400'
      : isNegative
        ? 'text-green-600 dark:text-green-400'
        : 'text-gray-600 dark:text-gray-400'
    : isPositive
      ? 'text-green-600 dark:text-green-400'
      : isNegative
        ? 'text-red-600 dark:text-red-400'
        : 'text-gray-600 dark:text-gray-400';

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
