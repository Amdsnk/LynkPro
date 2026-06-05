import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export default function CalendarDashboard() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-2">
          <Calendar className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Calendar Dashboard</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Project Events</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Unified calendar view of all project events</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
