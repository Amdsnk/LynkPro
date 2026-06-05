import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

export default function ChangeOrderAnalyticsPage() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Change Order Analytics</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Trend Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Change order trends and cost impact analysis</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
