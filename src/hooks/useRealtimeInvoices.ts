import { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';
import { Invoice } from '@/types/types';

export function useRealtimeInvoices(firmId: string | undefined) {
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!firmId) {
      setLoading(false);
      return;
    }

    // Initial fetch
    const fetchInvoices = async () => {
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select(`
            *,
            client:clients(*),
            project:projects(*)
          `)
          .eq('firm_id', firmId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setInvoices(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();

    // Subscribe to real-time updates
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
        () => {
          // Refetch on any change
          fetchInvoices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [firmId]);

  return { invoices, loading, error };
}
