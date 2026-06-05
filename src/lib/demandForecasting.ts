import { MaterialConsumption, MaterialForecast } from '@/types/types';
import { addDays, differenceInDays, parseISO } from 'date-fns';

/**
 * Calculate material demand forecast based on historical consumption
 */
export function calculateMaterialForecast(
  consumption: MaterialConsumption[],
  forecastDays: number = 30
): number {
  if (consumption.length === 0) return 0;

  // Calculate average daily consumption
  const totalQuantity = consumption.reduce((sum, c) => sum + c.quantity_used, 0);
  const avgDailyConsumption = totalQuantity / consumption.length;

  // Apply seasonal adjustment (simple moving average)
  const recentConsumption = consumption.slice(-7); // Last 7 records
  const recentAvg = recentConsumption.length > 0
    ? recentConsumption.reduce((sum, c) => sum + c.quantity_used, 0) / recentConsumption.length
    : avgDailyConsumption;

  // Weight recent data more heavily (70% recent, 30% historical)
  const weightedAvg = (recentAvg * 0.7) + (avgDailyConsumption * 0.3);

  // Forecast for specified days
  return weightedAvg * forecastDays;
}

/**
 * Calculate confidence level for forecast (0-1)
 */
export function calculateForecastConfidence(consumption: MaterialConsumption[]): number {
  if (consumption.length === 0) return 0;
  if (consumption.length < 3) return 0.3;

  // More data points = higher confidence
  const dataPointsFactor = Math.min(consumption.length / 30, 1); // Max at 30 data points

  // Calculate variance (lower variance = higher confidence)
  const quantities = consumption.map(c => c.quantity_used);
  const avg = quantities.reduce((sum, q) => sum + q, 0) / quantities.length;
  const variance = quantities.reduce((sum, q) => sum + Math.pow(q - avg, 2), 0) / quantities.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = avg > 0 ? stdDev / avg : 1;
  const varianceFactor = Math.max(0, 1 - coefficientOfVariation);

  // Combine factors
  return (dataPointsFactor * 0.6) + (varianceFactor * 0.4);
}

/**
 * Calculate reorder point based on lead time and consumption rate
 */
export function calculateReorderPoint(
  avgDailyConsumption: number,
  leadTimeDays: number,
  safetyStockDays: number = 7
): number {
  // Reorder point = (Average daily usage × Lead time) + Safety stock
  return avgDailyConsumption * (leadTimeDays + safetyStockDays);
}

/**
 * Identify materials that need reordering
 */
export function identifyReorderNeeds(
  currentStock: number,
  reorderPoint: number,
  materialName: string
): { needsReorder: boolean; urgency: 'critical' | 'high' | 'medium' | 'low' } {
  const stockRatio = currentStock / reorderPoint;

  if (stockRatio <= 0.25) {
    return { needsReorder: true, urgency: 'critical' };
  } else if (stockRatio <= 0.5) {
    return { needsReorder: true, urgency: 'high' };
  } else if (stockRatio <= 0.75) {
    return { needsReorder: true, urgency: 'medium' };
  } else if (stockRatio <= 1) {
    return { needsReorder: true, urgency: 'low' };
  }

  return { needsReorder: false, urgency: 'low' };
}

/**
 * Calculate average consumption by project phase
 */
export function calculatePhaseConsumption(
  consumption: MaterialConsumption[],
  phase: string
): number {
  const phaseConsumption = consumption.filter(c => c.project_phase === phase);
  if (phaseConsumption.length === 0) return 0;

  const total = phaseConsumption.reduce((sum, c) => sum + c.quantity_used, 0);
  return total / phaseConsumption.length;
}

/**
 * Calculate waste factor based on historical data
 */
export function calculateWasteFactor(
  orderedQuantity: number,
  usedQuantity: number
): number {
  if (orderedQuantity === 0) return 0;
  const waste = orderedQuantity - usedQuantity;
  return (waste / orderedQuantity) * 100;
}

/**
 * Generate forecast for multiple materials
 */
export function generateBulkForecast(
  consumptionByMaterial: Map<string, MaterialConsumption[]>,
  projectId: string,
  firmId: string,
  forecastDays: number = 30
): MaterialForecast[] {
  const forecasts: MaterialForecast[] = [];
  const forecastDate = addDays(new Date(), forecastDays).toISOString().split('T')[0];

  consumptionByMaterial.forEach((consumption, materialId) => {
    const predictedQuantity = calculateMaterialForecast(consumption, forecastDays);
    const confidenceLevel = calculateForecastConfidence(consumption);

    // Calculate average daily consumption for reorder point
    const totalQuantity = consumption.reduce((sum, c) => sum + c.quantity_used, 0);
    const avgDailyConsumption = consumption.length > 0 ? totalQuantity / consumption.length : 0;

    forecasts.push({
      id: crypto.randomUUID(),
      firm_id: firmId,
      project_id: projectId,
      material_id: materialId,
      forecast_date: forecastDate,
      predicted_quantity: Math.round(predictedQuantity * 100) / 100,
      confidence_level: Math.round(confidenceLevel * 100) / 100,
      lead_time_days: 7, // Default, should be updated based on vendor data
      reorder_point: calculateReorderPoint(avgDailyConsumption, 7, 7),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });

  return forecasts;
}

/**
 * Analyze consumption trends
 */
export function analyzeConsumptionTrend(
  consumption: MaterialConsumption[]
): 'increasing' | 'decreasing' | 'stable' {
  if (consumption.length < 2) return 'stable';

  // Sort by date
  const sorted = [...consumption].sort((a, b) => 
    new Date(a.date_used).getTime() - new Date(b.date_used).getTime()
  );

  // Compare first half vs second half
  const midpoint = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, midpoint);
  const secondHalf = sorted.slice(midpoint);

  const firstAvg = firstHalf.reduce((sum, c) => sum + c.quantity_used, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, c) => sum + c.quantity_used, 0) / secondHalf.length;

  const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;

  if (changePercent > 10) return 'increasing';
  if (changePercent < -10) return 'decreasing';
  return 'stable';
}
