import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/db/supabase';
import type { Equipment, EquipmentUsage, EquipmentMaintenance } from '@/types/types';
import { toast } from 'sonner';

export function useRealtimeEquipment(firmId: string | null | undefined) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEquipment = useCallback(async () => {
    if (!firmId) return;
    
    const { data, error } = await supabase
      .from('equipment')
      .select('*, current_project:projects(*)')
      .eq('firm_id', firmId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching equipment:', error);
      toast.error('Failed to load equipment');
    }

    if (data) {
      setEquipment(data as Equipment[]);
    }
    setLoading(false);
  }, [firmId]);

  useEffect(() => {
    fetchEquipment();

    if (!firmId) return;

    const channel = supabase
      .channel('equipment-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'equipment',
          filter: `firm_id=eq.${firmId}`,
        },
        () => {
          fetchEquipment();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [firmId, fetchEquipment]);

  return { equipment, loading, refetch: fetchEquipment };
}

export function useEquipmentUsage(firmId: string | null | undefined, equipmentId?: string) {
  const [usage, setUsage] = useState<EquipmentUsage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsage = useCallback(async () => {
    if (!firmId) return;
    
    let query = supabase
      .from('equipment_usage')
      .select('*, equipment:equipment(*), project:projects(*), operator:profiles!operator_id(*)')
      .eq('firm_id', firmId);

    if (equipmentId) {
      query = query.eq('equipment_id', equipmentId);
    }

    query = query.order('start_time', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching equipment usage:', error);
      toast.error('Failed to load usage history');
    }

    if (data) {
      setUsage(data as EquipmentUsage[]);
    }
    setLoading(false);
  }, [firmId, equipmentId]);

  useEffect(() => {
    fetchUsage();

    if (!firmId) return;

    const channel = supabase
      .channel('equipment-usage-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'equipment_usage',
          filter: `firm_id=eq.${firmId}`,
        },
        () => {
          fetchUsage();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [firmId, equipmentId, fetchUsage]);

  return { usage, loading, refetch: fetchUsage };
}

export function useEquipmentMaintenance(firmId: string | null | undefined, equipmentId?: string) {
  const [maintenance, setMaintenance] = useState<EquipmentMaintenance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMaintenance = useCallback(async () => {
    if (!firmId) return;
    
    let query = supabase
      .from('equipment_maintenance')
      .select('*, equipment:equipment(*), performer:profiles!performed_by(*)')
      .eq('firm_id', firmId);

    if (equipmentId) {
      query = query.eq('equipment_id', equipmentId);
    }

    query = query.order('scheduled_date', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching maintenance:', error);
      toast.error('Failed to load maintenance records');
    }

    if (data) {
      setMaintenance(data as EquipmentMaintenance[]);
    }
    setLoading(false);
  }, [firmId, equipmentId]);

  useEffect(() => {
    fetchMaintenance();

    if (!firmId) return;

    const channel = supabase
      .channel('equipment-maintenance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'equipment_maintenance',
          filter: `firm_id=eq.${firmId}`,
        },
        () => {
          fetchMaintenance();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [firmId, equipmentId, fetchMaintenance]);

  return { maintenance, loading, refetch: fetchMaintenance };
}

// CRUD functions
export async function createEquipment(equipment: Omit<Equipment, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('equipment')
    .insert(equipment)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateEquipment(id: string, updates: Partial<Equipment>) {
  const { data, error } = await supabase
    .from('equipment')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteEquipment(id: string) {
  const { error } = await supabase
    .from('equipment')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function createEquipmentUsage(usage: Omit<EquipmentUsage, 'id' | 'created_at' | 'duration_hours'>) {
  const { data, error } = await supabase
    .from('equipment_usage')
    .insert(usage)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateEquipmentUsage(id: string, updates: Partial<EquipmentUsage>) {
  const { data, error } = await supabase
    .from('equipment_usage')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createEquipmentMaintenance(maintenance: Omit<EquipmentMaintenance, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('equipment_maintenance')
    .insert(maintenance)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateEquipmentMaintenance(id: string, updates: Partial<EquipmentMaintenance>) {
  const { data, error } = await supabase
    .from('equipment_maintenance')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
