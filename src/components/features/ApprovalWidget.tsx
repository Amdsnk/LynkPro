import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Send } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { Approval, DocumentEntityType, ApprovalStatus } from '@/types/types';

interface ApprovalWidgetProps {
  entityType: DocumentEntityType;
  entityId: string;
  onApprovalChange?: () => void;
}

export function ApprovalWidget({ entityType, entityId, onApprovalChange }: ApprovalWidgetProps) {
  const { profile } = useAuth();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovals();
  }, [entityType, entityId]);

  const fetchApprovals = async () => {
    const { data } = await supabase
      .from('approvals')
      .select('*, requester:profiles!requested_by(full_name, email), approver:profiles!requested_from(full_name, email)')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    if (data) setApprovals(data);
    setLoading(false);
  };

  const handleApproval = async (approvalId: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('approvals')
      .update({
        status,
        comments: comments || null,
        responded_at: new Date().toISOString(),
      })
      .eq('id', approvalId);

    if (error) {
      toast.error('Failed to update approval');
    } else {
      toast.success(`Approval ${status}`);
      setComments('');
      fetchApprovals();
      onApprovalChange?.();
    }
  };

  const getStatusBadge = (status: ApprovalStatus) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="mr-1 h-3 w-3" />Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Cancelled</Badge>;
    }
  };

  const pendingApproval = approvals.find(
    a => a.status === 'pending' && a.requested_from === profile?.id
  );

  if (loading) return <div>Loading approvals...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Approval Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pending Approval Action */}
        {pendingApproval && (
          <div className="border rounded-lg p-4 space-y-3 bg-accent/50">
            <p className="font-medium">Your approval is requested</p>
            <Textarea
              placeholder="Add comments (optional)"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={2}
            />
            <div className="flex gap-2">
              <Button
                onClick={() => handleApproval(pendingApproval.id, 'approved')}
                className="flex-1"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button
                onClick={() => handleApproval(pendingApproval.id, 'rejected')}
                variant="destructive"
                className="flex-1"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </div>
          </div>
        )}

        {/* Approval History */}
        <div className="space-y-3">
          {approvals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No approval requests
            </p>
          ) : (
            approvals.map((approval) => (
              <div key={approval.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  {getStatusBadge(approval.status)}
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(approval.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="text-sm">
                  <p>
                    <span className="font-medium">Requested by:</span>{' '}
                    {approval.requester?.full_name || approval.requester?.email}
                  </p>
                  <p>
                    <span className="font-medium">Requested from:</span>{' '}
                    {approval.approver?.full_name || approval.approver?.email}
                  </p>
                </div>
                {approval.comments && (
                  <p className="text-sm text-muted-foreground italic">
                    "{approval.comments}"
                  </p>
                )}
                {approval.responded_at && (
                  <p className="text-xs text-muted-foreground">
                    Responded: {format(new Date(approval.responded_at), 'MMM d, yyyy h:mm a')}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
