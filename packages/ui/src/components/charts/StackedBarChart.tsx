import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export interface StackedBarChartProps {
  data: Array<{
    name: string;
    [key: string]: string | number;
  }>;
  stacks: Array<{
    dataKey: string;
    name: string;
    color: string;
  }>;
  formatter?: (value: number) => string;
  height?: number;
  showLegend?: boolean;
}

export function StackedBarChart({
  data,
  stacks,
  formatter = (value) => `$${value.toLocaleString()}`,
  height = 400,
  showLegend = true,
}: StackedBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
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
          tick={{ fill: '#6b7280' }}
          className="dark:fill-gray-300"
          tickFormatter={formatter}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
          formatter={(value: number) => formatter(value)}
          labelStyle={{ fontWeight: 'bold', marginBottom: '8px' }}
        />
        {showLegend && (
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="rect"
          />
        )}
        {stacks.map((stack) => (
          <Bar
            key={stack.dataKey}
            dataKey={stack.dataKey}
            name={stack.name}
            stackId="stack"
            fill={stack.color}
            radius={[0, 0, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
