import { ColumnDef } from '@tanstack/react-table';
import { Proposal } from '@/types/types';
import { Checkbox } from '@/components/ui/checkbox';
import { StatusBadge } from '@/components/ui/status-badge';
import { DataTableColumnHeader } from '@/components/data-table/DataTableColumnHeader';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Edit, Trash2, Send, Download, Copy } from 'lucide-react';
import { Link } from 'react-router-dom';

export const proposalColumns: ColumnDef<Proposal>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'proposal_number',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Proposal #" />
    ),
    cell: ({ row }) => {
      const proposalNumber = row.getValue('proposal_number') as string | null;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{proposalNumber || 'N/A'}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex flex-col max-w-md">
          <span className="font-medium">{row.getValue('title')}</span>
          {row.original.description && (
            <span className="text-sm text-muted-foreground line-clamp-1">
              {row.original.description}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'client',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Client" />
    ),
    cell: ({ row }) => {
      const client = row.original.client;
      return client ? (
        <span className="text-sm">{client.name}</span>
      ) : (
        <span className="text-sm text-muted-foreground">No client</span>
      );
    },
    filterFn: (row, id, value) => {
      return row.original.client?.name.toLowerCase().includes(value.toLowerCase()) ?? false;
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      return <StatusBadge status={row.getValue('status')} />;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'total_amount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Amount" />
    ),
    cell: ({ row }) => {
      const amount = row.getValue('total_amount') as number;
      return (
        <span className="text-sm font-medium">
          ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      );
    },
  },
  {
    accessorKey: 'valid_until',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Valid Until" />
    ),
    cell: ({ row }) => {
      const date = row.getValue('valid_until') as string | null;
      if (!date) {
        return <span className="text-sm text-muted-foreground">No expiry</span>;
      }
      const validUntil = new Date(date);
      const isExpired = validUntil < new Date() && row.original.status === 'sent';
      return (
        <span className={`text-sm ${isExpired ? 'text-destructive font-medium' : ''}`}>
          {validUntil.toLocaleDateString()}
        </span>
      );
    },
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => {
      const date = row.getValue('created_at') as string;
      return (
        <span className="text-sm">{new Date(date).toLocaleDateString()}</span>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const proposal = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to={`/proposals/${proposal.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={`/proposals/${proposal.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Proposal
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            {proposal.status === 'draft' && (
              <DropdownMenuItem>
                <Send className="mr-2 h-4 w-4" />
                Send Proposal
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Proposal
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
