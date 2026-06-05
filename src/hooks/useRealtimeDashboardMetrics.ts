import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/db/supabase';
import { 
  getDashboardMetrics, 
  getRevenueData, 
  getProjectStatusData, 
  getInvoiceStatusData,
  type DashboardMetrics,
  type RevenueData,
  type ProjectStatusData,
  type InvoiceStatusData
} from '@/lib/analytics';

interface UseRealtimeDashboardMetricsReturn {
  metrics: DashboardMetrics | null;
  revenueData: RevenueData[];
  projectStatusData: ProjectStatusData[];
  invoiceStatusData: InvoiceStatusData[];
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useRealtimeDashboardMetrics(
  firmId: string | null | undefined,
  months: number = 6
): UseRealtimeDashboardMetricsReturn {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [projectStatusData, setProjectStatusData] = useState<ProjectStatusData[]>([]);
  const [invoiceStatusData, setInvoiceStatusData] = useState<InvoiceStatusData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllData = useCallback(async () => {
    if (!firmId) return;

    try {
      const [metricsData, revenue, projectStatus, invoiceStatus] = await Promise.all([
        getDashboardMetrics(firmId),
        getRevenueData(firmId, months),
        getProjectStatusData(firmId),
        getInvoiceStatusData(firmId, months),
      ]);

      setMetrics(metricsData);
      setRevenueData(revenue);
      setProjectStatusData(projectStatus);
      setInvoiceStatusData(invoiceStatus);
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
    } finally {
      setLoading(false);
    }
  }, [firmId, months]);

  useEffect(() => {
    fetchAllData();

    if (!firmId) return;

    // Subscribe to changes in all relevant tables
    const channel = supabase
      .channel('dashboard-metrics-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `firm_id=eq.${firmId}`,
        },
        () => {
          fetchAllData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clients',
          filter: `firm_id=eq.${firmId}`,
        },
        () => {
          fetchAllData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'proposals',
          filter: `firm_id=eq.${firmId}`,
        },
        () => {
          fetchAllData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices',
          filter: `firm_id=eq.${firmId}`,
        },
        () => {
          fetchAllData();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [firmId, fetchAllData]);

  return {
    metrics,
    revenueData,
    projectStatusData,
    invoiceStatusData,
    loading,
    refetch: fetchAllData,
  };
}
