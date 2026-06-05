import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { getFirm, updateFirm } from '@/lib/api';
import { supabase } from '@/db/supabase';
import type { Firm } from '@/types/types';
import { Loader2, Upload, X, Building2 } from 'lucide-react';

interface FirmFormData {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}

export function FirmSettings() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [firm, setFirm] = useState<Firm | null>(null);

  const form = useForm<FirmFormData>({
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      email: '',
      website: '',
    },
  });

  useEffect(() => {
    const fetchFirm = async () => {
      if (!profile?.firm_id) return;
      try {
        const data = await getFirm(profile.firm_id);
        setFirm(data);
        form.reset({
          name: data.name || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          website: data.website || '',
        });
        setLogoUrl(data.logo_url || null);
      } catch (error) {
        console.error('Error fetching firm:', error);
        toast.error('Failed to load firm settings');
      } finally {
        setLoading(false);
      }
    };

    fetchFirm();
  }, [profile, form]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!profile?.firm_id || acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploading(true);

    try {
      // Validate file size (1MB limit)
      if (file.size > 1024 * 1024) {
        toast.error('Logo file is too large. Maximum size is 1MB.');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file.');
        return;
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.firm_id}_logo.${fileExt}`;
      const filePath = `${fileName}`;

      // Delete old logo if exists
      if (logoUrl) {
        const oldPath = logoUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('firm-logos').remove([oldPath]);
        }
      }

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('firm-logos')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: true,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('firm-logos')
        .getPublicUrl(filePath);

      setLogoUrl(urlData.publicUrl);
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  }, [profile, logoUrl]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.svg', '.webp']
    },
    maxSize: 1024 * 1024,
    maxFiles: 1,
  });

  const handleRemoveLogo = async () => {
    if (!logoUrl) return;

    try {
      const path = logoUrl.split('/').pop();
      if (path) {
        await supabase.storage.from('firm-logos').remove([path]);
      }
      setLogoUrl(null);
      toast.success('Logo removed');
    } catch (error) {
      console.error('Error removing logo:', error);
      toast.error('Failed to remove logo');
    }
  };

  const onSubmit = async (data: FirmFormData) => {
    if (!firm?.id) return;

    setSaving(true);
    try {
      await updateFirm(firm.id, {
        ...data,
        logo_url: logoUrl,
      });
      toast.success('Firm settings updated successfully');
    } catch (error) {
      console.error('Error updating firm:', error);
      toast.error('Failed to update firm settings');
    } finally {
      setSaving(false);
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
          <CardTitle className="text-xl">Firm Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="form-spacing">
              <div>
                <label className="text-sm font-medium mb-2 block">Company Logo</label>
                {logoUrl ? (
                  <div className="relative inline-block">
                    <img
                      src={logoUrl}
                      alt="Company logo"
                      className="h-32 w-auto border border-border rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2"
                      onClick={handleRemoveLogo}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-smooth ${
                      isDragActive
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-accent/50'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    {uploading ? (
                      <p className="text-sm text-muted-foreground">Uploading...</p>
                    ) : isDragActive ? (
                      <p className="text-sm text-primary">Drop logo here...</p>
                    ) : (
                      <>
                        <p className="text-sm font-medium mb-1">
                          Drag & drop logo here, or click to select
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG, SVG, WEBP up to 1MB
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="name"
                rules={{ required: 'Company name is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter company name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter company address"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter website URL" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" size="lg" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Settings'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
