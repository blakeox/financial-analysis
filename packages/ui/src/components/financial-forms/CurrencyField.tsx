import React from 'react';
import { cn } from '../../lib/utils';
import {
  copyClasses,
  inputClasses,
  inputStateClasses,
  numericInputClasses,
} from '../../lib/classNames';
import { FieldShell, fieldDescribedBy } from '../FieldShell';

export type CurrencyFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: string;
  error?: string;
  helperText?: string;
  currencySymbol?: string;
};

export const CurrencyField = React.forwardRef<HTMLInputElement, CurrencyFieldProps>(
  ({ label, error, helperText, currencySymbol = '$', className, id, ...props }, ref) => {
    const fieldId = id ?? React.useId();
    const describedBy = fieldDescribedBy(fieldId, { error, helperText });

    return (
      <FieldShell controlId={fieldId} label={label} error={error} helperText={helperText}>
        <div className="relative">
          <span
            className={cn(
              'pointer-events-none absolute top-1/2 left-4 -translate-y-1/2',
              copyClasses.muted
            )}
          >
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
              numericInputClasses,
              'py-2.5 pl-8 pr-4',
              error && inputStateClasses.error,
              className
            )}
            {...props}
          />
        </div>
      </FieldShell>
    );
  }
);

CurrencyField.displayName = 'CurrencyField';
