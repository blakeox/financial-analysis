import React from 'react';
import type { CardVariant } from '../lib/primitiveContracts';
import { cardVariants } from '../lib/classNames';
import { cn } from '../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: CardVariant;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, variant = 'default', ...props }, ref) => {
    return (
      <div ref={ref} className={cn(cardVariants[variant], className)} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-2 pb-4', className)} {...props} />
  )
);

CardHeader.displayName = 'CardHeader';

type CardTitleProps = React.HTMLAttributes<HTMLHeadingElement> & {
  /** Heading level for accessible outline (default h2 — typical after a page h1). */
  as?: 'h2' | 'h3' | 'h4';
};

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, children, as: Heading = 'h2', ...props }, ref) => (
    <Heading
      ref={ref}
      className={cn(
        'text-2xl font-semibold leading-none tracking-[-0.03em] text-slate-950 dark:text-white',
        className
      )}
      {...props}
    >
      {children}
    </Heading>
  )
);

CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm leading-6 text-slate-600 dark:text-slate-300', className)}
    {...props}
  />
));

CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('', className)} {...props} />
);

CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center pt-4 text-sm text-slate-600 dark:text-slate-300', className)}
      {...props}
    />
  )
);

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
