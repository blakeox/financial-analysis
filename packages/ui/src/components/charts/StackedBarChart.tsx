import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { chartColorFallbacks, chartColors, chartSeriesPalette } from '../../lib/chartColors';

export interface StackedBarChartProps {
  data: Array<{
    name: string;
    [key: string]: string | number;
  }>;
  stacks: Array<{
    dataKey: string;
    name: string;
    /** Defaults to brand series palette when omitted. */
    color?: string;
  }>;
  formatter?: (value: number) => string;
  height?: number;
  showLegend?: boolean;
  /** Accessible name for the chart (role=img). */
  ariaLabel?: string;
}

export function StackedBarChart({
  data,
  stacks,
  formatter = (value) => `$${value.toLocaleString()}`,
  height = 400,
  showLegend = true,
  ariaLabel = 'Stacked bar chart',
}: StackedBarChartProps) {
  return (
    <div role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={chartColors.grid}
            className="dark:stroke-gray-700"
          />
          <XAxis
            dataKey="name"
            tick={{ fill: chartColorFallbacks.axis }}
            className="dark:fill-gray-300"
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            tick={{ fill: chartColorFallbacks.axis }}
            className="dark:fill-gray-300"
            tickFormatter={formatter}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: `1px solid ${chartColorFallbacks.grid}`,
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              fontVariantNumeric: 'tabular-nums',
            }}
            formatter={(value) =>
              typeof value === 'number' ? formatter(value) : String(value ?? '')
            }
            labelStyle={{ fontWeight: 'bold', marginBottom: '8px' }}
          />
          {showLegend && <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="rect" />}
          {stacks.map((stack, index) => (
            <Bar
              key={stack.dataKey}
              dataKey={stack.dataKey}
              name={stack.name}
              stackId="stack"
              fill={stack.color ?? chartSeriesPalette[index % chartSeriesPalette.length]}
              radius={[0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
