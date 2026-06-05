import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { IoTDevice } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Thermometer, Droplet, Wind, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function IoTDashboard() {
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState<IoTDevice[]>([]);

  useEffect(() => {
    fetchDevices();
  }, []);

  async function fetchDevices() {
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
        .from('iot_devices')
        .select('*')
        .eq('firm_id', profile.firm_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDevices(data || []);
    } catch (error) {
      console.error('Error fetching IoT devices:', error);
      toast.error('Failed to load IoT devices');
    } finally {
      setLoading(false);
    }
  }

  function getDeviceIcon(type: string) {
    switch (type) {
      case 'temp_sensor': return <Thermometer className="h-5 w-5" />;
      case 'humidity_sensor': return <Droplet className="h-5 w-5" />;
      case 'air_quality_sensor': return <Wind className="h-5 w-5" />;
      case 'fuel_monitor': return <Zap className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  }

  function getStatusBadge(status: string): 'default' | 'secondary' | 'destructive' {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'error': return 'destructive';
      case 'maintenance': return 'secondary';
      default: return 'secondary';
    }
  }

  const stats = {
    total: devices.length,
    active: devices.filter(d => d.status === 'active').length,
    error: devices.filter(d => d.status === 'error').length,
    uptime: devices.length > 0 ? ((devices.filter(d => d.status === 'active').length / devices.length) * 100).toFixed(1) : '0',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading IoT devices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">IoT Dashboard</h1>
          </div>
          <p className="text-muted-foreground mt-2">
            Real-time sensor data and equipment telemetry
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Devices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Errors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{stats.error}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Uptime
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.uptime}%</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Connected Devices ({devices.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {devices.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">
                  No IoT devices connected yet
                </p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Connect sensors and equipment to monitor temperature, humidity, fuel levels, and more in real-time.
                </p>
                <Badge variant="secondary" className="mt-4">
                  IoT Gateway Setup Required
                </Badge>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          {getDeviceIcon(device.device_type)}
                        </div>
                        <div>
                          <p className="font-medium">{device.device_name || device.device_id}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {device.device_type.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <Badge variant={getStatusBadge(device.status)}>
                        {device.status}
                      </Badge>
                    </div>
                    
                    {device.last_reading_at && (
                      <p className="text-xs text-muted-foreground">
                        Last reading: {new Date(device.last_reading_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About IoT Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong>IoT Integration</strong> enables real-time monitoring of equipment, environmental conditions, and concrete curing through connected sensors.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="p-3 rounded-lg border">
                  <p className="font-medium text-foreground">Equipment Telemetry</p>
                  <p className="text-xs mt-1">GPS tracking, fuel levels, engine hours, diagnostics</p>
                </div>
                <div className="p-3 rounded-lg border">
                  <p className="font-medium text-foreground">Environmental Monitoring</p>
                  <p className="text-xs mt-1">Temperature, humidity, air quality, noise levels</p>
                </div>
                <div className="p-3 rounded-lg border">
                  <p className="font-medium text-foreground">Concrete Curing</p>
                  <p className="text-xs mt-1">Temperature monitoring, strength prediction, alerts</p>
                </div>
              </div>
              <p className="text-xs mt-4">
                <strong>Note:</strong> IoT integration requires AWS IoT Core or Azure IoT Hub setup with MQTT protocol support.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
