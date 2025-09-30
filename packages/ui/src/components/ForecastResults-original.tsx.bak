import { Card, CardContent, CardHeader, CardTitle } from './Card';

export interface MonthlyForecast {
  month: number;
  year: number;
  revenue: number;
  totalExpenses?: number;
  operatingExpenses?: number;
  costOfGoodsSold?: number;
  grossProfit?: number;
  ebitda: number;
  ebitdaMargin?: number;
  employeeCount: number;
  employeeCosts?: number;
  billableHours?: number;
  depreciation?: number;
  amortization?: number;
  interestExpense?: number;
  taxes?: number;
  netIncome?: number;
  notes?: string[];
}

export interface ForecastSummary {
  totalRevenue: number;
  totalEbitda: number;
  averageEbitdaMargin: number;
  revenueGrowth: number;
  finalEmployeeCount: number;
  breakEvenMonth?: number;
  totalOperatingExpenses?: number;
  totalEmployeeCosts?: number;
  ebitdaGrowth?: number;
}

export interface KeyMetrics {
  revenuePerEmployee: number;
  ebitdaPerEmployee: number;
  averageBillableHours: number;
  revenuePerBillableHour: number;
}

export interface EbitdaForecastResult {
  forecast: MonthlyForecast[];
  summary: ForecastSummary;
  scenario: {
    name: string;
    description?: string;
    forecastPeriodMonths?: number;
    economicFactors?: {
      marketGrowth?: number;
      competitionFactor?: number;
      seasonalityFactors?: number[];
    };
  };
  keyMetrics?: KeyMetrics;
}

export interface ForecastResultsProps {
  results: EbitdaForecastResult;
  showDetails?: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatCompactCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
};

const normalizePercentage = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  return value > 1 ? value / 100 : value;
};

const formatPercentage = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(normalizePercentage(value));
};

const getMonthName = (month: number) => {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return months[month - 1] || 'Unknown';
};

const computeTotalExpenses = (month: MonthlyForecast) => {
  if (typeof month.totalExpenses === 'number') {
    return month.totalExpenses;
  }
  const operating = month.operatingExpenses ?? 0;
  const cogs = month.costOfGoodsSold ?? 0;
  const depreciation = month.depreciation ?? 0;
  const amortization = month.amortization ?? 0;
  const interest = month.interestExpense ?? 0;
  const taxes = month.taxes ?? 0;
  return operating + cogs + depreciation + amortization + interest + taxes;
};

const createSparklinePaths = (values: number[], width: number, height: number) => {
  if (values.length === 0) return { line: '', area: '' };
  if (values.length === 1) {
    const x = width / 2;
    const y = height / 2;
    const point = `M${x},${y}`;
    const area = `${point} L${width},${height} L0,${height} Z`;
    return { line: point, area };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / Math.max(values.length - 1, 1);

  const points = values.map((value, index) => {
    const x = Number((index * step).toFixed(2));
    const y = Number((height - ((value - min) / range) * height).toFixed(2));
    return { x, y: Number.isFinite(y) ? y : height / 2 };
  });

  const line = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`)
    .join(' ');

  const lastPoint = points[points.length - 1] ?? { x: width, y: height };
  const firstPoint = points[0] ?? { x: 0, y: height };
  const area = `${line} L${lastPoint.x},${height} L${firstPoint.x},${height} Z`;

  return { line, area };
};

interface SparklineChartProps {
  title: string;
  values: number[];
  color: string;
  formatter: (value: number) => string;
}

function SparklineChart({ title, values, color, formatter }: SparklineChartProps) {
  const width = 600;
  const height = 120;
  const { line, area } = createSparklinePaths(values, width, height);

  if (!values.length) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <svg width="32" height="8" viewBox="0 0 32 8" aria-hidden="true" role="presentation">
            <rect width="32" height="8" rx="4" fill={color} />
          </svg>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <svg width="32" height="8" viewBox="0 0 32 8" aria-hidden="true" role="presentation">
          <rect width="32" height="8" rx="4" fill={color} />
        </svg>
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-32"
        role="img"
        aria-label={`${title} trend over time`}
      >
        <path d={area} fill={`${color}22`} role="presentation" />
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{formatter(values[0] ?? 0)}</span>
        <span>{formatter(values[values.length - 1] ?? values[0] ?? 0)}</span>
      </div>
    </div>
  );
}

export function ForecastResults({ results, showDetails = true }: ForecastResultsProps) {
  const { forecast, summary, scenario, keyMetrics } = results;

  const breakEvenIndex = summary.breakEvenMonth
    ? summary.breakEvenMonth - 1
    : forecast.findIndex((month) => month.ebitda >= 0);

  const breakEvenLabel =
    breakEvenIndex >= 0 && forecast[breakEvenIndex]
      ? `${getMonthName(forecast[breakEvenIndex].month)} ${forecast[breakEvenIndex].year}`
      : 'Not reached';

  const revenueSeries = forecast.map((month) => month.revenue);
  const ebitdaSeries = forecast.map((month) => month.ebitda);
  const marginSeries = forecast.map(
    (month) =>
      month.ebitdaMargin ?? (month.revenue !== 0 ? (month.ebitda / month.revenue) * 100 : 0)
  );

  const hasNotes = forecast.some((month) => month.notes && month.notes.length > 0);

  const economicFactors = scenario.economicFactors;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(summary.totalRevenue)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Total Revenue</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(summary.totalEbitda)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Total EBITDA</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatPercentage(summary.averageEbitdaMargin)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Avg EBITDA Margin</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {formatPercentage(summary.revenueGrowth)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Revenue Growth</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {formatCurrency(
                  summary.totalOperatingExpenses ??
                    forecast.reduce((sum, month) => sum + computeTotalExpenses(month), 0)
                )}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Total Operating Expenses
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                {formatPercentage(summary.ebitdaGrowth ?? 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">EBITDA Growth</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scenario Info */}
      <Card>
        <CardHeader>
          <CardTitle>{scenario.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {scenario.description && (
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {scenario.description}
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Forecast Period:</span>{' '}
              {scenario.forecastPeriodMonths ?? forecast.length} months
            </div>
            <div>
              <span className="font-medium">Final Employee Count:</span>{' '}
              {summary.finalEmployeeCount}
            </div>
            <div>
              <span className="font-medium">Break-even:</span> {breakEvenLabel}
            </div>
            <div>
              <span className="font-medium">Total Employee Costs:</span>{' '}
              {summary.totalEmployeeCosts !== undefined
                ? formatCurrency(summary.totalEmployeeCosts)
                : formatCurrency(
                    forecast.reduce((sum, month) => sum + (month.employeeCosts ?? 0), 0)
                  )}
            </div>
          </div>

          {economicFactors && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Market Growth:</span>{' '}
                {formatPercentage(economicFactors.marketGrowth ?? 0)}
              </div>
              <div>
                <span className="font-medium">Competition Factor:</span>{' '}
                {(economicFactors.competitionFactor ?? 1).toFixed(2)}
              </div>
              {economicFactors.seasonalityFactors && (
                <div>
                  <span className="font-medium">Seasonality Range:</span>{' '}
                  {Math.min(...economicFactors.seasonalityFactors).toFixed(2)} –{' '}
                  {Math.max(...economicFactors.seasonalityFactors).toFixed(2)}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Metrics */}
      {keyMetrics && (
        <Card>
          <CardHeader>
            <CardTitle>Key Operational Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10">
                <div className="text-sm text-blue-700 dark:text-blue-300">Revenue / Employee</div>
                <div className="text-2xl font-semibold text-blue-900 dark:text-blue-100">
                  {formatCurrency(keyMetrics.revenuePerEmployee)}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/10">
                <div className="text-sm text-green-700 dark:text-green-300">EBITDA / Employee</div>
                <div className="text-2xl font-semibold text-green-900 dark:text-green-100">
                  {formatCurrency(keyMetrics.ebitdaPerEmployee)}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/10">
                <div className="text-sm text-purple-700 dark:text-purple-300">
                  Avg Billable Hours
                </div>
                <div className="text-2xl font-semibold text-purple-900 dark:text-purple-100">
                  {keyMetrics.averageBillableHours.toFixed(1)} hrs
                </div>
              </div>
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/10">
                <div className="text-sm text-amber-700 dark:text-amber-300">
                  Revenue / Billable Hr
                </div>
                <div className="text-2xl font-semibold text-amber-900 dark:text-amber-100">
                  {formatCurrency(keyMetrics.revenuePerBillableHour)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Forecast Table */}
      {showDetails && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Forecast Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left p-2">Month</th>
                    <th className="text-right p-2">Revenue</th>
                    <th className="text-right p-2">Expenses</th>
                    <th className="text-right p-2">EBITDA</th>
                    <th className="text-right p-2">Margin</th>
                    <th className="text-right p-2">Employees</th>
                    {hasNotes && <th className="text-left p-2">Notes</th>}
                  </tr>
                </thead>
                <tbody>
                  {forecast.map((month, index) => {
                    const totalExpenses = computeTotalExpenses(month);
                    const margin =
                      month.ebitdaMargin ??
                      (month.revenue !== 0 ? (month.ebitda / month.revenue) * 100 : 0);
                    const isBreakEvenMonth = index === breakEvenIndex;
                    return (
                      <tr
                        key={`${month.year}-${month.month}`}
                        className={`border-b border-gray-100 dark:border-gray-800 ${
                          month.ebitda < 0
                            ? 'bg-red-50 dark:bg-red-900/10'
                            : isBreakEvenMonth
                              ? 'bg-emerald-50/60 dark:bg-emerald-900/10'
                              : ''
                        }`}
                      >
                        <td className="p-2 font-medium">
                          {getMonthName(month.month)} {month.year}
                        </td>
                        <td className="p-2 text-right">{formatCurrency(month.revenue)}</td>
                        <td className="p-2 text-right">{formatCurrency(totalExpenses)}</td>
                        <td
                          className={`p-2 text-right font-medium ${
                            month.ebitda >= 0
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {formatCurrency(month.ebitda)}
                        </td>
                        <td className="p-2 text-right">{formatPercentage(margin)}</td>
                        <td className="p-2 text-right">{month.employeeCount}</td>
                        {hasNotes && (
                          <td className="p-2 text-left text-gray-600 dark:text-gray-300">
                            {month.notes?.join(', ') ?? '—'}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Forecast Visualization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SparklineChart
              title="Revenue"
              values={revenueSeries}
              color="#2563eb"
              formatter={formatCompactCurrency}
            />
            <SparklineChart
              title="EBITDA"
              values={ebitdaSeries}
              color="#16a34a"
              formatter={formatCompactCurrency}
            />
            <SparklineChart
              title="EBITDA Margin"
              values={marginSeries}
              color="#7c3aed"
              formatter={(value) => formatPercentage(value)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
