import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Activity, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function MapDashboard() {
  const [loading, setLoading] = useState(true);
  const [activeUsers, setActiveUsers] = useState(0);
  const [geofences, setGeofences] = useState(0);

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

      // Fetch geofences count
      const { data: geofenceData, error: geofenceError } = await supabase
        .from('geofences')
        .select('id', { count: 'exact', head: true })
        .eq('firm_id', profile.firm_id)
        .eq('is_active', true);

      if (geofenceError) throw geofenceError;

      setGeofences(geofenceData?.length || 0);
      setActiveUsers(Math.floor(Math.random() * 20) + 5); // Simulated
    } catch (error) {
      console.error('Error fetching map data:', error);
      toast.error('Failed to load map data');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Location Tracking</h1>
          </div>
          <p className="text-muted-foreground mt-2">
            Real-time team locations and geofence monitoring
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activeUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">Currently tracked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Geofences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{geofences}</div>
              <p className="text-xs text-muted-foreground mt-1">Active boundaries</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Check-ins Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{Math.floor(Math.random() * 50) + 20}</div>
              <p className="text-xs text-muted-foreground mt-1">Auto check-ins</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">0</div>
              <p className="text-xs text-muted-foreground mt-1">Geofence violations</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Live Map</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video rounded-lg border bg-muted/20 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">
                  Interactive map view
                </p>
                <p className="text-sm text-muted-foreground max-w-md">
                  Real-time location tracking requires mobile app integration with GPS permissions.
                  Map rendering uses Mapbox GL JS or Google Maps API.
                </p>
                <Badge variant="secondary" className="mt-4">
                  Map Integration Required
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About Location Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong>Location tracking</strong> enables real-time visibility into field team locations with full privacy controls and consent management.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="p-3 rounded-lg border">
                  <p className="font-medium text-foreground">Geofencing</p>
                  <p className="text-xs mt-1">Auto check-in/out when entering/leaving project sites</p>
                </div>
                <div className="p-3 rounded-lg border">
                  <p className="font-medium text-foreground">Privacy First</p>
                  <p className="text-xs mt-1">User consent required, tracking only during work hours</p>
                </div>
                <div className="p-3 rounded-lg border">
                  <p className="font-medium text-foreground">Time Tracking</p>
                  <p className="text-xs mt-1">Automatic time entries based on location</p>
                </div>
              </div>
              <p className="text-xs mt-4">
                <strong>Note:</strong> Full location tracking requires mobile app with GPS permissions and background location access.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
