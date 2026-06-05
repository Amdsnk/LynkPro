import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { 
  FolderKanban, 
  FileText, 
  Receipt, 
  Users, 
  Settings,
  Search,
  Plus,
  Home
} from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const runCommand = useCallback((command: () => void) => {
    onOpenChange(false);
    command();
  }, [onOpenChange]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-2xl">
        <Command className="rounded-lg border-0">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              placeholder="Type a command or search..."
              value={search}
              onValueChange={setSearch}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            <Command.Group heading="Navigation" className="text-xs font-medium text-muted-foreground px-2 py-1.5">
              <Command.Item
                onSelect={() => runCommand(() => navigate('/'))}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
              >
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/projects'))}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
              >
                <FolderKanban className="h-4 w-4" />
                <span>Projects</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/clients'))}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
              >
                <Users className="h-4 w-4" />
                <span>Clients</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/proposals'))}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
              >
                <FileText className="h-4 w-4" />
                <span>Proposals</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/invoices'))}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
              >
                <Receipt className="h-4 w-4" />
                <span>Invoices</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/reports'))}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
              >
                <FileText className="h-4 w-4" />
                <span>Reports</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/admin'))}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
              >
                <Settings className="h-4 w-4" />
                <span>Admin Panel</span>
              </Command.Item>
            </Command.Group>

            <Command.Separator className="my-2 h-px bg-border" />

            <Command.Group heading="Actions" className="text-xs font-medium text-muted-foreground px-2 py-1.5">
              <Command.Item
                onSelect={() => runCommand(() => navigate('/projects/new'))}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
              >
                <Plus className="h-4 w-4" />
                <span>New Project</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/clients/new'))}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
              >
                <Plus className="h-4 w-4" />
                <span>New Client</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/proposals/new'))}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
              >
                <Plus className="h-4 w-4" />
                <span>New Proposal</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/invoices/new'))}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
              >
                <Plus className="h-4 w-4" />
                <span>New Invoice</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/reports/new'))}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
              >
                <Plus className="h-4 w-4" />
                <span>New Report</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
          <div className="border-t px-3 py-2 text-xs text-muted-foreground">
            Press{' '}
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>{' '}
            to toggle
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
