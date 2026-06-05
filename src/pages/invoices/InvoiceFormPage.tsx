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
import { createInvoice, updateInvoice, getInvoice, getProjects, createAuditLog, generateAIText } from '@/lib/api';
import type { Project, LineItem, InvoiceStatus, Invoice } from '@/types/types';
import { Loader2, ArrowLeft, Plus, Trash2, Sparkles } from 'lucide-react';

interface InvoiceFormData {
  project_id: string;
  line_items: LineItem[];
  notes: string;
  status: InvoiceStatus;
  due_date: string;
}

export default function InvoiceFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [generatingAI, setGeneratingAI] = useState<number | null>(null);

  const form = useForm<InvoiceFormData>({
    defaultValues: {
      project_id: '',
      line_items: [{ id: '1', description: '', quantity: 1, unit_price: 0, total: 0 }],
      notes: '',
      status: 'draft',
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
        const projectsData = await getProjects(profile.firm_id);
        setProjects(projectsData);

        if (isEdit && id) {
          const invoice = await getInvoice(id);
          if (invoice) {
            const lineItems = invoice.line_items || invoice.items || [];
            form.reset({
              project_id: invoice.project_id || '',
              line_items: lineItems.length > 0 ? lineItems : [{ id: '1', description: '', quantity: 1, unit_price: 0, total: 0 }],
              notes: invoice.notes || '',
              status: invoice.status,
              due_date: invoice.due_date ? new Date(invoice.due_date).toISOString().split('T')[0] : '',
            });
            setSelectedProject(invoice.project || null);
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
  };

  const calculateLineItemTotal = (index: number) => {
    const items = form.getValues('line_items');
    const item = items[index];
    const total = (item.quantity || 0) * (item.unit_price || 0);
    form.setValue(`line_items.${index}.total`, total);
  };

  const handleGenerateAIDescription = async (index: number) => {
    if (!selectedProject) {
      toast.error('Please select a project first');
      return;
    }

    const currentDescription = form.getValues(`line_items.${index}.description`);
    if (!currentDescription || currentDescription.trim().length < 3) {
      toast.error('Please enter a brief description first');
      return;
    }

    setGeneratingAI(index);
    try {
      const aiDescription = await generateAIText(
        'invoice_description',
        currentDescription,
        {
          projectName: selectedProject.name,
          clientName: selectedProject.client?.name,
        }
      );
      form.setValue(`line_items.${index}.description`, aiDescription);
      toast.success('AI description generated');
    } catch (error) {
      console.error('Error generating AI description:', error);
      toast.error('Failed to generate AI description');
    } finally {
      setGeneratingAI(null);
    }
  };

  const onSubmit = async (data: InvoiceFormData) => {
    if (!profile?.firm_id || !profile?.id || !selectedProject) {
      toast.error('Missing required information');
      return;
    }

    setLoading(true);
    try {
      const invoiceData: Partial<Invoice> = {
        invoice_number: '', // Will be auto-generated by trigger
        project_id: data.project_id || null,
        client_id: selectedProject.client_id,
        line_items: data.line_items,
        total_amount: totalAmount,
        status: data.status,
        notes: data.notes || null,
        due_date: data.due_date || new Date().toISOString(),
        sent_at: null,
        paid_at: null,
        firm_id: profile.firm_id,
        created_by: profile.id,
      };

      let invoice;
      if (isEdit && id) {
        invoice = await updateInvoice(id, invoiceData);
        await createAuditLog({
          firm_id: profile.firm_id,
          entity_type: 'invoice',
          entity_id: id,
          action: 'updated',
          details: { status: data.status },
          user_id: profile.id,
        });
        toast.success('Invoice updated successfully');
      } else {
        invoice = await createInvoice(invoiceData as Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'project' | 'client' | 'items'>);
        await createAuditLog({
          firm_id: profile.firm_id,
          entity_type: 'invoice',
          entity_id: invoice.id,
          action: 'created',
          details: { invoice_number: invoice.invoice_number },
          user_id: profile.id,
        });
        toast.success('Invoice created successfully');
      }

      navigate(`/invoices/${invoice.id}`);
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error('Failed to save invoice');
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
    <div className="section-spacing">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="page-title">
          {isEdit ? 'Edit Invoice' : 'Create New Invoice'}
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="content-spacing">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="text-xl">Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="form-spacing">
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="due_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="card-enhanced">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Line Items</CardTitle>
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
                    <TableHead className="w-[45%]">Description</TableHead>
                    <TableHead className="w-[12%]">Quantity</TableHead>
                    <TableHead className="w-[18%]">Unit Price</TableHead>
                    <TableHead className="w-[18%]">Total</TableHead>
                    <TableHead className="w-[7%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <div className="flex gap-2">
                          <FormField
                            control={form.control}
                            name={`line_items.${index}.description`}
                            rules={{ required: 'Description is required' }}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Textarea
                                    placeholder="Brief description (AI will expand)"
                                    rows={2}
                                    {...field}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateAIDescription(index)}
                            disabled={generatingAI === index}
                            className="shrink-0"
                          >
                            {generatingAI === index ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
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

          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="text-xl">Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Enter any additional notes or payment instructions"
                        rows={4}
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
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                isEdit ? 'Update Invoice' : 'Create Invoice'
              )}
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={() => navigate('/invoices')}>
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
