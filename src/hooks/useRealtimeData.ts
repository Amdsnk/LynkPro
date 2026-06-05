import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/db/supabase';
import type { Project, Proposal, Invoice, Report, Client } from '@/types/types';
import type { ActivityItem } from '@/lib/analytics';
import { toast } from 'sonner';

// Hook for real-time clients
export function useRealtimeClients(firmId: string | null | undefined) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    if (!firmId) return;
    
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('firm_id', firmId)
      .order('created_at', { ascending: false });

    if (data) {
      setClients(data as Client[]);
    }
    setLoading(false);
  }, [firmId]);

  useEffect(() => {
    fetchClients();

    if (!firmId) return;

    // Subscribe to changes
    const channel = supabase
      .channel('clients-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clients',
          filter: `firm_id=eq.${firmId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            fetchClients();
            toast.success('New client added');
          } else if (payload.eventType === 'UPDATE') {
            fetchClients();
          } else if (payload.eventType === 'DELETE') {
            fetchClients();
            toast.info('Client deleted');
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [firmId, fetchClients]);

  return { clients, loading, refetch: fetchClients };
}

// Hook for real-time projects
export function useRealtimeProjects(firmId: string | null | undefined) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    if (!firmId) return;
    
    const { data } = await supabase
      .from('projects')
      .select('*, client:clients(*)')
      .eq('firm_id', firmId)
      .order('created_at', { ascending: false });

    if (data) {
      setProjects(data as Project[]);
    }
    setLoading(false);
  }, [firmId]);

  useEffect(() => {
    fetchProjects();

    if (!firmId) return;

    // Subscribe to changes
    const channel = supabase
      .channel('projects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `firm_id=eq.${firmId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            fetchProjects();
            toast.success('New project added');
          } else if (payload.eventType === 'UPDATE') {
            fetchProjects();
          } else if (payload.eventType === 'DELETE') {
            fetchProjects();
            toast.info('Project deleted');
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [firmId, fetchProjects]);

  return { projects, loading, refetch: fetchProjects };
}

// Hook for real-time proposals
export function useRealtimeProposals(firmId: string | null | undefined) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProposals = useCallback(async () => {
    if (!firmId) return;
    
    const { data } = await supabase
      .from('proposals')
      .select('*, client:clients(*), project:projects(*)')
      .eq('firm_id', firmId)
      .order('created_at', { ascending: false });

    if (data) {
      setProposals(data as Proposal[]);
    }
    setLoading(false);
  }, [firmId]);

  useEffect(() => {
    fetchProposals();

    if (!firmId) return;

    const channel = supabase
      .channel('proposals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'proposals',
          filter: `firm_id=eq.${firmId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            fetchProposals();
            toast.success('New proposal created');
          } else if (payload.eventType === 'UPDATE') {
            fetchProposals();
          } else if (payload.eventType === 'DELETE') {
            fetchProposals();
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [firmId, fetchProposals]);

  return { proposals, loading, refetch: fetchProposals };
}

// Hook for real-time invoices
export function useRealtimeInvoices(firmId: string | null | undefined) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = useCallback(async () => {
    if (!firmId) return;
    
    const { data } = await supabase
      .from('invoices')
      .select('*, client:clients(*), project:projects(*)')
      .eq('firm_id', firmId)
      .order('created_at', { ascending: false });

    if (data) {
      setInvoices(data as Invoice[]);
    }
    setLoading(false);
  }, [firmId]);

  useEffect(() => {
    fetchInvoices();

    if (!firmId) return;

    const channel = supabase
      .channel('invoices-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices',
          filter: `firm_id=eq.${firmId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            fetchInvoices();
            toast.success('New invoice created');
          } else if (payload.eventType === 'UPDATE') {
            fetchInvoices();
          } else if (payload.eventType === 'DELETE') {
            fetchInvoices();
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [firmId, fetchInvoices]);

  return { invoices, loading, refetch: fetchInvoices };
}

// Hook for real-time reports
export function useRealtimeReports(firmId: string | null | undefined) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    if (!firmId) return;
    
    const { data, error } = await supabase
      .from('reports')
      .select('*, project:projects(*, client:clients(*)), creator:profiles!created_by(id, full_name, email)')
      .eq('firm_id', firmId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
    }

    if (data) {
      setReports(data as Report[]);
    }
    setLoading(false);
  }, [firmId]);

  useEffect(() => {
    fetchReports();

    if (!firmId) return;

    const channel = supabase
      .channel('reports-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reports',
          filter: `firm_id=eq.${firmId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            fetchReports();
            toast.success('New report created');
          } else if (payload.eventType === 'UPDATE') {
            fetchReports();
          } else if (payload.eventType === 'DELETE') {
            fetchReports();
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [firmId, fetchReports]);

  return { reports, loading, refetch: fetchReports };
}

// Hook for real-time activity feed
export function useRealtimeActivity(firmId: string | null | undefined, limit: number = 10) {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    if (!firmId) return;
    
    const { data } = await supabase
      .from('audit_logs')
      .select(`
        id,
        action,
        entity_type,
        entity_id,
        details,
        created_at,
        user:profiles!audit_logs_user_id_fkey(full_name)
      `)
      .eq('firm_id', firmId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (data) {
      setActivity(data as unknown as ActivityItem[]);
    }
    setLoading(false);
  }, [firmId, limit]);

  useEffect(() => {
    fetchActivity();

    if (!firmId) return;

    const channel = supabase
      .channel('activity-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs',
          filter: `firm_id=eq.${firmId}`,
        },
        () => {
          fetchActivity();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [firmId, fetchActivity]);

  return { activity, loading, refetch: fetchActivity };
}
