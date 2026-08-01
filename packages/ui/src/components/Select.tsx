import React, { type SelectHTMLAttributes } from 'react';
import { cn, inputClasses, inputStateClasses } from '../lib/classNames';
import { FieldShell, fieldDescribedBy } from './FieldShell';

interface Option {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  options: Option[];
  onChange?: (value: string) => void;
  helperText?: string;
  error?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, onChange, helperText, error, className = '', id, ...props }, ref) => {
    const selectId = id ?? React.useId();
    const describedBy = fieldDescribedBy(selectId, { error, helperText });

    return (
      <FieldShell controlId={selectId} label={label} error={error} helperText={helperText}>
        <select
          id={selectId}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            inputClasses,
            'appearance-none py-2.5',
            error ? inputStateClasses.error : '',
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
      </FieldShell>
    );
  }
);

Select.displayName = 'Select';

export { Select };
