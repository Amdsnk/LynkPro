import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { PurchaseRequisition } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { getStatusBadgeVariant, getStatusDisplayText } from '@/lib/approvalWorkflow';
import { format, parseISO } from 'date-fns';

export default function PurchaseRequisitionListPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchRequisitions();
  }, []);

  async function fetchRequisitions() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('firm_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.firm_id) return;

      const { data, error } = await supabase
        .from('purchase_requisitions')
        .select('*, projects(name), profiles!purchase_requisitions_requested_by_fkey(full_name)')
        .eq('firm_id', profile.firm_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequisitions(data || []);
    } catch (error) {
      console.error('Error fetching requisitions:', error);
      toast.error('Failed to load requisitions');
    } finally {
      setLoading(false);
    }
  }

  const filteredRequisitions = requisitions.filter(req => {
    const matchesSearch = req.requisition_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: requisitions.length,
    pending: requisitions.filter(r => r.status === 'pending_approval').length,
    approved: requisitions.filter(r => r.status === 'approved').length,
    rejected: requisitions.filter(r => r.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading requisitions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Purchase Requisitions</h1>
            <p className="text-muted-foreground mt-2">
              Manage material procurement requests and approvals
            </p>
          </div>
          <Button onClick={() => navigate('/requisitions/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Requisition
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Total Requisitions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending Approval
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Rejected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by requisition number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('all')}
                  size="sm"
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === 'draft' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('draft')}
                  size="sm"
                >
                  Draft
                </Button>
                <Button
                  variant={statusFilter === 'pending_approval' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('pending_approval')}
                  size="sm"
                >
                  Pending
                </Button>
                <Button
                  variant={statusFilter === 'approved' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('approved')}
                  size="sm"
                >
                  Approved
                </Button>
                <Button
                  variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('rejected')}
                  size="sm"
                >
                  Rejected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requisitions List */}
        <Card>
          <CardHeader>
            <CardTitle>Requisitions ({filteredRequisitions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredRequisitions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all'
                    ? 'No requisitions match your filters'
                    : 'No requisitions yet. Create your first requisition to get started.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRequisitions.map((req) => (
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
                            <span className="text-muted-foreground">
                              Est. Cost: ${req.total_estimated_cost.toLocaleString()}
                            </span>
                          )}
                          <span className="text-muted-foreground">
                            {format(parseISO(req.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
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
