import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { ScrollableRegion } from './ScrollableRegion';
import { Button } from './Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';
import {
  DualAxisChart,
  WaterfallChart,
  StackedBarChart,
  EnhancedMetricCard,
  type WaterfallDataPoint,
} from './charts';
import { cn, textColors } from '../lib/classNames';

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

type TabId = 'overview' | 'charts' | 'details' | 'export';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const tabs: Tab[] = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'charts', label: 'Charts', icon: '📈' },
  { id: 'details', label: 'Details', icon: '📋' },
  { id: 'export', label: 'Export', icon: '💾' },
];

export function ForecastResults({ results, showDetails = true }: ForecastResultsProps) {
  const { forecast, summary, keyMetrics } = results;

  const breakEvenIndex = summary.breakEvenMonth
    ? summary.breakEvenMonth - 1
    : forecast.findIndex((month) => month.ebitda >= 0);

  const breakEvenLabel =
    breakEvenIndex >= 0 && forecast[breakEvenIndex]
      ? `${getMonthName(forecast[breakEvenIndex].month)} ${forecast[breakEvenIndex].year}`
      : 'Not reached';

  // Calculate trends (comparing last vs first month)
  const firstMonth = forecast[0];
  const lastMonth = forecast[forecast.length - 1];

  const revenueTrend =
    firstMonth && lastMonth
      ? ((lastMonth.revenue - firstMonth.revenue) / firstMonth.revenue) * 100
      : 0;

  const ebitdaTrend =
    firstMonth && lastMonth && firstMonth.ebitda !== 0
      ? ((lastMonth.ebitda - firstMonth.ebitda) / Math.abs(firstMonth.ebitda)) * 100
      : 0;

  const marginTrend =
    firstMonth && lastMonth ? (lastMonth.ebitdaMargin ?? 0) - (firstMonth.ebitdaMargin ?? 0) : 0;

  // Prepare chart data
  const revenueMarginData = forecast.map((month) => ({
    name: `${getMonthName(month.month)}'${month.year.toString().slice(-2)}`,
    value1: month.revenue,
    value2: month.ebitdaMargin ?? (month.revenue !== 0 ? (month.ebitda / month.revenue) * 100 : 0),
  }));

  // Prepare waterfall data (EBITDA bridge using first month)
  const waterfallData: WaterfallDataPoint[] = firstMonth
    ? [
        { name: 'Revenue', value: firstMonth.revenue, isTotal: false },
        { name: 'COGS', value: -(firstMonth.costOfGoodsSold ?? 0), isTotal: false },
        { name: 'Op Expenses', value: -(firstMonth.operatingExpenses ?? 0), isTotal: false },
        { name: 'Employee Costs', value: -(firstMonth.employeeCosts ?? 0), isTotal: false },
        { name: 'EBITDA', value: firstMonth.ebitda, isTotal: true },
      ]
    : [];

  // Prepare expense breakdown data (first 6 months)
  const expenseData = forecast.slice(0, 6).map((month) => ({
    name: `${getMonthName(month.month)}`,
    cogs: month.costOfGoodsSold ?? 0,
    opex: month.operatingExpenses ?? 0,
    employees: month.employeeCosts ?? 0,
  }));

  const expenseStacks = [
    { dataKey: 'cogs', name: 'COGS', color: '#ef4444' },
    { dataKey: 'opex', name: 'Operating', color: '#f59e0b' },
    { dataKey: 'employees', name: 'Employees', color: '#3b82f6' },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="h-auto w-full justify-start overflow-x-auto">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab Content */}
        <TabsContent value="overview">
          <div className="space-y-6">
            {/* Enhanced KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <EnhancedMetricCard
                title="Total Revenue"
                value={summary.totalRevenue}
                formatter={formatCompactCurrency}
                trend={revenueTrend}
                trendLabel="vs first month"
                icon="💰"
                colorClass="text-emerald-600 dark:text-emerald-300"
              />
              <EnhancedMetricCard
                title="Total EBITDA"
                value={summary.totalEbitda}
                formatter={formatCompactCurrency}
                trend={ebitdaTrend}
                trendLabel="vs first month"
                icon="📈"
                colorClass={
                  summary.totalEbitda >= 0
                    ? 'text-emerald-600 dark:text-emerald-300'
                    : 'text-rose-600 dark:text-rose-300'
                }
              />
              <EnhancedMetricCard
                title="Avg EBITDA Margin"
                value={formatPercentage(summary.averageEbitdaMargin)}
                trend={marginTrend}
                trendLabel="vs first month"
                icon="📊"
                colorClass="text-violet-600 dark:text-violet-300"
              />
              <EnhancedMetricCard
                title="Break Even"
                value={breakEvenLabel}
                icon="🎯"
                colorClass="text-sky-600 dark:text-sky-300"
              />
            </div>

            {/* Primary Charts */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue & Margin Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <DualAxisChart
                  data={revenueMarginData}
                  value1Label="Revenue"
                  value2Label="EBITDA Margin %"
                  value1Formatter={formatCompactCurrency}
                  value2Formatter={(val) => `${val.toFixed(1)}%`}
                />
              </CardContent>
            </Card>

            {keyMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-violet-600 dark:text-violet-300">
                        {formatCurrency(keyMetrics.revenuePerEmployee)}
                      </div>
                      <div className={cn('text-sm', textColors.secondary)}>Revenue / Employee</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-300">
                        {formatCurrency(keyMetrics.ebitdaPerEmployee)}
                      </div>
                      <div className={cn('text-sm', textColors.secondary)}>EBITDA / Employee</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-sky-600 dark:text-sky-300">
                        {keyMetrics.averageBillableHours.toFixed(0)}
                      </div>
                      <div className={cn('text-sm', textColors.secondary)}>Avg Billable Hours</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-600 dark:text-amber-300">
                        {formatCurrency(keyMetrics.revenuePerBillableHour)}
                      </div>
                      <div className={cn('text-sm', textColors.secondary)}>
                        Revenue / Billable Hour
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="charts">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue & EBITDA Margin Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <DualAxisChart
                  data={revenueMarginData}
                  value1Label="Revenue"
                  value2Label="EBITDA Margin %"
                  value1Formatter={formatCompactCurrency}
                  value2Formatter={(val) => `${val.toFixed(1)}%`}
                  height={450}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>EBITDA Bridge (First Month)</CardTitle>
              </CardHeader>
              <CardContent>
                <WaterfallChart
                  data={waterfallData}
                  formatter={formatCompactCurrency}
                  height={400}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown (First 6 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                <StackedBarChart
                  data={expenseData}
                  stacks={expenseStacks}
                  formatter={formatCompactCurrency}
                  height={400}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {showDetails && (
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollableRegion label="Monthly forecast breakdown table">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800">
                        <th className="text-left p-2">Month</th>
                        <th className="text-right p-2">Revenue</th>
                        <th className="text-right p-2">EBITDA</th>
                        <th className="text-right p-2">Margin %</th>
                        <th className="text-right p-2">Employees</th>
                        <th className="text-right p-2">Total Expenses</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forecast.map((month, index) => (
                        <tr
                          key={index}
                          className="border-b border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/50"
                        >
                          <td className="p-2">
                            {getMonthName(month.month)} {month.year}
                          </td>
                          <td className="text-right p-2 font-medium text-emerald-600 dark:text-emerald-300">
                            {formatCurrency(month.revenue)}
                          </td>
                          <td
                            className={`text-right p-2 font-medium ${
                              month.ebitda >= 0
                                ? 'text-emerald-600 dark:text-emerald-300'
                                : 'text-rose-600 dark:text-rose-300'
                            }`}
                          >
                            {formatCurrency(month.ebitda)}
                          </td>
                          <td className="text-right p-2">
                            {formatPercentage(month.ebitdaMargin ?? 0)}
                          </td>
                          <td className="text-right p-2">{month.employeeCount}</td>
                          <td className="text-right p-2 text-rose-600 dark:text-rose-300">
                            {formatCurrency(month.totalExpenses ?? 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollableRegion>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle>Export Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className={cn('text-sm', textColors.secondary)}>
                  Export your forecast data and charts in various formats:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    onClick={() => exportToCSV(forecast)}
                    className="justify-center gap-2 px-4 py-3"
                  >
                    <span>📄</span>
                    <span>Export to CSV</span>
                  </Button>
                  <Button
                    onClick={() => copyToClipboard(forecast)}
                    variant="success"
                    className="justify-center gap-2 px-4 py-3"
                  >
                    <span>📋</span>
                    <span>Copy to Clipboard</span>
                  </Button>
                  <Button
                    onClick={() => alert('Chart export feature coming soon!')}
                    variant="secondary"
                    className="justify-center gap-2 px-4 py-3"
                  >
                    <span>📊</span>
                    <span>Export Charts</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Export utilities
function exportToCSV(forecast: MonthlyForecast[]) {
  const headers = [
    'Month',
    'Year',
    'Revenue',
    'EBITDA',
    'EBITDA Margin %',
    'Employees',
    'Total Expenses',
    'Employee Costs',
    'Operating Expenses',
    'COGS',
  ];

  const rows = forecast.map((month) => [
    getMonthName(month.month),
    month.year,
    month.revenue,
    month.ebitda,
    month.ebitdaMargin ?? 0,
    month.employeeCount,
    month.totalExpenses ?? 0,
    month.employeeCosts ?? 0,
    month.operatingExpenses ?? 0,
    month.costOfGoodsSold ?? 0,
  ]);

  const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ebitda-forecast-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function copyToClipboard(forecast: MonthlyForecast[]) {
  const headers = ['Month', 'Year', 'Revenue', 'EBITDA', 'EBITDA Margin %', 'Employees'];

  const rows = forecast.map((month) => [
    getMonthName(month.month),
    month.year,
    formatCurrency(month.revenue),
    formatCurrency(month.ebitda),
    formatPercentage(month.ebitdaMargin ?? 0),
    month.employeeCount,
  ]);

  const text = [headers.join('\t'), ...rows.map((row) => row.join('\t'))].join('\n');

  navigator.clipboard.writeText(text).then(
    () => alert('Data copied to clipboard!'),
    () => alert('Failed to copy data')
  );
}
