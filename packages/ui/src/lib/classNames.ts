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
    'bg-linear-to-r from-violet-600 to-violet-700 text-white shadow-[0_14px_32px_rgba(109,74,255,0.28)] hover:-translate-y-px hover:shadow-[0_18px_40px_rgba(109,74,255,0.34)] active:translate-y-0 active:shadow-[0_12px_24px_rgba(109,74,255,0.24)]',
  secondary:
    'border border-slate-200 bg-white/90 text-slate-900 shadow-sm hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-900',
  success:
    'bg-linear-to-r from-emerald-600 to-emerald-700 text-white shadow-[0_12px_28px_rgba(16,185,129,0.24)] hover:-translate-y-px hover:shadow-[0_16px_36px_rgba(16,185,129,0.3)] active:translate-y-0',
  danger:
    'bg-linear-to-r from-rose-600 to-rose-700 text-white shadow-[0_12px_28px_rgba(225,29,72,0.22)] hover:-translate-y-px hover:shadow-[0_16px_36px_rgba(225,29,72,0.28)] active:translate-y-0',
  destructive:
    'bg-linear-to-r from-rose-600 to-rose-700 text-white shadow-[0_12px_28px_rgba(225,29,72,0.22)] hover:-translate-y-px hover:shadow-[0_16px_36px_rgba(225,29,72,0.28)] active:translate-y-0',
  warning:
    'bg-linear-to-r from-amber-500 to-amber-600 text-slate-950 shadow-[0_12px_28px_rgba(245,158,11,0.22)] hover:-translate-y-px hover:shadow-[0_16px_36px_rgba(245,158,11,0.28)] active:translate-y-0',
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
  'flex h-11 w-full rounded-2xl border border-slate-200 bg-white/95 px-4 text-sm text-slate-900 shadow-[0_1px_2px_rgba(9,14,36,0.03)] transition-[border-color,box-shadow,background-color] placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-violet-400';

export const fieldLabelClasses = 'block text-sm font-semibold text-slate-700 dark:text-slate-200';
export const helperTextClasses = 'text-sm text-slate-500 dark:text-slate-400';

export const checkboxClasses =
  'h-4 w-4 rounded border border-slate-300 bg-white text-violet-600 shadow-[0_1px_2px_rgba(9,14,36,0.03)] transition-[border-color,box-shadow,background-color] focus:outline-none focus:ring-4 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950/70 dark:text-violet-300';

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
  'rounded-[1.5rem] border border-slate-200/80 bg-white/95 p-6 text-slate-900 shadow-[0_18px_50px_rgba(9,14,36,0.07)] backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/85 dark:text-slate-100';

export const cardVariants = {
  default: cardClasses,
  elevated:
    'rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_24px_60px_rgba(9,14,36,0.1)] p-6 text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100',
  interactive:
    'rounded-[1.5rem] border border-slate-200/80 bg-white/95 p-6 text-slate-900 shadow-[0_18px_50px_rgba(9,14,36,0.07)] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(9,14,36,0.11)] dark:border-slate-800 dark:bg-slate-950/85 dark:text-slate-100',
  rail: 'rounded-[1.75rem] border border-slate-200/80 bg-white/88 p-6 text-slate-900 shadow-[0_28px_72px_rgba(9,14,36,0.12)] backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/88 dark:text-slate-100',
  subtle:
    'rounded-[1.35rem] border border-slate-200/70 bg-slate-50/85 p-5 text-slate-900 shadow-[0_8px_24px_rgba(9,14,36,0.04)] dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-100',
} as const;

export const actionTileClasses =
  'flex flex-col items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/95 p-4 text-slate-900 shadow-[0_8px_24px_rgba(9,14,36,0.04)] transition-colors hover:border-violet-200 hover:bg-violet-50/70 dark:border-slate-800 dark:bg-slate-950/85 dark:text-slate-100 dark:hover:border-violet-800 dark:hover:bg-violet-950/40';

export const tableHeadClasses =
  'border-b border-slate-200/80 bg-slate-50/85 text-slate-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300';

export const tableRowClasses =
  'border-b border-slate-100 transition-colors hover:bg-violet-50/40 dark:border-slate-800 dark:hover:bg-violet-950/20';

export const surfaceDividerClasses = 'border-slate-200/80 dark:border-slate-800';

export const segmentedActiveClasses =
  'bg-white/95 text-violet-700 shadow-sm dark:bg-slate-950 dark:text-violet-200';

/**
 * Common badge/tag classes by variant.
 */
export const badgeVariants = {
  default:
    'border border-slate-200 bg-white/80 text-slate-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300',
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
  muted: 'text-slate-500 dark:text-slate-400',
  accent: 'text-violet-600 dark:text-violet-300',
} as const;
