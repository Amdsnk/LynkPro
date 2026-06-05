import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/db/supabase';
import type { Material, MaterialDelivery, MaterialConsumption } from '@/types/types';
import { toast } from 'sonner';

export function useRealtimeMaterials(firmId: string | null | undefined) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMaterials = useCallback(async () => {
    if (!firmId) return;
    
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('firm_id', firmId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching materials:', error);
      toast.error('Failed to load materials');
    }

    if (data) {
      setMaterials(data as Material[]);
    }
    setLoading(false);
  }, [firmId]);

  useEffect(() => {
    fetchMaterials();

    if (!firmId) return;

    const channel = supabase
      .channel('materials-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'materials',
          filter: `firm_id=eq.${firmId}`,
        },
        () => {
          fetchMaterials();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [firmId, fetchMaterials]);

  return { materials, loading, refetch: fetchMaterials };
}

export function useMaterialDeliveries(firmId: string | null | undefined, materialId?: string) {
  const [deliveries, setDeliveries] = useState<MaterialDelivery[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeliveries = useCallback(async () => {
    if (!firmId) return;
    
    let query = supabase
      .from('material_deliveries')
      .select('*, material:materials(*), project:projects(*), receiver:profiles!received_by(*)')
      .eq('firm_id', firmId);

    if (materialId) {
      query = query.eq('material_id', materialId);
    }

    query = query.order('delivery_date', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching deliveries:', error);
      toast.error('Failed to load deliveries');
    }

    if (data) {
      setDeliveries(data as MaterialDelivery[]);
    }
    setLoading(false);
  }, [firmId, materialId]);

  useEffect(() => {
    fetchDeliveries();

    if (!firmId) return;

    const channel = supabase
      .channel('material-deliveries-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'material_deliveries',
          filter: `firm_id=eq.${firmId}`,
        },
        () => {
          fetchDeliveries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [firmId, materialId, fetchDeliveries]);

  return { deliveries, loading, refetch: fetchDeliveries };
}

export function useMaterialConsumption(firmId: string | null | undefined, materialId?: string) {
  const [consumption, setConsumption] = useState<MaterialConsumption[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConsumption = useCallback(async () => {
    if (!firmId) return;
    
    let query = supabase
      .from('material_consumption')
      .select('*, material:materials(*), project:projects(*), consumer:profiles!consumed_by(*)')
      .eq('firm_id', firmId);

    if (materialId) {
      query = query.eq('material_id', materialId);
    }

    query = query.order('consumed_date', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching consumption:', error);
      toast.error('Failed to load consumption');
    }

    if (data) {
      setConsumption(data as MaterialConsumption[]);
    }
    setLoading(false);
  }, [firmId, materialId]);

  useEffect(() => {
    fetchConsumption();

    if (!firmId) return;

    const channel = supabase
      .channel('material-consumption-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'material_consumption',
          filter: `firm_id=eq.${firmId}`,
        },
        () => {
          fetchConsumption();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [firmId, materialId, fetchConsumption]);

  return { consumption, loading, refetch: fetchConsumption };
}

// CRUD functions
export async function createMaterial(material: Omit<Material, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('materials')
    .insert(material)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateMaterial(id: string, updates: Partial<Material>) {
  const { data, error } = await supabase
    .from('materials')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMaterial(id: string) {
  const { error } = await supabase
    .from('materials')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function createMaterialDelivery(delivery: Omit<MaterialDelivery, 'id' | 'created_at' | 'total_cost'>) {
  const { data, error } = await supabase
    .from('material_deliveries')
    .insert(delivery)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createMaterialConsumption(consumption: Omit<MaterialConsumption, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('material_consumption')
    .insert(consumption)
    .select()
    .single();

  if (error) throw error;
  return data;
}
