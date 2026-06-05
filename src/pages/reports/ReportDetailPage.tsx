import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { getReport, updateReport, createAuditLog, getFirm } from '@/lib/api';
import { downloadReportPDF, generateReportPDF, CompanyInfo, ClientInfo } from '@/lib/pdf';
import { supabase } from '@/db/supabase';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { AuditLogList } from '@/components/shared/AuditLogList';
import type { Report, ReportStatus } from '@/types/types';
import { ArrowLeft, Download, Mail, Edit, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export default function ReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, isClient } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      if (!id) return;
      try {
        const data = await getReport(id);
        setReport(data);
      } catch (error) {
        console.error('Error fetching report:', error);
        toast.error('Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  const handleDownloadPDF = async () => {
    if (!report || !profile?.firm_id) return;
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
        name: report.client?.name || 'N/A',
        email: report.client?.email || undefined,
        phone: report.client?.phone || undefined,
        address: report.client?.address || undefined,
        city: report.client?.city || undefined,
        state: report.client?.state || undefined,
        zip: report.client?.zip || undefined,
      };

      // Get photo URLs if available
      const photoUrls: string[] = [];
      if (report.photos && report.photos.length > 0) {
        for (const photo of report.photos) {
          const { data } = supabase.storage
            .from('report-photos')
            .getPublicUrl(photo);
          if (data?.publicUrl) {
            photoUrls.push(data.publicUrl);
          }
        }
      }

      await downloadReportPDF(report, company, client, photoUrls);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!report || !profile?.id || !profile?.firm_id) return;
    
    if (!report.client?.email) {
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
        name: report.client.name,
        email: report.client.email,
        phone: report.client.phone || undefined,
        address: report.client.address || undefined,
        city: report.client.city || undefined,
        state: report.client.state || undefined,
        zip: report.client.zip || undefined,
      };

      // Get photo URLs if available
      const photoUrls: string[] = [];
      if (report.photos && report.photos.length > 0) {
        for (const photo of report.photos) {
          const { data } = supabase.storage
            .from('report-photos')
            .getPublicUrl(photo);
          if (data?.publicUrl) {
            photoUrls.push(data.publicUrl);
          }
        }
      }

      // Generate PDF
      const pdfBlob = await generateReportPDF(report, company, client, photoUrls);
      
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
          to: report.client.email,
          subject: `Field Review Report: ${report.title}`,
          documentType: 'report',
          documentNumber: report.report_number || 'Draft',
          pdfBase64,
          message: `Please find attached the field review report for ${report.project?.name || 'your project'}. ${report.ai_narrative || report.summary || ''}`,
          firmName: firm.name,
        },
      });

      if (error) throw error;

      await updateReport(report.id, { status: 'sent' });
      await createAuditLog({ 
        firm_id: profile.firm_id!,
        entity_type: 'report',
        entity_id: report.id,
        action: 'sent',
        details: { recipient: report.client.email },
        user_id: profile.id!,
      });

      setReport({ ...report, status: 'sent' });
      toast.success('Report sent successfully');
    } catch (error) {
      console.error('Error sending report:', error);
      toast.error('Failed to send report');
    } finally {
      setSending(false);
    }
  };

  const handleApprove = async () => {
    if (!report || !profile?.id) return;
    setApproving(true);
    try {
      const approvedAt = new Date().toISOString();
      await updateReport(report.id, { 
        status: 'sent', 
        approved_at: approvedAt,
        approved_by: profile.id,
      });
      await createAuditLog({ firm_id: profile.firm_id!,
        entity_type: 'report',
        entity_id: report.id,
        action: 'approved',
        details: { approved_at: approvedAt, approved_by: profile.id },
        user_id: profile.id!,
      });

      setReport({ ...report, status: 'sent', approved_at: approvedAt, approved_by: profile.id });
      toast.success('Report approved');
    } catch (error) {
      console.error('Error approving report:', error);
      toast.error('Failed to approve report');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!report || !profile?.id) return;
    setApproving(true);
    try {
      await updateReport(report.id, { status: 'draft' });
      await createAuditLog({ firm_id: profile.firm_id!,
        entity_type: 'report',
        entity_id: report.id,
        action: 'rejected',
        details: { rejected_by: profile.id },
        user_id: profile.id!,
      });

      setReport({ ...report, status: 'draft' });
      toast.success('Report rejected');
    } catch (error) {
      console.error('Error rejecting report:', error);
      toast.error('Failed to reject report');
    } finally {
      setApproving(false);
    }
  };

  const handleStatusChange = async (newStatus: ReportStatus) => {
    if (!report || !profile?.id) return;
    try {
      await updateReport(report.id, { status: newStatus });
      await createAuditLog({ firm_id: profile.firm_id!,
        entity_type: 'report',
        entity_id: report.id,
        action: 'status_changed',
        details: { old_status: report.status, new_status: newStatus },
        user_id: profile.id!,
      });

      setReport({ ...report, status: newStatus });
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

  if (!report) {
    return (
      <div className="empty-state">
        <p className="empty-state-title">Report not found</p>
        <Button className="mt-4" onClick={() => navigate('/reports')}>
          Back to Reports
        </Button>
      </div>
    );
  }

  return (
    <div className="section-spacing">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="page-title">{report.title}</h1>
            <p className="text-muted-foreground mt-1">
              Created {new Date(report.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isClient && report.status === 'draft' && (
            <Link to={`/reports/${report.id}/edit`}>
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
          {!isClient && report.status === 'draft' && (
            <Button size="sm" onClick={handleSendEmail} disabled={sending}>
              {sending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Send to Client
            </Button>
          )}
          {!isClient && report.status === 'sent' && (
            <>
              <Button size="sm" variant="default" onClick={handleApprove} disabled={approving}>
                {approving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Approve
              </Button>
              <Button size="sm" variant="destructive" onClick={handleReject} disabled={approving}>
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 card-enhanced">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Report Details</CardTitle>
              <StatusBadge status={report.status} type="report" />
            </div>
          </CardHeader>
          <CardContent className="content-spacing">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Project</p>
                <p className="font-medium">{report.project?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Client</p>
                <p className="font-medium">{report.client?.name}</p>
              </div>
              {report.approved_at && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Approved On</p>
                  <p className="font-medium text-success">{new Date(report.approved_at).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            {report.field_notes && (
              <div>
                <h3 className="font-semibold mb-2">Field Notes</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {report.field_notes}
                </p>
              </div>
            )}

            {report.narrative && (
              <div>
                <h3 className="font-semibold mb-2">Professional Narrative</h3>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {report.narrative}
                </p>
              </div>
            )}

            {report.photos && report.photos.length > 0 && (
              <div>
                <h3 className="font-semibold mb-4">Photos ({report.photos.length})</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {report.photos.map((photo, index) => (
                    <a
                      key={index}
                      href={photo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group"
                    >
                      <img
                        src={photo}
                        alt={`Report photo ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg border border-border group-hover:border-primary/50 transition-smooth"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {report.disclaimer && (
              <Card className="border-info/20 bg-info/5">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-info mt-0.5" />
                    <CardTitle className="text-lg">Disclaimer</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground leading-relaxed">
                    {report.disclaimer}
                  </p>
                </CardContent>
              </Card>
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
                <Select value={report.status} onValueChange={(value) => handleStatusChange(value as ReportStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
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
              <AuditLogList entityType="report" entityId={report.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
