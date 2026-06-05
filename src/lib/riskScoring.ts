import { RiskFactors, RiskAssessment, HighRiskActivity } from '@/types/types';

/**
 * Calculate overall risk score from individual risk factors
 * Score range: 0-100 (0 = no risk, 100 = extreme risk)
 */
export function calculateRiskScore(factors: RiskFactors): number {
  const weights: Record<string, number> = {
    height: 0.25,        // Working at heights
    weather: 0.15,       // Weather conditions
    equipment: 0.20,     // Equipment complexity/danger
    experience: 0.15,    // Worker experience level
    complexity: 0.15,    // Task complexity
    default: 0.10,       // Other factors
  };

  let totalScore = 0;
  let totalWeight = 0;

  Object.entries(factors).forEach(([factor, value]) => {
    if (value !== undefined && value !== null) {
      const weight = weights[factor] || weights.default;
      totalScore += value * weight;
      totalWeight += weight;
    }
  });

  // Normalize to 0-100 scale
  return totalWeight > 0 ? Math.min(100, Math.max(0, totalScore / totalWeight)) : 0;
}

/**
 * Assess risk level for a specific activity
 * Returns risk category and score
 */
export function assessActivityRisk(
  activity: string,
  factors: RiskFactors
): { level: 'low' | 'medium' | 'high' | 'critical'; score: number; color: string } {
  const score = calculateRiskScore(factors);

  if (score >= 75) {
    return { level: 'critical', score, color: 'destructive' };
  } else if (score >= 50) {
    return { level: 'high', score, color: 'destructive' };
  } else if (score >= 25) {
    return { level: 'medium', score, color: 'secondary' };
  } else {
    return { level: 'low', score, color: 'default' };
  }
}

/**
 * Predict risk trend based on historical assessments
 */
export function predictRiskTrend(
  assessments: RiskAssessment[]
): { trend: 'increasing' | 'decreasing' | 'stable'; confidence: number } {
  if (assessments.length < 3) {
    return { trend: 'stable', confidence: 0.3 };
  }

  // Sort by date
  const sorted = [...assessments].sort(
    (a, b) => new Date(a.assessment_date).getTime() - new Date(b.assessment_date).getTime()
  );

  // Calculate moving average
  const scores = sorted.map(a => a.risk_score || 0);
  const recentAvg = scores.slice(-3).reduce((sum, s) => sum + s, 0) / 3;
  const olderAvg = scores.slice(0, -3).reduce((sum, s) => sum + s, 0) / (scores.length - 3);

  const difference = recentAvg - olderAvg;
  const confidence = Math.min(1, assessments.length / 10);

  if (Math.abs(difference) < 5) {
    return { trend: 'stable', confidence };
  } else if (difference > 0) {
    return { trend: 'increasing', confidence };
  } else {
    return { trend: 'decreasing', confidence };
  }
}

/**
 * Generate heatmap data structure for visualization
 */
export function generateRiskHeatmap(
  assessments: RiskAssessment[]
): { activity: string; location: string; score: number; level: string }[] {
  const heatmapData: { activity: string; location: string; score: number; level: string }[] = [];

  assessments.forEach(assessment => {
    const { level } = assessActivityRisk(assessment.activity, assessment.risk_factors);
    
    heatmapData.push({
      activity: assessment.activity,
      location: assessment.location || 'Unknown',
      score: assessment.risk_score || 0,
      level,
    });
  });

  // Sort by score descending
  return heatmapData.sort((a, b) => b.score - a.score);
}

/**
 * Recommend mitigation measures based on risk factors
 */
export function recommendMitigation(factors: RiskFactors): string[] {
  const recommendations: string[] = [];

  if (factors.height && factors.height > 50) {
    recommendations.push('Implement fall protection systems');
    recommendations.push('Conduct height safety training');
    recommendations.push('Use safety harnesses and lanyards');
  }

  if (factors.weather && factors.weather > 60) {
    recommendations.push('Monitor weather conditions continuously');
    recommendations.push('Postpone work during severe weather');
    recommendations.push('Provide weather-appropriate PPE');
  }

  if (factors.equipment && factors.equipment > 60) {
    recommendations.push('Conduct equipment safety inspection');
    recommendations.push('Ensure operators are certified');
    recommendations.push('Implement lockout/tagout procedures');
  }

  if (factors.experience && factors.experience > 60) {
    recommendations.push('Assign experienced supervisor');
    recommendations.push('Provide additional training');
    recommendations.push('Implement buddy system');
  }

  if (factors.complexity && factors.complexity > 60) {
    recommendations.push('Break down into smaller tasks');
    recommendations.push('Conduct detailed job hazard analysis');
    recommendations.push('Increase supervision frequency');
  }

  if (recommendations.length === 0) {
    recommendations.push('Maintain standard safety protocols');
    recommendations.push('Continue regular safety monitoring');
  }

  return recommendations;
}

/**
 * Calculate predicted risk score for future date
 */
export function predictFutureRisk(
  historicalAssessments: RiskAssessment[],
  daysAhead: number
): { score: number; confidence: number; activities: HighRiskActivity[] } {
  if (historicalAssessments.length === 0) {
    return { score: 0, confidence: 0, activities: [] };
  }

  // Calculate average risk score
  const avgScore = historicalAssessments.reduce((sum, a) => sum + (a.risk_score || 0), 0) / historicalAssessments.length;

  // Identify trend
  const { trend, confidence: trendConfidence } = predictRiskTrend(historicalAssessments);

  // Adjust prediction based on trend
  let predictedScore = avgScore;
  if (trend === 'increasing') {
    predictedScore = Math.min(100, avgScore * 1.15);
  } else if (trend === 'decreasing') {
    predictedScore = Math.max(0, avgScore * 0.85);
  }

  // Identify high-risk activities
  const activityRisks = new Map<string, number[]>();
  historicalAssessments.forEach(assessment => {
    const existing = activityRisks.get(assessment.activity) || [];
    existing.push(assessment.risk_score || 0);
    activityRisks.set(assessment.activity, existing);
  });

  const highRiskActivities: HighRiskActivity[] = [];
  activityRisks.forEach((scores, activity) => {
    const avgActivityScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    if (avgActivityScore >= 50) {
      const factors: string[] = [];
      // Get most recent assessment for this activity
      const recentAssessment = historicalAssessments
        .filter(a => a.activity === activity)
        .sort((a, b) => new Date(b.assessment_date).getTime() - new Date(a.assessment_date).getTime())[0];
      
      if (recentAssessment) {
        Object.entries(recentAssessment.risk_factors).forEach(([factor, value]) => {
          if (value && value > 50) {
            factors.push(factor);
          }
        });
      }

      highRiskActivities.push({
        activity,
        risk_score: avgActivityScore,
        factors,
      });
    }
  });

  // Sort by risk score
  highRiskActivities.sort((a, b) => b.risk_score - a.risk_score);

  return {
    score: predictedScore,
    confidence: trendConfidence,
    activities: highRiskActivities,
  };
}

/**
 * Get risk level color for UI display
 */
export function getRiskLevelColor(score: number): string {
  if (score >= 75) return 'text-destructive';
  if (score >= 50) return 'text-destructive';
  if (score >= 25) return 'text-yellow-600';
  return 'text-green-600';
}

/**
 * Get risk level badge variant
 */
export function getRiskBadgeVariant(score: number): 'default' | 'secondary' | 'destructive' {
  if (score >= 50) return 'destructive';
  if (score >= 25) return 'secondary';
  return 'default';
}
