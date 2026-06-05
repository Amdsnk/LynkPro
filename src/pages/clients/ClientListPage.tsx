import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { InviteClientDialog } from '@/components/dialogs/InviteClientDialog';
import { DataTable } from '@/components/data-table/DataTable';
import { clientColumns } from '@/components/data-table/columns/client-columns';
import { exportToCSV } from '@/lib/export';
import { useRealtimeClients } from '@/hooks/useRealtimeData';
import type { Client } from '@/types/types';
import { Plus } from 'lucide-react';

export default function ClientListPage() {
  const { profile, isClient } = useAuth();
  const navigate = useNavigate();
  
  // Real-time clients
  const { clients, loading } = useRealtimeClients(profile?.firm_id);

  const handleBulkDelete = async (selectedClients: Client[]) => {
    const ids = selectedClients.map(c => c.id);
    const { error } = await supabase
      .from('clients')
      .delete()
      .in('id', ids);

    if (error) {
      throw error;
    }
  };

  const handleExport = (clientsToExport: Client[]) => {
    exportToCSV(
      clientsToExport.map(c => ({
        name: c.name,
        email: c.email,
        phone: c.phone || '',
        address: c.address || '',
        city: c.city || '',
        state: c.state || '',
        zip: c.zip || '',
        created_at: new Date(c.created_at).toLocaleDateString(),
      })),
      `clients-${new Date().toISOString().split('T')[0]}`
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
        title="Clients"
        description={`${clients.length} ${clients.length === 1 ? 'client' : 'clients'} total`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Clients' },
        ]}
        actions={
          !isClient && (
            <div className="flex gap-2">
              <InviteClientDialog />
              <Button asChild>
                <Link to="/clients/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Client
                </Link>
              </Button>
            </div>
          )
        }
      />

      <DataTable
        columns={clientColumns}
        data={clients}
        searchKey="name"
        searchPlaceholder="Search clients..."
        onRowClick={(client) => navigate(`/clients/${client.id}`)}
        onBulkDelete={!isClient ? handleBulkDelete : undefined}
        onExport={handleExport}
        storageKey="clients"
      />
    </div>
  );
}
