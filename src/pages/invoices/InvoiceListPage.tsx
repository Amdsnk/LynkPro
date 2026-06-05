import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/data-table/DataTable';
import { invoiceColumns } from '@/components/data-table/columns/invoice-columns';
import { exportToCSV } from '@/lib/export';
import { useRealtimeInvoices } from '@/hooks/useRealtimeData';
import type { Invoice } from '@/types/types';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function InvoiceListPage() {
  const { profile, isClient } = useAuth();
  const navigate = useNavigate();
  
  // Real-time invoices
  const { invoices, loading } = useRealtimeInvoices(profile?.firm_id);

  const handleBulkDelete = async (selectedInvoices: Invoice[]) => {
    const ids = selectedInvoices.map(i => i.id);
    const { error } = await supabase
      .from('invoices')
      .delete()
      .in('id', ids);

    if (error) {
      throw error;
    }
  };

  const handleExport = (invoicesToExport: Invoice[]) => {
    exportToCSV(
      invoicesToExport.map(i => ({
        invoice_number: i.invoice_number,
        title: i.title || '',
        client: i.client?.name || 'No client',
        status: i.status,
        total_amount: i.total_amount,
        paid_amount: i.paid_amount || 0,
        due_date: i.due_date,
        issue_date: i.issue_date || '',
        created_at: new Date(i.created_at).toLocaleDateString(),
      })),
      `invoices-${new Date().toISOString().split('T')[0]}`
    );
  };

  if (loading) {
    return (
      <div className="section-spacing">
        <Skeleton className="h-12 w-64 bg-muted" />
        <div className="mt-8">
          <Skeleton className="h-96 bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="section-spacing">
      <PageHeader
        title="Invoices"
        description={`${invoices.length} ${invoices.length === 1 ? 'invoice' : 'invoices'} total`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Invoices' },
        ]}
        actions={
          !isClient && (
            <Button asChild>
              <Link to="/invoices/new">
                <Plus className="mr-2 h-4 w-4" />
                New Invoice
              </Link>
            </Button>
          )
        }
      />

      <DataTable
        columns={invoiceColumns}
        data={invoices}
        searchKey="invoice_number"
        searchPlaceholder="Search invoices..."
        onRowClick={(invoice) => navigate(`/invoices/${invoice.id}`)}
        onBulkDelete={!isClient ? handleBulkDelete : undefined}
        onExport={handleExport}
        storageKey="invoices"
      />
    </div>
  );
}
