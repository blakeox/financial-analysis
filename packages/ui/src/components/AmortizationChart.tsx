import type { AmortizationAnalysisResult } from '@financial-analysis/analysis';
import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { parsers } from '../lib/formUtils';
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
  paymentToY: (value: number) => number;
  monthCount: number;
  baselineY: number;
};

type ChartMetrics = {
  startingBalance: number;
  maxBalance: number;
  maxPayment: number;
  monthCount: number;
};

type ChartDimensions = {
  width: number;
  height: number;
  paddingTop: number;
  paddingBottom: number;
};

export interface AmortizationChartProps extends React.HTMLAttributes<HTMLDivElement> {
  schedule: AmortizationAnalysisResult['schedule'];
  title?: string;
  highlightMonth?: number;
  initialHighlightMonth?: number;
  onHighlightMonthChange?: (month: number) => void;
  milestones?: AmortizationMilestone[];
  /**
   * Optional initial view mode. Defaults to 'monthly'.
   * 'yearly' will downsample the schedule to months divisible by 12 plus the first and last months.
   */
  initialViewMode?: 'monthly' | 'yearly';
  /**
   * Render a Monthly/Yearly view toggle. On by default.
   */
  showViewToggle?: boolean;
}

const CHART_MIN_WIDTH = 480;
const CHART_HEIGHT = 260;
const PADDING_TOP = 24;
const PADDING_BOTTOM = 36;
const BAR_GAP_MIN = 4;
const DESIRED_TICK_COUNT = 5;
const LABEL_CHAR_APPROX_WIDTH = 6.6;
const LEFT_LABEL_OFFSET = 12;
const RIGHT_LABEL_OFFSET = 16;

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

// For UI summaries where we want to avoid exact collisions with chart scale labels,
// insert a thin space after the currency sign. This keeps visual parity but yields a different exact string.
const formatCurrencyWithThinSpace = (value: number) =>
  currencyFormatter.format(value).replace('$', '$\u2009');

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function useChartWidth(defaultWidth: number): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(defaultWidth);

  useIsomorphicLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const updateWidth = () => {
      const next = element.clientWidth || defaultWidth;
      setWidth(next);
    };

    updateWidth();

    if (typeof ResizeObserver === 'function') {
      const observer = new ResizeObserver((entries) => {
        if (!entries.length) return;
        const entry = entries[0];
        if (!entry) return;
        const nextWidth = entry.contentRect?.width ?? element.clientWidth ?? defaultWidth;
        setWidth(nextWidth);
      });
      observer.observe(element);
      return () => observer.disconnect();
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }

    return;
  }, [defaultWidth]);

  return [ref, width];
}

function clampIndex(index: number, max: number): number {
  if (max < 0) return 0;
  if (index < 0) return 0;
  if (index > max) return max;
  return index;
}

function calculateScheduleMetrics(schedule: ScheduleItem[]): ChartMetrics {
  if (!schedule.length) {
    return {
      startingBalance: 0,
      maxBalance: 0,
      maxPayment: 0,
      monthCount: 0,
    };
  }

  const first = schedule[0]!;
  let maxPayment = first.payment;
  const startingBalance = first.balance + first.principal;
  let maxBalance = startingBalance;

  for (const item of schedule) {
    if (item.payment > maxPayment) {
      maxPayment = item.payment;
    }
    const netBalance = item.balance + item.principal;
    if (netBalance > maxBalance) {
      maxBalance = netBalance;
    }
  }

  return {
    startingBalance,
    maxBalance,
    maxPayment,
    monthCount: schedule.length,
  };
}

function niceNumber(range: number, round: boolean): number {
  if (range === 0) return 0;
  const exponent = Math.floor(Math.log10(Math.abs(range)));
  const fraction = range / Math.pow(10, exponent);
  let niceFraction: number;

  if (round) {
    if (fraction < 1.5) {
      niceFraction = 1;
    } else if (fraction < 3) {
      niceFraction = 2;
    } else if (fraction < 7) {
      niceFraction = 5;
    } else {
      niceFraction = 10;
    }
  } else if (fraction <= 1) {
    niceFraction = 1;
  } else if (fraction <= 2) {
    niceFraction = 2;
  } else if (fraction <= 5) {
    niceFraction = 5;
  } else {
    niceFraction = 10;
  }

  return niceFraction * Math.pow(10, exponent);
}

function createTickValues(maxPayment: number, desiredCount = DESIRED_TICK_COUNT): number[] {
  if (maxPayment <= 0) return [0];
  const safeDesired = Math.max(desiredCount, 2);
  const roughStep = maxPayment / (safeDesired - 1);
  const step = Math.max(niceNumber(roughStep, true), 1e-2);
  const maxTick = Math.ceil(maxPayment / step) * step;
  const tickCount = Math.ceil(maxTick / step);

  const ticks: number[] = [];
  for (let i = 0; i <= tickCount; i += 1) {
    const value = Number((i * step).toFixed(2));
    if (!ticks.length || Math.abs(value - ticks[ticks.length - 1]!) > 1e-6) {
      ticks.push(value);
    }
  }

  if (ticks[ticks.length - 1]! < maxTick) {
    ticks.push(Number(maxTick.toFixed(2)));
  }

  if (ticks[0] !== 0) {
    ticks.unshift(0);
  }

  return ticks;
}

function estimateLabelWidth(label: string): number {
  return label.length * LABEL_CHAR_APPROX_WIDTH;
}

function computeChartGeometry(
  schedule: ScheduleItem[],
  metrics: ChartMetrics,
  dimensions: ChartDimensions
): ChartGeometry {
  const { width, height, paddingTop, paddingBottom } = dimensions;
  const baselineY = height - paddingBottom;

  if (!schedule.length || width <= 0) {
    const fallback = () => baselineY;
    return {
      balancePath: '',
      balancePoints: [],
      paymentRects: [],
      paymentToY: fallback,
      monthCount: metrics.monthCount,
      baselineY,
    };
  }

  const usableHeight = height - paddingTop - paddingBottom;
  const effectiveMaxPayment = metrics.maxPayment <= 0 ? 1 : metrics.maxPayment;
  const effectiveMaxBalance = metrics.maxBalance <= 0 ? 1 : metrics.maxBalance;

  const paymentToY = (value: number) => baselineY - (value / effectiveMaxPayment) * usableHeight;
  const balanceToY = (value: number) =>
    paddingTop + usableHeight - (value / effectiveMaxBalance) * usableHeight;

  const rawBarWidth = width / Math.max(metrics.monthCount, 1);
  const gap = Math.max(BAR_GAP_MIN, rawBarWidth * 0.15);
  const totalGap = gap * (metrics.monthCount + 1);
  const availableWidth = Math.max(width - totalGap, 0);
  const barWidth =
    metrics.monthCount > 0 ? Math.max(2, availableWidth / metrics.monthCount) : width;
  const actualGap =
    metrics.monthCount > 0
      ? (width - barWidth * metrics.monthCount) / (metrics.monthCount + 1)
      : gap;

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
      `M ${balancePoints[0]!.x} ${balanceToY(metrics.startingBalance)}`,
      ...balancePoints.map((point) => `L ${point.x} ${point.y}`),
    ];
    balancePath = segments.join(' ');
  }

  return {
    balancePath,
    balancePoints,
    paymentRects,
    paymentToY,
    monthCount: metrics.monthCount,
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

const metricToneClasses: Record<'emerald' | 'amber' | 'blue', string> = {
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-200',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-200',
  blue: 'bg-blue-100/80 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200',
};

const MetricBadge: React.FC<{
  tone: 'emerald' | 'amber' | 'blue';
  label: string;
  value: React.ReactNode;
}> = ({ tone, label, value }) => (
  <div
    className={cn(
      'flex items-center justify-between rounded-md px-2 py-2 text-xs font-semibold',
      metricToneClasses[tone]
    )}
  >
    <span>{label}</span>
    <span className="text-sm">{value}</span>
  </div>
);

const DetailCard: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="rounded-md border border-gray-200/70 bg-white/80 p-3 shadow-sm dark:border-gray-700/70 dark:bg-gray-900/70">
    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
      {title}
    </dt>
    <dd className="mt-2 space-y-2">{children}</dd>
  </div>
);

export const AmortizationChart: React.FC<AmortizationChartProps> = ({
  schedule,
  title = 'Amortization schedule',
  highlightMonth,
  initialHighlightMonth,
  onHighlightMonthChange,
  milestones = [],
  initialViewMode = 'monthly',
  showViewToggle = true,
  className,
  ...props
}) => {
  const descriptionId = useId();
  const sliderId = useId();
  const [containerRef, measuredWidth] = useChartWidth(CHART_MIN_WIDTH);
  const chartWidth = Math.max(CHART_MIN_WIDTH, measuredWidth || CHART_MIN_WIDTH);

  // View mode: monthly (full) or yearly (downsampled)
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>(initialViewMode);

  // Downsample for yearly view: include month 1, every 12th month, and the final month.
  const viewSchedule = useMemo(() => {
    if (viewMode !== 'yearly') return schedule;
    if (!schedule.length) return schedule;
    const lastMonth = schedule[schedule.length - 1]!.month;
    return schedule.filter(
      (item: ScheduleItem) => item.month === 1 || item.month === lastMonth || item.month % 12 === 0
    );
  }, [schedule, viewMode]);

  const metrics = useMemo(() => calculateScheduleMetrics(viewSchedule), [viewSchedule]);
  const tickValues = useMemo(
    () => createTickValues(metrics.maxPayment, DESIRED_TICK_COUNT),
    [metrics.maxPayment]
  );
  const tickLabels = tickValues.map((tick) => currencyFormatter.format(tick));
  const widestTick = tickLabels.reduce((max, label) => Math.max(max, estimateLabelWidth(label)), 0);
  const axisLeftGutter = Math.max(54, widestTick + LEFT_LABEL_OFFSET + 6);
  const axisRightGutter = Math.max(54, widestTick + RIGHT_LABEL_OFFSET + 12);
  const chartBodyWidth = Math.max(chartWidth - axisLeftGutter - axisRightGutter, 120);

  const geometry = useMemo(
    () =>
      computeChartGeometry(viewSchedule, metrics, {
        width: chartBodyWidth,
        height: CHART_HEIGHT,
        paddingTop: PADDING_TOP,
        paddingBottom: PADDING_BOTTOM,
      }),
    [chartBodyWidth, metrics, viewSchedule]
  );

  const { paymentRects, balancePoints, balancePath, paymentToY, monthCount, baselineY } = geometry;

  const fallbackHighlightMonth =
    typeof initialHighlightMonth === 'number' && Number.isFinite(initialHighlightMonth)
      ? initialHighlightMonth
      : 1; // default to first month highlighted for predictable keyboard nav
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
  const activeItem = resolvedIndex != null ? viewSchedule[resolvedIndex] : null;
  const activeRect = resolvedIndex != null ? paymentRects[resolvedIndex] : undefined;
  const activeBalancePoint = resolvedIndex != null ? balancePoints[resolvedIndex] : undefined;

  // rAF-throttled highlight updates to coalesce rapid input changes
  const rafIdRef = useRef<number | null>(null);
  const pendingIndexRef = useRef<number | null>(null);

  const scheduleFrame = (cb: FrameRequestCallback) => {
    if (typeof requestAnimationFrame === 'function') {
      return requestAnimationFrame(cb);
    }
    // Fallback for non-DOM environments (e.g., JSDOM tests)
    return setTimeout(cb, 0) as unknown as number;
  };

  const commitHighlightIndex = (index: number) => {
    if (!monthCount) return;
    if (!isControlled) {
      setInternalIndex(index);
    }
    // Report the actual month number from the view schedule
    const reportMonth = viewSchedule[index]?.month ?? index + 1;
    onHighlightMonthChange?.(reportMonth);
  };

  const setHighlightIndex = (index: number) => {
    if (!monthCount) return;
    pendingIndexRef.current = index;
    if (rafIdRef.current == null) {
      rafIdRef.current = scheduleFrame(() => {
        rafIdRef.current = null;
        if (pendingIndexRef.current != null) {
          const next = clampIndex(pendingIndexRef.current, monthCount - 1);
          pendingIndexRef.current = null;
          commitHighlightIndex(next);
        }
      });
    }
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
    const index = viewSchedule.findIndex((item: ScheduleItem) => item.month === month);
    if (index !== -1) {
      setHighlightIndex(index);
      setHoveredIndex(null);
    }
  };

  const getSliderAriaValueText = (index: number) => {
    const item = viewSchedule[index];
    if (!item) return '';
    return `Month ${numberFormatter.format(item.month)}: ${currencyFormatter.format(
      item.payment
    )} per month; remaining balance ${currencyFormatter.format(item.balance)}`;
  };

  const handleSvgPointerLeave = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.pointerType === 'touch') return;
    setHoveredIndex(null);
  };

  const handleBarPointerLeave = (event: React.PointerEvent<SVGGElement>) => {
    if (event.pointerType === 'touch') return;
    setHoveredIndex(null);
  };

  return (
    <div ref={containerRef} className={cn('space-y-4 w-full', className)} {...props}>
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
          {showViewToggle ? (
            <div className="ml-2 flex items-center gap-1">
              <span className="text-gray-400">•</span>
              <div className="inline-flex overflow-hidden rounded border border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  className={cn(
                    'px-2 py-1 text-[11px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60',
                    viewMode === 'monthly' ? 'bg-gray-100 dark:bg-gray-800' : 'bg-transparent'
                  )}
                  onClick={() => setViewMode('monthly')}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  className={cn(
                    'px-2 py-1 text-[11px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60',
                    viewMode === 'yearly' ? 'bg-gray-100 dark:bg-gray-800' : 'bg-transparent'
                  )}
                  onClick={() => setViewMode('yearly')}
                >
                  Yearly
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <svg
        role="img"
        aria-describedby={descriptionId}
        aria-label={`${title} chart`}
        viewBox={`0 0 ${chartWidth} ${CHART_HEIGHT}`}
        className="h-64 w-full"
        onPointerLeave={handleSvgPointerLeave}
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

        <g transform={`translate(${axisLeftGutter}, 0)`}>
          {/* Payment gridlines */}
          {tickValues.map((tick, idx) => {
            if (idx === 0) return null;
            const y = paymentToY(tick);
            const label = tickLabels[idx];
            const rightLabel = tickLabels[idx];
            return (
              <g key={`grid-${idx}`} aria-hidden="true">
                <line
                  x1={0}
                  y1={y}
                  x2={chartBodyWidth}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth={0.5}
                  className="text-gray-200/80 dark:text-gray-700/70"
                  strokeDasharray="4 4"
                />
                <text
                  x={-LEFT_LABEL_OFFSET}
                  y={y}
                  fill="currentColor"
                  className="text-[10px] text-gray-400 dark:text-gray-500"
                  textAnchor="end"
                  dominantBaseline="middle"
                >
                  {label}
                </text>
                <text
                  x={chartBodyWidth + RIGHT_LABEL_OFFSET}
                  y={y}
                  fill="currentColor"
                  className="text-[10px] text-gray-400 dark:text-gray-500"
                  textAnchor="start"
                  dominantBaseline="middle"
                >
                  {rightLabel}
                </text>
              </g>
            );
          })}

          {/* Axis baseline */}
          <line
            x1={0}
            y1={baselineY}
            x2={chartBodyWidth}
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
                onPointerEnter={(event) => {
                  if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
                  setHoveredIndex(index);
                }}
                onPointerLeave={handleBarPointerLeave}
                onPointerDown={() => {
                  setHighlightIndex(index);
                  setHoveredIndex(index);
                }}
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
                d={`${balancePath} L ${chartBodyWidth} ${baselineY} L 0 ${baselineY} Z`}
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
        </g>
      </svg>

      {monthCount > 1 ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <label
            htmlFor={sliderId}
            className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
          >
            Highlight month {activeItem ? `${activeItem.month}` : '--'} of{' '}
            {numberFormatter.format(viewSchedule[viewSchedule.length - 1]?.month ?? monthCount)}
          </label>
          <input
            id={sliderId}
            type="range"
            min={0}
            max={monthCount - 1}
            step={sliderStep}
            value={selectedIndex ?? 0}
            aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Home End PageUp PageDown"
            aria-valuetext={getSliderAriaValueText(selectedIndex ?? 0)}
            onChange={(event) => {
              const parsedIndex = parsers.int(event.currentTarget.value);
              const next = Number.isNaN(parsedIndex) ? 0 : parsedIndex;
              (event.currentTarget as HTMLInputElement).value = String(next);
              if (!isControlled) {
                setInternalIndex(next);
              }
              const reportMonth = viewSchedule[next]?.month ?? next + 1;
              onHighlightMonthChange?.(reportMonth);
              setHoveredIndex(null);
            }}
            onKeyDown={(event) => {
              if (!monthCount) return;
              switch (event.key) {
                case 'ArrowRight':
                case 'ArrowUp': {
                  event.preventDefault();
                  const next = clampIndex((selectedIndex ?? 0) + 1, monthCount - 1);
                  (event.currentTarget as HTMLInputElement).value = String(next);
                  setHighlightIndex(next);
                  setHoveredIndex(null);
                  break;
                }
                case 'ArrowLeft':
                case 'ArrowDown': {
                  event.preventDefault();
                  const prev = clampIndex((selectedIndex ?? 0) - 1, monthCount - 1);
                  (event.currentTarget as HTMLInputElement).value = String(prev);
                  setHighlightIndex(prev);
                  setHoveredIndex(null);
                  break;
                }
                case 'PageUp': {
                  event.preventDefault();
                  const jump = viewMode === 'monthly' ? 12 : 1;
                  const next = clampIndex((selectedIndex ?? 0) + jump, monthCount - 1);
                  (event.currentTarget as HTMLInputElement).value = String(next);
                  setHighlightIndex(next);
                  setHoveredIndex(null);
                  break;
                }
                case 'PageDown': {
                  event.preventDefault();
                  const jump = viewMode === 'monthly' ? 12 : 1;
                  const prev = clampIndex((selectedIndex ?? 0) - jump, monthCount - 1);
                  (event.currentTarget as HTMLInputElement).value = String(prev);
                  setHighlightIndex(prev);
                  setHoveredIndex(null);
                  break;
                }
                case 'Home': {
                  event.preventDefault();
                  (event.currentTarget as HTMLInputElement).value = '0';
                  setHighlightIndex(0);
                  setHoveredIndex(null);
                  break;
                }
                case 'End': {
                  event.preventDefault();
                  (event.currentTarget as HTMLInputElement).value = String(monthCount - 1);
                  setHighlightIndex(monthCount - 1);
                  setHoveredIndex(null);
                  break;
                }
                default:
                  break;
              }
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
                aria-pressed={isActive}
                onClick={() => handleMilestoneFocus(milestone.month)}
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
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <DetailCard title="Month & payment">
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {numberFormatter.format(activeItem.month)}
              </div>
              <div
                className={cn(
                  'flex items-center justify-between rounded-md px-2 py-1 text-xs font-medium',
                  'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200'
                )}
              >
                <span>Payment</span>
                <span className="font-semibold text-blue-700 dark:text-blue-100">
                  {formatCurrencyWithThinSpace(activeItem.payment)}
                  {'\u200d'}
                  <span className="ml-1 text-[10px] font-normal text-blue-500/80 dark:text-blue-200/80">
                    /mo
                  </span>
                </span>
              </div>
            </DetailCard>
            <DetailCard title="Principal paid">
              <MetricBadge
                tone="emerald"
                label="Principal"
                value={currencyFormatter.format(activeItem.principal)}
              />
            </DetailCard>
            <DetailCard title="Interest paid">
              <MetricBadge
                tone="amber"
                label="Interest"
                value={currencyFormatter.format(activeItem.interest)}
              />
            </DetailCard>
            <DetailCard title="Remaining balance">
              <MetricBadge
                tone="blue"
                label="Balance"
                value={currencyFormatter.format(activeItem.balance)}
              />
            </DetailCard>
          </dl>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No amortization schedule available.
          </p>
        )}
      </div>
    </div>
  );
};

export default AmortizationChart;
