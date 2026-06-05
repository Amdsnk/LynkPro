import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Receipt, RefreshCw, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { Order } from '@/types/types';

export default function OrderHistoryPage() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.id) {
      fetchOrders();
    }
  }, [profile?.id]);

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', profile?.id)
      .order('created_at', { ascending: false });

    if (data) setOrders(data);
    setLoading(false);
  };

  const refreshOrderStatus = async (order: Order) => {
    if (!order.stripe_session_id) return;

    setRefreshing(order.id);
    try {
      const { data, error } = await supabase.functions.invoke('verify_stripe_payment', {
        body: { sessionId: order.stripe_session_id },
      });

      if (error) {
        const errorMsg = await error?.context?.text();
        throw new Error(errorMsg || error.message);
      }

      if (data?.data?.verified) {
        toast.success('Payment verified!');
        fetchOrders();
      } else {
        toast.info('Payment still pending');
      }
    } catch (error) {
      console.error('Refresh error:', error);
      toast.error('Failed to refresh status');
    } finally {
      setRefreshing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>;
      case 'refunded':
        return <Badge className="bg-blue-100 text-blue-800">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <div>Loading orders...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Order History"
        description="View your payment history and order details"
      />

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No orders yet</p>
            <p className="text-sm text-muted-foreground">
              Your payment history will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">Order #{order.id.slice(0, 8)}</h3>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(order.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      ${order.total_amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground uppercase">
                      {order.currency}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="border-t pt-4 space-y-2">
                  {Array.isArray(order.items) && order.items.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                      <span className="font-medium">
                        ${((item.price * item.quantity) / 100).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Customer Details */}
                {(order.customer_name || order.customer_email) && (
                  <div className="border-t mt-4 pt-4 space-y-1">
                    {order.customer_name && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Customer:</span>{' '}
                        {order.customer_name}
                      </p>
                    )}
                    {order.customer_email && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Email:</span>{' '}
                        {order.customer_email}
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  {order.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => refreshOrderStatus(order)}
                      disabled={refreshing === order.id}
                    >
                      {refreshing === order.id ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Checking...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Refresh Status
                        </>
                      )}
                    </Button>
                  )}
                  {order.stripe_payment_intent_id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(order.stripe_payment_intent_id!);
                        toast.success('Payment ID copied');
                      }}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Copy Payment ID
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
