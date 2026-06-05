import { AreaChart as RechartsAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DataPoint {
  [key: string]: string | number | undefined;
}

interface AreaChartProps {
  data: DataPoint[];
  xKey: string;
  areas: {
    key: string;
    color: string;
    name?: string;
  }[];
  height?: number;
  stacked?: boolean;
}

export function AreaChart({ data, xKey, areas, height = 300, stacked = false }: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <defs>
          {areas.map((area) => (
            <linearGradient key={area.key} id={`gradient-${area.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={area.color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={area.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
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
        {areas.map((area) => (
          <Area
            key={area.key}
            type="monotone"
            dataKey={area.key}
            stroke={area.color}
            strokeWidth={2}
            fill={`url(#gradient-${area.key})`}
            name={area.name || area.key}
            stackId={stacked ? 'stack' : undefined}
          />
        ))}
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}
