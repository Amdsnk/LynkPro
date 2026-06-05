import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DataPoint {
  name: string;
  value: number;
}

interface PieChartProps {
  data: DataPoint[];
  colors: string[];
  height?: number;
  innerRadius?: number;
}

export function PieChart({ data, colors, height = 300, innerRadius = 0 }: PieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          innerRadius={innerRadius}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
            fontSize: '12px',
          }}
        />
        <Legend 
          wrapperStyle={{ fontSize: '12px' }}
          iconType="circle"
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}
