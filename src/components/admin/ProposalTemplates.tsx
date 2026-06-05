import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { getProposalTemplates, createProposalTemplate, updateProposalTemplate, deleteProposalTemplate } from '@/lib/api';
import type { ProposalTemplate } from '@/types/types';
import { Plus, Edit, Trash2, FileText, Eye, Loader2 } from 'lucide-react';

interface TemplateFormData {
  name: string;
  description: string;
  sections: string;
}

export function ProposalTemplates() {
  const { profile } = useAuth();
  const [templates, setTemplates] = useState<ProposalTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ProposalTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<ProposalTemplate | null>(null);

  const form = useForm<TemplateFormData>({
    defaultValues: {
      name: '',
      description: '',
      sections: '',
    },
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const data = await getProposalTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (template?: ProposalTemplate) => {
    if (template) {
      setEditingTemplate(template);
      form.reset({
        name: template.name,
        description: template.description || '',
        sections: JSON.stringify(template.sections, null, 2),
      });
    } else {
      setEditingTemplate(null);
      form.reset({
        name: '',
        description: '',
        sections: JSON.stringify([
          { title: 'Introduction', content: '' },
          { title: 'Scope of Work', content: '' },
          { title: 'Timeline', content: '' },
          { title: 'Terms & Conditions', content: '' }
        ], null, 2),
      });
    }
    setDialogOpen(true);
  };

  const onSubmit = async (data: TemplateFormData) => {
    if (!profile?.firm_id) return;

    setSaving(true);
    try {
      let sections;
      try {
        sections = JSON.parse(data.sections);
      } catch {
        toast.error('Invalid JSON format for sections');
        return;
      }

      const templateData = {
        name: data.name,
        description: data.description || null,
        sections,
        firm_id: profile.firm_id,
      };

      if (editingTemplate) {
        await updateProposalTemplate(editingTemplate.id, templateData);
        setTemplates(templates.map(t => t.id === editingTemplate.id ? { ...t, ...templateData } : t));
        toast.success('Template updated successfully');
      } else {
        const newTemplate = await createProposalTemplate(templateData);
        setTemplates([...templates, newTemplate]);
        toast.success('Template created successfully');
      }

      setDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await deleteProposalTemplate(id);
      setTemplates(templates.filter(t => t.id !== id));
      toast.success('Template deleted successfully');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 bg-muted" />
        <Skeleton className="h-96 bg-muted" />
      </div>
    );
  }

  return (
    <div className="content-spacing">
      <Card className="card-enhanced">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Proposal Templates</CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingTemplate ? 'Edit Template' : 'Create New Template'}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="form-spacing">
                    <FormField
                      control={form.control}
                      name="name"
                      rules={{ required: 'Template name is required' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Template Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter template name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter template description"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sections"
                      rules={{ required: 'Sections are required' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sections (JSON)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder='[{"title": "Introduction", "content": ""}]'
                              rows={12}
                              className="font-mono text-sm"
                              {...field}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground mt-1">
                            Format: Array of objects with "title" and "content" fields
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-4">
                      <Button type="submit" disabled={saving}>
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          editingTemplate ? 'Update Template' : 'Create Template'
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="empty-state">
              <FileText className="empty-state-icon" />
              <p className="empty-state-title">No templates found</p>
              <p className="empty-state-description">
                Create your first proposal template to streamline your workflow
              </p>
              <Button className="mt-4" onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-5 rounded-lg border border-border hover:border-primary/30 hover:bg-accent/50 transition-smooth"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground mb-1">{template.name}</h3>
                    {template.description && (
                      <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {template.sections.length} sections
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewTemplate(template)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-6">
              {previewTemplate.description && (
                <p className="text-sm text-muted-foreground">{previewTemplate.description}</p>
              )}
              {previewTemplate.sections.map((section, index) => (
                <div key={index}>
                  <h3 className="font-semibold mb-2">{section.title}</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {section.content || '(No content)'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
