import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { ValidatedNumberInput } from './ValidatedField';
import { cn, textColors } from '../lib/classNames';

export interface MonthlyFinancialsData {
  january?: number;
  february?: number;
  march?: number;
  april?: number;
  may?: number;
  june?: number;
  july?: number;
  august?: number;
  september?: number;
  october?: number;
  november?: number;
  december?: number;
}

export interface FinancialsInputFormProps {
  data: MonthlyFinancialsData;
  onChange: (data: MonthlyFinancialsData) => void;
  title?: string;
  readonly?: boolean;
}

const months = [
  { key: 'january' as const, label: 'January' },
  { key: 'february' as const, label: 'February' },
  { key: 'march' as const, label: 'March' },
  { key: 'april' as const, label: 'April' },
  { key: 'may' as const, label: 'May' },
  { key: 'june' as const, label: 'June' },
  { key: 'july' as const, label: 'July' },
  { key: 'august' as const, label: 'August' },
  { key: 'september' as const, label: 'September' },
  { key: 'october' as const, label: 'October' },
  { key: 'november' as const, label: 'November' },
  { key: 'december' as const, label: 'December' },
];

export function FinancialsInputForm({
  data,
  onChange,
  title = 'Monthly Revenue Data',
  readonly = false,
}: FinancialsInputFormProps) {
  const handleMonthChange = React.useCallback(
    (month: keyof MonthlyFinancialsData, value: number | undefined) => {
      onChange({
        ...data,
        [month]: value,
      });
    },
    [data, onChange]
  );

  const values = React.useMemo(() => Object.values(data), [data]);
  const totalRevenue = React.useMemo(
    () => values.reduce((sum, current) => sum + (current ?? 0), 0),
    [values]
  );
  const enteredMonths = React.useMemo(
    () => values.filter((value): value is number => value !== undefined).length,
    [values]
  );
  const averageRevenue = enteredMonths > 0 ? totalRevenue / enteredMonths : 0;

  const validateNonNegative = React.useCallback((value: number | undefined) => {
    if (value === undefined) {
      return null;
    }
    return value >= 0 ? null : 'Amount must be zero or greater';
  }, []);

  return (
    <Card variant="interactive">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {months.map((month) => (
            <ValidatedNumberInput
              key={month.key}
              label={month.label}
              type="number"
              value={data[month.key]}
              onValueChange={(value) => handleMonthChange(month.key, value)}
              validator={validateNonNegative}
              placeholder="0"
              min="0"
              step="0.01"
              disabled={readonly}
              helperText="Monthly revenue in USD"
            />
          ))}
        </div>
        <div className="mt-5 rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-900/80">
          <div className={cn('text-sm', textColors.secondary)}>
            <strong>Total Revenue:</strong>{' '}
            ${totalRevenue.toLocaleString()}
          </div>
          <div className={cn('text-sm', textColors.secondary)}>
            <strong>Average Monthly:</strong>{' '}
            ${averageRevenue.toLocaleString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
