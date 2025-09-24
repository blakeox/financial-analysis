import React, { useEffect, useId, useMemo, useState } from 'react';
import type { AmortizationAnalysisResult } from '@financial-analysis/analysis';
import { cn } from '../lib/utils';

type ScheduleItem = AmortizationAnalysisResult['schedule'][number];

type PaymentRect = {
  x: number;
  width: number;
  principalHeight: number;
  interestHeight: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  month: number;
};

type BalancePoint = {
  x: number;
  y: number;
  balance: number;
};

type AmortizationMilestone = {
  id: 'highest-interest-share' | 'principal-takeover' | 'halfway-balance' | 'final-payment';
  month: number;
  label: string;
  description: string;
};

type ChartGeometry = {
  balancePath: string;
  balancePoints: BalancePoint[];
  paymentRects: PaymentRect[];
  maxPayment: number;
  paymentToY: (value: number) => number;
  monthCount: number;
  baselineY: number;
};

export interface AmortizationChartProps extends React.HTMLAttributes<HTMLDivElement> {
  schedule: AmortizationAnalysisResult['schedule'];
  title?: string;
  highlightMonth?: number;
  initialHighlightMonth?: number;
  onHighlightMonthChange?: (month: number) => void;
  milestones?: AmortizationMilestone[];
}

const CHART_HEIGHT = 260;
const CHART_WIDTH = 720;
const PADDING_TOP = 24;
const PADDING_BOTTOM = 36;
const BAR_GAP_MIN = 4;
const GRID_LINE_COUNT = 4;

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

function clampIndex(index: number, max: number): number {
  if (max < 0) return 0;
  if (index < 0) return 0;
  if (index > max) return max;
  return index;
}

function createTickValues(maxPayment: number): number[] {
  if (maxPayment <= 0) return [];
  const step = maxPayment / GRID_LINE_COUNT;
  return Array.from({ length: GRID_LINE_COUNT + 1 }, (_, idx) =>
    idx === GRID_LINE_COUNT ? maxPayment : step * idx
  );
}

function computeChartGeometry(schedule: ScheduleItem[]): ChartGeometry {
  const baselineY = CHART_HEIGHT - PADDING_BOTTOM;

  if (!schedule.length) {
    const fallback = () => baselineY;
    return {
      balancePath: '',
      balancePoints: [],
      paymentRects: [],
      maxPayment: 0,
      paymentToY: fallback,
      monthCount: 0,
      baselineY,
    };
  }

  const monthCount = schedule.length;
  const first = schedule[0]!;
  const startingBalance = first.balance + first.principal;
  const maxBalance = schedule.reduce(
    (max, payment) => Math.max(max, payment.balance + payment.principal),
    startingBalance
  );
  const maxPayment = schedule.reduce((max, item) => Math.max(max, item.payment), first.payment);

  const usableHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const effectiveMaxPayment = maxPayment <= 0 ? 1 : maxPayment;
  const effectiveMaxBalance = maxBalance <= 0 ? 1 : maxBalance;

  const paymentToY = (value: number) =>
    CHART_HEIGHT -
    PADDING_BOTTOM -
    (value / effectiveMaxPayment) * usableHeight;
  const balanceToY = (value: number) =>
    PADDING_TOP + usableHeight - (value / effectiveMaxBalance) * usableHeight;

  // Derive bar width with simple responsive spacing
  const rawBarWidth = CHART_WIDTH / Math.max(monthCount, 1);
  const gap = Math.max(BAR_GAP_MIN, rawBarWidth * 0.15);
  const totalGap = gap * (monthCount + 1);
  const availableWidth = Math.max(CHART_WIDTH - totalGap, 0);
  const barWidth = Math.max(2, availableWidth / monthCount);
  const actualGap = monthCount > 0 ? (CHART_WIDTH - barWidth * monthCount) / (monthCount + 1) : gap;

  let cursorX = actualGap;
  const paymentRects = schedule.map((item) => {
    const principalHeight = (item.principal / effectiveMaxPayment) * usableHeight;
    const interestHeight = (item.interest / effectiveMaxPayment) * usableHeight;

    const rect: PaymentRect = {
      x: cursorX,
      width: barWidth,
      principalHeight,
      interestHeight,
      payment: item.payment,
      principal: item.principal,
      interest: item.interest,
      balance: item.balance,
      month: item.month,
    };

    cursorX += barWidth + actualGap;
    return rect;
  });

  const balancePoints: BalancePoint[] = paymentRects.map((rect, index) => ({
    x: rect.x + rect.width / 2,
    y: balanceToY(schedule[index]!.balance),
    balance: schedule[index]!.balance,
  }));

  let balancePath = '';
  if (balancePoints.length) {
    const segments = [
      `M ${balancePoints[0]!.x} ${balanceToY(startingBalance)}`,
      ...balancePoints.map((point) => `L ${point.x} ${point.y}`),
    ];
    balancePath = segments.join(' ');
  }

  return {
    balancePath,
    balancePoints,
    paymentRects,
    maxPayment,
    paymentToY,
    monthCount,
    baselineY,
  };
}

const milestoneLabel = (milestone: AmortizationMilestone) => {
  switch (milestone.id) {
    case 'highest-interest-share':
      return 'Interest peak';
    case 'principal-takeover':
      return 'Principal overtakes';
    case 'halfway-balance':
      return 'Half repaid';
    case 'final-payment':
      return 'Loan payoff';
    default:
      return milestone.label;
  }
};

export const AmortizationChart: React.FC<AmortizationChartProps> = ({
  schedule,
  title = 'Amortization schedule',
  highlightMonth,
  initialHighlightMonth,
  onHighlightMonthChange,
  milestones = [],
  className,
  ...props
}) => {
  const descriptionId = useId();
  const sliderId = useId();

  const geometry = useMemo(() => computeChartGeometry(schedule), [schedule]);
  const {
    paymentRects,
    balancePoints,
    balancePath,
    paymentToY,
    maxPayment,
    monthCount,
    baselineY,
  } = geometry;

  const tickValues = useMemo(() => createTickValues(maxPayment), [maxPayment]);

  const lastMonthNumber = monthCount ? schedule[monthCount - 1]?.month ?? monthCount : 1;
  const fallbackHighlightMonth =
    typeof initialHighlightMonth === 'number' && Number.isFinite(initialHighlightMonth)
      ? initialHighlightMonth
      : lastMonthNumber;
  const fallbackHighlightIndex =
    monthCount > 0 ? clampIndex(Math.trunc(fallbackHighlightMonth) - 1, monthCount - 1) : 0;
  const isControlled = typeof highlightMonth === 'number' && Number.isFinite(highlightMonth);
  const controlledIndex =
    isControlled && monthCount > 0
      ? clampIndex(Math.trunc(highlightMonth as number) - 1, monthCount - 1)
      : undefined;

  const [internalIndex, setInternalIndex] = useState(fallbackHighlightIndex);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!monthCount) {
      setHoveredIndex(null);
      return;
    }
    setHoveredIndex((prev) => (prev == null ? prev : clampIndex(prev, monthCount - 1)));
  }, [monthCount]);

  useEffect(() => {
    if (!isControlled) {
      setInternalIndex(fallbackHighlightIndex);
    }
  }, [fallbackHighlightIndex, isControlled]);

  const selectedIndex =
    isControlled && typeof controlledIndex === 'number' ? controlledIndex : internalIndex;

  const resolvedIndex =
    monthCount > 0 ? clampIndex(hoveredIndex ?? selectedIndex ?? 0, monthCount - 1) : null;
  const activeItem = resolvedIndex != null ? schedule[resolvedIndex] : null;
  const activeRect = resolvedIndex != null ? paymentRects[resolvedIndex] : undefined;
  const activeBalancePoint = resolvedIndex != null ? balancePoints[resolvedIndex] : undefined;

  const setHighlightIndex = (index: number) => {
    if (!monthCount) return;
    if (!isControlled) {
      setInternalIndex(index);
    }
    onHighlightMonthChange?.(index + 1);
  };

  const handleBarKeyDown = (event: React.KeyboardEvent<SVGGElement>, index: number) => {
    if (!monthCount) return;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp': {
        event.preventDefault();
        const next = clampIndex(index + 1, monthCount - 1);
        setHighlightIndex(next);
        setHoveredIndex(null);
        break;
      }
      case 'ArrowLeft':
      case 'ArrowDown': {
        event.preventDefault();
        const prev = clampIndex(index - 1, monthCount - 1);
        setHighlightIndex(prev);
        setHoveredIndex(null);
        break;
      }
      case 'Home': {
        event.preventDefault();
        setHighlightIndex(0);
        setHoveredIndex(null);
        break;
      }
      case 'End': {
        event.preventDefault();
        setHighlightIndex(monthCount - 1);
        setHoveredIndex(null);
        break;
      }
      default:
        break;
    }
  };

  const sliderStep = monthCount > 60 ? Math.max(1, Math.round(monthCount / 120)) : 1;
  const activeMonth = activeItem?.month ?? null;

  const handleMilestoneFocus = (month: number) => {
    const index = schedule.findIndex((item) => item.month === month);
    if (index !== -1) {
      setHighlightIndex(index);
      setHoveredIndex(null);
    }
  };

  return (
    <div className={cn('space-y-4', className)} {...props}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Highlight a month to inspect the payment mix and remaining balance.
          </p>
        </div>
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
        aria-describedby={descriptionId}
        aria-label={`${title} chart`}
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="h-64 w-full"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <desc id={descriptionId}>
          {`Stacked bars show principal and interest portions across ${numberFormatter.format(
            monthCount
          )} month${monthCount === 1 ? '' : 's'}. Use the slider or focus a bar to inspect details.`}
        </desc>
        <defs>
          <linearGradient id="amortization-balance" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Payment gridlines */}
        {tickValues.map((tick, idx) => {
          if (idx === 0) return null;
          const y = paymentToY(tick);
          return (
            <g key={`grid-${idx}`} aria-hidden="true">
              <line
                x1={0}
                y1={y}
                x2={CHART_WIDTH}
                y2={y}
                stroke="currentColor"
                strokeWidth={0.5}
                className="text-gray-200/80 dark:text-gray-700/70"
                strokeDasharray="4 4"
              />
              <text
                x={0}
                y={y - 6}
                fill="currentColor"
                className="text-[10px] text-gray-400 dark:text-gray-500"
              >
                {currencyFormatter.format(tick)}
              </text>
            </g>
          );
        })}

        {/* Axis baseline */}
        <line
          x1={0}
          y1={baselineY}
          x2={CHART_WIDTH}
          y2={baselineY}
          stroke="currentColor"
          strokeWidth={0.75}
          className="text-gray-300 dark:text-gray-700"
        />

        {/* Payment bars */}
        {paymentRects.map((rect, index) => {
          const principalY = baselineY - rect.principalHeight;
          const interestY = principalY - rect.interestHeight;
          const isActive = resolvedIndex === index;

          return (
            <g
              key={`payment-${rect.month}`}
              tabIndex={0}
              role="presentation"
              aria-label={`Month ${rect.month}: payment ${currencyFormatter.format(
                rect.payment
              )}. Principal ${currencyFormatter.format(rect.principal)}, interest ${currencyFormatter.format(
                rect.interest
              )}, remaining balance ${currencyFormatter.format(rect.balance)}.`}
              onMouseEnter={() => setHoveredIndex(index)}
              onFocus={() => setHighlightIndex(index)}
              onBlur={() => setHoveredIndex(null)}
              onKeyDown={(event) => handleBarKeyDown(event, index)}
            >
              <rect
                x={rect.x}
                y={principalY}
                width={rect.width}
                height={rect.principalHeight}
                rx={3}
                fill="#34d399"
                opacity={isActive ? 0.95 : 0.55}
              />
              <rect
                x={rect.x}
                y={interestY}
                width={rect.width}
                height={rect.interestHeight}
                rx={3}
                fill="#fbbf24"
                opacity={isActive ? 0.9 : 0.45}
              />
              {isActive ? (
                <rect
                  x={rect.x - 2}
                  y={interestY - 2}
                  width={rect.width + 4}
                  height={rect.principalHeight + rect.interestHeight + 4}
                  rx={4}
                  stroke="#1d4ed8"
                  strokeWidth={1}
                  fill="none"
                />
              ) : null}
            </g>
          );
        })}

        {/* Highlight guides for focused month */}
        {activeItem && activeRect ? (
          <g aria-hidden="true">
            <line
              x1={activeRect.x + activeRect.width / 2}
              x2={activeRect.x + activeRect.width / 2}
              y1={paymentToY(activeItem.payment)}
              y2={baselineY}
              stroke="#2563eb"
              strokeDasharray="4 4"
              strokeWidth={1.25}
            />
          </g>
        ) : null}

        {/* Balance line */}
        {balancePath ? (
          <>
            <path
              d={`${balancePath} L ${CHART_WIDTH} ${baselineY} L 0 ${baselineY} Z`}
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
            {activeBalancePoint ? (
              <circle
                cx={activeBalancePoint.x}
                cy={activeBalancePoint.y}
                r={5}
                fill="#1d4ed8"
                stroke="#ffffff"
                strokeWidth={2}
              />
            ) : null}
          </>
        ) : null}
      </svg>

      {monthCount > 1 ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <label
            htmlFor={sliderId}
            className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
          >
            Highlight month {activeItem ? `${activeItem.month}` : '--'} of {monthCount}
          </label>
          <input
            id={sliderId}
            type="range"
            min={0}
            max={monthCount - 1}
            step={sliderStep}
            value={resolvedIndex ?? 0}
            onChange={(event) => {
              const next = Number(event.currentTarget.value);
              setHighlightIndex(next);
              setHoveredIndex(null);
            }}
            className="accent-blue-500"
          />
        </div>
      ) : null}

      {milestones.length ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {milestones.map((milestone) => {
            const isActive = activeMonth === milestone.month;
            return (
              <button
                key={milestone.id}
                type="button"
                className={cn(
                  'flex w-full flex-col items-start gap-1 rounded-md border border-gray-200/70 bg-white/50 p-3 text-left text-xs shadow-sm transition-colors hover:border-blue-400 hover:bg-blue-50/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 dark:border-gray-700/60 dark:bg-gray-900/50 dark:hover:border-blue-500/70 dark:hover:bg-blue-500/10',
                  isActive &&
                    'border-blue-500 bg-blue-500/10 text-blue-700 dark:border-blue-400 dark:bg-blue-400/10 dark:text-blue-200'
                )}
                onFocus={() => handleMilestoneFocus(milestone.month)}
                onMouseEnter={() => handleMilestoneFocus(milestone.month)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <span className="font-semibold uppercase tracking-wide">
                  {milestoneLabel(milestone)}
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  Month {numberFormatter.format(milestone.month)}
                </span>
                <span className="text-[11px] text-gray-600 dark:text-gray-300">
                  {milestone.description}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="rounded-lg border border-gray-200 bg-white/70 p-4 shadow-sm dark:border-gray-700/60 dark:bg-gray-900/40">
        {activeItem ? (
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div className="space-y-1">
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Month
              </dt>
              <dd className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {numberFormatter.format(activeItem.month)}
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Payment
              </dt>
              <dd className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {currencyFormatter.format(activeItem.payment)}
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Principal vs. interest
              </dt>
              <dd className="text-base font-semibold text-emerald-600 dark:text-emerald-400">
                {currencyFormatter.format(activeItem.principal)}
                <span className="text-xs text-gray-500 dark:text-gray-400"> principal</span>
                <span className="mx-1 text-gray-400">•</span>
                <span className="text-amber-500 dark:text-amber-400">
                  {currencyFormatter.format(activeItem.interest)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400"> interest</span>
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Remaining balance
              </dt>
              <dd className="text-base font-semibold text-blue-600 dark:text-blue-400">
                {currencyFormatter.format(activeItem.balance)}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">No amortization schedule available.</p>
        )}
      </div>
    </div>
  );
};

export default AmortizationChart;
