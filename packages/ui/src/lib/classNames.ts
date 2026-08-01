/**
 * Shared CSS class name utilities for consistent styling.
 * Prefer composing `fa-*` spine classes (like Callout → `fa-callout-*`) so React
 * and calculator HTML share one brand surface.
 * @module classNames
 */

/** Single merge path: clsx + tailwind-merge (see `utils.ts`). */
export { cn } from './utils';

/**
 * Layout/interaction base for React Button.
 * Focus uses `--fa-focus-ring` (not Tailwind violet rings). Size utilities may
 * override `fa-button-*` min-height via `cn` + `min-h-*`.
 */
export const buttonBaseClasses =
  'inline-flex items-center justify-center gap-2 font-semibold tracking-[-0.02em] transition-all duration-200 focus-visible:outline-none focus-visible:shadow-[var(--fa-focus-ring)] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none';

/** Height/padding overrides — pair with `fa-button-*` min-height via cn. */
export const buttonSizeClasses = {
  sm: 'h-9 min-h-9 px-3.5 text-sm',
  md: 'h-11 min-h-11 px-4 text-sm',
  lg: 'h-12 min-h-12 px-5 text-base',
} as const;

/**
 * Button variants — compose spine `fa-button-*` (#361).
 * Canonical: primary | secondary | success | danger | warning | outline | ghost.
 * Aliases: `destructive` ≡ `danger`, `tertiary` ≡ `ghost` (prefer canonical names).
 */
export const buttonVariants = {
  primary: 'fa-button-primary',
  secondary: 'fa-button-secondary',
  success: 'fa-button-success',
  danger: 'fa-button-danger',
  /** @deprecated Prefer `danger` — kept for contract/back-compat. */
  destructive: 'fa-button-danger',
  warning: 'fa-button-warning',
  outline: 'fa-button-outline',
  ghost: 'fa-button-ghost',
  /** @deprecated Prefer `ghost` — kept for contract/back-compat. */
  tertiary: 'fa-button-ghost',
} as const;

/**
 * Common input field classes — brand focus ring (#366).
 */
/**
 * React input surface — token borders/focus + autofill paint match (#381).
 * Autofill shadow uses elevated surface so UA yellow/blue fill does not leak.
 */
export const inputClasses =
  'flex h-11 w-full rounded-[var(--fa-radius-lg)] border border-[var(--fa-border-default)] bg-[var(--fa-surface-elevated)] px-4 text-sm text-[var(--fa-text-primary)] shadow-[var(--fa-shadow-inset)] transition-[border-color,box-shadow,background-color] placeholder:text-[var(--fa-text-muted)] focus:border-[var(--fa-brand)] focus:outline-none focus:shadow-[var(--fa-focus-ring)] disabled:cursor-not-allowed disabled:opacity-50 autofill:shadow-[inset_0_0_0_1000px_var(--fa-surface-elevated)]';

/** Tabular lining figures for currency / rate inputs (#411). */
export const numericInputClasses = 'fa-tabular-nums tabular-nums';

export const inputStateClasses = {
  default: '',
  error:
    'border-rose-300 focus:border-rose-500 focus:shadow-[0_0_0_3px_rgba(225,29,72,0.18)] dark:border-rose-800 dark:focus:border-rose-500',
  success:
    'border-emerald-300 focus:border-emerald-500 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.18)] dark:border-emerald-800 dark:focus:border-emerald-500',
} as const;

/**
 * Card surfaces — compose `fa-card` / modifiers (#362).
 * Padding/radius/shadow live on the spine classes.
 */
export const cardClasses = 'fa-card';

export const cardVariants = {
  default: 'fa-card',
  elevated: 'fa-card fa-card-elevated',
  interactive: 'fa-card fa-card-interactive',
  rail: 'fa-card fa-card-rail',
  subtle: 'fa-card fa-card-subtle',
} as const;

/**
 * Badge variants — compose `fa-badge-*` (#361).
 */
export const badgeVariants = {
  default: 'fa-badge-default',
  primary: 'fa-badge-primary',
  success: 'fa-badge-success',
  danger: 'fa-badge-danger',
  warning: 'fa-badge-warning',
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
 * Muted/accent resolve through design tokens so `.dark` on `:root` is enough (#366 / #369).
 * Status fg maps to `--fa-status-*-fg` from `@financial-analysis/tokens`.
 */
export const textColors = {
  primary: 'text-[var(--fa-text-primary)]',
  secondary: 'text-[var(--fa-text-secondary)]',
  success: 'text-[var(--fa-status-success-fg)]',
  danger: 'text-[var(--fa-status-danger-fg)]',
  warning: 'text-[var(--fa-status-warning-fg)]',
  /** Helper/meta copy — `--fa-text-muted` (#475569 light). */
  muted: 'text-[var(--fa-text-muted)]',
  accent: 'text-brand',
} as const;

/**
 * Status surface pairs (fg+bg). Prefer over raw emerald-* utility pairs in new UI (#369).
 * Requires `@financial-analysis/tokens` loaded by the app spine.
 */
export const statusSurfaces = {
  success: 'bg-[var(--fa-status-success-bg)] text-[var(--fa-status-success-fg)]',
  warning: 'bg-[var(--fa-status-warning-bg)] text-[var(--fa-status-warning-fg)]',
  danger: 'bg-[var(--fa-status-danger-bg)] text-[var(--fa-status-danger-fg)]',
  info: 'bg-[var(--fa-status-info-bg)] text-[var(--fa-status-info-fg)]',
} as const;

/**
 * Copy ladder (React): display → body → meta → caption (#369).
 * Spine: fa-display / fa-body-copy / fa-meta-copy / fa-script-note.
 * `fa-script-copy-*` are deprecated aliases — prefer ladder names in new HTML.
 */
export const copyClasses = {
  muted: textColors.muted,
  /** meta */
  helper: `text-sm ${textColors.muted}`,
  /** caption */
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
