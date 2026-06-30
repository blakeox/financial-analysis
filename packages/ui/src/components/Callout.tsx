import React from 'react';
import { calloutVariants } from '../lib/classNames';
import { cn } from '../lib/utils';

export type CalloutVariant = keyof typeof calloutVariants;

export interface CalloutProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CalloutVariant;
  title?: string;
}

const titleClassByVariant: Record<CalloutVariant, string> = {
  info: 'fa-callout-title-info',
  success: 'fa-callout-title-success',
  warning: 'font-medium text-yellow-900 dark:text-yellow-200',
  error: 'fa-callout-title-danger',
};

const copyClassByVariant: Record<CalloutVariant, string> = {
  info: 'fa-callout-copy-info',
  success: 'fa-callout-copy-success',
  warning: 'text-yellow-800 dark:text-yellow-100',
  error: 'fa-callout-copy-danger',
};

export const Callout = React.forwardRef<HTMLDivElement, CalloutProps>(
  ({ className, variant = 'info', title, children, ...props }, ref) => (
    <div ref={ref} className={cn(calloutVariants[variant], className)} role="note" {...props}>
      {title ? (
        <p className={cn('text-sm font-medium', titleClassByVariant[variant])}>{title}</p>
      ) : null}
      {children ? (
        <div className={cn(title ? 'mt-1 text-sm' : 'text-sm', copyClassByVariant[variant])}>
          {children}
        </div>
      ) : null}
    </div>
  )
);

Callout.displayName = 'Callout';
