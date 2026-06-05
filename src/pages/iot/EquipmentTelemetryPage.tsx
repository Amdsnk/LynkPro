import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck } from 'lucide-react';

export default function EquipmentTelemetryPage() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-2">
          <Truck className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Equipment Telemetry</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Equipment Monitoring</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">GPS tracking, fuel levels, engine hours</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
