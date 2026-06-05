import { supabase } from '@/db/supabase';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export interface DashboardMetrics {
  totalProjects: number;
  activeProjects: number;
  totalClients: number;
  pendingProposals: number;
  outstandingInvoices: number;
  totalRevenue: number;
  paidInvoices: number;
  overdueInvoices: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
  invoices: number;
}

export interface ProjectStatusData {
  name: string;
  value: number;
}

export interface InvoiceStatusData {
  month: string;
  draft: number;
  sent: number;
  paid: number;
  overdue: number;
}

// Get dashboard metrics
export async function getDashboardMetrics(firmId: string): Promise<DashboardMetrics> {
  try {
    // Get project counts
    const { data: projects } = await supabase
      .from('projects')
      .select('status')
      .eq('firm_id', firmId);

    const totalProjects = projects?.length || 0;
    const activeProjects = projects?.filter(p => p.status === 'active').length || 0;

    // Get client count
    const { count: totalClients } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('firm_id', firmId);

    // Get proposal counts
    const { data: proposals } = await supabase
      .from('proposals')
      .select('status')
      .eq('firm_id', firmId);

    const pendingProposals = proposals?.filter(p => p.status === 'draft' || p.status === 'sent').length || 0;

    // Get invoice data
    const { data: invoices } = await supabase
      .from('invoices')
      .select('status, total_amount')
      .eq('firm_id', firmId);

    const outstandingInvoices = invoices?.filter(i => i.status !== 'paid').length || 0;
    const paidInvoices = invoices?.filter(i => i.status === 'paid').length || 0;
    const overdueInvoices = invoices?.filter(i => i.status === 'overdue').length || 0;
    const totalRevenue = invoices?.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total_amount || 0), 0) || 0;

    return {
      totalProjects,
      activeProjects,
      totalClients: totalClients || 0,
      pendingProposals,
      outstandingInvoices,
      totalRevenue,
      paidInvoices,
      overdueInvoices,
    };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    throw error;
  }
}

// Get revenue data for the last 6 months
export async function getRevenueData(firmId: string, months: number = 6): Promise<RevenueData[]> {
  try {
    const { data: invoices } = await supabase
      .from('invoices')
      .select('created_at, total_amount, status')
      .eq('firm_id', firmId)
      .eq('status', 'paid')
      .order('created_at', { ascending: true });

    if (!invoices) return [];

    // Group by month
    const monthlyData: { [key: string]: { revenue: number; count: number } } = {};
    
    // Initialize last N months
    for (let i = months - 1; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthKey = format(date, 'MMM yyyy');
      monthlyData[monthKey] = { revenue: 0, count: 0 };
    }

    // Aggregate data
    invoices.forEach(invoice => {
      const monthKey = format(new Date(invoice.created_at), 'MMM yyyy');
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].revenue += invoice.total_amount || 0;
        monthlyData[monthKey].count += 1;
      }
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      invoices: data.count,
    }));
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    throw error;
  }
}

// Get project status distribution
export async function getProjectStatusData(firmId: string): Promise<ProjectStatusData[]> {
  try {
    const { data: projects } = await supabase
      .from('projects')
      .select('status')
      .eq('firm_id', firmId);

    if (!projects) return [];

    const statusCounts: { [key: string]: number } = {};
    projects.forEach(project => {
      const status = project.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  } catch (error) {
    console.error('Error fetching project status data:', error);
    throw error;
  }
}

// Get invoice status data by month
export async function getInvoiceStatusData(firmId: string, months: number = 6): Promise<InvoiceStatusData[]> {
  try {
    const { data: invoices } = await supabase
      .from('invoices')
      .select('created_at, status')
      .eq('firm_id', firmId)
      .order('created_at', { ascending: true });

    if (!invoices) return [];

    // Initialize last N months
    const monthlyData: { [key: string]: { draft: number; sent: number; paid: number; overdue: number } } = {};
    
    for (let i = months - 1; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthKey = format(date, 'MMM yyyy');
      monthlyData[monthKey] = { draft: 0, sent: 0, paid: 0, overdue: 0 };
    }

    // Aggregate data
    invoices.forEach(invoice => {
      const monthKey = format(new Date(invoice.created_at), 'MMM yyyy');
      if (monthlyData[monthKey]) {
        const status = invoice.status as 'draft' | 'sent' | 'paid' | 'overdue';
        monthlyData[monthKey][status] = (monthlyData[monthKey][status] || 0) + 1;
      }
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data,
    }));
  } catch (error) {
    console.error('Error fetching invoice status data:', error);
    throw error;
  }
}

// Get recent activity
export interface ActivityItem {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, unknown>;
  created_at: string;
  user?: {
    full_name: string;
  };
}

export async function getRecentActivity(firmId: string, limit: number = 10): Promise<ActivityItem[]> {
  try {
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

    return (data as unknown as ActivityItem[]) || [];
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    throw error;
  }
}

// Parse user agent string
export function parseUserAgent(userAgent: string): { browser: string; os: string; device: string } {
  const ua = userAgent.toLowerCase();
  
  // Detect browser
  let browser = 'Unknown';
  if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('edg')) browser = 'Edge';
  else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera';

  // Detect OS
  let os = 'Unknown';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  // Detect device
  let device = 'Desktop';
  if (ua.includes('mobile')) device = 'Mobile';
  else if (ua.includes('tablet') || ua.includes('ipad')) device = 'Tablet';

  return { browser, os, device };
}
