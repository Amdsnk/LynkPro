import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/data-table/DataTable';
import { proposalColumns } from '@/components/data-table/columns/proposal-columns';
import { exportToCSV } from '@/lib/export';
import { useRealtimeProposals } from '@/hooks/useRealtimeData';
import type { Proposal } from '@/types/types';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function ProposalListPage() {
  const { profile, isClient } = useAuth();
  const navigate = useNavigate();
  
  // Real-time proposals
  const { proposals, loading } = useRealtimeProposals(profile?.firm_id);

  const handleBulkDelete = async (selectedProposals: Proposal[]) => {
    const ids = selectedProposals.map(p => p.id);
    const { error } = await supabase
      .from('proposals')
      .delete()
      .in('id', ids);

    if (error) {
      throw error;
    }
  };

  const handleExport = (proposalsToExport: Proposal[]) => {
    exportToCSV(
      proposalsToExport.map(p => ({
        proposal_number: p.proposal_number || 'N/A',
        title: p.title,
        client: p.client?.name || 'No client',
        project: p.project?.name || 'No project',
        status: p.status,
        total_amount: p.total_amount,
        valid_until: p.valid_until || '',
        created_at: new Date(p.created_at).toLocaleDateString(),
      })),
      `proposals-${new Date().toISOString().split('T')[0]}`
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
        title="Proposals"
        description={`${proposals.length} ${proposals.length === 1 ? 'proposal' : 'proposals'} total`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Proposals' },
        ]}
        actions={
          !isClient && (
            <Button asChild>
              <Link to="/proposals/new">
                <Plus className="mr-2 h-4 w-4" />
                New Proposal
              </Link>
            </Button>
          )
        }
      />

      <DataTable
        columns={proposalColumns}
        data={proposals}
        searchKey="title"
        searchPlaceholder="Search proposals..."
        onRowClick={(proposal) => navigate(`/proposals/${proposal.id}`)}
        onBulkDelete={!isClient ? handleBulkDelete : undefined}
        onExport={handleExport}
        storageKey="proposals"
      />
    </div>
  );
}
