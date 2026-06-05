import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';

export default function RiskComplianceDashboard() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Risk & Compliance Dashboard</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Comprehensive Risk View</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Unified view of all risk and compliance metrics</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
