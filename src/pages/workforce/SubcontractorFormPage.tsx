import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { supabase } from '@/db/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface SubcontractorFormData {
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  specialty: string;
  license_number: string;
  insurance_expiry: string;
  status: 'active' | 'inactive' | 'suspended';
  notes: string;
}

export default function SubcontractorFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);
  const isEditMode = !!id;

  const form = useForm<SubcontractorFormData>({
    defaultValues: {
      company_name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      specialty: '',
      license_number: '',
      insurance_expiry: '',
      status: 'active',
      notes: '',
    },
  });

  useEffect(() => {
    if (id) {
      fetchSubcontractor();
    }
  }, [id]);

  async function fetchSubcontractor() {
    try {
      const { data, error } = await supabase
        .from('subcontractors')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error('Subcontractor not found');
        navigate('/subcontractors');
        return;
      }

      form.reset({
        company_name: data.company_name,
        contact_person: data.contact_person,
        email: data.email,
        phone: data.phone,
        address: data.address || '',
        specialty: data.specialty,
        license_number: data.license_number || '',
        insurance_expiry: data.insurance_expiry || '',
        status: data.status,
        notes: data.notes || '',
      });
    } catch (error) {
      console.error('Error fetching subcontractor:', error);
      toast.error('Failed to load subcontractor');
    } finally {
      setInitialLoading(false);
    }
  }

  async function onSubmit(data: SubcontractorFormData) {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('firm_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.firm_id) throw new Error('Firm not found');

      const subcontractorData = {
        ...data,
        firm_id: profile.firm_id,
        address: data.address || null,
        license_number: data.license_number || null,
        insurance_expiry: data.insurance_expiry || null,
        notes: data.notes || null,
      };

      if (isEditMode) {
        const { error } = await supabase
          .from('subcontractors')
          .update(subcontractorData)
          .eq('id', id);

        if (error) throw error;
        toast.success('Subcontractor updated successfully');
      } else {
        const { error } = await supabase
          .from('subcontractors')
          .insert([subcontractorData]);

        if (error) throw error;
        toast.success('Subcontractor created successfully');
      }

      navigate('/subcontractors');
    } catch (error) {
      console.error('Error saving subcontractor:', error);
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} subcontractor`);
    } finally {
      setLoading(false);
    }
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/subcontractors')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isEditMode ? 'Edit Subcontractor' : 'New Subcontractor'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isEditMode ? 'Update subcontractor information' : 'Add a new subcontractor to your directory'}
            </p>
          </div>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="company_name"
                    rules={{ required: 'Company name is required' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="ABC Construction" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="specialty"
                    rules={{ required: 'Specialty is required' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specialty/Trade *</FormLabel>
                        <FormControl>
                          <Input placeholder="Electrical, Plumbing, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="contact_person"
                  rules={{ required: 'Contact person is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person *</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    rules={{
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                      },
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    rules={{ required: 'Phone is required' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone *</FormLabel>
                        <FormControl>
                          <Input placeholder="(555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="123 Main St, City, State ZIP" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* License & Insurance */}
            <Card>
              <CardHeader>
                <CardTitle>License & Insurance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="license_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Number</FormLabel>
                        <FormControl>
                          <Input placeholder="LIC-123456" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="insurance_expiry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Insurance Expiry Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any additional information about this subcontractor..."
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

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/subcontractors')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : isEditMode ? 'Update Subcontractor' : 'Create Subcontractor'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
