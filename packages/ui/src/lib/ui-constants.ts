/**
 * Shared UI constants and utility classes for consistent styling across components
 */

// Common Tailwind class combinations for flex layouts
export const FLEX_CENTER = 'flex items-center justify-center';
export const FLEX_BETWEEN = 'flex items-center justify-between';
export const FLEX_START = 'flex items-center justify-start';
export const FLEX_END = 'flex items-center justify-end';
export const FLEX_COL_CENTER = 'flex flex-col items-center justify-center';

// Common gap utilities
export const GAP_1 = 'gap-1';
export const GAP_2 = 'gap-2';
export const GAP_3 = 'gap-3';
export const GAP_4 = 'gap-4';

// Border styles
export const BORDER_DEFAULT = 'border border-slate-200 dark:border-slate-800';
export const BORDER_INTERACTIVE =
  'border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500';

// Background colors
export const BG_CARD = 'bg-white dark:bg-slate-950';
export const BG_SUBTLE = 'bg-slate-50 dark:bg-slate-900';
export const BG_HOVER = 'hover:bg-slate-50 dark:hover:bg-slate-900';

// Text colors
export const TEXT_PRIMARY = 'text-slate-900 dark:text-white';
export const TEXT_SECONDARY = 'text-slate-600 dark:text-slate-400';
export const TEXT_MUTED = 'text-slate-500 dark:text-slate-500';

// Interactive states
export const TRANSITION_COLORS = 'transition-colors duration-200';
export const TRANSITION_ALL = 'transition-all duration-200';

// Button base styles
export const BTN_BASE =
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
export const BTN_PRIMARY = 'bg-violet-600 text-white hover:bg-violet-700 active:bg-violet-800';
export const BTN_SECONDARY = 'bg-slate-600 text-white hover:bg-slate-700 active:bg-slate-800';
export const BTN_OUTLINE =
  'border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900';

// Card action button (repeated pattern)
export const CARD_ACTION_BTN =
  'flex flex-col items-center gap-2 rounded-lg border border-slate-300 p-4 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900';

// Input styles
export const INPUT_BASE =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:placeholder:text-slate-500';

// Shadow utilities
export const SHADOW_SM = 'shadow-sm';
export const SHADOW_MD = 'shadow-md';
export const SHADOW_LG = 'shadow-lg';

// Rounded corners
export const ROUNDED_DEFAULT = 'rounded-lg';
export const ROUNDED_MD = 'rounded-md';
export const ROUNDED_FULL = 'rounded-full';

// Spacing
export const PADDING_CARD = 'p-4 sm:p-6';
export const PADDING_SECTION = 'p-6 sm:p-8';
export const MARGIN_SECTION = 'mb-6 sm:mb-8';

// Grid layouts
export const GRID_2_COL = 'grid grid-cols-1 sm:grid-cols-2 gap-4';
export const GRID_3_COL = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4';
export const GRID_4_COL = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4';

// Touch/mobile optimizations
export const TOUCH_TARGET = 'min-h-[44px] min-w-[44px]';
export const TOUCH_MANIPULATION = 'touch-manipulation';

/**
 * Utility to combine multiple Tailwind classes with proper spacing
 */
export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Common icon sizes
 */
export const ICON_SIZES = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
} as const;

/**
 * Status color schemes
 */
export const STATUS_COLORS = {
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-300',
    accent: 'bg-emerald-500',
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-700 dark:text-yellow-400',
    accent: 'bg-yellow-500',
  },
  error: {
    bg: 'bg-rose-50 dark:bg-rose-950/20',
    border: 'border-rose-200 dark:border-rose-800',
    text: 'text-rose-700 dark:text-rose-300',
    accent: 'bg-rose-500',
  },
  info: {
    bg: 'bg-violet-50 dark:bg-violet-950/20',
    border: 'border-violet-200 dark:border-violet-800',
    text: 'text-violet-700 dark:text-violet-300',
    accent: 'bg-violet-500',
  },
} as const;
