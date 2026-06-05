import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/db/supabase';
import type { SafetyIncident, IncidentInvestigation, CorrectiveAction } from '@/types/types';
import { toast } from 'sonner';

export function useRealtimeSafetyIncidents(firmId: string | null | undefined) {
  const [incidents, setIncidents] = useState<SafetyIncident[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIncidents = useCallback(async () => {
    if (!firmId) return;
    
    const { data, error } = await supabase
      .from('safety_incidents')
      .select('*, project:projects(*), reporter:profiles!reported_by(*), investigator:profiles!assigned_investigator(*)')
      .eq('firm_id', firmId)
      .order('incident_date', { ascending: false });

    if (error) {
      console.error('Error fetching safety incidents:', error);
      toast.error('Failed to load safety incidents');
    }

    if (data) {
      setIncidents(data as SafetyIncident[]);
    }
    setLoading(false);
  }, [firmId]);

  useEffect(() => {
    fetchIncidents();

    if (!firmId) return;

    const channel = supabase
      .channel('safety-incidents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'safety_incidents',
          filter: `firm_id=eq.${firmId}`,
        },
        () => {
          fetchIncidents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [firmId, fetchIncidents]);

  return { incidents, loading, refetch: fetchIncidents };
}

export function useIncidentInvestigations(firmId: string | null | undefined, incidentId?: string) {
  const [investigations, setInvestigations] = useState<IncidentInvestigation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvestigations = useCallback(async () => {
    if (!firmId) return;
    
    let query = supabase
      .from('incident_investigations')
      .select('*, incident:safety_incidents(*), investigator:profiles!investigator_id(*)')
      .eq('firm_id', firmId);

    if (incidentId) {
      query = query.eq('incident_id', incidentId);
    }

    query = query.order('investigation_date', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching investigations:', error);
      toast.error('Failed to load investigations');
    }

    if (data) {
      setInvestigations(data as IncidentInvestigation[]);
    }
    setLoading(false);
  }, [firmId, incidentId]);

  useEffect(() => {
    fetchInvestigations();

    if (!firmId) return;

    const channel = supabase
      .channel('incident-investigations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'incident_investigations',
          filter: `firm_id=eq.${firmId}`,
        },
        () => {
          fetchInvestigations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [firmId, incidentId, fetchInvestigations]);

  return { investigations, loading, refetch: fetchInvestigations };
}

export function useCorrectiveActions(firmId: string | null | undefined, incidentId?: string) {
  const [actions, setActions] = useState<CorrectiveAction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActions = useCallback(async () => {
    if (!firmId) return;
    
    let query = supabase
      .from('corrective_actions')
      .select('*, incident:safety_incidents(*), assignee:profiles!assigned_to(*)')
      .eq('firm_id', firmId);

    if (incidentId) {
      query = query.eq('incident_id', incidentId);
    }

    query = query.order('due_date', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching corrective actions:', error);
      toast.error('Failed to load corrective actions');
    }

    if (data) {
      setActions(data as CorrectiveAction[]);
    }
    setLoading(false);
  }, [firmId, incidentId]);

  useEffect(() => {
    fetchActions();

    if (!firmId) return;

    const channel = supabase
      .channel('corrective-actions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'corrective_actions',
          filter: `firm_id=eq.${firmId}`,
        },
        () => {
          fetchActions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [firmId, incidentId, fetchActions]);

  return { actions, loading, refetch: fetchActions };
}

// CRUD functions
export async function createSafetyIncident(incident: Omit<SafetyIncident, 'id' | 'created_at' | 'updated_at' | 'incident_number'>) {
  const { data, error } = await supabase
    .from('safety_incidents')
    .insert(incident)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSafetyIncident(id: string, updates: Partial<SafetyIncident>) {
  const { data, error } = await supabase
    .from('safety_incidents')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSafetyIncident(id: string) {
  const { error } = await supabase
    .from('safety_incidents')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function createIncidentInvestigation(investigation: Omit<IncidentInvestigation, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('incident_investigations')
    .insert(investigation)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createCorrectiveAction(action: Omit<CorrectiveAction, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('corrective_actions')
    .insert(action)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCorrectiveAction(id: string, updates: Partial<CorrectiveAction>) {
  const { data, error } = await supabase
    .from('corrective_actions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
