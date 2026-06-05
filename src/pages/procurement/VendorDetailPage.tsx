import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { Vendor, VendorPerformance } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Star, TrendingUp, Clock, Mail, Phone, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { aggregateVendorMetrics } from '@/lib/vendorPerformance';
import { format, parseISO } from 'date-fns';

export default function VendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [performances, setPerformances] = useState<VendorPerformance[]>([]);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  async function fetchData() {
    try {
      // Fetch vendor
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (vendorError) throw vendorError;
      if (!vendorData) {
        toast.error('Vendor not found');
        navigate('/vendors');
        return;
      }

      // Fetch performance records
      const { data: performanceData, error: performanceError } = await supabase
        .from('vendor_performance')
        .select('*')
        .eq('vendor_id', id)
        .order('delivery_date', { ascending: false });

      if (performanceError) throw performanceError;

      setVendor(vendorData);
      setPerformances(performanceData || []);
    } catch (error) {
      console.error('Error fetching vendor details:', error);
      toast.error('Failed to load vendor details');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading vendor details...</p>
        </div>
      </div>
    );
  }

  if (!vendor) return null;

  const metrics = aggregateVendorMetrics(vendor, performances);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      active: 'default',
      inactive: 'secondary',
      suspended: 'destructive',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/vendors')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{vendor.name}</h1>
                {getStatusBadge(vendor.status)}
              </div>
              <p className="text-muted-foreground mt-1">Vendor Profile</p>
            </div>
          </div>
          <Button onClick={() => navigate(`/vendors/${id}/edit`)}>
            Edit Vendor
          </Button>
        </div>

        {/* Contact & Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {vendor.contact_name && (
                <div>
                  <p className="text-sm text-muted-foreground">Contact Person</p>
                  <p className="font-medium">{vendor.contact_name}</p>
                </div>
              )}
              
              {vendor.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${vendor.email}`} className="text-sm hover:underline">
                    {vendor.email}
                  </a>
                </div>
              )}
              
              {vendor.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${vendor.phone}`} className="text-sm hover:underline">
                    {vendor.phone}
                  </a>
                </div>
              )}
              
              {vendor.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p className="text-sm whitespace-pre-wrap">{vendor.address}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm text-muted-foreground">Overall Rating</span>
                </div>
                <span className="text-2xl font-bold">
                  {vendor.rating ? vendor.rating.toFixed(1) : 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">On-Time Delivery</span>
                </div>
                <span className="text-2xl font-bold">
                  {metrics.onTimeRate.toFixed(0)}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Avg Lead Time</span>
                </div>
                <span className="text-2xl font-bold">
                  {metrics.avgLeadTime > 0 ? `${metrics.avgLeadTime.toFixed(0)}d` : 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <span className="text-sm text-muted-foreground">Performance Score</span>
                <span className="text-2xl font-bold text-primary">
                  {metrics.performanceScore.toFixed(0)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.totalOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                On-Time Deliveries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{metrics.onTimeDeliveries}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Late Deliveries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{metrics.lateDeliveries}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Quality
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {metrics.avgQualityRating > 0 ? metrics.avgQualityRating.toFixed(1) : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">out of 5.0</p>
            </CardContent>
          </Card>
        </div>

        {/* Notes */}
        {vendor.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{vendor.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Performance History */}
        <Card>
          <CardHeader>
            <CardTitle>Performance History</CardTitle>
          </CardHeader>
          <CardContent>
            {performances.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No performance records yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Delivery Date</th>
                      <th className="text-left py-3 px-4 font-medium">Promised Date</th>
                      <th className="text-center py-3 px-4 font-medium">On Time</th>
                      <th className="text-center py-3 px-4 font-medium">Quality</th>
                      <th className="text-left py-3 px-4 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performances.map((perf) => (
                      <tr key={perf.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-4 px-4">
                          {perf.delivery_date ? format(parseISO(perf.delivery_date), 'MMM d, yyyy') : 'N/A'}
                        </td>
                        <td className="py-4 px-4">
                          {perf.promised_date ? format(parseISO(perf.promised_date), 'MMM d, yyyy') : 'N/A'}
                        </td>
                        <td className="py-4 px-4 text-center">
                          {perf.on_time !== null && perf.on_time !== undefined ? (
                            <Badge variant={perf.on_time ? 'default' : 'destructive'}>
                              {perf.on_time ? 'Yes' : 'No'}
                            </Badge>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          {perf.quality_rating ? (
                            <div className="flex items-center justify-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span>{perf.quality_rating}</span>
                            </div>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td className="py-4 px-4 text-sm text-muted-foreground">
                          {perf.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
