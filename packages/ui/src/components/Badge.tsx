import React from 'react';
import { badgeVariants } from '../lib/classNames';
import { cn } from '../lib/utils';

export type BadgeVariant = keyof typeof badgeVariants;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

/** Composes spine `fa-badge-*` classes (see Callout → `fa-callout-*`). */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn('inline-flex items-center font-semibold', badgeVariants[variant], className)}
      {...props}
    >
      {children}
    </span>
  )
);

Badge.displayName = 'Badge';
