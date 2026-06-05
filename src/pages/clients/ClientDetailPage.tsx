import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { getClient } from '@/lib/api';
import { supabase } from '@/db/supabase';
import type { Client, Project } from '@/types/types';
import { ArrowLeft, Edit, Users, FolderOpen, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isClient } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const clientData = await getClient(id);
        setClient(clientData);

        // Fetch projects for this client
        const { data: projectsData, error } = await supabase
          .from('projects')
          .select('*')
          .eq('client_id', id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProjects(projectsData || []);
      } catch (error) {
        console.error('Error fetching client:', error);
        toast.error('Failed to load client');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="section-spacing">
        <Skeleton className="h-12 w-96 bg-muted" />
        <Skeleton className="h-96 bg-muted" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="empty-state">
        <Users className="empty-state-icon" />
        <p className="empty-state-title">Client not found</p>
        <Button className="mt-4" onClick={() => navigate('/clients')}>
          Back to Clients
        </Button>
      </div>
    );
  }

  return (
    <div className="section-spacing">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/clients')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="page-title">{client.name}</h1>
            <p className="text-muted-foreground mt-1">
              Client since {new Date(client.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        {!isClient && (
          <Button variant="outline" size="sm" onClick={() => navigate(`/clients/${client.id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="text-xl">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="content-spacing">
            {client.email && (
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Email</p>
                  <a href={`mailto:${client.email}`} className="text-sm text-primary hover:underline">
                    {client.email}
                  </a>
                </div>
              </div>
            )}
            {client.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Phone</p>
                  <a href={`tel:${client.phone}`} className="text-sm text-primary hover:underline">
                    {client.phone}
                  </a>
                </div>
              </div>
            )}
            {client.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Address</p>
                  <p className="text-sm whitespace-pre-wrap">{client.address}</p>
                </div>
              </div>
            )}
            {!client.email && !client.phone && !client.address && (
              <p className="text-sm text-muted-foreground">No contact information available</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 card-enhanced">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Projects ({projects.length})</CardTitle>
              {!isClient && (
                <Link to="/projects/new">
                  <Button size="sm">New Project</Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="empty-state">
                <FolderOpen className="empty-state-icon" />
                <p className="empty-state-title">No projects yet</p>
                <p className="empty-state-description">
                  Create a project for this client to get started
                </p>
                {!isClient && (
                  <Link to="/projects/new">
                    <Button className="mt-4">Create Project</Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((project) => (
                  <Link key={project.id} to={`/projects/${project.id}`}>
                    <div className="flex items-center justify-between p-5 rounded-lg border border-border hover:border-primary/30 hover:bg-accent/50 transition-smooth group">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors truncate mb-1">
                          {project.name}
                        </h3>
                        {project.description && (
                          <p className="text-sm text-muted-foreground truncate mb-2">
                            {project.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="capitalize">{project.status}</span>
                          <span>•</span>
                          <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-4" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
