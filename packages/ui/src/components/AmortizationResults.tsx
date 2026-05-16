import {
  type AmortizationAnalysisResult,
  computeAmortizationInsights,
} from '@financial-analysis/analysis';
import React, { useMemo } from 'react';
import { parseCalendarDate } from '../lib/formatters';
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
    return schedule.reduce<number>((sum: number, item: ScheduleItem) => sum + (item.pmi ?? 0), 0);
  }, [schedule]);

  const totalExtraPayments = useMemo(() => {
    return schedule.reduce<number>(
      (sum: number, item: ScheduleItem) => sum + (item.extraPayment ?? 0),
      0
    );
  }, [schedule]);

  const hasAdvancedFeatures =
    totalPMI > 0 ||
    totalExtraPayments > 0 ||
    result.totalPMI !== undefined ||
    result.interestSaved !== undefined;
  const hasPaymentDates = schedule.some((item: ScheduleItem) => item.date);

  return (
    <div className={cn('space-y-8', className)} {...props}>
      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          variant="elevated"
          className="border-transparent bg-linear-to-br from-violet-600 to-violet-700 text-white shadow-[0_20px_48px_rgba(109,74,255,0.3)] dark:border-transparent dark:from-violet-500 dark:to-violet-700"
        >
          <CardContent className="space-y-2">
            <p className="text-sm uppercase tracking-wide opacity-90">Monthly payment</p>
            <p className="text-3xl font-semibold">
              {currencyFormatter.format(result.monthlyPayment)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total interest</p>
            <p className="text-2xl font-semibold text-emerald-500 dark:text-emerald-400">
              {currencyFormatter.format(result.totalInterest)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {interestShare.toFixed(1)}% of total cost
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total paid</p>
            <p className="text-2xl font-semibold text-violet-500 dark:text-violet-300">
              {currencyFormatter.format(result.totalPayments)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Principal repaid: {currencyFormatter.format(totalPrincipal)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Features Summary */}
      {hasAdvancedFeatures && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {totalPMI > 0 && (
            <Card variant="subtle" className="border-amber-200/80 dark:border-amber-900/60">
              <CardContent className="space-y-2">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total PMI</p>
                <p className="text-xl font-semibold text-orange-500 dark:text-orange-400">
                  {currencyFormatter.format(totalPMI)}
                </p>
                {result.pmiDropoffMonth && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Drops off month {result.pmiDropoffMonth}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {totalExtraPayments > 0 && (
            <Card variant="subtle" className="border-emerald-200/80 dark:border-emerald-900/60">
              <CardContent className="space-y-2">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Extra payments
                </p>
                <p className="text-xl font-semibold text-emerald-500 dark:text-emerald-300">
                  {currencyFormatter.format(totalExtraPayments)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Principal acceleration</p>
              </CardContent>
            </Card>
          )}

          {result.interestSaved !== undefined && result.interestSaved > 0 && (
            <Card variant="subtle" className="border-cyan-200/80 dark:border-cyan-900/60">
              <CardContent className="space-y-2">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Interest saved
                </p>
                <p className="text-xl font-semibold text-cyan-500 dark:text-cyan-400">
                  {currencyFormatter.format(result.interestSaved)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">vs. standard loan</p>
              </CardContent>
            </Card>
          )}

          {result.timeReduced !== undefined && result.timeReduced > 0 && (
            <Card variant="subtle" className="border-violet-200/80 dark:border-violet-900/60">
              <CardContent className="space-y-2">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Time saved</p>
                <p className="text-xl font-semibold text-violet-500 dark:text-violet-300">
                  {Math.floor(result.timeReduced / 12)}y {result.timeReduced % 12}m
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">vs. standard loan</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* PITI Summary Card */}
      {result.totalMonthlyPayment && (
        <Card
          variant="elevated"
          className="bg-linear-to-r from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/20"
        >
          <CardContent className="space-y-3">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Total Monthly Payment (PITI)
            </p>
            <p className="text-3xl font-bold text-violet-600 dark:text-violet-300">
              {currencyFormatter.format(result.totalMonthlyPayment)}
            </p>
            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Principal + Interest:</span>
                <span className="font-medium">
                  {currencyFormatter.format(result.monthlyPayment)}
                </span>
              </div>
              {result.monthlyPropertyTax && result.monthlyPropertyTax > 0 && (
                <div className="flex justify-between">
                  <span>Property Tax:</span>
                  <span className="font-medium">
                    {currencyFormatter.format(result.monthlyPropertyTax)}
                  </span>
                </div>
              )}
              {result.monthlyInsurance && result.monthlyInsurance > 0 && (
                <div className="flex justify-between">
                  <span>Home Insurance:</span>
                  <span className="font-medium">
                    {currencyFormatter.format(result.monthlyInsurance)}
                  </span>
                </div>
              )}
              {result.monthlyHOA && result.monthlyHOA > 0 && (
                <div className="flex justify-between">
                  <span>HOA Fees:</span>
                  <span className="font-medium">{currencyFormatter.format(result.monthlyHOA)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* APR Card */}
      {result.apr && (
        <Card variant="subtle" className="border-amber-200/80 dark:border-amber-900/60">
          <CardContent className="space-y-2">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              APR (Annual Percentage Rate)
            </p>
            <p className="text-2xl font-semibold text-yellow-600 dark:text-yellow-400">
              {(result.apr * 100).toFixed(3)}%
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Includes all closing costs</p>
          </CardContent>
        </Card>
      )}

      {/* Total Cost Summary */}
      {result.totalCostSummary && (
        <Card variant="elevated" className="col-span-full">
          <CardContent className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Total Cost of Ownership
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {result.totalCostSummary.downPayment > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Down Payment</p>
                  <p className="text-lg font-semibold">
                    {currencyFormatter.format(result.totalCostSummary.downPayment)}
                  </p>
                </div>
              )}
              {result.totalCostSummary.closingCosts > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Closing Costs</p>
                  <p className="text-lg font-semibold">
                    {currencyFormatter.format(result.totalCostSummary.closingCosts)}
                  </p>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-xs text-slate-500 dark:text-slate-400">Total Principal</p>
                <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                  {currencyFormatter.format(result.totalCostSummary.totalPrincipal)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500 dark:text-slate-400">Total Interest</p>
                <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                  {currencyFormatter.format(result.totalCostSummary.totalInterest)}
                </p>
              </div>
              {result.totalCostSummary.totalPMI > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total PMI</p>
                  <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                    {currencyFormatter.format(result.totalCostSummary.totalPMI)}
                  </p>
                </div>
              )}
              {result.totalCostSummary.totalTaxes > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total Property Tax</p>
                  <p className="text-lg font-semibold">
                    {currencyFormatter.format(result.totalCostSummary.totalTaxes)}
                  </p>
                </div>
              )}
              {result.totalCostSummary.totalInsurance > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total Insurance</p>
                  <p className="text-lg font-semibold">
                    {currencyFormatter.format(result.totalCostSummary.totalInsurance)}
                  </p>
                </div>
              )}
              {result.totalCostSummary.totalHOA > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total HOA Fees</p>
                  <p className="text-lg font-semibold">
                    {currencyFormatter.format(result.totalCostSummary.totalHOA)}
                  </p>
                </div>
              )}
            </div>
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between items-center">
                <p className="text-lg font-semibold text-slate-900 dark:text-white">Total Cost</p>
                <p className="text-2xl font-bold text-violet-600 dark:text-violet-300">
                  {currencyFormatter.format(result.totalCostSummary.totalCost)}
                </p>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Complete ownership cost over {result.schedule.length} months
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payoff Date */}
      {result.payoffDate && (
        <Card
          variant="elevated"
          className="bg-linear-to-r from-violet-50 to-emerald-50 dark:from-violet-950/25 dark:to-emerald-950/20"
        >
          <CardContent className="text-center space-y-2">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Final payment date
            </p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">
              {dateFormatter.format(parseCalendarDate(result.payoffDate))}
            </p>
          </CardContent>
        </Card>
      )}

      {showChart ? (
        <AmortizationChart
          className="w-full"
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
              <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-300">
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
                  className="border-t border-slate-100 text-sm dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                >
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300 font-medium">
                    {item.month}
                  </td>
                  {hasPaymentDates && (
                    <td className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                      {item.date ? dateFormatter.format(new Date(item.date)) : '-'}
                    </td>
                  )}
                  <td className="px-3 py-2 font-medium">
                    {currencyFormatter.format(item.payment)}
                  </td>
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
                    <td className="px-3 py-2 text-emerald-600 dark:text-emerald-300">
                      {item.extraPayment ? currencyFormatter.format(item.extraPayment) : '-'}
                    </td>
                  )}
                  <td className="px-3 py-2 font-medium">
                    {currencyFormatter.format(item.balance)}
                  </td>
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
