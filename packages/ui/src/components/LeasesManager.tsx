import { useCallback, useMemo, useState } from 'react';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { ValidatedInput, ValidatedNumberInput } from './ValidatedField';
import { formatCurrency } from '../lib/formatters';
import { badgeVariants, cardVariants, checkboxClasses, cn, textColors } from '../lib/classNames';

export interface LeaseData {
  id: string;
  name: string;
  monthlyPayment: number;
  termMonths: number;
  isActive: boolean;
}

export interface LeasesManagerProps {
  leases: LeaseData[];
  onChange: (leases: LeaseData[]) => void;
  readonly?: boolean;
}

type LeaseDraft = {
  name: string;
  monthlyPayment: number | undefined;
  termMonths: number | undefined;
  isActive: boolean;
};

export function LeasesManager({ leases, onChange, readonly = false }: LeasesManagerProps) {
  const [newLease, setNewLease] = useState<LeaseDraft>({
    name: '',
    monthlyPayment: 0,
    termMonths: 12,
    isActive: true,
  });

  const validateName = useCallback((value: string) => (value.trim() ? null : 'Name is required'), []);
  const validateAmount = useCallback((value: number | undefined) => {
    if (value === undefined) {
      return 'Amount is required';
    }
    return value >= 0 ? null : 'Amount must be zero or greater';
  }, []);
  const validateTerm = useCallback((value: number | undefined) => {
    if (value === undefined) {
      return 'Term is required';
    }
    return value > 0 ? null : 'Term must be greater than zero';
  }, []);

  const addLease = () => {
  const trimmedName = newLease.name.trim();
    if (
      !trimmedName ||
      typeof newLease.monthlyPayment !== 'number' ||
      typeof newLease.termMonths !== 'number'
    ) {
      return;
    }

    const lease: LeaseData = {
      id: Date.now().toString(),
      name: trimmedName,
      monthlyPayment: newLease.monthlyPayment,
      termMonths: Math.max(1, Math.floor(newLease.termMonths)),
      isActive: newLease.isActive ?? true,
    };

    onChange([...leases, lease]);
    setNewLease({ name: '', monthlyPayment: 0, termMonths: 12, isActive: true });
  };

  const removeLease = (id: string) => {
    onChange(leases.filter((lease) => lease.id !== id));
  };

  const updateLease = <K extends keyof LeaseData>(id: string, field: K, value: LeaseData[K]) => {
    onChange(leases.map((lease) => (lease.id === id ? { ...lease, [field]: value } : lease)));
  };

  const totalMonthlyLeaseCost = useMemo(
    () => leases.reduce((sum, lease) => sum + (lease.isActive ? lease.monthlyPayment : 0), 0),
    [leases]
  );
  const summaryCardBase =
    'rounded-2xl border p-4 text-center shadow-[0_10px_24px_rgba(9,14,36,0.04)]';

  return (
    <Card variant="interactive">
      <CardHeader>
        <CardTitle>Leases</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className={cn(summaryCardBase, 'border-violet-200 bg-violet-50/90 dark:border-violet-900/70 dark:bg-violet-950/30')}>
            <div className={cn('text-2xl font-bold', textColors.accent)}>{leases.length}</div>
            <div className={cn('text-sm', textColors.secondary)}>Leases</div>
          </div>
          <div className={cn(summaryCardBase, 'border-sky-200 bg-sky-50/90 dark:border-sky-900/70 dark:bg-sky-950/30')}>
            <div className="text-2xl font-bold text-sky-600 dark:text-sky-300">
              {formatCurrency(totalMonthlyLeaseCost)}
            </div>
            <div className={cn('text-sm', textColors.secondary)}>Monthly Lease Cost</div>
          </div>
          <div className={cn(summaryCardBase, 'border-emerald-200 bg-emerald-50/90 dark:border-emerald-900/70 dark:bg-emerald-950/30')}>
            <div className={cn('text-2xl font-bold', textColors.success)}>
              {formatCurrency(totalMonthlyLeaseCost * 12)}
            </div>
            <div className={cn('text-sm', textColors.secondary)}>Annual Lease Cost</div>
          </div>
        </div>

        <div className="space-y-3">
          {leases.map((lease) => (
            <div
              key={lease.id}
              className={cn(cardVariants.subtle, 'p-4 shadow-sm')}
            >
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                <ValidatedInput
                  label="Name"
                  value={lease.name}
                  onValueChange={(value) => updateLease(lease.id, 'name', value)}
                  validator={validateName}
                  disabled={readonly}
                />
                <ValidatedNumberInput
                  label="Monthly Payment"
                  type="number"
                  value={lease.monthlyPayment}
                  onValueChange={(value) => updateLease(lease.id, 'monthlyPayment', value ?? 0)}
                  validator={validateAmount}
                  disabled={readonly}
                  min="0"
                />
                <ValidatedNumberInput
                  label="Term (months)"
                  type="number"
                  value={lease.termMonths}
                  onValueChange={(value) => updateLease(lease.id, 'termMonths', Math.max(1, Math.floor(value ?? 0)))}
                  validator={validateTerm}
                  disabled={readonly}
                  min="1"
                  step="1"
                />
                <div className="flex gap-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={lease.isActive}
                      onChange={(event) => updateLease(lease.id, 'isActive', event.target.checked)}
                      disabled={readonly}
                      className={checkboxClasses}
                    />
                    <span
                      className={cn(
                        'rounded-full px-2 py-1 text-xs font-semibold',
                        lease.isActive ? badgeVariants.success : badgeVariants.default
                      )}
                    >
                      {lease.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </label>
                  {!readonly && (
                    <Button onClick={() => removeLease(lease.id)} variant="outline" size="sm">
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {!readonly && (
          <div className={cn(cardVariants.subtle, 'border-2 border-dashed p-5')}>
            <h4 className={cn('mb-3 font-semibold', textColors.primary)}>Add Lease</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <ValidatedInput
                label="Name"
                value={newLease.name ?? ''}
                onValueChange={(value) => setNewLease((prev) => ({ ...prev, name: value }))}
                validator={validateName}
                placeholder="Lease name"
                validateOnChange
              />
              <ValidatedNumberInput
                label="Monthly Payment"
                type="number"
                value={newLease.monthlyPayment}
                onValueChange={(value) =>
                  setNewLease((prev) => ({ ...prev, monthlyPayment: value ?? undefined }))
                }
                validator={validateAmount}
                placeholder="0"
                min="0"
                validateOnChange
              />
              <ValidatedNumberInput
                label="Term (months)"
                type="number"
                value={newLease.termMonths}
                onValueChange={(value) =>
                  setNewLease((prev) => ({ ...prev, termMonths: value ?? undefined }))
                }
                validator={validateTerm}
                placeholder="12"
                min="1"
                step="1"
                validateOnChange
              />
            </div>
            <div className="mt-3">
              <Button
                onClick={addLease}
                disabled={
                  !newLease.name?.trim() ||
                  typeof newLease.monthlyPayment !== 'number' ||
                  typeof newLease.termMonths !== 'number'
                }
              >
                Add Lease
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
