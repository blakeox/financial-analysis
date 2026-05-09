import { useState } from 'react';
import { Input } from './Input';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Select } from './Select';
import { parsers } from '../lib/formUtils';
import { badgeVariants, cn, textColors } from '../lib/classNames';

export interface ExpenseTypeData {
  id: string;
  name: string;
  currentMonthlyAmount: number;
  category: 'fixed' | 'variable' | 'mixed';
  growthRate: number;
  isActive: boolean;
}

export interface ExpenseTypesManagerProps {
  expenseTypes: ExpenseTypeData[];
  onChange: (expenseTypes: ExpenseTypeData[]) => void;
  readonly?: boolean;
}

export function ExpenseTypesManager({ expenseTypes, onChange, readonly = false }: ExpenseTypesManagerProps) {
  const [newExpense, setNewExpense] = useState<Partial<ExpenseTypeData>>({
    name: '',
    currentMonthlyAmount: 0,
    category: 'fixed',
    growthRate: 0,
    isActive: true,
  });

  const addExpenseType = () => {
    if (!newExpense.name) return;

    const expense: ExpenseTypeData = {
      id: Date.now().toString(),
      name: newExpense.name,
      currentMonthlyAmount: newExpense.currentMonthlyAmount || 0,
      category: newExpense.category || 'fixed',
      growthRate: newExpense.growthRate || 0,
      isActive: true,
    };

    onChange([...expenseTypes, expense]);
    setNewExpense({
      name: '',
      currentMonthlyAmount: 0,
      category: 'fixed',
      growthRate: 0,
      isActive: true,
    });
  };

  const removeExpenseType = (id: string) => {
    onChange(expenseTypes.filter(exp => exp.id !== id));
  };

  const updateExpenseType = (id: string, field: keyof ExpenseTypeData, value: string | number | boolean) => {
    onChange(expenseTypes.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    ));
  };

  const totalMonthlyExpenses = expenseTypes.reduce((sum, exp) => 
    sum + (exp.isActive ? exp.currentMonthlyAmount : 0), 0
  );

  const categorySummary = expenseTypes.reduce((acc, exp) => {
    if (!exp.isActive) return acc;
    acc[exp.category] = (acc[exp.category] || 0) + exp.currentMonthlyAmount;
    return acc;
  }, {} as Record<string, number>);
  const summaryCardBase =
    'rounded-2xl border p-4 text-center shadow-[0_10px_24px_rgba(9,14,36,0.04)]';

  return (
    <Card variant="interactive">
      <CardHeader>
        <CardTitle>Expense Types Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className={cn(summaryCardBase, 'border-rose-200 bg-rose-50/90 dark:border-rose-900/70 dark:bg-rose-950/30')}>
            <div className={cn('text-2xl font-bold', textColors.danger)}>
              ${totalMonthlyExpenses.toLocaleString()}
            </div>
            <div className={cn('text-sm', textColors.secondary)}>Total Monthly</div>
          </div>
          <div className={cn(summaryCardBase, 'border-violet-200 bg-violet-50/90 dark:border-violet-900/70 dark:bg-violet-950/30')}>
            <div className={cn('text-lg font-bold', textColors.accent)}>
              ${(categorySummary.fixed || 0).toLocaleString()}
            </div>
            <div className={cn('text-sm', textColors.secondary)}>Fixed Costs</div>
          </div>
          <div className={cn(summaryCardBase, 'border-amber-200 bg-amber-50/90 dark:border-amber-900/70 dark:bg-amber-950/30')}>
            <div className={cn('text-lg font-bold', textColors.warning)}>
              ${(categorySummary.variable || 0).toLocaleString()}
            </div>
            <div className={cn('text-sm', textColors.secondary)}>Variable Costs</div>
          </div>
          <div className={cn(summaryCardBase, 'border-sky-200 bg-sky-50/90 dark:border-sky-900/70 dark:bg-sky-950/30')}>
            <div className="text-lg font-bold text-sky-600 dark:text-sky-300">
              ${(categorySummary.mixed || 0).toLocaleString()}
            </div>
            <div className={cn('text-sm', textColors.secondary)}>Mixed Costs</div>
          </div>
        </div>

        {/* Expense Types List */}
        <div className="space-y-3">
          {expenseTypes.map((expense) => (
            <div
              key={expense.id}
              className="rounded-[1.35rem] border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/85"
            >
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                <Input
                  label="Expense Name"
                  value={expense.name}
                  onChange={(e) => updateExpenseType(expense.id, 'name', e.target.value)}
                  disabled={readonly}
                />
                <Input
                  label="Monthly Amount"
                  type="number"
                  value={expense.currentMonthlyAmount}
                  onChange={(e) => updateExpenseType(expense.id, 'currentMonthlyAmount', parsers.number(e.target.value))}
                  disabled={readonly}
                  min="0"
                />
                <Select
                  label="Category"
                  value={expense.category}
                  onChange={(value) =>
                    updateExpenseType(expense.id, 'category', value as ExpenseTypeData['category'])
                  }
                  disabled={readonly}
                  aria-label="Expense category"
                  options={[
                    { value: 'fixed', label: 'Fixed' },
                    { value: 'variable', label: 'Variable' },
                    { value: 'mixed', label: 'Mixed' },
                  ]}
                />
                <Input
                  label="Growth Rate (%)"
                  type="number"
                  value={expense.growthRate * 100}
                  onChange={(e) => updateExpenseType(expense.id, 'growthRate', parsers.percentage(e.target.value))}
                  disabled={readonly}
                  min="-100"
                  max="100"
                  step="0.1"
                />
                <div className="flex gap-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={expense.isActive}
                      onChange={(e) => updateExpenseType(expense.id, 'isActive', e.target.checked)}
                      disabled={readonly}
                      className="rounded border-slate-300 text-violet-600 focus:ring-violet-500/40 dark:border-slate-700"
                    />
                    <span
                      className={cn(
                        'rounded-full px-2 py-1 text-xs font-semibold',
                        expense.isActive ? badgeVariants.success : badgeVariants.default
                      )}
                    >
                      {expense.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </label>
                  {!readonly && (
                    <Button
                      onClick={() => removeExpenseType(expense.id)}
                      variant="outline"
                      size="sm"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Expense Type */}
        {!readonly && (
          <div className="rounded-[1.5rem] border-2 border-dashed border-slate-300 bg-slate-50/70 p-5 dark:border-slate-700 dark:bg-slate-900/60">
            <h4 className="mb-3 font-semibold text-slate-900 dark:text-white">Add New Expense Type</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input
                label="Expense Name"
                value={newExpense.name || ''}
                onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
                placeholder="Office rent, utilities, etc."
              />
              <Input
                label="Monthly Amount"
                type="number"
                value={newExpense.currentMonthlyAmount || ''}
                onChange={(e) => setNewExpense({ ...newExpense, currentMonthlyAmount: parsers.number(e.target.value) })}
                placeholder="0"
                min="0"
              />
              <Select
                label="Category"
                value={newExpense.category || 'fixed'}
                onChange={(value) =>
                  setNewExpense({ ...newExpense, category: value as ExpenseTypeData['category'] })
                }
                aria-label="New expense category"
                options={[
                  { value: 'fixed', label: 'Fixed' },
                  { value: 'variable', label: 'Variable' },
                  { value: 'mixed', label: 'Mixed' },
                ]}
              />
              <Input
                label="Growth Rate (%)"
                type="number"
                value={((newExpense.growthRate || 0) * 100).toString()}
                onChange={(e) => setNewExpense({ ...newExpense, growthRate: parsers.percentage(e.target.value) })}
                placeholder="0"
                min="-100"
                max="100"
                step="0.1"
              />
            </div>
            <div className="mt-3">
              <Button 
                onClick={addExpenseType}
                disabled={!newExpense.name}
              >
                Add Expense Type
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
