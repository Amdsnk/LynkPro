import { ColumnDef } from '@tanstack/react-table';
import { Invoice } from '@/types/types';
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
import { MoreHorizontal, Eye, Edit, Trash2, Send, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

export const invoiceColumns: ColumnDef<Invoice>[] = [
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
    accessorKey: 'invoice_number',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Invoice #" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex flex-col">
          <span className="font-medium">{row.getValue('invoice_number')}</span>
          {row.original.title && (
            <span className="text-sm text-muted-foreground line-clamp-1">
              {row.original.title}
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
    accessorKey: 'due_date',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Due Date" />
    ),
    cell: ({ row }) => {
      const date = row.getValue('due_date') as string;
      const dueDate = new Date(date);
      const isOverdue = dueDate < new Date() && row.original.status !== 'paid';
      return (
        <span className={`text-sm ${isOverdue ? 'text-destructive font-medium' : ''}`}>
          {dueDate.toLocaleDateString()}
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
      const invoice = row.original;

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
              <Link to={`/invoices/${invoice.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={`/invoices/${invoice.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Invoice
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </DropdownMenuItem>
            {invoice.status === 'draft' && (
              <DropdownMenuItem>
                <Send className="mr-2 h-4 w-4" />
                Send Invoice
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Invoice
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
