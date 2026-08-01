/**
 * Curated primitives entry (`@financial-analysis/ui/primitives`).
 * Prefer this for new islands; the root barrel still re-exports feature dashboards
 * until they move to apps/web (see `packages/ui/SLIM.md`).
 */

export { Button } from './components/Button';
export type { ButtonProps } from './components/Button';
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
export { Input } from './components/Input';
export { FieldShell, fieldDescribedBy } from './components/FieldShell';
export type { FieldShellProps, FieldShellHelperTone } from './components/FieldShell';
export { Select } from './components/Select';
export type { SelectProps } from './components/Select';
export { Tabs, TabsContent, TabsList, TabsTrigger } from './components/Tabs';
export { CurrencyField, PercentField, FormActions } from './components/financial-forms';
export type {
  CurrencyFieldProps,
  PercentFieldProps,
  FormActionsProps,
} from './components/financial-forms';

export { cn } from './lib/utils';
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
  statusSurfaces,
  copyClasses,
} from './lib/classNames';
export { primitiveContracts, primitiveOwnership } from './lib/primitiveContracts';
export type { ButtonVariant, ButtonSize, CardVariant, InputState } from './lib/primitiveContracts';
export {
  chartColors,
  chartColorFallbacks,
  chartSeriesPalette,
  CHART_A11Y_NOTES,
} from './lib/chartColors';
export type { ChartSeriesKey } from './lib/chartColors';
