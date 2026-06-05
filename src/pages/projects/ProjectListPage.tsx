import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { useRealtimeProjects } from '@/hooks/useRealtimeData';
import { DataTable } from '@/components/data-table/DataTable';
import { projectColumns } from '@/components/data-table/columns/project-columns';
import { exportToCSV } from '@/lib/export';
import type { Project } from '@/types/types';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function ProjectListPage() {
  const { profile, isClient } = useAuth();
  const navigate = useNavigate();
  
  // Real-time projects
  const { projects, loading } = useRealtimeProjects(profile?.firm_id);

  const handleBulkDelete = async (selectedProjects: Project[]) => {
    const ids = selectedProjects.map(p => p.id);
    const { error } = await supabase
      .from('projects')
      .delete()
      .in('id', ids);

    if (error) {
      throw error;
    }
  };

  const handleExport = (projectsToExport: Project[]) => {
    exportToCSV(
      projectsToExport.map(p => ({
        name: p.name,
        client: p.client?.name || 'No client',
        status: p.status,
        description: p.description || '',
        created_at: new Date(p.created_at).toLocaleDateString(),
      })),
      `projects-${new Date().toISOString().split('T')[0]}`
    );
  };

  if (loading) {
    return (
      <div className="section-spacing">
        <Skeleton className="h-12 w-64 bg-muted" />
        <div className="mt-8">
          <Skeleton className="h-96 bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="section-spacing">
      <PageHeader
        title="Projects"
        description={`${projects.length} ${projects.length === 1 ? 'project' : 'projects'} total`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Projects' },
        ]}
        actions={
          !isClient && (
            <Button asChild>
              <Link to="/projects/new">
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Link>
            </Button>
          )
        }
      />

      <DataTable
        columns={projectColumns}
        data={projects}
        searchKey="name"
        searchPlaceholder="Search projects..."
        onRowClick={(project) => navigate(`/projects/${project.id}`)}
        onBulkDelete={!isClient ? handleBulkDelete : undefined}
        onExport={handleExport}
        storageKey="projects"
      />
    </div>
  );
}
