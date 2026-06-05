import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangePicker, type DateRange, type DateRangePreset } from '@/components/analytics/DateRangePicker';
import { ExportButton } from '@/components/analytics/ExportButton';
import { AddDummyDataButton } from '@/components/AddDummyDataButton';
import { supabase } from '@/db/supabase';
import { parseUserAgent } from '@/lib/analytics';
import type { FileShare, ShareAccessLog, File as ProjectFile } from '@/types/types';
import { BarChart3, TrendingUp, Users, Download, Clock, FileText, Globe, Smartphone } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface AnalyticsData {
  totalShares: number;
  activeShares: number;
  expiredShares: number;
  totalViews: number;
  totalDownloads: number;
  avgViewsPerShare: number;
  downloadRate: number;
  sharesOverTime: Array<{ date: string; count: number }>;
  mostSharedFiles: Array<{ name: string; count: number }>;
  topRecipients: Array<{ email: string; count: number }>;
  deviceStats: Array<{ name: string; value: number }>;
  browserStats: Array<{ name: string; value: number }>;
  fileTypeStats: Array<{ name: string; value: number }>;
  activityHeatmap: Array<{ day: string; hour: number; count: number }>;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--success))', 'hsl(var(--warning))'];

export default function ShareAnalyticsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<DateRangePreset>('allTime');
  const [rawData, setRawData] = useState<{ shares: FileShare[]; logs: ShareAccessLog[]; files: ProjectFile[] } | null>(null);

  useEffect(() => {
    // Read date range from URL
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const preset = searchParams.get('preset') as DateRangePreset;

    if (from && to) {
      setDateRange({ from: new Date(from), to: new Date(to) });
      setSelectedPreset(preset || 'custom');
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const handleDateRangeChange = (range: DateRange | null, preset: DateRangePreset) => {
    setDateRange(range);
    setSelectedPreset(preset);

    // Update URL
    if (range) {
      setSearchParams({
        from: range.from.toISOString(),
        to: range.to.toISOString(),
        preset,
      });
    } else {
      setSearchParams({});
    }
  };

  const fetchAnalytics = async () => {
    try {
      // Fetch all shares
      const { data: allShares, error: sharesError } = await supabase
        .from('file_shares')
        .select('*');

      if (sharesError) throw sharesError;

      // Fetch all access logs
      const { data: allLogs, error: logsError } = await supabase
        .from('share_access_logs')
        .select('*');

      if (logsError) throw logsError;

      // Filter by date range
      let shares = allShares;
      let logs = allLogs;

      if (dateRange) {
        const fromTime = dateRange.from.getTime();
        const toTime = dateRange.to.getTime() + 24 * 60 * 60 * 1000; // Include end date

        shares = allShares.filter(s => {
          const createdAt = new Date(s.created_at).getTime();
          return createdAt >= fromTime && createdAt < toTime;
        });

        logs = allLogs.filter(l => {
          const accessedAt = new Date(l.accessed_at).getTime();
          return accessedAt >= fromTime && accessedAt < toTime;
        });
      }

      // Fetch files for share analysis
      const { data: files, error: filesError } = await supabase
        .from('files')
        .select('*');

      if (filesError) throw filesError;

      // Calculate statistics
      const now = new Date();
      const activeShares = shares.filter(s => !s.expires_at || new Date(s.expires_at) > now);
      const expiredShares = shares.filter(s => s.expires_at && new Date(s.expires_at) <= now);
      
      const totalViews = logs.filter(l => l.action === 'view').length;
      const totalDownloads = logs.filter(l => l.action === 'download').length;
      const avgViewsPerShare = shares.length > 0 ? totalViews / shares.length : 0;
      const downloadRate = totalViews > 0 ? (totalDownloads / totalViews) * 100 : 0;

      // Shares over time (last 30 days)
      const sharesOverTime = generateSharesOverTime(shares);

      // Most shared files
      const mostSharedFiles = generateMostSharedFiles(shares, files);

      // Top recipients
      const topRecipients = generateTopRecipients(shares);

      // Device and browser stats
      const { deviceStats, browserStats } = generateDeviceBrowserStats(logs);

      // File type stats
      const fileTypeStats = generateFileTypeStats(shares, files);

      // Activity heatmap
      const activityHeatmap = generateActivityHeatmap(logs);

      setAnalytics({
        totalShares: shares.length,
        activeShares: activeShares.length,
        expiredShares: expiredShares.length,
        totalViews,
        totalDownloads,
        avgViewsPerShare,
        downloadRate,
        sharesOverTime,
        mostSharedFiles,
        topRecipients,
        deviceStats,
        browserStats,
        fileTypeStats,
        activityHeatmap,
      });

      // Store raw data for export
      setRawData({ shares, logs, files });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSharesOverTime = (shares: FileShare[]) => {
    if (!dateRange) {
      // Default: last 30 days
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return date.toISOString().split('T')[0];
      });

      const counts = last30Days.map(date => {
        const count = shares.filter(s => s.created_at.startsWith(date)).length;
        return { date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count };
      });

      return counts;
    }

    // Use date range
    const days: string[] = [];
    const current = new Date(dateRange.from);
    const end = new Date(dateRange.to);

    while (current <= end) {
      days.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    const counts = days.map(date => {
      const count = shares.filter(s => s.created_at.startsWith(date)).length;
      return { date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count };
    });

    return counts;
  };

  const generateMostSharedFiles = (shares: FileShare[], files: ProjectFile[]) => {
    const fileCounts: Record<string, number> = {};
    
    shares.forEach(share => {
      if (share.file_id) {
        fileCounts[share.file_id] = (fileCounts[share.file_id] || 0) + 1;
      }
    });

    const sorted = Object.entries(fileCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    return sorted.map(([fileId, count]) => {
      const file = files.find(f => f.id === fileId);
      return { name: file?.name || 'Unknown', count };
    });
  };

  const generateTopRecipients = (shares: FileShare[]) => {
    const recipientCounts: Record<string, number> = {};
    
    shares.forEach(share => {
      if (share.shared_with_email) {
        recipientCounts[share.shared_with_email] = (recipientCounts[share.shared_with_email] || 0) + 1;
      }
    });

    const sorted = Object.entries(recipientCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    return sorted.map(([email, count]) => ({ email, count }));
  };

  const generateDeviceBrowserStats = (logs: ShareAccessLog[]) => {
    const deviceCounts: Record<string, number> = {};
    const browserCounts: Record<string, number> = {};

    logs.forEach(log => {
      if (log.user_agent) {
        const parsed = parseUserAgent(log.user_agent);
        deviceCounts[parsed.device] = (deviceCounts[parsed.device] || 0) + 1;
        browserCounts[parsed.browser] = (browserCounts[parsed.browser] || 0) + 1;
      }
    });

    const deviceStats = Object.entries(deviceCounts).map(([name, value]) => ({ name, value }));
    const browserStats = Object.entries(browserCounts).map(([name, value]) => ({ name, value }));

    return { deviceStats, browserStats };
  };

  const generateFileTypeStats = (shares: FileShare[], files: ProjectFile[]) => {
    const typeCounts: Record<string, number> = {};

    shares.forEach(share => {
      if (share.file_id) {
        const file = files.find(f => f.id === share.file_id);
        if (file) {
          const type = file.file_type.split('/')[0] || 'other';
          typeCounts[type] = (typeCounts[type] || 0) + 1;
        }
      }
    });

    return Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
  };

  const generateActivityHeatmap = (logs: ShareAccessLog[]) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const heatmap: Array<{ day: string; hour: number; count: number }> = [];

    days.forEach(day => {
      for (let hour = 0; hour < 24; hour++) {
        heatmap.push({ day, hour, count: 0 });
      }
    });

    logs.forEach(log => {
      const date = new Date(log.accessed_at);
      const day = days[date.getDay()];
      const hour = date.getHours();
      const entry = heatmap.find(h => h.day === day && h.hour === hour);
      if (entry) entry.count++;
    });

    return heatmap;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64 bg-muted" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 bg-muted" />
          ))}
        </div>
        <Skeleton className="h-96 bg-muted" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container mx-auto p-6">
        <div className="empty-state">
          <BarChart3 className="empty-state-icon" />
          <p className="empty-state-title">No analytics data</p>
          <p className="empty-state-description">
            Create some shares to see analytics
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Share Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your file sharing activity
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            selectedPreset={selectedPreset}
          />
          <div className="flex gap-2">
            <AddDummyDataButton />
            {analytics && rawData && (
              <ExportButton
                data={{
                  shares: rawData.shares,
                  logs: rawData.logs,
                  files: rawData.files,
                  metrics: {
                    totalShares: analytics.totalShares,
                    activeShares: analytics.activeShares,
                    expiredShares: analytics.expiredShares,
                    totalViews: analytics.totalViews,
                    totalDownloads: analytics.totalDownloads,
                    avgViewsPerShare: analytics.avgViewsPerShare,
                    downloadRate: analytics.downloadRate,
                  },
                  dateRange,
                }}
                chartIds={[
                  'shares-over-time-chart',
                  'share-status-chart',
                  'most-shared-files-chart',
                  'file-type-chart',
                  'top-recipients-chart',
                  'device-chart',
                  'browser-chart',
                ]}
              />
            )}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-enhanced">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalShares}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.activeShares} active, {analytics.expiredShares} expired
            </p>
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalViews}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.avgViewsPerShare.toFixed(1)} avg per share
            </p>
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalDownloads}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.downloadRate.toFixed(1)}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recipients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.topRecipients.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Unique email recipients
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Shares Over Time */}
          <Card className="card-enhanced" id="shares-over-time-chart">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Shares Created Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.sharesOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Active vs Expired */}
          <Card className="card-enhanced" id="share-status-chart">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Share Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Active', value: analytics.activeShares },
                      { name: 'Expired', value: analytics.expiredShares },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label
                  >
                    {[0, 1].map((index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="space-y-6">
          {/* Most Shared Files */}
          <Card className="card-enhanced" id="most-shared-files-chart">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Most Shared Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.mostSharedFiles.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analytics.mostSharedFiles} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="hsl(var(--muted-foreground))"
                      width={150}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state py-8">
                  <FileText className="empty-state-icon" />
                  <p className="empty-state-title">No file data</p>
                  <p className="empty-state-description">
                    Share some files to see statistics
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* File Type Distribution */}
          <Card className="card-enhanced" id="file-type-chart">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                File Type Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.fileTypeStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.fileTypeStats}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label
                    >
                      {analytics.fileTypeStats.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state py-8">
                  <FileText className="empty-state-icon" />
                  <p className="empty-state-title">No file type data</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          {/* Top Recipients */}
          <Card className="card-enhanced" id="top-recipients-chart">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top Recipients
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.topRecipients.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analytics.topRecipients} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                    <YAxis
                      type="category"
                      dataKey="email"
                      stroke="hsl(var(--muted-foreground))"
                      width={200}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--secondary))" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state py-8">
                  <Users className="empty-state-icon" />
                  <p className="empty-state-title">No recipient data</p>
                  <p className="empty-state-description">
                    Share files with specific recipients to see statistics
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Device Stats */}
            <Card className="card-enhanced" id="device-chart">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Device Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.deviceStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.deviceStats}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label
                      >
                        {analytics.deviceStats.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state py-8">
                    <Smartphone className="empty-state-icon" />
                    <p className="empty-state-title">No device data</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Browser Stats */}
            <Card className="card-enhanced" id="browser-chart">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Browser Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.browserStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.browserStats}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label
                      >
                        {analytics.browserStats.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state py-8">
                    <Globe className="empty-state-icon" />
                    <p className="empty-state-title">No browser data</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
