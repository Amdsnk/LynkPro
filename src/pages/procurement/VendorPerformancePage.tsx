import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { Vendor, VendorPerformance } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, TrendingUp, Clock, Download } from 'lucide-react';
import { toast } from 'sonner';
import { aggregateVendorMetrics, rankVendors } from '@/lib/vendorPerformance';

export default function VendorPerformancePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [performances, setPerformances] = useState<Map<string, VendorPerformance[]>>(new Map());

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('firm_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.firm_id) return;

      // Fetch vendors
      const { data: vendorsData, error: vendorsError } = await supabase
        .from('vendors')
        .select('*')
        .eq('firm_id', profile.firm_id)
        .eq('status', 'active');

      if (vendorsError) throw vendorsError;

      // Fetch all performance records
      const { data: performanceData, error: performanceError } = await supabase
        .from('vendor_performance')
        .select('*');

      if (performanceError) throw performanceError;

      // Group performances by vendor
      const perfMap = new Map<string, VendorPerformance[]>();
      performanceData?.forEach(perf => {
        const existing = perfMap.get(perf.vendor_id) || [];
        perfMap.set(perf.vendor_id, [...existing, perf]);
      });

      setVendors(vendorsData || []);
      setPerformances(perfMap);
    } catch (error) {
      console.error('Error fetching vendor performance:', error);
      toast.error('Failed to load vendor performance');
    } finally {
      setLoading(false);
    }
  }

  function exportToCSV() {
    const csvRows = [
      ['Vendor Name', 'Rating', 'On-Time Rate', 'Avg Lead Time', 'Total Orders', 'Performance Score'].join(',')
    ];

    vendors.forEach(vendor => {
      const vendorPerf = performances.get(vendor.id) || [];
      const metrics = aggregateVendorMetrics(vendor, vendorPerf);
      
      csvRows.push([
        vendor.name,
        vendor.rating?.toFixed(1) || 'N/A',
        `${metrics.onTimeRate.toFixed(0)}%`,
        metrics.avgLeadTime > 0 ? `${metrics.avgLeadTime.toFixed(0)} days` : 'N/A',
        metrics.totalOrders.toString(),
        metrics.performanceScore.toFixed(0),
      ].join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendor-performance-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Performance data exported');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading vendor performance...</p>
        </div>
      </div>
    );
  }

  const rankedVendors = rankVendors(vendors);
  const topPerformers = rankedVendors.filter(v => {
    const vendorPerf = performances.get(v.id) || [];
    const metrics = aggregateVendorMetrics(v, vendorPerf);
    return metrics.performanceScore >= 80;
  });

  const avgRating = vendors.length > 0
    ? vendors.reduce((sum, v) => sum + (v.rating || 0), 0) / vendors.filter(v => v.rating).length
    : 0;

  const totalOrders = Array.from(performances.values()).reduce((sum, perfs) => sum + perfs.length, 0);

  const avgOnTimeRate = vendors.length > 0
    ? vendors.reduce((sum, v) => {
        const vendorPerf = performances.get(v.id) || [];
        const metrics = aggregateVendorMetrics(v, vendorPerf);
        return sum + metrics.onTimeRate;
      }, 0) / vendors.length
    : 0;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Vendor Performance Analytics</h1>
            <p className="text-muted-foreground mt-2">
              Track and analyze vendor performance metrics
            </p>
          </div>
          <Button onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Star className="h-4 w-4" />
                Average Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {avgRating > 0 ? avgRating.toFixed(1) : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">out of 5.0</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{topPerformers.length}</div>
              <p className="text-xs text-muted-foreground mt-1">score ≥80%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalOrders}</div>
              <p className="text-xs text-muted-foreground mt-1">all vendors</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Avg On-Time Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{avgOnTimeRate.toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground mt-1">across all vendors</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Vendor Performance Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            {rankedVendors.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No vendor performance data available</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Rank</th>
                      <th className="text-left py-3 px-4 font-medium">Vendor</th>
                      <th className="text-center py-3 px-4 font-medium">Rating</th>
                      <th className="text-right py-3 px-4 font-medium">Orders</th>
                      <th className="text-right py-3 px-4 font-medium">On-Time</th>
                      <th className="text-right py-3 px-4 font-medium">Lead Time</th>
                      <th className="text-right py-3 px-4 font-medium">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankedVendors.map((vendor, index) => {
                      const vendorPerf = performances.get(vendor.id) || [];
                      const metrics = aggregateVendorMetrics(vendor, vendorPerf);
                      const scoreColor = metrics.performanceScore >= 80 ? 'text-green-600' :
                                        metrics.performanceScore >= 60 ? 'text-yellow-600' :
                                        'text-destructive';

                      return (
                        <tr
                          key={vendor.id}
                          className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/vendors/${vendor.id}`)}
                        >
                          <td className="py-4 px-4 font-medium">#{index + 1}</td>
                          <td className="py-4 px-4 font-medium">{vendor.name}</td>
                          <td className="py-4 px-4 text-center">
                            {vendor.rating ? (
                              <div className="flex items-center justify-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span>{vendor.rating.toFixed(1)}</span>
                              </div>
                            ) : (
                              'N/A'
                            )}
                          </td>
                          <td className="py-4 px-4 text-right">{metrics.totalOrders}</td>
                          <td className="py-4 px-4 text-right">{metrics.onTimeRate.toFixed(0)}%</td>
                          <td className="py-4 px-4 text-right">
                            {metrics.avgLeadTime > 0 ? `${metrics.avgLeadTime.toFixed(0)}d` : 'N/A'}
                          </td>
                          <td className={`py-4 px-4 text-right font-bold ${scoreColor}`}>
                            {metrics.performanceScore.toFixed(0)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Performers */}
        {topPerformers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top Performers (Score ≥80%)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topPerformers.slice(0, 6).map((vendor) => {
                  const vendorPerf = performances.get(vendor.id) || [];
                  const metrics = aggregateVendorMetrics(vendor, vendorPerf);

                  return (
                    <div
                      key={vendor.id}
                      className="p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/vendors/${vendor.id}`)}
                    >
                      <p className="font-medium mb-2">{vendor.name}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Score:</span>
                        <span className="font-bold text-green-600">
                          {metrics.performanceScore.toFixed(0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-muted-foreground">Orders:</span>
                        <span>{metrics.totalOrders}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-muted-foreground">On-Time:</span>
                        <span>{metrics.onTimeRate.toFixed(0)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
