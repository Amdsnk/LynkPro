import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Upload, X, FileIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  entityType: 'project' | 'client' | 'invoice' | 'proposal' | 'report' | 'firm';
  entityId: string;
  onUploadComplete?: () => void;
  maxSizeMB?: number;
  acceptedTypes?: string[];
}

export function FileUpload({
  entityType,
  entityId,
  onUploadComplete,
  maxSizeMB = 10,
  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'],
}: FileUploadProps) {
  const { profile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const validateFile = (file: File): string | null => {
    // Check file size
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      return `File size must be less than ${maxSizeMB}MB`;
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isValidType = acceptedTypes.some((type) => {
      if (type.includes('/*')) {
        const category = type.split('/')[0];
        return file.type.startsWith(category + '/');
      }
      return type === fileExtension || file.type === type;
    });

    if (!isValidType) {
      return 'File type not supported';
    }

    return null;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      toast.error(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (!profile?.firm_id || selectedFiles.length === 0) return;

    setUploading(true);
    setProgress(0);

    try {
      const totalFiles = selectedFiles.length;
      let completed = 0;

      for (const file of selectedFiles) {
        // Generate unique file path
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${profile.firm_id}/${entityType}/${entityId}/${fileName}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Save metadata to database
        const { error: dbError } = await supabase.from('documents').insert({
          firm_id: profile.firm_id,
          entity_type: entityType,
          entity_id: entityId,
          name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: profile.id,
        });

        if (dbError) throw dbError;

        completed++;
        setProgress((completed / totalFiles) * 100);
      }

      toast.success(`Successfully uploaded ${totalFiles} file(s)`);
      setSelectedFiles([]);
      onUploadComplete?.();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload files');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  return (
    <div className="space-y-4">
      <Card
        className={cn(
          'border-2 border-dashed transition-colors',
          dragActive && 'border-primary bg-primary/5',
          uploading && 'opacity-50 pointer-events-none'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Upload className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-2">
            Drag and drop files here, or click to browse
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Max {maxSizeMB}MB per file
          </p>
          <input
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
            id="file-upload"
            disabled={uploading}
          />
          <label htmlFor="file-upload">
            <Button variant="outline" size="sm" asChild>
              <span>Browse Files</span>
            </Button>
          </label>
        </CardContent>
      </Card>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Selected Files ({selectedFiles.length})</p>
            <Button
              size="sm"
              onClick={uploadFiles}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload All'}
            </Button>
          </div>

          {uploading && (
            <Progress value={progress} className="h-2" />
          )}

          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded-md border bg-card"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
