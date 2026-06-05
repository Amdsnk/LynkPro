import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { supabase } from '@/db/supabase';
import { Permit, PermitStatus } from '@/types/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface PermitFormData {
  permit_number: string;
  permit_type: string;
  permit_name: string;
  issuing_authority: string;
  issue_date: string;
  expiration_date: string;
  status: PermitStatus;
  notes: string;
}

export default function PermitFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = id !== 'new';
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [existingDocumentUrl, setExistingDocumentUrl] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string>('');

  const form = useForm<PermitFormData>({
    defaultValues: {
      permit_number: '',
      permit_type: '',
      permit_name: '',
      issuing_authority: '',
      issue_date: new Date().toISOString().split('T')[0],
      expiration_date: '',
      status: 'pending',
      notes: '',
    },
  });

  useEffect(() => {
    if (isEditMode) {
      fetchPermit();
    }
  }, [id, isEditMode]);

  const fetchPermit = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('permits')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error('Permit not found');
        navigate('/permits');
        return;
      }

      form.reset({
        permit_number: data.permit_number,
        permit_type: data.permit_type,
        permit_name: data.permit_name,
        issuing_authority: data.issuing_authority,
        issue_date: data.issue_date,
        expiration_date: data.expiration_date,
        status: data.status,
        notes: data.notes || '',
      });

      setExistingDocumentUrl(data.document_url);
      setProjectId(data.project_id);
    } catch (error) {
      console.error('Error fetching permit:', error);
      toast.error('Failed to load permit');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only PDF and image files are allowed');
        return;
      }

      setDocumentFile(file);
    }
  };

  const uploadDocument = async (firmId: string): Promise<string | null> => {
    if (!documentFile) return existingDocumentUrl;

    try {
      setUploading(true);
      const fileExt = documentFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${firmId}/permits/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('project-photos')
        .upload(filePath, documentFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('project-photos')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: PermitFormData) => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to continue');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('firm_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.firm_id) {
        toast.error('No firm associated with your account');
        return;
      }

      // Upload document if provided
      let documentUrl = existingDocumentUrl;
      if (documentFile) {
        documentUrl = await uploadDocument(profile.firm_id);
        if (!documentUrl && documentFile) {
          // Upload failed but user tried to upload
          return;
        }
      }

      const permitData = {
        ...data,
        document_url: documentUrl,
        firm_id: profile.firm_id,
        project_id: projectId || null,
      };

      if (isEditMode) {
        const { error } = await supabase
          .from('permits')
          .update(permitData)
          .eq('id', id);

        if (error) throw error;
        toast.success('Permit updated successfully');
      } else {
        const { error } = await supabase
          .from('permits')
          .insert([permitData]);

        if (error) throw error;
        toast.success('Permit created successfully');
      }

      navigate('/permits');
    } catch (error) {
      console.error('Error saving permit:', error);
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} permit`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/permits')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-light tracking-tight text-foreground">
              {isEditMode ? 'Edit Permit' : 'Add New Permit'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isEditMode ? 'Update permit information' : 'Create a new permit record'}
            </p>
          </div>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="permit_number"
                    rules={{ required: 'Permit number is required' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Permit Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., BP-2024-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="permit_type"
                    rules={{ required: 'Permit type is required' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Permit Type *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Building, Electrical" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="permit_name"
                  rules={{ required: 'Permit name is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Permit Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Main Building Construction Permit" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="issuing_authority"
                  rules={{ required: 'Issuing authority is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issuing Authority *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., City Building Department" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="issue_date"
                    rules={{ required: 'Issue date is required' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issue Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expiration_date"
                    rules={{ required: 'Expiration date is required' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiration Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="status"
                  rules={{ required: 'Status is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                          <SelectItem value="renewed">Renewed</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional notes or comments..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Document Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Document</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Upload Permit Document</Label>
                  <p className="text-xs text-muted-foreground">
                    PDF or image files only. Max size: 10MB
                  </p>
                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="flex-1"
                    />
                    {documentFile && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setDocumentFile(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {documentFile && (
                    <p className="text-xs text-muted-foreground">
                      Selected: {documentFile.name} ({(documentFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                  {existingDocumentUrl && !documentFile && (
                    <p className="text-xs text-muted-foreground">
                      Current document:{' '}
                      <a
                        href={existingDocumentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        View existing document
                      </a>
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/permits')}
                disabled={loading || uploading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || uploading} className="gap-2">
                {uploading ? (
                  <>
                    <Upload className="h-4 w-4 animate-pulse" />
                    Uploading...
                  </>
                ) : loading ? (
                  'Saving...'
                ) : isEditMode ? (
                  'Update Permit'
                ) : (
                  'Create Permit'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
