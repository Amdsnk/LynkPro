import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { X, Mail, Trash2, Download, Edit, MoreHorizontal } from 'lucide-react';

export interface BulkAction {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
}

interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  actions: BulkAction[];
}

export function BulkActionBar({ selectedCount, onClear, actions }: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  // Split actions into primary (first 2) and overflow (rest)
  const primaryActions = actions.slice(0, 2);
  const overflowActions = actions.slice(2);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
      >
        <div className="bg-card border shadow-lg rounded-lg px-4 py-3 flex items-center gap-3">
          {/* Selected count */}
          <div className="flex items-center gap-2 pr-3 border-r">
            <span className="text-sm font-medium">
              {selectedCount} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Primary actions */}
          <div className="flex items-center gap-2">
            {primaryActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant={action.variant || 'default'}
                  size="sm"
                  onClick={action.onClick}
                  disabled={action.disabled}
                >
                  {Icon && <Icon className="mr-2 h-4 w-4" />}
                  {action.label}
                </Button>
              );
            })}

            {/* Overflow actions */}
            {overflowActions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {overflowActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <DropdownMenuItem
                        key={index}
                        onClick={action.onClick}
                        disabled={action.disabled}
                        className={action.variant === 'destructive' ? 'text-red-600' : ''}
                      >
                        {Icon && <Icon className="mr-2 h-4 w-4" />}
                        {action.label}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Predefined bulk actions for common use cases
export const commonBulkActions = {
  email: (onClick: () => void): BulkAction => ({
    label: 'Send Email',
    icon: Mail,
    onClick,
  }),
  delete: (onClick: () => void): BulkAction => ({
    label: 'Delete',
    icon: Trash2,
    onClick,
    variant: 'destructive',
  }),
  export: (onClick: () => void): BulkAction => ({
    label: 'Export',
    icon: Download,
    onClick,
  }),
  edit: (onClick: () => void): BulkAction => ({
    label: 'Edit',
    icon: Edit,
    onClick,
  }),
};
