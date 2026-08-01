import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn (clsx + twMerge)', () => {
  it('joins class names and drops falsy values', () => {
    expect(cn('base', false, 'extra', null, undefined)).toBe('base extra');
  });

  it('resolves conflicting Tailwind utilities (last wins)', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    expect(cn('text-slate-600', 'text-slate-900')).toBe('text-slate-900');
    expect(cn('gap-4', 'gap-6')).toBe('gap-6');
  });

  it('supports object conditionals via clsx', () => {
    expect(cn('base', { active: true, disabled: false })).toBe('base active');
  });
});
