import { describe, expect, it } from 'vitest';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Callout } from '../components/Callout';
import { badgeVariants, buttonVariants, calloutVariants } from '../lib/classNames';
import {
  primitiveContracts,
  primitiveOwnership,
  type ButtonSize,
  type ButtonVariant,
  type CardVariant,
  type InputState,
} from './primitiveContracts';

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
      'destructive',
    ]);
    expect(primitiveContracts.button.states).toContain('loading');
  });

  it('enumerates canonical card and state contracts', () => {
    expect(primitiveContracts.card.variants).toContain('interactive');
    expect(primitiveContracts.state.variants).toContain('error');
    expect(primitiveContracts.state.variants).toContain('success');
  });

  it('maps button contract variants to classNames (plus legacy aliases)', () => {
    for (const variant of primitiveContracts.button.variants) {
      expect(buttonVariants[variant]).toBeTruthy();
    }
    expect(buttonVariants.danger).toBeTruthy();
    expect(buttonVariants.tertiary).toBeTruthy();
  });

  it('maps badge contract variants to classNames and exports a component', () => {
    for (const variant of primitiveContracts.badge.variants) {
      expect(badgeVariants[variant]).toBeTruthy();
    }
    expect(Badge.displayName).toBe('Badge');
  });

  it('maps callout contract variants to classNames and exports a component', () => {
    const calloutClassByVariant = {
      info: calloutVariants.info,
      success: calloutVariants.success,
      warning: calloutVariants.warning,
      error: calloutVariants.error,
    } as const;

    for (const variant of primitiveContracts.callout.variants) {
      expect(calloutClassByVariant[variant]).toBeTruthy();
    }
    expect(Callout.displayName).toBe('Callout');
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
