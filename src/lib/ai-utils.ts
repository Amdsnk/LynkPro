import { Project, Invoice, Task } from '@/types/types';
import { differenceInDays, parseISO, addDays } from 'date-fns';

/**
 * Calculate project risk score based on multiple factors
 * Returns a score from 0-100 (higher = more risk)
 */
export function calculateProjectRisk(project: Project, tasks?: Task[]): {
  score: number;
  confidence: number;
  factors: string[];
} {
  const factors: string[] = [];
  let riskScore = 0;

  // Status-based risk
  if (project.status === 'on_hold') {
    riskScore += 30;
    factors.push('Project is on hold');
  } else if (project.status === 'archived') {
    riskScore += 10;
    factors.push('Project is archived');
  }

  // Task-based risk (if tasks provided)
  if (tasks && tasks.length > 0) {
    const cancelledTasks = tasks.filter((t) => t.status === 'cancelled');
    const overdueTasks = tasks.filter((t) => {
      if (!t.due_date) return false;
      return differenceInDays(new Date(), parseISO(t.due_date)) > 0 && t.status !== 'done';
    });

    if (cancelledTasks.length > 0) {
      riskScore += cancelledTasks.length * 15;
      factors.push(`${cancelledTasks.length} cancelled task${cancelledTasks.length > 1 ? 's' : ''}`);
    }

    if (overdueTasks.length > 0) {
      riskScore += overdueTasks.length * 10;
      factors.push(`${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`);
    }

    // Progress vs timeline
    const completedTasks = tasks.filter((t) => t.status === 'done').length;
    const progressPercent = (completedTasks / tasks.length) * 100;
    
    if (progressPercent < 50) {
      riskScore += 20;
      factors.push('Low completion rate');
    }
  }

  // Cap at 100
  riskScore = Math.min(riskScore, 100);

  // Confidence based on data availability
  const confidence = tasks && tasks.length > 0 ? 85 : 60;

  return {
    score: riskScore,
    confidence,
    factors,
  };
}

/**
 * Predict invoice payment probability
 * Returns probability from 0-100 (higher = more likely to be paid)
 */
export function predictInvoicePayment(invoice: Invoice): {
  probability: number;
  confidence: number;
  reasoning: string;
} {
  let probability = 100;
  const reasons: string[] = [];

  // Status-based probability
  if (invoice.status === 'paid') {
    return {
      probability: 100,
      confidence: 100,
      reasoning: 'Invoice is already paid',
    };
  }

  if (invoice.status === 'draft') {
    return {
      probability: 0,
      confidence: 100,
      reasoning: 'Invoice is still in draft status',
    };
  }

  // Days overdue
  if (invoice.due_date) {
    const daysOverdue = differenceInDays(new Date(), parseISO(invoice.due_date));
    
    if (daysOverdue > 0) {
      probability -= Math.min(daysOverdue * 5, 50);
      reasons.push(`${daysOverdue} days overdue`);
    }
  }

  // Amount-based risk
  if (invoice.total_amount > 50000) {
    probability -= 10;
    reasons.push('Large invoice amount may delay payment');
  }

  // Partial payment indicator
  if (invoice.paid_amount && invoice.paid_amount > 0 && invoice.paid_amount < invoice.total_amount) {
    probability += 20;
    reasons.push('Partial payment received - good sign');
  }

  probability = Math.max(0, Math.min(100, probability));

  const reasoning = reasons.length > 0 
    ? reasons.join('. ') 
    : 'Based on standard payment patterns';

  return {
    probability,
    confidence: 75,
    reasoning,
  };
}

/**
 * Calculate project completion prediction
 */
export function predictProjectCompletion(project: Project, tasks?: Task[]): {
  estimatedDate: Date;
  confidence: number;
  reasoning: string;
} {
  // Default to 30 days from now if no tasks
  if (!tasks || tasks.length === 0) {
    return {
      estimatedDate: addDays(new Date(), 30),
      confidence: 40,
      reasoning: 'No task data available - using average project duration',
    };
  }

  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const totalTasks = tasks.length;
  const progressPercent = (completedTasks / totalTasks) * 100;

  // Find latest task due date
  const latestDueDate = tasks.reduce((latest, task) => {
    if (!task.due_date) return latest;
    const taskDate = parseISO(task.due_date);
    return taskDate > latest ? taskDate : latest;
  }, new Date());

  // Adjust based on progress
  const daysRemaining = differenceInDays(latestDueDate, new Date());
  const adjustedDays = progressPercent < 50 ? daysRemaining * 1.5 : daysRemaining;

  const estimatedDate = addDays(new Date(), adjustedDays);
  const confidence = progressPercent > 50 ? 80 : 60;

  const reasoning = `Based on ${progressPercent.toFixed(0)}% completion rate and ${totalTasks} total tasks`;

  return {
    estimatedDate,
    confidence,
    reasoning,
  };
}

/**
 * Detect anomalies in project data
 */
export function detectAnomalies(projects: Project[]): Array<{
  type: 'budget' | 'timeline' | 'activity';
  message: string;
  projectId: string;
  severity: 'critical' | 'warning' | 'info';
}> {
  const anomalies: Array<{
    type: 'budget' | 'timeline' | 'activity';
    message: string;
    projectId: string;
    severity: 'critical' | 'warning' | 'info';
  }> = [];

  projects.forEach((project) => {
    // Check for stale projects (no updates in 30 days)
    if (project.updated_at) {
      const daysSinceUpdate = differenceInDays(new Date(), parseISO(project.updated_at));
      if (daysSinceUpdate > 30 && project.status === 'active') {
        anomalies.push({
          type: 'activity',
          message: `No activity on ${project.name} for ${daysSinceUpdate} days`,
          projectId: project.id,
          severity: 'warning',
        });
      }
    }

    // Check for on-hold projects
    if (project.status === 'on_hold') {
      anomalies.push({
        type: 'timeline',
        message: `${project.name} is on hold`,
        projectId: project.id,
        severity: 'warning',
      });
    }
  });

  return anomalies;
}

/**
 * Generate AI insights for dashboard
 */
export function generateDashboardInsights(data: {
  projects: Project[];
  invoices: Invoice[];
}): Array<{
  type: 'critical' | 'warning' | 'insight';
  title: string;
  message: string;
  confidence: number;
}> {
  const insights: Array<{
    type: 'critical' | 'warning' | 'insight';
    title: string;
    message: string;
    confidence: number;
  }> = [];

  // Check for overdue invoices
  const overdueInvoices = data.invoices.filter((inv) => {
    if (inv.status === 'paid' || !inv.due_date) return false;
    return differenceInDays(new Date(), parseISO(inv.due_date)) > 0;
  });

  if (overdueInvoices.length > 0) {
    const totalOverdue = overdueInvoices.reduce((sum, inv) => {
      const paidAmount = inv.paid_amount || 0;
      return sum + (inv.total_amount - paidAmount);
    }, 0);
    insights.push({
      type: 'critical',
      title: 'Overdue Invoices Detected',
      message: `${overdueInvoices.length} invoice${overdueInvoices.length > 1 ? 's' : ''} overdue totaling $${totalOverdue.toLocaleString()}`,
      confidence: 95,
    });
  }

  // Check for at-risk projects
  const atRiskProjects = data.projects.filter((p) => {
    const risk = calculateProjectRisk(p);
    return risk.score > 50;
  });

  if (atRiskProjects.length > 0) {
    insights.push({
      type: 'warning',
      title: 'Projects At Risk',
      message: `${atRiskProjects.length} project${atRiskProjects.length > 1 ? 's' : ''} showing risk indicators`,
      confidence: 78,
    });
  }

  // Check for revenue trends
  const paidInvoices = data.invoices.filter((inv) => inv.status === 'paid');
  if (paidInvoices.length > 5) {
    const recentRevenue = paidInvoices
      .slice(-3)
      .reduce((sum, inv) => sum + inv.total_amount, 0);
    const previousRevenue = paidInvoices
      .slice(-6, -3)
      .reduce((sum, inv) => sum + inv.total_amount, 0);

    if (recentRevenue > previousRevenue * 1.2) {
      insights.push({
        type: 'insight',
        title: 'Revenue Trending Up',
        message: `Revenue increased by ${(((recentRevenue - previousRevenue) / previousRevenue) * 100).toFixed(0)}% in recent period`,
        confidence: 82,
      });
    }
  }

  return insights;
}

/**
 * Predict future risk trend for a project
 * Returns predicted risk score for next 30 days
 */
export function predictRiskTrend(project: Project, tasks?: Task[], historicalData?: any[]): {
  currentRisk: number;
  predictedRisk: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  reasoning: string;
} {
  const current = calculateProjectRisk(project, tasks);
  
  // Calculate velocity (tasks completed per day)
  let velocity = 0;
  if (tasks && tasks.length > 0) {
    const completedTasks = tasks.filter((t) => t.status === 'done');
    if (completedTasks.length > 0 && project.created_at) {
      const daysSinceStart = differenceInDays(new Date(), parseISO(project.created_at));
      velocity = completedTasks.length / Math.max(daysSinceStart, 1);
    }
  }

  // Predict based on velocity and current risk
  let predictedRisk = current.score;
  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  
  if (velocity < 0.5 && current.score > 30) {
    // Low velocity + existing risk = increasing risk
    predictedRisk = Math.min(current.score + 20, 100);
    trend = 'increasing';
  } else if (velocity > 1 && current.score > 0) {
    // High velocity = decreasing risk
    predictedRisk = Math.max(current.score - 15, 0);
    trend = 'decreasing';
  }

  const reasoning = trend === 'increasing'
    ? `Low task completion velocity (${velocity.toFixed(2)} tasks/day) suggests risk will increase`
    : trend === 'decreasing'
    ? `Good task completion velocity (${velocity.toFixed(2)} tasks/day) suggests risk will decrease`
    : 'Current trajectory suggests stable risk level';

  return {
    currentRisk: current.score,
    predictedRisk,
    trend,
    confidence: tasks && tasks.length > 5 ? 75 : 55,
    reasoning,
  };
}

/**
 * Analyze trends in data over time
 */
export function analyzeTrend(dataPoints: number[]): {
  direction: 'up' | 'down' | 'flat';
  strength: number; // 0-100
  prediction: number;
  confidence: number;
} {
  if (dataPoints.length < 2) {
    return {
      direction: 'flat',
      strength: 0,
      prediction: dataPoints[0] || 0,
      confidence: 20,
    };
  }

  // Simple linear regression
  const n = dataPoints.length;
  const xMean = (n - 1) / 2;
  const yMean = dataPoints.reduce((sum, val) => sum + val, 0) / n;

  let numerator = 0;
  let denominator = 0;

  dataPoints.forEach((y, x) => {
    numerator += (x - xMean) * (y - yMean);
    denominator += Math.pow(x - xMean, 2);
  });

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;

  // Predict next value
  const prediction = slope * n + intercept;

  // Determine direction and strength
  const direction = slope > 0.1 ? 'up' : slope < -0.1 ? 'down' : 'flat';
  const strength = Math.min(Math.abs(slope) * 20, 100);

  // Confidence based on data consistency
  const variance = dataPoints.reduce((sum, val) => {
    const predicted = slope * dataPoints.indexOf(val) + intercept;
    return sum + Math.pow(val - predicted, 2);
  }, 0) / n;
  const confidence = Math.max(20, 100 - variance);

  return {
    direction,
    strength,
    prediction,
    confidence,
  };
}

/**
 * Detect anomalies in time series data
 */
export function detectTimeSeriesAnomalies(dataPoints: Array<{ date: Date; value: number }>): Array<{
  index: number;
  date: Date;
  value: number;
  expectedValue: number;
  deviation: number;
  severity: 'critical' | 'warning' | 'info';
}> {
  if (dataPoints.length < 3) return [];

  const anomalies: Array<{
    index: number;
    date: Date;
    value: number;
    expectedValue: number;
    deviation: number;
    severity: 'critical' | 'warning' | 'info';
  }> = [];

  // Calculate moving average and standard deviation
  const values = dataPoints.map((d) => d.value);
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const stdDev = Math.sqrt(
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  );

  dataPoints.forEach((point, index) => {
    const deviation = Math.abs(point.value - mean) / stdDev;

    if (deviation > 2) {
      // More than 2 standard deviations = anomaly
      anomalies.push({
        index,
        date: point.date,
        value: point.value,
        expectedValue: mean,
        deviation,
        severity: deviation > 3 ? 'critical' : 'warning',
      });
    }
  });

  return anomalies;
}

/**
 * Generate predictive recommendations
 */
export function generateRecommendations(data: {
  projects: Project[];
  invoices: Invoice[];
  tasks?: Task[];
}): Array<{
  id: string;
  priority: 'high' | 'medium' | 'low';
  category: 'action' | 'insight' | 'warning';
  title: string;
  description: string;
  suggestedActions: string[];
  impact: string;
  confidence: number;
}> {
  const recommendations: Array<{
    id: string;
    priority: 'high' | 'medium' | 'low';
    category: 'action' | 'insight' | 'warning';
    title: string;
    description: string;
    suggestedActions: string[];
    impact: string;
    confidence: number;
  }> = [];

  // Check for projects needing attention
  data.projects.forEach((project) => {
    const risk = calculateProjectRisk(project, data.tasks);
    
    if (risk.score > 70) {
      recommendations.push({
        id: `rec-project-${project.id}`,
        priority: 'high',
        category: 'action',
        title: `Immediate attention needed: ${project.name}`,
        description: `Project shows ${risk.score}% risk score. ${risk.factors.join(', ')}.`,
        suggestedActions: [
          'Schedule team meeting to review blockers',
          'Reassign overdue tasks',
          'Update project timeline',
          'Communicate with client about delays',
        ],
        impact: 'Reduce project risk by 30-40%',
        confidence: risk.confidence,
      });
    }
  });

  // Check for invoice follow-ups
  const unpaidInvoices = data.invoices.filter(
    (inv) => inv.status === 'sent' && inv.due_date
  );

  unpaidInvoices.forEach((invoice) => {
    const daysUntilDue = differenceInDays(parseISO(invoice.due_date!), new Date());
    
    if (daysUntilDue <= 3 && daysUntilDue >= 0) {
      recommendations.push({
        id: `rec-invoice-${invoice.id}`,
        priority: 'medium',
        category: 'action',
        title: `Follow up on invoice ${invoice.invoice_number}`,
        description: `Invoice due in ${daysUntilDue} days. Amount: $${invoice.total_amount.toLocaleString()}`,
        suggestedActions: [
          'Send payment reminder email',
          'Call client to confirm receipt',
          'Offer payment plan if needed',
        ],
        impact: 'Increase on-time payment probability by 40%',
        confidence: 80,
      });
    }
  });

  // Revenue optimization insights
  const paidInvoices = data.invoices.filter((inv) => inv.status === 'paid');
  if (paidInvoices.length > 0) {
    const avgInvoiceAmount = paidInvoices.reduce((sum, inv) => sum + inv.total_amount, 0) / paidInvoices.length;
    const lowValueInvoices = paidInvoices.filter((inv) => inv.total_amount < avgInvoiceAmount * 0.5);

    if (lowValueInvoices.length > paidInvoices.length * 0.3) {
      recommendations.push({
        id: 'rec-revenue-optimization',
        priority: 'low',
        category: 'insight',
        title: 'Revenue optimization opportunity',
        description: `${lowValueInvoices.length} invoices are below average value. Consider bundling services or adjusting pricing.`,
        suggestedActions: [
          'Review pricing strategy',
          'Create service packages',
          'Implement minimum project size',
          'Offer retainer agreements',
        ],
        impact: 'Potential 15-25% revenue increase',
        confidence: 65,
      });
    }
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

