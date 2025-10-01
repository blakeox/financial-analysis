// UI Components
export { Button } from './components/Button';
export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './components/Card';
export { ErrorBoundary } from './components/ErrorBoundary';
export { Footer } from './components/Footer';
export { Input } from './components/Input';
export { ChatPanel } from './components/ChatPanel';
export { VSCodeChatPanel } from './components/VSCodeChatPanel';
export type { ChatMessage } from './components/VSCodeChatPanel';
export { StorageUsageCard } from './components/StorageUsageCard';

// Amortization Components
export { AmortizationResults } from './components/AmortizationResults';
export type { AmortizationResultsProps } from './components/AmortizationResults';

// EBITDA Forecasting Components
export { FinancialsInputForm } from './components/FinancialsInputForm';
export type { MonthlyFinancialsData, FinancialsInputFormProps } from './components/FinancialsInputForm';
export { EmployeeManager } from './components/EmployeeManager';
export type { EmployeeData, EmployeeManagerProps } from './components/EmployeeManager';
export { ExpenseTypesManager } from './components/ExpenseTypesManager';
export type { ExpenseTypeData, ExpenseTypesManagerProps } from './components/ExpenseTypesManager';
export { ForecastResults } from './components/ForecastResults';
export type { MonthlyForecast, ForecastSummary, EbitdaForecastResult, ForecastResultsProps } from './components/ForecastResults';
export { ScenarioConfig } from './components/ScenarioConfig';
export type { ScenarioConfigData, ScenarioConfigProps } from './components/ScenarioConfig';
export { ModuleSelector, AVAILABLE_MODULES } from './components/ModuleSelector';
export type { ModuleType, ModuleDefinition } from './components/ModuleSelector';
export { ModuleCard } from './components/ModuleCard';

// Chart Components
export * from './components/charts';

// Utilities
export { cn } from './lib/utils';
