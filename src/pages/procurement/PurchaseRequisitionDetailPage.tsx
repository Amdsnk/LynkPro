import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { PurchaseRequisition } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getStatusBadgeVariant, getStatusDisplayText } from '@/lib/approvalWorkflow';
import { format, parseISO } from 'date-fns';

export default function PurchaseRequisitionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [requisition, setRequisition] = useState<PurchaseRequisition | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (id) {
      fetchRequisition();
    }
  }, [id]);

  async function fetchRequisition() {
    try {
      const { data, error } = await supabase
        .from('purchase_requisitions')
        .select('*, projects(name), profiles!purchase_requisitions_requested_by_fkey(full_name)')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error('Requisition not found');
        navigate('/requisitions');
        return;
      }

      setRequisition(data);
    } catch (error) {
      console.error('Error fetching requisition:', error);
      toast.error('Failed to load requisition');
    } finally {
      setLoading(false);
    }
  }

  async function handleApproval(approved: boolean) {
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('purchase_requisitions')
        .update({
          status: approved ? 'approved' : 'rejected',
          approval_notes: approvalNotes || null,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Requisition ${approved ? 'approved' : 'rejected'} successfully`);
      fetchRequisition();
    } catch (error) {
      console.error('Error updating requisition:', error);
      toast.error('Failed to update requisition');
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading requisition...</p>
        </div>
      </div>
    );
  }

  if (!requisition) return null;

  const canApprove = requisition.status === 'pending_approval';

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/requisitions')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{requisition.requisition_number}</h1>
                <Badge variant={getStatusBadgeVariant(requisition.status)}>
                  {getStatusDisplayText(requisition.status)}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">Purchase Requisition Details</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Project</p>
                <p className="font-medium">{(requisition as any).projects?.name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Requested By</p>
                <p className="font-medium">{(requisition as any).profiles?.full_name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{format(parseISO(requisition.created_at), 'MMM d, yyyy')}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cost Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="font-medium">{requisition.items?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estimated Cost</p>
                <p className="text-2xl font-bold">
                  ${(requisition.total_estimated_cost || 0).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            {requisition.items && requisition.items.length > 0 ? (
              <div className="space-y-2">
                {requisition.items.map((item, index) => (
                  <div key={index} className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Material ID: {item.material_id}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity} {item.unit}
                        </p>
                      </div>
                      {item.estimated_cost && (
                        <p className="font-medium">
                          ${(item.estimated_cost * item.quantity).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No items</p>
            )}
          </CardContent>
        </Card>

        {canApprove && (
          <Card>
            <CardHeader>
              <CardTitle>Approval</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Approval Notes</label>
                <Textarea
                  placeholder="Add notes about this approval decision..."
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => handleApproval(true)}
                  disabled={processing}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleApproval(false)}
                  disabled={processing}
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {requisition.approval_notes && (
          <Card>
            <CardHeader>
              <CardTitle>Approval Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{requisition.approval_notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
