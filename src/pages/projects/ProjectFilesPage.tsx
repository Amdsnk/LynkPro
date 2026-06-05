import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { Upload, Download, Trash2, File as FileIcon, ArrowLeft, Loader2 } from 'lucide-react';
import type { File as ProjectFile } from '@/types/types';

export default function ProjectFilesPage() {
  const { id } = useParams();
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [project, setProject] = useState<any>(null);

  useEffect(() => {
    fetchProject();
    fetchFiles();
  }, [id]);

  const fetchProject = async () => {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    setProject(data);
  };

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFiles(data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('File size must be less than 100MB');
      return;
    }

    setUploading(true);

    try {
      // Upload to Supabase Storage
      const filePath = `projects/${id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create database record
      const { error: dbError } = await supabase
        .from('files')
        .insert({
          project_id: id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
        });

      if (dbError) throw dbError;

      toast.success('File uploaded successfully');
      fetchFiles();
      
      // Reset input
      event.target.value = '';
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (projectFile: ProjectFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('project-files')
        .download(projectFile.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = projectFile.file_name || projectFile.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('File downloaded');
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error(error.message || 'Failed to download file');
    }
  };

  const handleDelete = async (projectFile: ProjectFile) => {
    const fileName = projectFile.file_name || projectFile.name;
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('project-files')
        .remove([projectFile.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', projectFile.id);

      if (dbError) throw dbError;

      toast.success('File deleted');
      fetchFiles();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete file');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return '📁';
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📽️';
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return '🗜️';
    return '📁';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Link to={`/projects/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Project
        </Link>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{project?.name} - Files</h1>
            <p className="text-muted-foreground mt-1">
              {files.length} {files.length === 1 ? 'file' : 'files'}
            </p>
          </div>
          <div>
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
            <Button
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Files</CardTitle>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <div className="py-12 text-center">
              <FileIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No files uploaded yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Upload your first file to get started
              </p>
              <Button
                onClick={() => document.getElementById('file-upload')?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {files.map((projectFile) => (
                <div key={projectFile.id} className="py-4 flex items-center justify-between hover:bg-muted/50 px-4 -mx-4 transition-colors">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="text-2xl">{getFileIcon(projectFile.mime_type || projectFile.file_type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{projectFile.file_name || projectFile.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatFileSize(projectFile.file_size)} • {new Date(projectFile.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(projectFile)}
                      title="Download file"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(projectFile)}
                      title="Delete file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
