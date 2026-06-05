import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { FileText, Users, FolderKanban, Receipt, BarChart3, Search, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface SearchResult {
  entity_type: string;
  entity_id: string;
  title: string;
  description: string;
  metadata: {
    status?: string;
    client_name?: string;
    [key: string]: unknown;
  };
  relevance: number;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ENTITY_ICONS = {
  project: FolderKanban,
  client: Users,
  proposal: FileText,
  invoice: Receipt,
  report: BarChart3,
};

const ENTITY_ROUTES = {
  project: '/projects',
  client: '/clients',
  proposal: '/proposals',
  invoice: '/invoices',
  report: '/reports',
};

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recent-searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load recent searches:', error);
      }
    }
  }, []);

  // Save recent search
  const saveRecentSearch = useCallback((query: string) => {
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent-searches', JSON.stringify(updated));
  }, [recentSearches]);

  // Perform search
  useEffect(() => {
    if (!search || search.length < 2) {
      setResults([]);
      return;
    }

    const performSearch = async () => {
      if (!profile?.firm_id) return;

      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('global_search', {
          search_query: search,
          firm_id_param: profile.firm_id,
        });

        if (error) throw error;
        setResults(data || []);
      } catch (error) {
        console.error('Search error:', error);
        toast.error('Search failed');
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(performSearch, 300);
    return () => clearTimeout(debounce);
  }, [search, profile?.firm_id]);

  const handleSelect = (result: SearchResult) => {
    const route = ENTITY_ROUTES[result.entity_type as keyof typeof ENTITY_ROUTES];
    if (route) {
      navigate(`${route}/${result.entity_id}`);
      saveRecentSearch(search);
      onOpenChange(false);
      setSearch('');
    }
  };

  const handleRecentSearch = (query: string) => {
    setSearch(query);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-2xl">
        <Command className="rounded-lg border-0">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Search projects, clients, proposals, invoices, reports..."
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            {!search && recentSearches.length > 0 && (
              <Command.Group heading="Recent Searches">
                {recentSearches.map((query, index) => (
                  <Command.Item
                    key={index}
                    onSelect={() => handleRecentSearch(query)}
                    className="flex items-center gap-2 px-2 py-2 rounded-sm cursor-pointer hover:bg-accent"
                  >
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{query}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {loading && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            )}

            {!loading && search && results.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No results found for "{search}"
              </div>
            )}

            {!loading && results.length > 0 && (
              <>
                {Object.entries(
                  results.reduce((acc, result) => {
                    if (!acc[result.entity_type]) {
                      acc[result.entity_type] = [];
                    }
                    acc[result.entity_type].push(result);
                    return acc;
                  }, {} as Record<string, SearchResult[]>)
                ).map(([type, items]) => {
                  const Icon = ENTITY_ICONS[type as keyof typeof ENTITY_ICONS];
                  return (
                    <Command.Group key={type} heading={type.charAt(0).toUpperCase() + type.slice(1) + 's'}>
                      {items.map((result) => (
                        <Command.Item
                          key={result.entity_id}
                          onSelect={() => handleSelect(result)}
                          className="flex items-start gap-3 px-2 py-3 rounded-sm cursor-pointer hover:bg-accent"
                        >
                          {Icon && <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{result.title}</div>
                            {result.description && (
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {result.description}
                              </div>
                            )}
                            {result.metadata && (
                              <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                                {result.metadata.status && (
                                  <span className="capitalize">{result.metadata.status}</span>
                                )}
                                {result.metadata.client_name && (
                                  <span>• {result.metadata.client_name}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </Command.Item>
                      ))}
                    </Command.Group>
                  );
                })}
              </>
            )}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
