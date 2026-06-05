import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { 
  FolderKanban, 
  Users, 
  FileText, 
  Receipt, 
  ClipboardList,
  Search,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface SearchResult {
  id: string;
  type: 'project' | 'client' | 'proposal' | 'invoice' | 'report';
  title: string;
  subtitle?: string;
  url: string;
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Save recent search
  const saveRecentSearch = (query: string) => {
    const updated = [query, ...recentSearches.filter(q => q !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Perform search
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim() || !profile?.firm_id) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const searchTerm = `%${query.toLowerCase()}%`;
      
      // Search projects
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, client:clients(name)')
        .eq('firm_id', profile.firm_id)
        .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .limit(5);

      // Search clients
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name, email')
        .eq('firm_id', profile.firm_id)
        .or(`name.ilike.${searchTerm},email.ilike.${searchTerm}`)
        .limit(5);

      // Search proposals
      const { data: proposals } = await supabase
        .from('proposals')
        .select('id, title, proposal_number, client:clients(name)')
        .eq('firm_id', profile.firm_id)
        .or(`title.ilike.${searchTerm},proposal_number.ilike.${searchTerm}`)
        .limit(5);

      // Search invoices
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, invoice_number, client:clients(name)')
        .eq('firm_id', profile.firm_id)
        .ilike('invoice_number', searchTerm)
        .limit(5);

      // Search reports
      const { data: reports } = await supabase
        .from('reports')
        .select('id, title, project:projects(name)')
        .eq('firm_id', profile.firm_id)
        .ilike('title', searchTerm)
        .limit(5);

      // Combine results
      const combined: SearchResult[] = [
        ...(projects || []).map(p => {
          const clientData = p.client as any;
          const clientName = Array.isArray(clientData) ? clientData[0]?.name : clientData?.name;
          return {
            id: p.id,
            type: 'project' as const,
            title: p.name,
            subtitle: clientName,
            url: `/projects/${p.id}`,
          };
        }),
        ...(clients || []).map(c => ({
          id: c.id,
          type: 'client' as const,
          title: c.name,
          subtitle: c.email,
          url: `/clients/${c.id}`,
        })),
        ...(proposals || []).map(p => {
          const clientData = p.client as any;
          const clientName = Array.isArray(clientData) ? clientData[0]?.name : clientData?.name;
          return {
            id: p.id,
            type: 'proposal' as const,
            title: p.title,
            subtitle: `${p.proposal_number} • ${clientName || 'N/A'}`,
            url: `/proposals/${p.id}`,
          };
        }),
        ...(invoices || []).map(i => {
          const clientData = i.client as any;
          const clientName = Array.isArray(clientData) ? clientData[0]?.name : clientData?.name;
          return {
            id: i.id,
            type: 'invoice' as const,
            title: i.invoice_number,
            subtitle: clientName,
            url: `/invoices/${i.id}`,
          };
        }),
        ...(reports || []).map(r => {
          const projectData = r.project as any;
          const projectName = Array.isArray(projectData) ? projectData[0]?.name : projectData?.name;
          return {
            id: r.id,
            type: 'report' as const,
            title: r.title,
            subtitle: projectName,
            url: `/reports/${r.id}`,
          };
        }),
      ];

      setResults(combined);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  }, [profile?.firm_id]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  const handleSelect = (result: SearchResult) => {
    saveRecentSearch(searchQuery);
    navigate(result.url);
    onOpenChange(false);
    setSearchQuery('');
  };

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'project':
        return FolderKanban;
      case 'client':
        return Users;
      case 'proposal':
        return FileText;
      case 'invoice':
        return Receipt;
      case 'report':
        return ClipboardList;
    }
  };

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search projects, clients, proposals, invoices, reports..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        {!searchQuery && recentSearches.length > 0 && (
          <>
            <CommandGroup heading="Recent Searches">
              {recentSearches.map((search, index) => (
                <CommandItem
                  key={index}
                  onSelect={() => setSearchQuery(search)}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  {search}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {searchQuery && results.length === 0 && !loading && (
          <CommandEmpty>
            <div className="flex flex-col items-center gap-2 py-6">
              <Search className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No results found</p>
            </div>
          </CommandEmpty>
        )}

        {Object.entries(groupedResults).map(([type, items]) => (
          <CommandGroup key={type} heading={type.charAt(0).toUpperCase() + type.slice(1) + 's'}>
            {items.map((result) => {
              const Icon = getIcon(result.type);
              return (
                <CommandItem
                  key={result.id}
                  onSelect={() => handleSelect(result)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{result.title}</span>
                    {result.subtitle && (
                      <span className="text-xs text-muted-foreground">
                        {result.subtitle}
                      </span>
                    )}
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
