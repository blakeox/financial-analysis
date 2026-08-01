import React from 'react';
import type { ButtonSize, ButtonVariant } from '../lib/primitiveContracts';
import { buttonBaseClasses, buttonSizeClasses, buttonVariants } from '../lib/classNames';
import { cn } from '../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    // Canonical: danger / ghost. Aliases: destructive → danger, tertiary → ghost (#361).
    const resolvedVariant =
      variant === 'destructive' ? 'danger' : variant === 'tertiary' ? 'ghost' : variant;

    return (
      <button
        className={cn(
          buttonBaseClasses,
          buttonVariants[resolvedVariant],
          buttonSizeClasses[size],
          className
        )}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-90"
              fill="currentColor"
              d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z"
            />
          </svg>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
