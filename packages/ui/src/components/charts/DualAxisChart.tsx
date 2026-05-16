import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export interface DualAxisChartProps {
  data: Array<{
    name: string;
    value1: number;
    value2: number;
    [key: string]: string | number;
  }>;
  value1Label: string;
  value2Label: string;
  value1Color?: string;
  value2Color?: string;
  value1Formatter?: (value: number) => string;
  value2Formatter?: (value: number) => string;
  height?: number;
}

export function DualAxisChart({
  data,
  value1Label,
  value2Label,
  value1Color = '#2563eb',
  value2Color = '#7c3aed',
  value1Formatter = (value) => `$${value.toLocaleString()}`,
  value2Formatter = (value) => `${value.toFixed(1)}%`,
  height = 400,
}: DualAxisChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
        <XAxis
          dataKey="name"
          tick={{ fill: '#6b7280' }}
          className="dark:fill-gray-300"
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis
          yAxisId="left"
          tick={{ fill: '#6b7280' }}
          className="dark:fill-gray-300"
          tickFormatter={value1Formatter}
          label={{ value: value1Label, angle: -90, position: 'insideLeft', fill: '#6b7280' }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fill: '#6b7280' }}
          className="dark:fill-gray-300"
          tickFormatter={value2Formatter}
          label={{ value: value2Label, angle: 90, position: 'insideRight', fill: '#6b7280' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
          formatter={(value, name) => {
            if (typeof value !== 'number') return value;
            if (name === value1Label) return value1Formatter(value);
            if (name === value2Label) return value2Formatter(value);
            return value;
          }}
        />
        <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="rect" />
        <Bar
          yAxisId="left"
          dataKey="value1"
          name={value1Label}
          fill={value1Color}
          radius={[8, 8, 0, 0]}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="value2"
          name={value2Label}
          stroke={value2Color}
          strokeWidth={3}
          dot={{ r: 4, fill: value2Color }}
          activeDot={{ r: 6 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
