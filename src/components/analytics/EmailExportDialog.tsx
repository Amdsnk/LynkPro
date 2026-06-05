import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Mail, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import type { ExportData } from '@/lib/exportAnalytics';
import type { EmailTemplate } from '@/types/types';
import { TemplateManager } from './TemplateManager';

interface EmailExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ExportData;
}

export function EmailExportDialog({ open, onOpenChange, data }: EmailExportDialogProps) {
  const [recipients, setRecipients] = useState('');
  const [subject, setSubject] = useState('LynkPro Share Analytics Report');
  const [message, setMessage] = useState('');
  const [formats, setFormats] = useState({
    pdf: true,
    csv: false,
    excel: false,
  });
  const [sending, setSending] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const handleFormatChange = (format: 'pdf' | 'csv' | 'excel', checked: boolean) => {
    setFormats(prev => ({ ...prev, [format]: checked }));
  };

  const validateEmails = (emailString: string): boolean => {
    const emails = emailString.split(',').map(e => e.trim()).filter(e => e);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emails.length > 0 && emails.every(email => emailRegex.test(email));
  };

  const handleSend = async () => {
    // Validation
    if (!recipients.trim()) {
      toast.error('Please enter at least one recipient email');
      return;
    }

    if (!validateEmails(recipients)) {
      toast.error('Please enter valid email addresses');
      return;
    }

    if (!formats.pdf && !formats.csv && !formats.excel) {
      toast.error('Please select at least one export format');
      return;
    }

    setSending(true);

    try {
      const selectedFormats = Object.entries(formats)
        .filter(([, selected]) => selected)
        .map(([format]) => format);

      toast.info('Generating reports and sending email...', { duration: 3000 });

      const { error } = await supabase.functions.invoke('send-analytics-email', {
        body: {
          recipients: recipients.split(',').map(e => e.trim()).filter(e => e),
          subject,
          message: message || undefined,
          formats: selectedFormats,
          data,
        },
      });

      if (error) throw error;

      toast.success(`Analytics report sent to ${recipients.split(',').length} recipient(s)`);
      onOpenChange(false);
      
      // Reset form
      setRecipients('');
      setSubject('LynkPro Share Analytics Report');
      setMessage('');
      setFormats({ pdf: true, csv: false, excel: false });
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleSelectTemplate = (template: EmailTemplate) => {
    setSubject(template.subject);
    setMessage(template.message || '');
    setFormats({
      pdf: template.formats.includes('pdf'),
      csv: template.formats.includes('csv'),
      excel: template.formats.includes('excel'),
    });
    setShowTemplates(false);
    toast.success('Template loaded');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Analytics Report
            </DialogTitle>
            <DialogDescription>
              Send analytics reports directly to email addresses
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTemplates(true)}
                disabled={sending}
              >
                <FileText className="h-4 w-4 mr-2" />
                Templates
              </Button>
            </div>
          <div className="space-y-2">
            <Label htmlFor="recipients">
              Recipients <span className="text-destructive">*</span>
            </Label>
            <Input
              id="recipients"
              placeholder="email@example.com, another@example.com"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              disabled={sending}
            />
            <p className="text-xs text-muted-foreground">
              Separate multiple email addresses with commas
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={sending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a personal message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={sending}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Export Formats <span className="text-destructive">*</span></Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="format-pdf"
                  checked={formats.pdf}
                  onCheckedChange={(checked) => handleFormatChange('pdf', checked as boolean)}
                  disabled={sending}
                />
                <Label htmlFor="format-pdf" className="font-normal cursor-pointer">
                  PDF Report (with charts)
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="format-csv"
                  checked={formats.csv}
                  onCheckedChange={(checked) => handleFormatChange('csv', checked as boolean)}
                  disabled={sending}
                />
                <Label htmlFor="format-csv" className="font-normal cursor-pointer">
                  CSV Data
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="format-excel"
                  checked={formats.excel}
                  onCheckedChange={(checked) => handleFormatChange('excel', checked as boolean)}
                  disabled={sending}
                />
                <Label htmlFor="format-excel" className="font-normal cursor-pointer">
                  Excel Workbook
                </Label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={sending}
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <TemplateManager
      open={showTemplates}
      onOpenChange={setShowTemplates}
      onSelectTemplate={handleSelectTemplate}
    />
  </>
  );
}
