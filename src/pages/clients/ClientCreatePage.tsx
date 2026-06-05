import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { createClient, createAuditLog } from '@/lib/api';
import { Loader2, ArrowLeft } from 'lucide-react';

interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export default function ClientCreatePage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const form = useForm<ClientFormData>({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
    },
  });

  const onSubmit = async (data: ClientFormData) => {
    if (!profile?.firm_id || !profile?.id) {
      toast.error('User profile not loaded');
      return;
    }

    setLoading(true);
    try {
      const client = await createClient({
        ...data,
        firm_id: profile.firm_id,
        created_by: profile.id,
      });

      await createAuditLog({ firm_id: profile.firm_id,
        entity_type: 'client',
        entity_id: client.id,
        action: 'created',
        details: { name: data.name },
        user_id: profile.id,
      });

      toast.success('Client created successfully');
      navigate('/clients');
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Failed to create client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section-spacing">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" onClick={() => navigate('/clients')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="page-title">Create New Client</h1>
      </div>

      <Card className="card-enhanced">
        <CardHeader>
          <CardTitle className="text-xl">Client Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="form-spacing">
              <FormField
                control={form.control}
                name="name"
                rules={{ required: 'Client name is required', minLength: { value: 2, message: 'Client name must be at least 2 characters' } }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter client name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="email"
                  rules={{ 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="client@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
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
                      <Textarea placeholder="Enter client address" rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button type="submit" size="lg" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Client'
                  )}
                </Button>
                <Button type="button" variant="outline" size="lg" onClick={() => navigate('/clients')}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
