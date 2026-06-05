import { ComplianceTracking, ComplianceRequirement, ComplianceStatus } from '@/types/types';
import { addDays, addWeeks, addMonths, parseISO } from 'date-fns';

/**
 * Calculate compliance score for a project
 * Returns percentage of compliant requirements
 */
export function calculateComplianceScore(trackingRecords: ComplianceTracking[]): number {
  if (trackingRecords.length === 0) return 100;

  const compliantCount = trackingRecords.filter(r => r.status === 'compliant').length;
  return Math.round((compliantCount / trackingRecords.length) * 100);
}

/**
 * Identify compliance gaps (non-compliant or pending requirements)
 */
export function identifyGaps(
  trackingRecords: ComplianceTracking[]
): { critical: ComplianceTracking[]; pending: ComplianceTracking[] } {
  const critical = trackingRecords.filter(r => r.status === 'non_compliant');
  const pending = trackingRecords.filter(r => r.status === 'pending');

  return { critical, pending };
}

/**
 * Schedule next check date based on frequency
 */
export function scheduleNextCheck(
  lastChecked: Date,
  frequency: string | null
): Date {
  if (!frequency) {
    return addMonths(lastChecked, 1); // Default to monthly
  }

  const freq = frequency.toLowerCase();
  
  if (freq.includes('daily')) {
    return addDays(lastChecked, 1);
  } else if (freq.includes('weekly')) {
    return addWeeks(lastChecked, 1);
  } else if (freq.includes('monthly')) {
    return addMonths(lastChecked, 1);
  } else if (freq.includes('quarterly')) {
    return addMonths(lastChecked, 3);
  } else if (freq.includes('annual') || freq.includes('yearly')) {
    return addMonths(lastChecked, 12);
  }

  return addMonths(lastChecked, 1);
}

/**
 * Generate compliance report summary
 */
export function generateComplianceReport(
  trackingRecords: ComplianceTracking[],
  requirements: ComplianceRequirement[]
): {
  score: number;
  totalRequirements: number;
  compliant: number;
  nonCompliant: number;
  pending: number;
  overdue: number;
  upcomingChecks: ComplianceTracking[];
} {
  const score = calculateComplianceScore(trackingRecords);
  const { critical, pending } = identifyGaps(trackingRecords);

  const today = new Date();
  const overdue = trackingRecords.filter(r => {
    if (!r.next_check_due) return false;
    return parseISO(r.next_check_due) < today && r.status !== 'compliant';
  });

  const upcomingChecks = trackingRecords
    .filter(r => {
      if (!r.next_check_due) return false;
      const dueDate = parseISO(r.next_check_due);
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue >= 0 && daysUntilDue <= 7;
    })
    .sort((a, b) => {
      if (!a.next_check_due || !b.next_check_due) return 0;
      return parseISO(a.next_check_due).getTime() - parseISO(b.next_check_due).getTime();
    });

  return {
    score,
    totalRequirements: trackingRecords.length,
    compliant: trackingRecords.filter(r => r.status === 'compliant').length,
    nonCompliant: critical.length,
    pending: pending.length,
    overdue: overdue.length,
    upcomingChecks,
  };
}

/**
 * Get compliance status badge variant for UI
 */
export function getComplianceStatusBadge(status: ComplianceStatus): {
  variant: 'default' | 'secondary' | 'destructive';
  label: string;
} {
  switch (status) {
    case 'compliant':
      return { variant: 'default', label: 'Compliant' };
    case 'non_compliant':
      return { variant: 'destructive', label: 'Non-Compliant' };
    case 'pending':
      return { variant: 'secondary', label: 'Pending' };
    default:
      return { variant: 'secondary', label: 'Unknown' };
  }
}

/**
 * Get compliance score color for UI
 */
export function getComplianceScoreColor(score: number): string {
  if (score >= 95) return 'text-green-600';
  if (score >= 80) return 'text-yellow-600';
  return 'text-destructive';
}

/**
 * Check if requirement is overdue
 */
export function isOverdue(tracking: ComplianceTracking): boolean {
  if (!tracking.next_check_due) return false;
  return parseISO(tracking.next_check_due) < new Date() && tracking.status !== 'compliant';
}

/**
 * Get days until next check
 */
export function getDaysUntilCheck(nextCheckDue: string | null): number | null {
  if (!nextCheckDue) return null;
  
  const today = new Date();
  const dueDate = parseISO(nextCheckDue);
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Prioritize compliance checks based on urgency
 */
export function prioritizeChecks(
  trackingRecords: ComplianceTracking[]
): ComplianceTracking[] {
  const today = new Date();

  return [...trackingRecords].sort((a, b) => {
    // Non-compliant first
    if (a.status === 'non_compliant' && b.status !== 'non_compliant') return -1;
    if (b.status === 'non_compliant' && a.status !== 'non_compliant') return 1;

    // Then overdue
    const aOverdue = isOverdue(a);
    const bOverdue = isOverdue(b);
    if (aOverdue && !bOverdue) return -1;
    if (bOverdue && !aOverdue) return 1;

    // Then by next check due date
    if (a.next_check_due && b.next_check_due) {
      return parseISO(a.next_check_due).getTime() - parseISO(b.next_check_due).getTime();
    }

    return 0;
  });
}

/**
 * Validate compliance evidence
 */
export function validateEvidence(evidenceUrls: string[]): {
  valid: boolean;
  message: string;
} {
  if (evidenceUrls.length === 0) {
    return { valid: false, message: 'No evidence provided' };
  }

  // Check if URLs are valid
  const invalidUrls = evidenceUrls.filter(url => {
    try {
      new URL(url);
      return false;
    } catch {
      return true;
    }
  });

  if (invalidUrls.length > 0) {
    return { valid: false, message: 'Some evidence URLs are invalid' };
  }

  return { valid: true, message: 'Evidence validated' };
}

/**
 * Get compliance trend over time
 */
export function getComplianceTrend(
  historicalScores: { date: string; score: number }[]
): 'improving' | 'declining' | 'stable' {
  if (historicalScores.length < 2) return 'stable';

  const sorted = [...historicalScores].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const recentScores = sorted.slice(-3);
  const olderScores = sorted.slice(0, -3);

  if (olderScores.length === 0) return 'stable';

  const recentAvg = recentScores.reduce((sum, s) => sum + s.score, 0) / recentScores.length;
  const olderAvg = olderScores.reduce((sum, s) => sum + s.score, 0) / olderScores.length;

  const difference = recentAvg - olderAvg;

  if (Math.abs(difference) < 3) return 'stable';
  if (difference > 0) return 'improving';
  return 'declining';
}
