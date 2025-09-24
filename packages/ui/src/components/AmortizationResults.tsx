import React, { useMemo } from 'react';
import type { AmortizationAnalysisResult } from '@financial-analysis/analysis';
import { Card, CardContent } from './Card';
import { AmortizationChart } from './AmortizationChart';
import { cn } from '../lib/utils';

type ScheduleItem = AmortizationAnalysisResult['schedule'][number];

export interface AmortizationResultsProps extends React.HTMLAttributes<HTMLDivElement> {
  result: AmortizationAnalysisResult;
  showChart?: boolean;
  showTable?: boolean;
  chartTitle?: string;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

export function AmortizationResults({
  result,
  showChart = true,
  showTable = true,
  chartTitle = 'Amortization schedule',
  className,
  ...props
}: AmortizationResultsProps) {
  const schedule = result.schedule;
  const totalPrincipal = useMemo(
    () => schedule.reduce<number>((sum: number, item: ScheduleItem) => sum + item.principal, 0),
    [schedule]
  );
  const totalCost = totalPrincipal + result.totalInterest;
  const interestShare = totalCost === 0 ? 0 : (result.totalInterest / totalCost) * 100;

  return (
    <div className={cn('space-y-8', className)} {...props}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-600 text-white dark:bg-blue-500">
          <CardContent className="space-y-2">
            <p className="text-sm uppercase tracking-wide opacity-90">Monthly payment</p>
            <p className="text-3xl font-semibold">{currencyFormatter.format(result.monthlyPayment)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total interest</p>
            <p className="text-2xl font-semibold text-emerald-500 dark:text-emerald-400">
              {currencyFormatter.format(result.totalInterest)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{interestShare.toFixed(1)}% of total cost</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total paid</p>
            <p className="text-2xl font-semibold text-purple-500 dark:text-purple-400">
              {currencyFormatter.format(result.totalPayments)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Principal repaid: {currencyFormatter.format(totalPrincipal)}
            </p>
          </CardContent>
        </Card>
      </div>

      {showChart ? <AmortizationChart schedule={schedule} title={chartTitle} /> : null}

      {showTable ? (
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed border-collapse" aria-label="Amortization schedule table">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-800 dark:text-gray-300">
                <th className="px-4 py-3">Month</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Principal</th>
                <th className="px-4 py-3">Interest</th>
                <th className="px-4 py-3">Balance</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((item: ScheduleItem) => (
                <tr key={item.month} className="border-t border-gray-100 text-sm dark:border-gray-700/60">
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{item.month}</td>
                  <td className="px-4 py-2">{currencyFormatter.format(item.payment)}</td>
                  <td className="px-4 py-2 text-emerald-600 dark:text-emerald-400">
                    {currencyFormatter.format(item.principal)}
                  </td>
                  <td className="px-4 py-2 text-amber-600 dark:text-amber-400">
                    {currencyFormatter.format(item.interest)}
                  </td>
                  <td className="px-4 py-2">{currencyFormatter.format(item.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

export default AmortizationResults;
