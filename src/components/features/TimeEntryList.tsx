import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Clock, Download, Edit, Trash2, DollarSign } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'sonner';
import type { TimeEntry, Project } from '@/types/types';

interface TimeEntryListProps {
  projectId?: string;
}

export function TimeEntryList({ projectId }: TimeEntryListProps) {
  const { profile } = useAuth();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [filterProject, setFilterProject] = useState(projectId || 'all');
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);

  useEffect(() => {
    if (profile?.firm_id) {
      fetchProjects();
      fetchEntries();
    }
  }, [profile?.firm_id, filterPeriod, filterProject]);

  const fetchProjects = async () => {
    if (!profile?.firm_id) return;
    const { data } = await supabase
      .from('projects')
      .select('id, name')
      .eq('firm_id', profile.firm_id)
      .order('name');
    if (data) setProjects(data as any);
  };

  const fetchEntries = async () => {
    if (!profile?.firm_id) return;
    setLoading(true);

    let query = supabase
      .from('time_entries')
      .select(`
        *,
        user:profiles!time_entries_user_id_fkey(id, email, full_name),
        project:projects(id, name)
      `)
      .eq('firm_id', profile.firm_id)
      .order('start_time', { ascending: false });

    // Apply date filter
    if (filterPeriod === 'week') {
      const start = startOfWeek(new Date());
      const end = endOfWeek(new Date());
      query = query.gte('start_time', start.toISOString()).lte('start_time', end.toISOString());
    } else if (filterPeriod === 'month') {
      const start = startOfMonth(new Date());
      const end = endOfMonth(new Date());
      query = query.gte('start_time', start.toISOString()).lte('start_time', end.toISOString());
    }

    // Apply project filter
    if (filterProject !== 'all') {
      query = query.eq('project_id', filterProject);
    }

    const { data } = await query;
    if (data) setEntries(data as any);
    setLoading(false);
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from('time_entries').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete time entry');
    } else {
      toast.success('Time entry deleted');
      fetchEntries();
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Project', 'Description', 'Duration (hours)', 'Billable', 'Rate', 'Amount'];
    const rows = entries.map(entry => [
      format(new Date(entry.start_time), 'yyyy-MM-dd'),
      entry.project?.name || 'No project',
      entry.description || '',
      ((entry.duration_minutes || 0) / 60).toFixed(2),
      entry.is_billable ? 'Yes' : 'No',
      entry.hourly_rate ? `$${entry.hourly_rate}` : '',
      entry.is_billable && entry.hourly_rate ? `$${((entry.duration_minutes || 0) / 60 * entry.hourly_rate).toFixed(2)}` : ''
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `time-entries-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('Time entries exported');
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const calculateTotals = () => {
    const totalMinutes = entries.reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0);
    const billableMinutes = entries.filter(e => e.is_billable).reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0);
    const totalAmount = entries
      .filter(e => e.is_billable && e.hourly_rate)
      .reduce((sum, entry) => sum + ((entry.duration_minutes || 0) / 60 * (entry.hourly_rate || 0)), 0);

    return {
      totalHours: (totalMinutes / 60).toFixed(2),
      billableHours: (billableMinutes / 60).toFixed(2),
      totalAmount: totalAmount.toFixed(2),
    };
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold">{totals.totalHours}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Billable Hours</p>
                <p className="text-2xl font-bold">{totals.billableHours}</p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">${totals.totalAmount}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Time Entries</CardTitle>
            <div className="flex gap-2">
              <Select value={filterPeriod} onValueChange={(v: any) => setFilterPeriod(v)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
              {!projectId && (
                <Select value={filterProject} onValueChange={setFilterProject}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading...</p>
          ) : entries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No time entries found</p>
          ) : (
            <div className="space-y-3">
              {entries.map(entry => (
                <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {format(new Date(entry.start_time), 'MMM d, yyyy h:mm a')}
                      </span>
                      {entry.is_billable && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Billable
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {entry.project?.name || 'No project'} • {entry.description || 'No description'}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="font-medium">{formatDuration(entry.duration_minutes)}</span>
                      {entry.is_billable && entry.hourly_rate && (
                        <span className="text-green-600">
                          ${entry.hourly_rate}/hr = ${((entry.duration_minutes || 0) / 60 * entry.hourly_rate).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteEntry(entry.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
