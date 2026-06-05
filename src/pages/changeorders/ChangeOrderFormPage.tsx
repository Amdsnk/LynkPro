import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ChangeOrderFormPage() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/change-orders')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">New Change Order</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Change Order Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Form implementation with react-hook-form</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
