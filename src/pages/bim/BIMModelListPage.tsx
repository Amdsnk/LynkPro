import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { BIMModel } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Box, Upload, Search, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

export default function BIMModelListPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [models, setModels] = useState<BIMModel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchModels();
  }, []);

  async function fetchModels() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('firm_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.firm_id) return;

      const { data, error } = await supabase
        .from('bim_models')
        .select('*')
        .eq('firm_id', profile.firm_id)
        .order('upload_date', { ascending: false });

      if (error) throw error;

      setModels(data || []);
    } catch (error) {
      console.error('Error fetching BIM models:', error);
      toast.error('Failed to load BIM models');
    } finally {
      setLoading(false);
    }
  }

  const filteredModels = models.filter(model =>
    model.model_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function formatFileSize(bytes: number | null): string {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(2)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading BIM models...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Box className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">BIM Models</h1>
            </div>
            <p className="text-muted-foreground mt-2">
              Manage 3D building information models
            </p>
          </div>
          <Button onClick={() => toast.info('Upload feature requires file storage setup')}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Model
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search models..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredModels.length === 0 ? (
              <div className="text-center py-12">
                <Box className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'No models found matching your search' : 'No BIM models uploaded yet'}
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => toast.info('Upload feature requires file storage setup')}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Your First Model
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredModels.map((model) => (
                  <div
                    key={model.id}
                    className="p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/bim/viewer/${model.id}`)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{model.model_name}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatFileSize(model.file_size)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Uploaded {format(parseISO(model.upload_date), 'MMM d, yyyy')}
                        </p>
                        {model.version && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Version {model.version}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About BIM Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong>BIM (Building Information Modeling)</strong> integration enables 3D model viewing, issue tracking, and progress monitoring directly in the field.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-3 rounded-lg border">
                  <p className="font-medium text-foreground">Supported Formats</p>
                  <p className="text-xs mt-1">IFC, RVT, NWD, DWG</p>
                </div>
                <div className="p-3 rounded-lg border">
                  <p className="font-medium text-foreground">Features</p>
                  <p className="text-xs mt-1">3D viewing, measurements, issue linking</p>
                </div>
              </div>
              <p className="text-xs mt-4">
                <strong>Note:</strong> Full 3D rendering requires Three.js/IFC.js integration. Contact support for setup assistance.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
