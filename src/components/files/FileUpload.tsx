import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import { Upload, X, FileText, Loader2 } from 'lucide-react';

interface FileUploadProps {
  projectId: string;
  userId: string;
  onUploadComplete: () => void;
}

interface UploadingFile {
  file: File;
  progress: number;
  error?: string;
}

const ALLOWED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function FileUpload({ projectId, userId, onUploadComplete }: FileUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file: File) => {
    try {
      // Check if file with same name already exists
      const { data: existingFiles, error: checkError } = await supabase
        .from('files')
        .select('id, version, file_path')
        .eq('project_id', projectId)
        .eq('name', file.name)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingFiles) {
        // File exists, create new version
        const newVersion = existingFiles.version + 1;
        const fileExt = file.name.split('.').pop();
        const fileName = `${projectId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload new version to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('project-files')
          .upload(fileName, file, {
            contentType: file.type,
          });

        if (uploadError) throw uploadError;

        // Update file record with new version
        const { error: updateError } = await supabase
          .from('files')
          .update({
            file_path: uploadData.path,
            file_size: file.size,
            version: newVersion,
            uploaded_by: userId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingFiles.id);

        if (updateError) throw updateError;
      } else {
        // New file, create new record
        const fileExt = file.name.split('.').pop();
        const fileName = `${projectId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('project-files')
          .upload(fileName, file, {
            contentType: file.type,
          });

        if (uploadError) throw uploadError;

        // Insert file metadata into database
        const { error: dbError } = await supabase
          .from('files')
          .insert({
            project_id: projectId,
            name: file.name,
            file_path: uploadData.path,
            file_size: file.size,
            file_type: file.type,
            uploaded_by: userId,
          });

        if (dbError) throw dbError;
      }

      return true;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    const newUploadingFiles: UploadingFile[] = acceptedFiles.map(file => ({
      file,
      progress: 0,
    }));
    setUploadingFiles(newUploadingFiles);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setUploadingFiles(prev => prev.map((uf, idx) => 
          idx === i ? { ...uf, error: 'File too large (max 10MB)' } : uf
        ));
        errorCount++;
        continue;
      }

      try {
        // Simulate progress
        setUploadingFiles(prev => prev.map((uf, idx) => 
          idx === i ? { ...uf, progress: 50 } : uf
        ));

        await uploadFile(file);

        setUploadingFiles(prev => prev.map((uf, idx) => 
          idx === i ? { ...uf, progress: 100 } : uf
        ));
        successCount++;
      } catch (error) {
        setUploadingFiles(prev => prev.map((uf, idx) => 
          idx === i ? { ...uf, error: 'Upload failed' } : uf
        ));
        errorCount++;
      }
    }

    setUploading(false);

    if (successCount > 0) {
      toast.success(`${successCount} file(s) uploaded successfully`);
      onUploadComplete();
    }

    if (errorCount > 0) {
      toast.error(`${errorCount} file(s) failed to upload`);
    }

    // Clear uploading files after a delay
    setTimeout(() => {
      setUploadingFiles([]);
    }, 2000);
  }, [projectId, userId, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ALLOWED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  });

  const removeUploadingFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-smooth ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-accent/50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        {isDragActive ? (
          <p className="text-sm text-primary">Drop files here...</p>
        ) : (
          <>
            <p className="text-sm font-medium mb-1">
              Drag & drop files here, or click to select
            </p>
            <p className="text-xs text-muted-foreground">
              PDF, Word, Excel, Images up to 10MB
            </p>
          </>
        )}
      </div>

      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          {uploadingFiles.map((uploadingFile, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card"
            >
              <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium truncate">
                    {uploadingFile.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground ml-2">
                    {formatFileSize(uploadingFile.file.size)}
                  </p>
                </div>
                {uploadingFile.error ? (
                  <p className="text-xs text-destructive">{uploadingFile.error}</p>
                ) : (
                  <Progress value={uploadingFile.progress} className="h-1" />
                )}
              </div>
              {uploadingFile.progress === 100 || uploadingFile.error ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeUploadingFile(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              ) : (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
