import React, { useMemo } from 'react';
import type { AmortizationAnalysisResult } from '@financial-analysis/analysis';
import { cn } from '../lib/utils';

type ScheduleItem = AmortizationAnalysisResult['schedule'][number];
type PaymentRect = {
  x: number;
  width: number;
  principalHeight: number;
  interestHeight: number;
};

export interface AmortizationChartProps extends React.HTMLAttributes<HTMLDivElement> {
  schedule: AmortizationAnalysisResult['schedule'];
  title?: string;
}

const CHART_HEIGHT = 260;
const CHART_WIDTH = 720;
const PADDING_TOP = 24;
const PADDING_BOTTOM = 36;

function buildBalancePath(schedule: ScheduleItem[]): string {
  if (!schedule.length) return '';
  const firstPayment = schedule[0];
  if (!firstPayment) return '';

  const startingBalance = firstPayment.balance + firstPayment.principal;
  const maxBalance = schedule.reduce(
    (max, payment) => Math.max(max, payment.balance + payment.principal),
    startingBalance
  );

  if (maxBalance <= 0) return '';

  const usableHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const pointForBalance = (balance: number) =>
    PADDING_TOP + usableHeight - (balance / maxBalance) * usableHeight;

  const parts: string[] = [];

  // Initial point before first payment
  parts.push(`M 0 ${pointForBalance(startingBalance).toFixed(2)}`);

  schedule.forEach((item, index) => {
    const x = (CHART_WIDTH / schedule.length) * (index + 1);
    const y = pointForBalance(item.balance);
    parts.push(`L ${x.toFixed(2)} ${y.toFixed(2)}`);
  });

  return parts.join(' ');
}

function buildPaymentRects(schedule: ScheduleItem[]): PaymentRect[] {
  if (!schedule.length) return [];
  const usableHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const initialPayment = schedule[0]?.payment ?? 0;
  const maxPayment = schedule.reduce((max, item) => Math.max(max, item.payment), initialPayment);
  const barWidth = CHART_WIDTH / schedule.length;
  return schedule.map((item, index) => {
    const paymentRatio = (value: number) => (maxPayment > 0 ? (value / maxPayment) * usableHeight : 0);
    const principalHeight = paymentRatio(item.principal);
    const interestHeight = paymentRatio(item.interest);
    const x = index * barWidth + barWidth * 0.2;
    return { x, principalHeight, interestHeight, width: barWidth * 0.6 };
  });
}

export function AmortizationChart({
  schedule,
  title = 'Amortization schedule',
  className,
  ...props
}: AmortizationChartProps) {
  const balancePath = useMemo(() => buildBalancePath(schedule), [schedule]);
  const paymentRects = useMemo(() => buildPaymentRects(schedule), [schedule]);

  return (
    <div className={cn('space-y-3', className)} {...props}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</h3>
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <span className="inline-flex h-2 w-2 rounded-full bg-blue-500" aria-hidden />
            <span>Remaining balance</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-flex h-2 w-2 rounded bg-emerald-400" aria-hidden />
            <span>Principal</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-flex h-2 w-2 rounded bg-amber-400" aria-hidden />
            <span>Interest</span>
          </div>
        </div>
      </div>

      <svg
        role="img"
        aria-label={`${title} chart`}
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="w-full h-64"
      >
        <defs>
          <linearGradient id="amortization-balance" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Axis baseline */}
        <line
          x1={0}
          y1={CHART_HEIGHT - PADDING_BOTTOM}
          x2={CHART_WIDTH}
          y2={CHART_HEIGHT - PADDING_BOTTOM}
          stroke="currentColor"
          strokeWidth={0.5}
          className="text-gray-200 dark:text-gray-700"
        />

        {/* Payment bars */}
        {paymentRects.map((rect, idx) => {
          const principalY = CHART_HEIGHT - PADDING_BOTTOM - rect.principalHeight;
          const interestY = principalY - rect.interestHeight;
          return (
            <g key={`payment-${idx}`}>
              <rect
                x={rect.x}
                y={principalY}
                width={rect.width}
                height={rect.principalHeight}
                rx={3}
                fill="#34d399"
                opacity={0.82}
              />
              <rect
                x={rect.x}
                y={interestY}
                width={rect.width}
                height={rect.interestHeight}
                rx={3}
                fill="#fbbf24"
                opacity={0.82}
              />
            </g>
          );
        })}

        {/* Balance line */}
        {balancePath ? (
          <>
            <path
              d={`${balancePath} L ${CHART_WIDTH} ${CHART_HEIGHT - PADDING_BOTTOM} L 0 ${
                CHART_HEIGHT - PADDING_BOTTOM
              } Z`}
              fill="url(#amortization-balance)"
              stroke="none"
            />
            <path
              d={balancePath}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        ) : null}
      </svg>
    </div>
  );
}

export default AmortizationChart;
