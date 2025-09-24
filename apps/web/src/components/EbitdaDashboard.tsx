import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmployeeManager,
  ExpenseTypesManager,
  FinancialsInputForm,
  ForecastResults,
  ScenarioConfig,
  type EbitdaForecastResult,
  type EmployeeData,
  type ExpenseTypeData,
  type MonthlyFinancialsData,
  type ScenarioConfigData,
} from '@financial-analysis/ui';
import { useCallback, useEffect, useState } from 'react';

type DashboardScenarioConfig = ScenarioConfigData & {
  scenarioName: string;
  scenarioDescription?: string;
  operatingExpenseGrowthRate: number;
  billableHoursGrowthRate: number;
  inflationRate: number;
  competitionFactor: number;
  seasonalityFactors?: number[];
};

interface DashboardState {
  financials: MonthlyFinancialsData;
  employees: EmployeeData[];
  expenseTypes: ExpenseTypeData[];
  scenarioConfig: DashboardScenarioConfig;
  isLoading: boolean;
  results: EbitdaForecastResult | null;
  error: string | null;
  isHydrated: boolean;
}

const monthOrder: Array<keyof MonthlyFinancialsData> = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];

const monthIndexMap: Record<keyof MonthlyFinancialsData, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const initialState: DashboardState = {
  financials: {},
  employees: [],
  expenseTypes: [],
  scenarioConfig: {
    scenarioName: 'Baseline Plan',
    scenarioDescription: '',
    projectionMonths: 12,
    revenueGrowthRate: 0.05,
    marketGrowthFactor: 1.0,
    operatingExpenseGrowthRate: 0.02,
    billableHoursGrowthRate: 0.01,
    inflationRate: 0.03,
    competitionFactor: 1.0,
    seasonalityFactors: undefined,
  },
  isLoading: false,
  results: null,
  error: null,
  isHydrated: false,
};

export function EbitdaDashboard() {
  const [state, setState] = useState<DashboardState>(initialState);

  // Handle client-side hydration
  useEffect(() => {
    setState((prev) => ({ ...prev, isHydrated: true }));
  }, []);

  // Show loading state during hydration
  if (!state.isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading EBITDA Dashboard...</p>
        </div>
      </div>
    );
  }

  const updateFinancials = useCallback((financials: MonthlyFinancialsData) => {
    setState((prev) => ({ ...prev, financials, results: null, error: null }));
  }, []);

  const updateEmployees = useCallback((employees: EmployeeData[]) => {
    setState((prev) => ({ ...prev, employees, results: null, error: null }));
  }, []);

  const updateExpenseTypes = useCallback((expenseTypes: ExpenseTypeData[]) => {
    setState((prev) => ({ ...prev, expenseTypes, results: null, error: null }));
  }, []);

  const updateScenarioConfig = useCallback((scenarioConfig: ScenarioConfigData) => {
    setState((prev) => ({
      ...prev,
      scenarioConfig: {
        ...prev.scenarioConfig,
        ...scenarioConfig,
      },
      results: null,
      error: null,
    }));
  }, []);

  const generateForecast = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const currentYear = new Date().getFullYear();
      const monthlyFinancials = monthOrder
        .map((monthKey) => {
          const revenue = state.financials[monthKey];
          if (revenue === undefined || revenue === null || revenue <= 0) {
            return null;
          }
          return {
            month: monthIndexMap[monthKey],
            year: currentYear,
            revenue,
            costOfGoodsSold: 0,
            operatingExpenses: 0,
            depreciation: 0,
            amortization: 0,
            interestExpense: 0,
            taxes: 0,
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

      if (monthlyFinancials.length === 0) {
        throw new Error(
          'Please provide revenue for at least one month before generating a forecast.'
        );
      }

      const currentEmployees = state.employees.map((employee) => ({
        id: employee.id,
        name: employee.name,
        role: employee.department || 'Employee',
        department: employee.department || 'General',
        billableHoursPerMonth: employee.billableHoursPerMonth ?? 0,
        hourlyRate: employee.hourlyRate ?? 0,
        salary: employee.currentSalary ?? 0,
        benefits: 0,
        startDate: new Date(currentYear, 0, 1).toISOString(),
        isActive: employee.isActive,
      }));

      const additionalExpenses = state.expenseTypes
        .filter((expense) => expense.isActive)
        .map((expense) => ({
          id: expense.id,
          name: expense.name,
          category: expense.category === 'mixed' ? 'semi-variable' : expense.category,
          amount: expense.currentMonthlyAmount,
          frequency: 'monthly' as const,
          isRecurring: true,
          description: `${expense.name} expense`,
          startMonth: 1,
          growthRate: expense.growthRate ?? 0,
        }));

      const scenarioConfig = state.scenarioConfig;
      const hasSeasonality =
        Array.isArray(scenarioConfig.seasonalityFactors) &&
        scenarioConfig.seasonalityFactors.length === 12;
      const marketGrowthRate = clamp(scenarioConfig.marketGrowthFactor - 1, -1, 1);
      const scenarioName = scenarioConfig.scenarioName.trim() || 'EBITDA Forecast Scenario';
      const scenarioDescription = scenarioConfig.scenarioDescription?.trim();

      const scenarioPayload = {
        name: scenarioName,
        ...(scenarioDescription ? { description: scenarioDescription } : {}),
        forecastPeriodMonths: scenarioConfig.projectionMonths,
        currentMonthlyFinancials: monthlyFinancials,
        currentEmployees,
        newEmployees: [],
        revenueGrowthRate: scenarioConfig.revenueGrowthRate,
        billableHoursGrowthRate: scenarioConfig.billableHoursGrowthRate,
        additionalExpenses,
        operatingExpenseGrowthRate: scenarioConfig.operatingExpenseGrowthRate,
        inflationRate: scenarioConfig.inflationRate,
        ...(marketGrowthRate !== 0 || scenarioConfig.competitionFactor !== 1 || hasSeasonality
          ? {
              economicFactors: {
                marketGrowth: marketGrowthRate,
                competitionFactor: scenarioConfig.competitionFactor,
                ...(hasSeasonality
                  ? { seasonalityFactors: scenarioConfig.seasonalityFactors }
                  : {}),
              },
            }
          : {}),
      };

      const response = await fetch('/v1/api/analysis/ebitda-forecast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scenarioPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const results = (await response.json()) as EbitdaForecastResult;
      setState((prev) => ({ ...prev, results, isLoading: false }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      setState((prev) => ({ ...prev, error: message, isLoading: false }));
    }
  }, [state.financials, state.employees, state.expenseTypes, state.scenarioConfig]);

  const clearResults = useCallback(() => {
    setState((prev) => ({ ...prev, results: null, error: null }));
  }, []);

  const hasValidData = () => {
    const hasFinancials = Object.values(state.financials).some((value) => (value || 0) > 0);
    return hasFinancials;
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                EBITDA Forecasting Dashboard
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Configure your business parameters and generate comprehensive financial forecasts
            </p>
            {state.results && (
              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                ✅ Forecast generated for {state.results.forecast.length} months
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {state.results && (
              <Button variant="outline" onClick={clearResults} className="whitespace-nowrap">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                New Forecast
              </Button>
            )}
            <Button
              onClick={generateForecast}
              disabled={!hasValidData() || state.isLoading}
              className="min-w-[160px] bg-blue-600 hover:bg-blue-700"
            >
              {state.isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Generate Forecast
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Error Display */}
      {state.error && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
                Forecast Generation Error
              </h3>
              <div className="mt-2 text-red-700 dark:text-red-300">
                <p className="leading-relaxed">{state.error}</p>
              </div>
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => setState((prev) => ({ ...prev, error: null }))}
                  className="text-red-700 border-red-300 hover:bg-red-50"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Display */}
      {state.results && <ForecastResults results={state.results} showDetails={true} />}

      {/* Input Forms with Improved Layout */}
      {!state.results && (
        <>
          {/* Progress Indicator */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Setup Progress
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div
                className={`text-center p-3 rounded-lg border ${
                  Object.values(state.financials).some((v) => (v || 0) > 0)
                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                    : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                }`}
              >
                <div
                  className={`text-2xl mb-2 ${
                    Object.values(state.financials).some((v) => (v || 0) > 0)
                      ? 'text-green-600'
                      : 'text-gray-400'
                  }`}
                >
                  💰
                </div>
                <div className="text-sm font-medium">Revenue Data</div>
              </div>
              <div
                className={`text-center p-3 rounded-lg border ${
                  state.employees.length > 0
                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                    : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                }`}
              >
                <div
                  className={`text-2xl mb-2 ${
                    state.employees.length > 0 ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  👥
                </div>
                <div className="text-sm font-medium">Employees ({state.employees.length})</div>
              </div>
              <div
                className={`text-center p-3 rounded-lg border ${
                  state.expenseTypes.length > 0
                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                    : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                }`}
              >
                <div
                  className={`text-2xl mb-2 ${
                    state.expenseTypes.length > 0 ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  📊
                </div>
                <div className="text-sm font-medium">Expenses ({state.expenseTypes.length})</div>
              </div>
              <div className="text-center p-3 rounded-lg border bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                <div className="text-2xl mb-2 text-blue-600">⚙️</div>
                <div className="text-sm font-medium">Scenario Config</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="space-y-8">
              <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <svg
                        className="w-5 h-5 text-green-600 dark:text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                        />
                      </svg>
                    </div>
                    Current Year Monthly Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <FinancialsInputForm
                    data={state.financials}
                    onChange={updateFinancials}
                    title=""
                  />
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <svg
                        className="w-5 h-5 text-purple-600 dark:text-purple-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    Scenario Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ScenarioConfig data={state.scenarioConfig} onChange={updateScenarioConfig} />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-8">
              <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <svg
                        className="w-5 h-5 text-blue-600 dark:text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                        />
                      </svg>
                    </div>
                    Employee Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <EmployeeManager employees={state.employees} onChange={updateEmployees} />
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                      <svg
                        className="w-5 h-5 text-orange-600 dark:text-orange-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    Expense Types
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ExpenseTypesManager
                    expenseTypes={state.expenseTypes}
                    onChange={updateExpenseTypes}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Enhanced Help Text */}
      {!state.results && !hasValidData() && (
        <Card className="border-2 border-dashed border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Welcome to EBITDA Forecasting
                </h3>
                <p className="text-blue-700 dark:text-blue-300 text-lg leading-relaxed">
                  Let's create your financial forecast in a few simple steps
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-blue-200 dark:border-blue-700">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-left">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        Revenue Data
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Enter monthly revenue
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        Add Employees
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Salary & billable hours
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        Expense Types
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Monthly amounts
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      4
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">Configure</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Scenario settings
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      ✓
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">Generate</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Your forecast</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
