import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/db/supabase';
import type { CostCategory, ActualCost } from '@/types/types';
import { toast } from 'sonner';

export function useRealtimeBudgetCategories(firmId: string | null | undefined, projectId?: string) {
  const [categories, setCategories] = useState<CostCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    if (!firmId) return;
    
    let query = supabase
      .from('cost_categories')
      .select('*, project:projects(*)')
      .eq('firm_id', firmId);

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    query = query.order('name', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching budget categories:', error);
      toast.error('Failed to load budget categories');
    }

    if (data) {
      setCategories(data as CostCategory[]);
    }
    setLoading(false);
  }, [firmId, projectId]);

  useEffect(() => {
    fetchCategories();

    if (!firmId) return;

    const channel = supabase
      .channel('budget-categories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cost_categories',
          filter: `firm_id=eq.${firmId}`,
        },
        () => {
          fetchCategories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [firmId, projectId, fetchCategories]);

  return { categories, loading, refetch: fetchCategories };
}

export function useActualCosts(firmId: string | null | undefined, categoryId?: string) {
  const [costs, setCosts] = useState<ActualCost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCosts = useCallback(async () => {
    if (!firmId) return;
    
    let query = supabase
      .from('actual_costs')
      .select('*, category:cost_categories(*), project:projects(*), recorded_by_user:profiles!recorded_by(*)')
      .eq('firm_id', firmId);

    if (categoryId) {
      query = query.eq('cost_category_id', categoryId);
    }

    query = query.order('cost_date', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching actual costs:', error);
      toast.error('Failed to load actual costs');
    }

    if (data) {
      setCosts(data as ActualCost[]);
    }
    setLoading(false);
  }, [firmId, categoryId]);

  useEffect(() => {
    fetchCosts();

    if (!firmId) return;

    const channel = supabase
      .channel('actual-costs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'actual_costs',
          filter: `firm_id=eq.${firmId}`,
        },
        () => {
          fetchCosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [firmId, categoryId, fetchCosts]);

  return { costs, loading, refetch: fetchCosts };
}

export function useBudgetVariance(firmId: string | null | undefined, projectId?: string) {
  const { categories } = useRealtimeBudgetCategories(firmId, projectId);
  const { costs } = useActualCosts(firmId);

  const calculateVariance = useCallback(() => {
    return categories.map(category => {
      const categoryCosts = costs.filter(c => c.cost_category_id === category.id);
      const totalActual = categoryCosts.reduce((sum, c) => sum + Number(c.amount), 0);
      const variance = Number(category.budgeted_amount) - totalActual;
      const variancePercent = Number(category.budgeted_amount) > 0 
        ? (variance / Number(category.budgeted_amount)) * 100 
        : 0;

      return {
        ...category,
        category_name: category.name,
        total_actual: totalActual,
        variance,
        variance_percent: variancePercent,
        status: variance >= 0 ? 'under_budget' : 'over_budget',
      };
    });
  }, [categories, costs]);

  return { varianceData: calculateVariance() };
}

// CRUD functions
export async function createBudgetCategory(category: Omit<CostCategory, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('cost_categories')
    .insert(category)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateBudgetCategory(id: string, updates: Partial<CostCategory>) {
  const { data, error } = await supabase
    .from('cost_categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBudgetCategory(id: string) {
  const { error } = await supabase
    .from('cost_categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function createActualCost(cost: Omit<ActualCost, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('actual_costs')
    .insert(cost)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateActualCost(id: string, updates: Partial<ActualCost>) {
  const { data, error } = await supabase
    .from('actual_costs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteActualCost(id: string) {
  const { error } = await supabase
    .from('actual_costs')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
