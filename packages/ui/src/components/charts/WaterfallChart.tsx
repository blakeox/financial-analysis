import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export interface WaterfallDataPoint {
  name: string;
  value: number;
  total?: number;
  isTotal?: boolean;
}

export interface WaterfallChartProps {
  data: WaterfallDataPoint[];
  formatter?: (value: number) => string;
  height?: number;
  positiveColor?: string;
  negativeColor?: string;
  totalColor?: string;
}

export function WaterfallChart({
  data,
  formatter = (value) => `$${value.toLocaleString()}`,
  height = 400,
  positiveColor = '#10b981',
  negativeColor = '#ef4444',
  totalColor = '#2563eb',
}: WaterfallChartProps) {
  // Calculate running totals and stack positions for waterfall effect
  const processedData = data.map((item, index) => {
    if (index === 0 || item.isTotal) {
      // First item or total items start from 0
      return {
        ...item,
        start: 0,
        end: item.value,
        displayValue: item.value,
      };
    }
    
    // Calculate running total for intermediate items
    const previousTotal = data
      .slice(0, index)
      .reduce((sum, d) => sum + (d.isTotal ? 0 : d.value), 0);
    
    return {
      ...item,
      start: item.value < 0 ? previousTotal + item.value : previousTotal,
      end: item.value < 0 ? previousTotal : previousTotal + item.value,
      displayValue: item.value,
    };
  });

  const getBarColor = (dataPoint: WaterfallDataPoint) => {
    if (dataPoint.isTotal) return totalColor;
    return dataPoint.value >= 0 ? positiveColor : negativeColor;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
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
        {/* Invisible bar for positioning */}
        <Bar dataKey="start" stackId="stack" fill="transparent" />
        {/* Visible bar showing the change */}
        <Bar dataKey="displayValue" stackId="stack" radius={[8, 8, 8, 8]}>
          {processedData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
