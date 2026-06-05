import { PurchaseRequisition, RequisitionStatus } from '@/types/types';

/**
 * Approval workflow configuration
 */
export interface ApprovalLevel {
  level: number;
  role: string;
  amountThreshold: number;
  description: string;
}

export const APPROVAL_LEVELS: ApprovalLevel[] = [
  {
    level: 1,
    role: 'staff',
    amountThreshold: 0,
    description: 'Staff can create requisitions',
  },
  {
    level: 2,
    role: 'admin',
    amountThreshold: 5000,
    description: 'Admin approval required for orders under $5,000',
  },
  {
    level: 3,
    role: 'admin',
    amountThreshold: Infinity,
    description: 'Admin approval required for all orders',
  },
];

/**
 * Determine required approval level based on amount
 */
export function getRequiredApprovalLevel(amount: number): number {
  if (amount >= 10000) return 3; // High-value orders need multiple approvals
  if (amount >= 5000) return 2;
  return 1;
}

/**
 * Check if user can approve requisition
 */
export function canApproveRequisition(
  userRole: string,
  requisitionAmount: number
): boolean {
  if (userRole === 'admin') return true;
  return false; // Only admins can approve
}

/**
 * Get next status after approval
 */
export function getNextStatus(
  currentStatus: RequisitionStatus,
  action: 'approve' | 'reject'
): RequisitionStatus {
  if (action === 'reject') return 'rejected';

  switch (currentStatus) {
    case 'draft':
      return 'pending_approval';
    case 'pending_approval':
      return 'approved';
    case 'approved':
      return 'ordered';
    case 'ordered':
      return 'received';
    default:
      return currentStatus;
  }
}

/**
 * Validate requisition before submission
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateRequisition(requisition: Partial<PurchaseRequisition>): ValidationResult {
  const errors: string[] = [];

  if (!requisition.project_id) {
    errors.push('Project is required');
  }

  if (!requisition.items || requisition.items.length === 0) {
    errors.push('At least one item is required');
  }

  if (requisition.items) {
    requisition.items.forEach((item, index) => {
      if (!item.material_id) {
        errors.push(`Item ${index + 1}: Material is required`);
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
      }
      if (!item.unit) {
        errors.push(`Item ${index + 1}: Unit is required`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate total estimated cost
 */
export function calculateTotalCost(
  items: Array<{ quantity: number; estimated_cost?: number }>
): number {
  return items.reduce((total, item) => {
    const itemCost = (item.estimated_cost || 0) * item.quantity;
    return total + itemCost;
  }, 0);
}

/**
 * Check if requisition needs budget approval
 */
export function needsBudgetApproval(
  requisitionAmount: number,
  projectBudget: number,
  projectSpent: number
): boolean {
  const remainingBudget = projectBudget - projectSpent;
  return requisitionAmount > remainingBudget * 0.8; // Alert if using >80% of remaining budget
}

/**
 * Generate requisition number
 */
export function generateRequisitionNumber(firmId: string, sequence: number): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const seq = sequence.toString().padStart(4, '0');
  return `REQ-${year}${month}-${seq}`;
}

/**
 * Get status badge variant
 */
export function getStatusBadgeVariant(
  status: RequisitionStatus
): 'default' | 'secondary' | 'destructive' {
  switch (status) {
    case 'approved':
    case 'ordered':
    case 'received':
      return 'default';
    case 'rejected':
      return 'destructive';
    default:
      return 'secondary';
  }
}

/**
 * Get status display text
 */
export function getStatusDisplayText(status: RequisitionStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Check if requisition can be edited
 */
export function canEditRequisition(status: RequisitionStatus): boolean {
  return status === 'draft' || status === 'rejected';
}

/**
 * Check if requisition can be deleted
 */
export function canDeleteRequisition(status: RequisitionStatus): boolean {
  return status === 'draft';
}

/**
 * Get available actions for requisition
 */
export interface RequisitionAction {
  action: string;
  label: string;
  variant: 'default' | 'outline' | 'destructive';
}

export function getAvailableActions(
  status: RequisitionStatus,
  userRole: string
): RequisitionAction[] {
  const actions: RequisitionAction[] = [];

  if (status === 'draft') {
    actions.push({ action: 'submit', label: 'Submit for Approval', variant: 'default' });
    actions.push({ action: 'edit', label: 'Edit', variant: 'outline' });
    actions.push({ action: 'delete', label: 'Delete', variant: 'destructive' });
  }

  if (status === 'pending_approval' && userRole === 'admin') {
    actions.push({ action: 'approve', label: 'Approve', variant: 'default' });
    actions.push({ action: 'reject', label: 'Reject', variant: 'destructive' });
  }

  if (status === 'approved') {
    actions.push({ action: 'create_po', label: 'Create Purchase Order', variant: 'default' });
  }

  if (status === 'ordered') {
    actions.push({ action: 'mark_received', label: 'Mark as Received', variant: 'default' });
  }

  return actions;
}
