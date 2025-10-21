import { useState } from 'react';
import { Input } from './Input';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { parsers } from '../lib/formUtils';

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Types Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              ${totalMonthlyExpenses.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Total Monthly</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              ${(categorySummary.fixed || 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Fixed Costs</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
              ${(categorySummary.variable || 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Variable Costs</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
              ${(categorySummary.mixed || 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Mixed Costs</div>
          </div>
        </div>

        {/* Expense Types List */}
        <div className="space-y-3">
          {expenseTypes.map((expense) => (
            <div key={expense.id} className="p-4 border rounded-md bg-white dark:bg-gray-900">
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
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Category
                  </label>
                  <select
                    value={expense.category}
                    onChange={(e) => updateExpenseType(expense.id, 'category', e.target.value as ExpenseTypeData['category'])}
                    disabled={readonly}
                    aria-label="Expense category"
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="fixed">Fixed</option>
                    <option value="variable">Variable</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
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
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Active</span>
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
          <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md">
            <h4 className="font-medium mb-3">Add New Expense Type</h4>
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
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Category
                </label>
                <select
                  value={newExpense.category || 'fixed'}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value as ExpenseTypeData['category'] })}
                  aria-label="New expense category"
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="fixed">Fixed</option>
                  <option value="variable">Variable</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
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