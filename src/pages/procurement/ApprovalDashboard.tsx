import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { PurchaseRequisition } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getStatusBadgeVariant, getStatusDisplayText } from '@/lib/approvalWorkflow';
import { format, parseISO } from 'date-fns';

export default function ApprovalDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pendingRequisitions, setPendingRequisitions] = useState<PurchaseRequisition[]>([]);

  useEffect(() => {
    fetchPendingRequisitions();
  }, []);

  async function fetchPendingRequisitions() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('firm_id, role')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.firm_id || profile.role !== 'admin') {
        toast.error('Only admins can access approval dashboard');
        navigate('/requisitions');
        return;
      }

      const { data, error } = await supabase
        .from('purchase_requisitions')
        .select('*, projects(name), profiles!purchase_requisitions_requested_by_fkey(full_name)')
        .eq('firm_id', profile.firm_id)
        .eq('status', 'pending_approval')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingRequisitions(data || []);
    } catch (error) {
      console.error('Error fetching pending requisitions:', error);
      toast.error('Failed to load pending requisitions');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading approvals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Approval Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Review and approve pending purchase requisitions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending Approval
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pendingRequisitions.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${pendingRequisitions.reduce((sum, req) => sum + (req.total_estimated_cost || 0), 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${pendingRequisitions.length > 0
                  ? Math.round(pendingRequisitions.reduce((sum, req) => sum + (req.total_estimated_cost || 0), 0) / pendingRequisitions.length).toLocaleString()
                  : '0'}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pending Requisitions ({pendingRequisitions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingRequisitions.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <p className="text-muted-foreground">No pending approvals. All caught up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequisitions.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/requisitions/${req.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-medium">{req.requisition_number}</p>
                          <Badge variant={getStatusBadgeVariant(req.status)}>
                            {getStatusDisplayText(req.status)}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          Project: {(req as any).projects?.name || 'Unknown'}
                        </p>
                        
                        <p className="text-sm text-muted-foreground">
                          Requested by: {(req as any).profiles?.full_name || 'Unknown'}
                        </p>
                        
                        <div className="flex items-center gap-4 mt-3 text-sm">
                          <span className="text-muted-foreground">
                            Items: {req.items?.length || 0}
                          </span>
                          {req.total_estimated_cost && (
                            <span className="font-medium">
                              ${req.total_estimated_cost.toLocaleString()}
                            </span>
                          )}
                          <span className="text-muted-foreground">
                            {format(parseISO(req.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>

                      <Button size="sm" onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/requisitions/${req.id}`);
                      }}>
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
