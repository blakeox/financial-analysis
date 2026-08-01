import { describe, expect, it } from 'vitest';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Callout } from '../components/Callout';
import {
  badgeVariants,
  buttonVariants,
  calloutVariants,
  cardVariants,
  inputClasses,
  statusSurfaces,
} from '../lib/classNames';
import {
  primitiveContracts,
  primitiveOwnership,
  type ButtonSize,
  type ButtonVariant,
  type CardVariant,
  type InputState,
} from './primitiveContracts';

function assertsBrandSurface(classString: string, hint: string) {
  expect(classString).toBeTruthy();
  expect(
    classString.includes(hint) || classString.includes('var(--fa-') || classString.includes('fa-'),
    `expected brand surface (${hint} / fa-* / var(--fa-*)): ${classString}`
  ).toBe(true);
}

describe('primitiveContracts', () => {
  it('defines shared ownership for reusable primitives', () => {
    expect(primitiveContracts.button.owner).toBe(primitiveOwnership.shared);
    expect(primitiveContracts.card.owner).toBe(primitiveOwnership.shared);
    expect(primitiveContracts.input.owner).toBe(primitiveOwnership.shared);
    expect(primitiveContracts.badge.owner).toBe(primitiveOwnership.shared);
    expect(primitiveContracts.callout.owner).toBe(primitiveOwnership.shared);
  });

  it('keeps page composition headers in apps/web', () => {
    expect(primitiveContracts.header.owner).toBe(primitiveOwnership.page);
  });

  it('enumerates canonical button contracts', () => {
    expect(primitiveContracts.button.variants).toEqual([
      'primary',
      'secondary',
      'outline',
      'ghost',
      'success',
      'warning',
      'danger',
    ]);
    expect(primitiveContracts.button.states).toContain('loading');
  });

  it('maps button contract variants to fa-button-* classNames (plus legacy aliases)', () => {
    for (const variant of primitiveContracts.button.variants) {
      assertsBrandSurface(buttonVariants[variant], primitiveContracts.button.brandClassPrefix);
    }
    expect(buttonVariants.destructive).toBe(buttonVariants.danger);
    expect(buttonVariants.tertiary).toBe(buttonVariants.ghost);
  });

  it('maps card / badge / callout contracts to fa-* surfaces', () => {
    for (const variant of primitiveContracts.card.variants) {
      assertsBrandSurface(cardVariants[variant], 'fa-card');
    }
    for (const variant of primitiveContracts.badge.variants) {
      assertsBrandSurface(badgeVariants[variant], primitiveContracts.badge.brandClassPrefix);
    }
    for (const variant of primitiveContracts.callout.variants) {
      const cls = calloutVariants[variant === 'error' ? 'error' : variant];
      assertsBrandSurface(cls, 'fa-callout-');
    }
    expect(Badge.displayName).toBe('Badge');
    expect(Callout.displayName).toBe('Callout');
  });

  it('keeps input classes on fa tokens', () => {
    expect(inputClasses).toContain('var(--fa-');
  });

  it('documents state UX as Callout/statusSurfaces (no vaporware components)', () => {
    expect(primitiveContracts.state.realizedVia.error).toContain('calloutVariants.error');
    expect(primitiveContracts.state.realizedVia.success).toContain('statusSurfaces.success');
    assertsBrandSurface(calloutVariants.error, 'fa-callout-');
    assertsBrandSurface(statusSurfaces.danger, 'var(--fa-');
    assertsBrandSurface(statusSurfaces.success, 'var(--fa-');
  });

  it('exports strongly typed variant aliases', () => {
    const buttonVariant: ButtonVariant = 'primary';
    const buttonSize: ButtonSize = 'md';
    const cardVariant: CardVariant = 'rail';
    const inputState: InputState = 'success';

    expect(buttonVariant).toBe('primary');
    expect(buttonSize).toBe('md');
    expect(cardVariant).toBe('rail');
    expect(inputState).toBe('success');
    expect(Button.displayName).toBe('Button');
  });
});
