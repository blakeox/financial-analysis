import React from 'react';
import { cn } from '../../lib/utils';

export type PercentFieldProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type'
> & {
  label?: string;
  error?: string;
  helperText?: string;
  suffix?: string;
};

export const PercentField = React.forwardRef<HTMLInputElement, PercentFieldProps>(
  (
    { label, error, helperText, suffix = '%', className, id, ...props },
    ref
  ) => {
    const fieldId = id ?? React.useId();
    const errorId = error ? `${fieldId}-error` : undefined;
    const helperId = helperText && !error ? `${fieldId}-helper` : undefined;
    const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={fieldId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={fieldId}
            ref={ref}
            type="number"
            inputMode="decimal"
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={cn(
              'w-full rounded-md border border-gray-300 bg-white py-2 pl-4 pr-10 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white',
              error && 'border-red-500 focus:ring-red-500',
              className
            )}
            {...props}
          />
          <span className="pointer-events-none absolute right-3 top-2 text-gray-500">
            {suffix}
          </span>
        </div>
        {error && (
          <p id={errorId} className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="text-sm text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

PercentField.displayName = 'PercentField';
