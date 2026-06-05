import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DataPoint {
  [key: string]: string | number | undefined;
}

interface LineChartProps {
  data: DataPoint[];
  xKey: string;
  lines: {
    key: string;
    color: string;
    name?: string;
  }[];
  height?: number;
}

export function LineChart({ data, xKey, lines, height = 300 }: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
        />
        <Legend 
          wrapperStyle={{ fontSize: '12px' }}
          iconType="line"
        />
        {lines.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            stroke={line.color}
            strokeWidth={2}
            dot={{ fill: line.color, r: 3 }}
            activeDot={{ r: 5 }}
            name={line.name || line.key}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
