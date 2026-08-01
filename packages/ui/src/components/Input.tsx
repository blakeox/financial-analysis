import React from 'react';
import type { InputState } from '../lib/primitiveContracts';
import { inputClasses, inputStateClasses } from '../lib/classNames';
import { cn } from '../lib/utils';
import { FieldShell, fieldDescribedBy } from './FieldShell';

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
    const inputId = id || React.useId();
    const describedBy = fieldDescribedBy(inputId, { error, helperText });
    const resolvedState: InputState = error ? 'error' : state;

    return (
      <FieldShell
        controlId={inputId}
        label={label}
        error={error}
        helperText={helperText}
        helperTone={resolvedState === 'success' ? 'success' : 'muted'}
      >
        <input
          id={inputId}
          type={type}
          className={cn(inputClasses, inputStateClasses[resolvedState], className)}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          ref={ref}
          {...props}
        />
      </FieldShell>
    );
  }
);

Input.displayName = 'Input';

export { Input };
