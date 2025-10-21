/**
 * Shared CSS class name utilities for consistent styling.
 * @module classNames
 */

/**
 * Conditionally join class names together, filtering out falsy values.
 * @param classes - Class names or conditional class objects
 * @returns Combined class name string
 * @example
 * cn('base', isActive && 'active', 'extra') // "base active extra"
 * cn({ 'text-red': hasError, 'text-green': !hasError }) // "text-green"
 */
export function cn(...classes: Array<string | boolean | undefined | null | Record<string, boolean>>): string {
  const result: string[] = [];

  for (const cls of classes) {
    if (!cls) continue;

    if (typeof cls === 'string') {
      result.push(cls);
    } else if (typeof cls === 'object') {
      for (const [key, value] of Object.entries(cls)) {
        if (value) {
          result.push(key);
        }
      }
    }
  }

  return result.join(' ');
}

/**
 * Common button variant classes.
 */
export const buttonVariants = {
  primary: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white',
  secondary: 'bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white',
  success: 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white',
  danger: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white',
  warning: 'bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800 text-white',
  outline: 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300',
  ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
} as const;

/**
 * Common input field classes.
 */
export const inputClasses = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors';

/**
 * Common card classes.
 */
export const cardClasses = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm';

/**
 * Common badge/tag classes by variant.
 */
export const badgeVariants = {
  default: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  primary: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  success: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  danger: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
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
 */
export const textColors = {
  primary: 'text-gray-900 dark:text-gray-100',
  secondary: 'text-gray-600 dark:text-gray-400',
  success: 'text-green-600 dark:text-green-400',
  danger: 'text-red-600 dark:text-red-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
  muted: 'text-gray-500 dark:text-gray-500',
} as const;
