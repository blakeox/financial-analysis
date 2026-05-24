import React, { type SelectHTMLAttributes } from 'react';
import { cn, copyClasses, inputClasses } from '../lib/classNames';

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  options: Option[];
  onChange?: (value: string) => void;
  helperText?: string;
  error?: string;
}

export function Select({
  label,
  options,
  onChange,
  helperText,
  error,
  className = '',
  id,
  ...props
}: SelectProps) {
  const selectId = id ?? React.useId();
  const errorId = error ? `${selectId}-error` : undefined;
  const helperId = helperText && !error ? `${selectId}-helper` : undefined;
  const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          inputClasses,
          'appearance-none py-2.5',
          error
            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10 dark:border-rose-800 dark:focus:border-rose-500'
            : '',
          className
        )}
        onChange={(e) => onChange?.(e.target.value)}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helperText && !error && (
        <p id={helperId} className={copyClasses.helper}>
          {helperText}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-rose-600 dark:text-rose-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
