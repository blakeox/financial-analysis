import React from 'react';
import { cn } from '../lib/utils';

type ScrollableRegionProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Accessible name for the scrollable region (required for Safari keyboard a11y). */
  label: string;
};

/**
 * Keyboard-focusable horizontal scroll container (WCAG / Safari scrollable-region-focusable).
 */
export function ScrollableRegion({ label, className, children, ...props }: ScrollableRegionProps) {
  return (
    <div
      role="region"
      aria-label={label}
      // axe scrollable-region-focusable (Safari): scroll areas must be keyboard-focusable
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- intentional WCAG pattern
      tabIndex={0}
      className={cn('overflow-x-auto', className)}
      {...props}
    >
      {children}
    </div>
  );
}
