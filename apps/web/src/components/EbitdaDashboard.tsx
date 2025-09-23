import { useState, useCallback } from 'react';
import {
  FinancialsInputForm,
  EmployeeManager,
  ExpenseTypesManager,
  ScenarioConfig,
  ForecastResults,
  Button,
  type MonthlyFinancialsData,
  type EmployeeData,
  type ExpenseTypeData,
  type ScenarioConfigData,
  type EbitdaForecastResult,
} from '@financial-analysis/ui';

interface DashboardState {
  financials: MonthlyFinancialsData;
  employees: EmployeeData[];
  expenseTypes: ExpenseTypeData[];
  scenarioConfig: ScenarioConfigData;
  isLoading: boolean;
  results: EbitdaForecastResult | null;
  error: string | null;
}

const initialState: DashboardState = {
  financials: {},
  employees: [],
  expenseTypes: [],
  scenarioConfig: {
    projectionMonths: 12,
    revenueGrowthRate: 0.05,
    marketGrowthFactor: 1.0,
  },
  isLoading: false,
  results: null,
  error: null,
};

export function EbitdaDashboard() {
  const [state, setState] = useState<DashboardState>(initialState);

  const updateFinancials = useCallback((financials: MonthlyFinancialsData) => {
    setState(prev => ({ ...prev, financials, results: null, error: null }));
  }, []);

  const updateEmployees = useCallback((employees: EmployeeData[]) => {
    setState(prev => ({ ...prev, employees, results: null, error: null }));
  }, []);

  const updateExpenseTypes = useCallback((expenseTypes: ExpenseTypeData[]) => {
    setState(prev => ({ ...prev, expenseTypes, results: null, error: null }));
  }, []);

  const updateScenarioConfig = useCallback((scenarioConfig: ScenarioConfigData) => {
    setState(prev => ({ ...prev, scenarioConfig, results: null, error: null }));
  }, []);

  const generateForecast = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const payload = {
        currentYear: state.financials,
        employees: state.employees,
        expenseTypes: state.expenseTypes,
        projectionMonths: state.scenarioConfig.projectionMonths,
        revenueGrowthRate: state.scenarioConfig.revenueGrowthRate,
        marketGrowthFactor: state.scenarioConfig.marketGrowthFactor,
        seasonalityFactors: state.scenarioConfig.seasonalityFactors,
      };

      const response = await fetch('/v1/api/analysis/ebitda-forecasting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const results = await response.json() as EbitdaForecastResult;
      setState(prev => ({ ...prev, results, isLoading: false }));

    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      setState(prev => ({ ...prev, error: message, isLoading: false }));
    }
  }, [state.financials, state.employees, state.expenseTypes, state.scenarioConfig]);

  const clearResults = useCallback(() => {
    setState(prev => ({ ...prev, results: null, error: null }));
  }, []);

  const hasValidData = () => {
    const hasFinancials = Object.values(state.financials).some(value => (value || 0) > 0);
    return hasFinancials;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Financial Forecasting Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure your inputs and generate EBITDA forecasts
          </p>
        </div>
        <div className="flex gap-3">
          {state.results && (
            <Button variant="outline" onClick={clearResults}>
              New Forecast
            </Button>
          )}
          <Button 
            onClick={generateForecast}
            disabled={!hasValidData() || state.isLoading}
            className="min-w-[140px]"
          >
            {state.isLoading ? 'Generating...' : 'Generate Forecast'}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Forecast Generation Error
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{state.error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Display */}
      {state.results && (
        <ForecastResults results={state.results} showDetails={true} />
      )}

      {/* Input Forms */}
      {!state.results && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <FinancialsInputForm
              data={state.financials}
              onChange={updateFinancials}
              title="Current Year Monthly Revenue"
            />
            
            <ScenarioConfig
              data={state.scenarioConfig}
              onChange={updateScenarioConfig}
            />
          </div>

          <div className="space-y-8">
            <EmployeeManager
              employees={state.employees}
              onChange={updateEmployees}
            />
            
            <ExpenseTypesManager
              expenseTypes={state.expenseTypes}
              onChange={updateExpenseTypes}
            />
          </div>
        </div>
      )}

      {/* Help Text */}
      {!state.results && !hasValidData() && (
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Getting Started
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <p>To generate an EBITDA forecast:</p>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Enter your current year monthly revenue data</li>
                  <li>Add employees with their salary and billable hour information</li>
                  <li>Define expense types and their monthly amounts</li>
                  <li>Configure your forecast scenario settings</li>
                  <li>Click "Generate Forecast" to see your projections</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}