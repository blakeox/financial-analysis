export const primitiveOwnership = {
  shared: 'packages/ui',
  page: 'apps/web',
} as const;

export const primitiveContracts = {
  button: {
    owner: primitiveOwnership.shared,
    variants: [
      'primary',
      'secondary',
      'outline',
      'ghost',
      'success',
      'warning',
      'destructive',
    ] as const,
    sizes: ['sm', 'md', 'lg'] as const,
    states: ['default', 'disabled', 'loading'] as const,
  },
  card: {
    owner: primitiveOwnership.shared,
    variants: ['default', 'elevated', 'interactive', 'rail', 'subtle'] as const,
  },
  input: {
    owner: primitiveOwnership.shared,
    states: ['default', 'error', 'success'] as const,
    supports: ['label', 'helperText', 'inlineValidation', 'focusTreatment'] as const,
  },
  badge: {
    owner: primitiveOwnership.shared,
    variants: ['default', 'primary', 'success', 'danger', 'warning'] as const,
  },
  callout: {
    owner: primitiveOwnership.shared,
    variants: ['info', 'success', 'warning', 'error'] as const,
  },
  header: {
    owner: primitiveOwnership.page,
    variants: ['pageHero', 'sectionHeader', 'workflowIntro', 'journeyStep'] as const,
  },
  state: {
    owner: primitiveOwnership.shared,
    variants: ['loading', 'empty', 'success', 'error', 'noResults', 'locked'] as const,
  },
} as const;

export type ButtonVariant =
  (typeof primitiveContracts.button.variants)[number] | 'danger' | 'tertiary';
export type ButtonSize = (typeof primitiveContracts.button.sizes)[number];
export type CardVariant = (typeof primitiveContracts.card.variants)[number];
export type InputState = (typeof primitiveContracts.input.states)[number];
