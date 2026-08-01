/**
 * Root barrel for `@financial-analysis/ui`.
 *
 * Prefer `@financial-analysis/ui/primitives` for new islands.
 * Feature dashboards below remain temporarily for apps/web — see `SLIM.md` (#374).
 */

// —— Primitives (also on ./primitives) ——
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
/** @deprecated Prefer `apps/web/src/components/site/Footer.astro` (#374). */
export { Footer } from './components/Footer';
export { Input } from './components/Input';
export { FieldShell, fieldDescribedBy } from './components/FieldShell';
export type { FieldShellProps, FieldShellHelperTone } from './components/FieldShell';
export { CurrencyField, PercentField, FormActions } from './components/financial-forms';
export type {
  CurrencyFieldProps,
  PercentFieldProps,
  FormActionsProps,
} from './components/financial-forms';
export { Select } from './components/Select';
export type { SelectProps } from './components/Select';
export { Tabs, TabsContent, TabsList, TabsTrigger } from './components/Tabs';
export { ValidatedInput, ValidatedNumberInput } from './components/ValidatedField';

// —— Feature composites (deferred move to apps/web — SLIM.md) ——
export { StorageUsageCard } from './components/StorageUsageCard';
export { AnalyticsDashboard } from './components/AnalyticsDashboard';
export type { AnalyticsDashboardProps } from './components/AnalyticsDashboard';
export { LeaseAnalysisDashboard } from './components/LeaseAnalysisDashboard';
export { AmortizationResults } from './components/AmortizationResults';
export type { AmortizationResultsProps } from './components/AmortizationResults';
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

// —— Charts (brand defaults via chartColors) ——
export * from './components/charts';

// —— Utilities ——
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
  numericInputClasses,
  cardClasses,
  cardVariants,
  badgeVariants,
  calloutVariants,
  gridLayouts,
  textColors,
  statusSurfaces,
  copyClasses,
} from './lib/classNames';
export { primitiveContracts, primitiveOwnership } from './lib/primitiveContracts';
export type { ButtonVariant, ButtonSize, CardVariant, InputState } from './lib/primitiveContracts';

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

/** @deprecated Prefer apps/web analytics host after #374 move. */
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

/** @deprecated Prefer apps/web after #374 move. */
export { getApiMonitor, monitoredFetch, monitoredFetchWithRetry } from './lib/api-monitor';
export type { ApiCallMetrics, ApiAnalysis, EndpointStats } from './lib/api-monitor';

export { escapeHtml } from './lib/escape-html';
