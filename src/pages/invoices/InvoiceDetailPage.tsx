import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { getInvoice, updateInvoice, createAuditLog, getFirm } from '@/lib/api';
import { downloadInvoicePDF, generateInvoicePDF, CompanyInfo, ClientInfo } from '@/lib/pdf';
import { supabase } from '@/db/supabase';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { AuditLogList } from '@/components/shared/AuditLogList';
import type { Invoice, InvoiceStatus } from '@/types/types';
import { ArrowLeft, Download, Mail, Edit, Loader2, CheckCircle2, Clock, CreditCard } from 'lucide-react';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, isClient } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!id) return;
      try {
        const data = await getInvoice(id);
        setInvoice(data);
      } catch (error) {
        console.error('Error fetching invoice:', error);
        toast.error('Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  const handleDownloadPDF = async () => {
    if (!invoice || !profile?.firm_id) return;
    setDownloading(true);
    try {
      const firm = await getFirm(profile.firm_id);
      
      const company: CompanyInfo = {
        name: firm.name,
        address: firm.address || undefined,
        city: firm.city || undefined,
        state: firm.state || undefined,
        zip: firm.zip || undefined,
        phone: firm.phone || undefined,
        email: firm.email || undefined,
        website: firm.website || undefined,
        logo: firm.logo_url || undefined,
      };

      const client: ClientInfo = {
        name: invoice.client?.name || 'N/A',
        email: invoice.client?.email || undefined,
        phone: invoice.client?.phone || undefined,
        address: invoice.client?.address || undefined,
        city: invoice.client?.city || undefined,
        state: invoice.client?.state || undefined,
        zip: invoice.client?.zip || undefined,
      };

      await downloadInvoicePDF(invoice, company, client);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!invoice || !profile?.id || !profile?.firm_id) return;
    
    if (!invoice.client?.email) {
      toast.error('Client email not found');
      return;
    }

    setSending(true);
    try {
      const firm = await getFirm(profile.firm_id);
      
      const company: CompanyInfo = {
        name: firm.name,
        address: firm.address || undefined,
        city: firm.city || undefined,
        state: firm.state || undefined,
        zip: firm.zip || undefined,
        phone: firm.phone || undefined,
        email: firm.email || undefined,
        website: firm.website || undefined,
        logo: firm.logo_url || undefined,
      };

      const client: ClientInfo = {
        name: invoice.client.name,
        email: invoice.client.email,
        phone: invoice.client.phone || undefined,
        address: invoice.client.address || undefined,
        city: invoice.client.city || undefined,
        state: invoice.client.state || undefined,
        zip: invoice.client.zip || undefined,
      };

      // Generate PDF
      const pdfBlob = await generateInvoicePDF(invoice, company, client);
      
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(pdfBlob);
      });
      const pdfBase64 = await base64Promise;

      // Send email with PDF attachment
      const { error } = await supabase.functions.invoke('send-document', {
        body: {
          to: invoice.client.email,
          subject: `Invoice ${invoice.invoice_number}`,
          documentType: 'invoice',
          documentNumber: invoice.invoice_number,
          pdfBase64,
          message: `Please find attached invoice ${invoice.invoice_number} for ${invoice.project?.name || 'your project'}. Total amount: $${invoice.total_amount.toFixed(2)}. Due date: ${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'Upon receipt'}.`,
          firmName: firm.name,
        },
      });

      if (error) throw error;

      await updateInvoice(invoice.id, { status: 'sent' });
      await createAuditLog({ 
        firm_id: profile.firm_id!,
        entity_type: 'invoice',
        entity_id: invoice.id,
        action: 'sent',
        details: { recipient: invoice.client.email },
        user_id: profile.id!,
      });

      setInvoice({ ...invoice, status: 'sent' });
      toast.success('Invoice sent successfully');
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error('Failed to send invoice');
    } finally {
      setSending(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!invoice || !profile?.id) return;
    setMarkingPaid(true);
    try {
      const paidAt = new Date().toISOString();
      await updateInvoice(invoice.id, { status: 'paid', paid_at: paidAt });
      await createAuditLog({ firm_id: profile.firm_id!,
        entity_type: 'invoice',
        entity_id: invoice.id,
        action: 'status_changed',
        details: { old_status: invoice.status, new_status: 'paid', paid_at: paidAt },
        user_id: profile.id!,
      });

      setInvoice({ ...invoice, status: 'paid', paid_at: paidAt });
      toast.success('Invoice marked as paid');
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      toast.error('Failed to update invoice');
    } finally {
      setMarkingPaid(false);
    }
  };

  const handlePayInvoice = async () => {
    if (!invoice) return;
    setProcessingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke('create_stripe_checkout', {
        body: {
          items: [
            {
              name: `Invoice ${invoice.invoice_number}`,
              price: invoice.total_amount,
              quantity: 1,
            }
          ],
          invoiceId: invoice.id,
        }
      });

      if (error) {
        const errorMsg = await error?.context?.text();
        throw new Error(errorMsg || error.message);
      }

      if (data?.data?.url) {
        window.open(data.data.url, '_blank');
        toast.success('Redirecting to payment page...');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to initiate payment. Please ensure STRIPE_SECRET_KEY is configured.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleStatusChange = async (newStatus: InvoiceStatus) => {
    if (!invoice || !profile?.id) return;
    try {
      await updateInvoice(invoice.id, { status: newStatus });
      await createAuditLog({ firm_id: profile.firm_id!,
        entity_type: 'invoice',
        entity_id: invoice.id,
        action: 'status_changed',
        details: { old_status: invoice.status, new_status: newStatus },
        user_id: profile.id!,
      });

      setInvoice({ ...invoice, status: newStatus });
      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="section-spacing">
        <Skeleton className="h-12 w-96 bg-muted" />
        <Skeleton className="h-96 bg-muted" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="empty-state">
        <p className="empty-state-title">Invoice not found</p>
        <Button className="mt-4" onClick={() => navigate('/invoices')}>
          Back to Invoices
        </Button>
      </div>
    );
  }

  const daysUntilDue = invoice.due_date 
    ? Math.ceil((new Date(invoice.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="section-spacing">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="page-title">Invoice {invoice.invoice_number}</h1>
            <p className="text-muted-foreground mt-1">
              Created {new Date(invoice.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isClient && invoice.status === 'draft' && (
            <Link to={`/invoices/${invoice.id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
          )}
          <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={downloading}>
            {downloading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Download PDF
          </Button>
          {!isClient && invoice.status === 'draft' && (
            <Button size="sm" onClick={handleSendEmail} disabled={sending}>
              {sending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Send to Client
            </Button>
          )}
          {invoice.status !== 'paid' && (
            <Button size="sm" variant="default" onClick={handlePayInvoice} disabled={processingPayment}>
              {processingPayment ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              Pay Invoice
            </Button>
          )}
          {!isClient && invoice.status !== 'paid' && (
            <Button size="sm" variant="outline" onClick={handleMarkAsPaid} disabled={markingPaid}>
              {markingPaid ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Mark as Paid
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 card-enhanced">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Invoice Details</CardTitle>
              <StatusBadge status={invoice.status} type="invoice" />
            </div>
          </CardHeader>
          <CardContent className="content-spacing">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Project</p>
                <p className="font-medium">{invoice.project?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Client</p>
                <p className="font-medium">{invoice.client?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Invoice Number</p>
                <p className="font-medium">{invoice.invoice_number}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                <p className="text-2xl font-semibold text-foreground">${invoice.total_amount.toFixed(2)}</p>
              </div>
              {invoice.due_date && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Due Date</p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{new Date(invoice.due_date).toLocaleDateString()}</p>
                    {daysUntilDue !== null && invoice.status !== 'paid' && (
                      <span className={`text-xs px-2 py-1 rounded-md ${
                        daysUntilDue < 0 
                          ? 'bg-destructive/10 text-destructive' 
                          : daysUntilDue < 7 
                          ? 'bg-warning/10 text-warning' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days left`}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {invoice.paid_at && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Paid On</p>
                  <p className="font-medium text-success">{new Date(invoice.paid_at).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-4">Line Items</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(invoice.line_items || invoice.items || []).map((item, index) => {
                    const itemTotal = 'total' in item ? item.total : 'amount' in item ? item.amount : 0;
                    return (
                      <TableRow key={index}>
                        <TableCell className="max-w-md">
                          <p className="whitespace-pre-wrap">{item.description}</p>
                        </TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">${item.unit_price?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell className="text-right">${(itemTotal || 0).toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-semibold">
                      Total:
                    </TableCell>
                    <TableCell className="text-right font-semibold text-lg">
                      ${invoice.total_amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {invoice.notes && (
              <div>
                <h3 className="font-semibold mb-2">Notes</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {invoice.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {!isClient && (
            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle className="text-xl">Status Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={invoice.status} onValueChange={(value) => handleStatusChange(value as InvoiceStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="text-xl">Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <AuditLogList entityType="invoice" entityId={invoice.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
