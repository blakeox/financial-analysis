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
export { ValidatedInput, ValidatedNumberInput } from './components/ValidatedField';
export { ChatPanel } from './components/ChatPanel';
export { StorageUsageCard } from './components/StorageUsageCard';
export { Select } from './components/Select';
export { Tabs, TabsContent, TabsList, TabsTrigger } from './components/Tabs';
export { LeaseAnalysisDashboard } from './components/LeaseAnalysisDashboard';

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
export { FixedAssetsManager } from './components/FixedAssetsManager';
export type { FixedAssetData, FixedAssetsManagerProps } from './components/FixedAssetsManager';
export { LeasesManager } from './components/LeasesManager';
export type { LeaseData, LeasesManagerProps } from './components/LeasesManager';

// Chart Components
export * from './components/charts';

// Utilities
export { cn } from './lib/utils';
export { buildScenarioPayload } from './lib/ebitdaPayload';
export {
  formatCurrency,
  formatCurrencyOptional,
  formatPercentage,
  formatPercentageOptional,
  formatNumber,
  formatDate,
  truncate,
  formatFileSize,
} from './lib/formatters';
export {
  validateFile,
  validateNumberRange,
  validateRequired,
  validateEmail,
  clamp,
} from './lib/validation';
export {
  cn as classNames,
  buttonVariants,
  inputClasses,
  cardClasses,
  badgeVariants,
  gridLayouts,
  textColors,
} from './lib/classNames';

// Custom Hooks
export {
  useHydrated,
  useApiData,
  useLocalStorage,
  useEscapeKey,
  useAutoScroll,
  useDebounce,
  usePrevious,
  useAsync,
} from './lib/hooks';

// Form Utilities
export {
  createChangeHandler,
  createFieldHandler,
  createDebouncedHandler,
  createResetHandler,
  validateForm,
  hasErrors,
  getFieldError,
  parsers,
} from './lib/formUtils';
export type { DashboardScenarioConfig } from './lib/ebitdaPayload';
