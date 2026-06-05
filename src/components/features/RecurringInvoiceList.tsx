import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Repeat, Pause, Play, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { RecurringInvoice } from '@/types/types';

export function RecurringInvoiceList() {
  const { profile } = useAuth();
  const [invoices, setInvoices] = useState<RecurringInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.firm_id) {
      fetchInvoices();
    }
  }, [profile?.firm_id]);

  const fetchInvoices = async () => {
    if (!profile?.firm_id) return;
    setLoading(true);
    const { data } = await supabase
      .from('recurring_invoices')
      .select(`
        *,
        client:clients(id, name, email)
      `)
      .eq('firm_id', profile.firm_id)
      .order('created_at', { ascending: false });

    if (data) setInvoices(data as any);
    setLoading(false);
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('recurring_invoices')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success(currentStatus ? 'Recurring invoice paused' : 'Recurring invoice resumed');
      fetchInvoices();
    }
  };

  const deleteInvoice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recurring invoice?')) return;

    const { error } = await supabase
      .from('recurring_invoices')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete recurring invoice');
    } else {
      toast.success('Recurring invoice deleted');
      fetchInvoices();
    }
  };

  const getFrequencyBadge = (frequency: string) => {
    const colors: Record<string, string> = {
      weekly: 'bg-blue-100 text-blue-800',
      monthly: 'bg-green-100 text-green-800',
      quarterly: 'bg-purple-100 text-purple-800',
      yearly: 'bg-orange-100 text-orange-800',
    };
    return (
      <Badge className={colors[frequency] || 'bg-gray-100 text-gray-800'}>
        {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return <p className="text-center text-muted-foreground py-8">Loading...</p>;
  }

  if (invoices.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Repeat className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No recurring invoices</p>
          <p className="text-sm text-muted-foreground">
            Create a recurring invoice to automatically generate invoices
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {invoices.map((invoice) => (
        <Card key={invoice.id}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg">{invoice.client?.name}</h3>
                  {getFrequencyBadge(invoice.frequency)}
                  {invoice.is_active ? (
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  ) : (
                    <Badge variant="outline">Paused</Badge>
                  )}
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Next invoice: {format(new Date(invoice.next_generation_date), 'PPP')}
                  </p>
                  <p>
                    Amount: ${(invoice.template_data as any)?.total_amount?.toFixed(2) || '0.00'}
                  </p>
                  <p>
                    Created: {format(new Date(invoice.created_at), 'PPP')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleActive(invoice.id, invoice.is_active)}
                >
                  {invoice.is_active ? (
                    <>
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-1" />
                      Resume
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteInvoice(invoice.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
