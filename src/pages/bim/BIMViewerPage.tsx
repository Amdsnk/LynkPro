import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Box, Maximize, Minimize } from 'lucide-react';

export default function BIMViewerPage() {
  const { modelId } = useParams<{ modelId: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/bim/models')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">BIM Model Viewer</h1>
            <p className="text-muted-foreground mt-1">3D model visualization and navigation</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>3D Model View</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video rounded-lg border bg-muted/20 flex items-center justify-center">
              <div className="text-center">
                <Box className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">3D Model Viewer</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  Full 3D BIM viewer requires Three.js and IFC.js integration for IFC file parsing and WebGL rendering.
                </p>
                <Badge variant="secondary" className="mt-4">3D Rendering Integration Required</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Model Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => {}}>
                <Maximize className="h-4 w-4 mr-2" />
                Measure
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => {}}>
                <Minimize className="h-4 w-4 mr-2" />
                Section
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
