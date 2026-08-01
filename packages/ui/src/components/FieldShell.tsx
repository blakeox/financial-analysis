import React from 'react';
import { cn } from '../lib/utils';
import { copyClasses, textColors } from '../lib/classNames';

export type FieldShellHelperTone = 'muted' | 'success';

export type FieldShellProps = {
  /** Associated control id (`htmlFor` / describedBy base). */
  controlId: string;
  label?: string | undefined;
  error?: string | undefined;
  helperText?: string | undefined;
  /** When helper is shown (no error), optional success styling. */
  helperTone?: FieldShellHelperTone | undefined;
  children: React.ReactNode;
  className?: string | undefined;
  labelClassName?: string | undefined;
};

/** Builds `aria-describedby` for a control wrapped by FieldShell. */
export function fieldDescribedBy(
  controlId: string,
  options: { error?: string | undefined; helperText?: string | undefined }
): string | undefined {
  const parts: string[] = [];
  if (options.error) parts.push(`${controlId}-error`);
  if (options.helperText && !options.error) parts.push(`${controlId}-helper`);
  return parts.length > 0 ? parts.join(' ') : undefined;
}

const labelClasses = 'block text-sm font-semibold text-[var(--fa-text-secondary)]';

const errorClasses = 'text-sm text-[var(--fa-status-danger-fg)]';

/**
 * Shared label / helper / error chrome for Input, Select, CurrencyField, PercentField.
 */
export function FieldShell({
  controlId,
  label,
  error,
  helperText,
  helperTone = 'muted',
  children,
  className,
  labelClassName,
}: FieldShellProps) {
  const errorId = error ? `${controlId}-error` : undefined;
  const helperId = helperText && !error ? `${controlId}-helper` : undefined;

  return (
    <div className={cn('space-y-2', className)}>
      {label ? (
        <label htmlFor={controlId} className={cn(labelClasses, labelClassName)}>
          {label}
        </label>
      ) : null}
      {children}
      {error ? (
        <p id={errorId} className={errorClasses} role="alert">
          {error}
        </p>
      ) : null}
      {helperText && !error ? (
        <p
          id={helperId}
          className={cn(
            'text-sm',
            helperTone === 'success' ? textColors.success : copyClasses.muted
          )}
        >
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
