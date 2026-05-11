import { useCallback, useMemo, useState } from 'react';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { ValidatedInput, ValidatedNumberInput } from './ValidatedField';
import { formatCurrency } from '../lib/formatters';
import { badgeVariants, cardVariants, checkboxClasses, cn, textColors } from '../lib/classNames';

export interface FixedAssetData {
  id: string;
  name: string;
  monthlyDepreciation: number;
  isActive: boolean;
}

export interface FixedAssetsManagerProps {
  assets: FixedAssetData[];
  onChange: (assets: FixedAssetData[]) => void;
  readonly?: boolean;
}

type FixedAssetDraft = {
  name: string;
  monthlyDepreciation: number | undefined;
  isActive: boolean;
};

export function FixedAssetsManager({ assets, onChange, readonly = false }: FixedAssetsManagerProps) {
  const [newAsset, setNewAsset] = useState<FixedAssetDraft>({
    name: '',
    monthlyDepreciation: 0,
    isActive: true,
  });

  const validateName = useCallback((value: string) => (value.trim() ? null : 'Name is required'), []);
  const validateAmount = useCallback((value: number | undefined) => {
    if (value === undefined) {
      return 'Amount is required';
    }
    return value >= 0 ? null : 'Amount must be zero or greater';
  }, []);

  const addAsset = () => {
  const trimmedName = newAsset.name.trim();
  if (!trimmedName || typeof newAsset.monthlyDepreciation !== 'number') {
      return;
    }

    const asset: FixedAssetData = {
      id: Date.now().toString(),
      name: trimmedName,
      monthlyDepreciation: newAsset.monthlyDepreciation,
      isActive: newAsset.isActive ?? true,
    };

    onChange([...assets, asset]);
    setNewAsset({ name: '', monthlyDepreciation: 0, isActive: true });
  };

  const removeAsset = (id: string) => {
    onChange(assets.filter((a) => a.id !== id));
  };

  const updateAsset = <K extends keyof FixedAssetData>(id: string, field: K, value: FixedAssetData[K]) => {
    onChange(assets.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
  };

  const totalMonthlyDepreciation = useMemo(
    () => assets.reduce((sum, asset) => sum + (asset.isActive ? asset.monthlyDepreciation : 0), 0),
    [assets]
  );
  const summaryCardBase =
    'rounded-2xl border p-4 text-center shadow-[0_10px_24px_rgba(9,14,36,0.04)]';

  return (
    <Card variant="interactive">
      <CardHeader>
        <CardTitle>Fixed Assets</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className={cn(summaryCardBase, 'border-violet-200 bg-violet-50/90 dark:border-violet-900/70 dark:bg-violet-950/30')}>
            <div className={cn('text-2xl font-bold', textColors.accent)}>{assets.length}</div>
            <div className={cn('text-sm', textColors.secondary)}>Assets</div>
          </div>
          <div className={cn(summaryCardBase, 'border-amber-200 bg-amber-50/90 dark:border-amber-900/70 dark:bg-amber-950/30')}>
            <div className={cn('text-2xl font-bold', textColors.warning)}>
              {formatCurrency(totalMonthlyDepreciation)}
            </div>
            <div className={cn('text-sm', textColors.secondary)}>Monthly Depreciation</div>
          </div>
          <div className={cn(summaryCardBase, 'border-emerald-200 bg-emerald-50/90 dark:border-emerald-900/70 dark:bg-emerald-950/30')}>
            <div className={cn('text-2xl font-bold', textColors.success)}>
              {formatCurrency(totalMonthlyDepreciation * 12)}
            </div>
            <div className={cn('text-sm', textColors.secondary)}>Annual Depreciation</div>
          </div>
        </div>

        <div className="space-y-3">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className={cn(cardVariants.subtle, 'p-4 shadow-sm')}
            >
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                <ValidatedInput
                  label="Name"
                  value={asset.name}
                  onValueChange={(value) => updateAsset(asset.id, 'name', value)}
                  validator={validateName}
                  disabled={readonly}
                />
                <ValidatedNumberInput
                  label="Monthly Depreciation"
                  type="number"
                  value={asset.monthlyDepreciation}
                  onValueChange={(value) => updateAsset(asset.id, 'monthlyDepreciation', value ?? 0)}
                  validator={validateAmount}
                  disabled={readonly}
                  min="0"
                />
                <div className="flex gap-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={asset.isActive}
                      onChange={(event) => updateAsset(asset.id, 'isActive', event.target.checked)}
                      disabled={readonly}
                      className={checkboxClasses}
                    />
                    <span
                      className={cn(
                        'rounded-full px-2 py-1 text-xs font-semibold',
                        asset.isActive ? badgeVariants.success : badgeVariants.default
                      )}
                    >
                      {asset.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </label>
                  {!readonly && (
                    <Button onClick={() => removeAsset(asset.id)} variant="outline" size="sm">
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
            <h4 className={cn('mb-3 font-semibold', textColors.primary)}>Add Fixed Asset</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <ValidatedInput
                label="Name"
                value={newAsset.name ?? ''}
                onValueChange={(value) => setNewAsset((prev) => ({ ...prev, name: value }))}
                validator={validateName}
                placeholder="Asset name"
                validateOnChange
              />
              <ValidatedNumberInput
                label="Monthly Depreciation"
                type="number"
                value={newAsset.monthlyDepreciation}
                onValueChange={(value) =>
                  setNewAsset((prev) => ({ ...prev, monthlyDepreciation: value ?? undefined }))
                }
                validator={validateAmount}
                placeholder="0"
                min="0"
                validateOnChange
              />
            </div>
            <div className="mt-3">
              <Button
                onClick={addAsset}
                disabled={!newAsset.name?.trim() || typeof newAsset.monthlyDepreciation !== 'number'}
              >
                Add Asset
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
