import React from 'react';
import { badgeVariants } from '../lib/classNames';
import { cn } from '../lib/utils';

export type BadgeVariant = keyof typeof badgeVariants;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        badgeVariants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
);

Badge.displayName = 'Badge';
