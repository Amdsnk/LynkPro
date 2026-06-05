import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { DataTable } from '@/components/ui/data-table';
import { BulkActionBar, commonBulkActions } from '@/components/shared/BulkActionBar';
import { useRealtimeProposals } from '@/hooks/useRealtimeData';
import { exportToCSV } from '@/lib/export';
import type { Proposal } from '@/types/types';
import { Plus, Eye, Mail, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { ColumnDef } from '@tanstack/react-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

export default function ProposalListPageEnhanced() {
  const { profile, isClient } = useAuth();
  const { proposals, loading } = useRealtimeProposals(profile?.firm_id);
  const [selectedProposals, setSelectedProposals] = useState<Proposal[]>([]);

  const columns: ColumnDef<Proposal>[] = [
    {
      accessorKey: 'proposal_number',
      header: 'Number',
      cell: ({ row }) => (
        <Link
          to={`/proposals/${row.original.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.original.proposal_number}
        </Link>
      ),
    },
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <div className="max-w-[300px] truncate">{row.original.title}</div>
      ),
    },
    {
      accessorKey: 'client',
      header: 'Client',
      cell: ({ row }) => row.original.client?.name || 'N/A',
      enableSorting: false,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'total_amount',
      header: 'Amount',
      cell: ({ row }) => `$${row.original.total_amount?.toLocaleString() || '0'}`,
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => format(new Date(row.original.created_at), 'MMM d, yyyy'),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/proposals/${row.original.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </Link>
            </DropdownMenuItem>
            {!isClient && (
              <>
                <DropdownMenuItem onClick={() => handleSendEmail([row.original])}>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDelete([row.original])}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const handleSendEmail = async (items: Proposal[]) => {
    toast.promise(
      Promise.all(items.map(async (proposal) => {
        // Email sending logic here
        return proposal;
      })),
      {
        loading: `Sending ${items.length} email(s)...`,
        success: `${items.length} email(s) sent successfully`,
        error: 'Failed to send emails',
      }
    );
    setSelectedProposals([]);
  };

  const handleDelete = async (items: Proposal[]) => {
    if (!confirm(`Delete ${items.length} proposal(s)?`)) return;
    
    toast.promise(
      Promise.all(items.map(async (proposal) => {
        // Delete logic here
        return proposal;
      })),
      {
        loading: `Deleting ${items.length} proposal(s)...`,
        success: `${items.length} proposal(s) deleted`,
        error: 'Failed to delete proposals',
      }
    );
    setSelectedProposals([]);
  };

  const handleExport = () => {
    const dataToExport = selectedProposals.length > 0 ? selectedProposals : proposals;
    exportToCSV(
      dataToExport.map(p => ({
        proposal_number: p.proposal_number || 'N/A',
        title: p.title,
        client: p.client?.name || 'N/A',
        status: p.status,
        total_amount: p.total_amount,
        created_at: new Date(p.created_at).toLocaleDateString(),
      })),
      `proposals-${new Date().toISOString().split('T')[0]}`
    );
    toast.success(`Exported ${dataToExport.length} proposal(s)`);
  };

  const bulkActions = [
    commonBulkActions.email(() => handleSendEmail(selectedProposals)),
    commonBulkActions.export(handleExport),
    commonBulkActions.delete(() => handleDelete(selectedProposals)),
  ];

  if (loading) {
    return <div>Loading proposals...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Proposals"
        description="Manage and track all your proposals"
        actions={
          !isClient ? (
            <Button asChild>
              <Link to="/proposals/new">
                <Plus className="mr-2 h-4 w-4" />
                New Proposal
              </Link>
            </Button>
          ) : undefined
        }
      />

      <DataTable
        columns={columns}
        data={proposals}
        searchKey="title"
        searchPlaceholder="Search proposals..."
        enableRowSelection={!isClient}
        onRowSelectionChange={setSelectedProposals}
      />

      {!isClient && (
        <BulkActionBar
          selectedCount={selectedProposals.length}
          onClear={() => setSelectedProposals([])}
          actions={bulkActions}
        />
      )}
    </div>
  );
}
