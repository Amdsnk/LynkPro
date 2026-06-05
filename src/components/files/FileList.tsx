import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import type { File as ProjectFile } from '@/types/types';
import { FileText, Download, Trash2, Search, Eye, Image, FileSpreadsheet, ChevronDown, ChevronRight, History, Share2, CheckSquare, Square } from 'lucide-react';
import { FilePreview } from './FilePreview';
import { VersionHistory } from './VersionHistory';
import { ShareFile } from './ShareFile';
import { ShareHistory } from './ShareHistory';

interface FileListProps {
  projectId: string;
  onFileDeleted?: () => void;
}

const FILE_TYPE_ICONS: Record<string, any> = {
  'application/pdf': FileText,
  'application/msword': FileText,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': FileText,
  'application/vnd.ms-excel': FileSpreadsheet,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': FileSpreadsheet,
  'image/jpeg': Image,
  'image/png': Image,
  'image/gif': Image,
  'image/webp': Image,
};

export function FileList({ projectId, onFileDeleted }: FileListProps) {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [previewFile, setPreviewFile] = useState<ProjectFile | null>(null);
  const [expandedFileId, setExpandedFileId] = useState<string | null>(null);
  const [shareFile, setShareFile] = useState<ProjectFile | null>(null);
  const [shareHistoryFileId, setShareHistoryFileId] = useState<string | null>(null);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [bulkShareFiles, setBulkShareFiles] = useState<ProjectFile[]>([]);

  useEffect(() => {
    fetchFiles();
  }, [projectId]);

  useEffect(() => {
    let filtered = files;

    if (searchTerm) {
      filtered = filtered.filter(file =>
        file.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(file => {
        if (typeFilter === 'images') {
          return file.file_type.startsWith('image/');
        } else if (typeFilter === 'documents') {
          return file.file_type.includes('pdf') || 
                 file.file_type.includes('word') || 
                 file.file_type.includes('document');
        } else if (typeFilter === 'spreadsheets') {
          return file.file_type.includes('excel') || 
                 file.file_type.includes('spreadsheet');
        }
        return true;
      });
    }

    setFilteredFiles(filtered);
  }, [searchTerm, typeFilter, files]);

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select(`
          *,
          uploader:uploaded_by(id, email, phone)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
      setFilteredFiles(data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (file: ProjectFile) => {
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

  const handleDelete = async (file: ProjectFile) => {
    if (!confirm(`Are you sure you want to delete "${file.name}"?`)) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('project-files')
        .remove([file.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', file.id);

      if (dbError) throw dbError;

      toast.success('File deleted successfully');
      fetchFiles();
      onFileDeleted?.();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  const handlePreview = (file: ProjectFile) => {
    setPreviewFile(file);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    const Icon = FILE_TYPE_ICONS[fileType] || FileText;
    return Icon;
  };

  const canPreview = (fileType: string) => {
    return fileType.startsWith('image/') || fileType === 'application/pdf';
  };

  const handleSelectFile = (fileId: string, checked: boolean) => {
    if (checked) {
      setSelectedFileIds([...selectedFileIds, fileId]);
    } else {
      setSelectedFileIds(selectedFileIds.filter(id => id !== fileId));
    }
  };

  const handleSelectAll = () => {
    setSelectedFileIds(filteredFiles.map(f => f.id));
  };

  const handleDeselectAll = () => {
    setSelectedFileIds([]);
  };

  const handleBulkShare = () => {
    const selectedFiles = files.filter(f => selectedFileIds.includes(f.id));
    setBulkShareFiles(selectedFiles);
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading files...</p>;
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Files</SelectItem>
              <SelectItem value="images">Images</SelectItem>
              <SelectItem value="documents">Documents</SelectItem>
              <SelectItem value="spreadsheets">Spreadsheets</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredFiles.length > 0 && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={selectedFileIds.length === filteredFiles.length ? handleDeselectAll : handleSelectAll}
              >
                {selectedFileIds.length === filteredFiles.length ? (
                  <>
                    <Square className="h-4 w-4 mr-2" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Select All
                  </>
                )}
              </Button>
              {selectedFileIds.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {selectedFileIds.length} file{selectedFileIds.length !== 1 ? 's' : ''} selected
                </span>
              )}
            </div>
            {selectedFileIds.length > 0 && (
              <Button onClick={handleBulkShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share Selected
              </Button>
            )}
          </div>
        )}

        {filteredFiles.length === 0 ? (
          <div className="empty-state">
            <FileText className="empty-state-icon" />
            <p className="empty-state-title">No files found</p>
            <p className="empty-state-description">
              {searchTerm || typeFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Upload files to get started'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFiles.map((file) => {
              const Icon = getFileIcon(file.file_type);
              const isExpanded = expandedFileId === file.id;
              const isSelected = selectedFileIds.includes(file.id);
              return (
                <Collapsible
                  key={file.id}
                  open={isExpanded}
                  onOpenChange={(open) => setExpandedFileId(open ? file.id : null)}
                >
                  <div className="rounded-lg border border-border hover:border-primary/30 transition-smooth">
                    <div className="flex items-center gap-4 p-5 hover:bg-accent/50 transition-smooth">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectFile(file.id, checked as boolean)}
                      />
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate mb-1">
                          {file.name}
                        </h3>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{formatFileSize(file.file_size)}</span>
                          <span>•</span>
                          <span>{new Date(file.created_at).toLocaleDateString()}</span>
                          {file.uploader && (
                            <>
                              <span>•</span>
                              <span>{file.uploader.email || file.uploader.phone}</span>
                            </>
                          )}
                          {file.version > 1 && (
                            <>
                              <span>•</span>
                              <span className="font-medium text-primary">v{file.version}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.version > 1 && (
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              title="View version history"
                            >
                              <History className="h-4 w-4 mr-1" />
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        )}
                        {canPreview(file.file_type) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreview(file)}
                            title="Preview file"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShareFile(file)}
                          title="Share file"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(file)}
                          title="Download file"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(file)}
                          title="Delete file"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {file.version > 1 && (
                      <CollapsibleContent>
                        <div className="border-t border-border p-5 bg-muted/30">
                          <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                            <History className="h-4 w-4" />
                            Version History
                          </h4>
                          <VersionHistory
                            file={file}
                            onVersionRestored={() => {
                              fetchFiles();
                              setExpandedFileId(null);
                            }}
                          />
                        </div>
                      </CollapsibleContent>
                    )}
                  </div>
                </Collapsible>
              );
            })}
          </div>
        )}
      </div>

      {previewFile && (
        <FilePreview
          file={previewFile}
          open={!!previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}

      {shareFile && (
        <ShareFile
          file={shareFile}
          open={!!shareFile}
          onClose={() => setShareFile(null)}
          onShared={() => {
            setShareFile(null);
          }}
        />
      )}

      {bulkShareFiles.length > 0 && (
        <ShareFile
          files={bulkShareFiles}
          open={bulkShareFiles.length > 0}
          onClose={() => {
            setBulkShareFiles([]);
            setSelectedFileIds([]);
          }}
          onShared={() => {
            setBulkShareFiles([]);
            setSelectedFileIds([]);
          }}
        />
      )}
    </>
  );
}
