import { Card, CardContent, CardHeader, CardTitle } from './Card';

export interface MonthlyForecast {
  month: number;
  year: number;
  revenue: number;
  totalExpenses: number;
  ebitda: number;
  ebitdaMargin: number;
  employeeCount: number;
  notes?: string[];
}

export interface ForecastSummary {
  totalRevenue: number;
  totalEbitda: number;
  averageEbitdaMargin: number;
  revenueGrowth: number;
  finalEmployeeCount: number;
  breakEvenMonth?: number;
}

export interface EbitdaForecastResult {
  forecast: MonthlyForecast[];
  summary: ForecastSummary;
  scenario: {
    name: string;
    description?: string;
  };
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

const formatPercentage = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
};

const getMonthName = (month: number) => {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  return months[month - 1] || 'Unknown';
};

export function ForecastResults({ results, showDetails = true }: ForecastResultsProps) {
  const { forecast, summary, scenario } = results;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
      </div>

      {/* Scenario Info */}
      <Card>
        <CardHeader>
          <CardTitle>{scenario.name}</CardTitle>
        </CardHeader>
        <CardContent>
          {scenario.description && (
            <p className="text-gray-600 dark:text-gray-300 mb-4">{scenario.description}</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Final Employee Count:</span> {summary.finalEmployeeCount}
            </div>
            {summary.breakEvenMonth && (
              <div>
                <span className="font-medium">Break-even Month:</span> {summary.breakEvenMonth}
              </div>
            )}
            <div>
              <span className="font-medium">Forecast Period:</span> {forecast.length} months
            </div>
          </div>
        </CardContent>
      </Card>

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
                  </tr>
                </thead>
                <tbody>
                  {forecast.map((month) => (
                    <tr 
                      key={`${month.year}-${month.month}`}
                      className={`border-b border-gray-100 dark:border-gray-800 ${
                        month.ebitda < 0 ? 'bg-red-50 dark:bg-red-900/10' : ''
                      }`}
                    >
                      <td className="p-2 font-medium">
                        {getMonthName(month.month)} {month.year}
                      </td>
                      <td className="p-2 text-right">{formatCurrency(month.revenue)}</td>
                      <td className="p-2 text-right">{formatCurrency(month.totalExpenses)}</td>
                      <td className={`p-2 text-right font-medium ${
                        month.ebitda >= 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {formatCurrency(month.ebitda)}
                      </td>
                      <td className="p-2 text-right">{formatPercentage(month.ebitdaMargin)}</td>
                      <td className="p-2 text-right">{month.employeeCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visual Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Forecast Visualization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-md flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">
              Chart visualization would go here<br />
              <span className="text-sm">(Revenue, EBITDA, and Margin trends over time)</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}