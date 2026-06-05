import { Badge } from '@/components/ui/badge';
import type { ProposalStatus, InvoiceStatus, ReportStatus, ProjectStatus } from '@/types/types';

interface StatusBadgeProps {
  status: ProposalStatus | InvoiceStatus | ReportStatus | ProjectStatus;
  type: 'proposal' | 'invoice' | 'report' | 'project';
}

export function StatusBadge({ status, type }: StatusBadgeProps) {
  const getVariant = () => {
    if (type === 'proposal') {
      switch (status) {
        case 'draft': return 'secondary';
        case 'sent': return 'default';
        case 'accepted': return 'default';
        case 'rejected': return 'destructive';
        default: return 'secondary';
      }
    }
    if (type === 'invoice') {
      switch (status) {
        case 'draft': return 'secondary';
        case 'sent': return 'default';
        case 'paid': return 'default';
        case 'overdue': return 'destructive';
        default: return 'secondary';
      }
    }
    if (type === 'report') {
      switch (status) {
        case 'draft': return 'secondary';
        case 'sent': return 'default';
        default: return 'secondary';
      }
    }
    if (type === 'project') {
      switch (status) {
        case 'active': return 'default';
        case 'on_hold': return 'secondary';
        case 'completed': return 'default';
        case 'archived': return 'outline';
        default: return 'secondary';
      }
    }
    return 'secondary';
  };

  const getClassName = () => {
    if (type === 'proposal') {
      if (status === 'accepted') return 'bg-success/20 text-success hover:bg-success/30';
    }
    if (type === 'invoice') {
      if (status === 'paid') return 'bg-success/20 text-success hover:bg-success/30';
    }
    return '';
  };

  return (
    <Badge variant={getVariant()} className={getClassName()}>
      {status.replace('_', ' ')}
    </Badge>
  );
}
