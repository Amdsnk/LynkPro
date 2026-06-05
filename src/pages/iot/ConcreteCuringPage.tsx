import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Thermometer } from 'lucide-react';

export default function ConcreteCuringPage() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-2">
          <Thermometer className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Concrete Curing Monitoring</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Curing Temperature</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Real-time concrete temperature and strength prediction</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
