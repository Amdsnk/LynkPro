import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { ChangeOrder } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileEdit, Plus, Search, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

export default function ChangeOrderListPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchChangeOrders();
  }, []);

  async function fetchChangeOrders() {
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
        .from('change_orders')
        .select('*')
        .eq('firm_id', profile.firm_id)
        .order('request_date', { ascending: false });

      if (error) throw error;

      setChangeOrders(data || []);
    } catch (error) {
      console.error('Error fetching change orders:', error);
      toast.error('Failed to load change orders');
    } finally {
      setLoading(false);
    }
  }

  const filteredOrders = changeOrders.filter(order => {
    const matchesSearch = order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.co_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function getStatusBadge(status: string): 'default' | 'secondary' | 'destructive' {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      case 'implemented': return 'default';
      default: return 'secondary';
    }
  }

  function formatCurrency(amount: number | null): string {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  const stats = {
    total: changeOrders.length,
    pending: changeOrders.filter(co => co.status === 'pending').length,
    approved: changeOrders.filter(co => co.status === 'approved').length,
    totalCostImpact: changeOrders.reduce((sum, co) => sum + (co.cost_impact || 0), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading change orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileEdit className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Change Orders</h1>
            </div>
            <p className="text-muted-foreground mt-2">
              Manage project change requests and approvals
            </p>
          </div>
          <Button onClick={() => navigate('/change-orders/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Change Order
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Change Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Approval
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
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
                <TrendingUp className="h-4 w-4" />
                Total Cost Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(stats.totalCostImpact)}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search change orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === 'pending' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('pending')}
                >
                  Pending
                </Button>
                <Button
                  variant={statusFilter === 'approved' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('approved')}
                >
                  Approved
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <FileEdit className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' ? 'No change orders found matching your filters' : 'No change orders yet'}
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate('/change-orders/new')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Change Order
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/change-orders/${order.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-medium">{order.co_number}</p>
                          <Badge variant={getStatusBadge(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{order.title}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">Request Date</p>
                            <p className="font-medium">{format(parseISO(order.request_date), 'MMM d, yyyy')}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Cost Impact</p>
                            <p className={`font-medium ${order.cost_impact && order.cost_impact > 0 ? 'text-destructive' : 'text-green-600'}`}>
                              {formatCurrency(order.cost_impact)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Schedule Impact</p>
                            <p className="font-medium">
                              {order.schedule_impact_days ? `${order.schedule_impact_days} days` : 'None'}
                            </p>
                          </div>
                          {order.approval_date && (
                            <div>
                              <p className="text-muted-foreground">Approved</p>
                              <p className="font-medium">{format(parseISO(order.approval_date), 'MMM d, yyyy')}</p>
                            </div>
                          )}
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
