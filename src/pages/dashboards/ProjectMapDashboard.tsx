import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Map } from 'lucide-react';

export default function ProjectMapDashboard() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-2">
          <Map className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Project Map</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Project Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Geographic view of all projects</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
