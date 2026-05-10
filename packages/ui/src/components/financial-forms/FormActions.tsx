import React from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../Button';

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
      <Button
        type="submit"
        className="flex-1"
        disabled={isSubmitting}
      >
        {submitLabel}
      </Button>
      <Button
        type="button"
        onClick={onReset}
        variant="secondary"
      >
        {resetLabel}
      </Button>
    </div>
  );
};
