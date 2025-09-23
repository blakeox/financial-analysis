import { Input } from './Input';
import { Card, CardContent, CardHeader, CardTitle } from './Card';

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
  readonly = false 
}: FinancialsInputFormProps) {
  const handleMonthChange = (month: keyof MonthlyFinancialsData, value: string) => {
    const numericValue = value === '' ? undefined : Number(value);
    onChange({
      ...data,
      [month]: numericValue,
    });
  };

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return '';
    return value.toString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {months.map((month) => (
            <Input
              key={month.key}
              label={month.label}
              type="number"
              value={formatCurrency(data[month.key])}
              onChange={(e) => handleMonthChange(month.key, e.target.value)}
              placeholder="0"
              min="0"
              step="0.01"
              disabled={readonly}
              helperText="Monthly revenue in USD"
            />
          ))}
        </div>
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            <strong>Total Revenue:</strong>{' '}
            ${Object.values(data).reduce((sum, val) => sum + (val || 0), 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            <strong>Average Monthly:</strong>{' '}
            ${(Object.values(data).reduce((sum, val) => sum + (val || 0), 0) / 
              Object.values(data).filter(val => val !== undefined).length || 0).toLocaleString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}