import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DataPoint {
  [key: string]: string | number | undefined;
}

interface BarChartProps {
  data: DataPoint[];
  xKey: string;
  bars: {
    key: string;
    color: string;
    name?: string;
  }[];
  height?: number;
  stacked?: boolean;
}

export function BarChart({ data, xKey, bars, height = 300, stacked = false }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
        <XAxis 
          dataKey={xKey} 
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
            fontSize: '12px',
          }}
          labelStyle={{ color: 'hsl(var(--foreground))' }}
          cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
        />
        <Legend 
          wrapperStyle={{ fontSize: '12px' }}
          iconType="rect"
        />
        {bars.map((bar) => (
          <Bar
            key={bar.key}
            dataKey={bar.key}
            fill={bar.color}
            radius={[4, 4, 0, 0]}
            name={bar.name || bar.key}
            stackId={stacked ? 'stack' : undefined}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
