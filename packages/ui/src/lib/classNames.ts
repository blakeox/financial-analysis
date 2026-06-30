/**
 * Shared CSS class name utilities for consistent styling.
 * @module classNames
 */

/**
 * Conditionally join class names together, filtering out falsy values.
 * @param classes - Class names or conditional class objects
 * @returns Combined class name string
 * @example
 * cn('base', isActive && 'active', 'extra') // "base active extra"
 * cn({ 'text-red': hasError, 'text-green': !hasError }) // "text-green"
 */
export function cn(
  ...classes: Array<string | boolean | undefined | null | Record<string, boolean>>
): string {
  const result: string[] = [];

  for (const cls of classes) {
    if (!cls) continue;

    if (typeof cls === 'string') {
      result.push(cls);
    } else if (typeof cls === 'object') {
      for (const [key, value] of Object.entries(cls)) {
        if (value) {
          result.push(key);
        }
      }
    }
  }

  return result.join(' ');
}

export const buttonBaseClasses =
  'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold tracking-[-0.02em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none dark:focus-visible:ring-offset-slate-950';

export const buttonSizeClasses = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
} as const;

/**
 * Common button variant classes.
 */
export const buttonVariants = {
  primary:
    'bg-linear-to-r from-violet-600 to-violet-700 text-white shadow-[var(--fa-brand-shadow)] hover:-translate-y-px hover:shadow-[var(--fa-brand-shadow-hover)] active:translate-y-0 active:shadow-[var(--fa-brand-shadow-active)]',
  secondary:
    'border border-slate-200 bg-white/90 text-slate-900 shadow-sm hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-900',
  success:
    'bg-linear-to-r from-emerald-600 to-emerald-700 text-white shadow-[var(--fa-success-shadow)] hover:-translate-y-px hover:shadow-[var(--fa-success-shadow-hover)] active:translate-y-0',
  danger:
    'bg-linear-to-r from-rose-600 to-rose-700 text-white shadow-[var(--fa-danger-shadow)] hover:-translate-y-px hover:shadow-[var(--fa-danger-shadow-hover)] active:translate-y-0',
  destructive:
    'bg-linear-to-r from-rose-600 to-rose-700 text-white shadow-[var(--fa-danger-shadow)] hover:-translate-y-px hover:shadow-[var(--fa-danger-shadow-hover)] active:translate-y-0',
  warning:
    'bg-linear-to-r from-amber-500 to-amber-600 text-slate-950 shadow-[var(--fa-warning-shadow)] hover:-translate-y-px hover:shadow-[0_16px_36px_rgba(245,158,11,0.28)] active:translate-y-0',
  outline:
    'border border-slate-200 bg-transparent text-slate-700 hover:border-violet-200 hover:bg-violet-50/70 hover:text-violet-700 dark:border-slate-700 dark:text-slate-200 dark:hover:border-violet-800 dark:hover:bg-violet-950/40 dark:hover:text-violet-200',
  ghost:
    'text-slate-700 hover:bg-slate-100/80 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-slate-800/70 dark:hover:text-white',
  tertiary:
    'text-slate-700 hover:bg-slate-100/80 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-slate-800/70 dark:hover:text-white',
} as const;

/**
 * Common input field classes.
 */
export const inputClasses =
  'flex h-11 w-full rounded-2xl border border-slate-200 bg-white/95 px-4 text-sm text-slate-900 shadow-[0_1px_2px_rgba(9,14,36,0.03)] transition-[border-color,box-shadow,background-color] placeholder:text-slate-500 focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-violet-400';

export const inputStateClasses = {
  default: '',
  error:
    'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10 dark:border-rose-800 dark:focus:border-rose-500',
  success:
    'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/10 dark:border-emerald-800 dark:focus:border-emerald-500',
} as const;

/**
 * Common card classes.
 */
export const cardClasses =
  'rounded-[var(--fa-radius-2xl)] border border-slate-200/80 bg-white/95 p-6 text-slate-900 shadow-[var(--fa-shadow-card)] backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/85 dark:text-slate-100';

export const cardVariants = {
  default: cardClasses,
  elevated:
    'rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[var(--fa-shadow-elevated)] p-6 text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100',
  interactive:
    'rounded-[var(--fa-radius-2xl)] border border-slate-200/80 bg-white/95 p-6 text-slate-900 shadow-[var(--fa-shadow-card)] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[var(--fa-shadow-elevated)] dark:border-slate-800 dark:bg-slate-950/85 dark:text-slate-100',
  rail: 'rounded-[1.75rem] border border-slate-200/80 bg-white/88 p-6 text-slate-900 shadow-[0_28px_72px_rgba(9,14,36,0.12)] backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/88 dark:text-slate-100',
  subtle:
    'rounded-[1.35rem] border border-slate-200/70 bg-slate-50/85 p-5 text-slate-900 shadow-[0_8px_24px_rgba(9,14,36,0.04)] dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-100',
} as const;

/**
 * Common badge/tag classes by variant.
 */
export const badgeVariants = {
  default:
    'border border-slate-200 bg-white/80 text-slate-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300',
  primary:
    'border border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/70 dark:bg-violet-950/40 dark:text-violet-200',
  success:
    'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-200',
  danger:
    'border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-200',
  warning:
    'border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-200',
} as const;

/**
 * Responsive grid classes for common layouts.
 */
export const gridLayouts = {
  '1-2': 'grid grid-cols-1 md:grid-cols-2 gap-4',
  '1-2-3': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
  '1-2-4': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4',
  auto: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
} as const;

/**
 * Common text color classes by semantic meaning.
 */
export const textColors = {
  primary: 'text-slate-950 dark:text-white',
  secondary: 'text-slate-600 dark:text-slate-300',
  success: 'text-emerald-600 dark:text-emerald-300',
  danger: 'text-rose-600 dark:text-rose-300',
  warning: 'text-amber-600 dark:text-amber-300',
  /** Secondary/helper copy — WCAG AA on white and dark shell backgrounds. */
  muted: 'text-slate-600 dark:text-slate-400',
  accent: 'text-violet-600 dark:text-violet-300',
} as const;

/** Semantic copy sizes built on accessible muted/secondary colors. */
export const copyClasses = {
  muted: textColors.muted,
  helper: `text-sm ${textColors.muted}`,
  caption: `text-xs ${textColors.muted}`,
} as const;

/**
 * Callout/alert surface classes — mirrors fa-callout-* in apps/web global.css.
 * Requires app CSS bundle (fa-* classes) when used outside Storybook.
 */
export const calloutVariants = {
  info: 'fa-callout-info',
  success: 'fa-callout-success',
  warning: 'fa-callout-warning',
  error: 'fa-callout-danger',
} as const;
