import { AuditResult, CorrectiveAction, SafetyAudit } from '@/types/types';

/**
 * Calculate overall audit score from checklist results
 * Returns percentage of passed items
 */
export function calculateAuditScore(results: AuditResult[]): number {
  if (results.length === 0) return 0;

  const passedCount = results.filter(r => r.passed).length;
  return Math.round((passedCount / results.length) * 100);
}

/**
 * Identify items requiring corrective actions
 */
export function identifyCorrectiveActions(results: AuditResult[]): CorrectiveAction[] {
  const actions: CorrectiveAction[] = [];

  results.forEach((result, index) => {
    if (!result.passed) {
      actions.push({
        id: `action-${index}`,
        issue: result.question,
        action_required: result.notes || 'Address non-compliance',
        status: 'open',
      });
    }
  });

  return actions;
}

/**
 * Track corrective action completion rate
 */
export function trackActionCompletion(actions: CorrectiveAction[]): {
  total: number;
  completed: number;
  inProgress: number;
  open: number;
  completionRate: number;
} {
  const total = actions.length;
  const completed = actions.filter(a => a.status === 'completed').length;
  const inProgress = actions.filter(a => a.status === 'in_progress').length;
  const open = actions.filter(a => a.status === 'open').length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    inProgress,
    open,
    completionRate,
  };
}

/**
 * Get audit score color for UI display
 */
export function getAuditScoreColor(score: number): string {
  if (score >= 90) return 'text-green-600';
  if (score >= 75) return 'text-yellow-600';
  return 'text-destructive';
}

/**
 * Get audit score badge variant
 */
export function getAuditScoreBadge(score: number): {
  variant: 'default' | 'secondary' | 'destructive';
  label: string;
} {
  if (score >= 90) {
    return { variant: 'default', label: 'Excellent' };
  } else if (score >= 75) {
    return { variant: 'secondary', label: 'Good' };
  } else if (score >= 60) {
    return { variant: 'secondary', label: 'Fair' };
  } else {
    return { variant: 'destructive', label: 'Poor' };
  }
}

/**
 * Categorize audit results by category
 */
export function categorizeResults(results: AuditResult[]): Map<string, AuditResult[]> {
  const categorized = new Map<string, AuditResult[]>();

  results.forEach(result => {
    // Extract category from question or use default
    const category = 'General'; // Could be enhanced to parse from result
    const existing = categorized.get(category) || [];
    existing.push(result);
    categorized.set(category, existing);
  });

  return categorized;
}

/**
 * Calculate category scores
 */
export function calculateCategoryScores(results: AuditResult[]): {
  category: string;
  score: number;
  passed: number;
  total: number;
}[] {
  const categorized = categorizeResults(results);
  const scores: { category: string; score: number; passed: number; total: number }[] = [];

  categorized.forEach((categoryResults, category) => {
    const passed = categoryResults.filter(r => r.passed).length;
    const total = categoryResults.length;
    const score = total > 0 ? Math.round((passed / total) * 100) : 0;

    scores.push({ category, score, passed, total });
  });

  return scores.sort((a, b) => a.score - b.score); // Sort by score ascending (worst first)
}

/**
 * Get corrective action status badge
 */
export function getActionStatusBadge(status: 'open' | 'in_progress' | 'completed'): {
  variant: 'default' | 'secondary' | 'destructive';
  label: string;
} {
  switch (status) {
    case 'completed':
      return { variant: 'default', label: 'Completed' };
    case 'in_progress':
      return { variant: 'secondary', label: 'In Progress' };
    case 'open':
      return { variant: 'destructive', label: 'Open' };
    default:
      return { variant: 'secondary', label: 'Unknown' };
  }
}

/**
 * Check if corrective action is overdue
 */
export function isActionOverdue(action: CorrectiveAction): boolean {
  if (!action.due_date || action.status === 'completed') return false;
  return new Date(action.due_date) < new Date();
}

/**
 * Get audit trend over time
 */
export function getAuditTrend(audits: SafetyAudit[]): {
  trend: 'improving' | 'declining' | 'stable';
  averageScore: number;
} {
  if (audits.length < 2) {
    const avgScore = audits.length > 0 ? (audits[0].overall_score || 0) : 0;
    return { trend: 'stable', averageScore: avgScore };
  }

  const sorted = [...audits].sort(
    (a, b) => new Date(a.audit_date).getTime() - new Date(b.audit_date).getTime()
  );

  const scores = sorted.map(a => a.overall_score || 0);
  const averageScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;

  const recentScores = scores.slice(-3);
  const olderScores = scores.slice(0, -3);

  if (olderScores.length === 0) {
    return { trend: 'stable', averageScore };
  }

  const recentAvg = recentScores.reduce((sum, s) => sum + s, 0) / recentScores.length;
  const olderAvg = olderScores.reduce((sum, s) => sum + s, 0) / olderScores.length;

  const difference = recentAvg - olderAvg;

  if (Math.abs(difference) < 5) {
    return { trend: 'stable', averageScore };
  } else if (difference > 0) {
    return { trend: 'improving', averageScore };
  } else {
    return { trend: 'declining', averageScore };
  }
}

/**
 * Generate audit summary statistics
 */
export function generateAuditSummary(audits: SafetyAudit[]): {
  totalAudits: number;
  averageScore: number;
  passRate: number;
  totalCorrectiveActions: number;
  openActions: number;
} {
  const totalAudits = audits.length;
  const averageScore = totalAudits > 0
    ? audits.reduce((sum, a) => sum + (a.overall_score || 0), 0) / totalAudits
    : 0;

  const passRate = totalAudits > 0
    ? audits.filter(a => (a.overall_score || 0) >= 75).length / totalAudits * 100
    : 0;

  const totalCorrectiveActions = audits.reduce(
    (sum, a) => sum + (a.corrective_actions?.length || 0),
    0
  );

  const openActions = audits.reduce(
    (sum, a) => sum + (a.corrective_actions?.filter(ca => ca.status === 'open').length || 0),
    0
  );

  return {
    totalAudits,
    averageScore: Math.round(averageScore),
    passRate: Math.round(passRate),
    totalCorrectiveActions,
    openActions,
  };
}

/**
 * Validate audit results
 */
export function validateAuditResults(results: AuditResult[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (results.length === 0) {
    errors.push('No audit results provided');
  }

  results.forEach((result, index) => {
    if (!result.question) {
      errors.push(`Result ${index + 1}: Missing question`);
    }
    if (result.response === undefined || result.response === null) {
      errors.push(`Result ${index + 1}: Missing response`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
