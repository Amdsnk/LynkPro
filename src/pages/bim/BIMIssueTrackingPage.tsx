import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function BIMIssueTrackingPage() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">BIM Issue Tracking</h1>
          <p className="text-muted-foreground mt-2">Link issues to specific model locations</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Model Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No issues linked to BIM models yet</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
