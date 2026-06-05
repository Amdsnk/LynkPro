import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { createProject, getClients, createAuditLog } from '@/lib/api';
import type { Client, ProjectStatus } from '@/types/types';
import { Loader2, ArrowLeft } from 'lucide-react';

interface ProjectFormData {
  name: string;
  description: string;
  client_id: string;
  status: ProjectStatus;
  internal_notes: string;
}

export default function ProjectCreatePage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  
  const form = useForm<ProjectFormData>({
    defaultValues: {
      name: '',
      description: '',
      client_id: '',
      status: 'active',
      internal_notes: '',
    },
  });

  useEffect(() => {
    const fetchClients = async () => {
      if (!profile?.firm_id) return;
      try {
        const data = await getClients(profile.firm_id);
        setClients(data);
      } catch (error) {
        console.error('Error fetching clients:', error);
        toast.error('Failed to load clients');
      }
    };

    fetchClients();
  }, [profile]);

  const onSubmit = async (data: ProjectFormData) => {
    if (!profile?.firm_id || !profile?.id) {
      toast.error('User profile not loaded');
      return;
    }

    setLoading(true);
    try {
      const project = await createProject({
        ...data,
        firm_id: profile.firm_id,
        created_by: profile.id,
        latitude: null,
        longitude: null,
      });

      await createAuditLog({ firm_id: profile.firm_id,
        entity_type: 'project',
        entity_id: project.id,
        action: 'created',
        details: { name: data.name },
        user_id: profile.id,
      });

      toast.success('Project created successfully');
      navigate(`/projects/${project.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section-spacing">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="page-title">Create New Project</h1>
      </div>

      <Card className="card-enhanced">
        <CardHeader>
          <CardTitle className="text-xl">Project Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="form-spacing">
              <FormField
                control={form.control}
                name="name"
                rules={{ required: 'Project name is required', minLength: { value: 3, message: 'Project name must be at least 3 characters' } }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter project name" {...field} />
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
                      <Textarea placeholder="Enter project description" rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="client_id"
                rules={{ required: 'Client is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
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
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="internal_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internal Notes (Team Only)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter internal notes" rows={4} {...field} />
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
                    'Create Project'
                  )}
                </Button>
                <Button type="button" variant="outline" size="lg" onClick={() => navigate('/projects')}>
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
