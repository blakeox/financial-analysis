import React from 'react';
import { cn } from '../../lib/utils';
import { inputClasses } from '../../lib/classNames';

export type CurrencyFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: string;
  error?: string;
  helperText?: string;
  currencySymbol?: string;
};

export const CurrencyField = React.forwardRef<HTMLInputElement, CurrencyFieldProps>(
  ({ label, error, helperText, currencySymbol = '$', className, id, ...props }, ref) => {
    const fieldId = id ?? React.useId();
    const errorId = error ? `${fieldId}-error` : undefined;
    const helperId = helperText && !error ? `${fieldId}-helper` : undefined;
    const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={fieldId}
            className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-500 dark:text-slate-400">
            {currencySymbol}
          </span>
          <input
            id={fieldId}
            ref={ref}
            type="number"
            inputMode="decimal"
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={cn(
              inputClasses,
              'py-2.5 pl-8 pr-4',
              error &&
                'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10 dark:border-rose-800 dark:focus:border-rose-500',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p id={errorId} className="text-sm text-rose-600 dark:text-rose-300" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="text-sm text-slate-500 dark:text-slate-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

CurrencyField.displayName = 'CurrencyField';
