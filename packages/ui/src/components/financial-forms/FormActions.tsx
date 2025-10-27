import React from 'react';
import { cn } from '../../lib/utils';

export interface FormActionsProps {
  submitLabel?: string;
  onReset?: () => void;
  resetLabel?: string;
  className?: string;
  isSubmitting?: boolean;
}

export const FormActions: React.FC<FormActionsProps> = ({
  submitLabel = 'Submit',
  resetLabel = 'Reset',
  onReset,
  className,
  isSubmitting = false,
}) => {
  return (
    <div className={cn('flex gap-4', className)}>
      <button
        type="submit"
        className="flex-1 rounded-md bg-primary-600 px-4 py-2 font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
      >
        {submitLabel}
      </button>
      <button
        type="button"
        onClick={onReset}
        className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        {resetLabel}
      </button>
    </div>
  );
};
