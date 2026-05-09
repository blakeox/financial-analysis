import { describe, expect, it } from 'vitest';
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

  it('exports strongly typed variant aliases', () => {
    const buttonVariant: ButtonVariant = 'primary';
    const buttonSize: ButtonSize = 'md';
    const cardVariant: CardVariant = 'rail';
    const inputState: InputState = 'success';

    expect(buttonVariant).toBe('primary');
    expect(buttonSize).toBe('md');
    expect(cardVariant).toBe('rail');
    expect(inputState).toBe('success');
  });
});
