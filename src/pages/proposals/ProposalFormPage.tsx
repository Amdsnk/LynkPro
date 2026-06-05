import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useForm, useFieldArray } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { createProposal, updateProposal, getProposal, getProjects, createAuditLog } from '@/lib/api';
import { supabase } from '@/db/supabase';
import type { Project, ProposalTemplate, LineItem } from '@/types/types';
import { Loader2, ArrowLeft, Plus, Trash2 } from 'lucide-react';

interface ProposalFormData {
  title: string;
  project_id: string;
  template_id: string;
  line_items: LineItem[];
  terms: string;
}

export default function ProposalFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [projects, setProjects] = useState<Project[]>([]);
  const [templates, setTemplates] = useState<ProposalTemplate[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);

  const form = useForm<ProposalFormData>({
    defaultValues: {
      title: '',
      project_id: '',
      template_id: '',
      line_items: [{ id: '1', description: '', quantity: 1, unit_price: 0, total: 0 }],
      terms: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'line_items',
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.firm_id) return;
      try {
        const [projectsData, templatesData] = await Promise.all([
          getProjects(profile.firm_id),
          supabase.from('proposal_templates').select('*').is('firm_id', null),
        ]);
        setProjects(projectsData);
        setTemplates(templatesData.data || []);

        if (isEdit && id) {
          const proposal = await getProposal(id);
          if (proposal) {
            const lineItems = proposal.line_items || proposal.items || [];
            form.reset({
              title: proposal.title,
              project_id: proposal.project_id || '',
              template_id: proposal.template_id || '',
              line_items: lineItems.length > 0 ? lineItems : [{ id: '1', description: '', quantity: 1, unit_price: 0, total: 0 }],
              terms: typeof proposal.content === 'object' && 'terms' in proposal.content ? String(proposal.content.terms) : proposal.terms || '',
            });
            setSelectedProject(proposal.project || null);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [profile, isEdit, id, form]);

  useEffect(() => {
    const subscription = form.watch((value) => {
      const items = value.line_items || [];
      const total = items.reduce((sum, item) => {
        const itemTotal = (item?.quantity || 0) * (item?.unit_price || 0);
        return sum + itemTotal;
      }, 0);
      setTotalAmount(total);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handleProjectChange = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    setSelectedProject(project || null);
    if (project) {
      form.setValue('title', `Proposal for ${project.name}`);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template && template.sections) {
      const termsSection = template.sections.find(s => s.title.toLowerCase().includes('terms'));
      if (termsSection) {
        form.setValue('terms', termsSection.content);
      }
    }
  };

  const calculateLineItemTotal = (index: number) => {
    const items = form.getValues('line_items');
    const item = items[index];
    const total = (item.quantity || 0) * (item.unit_price || 0);
    form.setValue(`line_items.${index}.total`, total);
  };

  const onSubmit = async (data: ProposalFormData, status: 'draft' | 'sent' = 'draft') => {
    if (!profile?.firm_id || !profile?.id || !selectedProject) {
      toast.error('Missing required information');
      return;
    }

    setLoading(true);
    try {
      const proposalData = {
        title: data.title,
        project_id: data.project_id,
        client_id: selectedProject.client_id,
        template_id: data.template_id || null,
        content: { terms: data.terms },
        line_items: data.line_items,
        total_amount: totalAmount,
        status,
        sent_at: status === 'sent' ? new Date().toISOString() : null,
        firm_id: profile.firm_id,
        created_by: profile.id,
      };

      let proposal;
      if (isEdit && id) {
        proposal = await updateProposal(id, proposalData);
        await createAuditLog({ firm_id: profile.firm_id,
          entity_type: 'proposal',
          entity_id: id,
          action: 'updated',
          details: { title: data.title, status },
          user_id: profile.id,
        });
        toast.success('Proposal updated successfully');
      } else {
        proposal = await createProposal(proposalData);
        await createAuditLog({ firm_id: profile.firm_id,
          entity_type: 'proposal',
          entity_id: proposal.id,
          action: 'created',
          details: { title: data.title },
          user_id: profile.id,
        });
        toast.success('Proposal created successfully');
      }

      navigate(`/proposals/${proposal.id}`);
    } catch (error) {
      console.error('Error saving proposal:', error);
      toast.error('Failed to save proposal');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/proposals')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-semibold text-foreground">
          {isEdit ? 'Edit Proposal' : 'Create New Proposal'}
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => onSubmit(data, 'draft'))} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Proposal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="project_id"
                rules={{ required: 'Project is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleProjectChange(value);
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name} - {project.client?.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="template_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template (Optional)</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleTemplateChange(value);
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a template" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                rules={{ required: 'Title is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proposal Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter proposal title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Line Items</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ id: Date.now().toString(), description: '', quantity: 1, unit_price: 0, total: 0 })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Description</TableHead>
                    <TableHead className="w-[15%]">Quantity</TableHead>
                    <TableHead className="w-[20%]">Unit Price</TableHead>
                    <TableHead className="w-[20%]">Total</TableHead>
                    <TableHead className="w-[5%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`line_items.${index}.description`}
                          rules={{ required: 'Description is required' }}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="Item description" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`line_items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(Number(e.target.value));
                                    calculateLineItemTotal(index);
                                  }}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`line_items.${index}.unit_price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(Number(e.target.value));
                                    calculateLineItemTotal(index);
                                  }}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          ${form.watch(`line_items.${index}.total`)?.toFixed(2) || '0.00'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-semibold">
                      Total Amount:
                    </TableCell>
                    <TableCell colSpan={2} className="font-semibold text-lg">
                      ${totalAmount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Enter terms and conditions"
                        rows={6}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save as Draft'
              )}
            </Button>
            <Button
              type="button"
              variant="default"
              disabled={loading}
              onClick={form.handleSubmit((data) => onSubmit(data, 'draft'))}
            >
              {isEdit ? 'Update Proposal' : 'Create Proposal'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/proposals')}>
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
