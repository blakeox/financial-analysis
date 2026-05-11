/**
 * Shared UI constants and utility classes for consistent styling across components
 */

import { buttonVariants, cardVariants, checkboxClasses, inputClasses, textColors } from './classNames';

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
export const BORDER_DEFAULT = 'border border-slate-200/80 dark:border-slate-800';
export const BORDER_INTERACTIVE = buttonVariants.outline;

// Background colors
export const BG_CARD = cardVariants.default;
export const BG_SUBTLE = cardVariants.subtle;
export const BG_HOVER = 'hover:bg-violet-50/70 dark:hover:bg-violet-950/40';

// Text colors
export const TEXT_PRIMARY = textColors.primary;
export const TEXT_SECONDARY = textColors.secondary;
export const TEXT_MUTED = textColors.muted;

// Interactive states
export const TRANSITION_COLORS = 'transition-colors duration-200';
export const TRANSITION_ALL = 'transition-all duration-200';

// Button base styles
export const BTN_BASE = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
export const BTN_PRIMARY = 'bg-violet-600 text-white hover:bg-violet-700 active:bg-violet-800';
export const BTN_SECONDARY = 'bg-slate-600 text-white hover:bg-slate-700 active:bg-slate-800';
export const BTN_OUTLINE = buttonVariants.outline;

// Card action button (repeated pattern)
export const CARD_ACTION_BTN =
  'flex flex-col items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/95 p-4 text-slate-900 shadow-[0_8px_24px_rgba(9,14,36,0.04)] transition-colors hover:border-violet-200 hover:bg-violet-50/70 dark:border-slate-800 dark:bg-slate-950/85 dark:text-slate-100 dark:hover:border-violet-800 dark:hover:bg-violet-950/40';

// Input styles
export const INPUT_BASE = inputClasses;
export const CHECKBOX_BASE = checkboxClasses;

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
