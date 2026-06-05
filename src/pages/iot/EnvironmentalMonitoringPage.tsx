import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wind } from 'lucide-react';

export default function EnvironmentalMonitoringPage() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-2">
          <Wind className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Environmental Monitoring</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Environmental Sensors</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Temperature, humidity, air quality monitoring</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
