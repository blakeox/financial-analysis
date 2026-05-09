import { type SelectHTMLAttributes } from 'react';
import { cn, inputClasses } from '../lib/classNames';

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
  ...props
}: SelectProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
          {label}
        </label>
      )}
      <select
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
        <p className="text-sm text-slate-500 dark:text-slate-400">{helperText}</p>
      )}
      {error && (
        <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p>
      )}
    </div>
  );
}
