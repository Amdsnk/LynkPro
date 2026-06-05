import { BudgetPrediction, CostBreakdown, SavingsOpportunity, Project } from '@/types/types';

/**
 * Predict budget overruns using current spend rate and project progress
 * This is a simplified statistical model - in production, use ML model (LSTM)
 */
export function predictBudgetOutcome(
  project: Project,
  currentData: {
    totalBudget: number;
    totalSpent: number;
    percentComplete: number;
    categorySpending: Record<string, { budgeted: number; spent: number }>;
    changeOrders: number;
    productivityRate: number; // 0-1 scale
  }
): BudgetPrediction {
  const { totalBudget, totalSpent, percentComplete, categorySpending, changeOrders, productivityRate } = currentData;
  
  // Calculate burn rate
  const burnRate = percentComplete > 0 ? totalSpent / percentComplete : 0;
  
  // Predict final cost based on burn rate
  let predictedFinalCost = burnRate * 100;
  
  // Adjust for productivity
  const productivityFactor = productivityRate > 0 ? 1 / productivityRate : 1.2;
  predictedFinalCost *= productivityFactor;
  
  // Add change order impact
  predictedFinalCost += changeOrders;
  
  // Add contingency for remaining work (5-10% based on risk)
  const remainingWork = 100 - percentComplete;
  const contingencyRate = 0.05 + (remainingWork / 1000);
  predictedFinalCost += (predictedFinalCost * contingencyRate);
  
  // Calculate variance
  const predictedVariance = predictedFinalCost - totalBudget;
  const variancePercentage = (predictedVariance / totalBudget) * 100;
  
  // Calculate overrun probability
  const overrunProbability = calculateOverrunProbability(
    variancePercentage,
    percentComplete,
    productivityRate
  );
  
  // Cost breakdown by category
  const costBreakdown = generateCostBreakdown(categorySpending, burnRate, percentComplete);
  
  // Identify savings opportunities
  const savingsOpportunities = identifySavingsOpportunities(costBreakdown, predictedVariance);
  
  // Risk level
  const riskLevel = getBudgetRiskLevel(variancePercentage, overrunProbability);
  
  // Confidence score
  const confidenceScore = calculateBudgetConfidence(percentComplete, categorySpending);
  
  return {
    project_id: project.id,
    project_name: project.name,
    current_budget: totalBudget,
    current_spent: totalSpent,
    predicted_final_cost: Math.round(predictedFinalCost),
    predicted_variance: Math.round(predictedVariance),
    variance_percentage: Math.round(variancePercentage * 10) / 10,
    overrun_probability: overrunProbability,
    cost_breakdown: costBreakdown,
    savings_opportunities: savingsOpportunities,
    confidence_score: confidenceScore,
    risk_level: riskLevel,
  };
}

function calculateOverrunProbability(
  variancePercentage: number,
  percentComplete: number,
  productivityRate: number
): number {
  // Base probability on variance
  let probability = 0;
  
  if (variancePercentage > 20) probability = 0.9;
  else if (variancePercentage > 10) probability = 0.7;
  else if (variancePercentage > 5) probability = 0.5;
  else if (variancePercentage > 0) probability = 0.3;
  else probability = 0.1;
  
  // Adjust for project completion (more certain as project progresses)
  const completionFactor = 1 + (percentComplete / 200);
  probability *= completionFactor;
  
  // Adjust for productivity
  if (productivityRate < 0.8) probability *= 1.2;
  else if (productivityRate > 1.0) probability *= 0.8;
  
  return Math.min(0.95, Math.max(0.05, Math.round(probability * 100) / 100));
}

function generateCostBreakdown(
  categorySpending: Record<string, { budgeted: number; spent: number }>,
  burnRate: number,
  percentComplete: number
): CostBreakdown[] {
  const breakdown: CostBreakdown[] = [];
  
  Object.entries(categorySpending).forEach(([category, data]) => {
    const { budgeted, spent } = data;
    
    // Predict final cost for this category
    const categoryBurnRate = percentComplete > 0 ? spent / percentComplete : 0;
    const predicted = Math.round(categoryBurnRate * 100);
    const variance = predicted - budgeted;
    
    breakdown.push({
      category,
      budgeted,
      spent,
      predicted,
      variance,
    });
  });
  
  // Sort by variance (worst first)
  return breakdown.sort((a, b) => b.variance - a.variance);
}

function identifySavingsOpportunities(
  costBreakdown: CostBreakdown[],
  totalVariance: number
): SavingsOpportunity[] {
  const opportunities: SavingsOpportunity[] = [];
  
  // Identify categories with overruns
  const overrunCategories = costBreakdown.filter(c => c.variance > 0);
  
  overrunCategories.forEach((category, index) => {
    const variancePercent = (category.variance / category.budgeted) * 100;
    
    if (variancePercent > 15) {
      opportunities.push({
        category: category.category,
        description: `Significant overrun detected. Review ${category.category} contracts and negotiate better rates.`,
        potential_savings: Math.round(category.variance * 0.3),
        effort_level: 'high',
        priority: index + 1,
      });
    } else if (variancePercent > 5) {
      opportunities.push({
        category: category.category,
        description: `Moderate overrun in ${category.category}. Optimize resource allocation and reduce waste.`,
        potential_savings: Math.round(category.variance * 0.2),
        effort_level: 'medium',
        priority: index + 1,
      });
    }
  });
  
  // General opportunities
  if (totalVariance > 0) {
    opportunities.push({
      category: 'General',
      description: 'Implement value engineering to reduce costs without compromising quality',
      potential_savings: Math.round(totalVariance * 0.15),
      effort_level: 'medium',
      priority: opportunities.length + 1,
    });
    
    opportunities.push({
      category: 'General',
      description: 'Negotiate bulk discounts with suppliers for remaining materials',
      potential_savings: Math.round(totalVariance * 0.1),
      effort_level: 'low',
      priority: opportunities.length + 1,
    });
    
    opportunities.push({
      category: 'General',
      description: 'Optimize crew scheduling to reduce overtime costs',
      potential_savings: Math.round(totalVariance * 0.12),
      effort_level: 'low',
      priority: opportunities.length + 1,
    });
  }
  
  return opportunities.sort((a, b) => b.potential_savings - a.potential_savings);
}

function getBudgetRiskLevel(
  variancePercentage: number,
  overrunProbability: number
): 'low' | 'medium' | 'high' | 'critical' {
  if (variancePercentage > 15 || overrunProbability > 0.7) return 'critical';
  if (variancePercentage > 10 || overrunProbability > 0.5) return 'high';
  if (variancePercentage > 5 || overrunProbability > 0.3) return 'medium';
  return 'low';
}

function calculateBudgetConfidence(
  percentComplete: number,
  categorySpending: Record<string, any>
): number {
  // Confidence increases with project completion
  const completionFactor = Math.min(1, percentComplete / 100);
  
  // Confidence increases with data granularity
  const categoryCount = Object.keys(categorySpending).length;
  const dataFactor = Math.min(1, categoryCount / 10);
  
  return Math.round((completionFactor * 0.7 + dataFactor * 0.3) * 100) / 100;
}

/**
 * Analyze budget trends across projects
 */
export function analyzeBudgetTrends(predictions: BudgetPrediction[]): {
  averageVariance: number;
  overrunRate: number;
  totalPotentialSavings: number;
  highRiskProjects: number;
} {
  if (predictions.length === 0) {
    return {
      averageVariance: 0,
      overrunRate: 0,
      totalPotentialSavings: 0,
      highRiskProjects: 0,
    };
  }
  
  const totalVariance = predictions.reduce((sum, p) => sum + p.variance_percentage, 0);
  const averageVariance = totalVariance / predictions.length;
  
  const overrunCount = predictions.filter(p => p.predicted_variance > 0).length;
  const overrunRate = (overrunCount / predictions.length) * 100;
  
  const totalPotentialSavings = predictions.reduce((sum, p) => {
    const savings = p.savings_opportunities.reduce((s, opp) => s + opp.potential_savings, 0);
    return sum + savings;
  }, 0);
  
  const highRiskProjects = predictions.filter(
    p => p.risk_level === 'high' || p.risk_level === 'critical'
  ).length;
  
  return {
    averageVariance: Math.round(averageVariance * 10) / 10,
    overrunRate: Math.round(overrunRate * 10) / 10,
    totalPotentialSavings: Math.round(totalPotentialSavings),
    highRiskProjects,
  };
}

/**
 * Get budget risk color for UI
 */
export function getBudgetRiskColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'critical': return 'text-destructive';
    case 'high': return 'text-destructive';
    case 'medium': return 'text-yellow-600';
    case 'low': return 'text-green-600';
    default: return 'text-muted-foreground';
  }
}

/**
 * Get budget risk badge variant
 */
export function getBudgetRiskBadge(riskLevel: string): 'default' | 'secondary' | 'destructive' {
  switch (riskLevel) {
    case 'critical': return 'destructive';
    case 'high': return 'destructive';
    case 'medium': return 'secondary';
    case 'low': return 'default';
    default: return 'secondary';
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
