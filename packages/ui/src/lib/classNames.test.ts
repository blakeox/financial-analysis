import { describe, it, expect } from 'vitest';
import {
  cn,
  buttonVariants,
  inputClasses,
  cardClasses,
  badgeVariants,
  gridLayouts,
  textColors,
} from './classNames';

describe('classNames', () => {
  describe('cn', () => {
    it('joins string class names', () => {
      expect(cn('class1', 'class2', 'class3')).toBe('class1 class2 class3');
    });

    it('filters out falsy values', () => {
      expect(cn('class1', false, 'class2', null, 'class3', undefined)).toBe(
        'class1 class2 class3'
      );
    });

    it('handles conditional classes with boolean', () => {
      const isActive = true;
      const isDisabled = false;
      expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe(
        'base active'
      );
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
      expect(
        cn('base', { active: true, disabled: false }, 'extra')
      ).toBe('base active extra');
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
        cn(
          { 'text-red': true, 'text-blue': false },
          { 'font-bold': true, 'font-italic': false }
        )
      ).toBe('text-red font-bold');
    });

    it('preserves order of class names', () => {
      expect(cn('z-index-10', 'bg-white', 'text-black')).toBe(
        'z-index-10 bg-white text-black'
      );
    });

    it('handles complex conditional expressions', () => {
      const isActive = true;
      const hasError = false;
      const isPending = true;

      expect(
        cn(
          'base',
          isActive && 'active',
          hasError && 'error',
          isPending && 'pending',
          { disabled: false, loading: isPending }
        )
      ).toBe('base active pending loading');
    });

    it('handles empty strings', () => {
      expect(cn('', 'class1', '', 'class2')).toBe('class1 class2');
    });

    it('handles object with all false values', () => {
      expect(
        cn({ class1: false, class2: false, class3: false })
      ).toBe('');
    });

    it('handles tailwind utility classes', () => {
      expect(
        cn('px-4 py-2', 'bg-blue-500', 'hover:bg-blue-700', 'rounded')
      ).toBe('px-4 py-2 bg-blue-500 hover:bg-blue-700 rounded');
    });
  });

  describe('buttonVariants', () => {
    it('has primary variant', () => {
      expect(buttonVariants.primary).toBe(
        'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
      );
    });

    it('has secondary variant', () => {
      expect(buttonVariants.secondary).toBe(
        'bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white'
      );
    });

    it('has success variant', () => {
      expect(buttonVariants.success).toBe(
        'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white'
      );
    });

    it('has danger variant', () => {
      expect(buttonVariants.danger).toBe(
        'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white'
      );
    });

    it('has warning variant', () => {
      expect(buttonVariants.warning).toBe(
        'bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800 text-white'
      );
    });

    it('has outline variant', () => {
      expect(buttonVariants.outline).toBe(
        'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
      );
    });

    it('has ghost variant', () => {
      expect(buttonVariants.ghost).toBe(
        'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
      );
    });

    it('is immutable (readonly)', () => {
      // TypeScript should prevent this, but we verify the object structure
      expect(Object.keys(buttonVariants)).toEqual([
        'primary',
        'secondary',
        'success',
        'danger',
        'warning',
        'outline',
        'ghost',
      ]);
    });
  });

  describe('inputClasses', () => {
    it('contains expected input styling classes', () => {
      expect(inputClasses).toContain('w-full');
      expect(inputClasses).toContain('px-3 py-2');
      expect(inputClasses).toContain('border');
      expect(inputClasses).toContain('rounded-lg');
      expect(inputClasses).toContain('focus:ring-2');
    });

    it('includes dark mode variants', () => {
      expect(inputClasses).toContain('dark:bg-gray-800');
      expect(inputClasses).toContain('dark:text-gray-100');
      expect(inputClasses).toContain('dark:border-gray-600');
    });

    it('is a single string', () => {
      expect(typeof inputClasses).toBe('string');
    });
  });

  describe('cardClasses', () => {
    it('contains expected card styling classes', () => {
      expect(cardClasses).toContain('bg-white');
      expect(cardClasses).toContain('rounded-xl');
      expect(cardClasses).toContain('border');
      expect(cardClasses).toContain('shadow-sm');
    });

    it('includes dark mode variants', () => {
      expect(cardClasses).toContain('dark:bg-gray-800');
      expect(cardClasses).toContain('dark:border-gray-700');
    });

    it('is a single string', () => {
      expect(typeof cardClasses).toBe('string');
    });
  });

  describe('badgeVariants', () => {
    it('has default variant', () => {
      expect(badgeVariants.default).toBe(
        'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
      );
    });

    it('has primary variant', () => {
      expect(badgeVariants.primary).toBe(
        'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      );
    });

    it('has success variant', () => {
      expect(badgeVariants.success).toBe(
        'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      );
    });

    it('has danger variant', () => {
      expect(badgeVariants.danger).toBe(
        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      );
    });

    it('has warning variant', () => {
      expect(badgeVariants.warning).toBe(
        'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
      );
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

    it('all variants include dark mode', () => {
      Object.values(badgeVariants).forEach((variant) => {
        expect(variant).toContain('dark:');
      });
    });
  });

  describe('gridLayouts', () => {
    it('has 1-2 layout (1 col mobile, 2 cols tablet+)', () => {
      expect(gridLayouts['1-2']).toBe(
        'grid grid-cols-1 md:grid-cols-2 gap-4'
      );
    });

    it('has 1-2-3 layout (1 col mobile, 2 cols tablet, 3 cols desktop)', () => {
      expect(gridLayouts['1-2-3']).toBe(
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
      );
    });

    it('has 1-2-4 layout (1 col mobile, 2 cols tablet, 4 cols desktop)', () => {
      expect(gridLayouts['1-2-4']).toBe(
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'
      );
    });

    it('has auto layout (responsive breakpoints)', () => {
      expect(gridLayouts.auto).toBe(
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
      );
    });

    it('has all expected layouts', () => {
      expect(Object.keys(gridLayouts)).toEqual([
        '1-2',
        '1-2-3',
        '1-2-4',
        'auto',
      ]);
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
      expect(textColors.primary).toBe('text-gray-900 dark:text-gray-100');
    });

    it('has secondary text color', () => {
      expect(textColors.secondary).toBe('text-gray-600 dark:text-gray-400');
    });

    it('has success text color', () => {
      expect(textColors.success).toBe('text-green-600 dark:text-green-400');
    });

    it('has danger text color', () => {
      expect(textColors.danger).toBe('text-red-600 dark:text-red-400');
    });

    it('has warning text color', () => {
      expect(textColors.warning).toBe('text-yellow-600 dark:text-yellow-400');
    });

    it('has muted text color', () => {
      expect(textColors.muted).toBe('text-gray-500 dark:text-gray-500');
    });

    it('has all expected colors', () => {
      expect(Object.keys(textColors)).toEqual([
        'primary',
        'secondary',
        'success',
        'danger',
        'warning',
        'muted',
      ]);
    });

    it('all colors include dark mode except muted', () => {
      Object.entries(textColors).forEach(([key, value]) => {
        if (key !== 'muted') {
          expect(value).toContain('dark:');
        }
      });
    });
  });

  describe('integration - cn with design tokens', () => {
    it('combines buttonVariants with additional classes', () => {
      const result = cn(buttonVariants.primary, 'px-4 py-2', 'rounded-lg');
      expect(result).toContain('bg-blue-600');
      expect(result).toContain('px-4 py-2');
      expect(result).toContain('rounded-lg');
    });

    it('combines inputClasses with conditional classes', () => {
      const hasError = true;
      const result = cn(inputClasses, hasError && 'border-red-500');
      expect(result).toContain('w-full');
      expect(result).toContain('border-red-500');
    });

    it('combines cardClasses with dynamic padding', () => {
      const result = cn(cardClasses, 'p-6');
      expect(result).toContain('bg-white');
      expect(result).toContain('p-6');
    });

    it('combines badgeVariants with size classes', () => {
      const result = cn(badgeVariants.success, 'text-xs', 'px-2 py-1');
      expect(result).toContain('bg-green-100');
      expect(result).toContain('text-xs');
      expect(result).toContain('px-2 py-1');
    });

    it('combines gridLayouts with gap override', () => {
      const result = cn(gridLayouts['1-2-3'], 'gap-6');
      expect(result).toContain('grid-cols-1');
      expect(result).toContain('gap-4');
      expect(result).toContain('gap-6');
    });

    it('combines textColors with font weight', () => {
      const result = cn(textColors.danger, 'font-bold');
      expect(result).toBe('text-red-600 dark:text-red-400 font-bold');
    });
  });
});
