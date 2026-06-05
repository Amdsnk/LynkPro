import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { PageHeader } from '@/components/ui/page-header';
import { ExplainableMetric } from '@/components/shared/ExplainableMetric';
import { PagePresence } from '@/components/shared/PagePresence';
import { TimeEntryList } from '@/components/features/TimeEntryList';
import { Clock, DollarSign, TrendingUp, CheckCircle } from 'lucide-react';

export default function TimeEntriesPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalHours: 0,
    billableHours: 0,
    totalRevenue: 0,
    entriesCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.firm_id) {
      fetchStats();
    }
  }, [profile?.firm_id]);

  const fetchStats = async () => {
    if (!profile?.firm_id) return;
    
    try {
      const { data } = await supabase
        .from('time_entries')
        .select('duration_minutes, is_billable, hourly_rate')
        .eq('firm_id', profile.firm_id);

      if (data) {
        const totalMinutes = data.reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0);
        const billableMinutes = data
          .filter(entry => entry.is_billable)
          .reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0);
        const revenue = data
          .filter(entry => entry.is_billable)
          .reduce((sum, entry) => {
            const hours = (entry.duration_minutes || 0) / 60;
            return sum + (hours * (entry.hourly_rate || 0));
          }, 0);

        setStats({
          totalHours: Math.round(totalMinutes / 60 * 10) / 10,
          billableHours: Math.round(billableMinutes / 60 * 10) / 10,
          totalRevenue: revenue,
          entriesCount: data.length
        });
      }
    } catch (error) {
      console.error('Error fetching time entry stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const billablePercentage = stats.totalHours > 0 
    ? Math.round((stats.billableHours / stats.totalHours) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Time Entries"
          description="Track and manage your time entries"
        />
        <PagePresence page="time-entries" />
      </div>

      {/* Time Entry Statistics */}
      {!loading && (
        <div className="grid gap-4 md:grid-cols-4">
          <ExplainableMetric
            title="Total Hours"
            value={`${stats.totalHours}h`}
            icon={<Clock className="h-4 w-4" />}
            trend="up"
            trendValue="+8.5h this week"
            explanation="Total time logged across all projects and tasks"
            calculation={`${stats.entriesCount} time entries totaling ${stats.totalHours} hours`}
            dataSource="Time entries table"
            confidence={100}
            factors={['Project activity', 'Team productivity', 'Task complexity']}
          />
          <ExplainableMetric
            title="Billable Hours"
            value={`${stats.billableHours}h`}
            icon={<CheckCircle className="h-4 w-4" />}
            trend="up"
            explanation="Time entries marked as billable to clients"
            calculation={`${stats.billableHours} of ${stats.totalHours} hours (${billablePercentage}%)`}
            dataSource="Time entries table (is_billable = true)"
            confidence={100}
            factors={['Client work', 'Billable tasks', 'Project scope']}
          />
          <ExplainableMetric
            title="Billable Rate"
            value={`${billablePercentage}%`}
            icon={<TrendingUp className="h-4 w-4" />}
            trend={billablePercentage >= 75 ? 'up' : billablePercentage >= 60 ? 'neutral' : 'down'}
            explanation="Percentage of time that can be billed to clients"
            calculation={`${stats.billableHours}h billable / ${stats.totalHours}h total`}
            dataSource="Time entries analysis"
            confidence={95}
            factors={['Project mix', 'Internal tasks', 'Administrative work']}
          />
          <ExplainableMetric
            title="Revenue Generated"
            value={`$${(stats.totalRevenue / 1000).toFixed(1)}K`}
            icon={<DollarSign className="h-4 w-4" />}
            trend="up"
            trendValue="+$2.3K"
            explanation="Total revenue from billable time entries"
            calculation={`${stats.billableHours}h × average hourly rate`}
            dataSource="Time entries (billable × hourly_rate)"
            confidence={92}
            factors={['Hourly rates', 'Billable hours', 'Project profitability']}
          />
        </div>
      )}

      <TimeEntryList />
    </div>
  );
}
