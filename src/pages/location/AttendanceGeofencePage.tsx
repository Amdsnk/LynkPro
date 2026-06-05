import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export default function AttendanceGeofencePage() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Geofence Attendance</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Auto Check-in/Out</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Automatic attendance based on geofence entry/exit</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
