import React from 'react';
import { cn } from '../../lib/utils';
import {
  copyClasses,
  inputClasses,
  inputStateClasses,
  numericInputClasses,
} from '../../lib/classNames';
import { FieldShell, fieldDescribedBy } from '../FieldShell';

export type PercentFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: string;
  error?: string;
  helperText?: string;
  suffix?: string;
};

export const PercentField = React.forwardRef<HTMLInputElement, PercentFieldProps>(
  ({ label, error, helperText, suffix = '%', className, id, ...props }, ref) => {
    const fieldId = id ?? React.useId();
    const describedBy = fieldDescribedBy(fieldId, { error, helperText });

    return (
      <FieldShell controlId={fieldId} label={label} error={error} helperText={helperText}>
        <div className="relative">
          <input
            id={fieldId}
            ref={ref}
            type="number"
            inputMode="decimal"
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={cn(
              inputClasses,
              numericInputClasses,
              'py-2.5 pl-4 pr-10',
              error && inputStateClasses.error,
              className
            )}
            {...props}
          />
          <span
            className={cn(
              'pointer-events-none absolute top-1/2 right-4 -translate-y-1/2',
              copyClasses.muted
            )}
          >
            {suffix}
          </span>
        </div>
      </FieldShell>
    );
  }
);

PercentField.displayName = 'PercentField';
