import { DetectedIssue, MaterialDemandPrediction } from '@/types/types';

/**
 * Simulate AI photo analysis for issue detection
 * In production, this would call a computer vision Edge Function
 */
export function analyzePhotoForIssues(photoUrl: string): DetectedIssue[] {
  // Simulate AI detection with random results
  // In production, this would use YOLO or Faster R-CNN model
  
  const issueTypes = [
    { type: 'crack_concrete', severity: 'high' as const, description: 'Crack detected in concrete foundation' },
    { type: 'misalignment', severity: 'medium' as const, description: 'Framing misalignment detected' },
    { type: 'missing_safety_equipment', severity: 'critical' as const, description: 'Worker without hard hat detected' },
    { type: 'water_damage', severity: 'high' as const, description: 'Water damage or moisture detected' },
    { type: 'improper_installation', severity: 'medium' as const, description: 'Improper installation detected' },
  ];
  
  // Simulate detection (in production, this would be actual ML inference)
  const detectedCount = Math.floor(Math.random() * 3);
  const detected: DetectedIssue[] = [];
  
  for (let i = 0; i < detectedCount; i++) {
    const issue = issueTypes[Math.floor(Math.random() * issueTypes.length)];
    
    detected.push({
      id: `issue-${Date.now()}-${i}`,
      photo_url: photoUrl,
      issue_type: issue.type,
      description: issue.description,
      severity: issue.severity,
      location: null,
      bounding_box: {
        x: Math.random() * 0.5,
        y: Math.random() * 0.5,
        width: 0.2 + Math.random() * 0.3,
        height: 0.2 + Math.random() * 0.3,
      },
      confidence_score: 0.7 + Math.random() * 0.25,
      recommended_actions: getRecommendedActions(issue.type),
      detected_at: new Date().toISOString(),
    });
  }
  
  return detected;
}

function getRecommendedActions(issueType: string): string[] {
  const actions: Record<string, string[]> = {
    crack_concrete: [
      'Inspect crack depth and extent',
      'Consult structural engineer',
      'Apply epoxy injection or patching',
      'Monitor for further cracking',
    ],
    misalignment: [
      'Verify measurements against plans',
      'Adjust framing before proceeding',
      'Re-check level and plumb',
      'Document correction in daily log',
    ],
    missing_safety_equipment: [
      'Stop work immediately',
      'Provide required PPE to worker',
      'Conduct safety briefing',
      'Document incident in safety log',
    ],
    water_damage: [
      'Identify and stop water source',
      'Dry affected area completely',
      'Inspect for mold or rot',
      'Replace damaged materials',
    ],
    improper_installation: [
      'Review installation specifications',
      'Remove and reinstall correctly',
      'Verify with quality inspector',
      'Update crew training if needed',
    ],
  };
  
  return actions[issueType] || ['Investigate issue', 'Consult with supervisor', 'Document findings'];
}

/**
 * Predict material demand using time series forecasting
 * In production, this would use Prophet or LSTM model
 */
export function predictMaterialDemand(
  materialId: string,
  materialName: string,
  historicalConsumption: number[],
  currentStock: number,
  leadTimeDays: number
): MaterialDemandPrediction {
  // Simple moving average prediction (in production, use Prophet)
  const windowSize = Math.min(4, historicalConsumption.length);
  const recentConsumption = historicalConsumption.slice(-windowSize);
  const avgConsumption = recentConsumption.reduce((sum, val) => sum + val, 0) / windowSize;
  
  // Predict next 8 weeks
  const predictedDemand: number[] = [];
  const predictedDates: string[] = [];
  
  for (let week = 1; week <= 8; week++) {
    const today = new Date();
    today.setDate(today.getDate() + (week * 7));
    predictedDates.push(today.toISOString().split('T')[0]);
    
    // Add seasonal variation (simplified)
    const seasonalFactor = 1 + (Math.sin(week / 4) * 0.1);
    const predicted = Math.round(avgConsumption * seasonalFactor);
    predictedDemand.push(predicted);
  }
  
  // Calculate reorder point (lead time demand + safety stock)
  const leadTimeDemand = avgConsumption * (leadTimeDays / 7);
  const safetyStock = avgConsumption * 0.5; // 50% safety stock
  const reorderPoint = Math.round(leadTimeDemand + safetyStock);
  
  // Optimal order quantity (Economic Order Quantity simplified)
  const optimalOrderQuantity = Math.round(avgConsumption * 4); // 4 weeks supply
  
  // Calculate risks
  const stockoutRisk = calculateStockoutRisk(currentStock, avgConsumption, leadTimeDays);
  const wasteRisk = calculateWasteRisk(currentStock, avgConsumption);
  
  // Confidence score
  const confidenceScore = calculateForecastConfidence(historicalConsumption);
  
  return {
    material_id: materialId,
    material_name: materialName,
    current_stock: currentStock,
    predicted_demand: predictedDemand,
    predicted_dates: predictedDates,
    reorder_point: reorderPoint,
    optimal_order_quantity: optimalOrderQuantity,
    lead_time_days: leadTimeDays,
    stockout_risk: stockoutRisk,
    waste_risk: wasteRisk,
    confidence_score: confidenceScore,
  };
}

function calculateStockoutRisk(
  currentStock: number,
  avgConsumption: number,
  leadTimeDays: number
): number {
  const leadTimeDemand = avgConsumption * (leadTimeDays / 7);
  const weeksOfStock = currentStock / avgConsumption;
  
  if (weeksOfStock < 1) return 0.9;
  if (weeksOfStock < 2) return 0.7;
  if (weeksOfStock < leadTimeDays / 7) return 0.5;
  if (weeksOfStock < (leadTimeDays / 7) * 1.5) return 0.3;
  return 0.1;
}

function calculateWasteRisk(currentStock: number, avgConsumption: number): number {
  const weeksOfStock = currentStock / avgConsumption;
  
  if (weeksOfStock > 12) return 0.8;
  if (weeksOfStock > 8) return 0.6;
  if (weeksOfStock > 6) return 0.4;
  if (weeksOfStock > 4) return 0.2;
  return 0.1;
}

function calculateForecastConfidence(historicalData: number[]): number {
  if (historicalData.length < 4) return 0.5;
  if (historicalData.length < 8) return 0.7;
  
  // Calculate coefficient of variation
  const mean = historicalData.reduce((sum, val) => sum + val, 0) / historicalData.length;
  const variance = historicalData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historicalData.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean;
  
  // Lower CV = higher confidence
  if (cv < 0.2) return 0.95;
  if (cv < 0.4) return 0.85;
  if (cv < 0.6) return 0.75;
  return 0.65;
}

/**
 * Calculate confidence score color for UI
 */
export function getConfidenceColor(score: number): string {
  if (score >= 0.8) return 'text-green-600';
  if (score >= 0.6) return 'text-yellow-600';
  return 'text-destructive';
}

/**
 * Get severity badge variant
 */
export function getSeverityBadge(severity: string): 'default' | 'secondary' | 'destructive' {
  switch (severity) {
    case 'critical': return 'destructive';
    case 'high': return 'destructive';
    case 'medium': return 'secondary';
    case 'low': return 'default';
    default: return 'secondary';
  }
}

/**
 * Format confidence score as percentage
 */
export function formatConfidence(score: number): string {
  return `${Math.round(score * 100)}%`;
}

/**
 * Format probability as percentage
 */
export function formatProbability(probability: number): string {
  return `${Math.round(probability * 100)}%`;
}

/**
 * Generate AI insight summary
 */
export function generateInsightSummary(
  predictionType: string,
  data: any
): string {
  switch (predictionType) {
    case 'delay':
      return `${data.predicted_delay_days} day delay predicted with ${formatProbability(data.delay_probability)} probability`;
    case 'budget_overrun':
      return `${data.variance_percentage}% budget variance predicted with ${formatProbability(data.overrun_probability)} overrun risk`;
    case 'material_demand':
      return `Reorder at ${data.reorder_point} units, ${formatProbability(data.stockout_risk)} stockout risk`;
    case 'safety_risk':
      return `Risk score ${data.risk_score} with ${data.factors.length} contributing factors`;
    case 'issue_detection':
      return `${data.detected_count} issues detected with ${formatConfidence(data.avg_confidence)} average confidence`;
    default:
      return 'AI analysis complete';
  }
}
