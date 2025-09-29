import {
  type AmortizationAnalysisResult,
  computeAmortizationInsights,
} from '@financial-analysis/analysis';
import React, { useMemo } from 'react';
import { cn } from '../lib/utils';
import { AmortizationChart } from './AmortizationChart';
import { Card, CardContent } from './Card';

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

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
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
  const insights = useMemo(() => computeAmortizationInsights(result), [result]);

  // Calculate additional metrics from enhanced result
  const totalPMI = useMemo(() => {
    return schedule.reduce<number>((sum: number, item: ScheduleItem) => 
      sum + (item.pmi ?? 0), 0);
  }, [schedule]);
  
  const totalExtraPayments = useMemo(() => {
    return schedule.reduce<number>((sum: number, item: ScheduleItem) => 
      sum + (item.extraPayment ?? 0), 0);
  }, [schedule]);

  const hasAdvancedFeatures = totalPMI > 0 || totalExtraPayments > 0 || result.totalPMI !== undefined || result.interestSaved !== undefined;
  const hasPaymentDates = schedule.some(item => item.date);

  return (
    <div className={cn('space-y-8', className)} {...props}>
      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-600 text-white dark:bg-blue-500">
          <CardContent className="space-y-2">
            <p className="text-sm uppercase tracking-wide opacity-90">Monthly payment</p>
            <p className="text-3xl font-semibold">
              {currencyFormatter.format(result.monthlyPayment)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total interest</p>
            <p className="text-2xl font-semibold text-emerald-500 dark:text-emerald-400">
              {currencyFormatter.format(result.totalInterest)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {interestShare.toFixed(1)}% of total cost
            </p>
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

      {/* Advanced Features Summary */}
      {hasAdvancedFeatures && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {totalPMI > 0 && (
            <Card className="border-orange-200 dark:border-orange-800">
              <CardContent className="space-y-2">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total PMI</p>
                <p className="text-xl font-semibold text-orange-500 dark:text-orange-400">
                  {currencyFormatter.format(totalPMI)}
                </p>
                {result.pmiDropoffMonth && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Drops off month {result.pmiDropoffMonth}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
          
          {totalExtraPayments > 0 && (
            <Card className="border-green-200 dark:border-green-800">
              <CardContent className="space-y-2">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Extra payments</p>
                <p className="text-xl font-semibold text-green-500 dark:text-green-400">
                  {currencyFormatter.format(totalExtraPayments)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Principal acceleration
                </p>
              </CardContent>
            </Card>
          )}
          
          {result.interestSaved !== undefined && result.interestSaved > 0 && (
            <Card className="border-cyan-200 dark:border-cyan-800">
              <CardContent className="space-y-2">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Interest saved</p>
                <p className="text-xl font-semibold text-cyan-500 dark:text-cyan-400">
                  {currencyFormatter.format(result.interestSaved)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  vs. standard loan
                </p>
              </CardContent>
            </Card>
          )}
          
          {result.timeReduced !== undefined && result.timeReduced > 0 && (
            <Card className="border-indigo-200 dark:border-indigo-800">
              <CardContent className="space-y-2">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Time saved</p>
                <p className="text-xl font-semibold text-indigo-500 dark:text-indigo-400">
                  {Math.floor(result.timeReduced / 12)}y {result.timeReduced % 12}m
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  vs. standard loan
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Payoff Date */}
      {result.payoffDate && (
        <Card className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20">
          <CardContent className="text-center space-y-2">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Final payment date</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {dateFormatter.format(new Date(result.payoffDate))}
            </p>
          </CardContent>
        </Card>
      )}

      {showChart ? (
        <AmortizationChart
          schedule={schedule}
          title={chartTitle}
          milestones={insights.milestones}
        />
      ) : null}

      {showTable ? (
        <div className="overflow-x-auto">
          <table
            className="min-w-full table-fixed border-collapse"
            aria-label="Amortization schedule table"
          >
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-800 dark:text-gray-300">
                <th className="px-3 py-3 w-16">Month</th>
                {hasPaymentDates && <th className="px-3 py-3 w-24">Date</th>}
                <th className="px-3 py-3 w-24">Payment</th>
                <th className="px-3 py-3 w-24">Principal</th>
                <th className="px-3 py-3 w-24">Interest</th>
                {totalPMI > 0 && <th className="px-3 py-3 w-20">PMI</th>}
                {totalExtraPayments > 0 && <th className="px-3 py-3 w-20">Extra</th>}
                <th className="px-3 py-3 w-28">Balance</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((item: ScheduleItem) => (
                <tr
                  key={item.month}
                  className="border-t border-gray-100 text-sm dark:border-gray-700/60 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-300 font-medium">{item.month}</td>
                  {hasPaymentDates && (
                    <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                      {item.date ? dateFormatter.format(new Date(item.date)) : '-'}
                    </td>
                  )}
                  <td className="px-3 py-2 font-medium">{currencyFormatter.format(item.payment)}</td>
                  <td className="px-3 py-2 text-emerald-600 dark:text-emerald-400">
                    {currencyFormatter.format(item.principal)}
                  </td>
                  <td className="px-3 py-2 text-amber-600 dark:text-amber-400">
                    {currencyFormatter.format(item.interest)}
                  </td>
                  {totalPMI > 0 && (
                    <td className="px-3 py-2 text-orange-600 dark:text-orange-400">
                      {item.pmi ? currencyFormatter.format(item.pmi) : '-'}
                    </td>
                  )}
                  {totalExtraPayments > 0 && (
                    <td className="px-3 py-2 text-green-600 dark:text-green-400">
                      {item.extraPayment ? currencyFormatter.format(item.extraPayment) : '-'}
                    </td>
                  )}
                  <td className="px-3 py-2 font-medium">{currencyFormatter.format(item.balance)}</td>
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
