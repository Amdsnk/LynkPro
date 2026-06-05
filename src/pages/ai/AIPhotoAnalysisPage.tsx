import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Sparkles, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { analyzePhotoForIssues } from '@/lib/aiHelpers';

export default function AIPhotoAnalysisPage() {
  const navigate = useNavigate();
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  }

  async function handleAnalyze() {
    if (!selectedFile) {
      toast.error('Please select a photo first');
      return;
    }

    setAnalyzing(true);

    try {
      // Simulate upload and analysis (in production, upload to Supabase Storage)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate AI analysis
      const photoUrl = previewUrl || '';
      const detectedIssues = analyzePhotoForIssues(photoUrl);

      toast.success(`Analysis complete! ${detectedIssues.length} issues detected`);

      // Navigate to detected issues page with results
      navigate('/ai/detected-issues', {
        state: { issues: detectedIssues, photoUrl: previewUrl },
      });
    } catch (error) {
      console.error('Error analyzing photo:', error);
      toast.error('Failed to analyze photo');
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">AI Photo Analysis</h1>
          </div>
          <p className="text-muted-foreground mt-2">
            Upload construction site photos for automated issue detection
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload Photo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              {previewUrl ? (
                <div className="space-y-4">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-96 mx-auto rounded-lg"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                  >
                    Remove Photo
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto" />
                  <div>
                    <p className="text-lg font-medium">Drop your photo here</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      or click to browse
                    </p>
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="max-w-xs mx-auto"
                  />
                </div>
              )}
            </div>

            {selectedFile && (
              <div className="flex items-center justify-center">
                <Button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  size="lg"
                >
                  {analyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Analyze with AI
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What AI Can Detect</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border">
                <p className="font-medium">Structural Issues</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Cracks, misalignments, water damage
                </p>
              </div>
              <div className="p-4 rounded-lg border">
                <p className="font-medium">Safety Violations</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Missing PPE, unsafe conditions
                </p>
              </div>
              <div className="p-4 rounded-lg border">
                <p className="font-medium">Quality Defects</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Improper installations, defects
                </p>
              </div>
              <div className="p-4 rounded-lg border">
                <p className="font-medium">Material Issues</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Damage, incorrect materials
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
