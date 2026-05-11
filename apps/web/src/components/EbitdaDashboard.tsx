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
  ModuleSelector,
  FixedAssetsManager,
  LeasesManager,
  type ModuleType,
  type EbitdaForecastResult,
  type EmployeeData,
  type ExpenseTypeData,
  type FixedAssetData,
  type LeaseData,
  type MonthlyFinancialsData,
  type ScenarioConfigData,
  buildScenarioPayload,
  cn,
  type DashboardScenarioConfig,
  textColors,
} from '@financial-analysis/ui';
import { useCallback, useState } from 'react';

declare global {
  interface Window {
    analysisResults?: Record<string, unknown>;
  }
}

interface DashboardState {
  financials: MonthlyFinancialsData;
  employees: EmployeeData[];
  expenseTypes: ExpenseTypeData[];
  fixedAssets: FixedAssetData[];
  leases: LeaseData[];
  scenarioConfig: DashboardScenarioConfig;
  isLoading: boolean;
  results: EbitdaForecastResult | null;
  error: string | null;
  isHydrated: boolean;
}

const initialState: DashboardState = {
  financials: {},
  employees: [],
  expenseTypes: [],
  fixedAssets: [],
  leases: [],
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
  isHydrated: true, // Set to true since we use client:only="react" directive
};

export function EbitdaDashboard() {
  const [state, setState] = useState<DashboardState>(initialState);
  const [activeModules, setActiveModules] = useState<ModuleType[]>([]);

  // No hydration check needed with client:only="react" directive

  const updateFinancials = useCallback((financials: MonthlyFinancialsData) => {
    setState((prev) => ({ ...prev, financials, results: null, error: null }));
  }, []);

  const updateEmployees = useCallback((employees: EmployeeData[]) => {
    setState((prev) => ({ ...prev, employees, results: null, error: null }));
  }, []);

  const updateExpenseTypes = useCallback((expenseTypes: ExpenseTypeData[]) => {
    setState((prev) => ({ ...prev, expenseTypes, results: null, error: null }));
  }, []);

  const updateFixedAssets = useCallback((fixedAssets: FixedAssetData[]) => {
    setState((prev) => ({ ...prev, fixedAssets, results: null, error: null }));
  }, []);

  const updateLeases = useCallback((leases: LeaseData[]) => {
    setState((prev) => ({ ...prev, leases, results: null, error: null }));
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
      const scenarioPayload = buildScenarioPayload({
        financials: state.financials,
        employees: state.employees,
        expenseTypes: state.expenseTypes,
        fixedAssets: state.fixedAssets,
        leases: state.leases,
        scenarioConfig: state.scenarioConfig,
        clock: new Date(),
      });

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
      
      // Store result for chat panel
      if (typeof window !== 'undefined' && window.analysisResults) {
        window.analysisResults['analyze_ebitda_forecast'] = results;
        window.dispatchEvent(new CustomEvent('analysis-result-updated', {
          detail: { toolName: 'analyze_ebitda_forecast', result: results }
        }));
      }
      
      setState((prev) => ({ ...prev, results, isLoading: false }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      setState((prev) => ({ ...prev, error: message, isLoading: false }));
    }
  }, [
    state.financials,
    state.employees,
    state.expenseTypes,
    state.fixedAssets,
    state.leases,
    state.scenarioConfig,
  ]);

  const clearResults = useCallback(() => {
    setState((prev) => ({ ...prev, results: null, error: null }));
  }, []);

  const hasValidData = () => {
    const hasFinancials = Object.values(state.financials).some((value) => (value || 0) > 0);
    return hasFinancials;
  };

  const handleAddModule = useCallback((moduleType: ModuleType) => {
    setActiveModules((prev) => (prev.includes(moduleType) ? prev : [...prev, moduleType]));
  }, []);

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <Card variant="rail" className="bg-linear-to-r from-violet-50/90 to-emerald-50/80 dark:from-violet-950/30 dark:to-emerald-950/20">
        <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-linear-to-br from-violet-600 to-violet-700 p-2.5 text-white shadow-[0_14px_32px_rgba(109,74,255,0.28)]">
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
              <h2 className="fa-panel-title text-3xl">
                EBITDA Forecasting Dashboard
              </h2>
            </div>
            <p className="fa-model-description text-lg">
              Configure your business parameters and generate comprehensive financial forecasts
            </p>
            {state.results && (
              <div className={cn('text-sm font-medium', textColors.accent)}>
                ✅ Forecast generated for {state.results.forecast.length} months
              </div>
            )}
            {/* Summary Chips */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              {(() => {
                const activeEmployees = state.employees.filter(e => e.isActive);
                const employeeCount = activeEmployees.length;
                const monthlyDepreciation = state.fixedAssets.filter(a => a.isActive).reduce((s,a)=> s + (a.monthlyDepreciation||0),0);
                const monthlyLeasePayments = state.leases.filter(l=>l.isActive).reduce((s,l)=> s + (l.monthlyPayment||0),0);
                const monthlyOpExBaseline = state.expenseTypes.filter(e=>e.isActive).reduce((s,e)=> s + (e.currentMonthlyAmount||0),0) + monthlyLeasePayments;
                const format = (v:number) => v.toLocaleString(undefined,{style:'currency',currency:'USD',maximumFractionDigits:0});
                const chipBase = 'fa-stat-chip';
                return (
                  <>
                    <div className={chipBase}>
                      <span className="fa-help-copy uppercase tracking-wide">Active Employees</span>
                      <span className="fa-scenario-title text-lg">{employeeCount}</span>
                    </div>
                    <div className={chipBase}>
                      <span className="fa-help-copy uppercase tracking-wide">Monthly Depreciation</span>
                      <span className="fa-metric-value-info">{format(monthlyDepreciation)}</span>
                    </div>
                    <div className={chipBase}>
                      <span className="fa-help-copy uppercase tracking-wide">Lease Payments / Mo</span>
                      <span className="fa-metric-value-secondary">{format(monthlyLeasePayments)}</span>
                    </div>
                    <div className={chipBase}>
                      <span className="fa-help-copy uppercase tracking-wide">Baseline OpEx / Mo</span>
                      <span className="fa-metric-value-accent">{format(monthlyOpExBaseline)}</span>
                    </div>
                  </>
                );
              })()}
            </div>
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
              className="min-w-[160px]"
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
        </CardContent>
      </Card>

      {/* Enhanced Error Display */}
      {state.error && (
        <Card variant="subtle" className="border-rose-200 bg-rose-50/90 dark:border-rose-900/70 dark:bg-rose-950/30">
          <CardContent className="p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-rose-500" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-4 flex-1">
              <h3 className={cn('text-lg font-medium', textColors.danger)}>
                Forecast Generation Error
              </h3>
              <div className={cn('mt-2', textColors.danger)}>
                <p className="leading-relaxed">{state.error}</p>
              </div>
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => setState((prev) => ({ ...prev, error: null }))}
                  className="border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-200 dark:hover:bg-rose-950/30"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {state.results && <ForecastResults results={state.results} showDetails={true} />}

      {/* Input Forms with Improved Layout */}
      {!state.results && (
        <>
          {/* Module selector to add sections on demand */}
          <div className="fa-card p-6 mb-6">
            <ModuleSelector activeModules={activeModules} onAddModule={handleAddModule} />
          </div>

          {/* Progress Indicator */}
          <Card variant="subtle" className="p-6">
            <h3 className="fa-scenario-title mb-4">
              Setup Progress
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div
                className={`text-center ${
                  Object.values(state.financials).some((v) => (v || 0) > 0)
                    ? 'border-emerald-200 bg-emerald-50/90 dark:border-emerald-900/70 dark:bg-emerald-950/30'
                    : 'fa-subcard'
                }`}
              >
                <div
                  className={`text-2xl mb-2 ${
                    Object.values(state.financials).some((v) => (v || 0) > 0)
                      ? 'text-emerald-600 dark:text-emerald-300'
                      : textColors.muted
                  }`}
                >
                  💰
                </div>
                <div className="fa-list-copy-strong">Revenue Data</div>
              </div>
              <div
                className={`text-center ${
                  state.employees.length > 0
                    ? 'border-emerald-200 bg-emerald-50/90 dark:border-emerald-900/70 dark:bg-emerald-950/30'
                    : 'fa-subcard'
                }`}
              >
                <div
                  className={`text-2xl mb-2 ${
                    state.employees.length > 0
                      ? 'text-emerald-600 dark:text-emerald-300'
                      : textColors.muted
                  }`}
                >
                  👥
                </div>
                <div className="fa-list-copy-strong">Employees ({state.employees.length})</div>
              </div>
              <div
                className={`text-center ${
                  state.expenseTypes.length > 0
                    ? 'border-emerald-200 bg-emerald-50/90 dark:border-emerald-900/70 dark:bg-emerald-950/30'
                    : 'fa-subcard'
                }`}
              >
                <div
                  className={`text-2xl mb-2 ${
                    state.expenseTypes.length > 0
                      ? 'text-emerald-600 dark:text-emerald-300'
                      : textColors.muted
                  }`}
                >
                  📊
                </div>
                <div className="fa-list-copy-strong">Expenses ({state.expenseTypes.length})</div>
              </div>
              <div className="rounded-2xl border border-violet-200 bg-violet-50/90 p-3 text-center dark:border-violet-900/70 dark:bg-violet-950/30">
                <div className="mb-2 text-2xl text-violet-600 dark:text-violet-300">⚙️</div>
                <div className="fa-list-copy-strong">Scenario Config</div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="space-y-8">
              {activeModules.includes('financials') && (
              <Card className="fa-card">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="rounded-2xl bg-emerald-100 p-2 dark:bg-emerald-950/30">
                      <svg
                        className="w-5 h-5 text-emerald-600 dark:text-emerald-300"
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
              )}

              {activeModules.includes('scenario') && (
              <Card className="fa-card">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="rounded-2xl bg-violet-100 p-2 dark:bg-violet-950/30">
                      <svg
                        className="w-5 h-5 text-violet-600 dark:text-violet-300"
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
              )}
            </div>

            <div className="space-y-8">
              {activeModules.includes('employees') && (
              <Card className="fa-card">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="rounded-2xl bg-sky-100 p-2 dark:bg-sky-950/30">
                      <svg
                        className="w-5 h-5 text-sky-600 dark:text-sky-300"
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
              )}

              {activeModules.includes('expenses') && (
              <Card className="fa-card">
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
              )}

              {activeModules.includes('fixed-assets') && (
              <Card className="fa-card">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                      <svg
                        className="w-5 h-5 text-amber-600 dark:text-amber-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 7h18M5 7v10a2 2 0 002 2h10a2 2 0 002-2V7M8 7V5a4 4 0 118 0v2"
                        />
                      </svg>
                    </div>
                    Fixed Assets
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <FixedAssetsManager assets={state.fixedAssets} onChange={updateFixedAssets} />
                </CardContent>
              </Card>
              )}

              {activeModules.includes('leases') && (
              <Card className="fa-surface-accent border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                      <svg
                        className="w-5 h-5 text-cyan-600 dark:text-cyan-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 7h18M5 7v10a2 2 0 002 2h10a2 2 0 002-2V7M8 7V5a4 4 0 118 0v2"
                        />
                      </svg>
                    </div>
                    Leases
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <LeasesManager leases={state.leases} onChange={updateLeases} />
                </CardContent>
              </Card>
              )}
            </div>
          </div>
        </>
      )}

      {/* Enhanced Help Text */}
      {!state.results && !hasValidData() && (
        <Card
          variant="rail"
          className="fa-highlight-card border-2 border-dashed border-violet-200/80 bg-violet-50/50 dark:border-violet-900/70 dark:bg-violet-950/15"
        >
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300">
                <svg
                  className="h-8 w-8"
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
                <h3 className="fa-callout-title-info text-xl mb-2">
                  Welcome to EBITDA Forecasting
                </h3>
                <p className="fa-callout-copy-info text-lg leading-relaxed">
                  Let's create your financial forecast in a few simple steps
                </p>
              </div>
              <div className="fa-subcard p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-left">
                  <div className="flex items-start space-x-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
                      1
                    </div>
                    <div>
                      <div className="fa-scenario-title">
                        Revenue Data
                      </div>
                      <div className="fa-meta-copy text-sm">
                        Enter monthly revenue
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
                      2
                    </div>
                    <div>
                      <div className="fa-scenario-title">
                        Add Employees
                      </div>
                      <div className="fa-meta-copy text-sm">
                        Salary & billable hours
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
                      3
                    </div>
                    <div>
                      <div className="fa-scenario-title">
                        Expense Types
                      </div>
                      <div className="fa-meta-copy text-sm">
                        Monthly amounts
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
                      4
                    </div>
                    <div>
                      <div className="fa-scenario-title">Configure</div>
                      <div className="fa-meta-copy text-sm">
                        Scenario settings
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                      ✓
                    </div>
                    <div>
                      <div className="fa-scenario-title">Generate</div>
                      <div className="fa-meta-copy text-sm">Your forecast</div>
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

// Default export for Astro compatibility
export default EbitdaDashboard;
