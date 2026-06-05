import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { Vendor } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Star, TrendingUp, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { calculatePerformanceScore } from '@/lib/vendorPerformance';

export default function VendorListPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchVendors();
  }, []);

  async function fetchVendors() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('firm_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.firm_id) return;

      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('firm_id', profile.firm_id)
        .order('name');

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  }

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.contact_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vendor.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: vendors.length,
    active: vendors.filter(v => v.status === 'active').length,
    avgRating: vendors.length > 0
      ? vendors.reduce((sum, v) => sum + (v.rating || 0), 0) / vendors.filter(v => v.rating).length
      : 0,
    topPerformers: vendors.filter(v => calculatePerformanceScore(v) >= 80).length,
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      active: 'default',
      inactive: 'secondary',
      suspended: 'destructive',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading vendors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Vendor Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage your vendor directory and track performance
            </p>
          </div>
          <Button onClick={() => navigate('/vendors/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Vendors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.active} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Star className="h-4 w-4" />
                Average Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : 'N/A'}
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
              <div className="text-3xl font-bold">{stats.topPerformers}</div>
              <p className="text-xs text-muted-foreground mt-1">score ≥80%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Avg Lead Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {vendors.filter(v => v.average_lead_time_days).length > 0
                  ? Math.round(
                      vendors.reduce((sum, v) => sum + (v.average_lead_time_days || 0), 0) /
                      vendors.filter(v => v.average_lead_time_days).length
                    )
                  : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">days</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vendors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === 'active' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('active')}
                >
                  Active
                </Button>
                <Button
                  variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('inactive')}
                >
                  Inactive
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vendors List */}
        <Card>
          <CardHeader>
            <CardTitle>Vendors ({filteredVendors.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredVendors.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all'
                    ? 'No vendors match your filters'
                    : 'No vendors yet. Add your first vendor to get started.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredVendors.map((vendor) => {
                  const performanceScore = calculatePerformanceScore(vendor);
                  
                  return (
                    <div
                      key={vendor.id}
                      className="p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/vendors/${vendor.id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-medium text-lg">{vendor.name}</p>
                            {getStatusBadge(vendor.status)}
                          </div>
                          
                          {vendor.contact_name && (
                            <p className="text-sm text-muted-foreground">
                              Contact: {vendor.contact_name}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 mt-3 text-sm">
                            {vendor.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span>{vendor.rating.toFixed(1)}</span>
                              </div>
                            )}
                            
                            {vendor.on_time_delivery_rate !== null && vendor.on_time_delivery_rate !== undefined && (
                              <div className="flex items-center gap-1">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                <span>{vendor.on_time_delivery_rate.toFixed(0)}% on-time</span>
                              </div>
                            )}
                            
                            {vendor.average_lead_time_days && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{vendor.average_lead_time_days} days lead time</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {performanceScore.toFixed(0)}
                          </div>
                          <p className="text-xs text-muted-foreground">Performance</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
