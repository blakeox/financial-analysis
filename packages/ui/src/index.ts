// UI Components
export { Button } from './components/Button';
export { Badge } from './components/Badge';
export type { BadgeProps, BadgeVariant } from './components/Badge';
export { Callout } from './components/Callout';
export type { CalloutProps, CalloutVariant } from './components/Callout';
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
export { CurrencyField, PercentField, FormActions } from './components/financial-forms';
export type {
  CurrencyFieldProps,
  PercentFieldProps,
  FormActionsProps,
} from './components/financial-forms';
export { ValidatedInput, ValidatedNumberInput } from './components/ValidatedField';
/** Production chat UI is `apps/web/src/components/ChatPanel.astro`; this export is for tests/tooling only. */
export { ChatPanel } from './components/ChatPanel';
export { StorageUsageCard } from './components/StorageUsageCard';
export { AnalyticsDashboard } from './components/AnalyticsDashboard';
export type { AnalyticsDashboardProps } from './components/AnalyticsDashboard';
export { Select } from './components/Select';
export { Tabs, TabsContent, TabsList, TabsTrigger } from './components/Tabs';
export { LeaseAnalysisDashboard } from './components/LeaseAnalysisDashboard';

// Amortization Components
export { AmortizationResults } from './components/AmortizationResults';
export type { AmortizationResultsProps } from './components/AmortizationResults';

// EBITDA Forecasting Components
export { FinancialsInputForm } from './components/FinancialsInputForm';
export type {
  MonthlyFinancialsData,
  FinancialsInputFormProps,
} from './components/FinancialsInputForm';
export { EmployeeManager } from './components/EmployeeManager';
export type { EmployeeData, EmployeeManagerProps } from './components/EmployeeManager';
export { ExpenseTypesManager } from './components/ExpenseTypesManager';
export type { ExpenseTypeData, ExpenseTypesManagerProps } from './components/ExpenseTypesManager';
export { ForecastResults } from './components/ForecastResults';
export type {
  MonthlyForecast,
  ForecastSummary,
  EbitdaForecastResult,
  ForecastResultsProps,
} from './components/ForecastResults';
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
  buttonBaseClasses,
  buttonSizeClasses,
  buttonVariants,
  inputClasses,
  inputStateClasses,
  cardClasses,
  cardVariants,
  badgeVariants,
  calloutVariants,
  gridLayouts,
  textColors,
  copyClasses,
} from './lib/classNames';
export { primitiveContracts, primitiveOwnership } from './lib/primitiveContracts';
export type { ButtonVariant, ButtonSize, CardVariant, InputState } from './lib/primitiveContracts';

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

// Analytics and Monitoring
export {
  initAnalytics,
  getAnalytics,
  trackPageView,
  trackFormSubmit,
  trackApiCall,
  trackUserAction,
  trackError,
} from './lib/analytics';
export type {
  PageInteractionEvent,
  ApiCallEvent,
  UserActionEvent,
  FormAnalytics,
  PageAnalytics,
} from './lib/analytics';

export { getApiMonitor, monitoredFetch, monitoredFetchWithRetry } from './lib/api-monitor';
export type { ApiCallMetrics, ApiAnalysis, EndpointStats } from './lib/api-monitor';

export { escapeHtml } from './lib/escape-html';
