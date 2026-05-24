import React from 'react';
import type { InputState } from '../lib/primitiveContracts';
import { copyClasses, inputClasses, inputStateClasses } from '../lib/classNames';
import { cn } from '../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  state?: InputState;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, type = 'text', label, error, helperText, state = 'default', id, ...props },
    ref
  ) => {
    // Generate a unique ID for the input if not provided
    const inputId = id || React.useId();
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText && !error ? `${inputId}-helper` : undefined;
    const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;
    const resolvedState: InputState = error ? 'error' : state;

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(inputClasses, inputStateClasses[resolvedState], className)}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          ref={ref}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-sm text-rose-600 dark:text-rose-300" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={helperId}
            className={cn(
              'text-sm',
              resolvedState === 'success'
                ? 'text-emerald-600 dark:text-emerald-300'
                : copyClasses.muted
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
