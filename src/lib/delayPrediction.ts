import { DelayPrediction, DelayRootCause, Project } from '@/types/types';
import { addDays, differenceInDays, parseISO } from 'date-fns';

/**
 * Predict project delays using historical data and current progress
 * This is a simplified statistical model - in production, use ML model
 */
export function predictProjectDelay(
  project: Project,
  historicalData: {
    weatherDelays: number;
    materialDelays: number;
    workforceIssues: number;
    equipmentDowntime: number;
  }
): DelayPrediction {
  const today = new Date();
  // Use project.end_date if available, otherwise estimate 90 days
  const endDate = project.end_date ? parseISO(project.end_date) : addDays(today, 90);
  const daysRemaining = differenceInDays(endDate, today);
  
  // Calculate delay factors
  const weatherImpact = calculateWeatherImpact(historicalData.weatherDelays, daysRemaining);
  const materialImpact = calculateMaterialImpact(historicalData.materialDelays);
  const workforceImpact = calculateWorkforceImpact(historicalData.workforceIssues);
  const equipmentImpact = calculateEquipmentImpact(historicalData.equipmentDowntime);
  
  // Total predicted delay
  const predictedDelayDays = Math.round(
    weatherImpact.days + materialImpact.days + workforceImpact.days + equipmentImpact.days
  );
  
  // Calculate delay probability
  const delayProbability = calculateDelayProbability([
    weatherImpact.probability,
    materialImpact.probability,
    workforceImpact.probability,
    equipmentImpact.probability,
  ]);
  
  // Root causes
  const rootCauses: DelayRootCause[] = [
    {
      category: 'weather' as const,
      description: 'Weather-related delays based on forecast and historical patterns',
      impact_days: weatherImpact.days,
      probability: weatherImpact.probability,
    },
    {
      category: 'materials' as const,
      description: 'Material delivery delays and supply chain issues',
      impact_days: materialImpact.days,
      probability: materialImpact.probability,
    },
    {
      category: 'workforce' as const,
      description: 'Workforce availability and productivity issues',
      impact_days: workforceImpact.days,
      probability: workforceImpact.probability,
    },
    {
      category: 'equipment' as const,
      description: 'Equipment downtime and maintenance delays',
      impact_days: equipmentImpact.days,
      probability: equipmentImpact.probability,
    },
  ].filter(cause => cause.impact_days > 0);
  
  // Mitigation recommendations
  const recommendations = generateMitigationRecommendations(rootCauses);
  
  // Risk level
  const riskLevel = getRiskLevel(delayProbability, predictedDelayDays);
  
  // Confidence score (based on data quality and quantity)
  const confidenceScore = calculateConfidenceScore(historicalData);
  
  return {
    project_id: project.id,
    project_name: project.name,
    predicted_delay_days: predictedDelayDays,
    delay_probability: delayProbability,
    predicted_completion_date: addDays(endDate, predictedDelayDays).toISOString(),
    original_completion_date: endDate.toISOString(),
    root_causes: rootCauses,
    mitigation_recommendations: recommendations,
    confidence_score: confidenceScore,
    risk_level: riskLevel,
  };
}

function calculateWeatherImpact(historicalDelays: number, daysRemaining: number): { days: number; probability: number } {
  // Weather impact increases with project duration
  const baseImpact = historicalDelays * 0.3;
  const seasonalFactor = 1.2; // Adjust based on season
  const days = Math.round(baseImpact * seasonalFactor * (daysRemaining / 90));
  const probability = Math.min(0.95, 0.4 + (historicalDelays / 30));
  
  return { days, probability };
}

function calculateMaterialImpact(historicalDelays: number): { days: number; probability: number } {
  // Material delays are more predictable
  const days = Math.round(historicalDelays * 0.5);
  const probability = Math.min(0.95, 0.3 + (historicalDelays / 20));
  
  return { days, probability };
}

function calculateWorkforceImpact(historicalIssues: number): { days: number; probability: number } {
  // Workforce issues have moderate impact
  const days = Math.round(historicalIssues * 0.4);
  const probability = Math.min(0.95, 0.25 + (historicalIssues / 25));
  
  return { days, probability };
}

function calculateEquipmentImpact(historicalDowntime: number): { days: number; probability: number } {
  // Equipment downtime is less frequent but impactful
  const days = Math.round(historicalDowntime * 0.6);
  const probability = Math.min(0.95, 0.2 + (historicalDowntime / 15));
  
  return { days, probability };
}

function calculateDelayProbability(probabilities: number[]): number {
  // Combined probability using complement rule
  const noDelayProb = probabilities.reduce((acc, p) => acc * (1 - p), 1);
  return Math.round((1 - noDelayProb) * 100) / 100;
}

function getRiskLevel(probability: number, delayDays: number): 'low' | 'medium' | 'high' | 'critical' {
  if (probability >= 0.7 || delayDays >= 14) return 'critical';
  if (probability >= 0.5 || delayDays >= 7) return 'high';
  if (probability >= 0.3 || delayDays >= 3) return 'medium';
  return 'low';
}

function calculateConfidenceScore(historicalData: Record<string, number>): number {
  // Confidence based on data availability
  const dataPoints = Object.values(historicalData).filter(v => v > 0).length;
  const totalData = Object.values(historicalData).reduce((sum, v) => sum + v, 0);
  
  const dataQuality = Math.min(1, dataPoints / 4);
  const dataQuantity = Math.min(1, totalData / 50);
  
  return Math.round((dataQuality * 0.6 + dataQuantity * 0.4) * 100) / 100;
}

function generateMitigationRecommendations(rootCauses: DelayRootCause[]): string[] {
  const recommendations: string[] = [];
  
  rootCauses.forEach(cause => {
    if (cause.impact_days === 0) return;
    
    switch (cause.category) {
      case 'weather':
        if (cause.impact_days >= 5) {
          recommendations.push('Schedule weather-sensitive tasks during favorable forecast windows');
          recommendations.push('Prepare indoor work alternatives for bad weather days');
        }
        recommendations.push('Monitor 7-day weather forecast daily and adjust schedule proactively');
        break;
        
      case 'materials':
        if (cause.impact_days >= 3) {
          recommendations.push('Order critical materials 2 weeks earlier than planned');
          recommendations.push('Identify alternative suppliers for high-risk materials');
        }
        recommendations.push('Implement daily material delivery tracking and alerts');
        break;
        
      case 'workforce':
        if (cause.impact_days >= 4) {
          recommendations.push('Hire additional crew or subcontractors for critical path tasks');
          recommendations.push('Cross-train workers to increase flexibility');
        }
        recommendations.push('Implement overtime for critical milestones');
        break;
        
      case 'equipment':
        if (cause.impact_days >= 3) {
          recommendations.push('Schedule preventive maintenance during non-critical periods');
          recommendations.push('Arrange backup equipment rental agreements');
        }
        recommendations.push('Conduct daily equipment inspections to prevent breakdowns');
        break;
    }
  });
  
  // General recommendations
  if (rootCauses.length >= 3) {
    recommendations.push('Consider fast-tracking critical path activities');
    recommendations.push('Increase project management oversight and daily monitoring');
  }
  
  return recommendations;
}

/**
 * Analyze delay trends over time
 */
export function analyzeDelayTrends(predictions: DelayPrediction[]): {
  trend: 'improving' | 'worsening' | 'stable';
  averageDelay: number;
  highRiskProjects: number;
} {
  if (predictions.length === 0) {
    return { trend: 'stable', averageDelay: 0, highRiskProjects: 0 };
  }
  
  const averageDelay = predictions.reduce((sum, p) => sum + p.predicted_delay_days, 0) / predictions.length;
  const highRiskProjects = predictions.filter(p => p.risk_level === 'high' || p.risk_level === 'critical').length;
  
  // Trend analysis (simplified - would use time series in production)
  const recentPredictions = predictions.slice(-5);
  const olderPredictions = predictions.slice(0, -5);
  
  if (olderPredictions.length === 0) {
    return { trend: 'stable', averageDelay, highRiskProjects };
  }
  
  const recentAvg = recentPredictions.reduce((sum, p) => sum + p.predicted_delay_days, 0) / recentPredictions.length;
  const olderAvg = olderPredictions.reduce((sum, p) => sum + p.predicted_delay_days, 0) / olderPredictions.length;
  
  const difference = recentAvg - olderAvg;
  
  let trend: 'improving' | 'worsening' | 'stable' = 'stable';
  if (difference > 2) trend = 'worsening';
  else if (difference < -2) trend = 'improving';
  
  return { trend, averageDelay, highRiskProjects };
}

/**
 * Get delay risk color for UI
 */
export function getDelayRiskColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'critical': return 'text-destructive';
    case 'high': return 'text-destructive';
    case 'medium': return 'text-yellow-600';
    case 'low': return 'text-green-600';
    default: return 'text-muted-foreground';
  }
}

/**
 * Get delay risk badge variant
 */
export function getDelayRiskBadge(riskLevel: string): 'default' | 'secondary' | 'destructive' {
  switch (riskLevel) {
    case 'critical': return 'destructive';
    case 'high': return 'destructive';
    case 'medium': return 'secondary';
    case 'low': return 'default';
    default: return 'secondary';
  }
}
