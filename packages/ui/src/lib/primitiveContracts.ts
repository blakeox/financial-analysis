export const primitiveOwnership = {
  shared: 'packages/ui',
  page: 'apps/web',
} as const;

/**
 * Variant/state contracts for shared primitives.
 * Class maps live in `classNames.ts` and must compose `fa-*` / `var(--fa-*)`.
 */
export const primitiveContracts = {
  button: {
    owner: primitiveOwnership.shared,
    // Canonical set. Aliases `destructive`≡`danger` and `tertiary`≡`ghost` remain on ButtonVariant.
    variants: ['primary', 'secondary', 'outline', 'ghost', 'success', 'warning', 'danger'] as const,
    sizes: ['sm', 'md', 'lg'] as const,
    states: ['default', 'disabled', 'loading'] as const,
    brandClassPrefix: 'fa-button-',
  },
  card: {
    owner: primitiveOwnership.shared,
    variants: ['default', 'elevated', 'interactive', 'rail', 'subtle'] as const,
    brandClassPrefix: 'fa-card',
  },
  input: {
    owner: primitiveOwnership.shared,
    states: ['default', 'error', 'success'] as const,
    supports: ['label', 'helperText', 'inlineValidation', 'focusTreatment'] as const,
    /** Surfaces use `--fa-*` tokens via `inputClasses` / `fa-input-surface`. */
    brandTokenHint: 'var(--fa-',
  },
  badge: {
    owner: primitiveOwnership.shared,
    variants: ['default', 'primary', 'success', 'danger', 'warning'] as const,
    brandClassPrefix: 'fa-badge-',
  },
  callout: {
    owner: primitiveOwnership.shared,
    variants: ['info', 'success', 'warning', 'error'] as const,
    brandClassPrefix: 'fa-callout-',
  },
  header: {
    owner: primitiveOwnership.page,
    variants: ['pageHero', 'sectionHeader', 'workflowIntro', 'journeyStep'] as const,
  },
  /**
   * Empty/loading/error UX is not a separate React primitive set.
   * Realized via Callout + `statusSurfaces` + Button `isLoading` (Wave 5 shrink of vaporware).
   */
  state: {
    owner: primitiveOwnership.shared,
    variants: ['loading', 'empty', 'success', 'error', 'noResults', 'locked'] as const,
    realizedVia: {
      loading: 'Button isLoading / page skeletons in apps/web',
      empty: 'Callout info',
      success: 'calloutVariants.success / statusSurfaces.success',
      error: 'calloutVariants.error / statusSurfaces.danger',
      noResults: 'Callout info',
      locked: 'Callout warning',
    } as const,
  },
} as const;

export type ButtonVariant =
  (typeof primitiveContracts.button.variants)[number] | 'destructive' | 'tertiary';
export type ButtonSize = (typeof primitiveContracts.button.sizes)[number];
export type CardVariant = (typeof primitiveContracts.card.variants)[number];
export type InputState = (typeof primitiveContracts.input.states)[number];
