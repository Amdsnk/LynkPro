import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, Edit, Trash2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import type { EmailTemplate } from '@/types/types';

interface TemplateManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: EmailTemplate) => void;
}

export function TemplateManager({ open, onOpenChange, onSelectTemplate }: TemplateManagerProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    message: '',
    formats: { pdf: true, csv: false, excel: false },
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      subject: 'LynkPro Share Analytics Report',
      message: '',
      formats: { pdf: true, csv: false, excel: false },
    });
    setShowForm(true);
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      message: template.message || '',
      formats: {
        pdf: template.formats.includes('pdf'),
        csv: template.formats.includes('csv'),
        excel: template.formats.includes('excel'),
      },
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Template deleted');
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    if (!formData.subject.trim()) {
      toast.error('Please enter a subject line');
      return;
    }

    const selectedFormats = Object.entries(formData.formats)
      .filter(([, selected]) => selected)
      .map(([format]) => format);

    if (selectedFormats.length === 0) {
      toast.error('Please select at least one format');
      return;
    }

    setSaving(true);

    try {
      const templateData = {
        name: formData.name.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim() || null,
        formats: selectedFormats,
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from('email_templates')
          .update({ ...templateData, updated_at: new Date().toISOString() })
          .eq('id', editingTemplate.id);

        if (error) throw error;
        toast.success('Template updated');
      } else {
        const { error } = await supabase
          .from('email_templates')
          .insert(templateData);

        if (error) throw error;
        toast.success('Template created');
      }

      setShowForm(false);
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickSend = (template: EmailTemplate) => {
    onSelectTemplate(template);
    onOpenChange(false);
  };

  if (showForm) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'Create Template'}
            </DialogTitle>
            <DialogDescription>
              Save email settings for quick reuse
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">
                Template Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="template-name"
                placeholder="e.g., Weekly Report, Monthly Summary"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-subject">
                Subject <span className="text-destructive">*</span>
              </Label>
              <Input
                id="template-subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-message">Message (optional)</Label>
              <Textarea
                id="template-message"
                placeholder="Default message for this template..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                disabled={saving}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Default Formats <span className="text-destructive">*</span></Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="template-pdf"
                    checked={formData.formats.pdf}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        formats: { ...formData.formats, pdf: checked as boolean },
                      })
                    }
                    disabled={saving}
                  />
                  <Label htmlFor="template-pdf" className="font-normal cursor-pointer">
                    PDF Report
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="template-csv"
                    checked={formData.formats.csv}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        formats: { ...formData.formats, csv: checked as boolean },
                      })
                    }
                    disabled={saving}
                  />
                  <Label htmlFor="template-csv" className="font-normal cursor-pointer">
                    CSV Data
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="template-excel"
                    checked={formData.formats.excel}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        formats: { ...formData.formats, excel: checked as boolean },
                      })
                    }
                    disabled={saving}
                  />
                  <Label htmlFor="template-excel" className="font-normal cursor-pointer">
                    Excel Workbook
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowForm(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Template'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Email Templates</DialogTitle>
          <DialogDescription>
            Manage your saved email templates for quick sending
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Button
            onClick={handleCreateNew}
            size="sm"
            className="mb-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <div className="empty-state py-8">
              <p className="empty-state-title">No templates yet</p>
              <p className="empty-state-description">
                Create your first template to save time
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="p-4 rounded-lg border border-border hover:border-primary/30 transition-smooth"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium mb-1">{template.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {template.subject}
                      </p>
                      {template.message && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {template.message}
                        </p>
                      )}
                      <div className="flex gap-2">
                        {template.formats.map((format) => (
                          <span
                            key={format}
                            className="text-xs px-2 py-0.5 rounded-full bg-muted"
                          >
                            {format.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickSend(template)}
                        title="Quick send with this template"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(template)}
                        title="Edit template"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(template.id)}
                        title="Delete template"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
