import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { getProposal, updateProposal, createAuditLog, getFirm } from '@/lib/api';
import { downloadProposalPDF, generateProposalPDF, CompanyInfo, ClientInfo } from '@/lib/pdf';
import { supabase } from '@/db/supabase';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { AuditLogList } from '@/components/shared/AuditLogList';
import type { Proposal, ProposalStatus } from '@/types/types';
import { ArrowLeft, Download, Mail, Edit, Loader2 } from 'lucide-react';

export default function ProposalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, isClient } = useAuth();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchProposal = async () => {
      if (!id) return;
      try {
        const data = await getProposal(id);
        setProposal(data);
      } catch (error) {
        console.error('Error fetching proposal:', error);
        toast.error('Failed to load proposal');
      } finally {
        setLoading(false);
      }
    };

    fetchProposal();
  }, [id]);

  const handleDownloadPDF = async () => {
    if (!proposal || !profile?.firm_id) return;
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
        name: proposal.client?.name || 'N/A',
        email: proposal.client?.email || undefined,
        phone: proposal.client?.phone || undefined,
        address: proposal.client?.address || undefined,
        city: proposal.client?.city || undefined,
        state: proposal.client?.state || undefined,
        zip: proposal.client?.zip || undefined,
      };

      await downloadProposalPDF(proposal, company, client);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!proposal || !profile?.id || !profile?.firm_id) return;
    
    if (!proposal.client?.email) {
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
        name: proposal.client.name,
        email: proposal.client.email,
        phone: proposal.client.phone || undefined,
        address: proposal.client.address || undefined,
        city: proposal.client.city || undefined,
        state: proposal.client.state || undefined,
        zip: proposal.client.zip || undefined,
      };

      // Generate PDF
      const pdfBlob = await generateProposalPDF(proposal, company, client);
      
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
          to: proposal.client.email,
          subject: `Proposal: ${proposal.title}`,
          documentType: 'proposal',
          documentNumber: proposal.proposal_number || 'Draft',
          pdfBase64,
          message: `Please find attached the proposal for ${proposal.project?.name || 'your project'}. Review the details and let us know if you have any questions.`,
          firmName: firm.name,
        },
      });

      if (error) throw error;

      await updateProposal(proposal.id, { status: 'sent' });
      await createAuditLog({ 
        firm_id: profile.firm_id!,
        entity_type: 'proposal',
        entity_id: proposal.id,
        action: 'sent',
        details: { recipient: proposal.client.email },
        user_id: profile.id!,
      });

      setProposal({ ...proposal, status: 'sent' });
      toast.success('Proposal sent successfully');
    } catch (error) {
      console.error('Error sending proposal:', error);
      toast.error('Failed to send proposal');
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus: ProposalStatus) => {
    if (!proposal || !profile?.id) return;
    try {
      await updateProposal(proposal.id, { status: newStatus });
      await createAuditLog({ firm_id: profile.firm_id!,
        entity_type: 'proposal',
        entity_id: proposal.id,
        action: 'status_changed',
        details: { old_status: proposal.status, new_status: newStatus },
        user_id: profile.id!,
      });

      setProposal({ ...proposal, status: newStatus });
      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 bg-muted" />
        <Skeleton className="h-96 bg-muted" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Proposal not found</p>
        <Button className="mt-4" onClick={() => navigate('/proposals')}>
          Back to Proposals
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/proposals')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-semibold text-foreground">Proposal Details</h1>
        </div>
        <div className="flex items-center gap-2">
          {!isClient && proposal.status === 'draft' && (
            <Link to={`/proposals/${proposal.id}/edit`}>
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
          {!isClient && proposal.status === 'draft' && (
            <Button size="sm" onClick={handleSendEmail} disabled={sending}>
              {sending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Send to Client
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{proposal.title}</CardTitle>
              <StatusBadge status={proposal.status} type="proposal" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Project</p>
                <p className="font-medium">{proposal.project?.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Client</p>
                <p className="font-medium">{proposal.client?.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium">{new Date(proposal.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Amount</p>
                <p className="font-medium text-lg">${proposal.total_amount?.toFixed(2) || '0.00'}</p>
              </div>
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
                  {(proposal.line_items || proposal.items || []).map((item, index) => {
                    const itemTotal = 'total' in item ? item.total : 'amount' in item ? item.amount : 0;
                    return (
                      <TableRow key={index}>
                        <TableCell>{item.description}</TableCell>
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
                    <TableCell className="text-right font-semibold">
                      ${proposal.total_amount?.toFixed(2) || '0.00'}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {proposal.content && typeof proposal.content === 'object' && 'terms' in proposal.content && (
              <div>
                <h3 className="font-semibold mb-2">Terms & Conditions</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {String(proposal.content.terms)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {!isClient && (
            <Card>
              <CardHeader>
                <CardTitle>Status Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={proposal.status} onValueChange={(value) => handleStatusChange(value as ProposalStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <AuditLogList entityType="proposal" entityId={proposal.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
