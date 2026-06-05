import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import {
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  File as FileIcon,
  Download,
  Trash2,
  Eye,
} from 'lucide-react';

interface Document {
  id: string;
  name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  uploaded_by: string;
  uploader: {
    full_name: string;
  };
}

interface DocumentListProps {
  entityType: 'project' | 'client' | 'invoice' | 'proposal' | 'report' | 'firm';
  entityId: string;
  onUpdate?: () => void;
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return ImageIcon;
  if (mimeType.includes('pdf')) return FileText;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet;
  return FileIcon;
};

export function DocumentList({ entityType, entityId, onUpdate }: DocumentListProps) {
  const { profile } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchDocuments();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('documents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `entity_id=eq.${entityId}`,
        },
        () => {
          fetchDocuments();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [entityType, entityId]);

  const fetchDocuments = async () => {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        uploader:profiles!documents_uploaded_by_fkey(full_name)
      `)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setDocuments(data as any);
    }
    setLoading(false);
  };

  const downloadFile = async (doc: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(doc.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('File downloaded');
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  const previewFile = async (doc: Document) => {
    try {
      const { data } = await supabase.storage
        .from('documents')
        .createSignedUrl(doc.file_path, 3600);

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error: any) {
      console.error('Preview error:', error);
      toast.error('Failed to preview file');
    }
  };

  const deleteFile = async () => {
    if (!deleteId) return;

    setDeleting(true);
    try {
      const doc = documents.find((d) => d.id === deleteId);
      if (!doc) return;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([doc.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', deleteId);

      if (dbError) throw dbError;

      toast.success('File deleted');
      setDeleteId(null);
      onUpdate?.();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('Failed to delete file');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No documents uploaded yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Documents ({documents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {documents.map((doc) => {
              const Icon = getFileIcon(doc.mime_type);
              const canDelete = doc.uploaded_by === profile?.id || ['admin', 'staff'].includes(profile?.role || '');

              return (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-md border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(doc.file_size / 1024 / 1024).toFixed(2)} MB • Uploaded by {doc.uploader.full_name} •{' '}
                        {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {(doc.mime_type.startsWith('image/') || doc.mime_type.includes('pdf')) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => previewFile(doc)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadFile(doc)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(doc.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteFile} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
