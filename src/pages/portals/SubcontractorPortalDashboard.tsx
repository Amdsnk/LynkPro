import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function SubcontractorPortalDashboard() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-2">
          <Users className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Subcontractor Portal</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>My Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Assigned tasks and timesheets</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
