import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/db/supabase';
import type { File as ProjectFile } from '@/types/types';
import { Download, X } from 'lucide-react';
import { toast } from 'sonner';

interface FilePreviewProps {
  file: ProjectFile;
  open: boolean;
  onClose: () => void;
}

export function FilePreview({ file, open, onClose }: FilePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && file) {
      loadPreview();
    }

    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [open, file]);

  const loadPreview = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('project-files')
        .download(file.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      setPreviewUrl(url);
    } catch (error) {
      console.error('Error loading preview:', error);
      toast.error('Failed to load preview');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('project-files')
        .download(file.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('File downloaded successfully');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const isImage = file.file_type.startsWith('image/');
  const isPDF = file.file_type === 'application/pdf';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="truncate pr-4">{file.name}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <Skeleton className="w-full h-full bg-muted" />
            </div>
          ) : (
            <>
              {isImage && previewUrl && (
                <div className="flex items-center justify-center bg-muted/30 rounded-lg p-4">
                  <img
                    src={previewUrl}
                    alt={file.name}
                    className="max-w-full max-h-[70vh] object-contain"
                  />
                </div>
              )}

              {isPDF && previewUrl && (
                <iframe
                  src={previewUrl}
                  className="w-full h-[70vh] border-0 rounded-lg"
                  title={file.name}
                />
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>{formatFileSize(file.file_size)}</span>
            <span>•</span>
            <span>{new Date(file.created_at).toLocaleDateString()}</span>
            {file.version > 1 && (
              <>
                <span>•</span>
                <span>Version {file.version}</span>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
