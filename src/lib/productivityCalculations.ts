import { ProductivityMetric } from '@/types/types';

export function calculateProductivityRate(hoursWorked: number, unitsCompleted: number): number {
  if (hoursWorked === 0) return 0;
  return Number((unitsCompleted / hoursWorked).toFixed(4));
}

export function calculateProductivityTrend(metrics: ProductivityMetric[]): 'up' | 'down' | 'stable' {
  if (metrics.length < 2) return 'stable';
  
  const recent = metrics.slice(-7); // Last 7 days
  const previous = metrics.slice(-14, -7); // Previous 7 days
  
  if (recent.length === 0 || previous.length === 0) return 'stable';
  
  const recentAvg = recent.reduce((sum, m) => sum + m.productivity_rate, 0) / recent.length;
  const previousAvg = previous.reduce((sum, m) => sum + m.productivity_rate, 0) / previous.length;
  
  if (previousAvg === 0) return 'stable';
  
  const change = ((recentAvg - previousAvg) / previousAvg) * 100;
  
  if (change > 5) return 'up';
  if (change < -5) return 'down';
  return 'stable';
}

export function aggregateProductivityByTrade(metrics: ProductivityMetric[]): Record<string, {
  totalHours: number;
  totalUnits: number;
  avgRate: number;
  count: number;
}> {
  const byTrade: Record<string, {
    totalHours: number;
    totalUnits: number;
    avgRate: number;
    count: number;
  }> = {};
  
  metrics.forEach((metric) => {
    const trade = metric.trade || 'Unknown';
    if (!byTrade[trade]) {
      byTrade[trade] = { totalHours: 0, totalUnits: 0, avgRate: 0, count: 0 };
    }
    byTrade[trade].totalHours += metric.hours_worked;
    byTrade[trade].totalUnits += metric.units_completed;
    byTrade[trade].count += 1;
  });
  
  // Calculate average rates
  Object.keys(byTrade).forEach((trade) => {
    const data = byTrade[trade];
    data.avgRate = calculateProductivityRate(data.totalHours, data.totalUnits);
  });
  
  return byTrade;
}

export function aggregateProductivityByProject(metrics: ProductivityMetric[]): Record<string, {
  totalHours: number;
  totalUnits: number;
  avgRate: number;
  count: number;
}> {
  const byProject: Record<string, {
    totalHours: number;
    totalUnits: number;
    avgRate: number;
    count: number;
  }> = {};
  
  metrics.forEach((metric) => {
    const projectId = metric.project_id;
    if (!byProject[projectId]) {
      byProject[projectId] = { totalHours: 0, totalUnits: 0, avgRate: 0, count: 0 };
    }
    byProject[projectId].totalHours += metric.hours_worked;
    byProject[projectId].totalUnits += metric.units_completed;
    byProject[projectId].count += 1;
  });
  
  // Calculate average rates
  Object.keys(byProject).forEach((projectId) => {
    const data = byProject[projectId];
    data.avgRate = calculateProductivityRate(data.totalHours, data.totalUnits);
  });
  
  return byProject;
}

export function getWeatherImpact(metrics: ProductivityMetric[]): {
  sunny: number;
  rainy: number;
  cloudy: number;
  other: number;
} {
  const impact = { sunny: 0, rainy: 0, cloudy: 0, other: 0 };
  const counts = { sunny: 0, rainy: 0, cloudy: 0, other: 0 };
  
  metrics.forEach((metric) => {
    const weather = metric.weather_condition?.toLowerCase() || 'other';
    if (weather.includes('sun') || weather.includes('clear')) {
      impact.sunny += metric.productivity_rate;
      counts.sunny += 1;
    } else if (weather.includes('rain') || weather.includes('storm')) {
      impact.rainy += metric.productivity_rate;
      counts.rainy += 1;
    } else if (weather.includes('cloud') || weather.includes('overcast')) {
      impact.cloudy += metric.productivity_rate;
      counts.cloudy += 1;
    } else {
      impact.other += metric.productivity_rate;
      counts.other += 1;
    }
  });
  
  // Calculate averages
  return {
    sunny: counts.sunny > 0 ? impact.sunny / counts.sunny : 0,
    rainy: counts.rainy > 0 ? impact.rainy / counts.rainy : 0,
    cloudy: counts.cloudy > 0 ? impact.cloudy / counts.cloudy : 0,
    other: counts.other > 0 ? impact.other / counts.other : 0,
  };
}
