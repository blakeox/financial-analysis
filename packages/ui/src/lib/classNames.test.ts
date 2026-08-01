import { describe, it, expect } from 'vitest';
import {
  cn,
  buttonVariants,
  buttonBaseClasses,
  inputClasses,
  cardClasses,
  cardVariants,
  badgeVariants,
  gridLayouts,
  textColors,
  statusSurfaces,
} from './classNames';

describe('classNames', () => {
  describe('cn', () => {
    it('joins string class names', () => {
      expect(cn('class1', 'class2', 'class3')).toBe('class1 class2 class3');
    });

    it('filters out falsy values', () => {
      expect(cn('class1', false, 'class2', null, 'class3', undefined)).toBe('class1 class2 class3');
    });

    it('handles conditional classes with boolean', () => {
      const isActive = true;
      const isDisabled = false;
      expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe('base active');
    });

    it('handles object with boolean values', () => {
      expect(
        cn({
          'text-red': true,
          'text-green': false,
          'font-bold': true,
        })
      ).toBe('text-red font-bold');
    });

    it('handles mixed string and object arguments', () => {
      expect(cn('base', { active: true, disabled: false }, 'extra')).toBe('base active extra');
    });

    it('returns empty string when all values are falsy', () => {
      expect(cn(false, null, undefined)).toBe('');
    });

    it('handles empty arguments', () => {
      expect(cn()).toBe('');
    });

    it('handles single string argument', () => {
      expect(cn('single-class')).toBe('single-class');
    });

    it('handles single object argument', () => {
      expect(cn({ enabled: true })).toBe('enabled');
    });

    it('handles multiple objects', () => {
      expect(
        cn({ 'text-red': true, 'text-blue': false }, { 'font-bold': true, 'font-italic': false })
      ).toBe('text-red font-bold');
    });

    it('preserves order of class names', () => {
      expect(cn('z-index-10', 'bg-white', 'text-black')).toBe('z-index-10 bg-white text-black');
    });

    it('handles complex conditional expressions', () => {
      const isActive = true;
      const hasError = false;
      const isPending = true;

      expect(
        cn('base', isActive && 'active', hasError && 'error', isPending && 'pending', {
          disabled: false,
          loading: isPending,
        })
      ).toBe('base active pending loading');
    });

    it('handles empty strings', () => {
      expect(cn('', 'class1', '', 'class2')).toBe('class1 class2');
    });

    it('handles object with all false values', () => {
      expect(cn({ class1: false, class2: false, class3: false })).toBe('');
    });

    it('handles tailwind utility classes', () => {
      expect(cn('px-4 py-2', 'bg-violet-500', 'hover:bg-violet-700', 'rounded')).toBe(
        'px-4 py-2 bg-violet-500 hover:bg-violet-700 rounded'
      );
    });
  });

  describe('buttonVariants', () => {
    it('composes fa-button-primary for brand parity', () => {
      expect(buttonVariants.primary).toBe('fa-button-primary');
      expect(buttonBaseClasses).toContain('focus-visible:shadow-[var(--fa-focus-ring)]');
      expect(buttonBaseClasses).not.toContain('ring-violet');
    });

    it('has secondary variant', () => {
      expect(buttonVariants.secondary).toBe('fa-button-secondary');
    });

    it('has success variant', () => {
      expect(buttonVariants.success).toBe('fa-button-success');
    });

    it('has danger variant', () => {
      expect(buttonVariants.danger).toBe('fa-button-danger');
    });

    it('has warning variant', () => {
      expect(buttonVariants.warning).toBe('fa-button-warning');
    });

    it('has outline variant', () => {
      expect(buttonVariants.outline).toBe('fa-button-outline');
    });

    it('has ghost variant', () => {
      expect(buttonVariants.ghost).toBe('fa-button-ghost');
    });

    it('keeps destructive and tertiary as aliases of danger/ghost', () => {
      expect(buttonVariants.destructive).toBe(buttonVariants.danger);
      expect(buttonVariants.tertiary).toBe(buttonVariants.ghost);
    });

    it('is immutable (readonly)', () => {
      expect(Object.keys(buttonVariants)).toEqual([
        'primary',
        'secondary',
        'success',
        'danger',
        'destructive',
        'warning',
        'outline',
        'ghost',
        'tertiary',
      ]);
    });
  });

  describe('inputClasses', () => {
    it('contains expected input styling classes', () => {
      expect(inputClasses).toContain('w-full');
      expect(inputClasses).toContain('px-4');
      expect(inputClasses).toContain('border');
      expect(inputClasses).toContain('rounded-[var(--fa-radius-lg)]');
      expect(inputClasses).toContain('var(--fa-focus-ring)');
      expect(inputClasses).not.toContain('ring-violet');
      expect(inputClasses).not.toContain('slate');
    });

    it('uses token surfaces so dark mode follows :root', () => {
      expect(inputClasses).toContain('var(--fa-surface-elevated)');
      expect(inputClasses).toContain('var(--fa-text-primary)');
      expect(inputClasses).toContain('var(--fa-border-default)');
      expect(inputClasses).toContain('autofill:shadow-');
    });

    it('is a single string', () => {
      expect(typeof inputClasses).toBe('string');
    });
  });

  describe('cardClasses', () => {
    it('composes fa-card', () => {
      expect(cardClasses).toBe('fa-card');
      expect(cardVariants.elevated).toContain('fa-card-elevated');
      expect(cardVariants.interactive).toContain('fa-card-interactive');
      expect(cardVariants.rail).toContain('fa-card-rail');
      expect(cardVariants.subtle).toContain('fa-card-subtle');
      expect(cardVariants.rail).not.toContain('0_28px_72px');
    });

    it('is a single string', () => {
      expect(typeof cardClasses).toBe('string');
    });
  });

  describe('badgeVariants', () => {
    it('has default variant', () => {
      expect(badgeVariants.default).toBe('fa-badge-default');
    });

    it('has primary variant', () => {
      expect(badgeVariants.primary).toBe('fa-badge-primary');
      expect(badgeVariants.primary).not.toContain('violet');
    });

    it('has success variant', () => {
      expect(badgeVariants.success).toBe('fa-badge-success');
    });

    it('has danger variant', () => {
      expect(badgeVariants.danger).toBe('fa-badge-danger');
    });

    it('has warning variant', () => {
      expect(badgeVariants.warning).toBe('fa-badge-warning');
    });

    it('has all expected variants', () => {
      expect(Object.keys(badgeVariants)).toEqual([
        'default',
        'primary',
        'success',
        'danger',
        'warning',
      ]);
    });
  });

  describe('gridLayouts', () => {
    it('has 1-2 layout (1 col mobile, 2 cols tablet+)', () => {
      expect(gridLayouts['1-2']).toBe('grid grid-cols-1 md:grid-cols-2 gap-4');
    });

    it('has 1-2-3 layout (1 col mobile, 2 cols tablet, 3 cols desktop)', () => {
      expect(gridLayouts['1-2-3']).toBe('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4');
    });

    it('has 1-2-4 layout (1 col mobile, 2 cols tablet, 4 cols desktop)', () => {
      expect(gridLayouts['1-2-4']).toBe('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4');
    });

    it('has auto layout (responsive breakpoints)', () => {
      expect(gridLayouts.auto).toBe(
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
      );
    });

    it('has all expected layouts', () => {
      expect(Object.keys(gridLayouts)).toEqual(['1-2', '1-2-3', '1-2-4', 'auto']);
    });

    it('all layouts use grid', () => {
      Object.values(gridLayouts).forEach((layout) => {
        expect(layout).toContain('grid');
        expect(layout).toContain('gap-4');
      });
    });
  });

  describe('textColors', () => {
    it('has primary text color', () => {
      expect(textColors.primary).toBe('text-[var(--fa-text-primary)]');
    });

    it('has secondary text color', () => {
      expect(textColors.secondary).toBe('text-[var(--fa-text-secondary)]');
    });

    it('has success text color', () => {
      expect(textColors.success).toContain('var(--fa-status-success-fg)');
    });

    it('has danger text color', () => {
      expect(textColors.danger).toContain('var(--fa-status-danger-fg)');
    });

    it('has warning text color', () => {
      expect(textColors.warning).toContain('var(--fa-status-warning-fg)');
    });

    it('has muted text color from token', () => {
      expect(textColors.muted).toBe('text-[var(--fa-text-muted)]');
    });

    it('has accent text color from brand', () => {
      expect(textColors.accent).toBe('text-brand');
      expect(textColors.accent).not.toContain('violet');
    });

    it('has all expected colors', () => {
      expect(Object.keys(textColors)).toEqual([
        'primary',
        'secondary',
        'success',
        'danger',
        'warning',
        'muted',
        'accent',
      ]);
    });
  });

  describe('statusSurfaces', () => {
    it('exposes token-backed success/warning/danger/info pairs', () => {
      expect(statusSurfaces.success).toContain('--fa-status-success-bg');
      expect(statusSurfaces.warning).toContain('--fa-status-warning-fg');
      expect(statusSurfaces.danger).toContain('--fa-status-danger-bg');
      expect(statusSurfaces.info).toContain('--fa-status-info-fg');
    });
  });

  describe('integration - cn with design tokens', () => {
    it('combines buttonVariants with additional classes', () => {
      const result = cn(buttonVariants.primary, 'px-4 py-2', 'rounded-lg');
      expect(result).toContain('fa-button-primary');
      expect(result).toContain('px-4 py-2');
      expect(result).toContain('rounded-lg');
    });

    it('combines inputClasses with conditional classes', () => {
      const hasError = true;
      const result = cn(inputClasses, hasError && 'border-rose-500');
      expect(result).toContain('w-full');
      expect(result).toContain('border-rose-500');
    });

    it('combines cardClasses with dynamic padding', () => {
      const result = cn(cardClasses, 'p-6');
      expect(result).toContain('fa-card');
      expect(result).toContain('p-6');
    });

    it('combines badgeVariants with size classes', () => {
      const result = cn(badgeVariants.success, 'text-xs', 'px-2 py-1');
      expect(result).toContain('fa-badge-success');
      expect(result).toContain('text-xs');
      expect(result).toContain('px-2 py-1');
    });

    it('combines gridLayouts with gap override (twMerge drops earlier gap)', () => {
      const result = cn(gridLayouts['1-2-3'], 'gap-6');
      expect(result).toContain('grid-cols-1');
      expect(result).not.toContain('gap-4');
      expect(result).toContain('gap-6');
    });

    it('combines textColors with font weight', () => {
      const result = cn(textColors.danger, 'font-bold');
      expect(result).toBe('text-[var(--fa-status-danger-fg)] font-bold');
    });

    it('twMerge resolves conflicting utilities from cn re-export', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4');
    });
  });
});
