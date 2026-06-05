import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import type { File as ProjectFile, FileVersion } from '@/types/types';
import { Download, RotateCcw, Eye, Clock, GitCompare } from 'lucide-react';
import { FilePreview } from './FilePreview';
import { VersionCompare } from './VersionCompare';

interface VersionHistoryProps {
  file: ProjectFile;
  onVersionRestored?: () => void;
}

export function VersionHistory({ file, onVersionRestored }: VersionHistoryProps) {
  const [versions, setVersions] = useState<FileVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewVersion, setPreviewVersion] = useState<{ file: ProjectFile; version: FileVersion } | null>(null);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [compareVersions, setCompareVersions] = useState<{ v1: FileVersion; v2: FileVersion } | null>(null);

  useEffect(() => {
    fetchVersions();
  }, [file.id]);

  const fetchVersions = async () => {
    try {
      const { data, error } = await supabase
        .from('file_versions')
        .select(`
          *,
          uploader:uploaded_by(id, email, phone)
        `)
        .eq('file_id', file.id)
        .order('version', { ascending: false });

      if (error) throw error;
      setVersions(data || []);
    } catch (error) {
      console.error('Error fetching versions:', error);
      toast.error('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (version: FileVersion) => {
    try {
      const { data, error } = await supabase.storage
        .from('project-files')
        .download(version.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name} (v${version.version})`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Version ${version.version} downloaded successfully`);
    } catch (error) {
      console.error('Error downloading version:', error);
      toast.error('Failed to download version');
    }
  };

  const handleRestore = async (version: FileVersion) => {
    if (!confirm(`Are you sure you want to restore version ${version.version}? This will create a new version with the content from version ${version.version}.`)) {
      return;
    }

    try {
      // Download the old version
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('project-files')
        .download(version.file_path);

      if (downloadError) throw downloadError;

      // Upload as new version
      const fileExt = file.name.split('.').pop();
      const fileName = `${file.project_id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(fileName, fileData, {
          contentType: file.file_type,
        });

      if (uploadError) throw uploadError;

      // Update file record
      const newVersion = file.version + 1;
      const { error: updateError } = await supabase
        .from('files')
        .update({
          file_path: uploadData.path,
          file_size: version.file_size,
          version: newVersion,
          updated_at: new Date().toISOString(),
        })
        .eq('id', file.id);

      if (updateError) throw updateError;

      toast.success(`Version ${version.version} restored as version ${newVersion}`);
      onVersionRestored?.();
    } catch (error) {
      console.error('Error restoring version:', error);
      toast.error('Failed to restore version');
    }
  };

  const handlePreview = (version: FileVersion) => {
    // Create a temporary file object for preview
    const tempFile: ProjectFile = {
      ...file,
      file_path: version.file_path,
      file_size: version.file_size,
      version: version.version,
    };
    setPreviewVersion({ file: tempFile, version });
  };

  const canPreview = (fileType: string) => {
    return fileType.startsWith('image/') || fileType === 'application/pdf';
  };

  const isTextFile = (fileType: string) => {
    return fileType.startsWith('text/') || 
           fileType === 'application/json' ||
           fileType === 'application/xml';
  };

  const handleVersionSelect = (versionId: string, checked: boolean) => {
    if (checked) {
      if (selectedVersions.length < 2) {
        setSelectedVersions([...selectedVersions, versionId]);
      }
    } else {
      setSelectedVersions(selectedVersions.filter(id => id !== versionId));
    }
  };

  const handleCompare = () => {
    if (selectedVersions.length !== 2) {
      toast.error('Please select exactly 2 versions to compare');
      return;
    }

    const v1 = versions.find(v => v.id === selectedVersions[0]);
    const v2 = versions.find(v => v.id === selectedVersions[1]);

    if (!v1 || !v2) return;

    // Order by version number
    if (v1.version < v2.version) {
      setCompareVersions({ v1, v2 });
    } else {
      setCompareVersions({ v1: v2, v2: v1 });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20 bg-muted" />
        ))}
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="empty-state py-8">
        <Clock className="empty-state-icon" />
        <p className="empty-state-title">No version history</p>
        <p className="empty-state-description">
          Previous versions will appear here when you upload new versions
        </p>
      </div>
    );
  }

  return (
    <>
      {isTextFile(file.file_type) && versions.length > 1 && (
        <div className="mb-4 flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center gap-2 text-sm">
            <GitCompare className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Select 2 versions to compare ({selectedVersions.length}/2 selected)
            </span>
          </div>
          <Button
            size="sm"
            onClick={handleCompare}
            disabled={selectedVersions.length !== 2}
          >
            Compare
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {versions.map((version) => (
          <div
            key={version.id}
            className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-accent/50 transition-smooth"
          >
            {isTextFile(file.file_type) && (
              <Checkbox
                checked={selectedVersions.includes(version.id)}
                onCheckedChange={(checked) => handleVersionSelect(version.id, checked as boolean)}
                disabled={selectedVersions.length >= 2 && !selectedVersions.includes(version.id)}
              />
            )}
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-foreground">
                  Version {version.version}
                </h3>
                {version.version === file.version - 1 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    Previous
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{formatFileSize(version.file_size)}</span>
                <span>•</span>
                <span>{new Date(version.created_at).toLocaleString()}</span>
                {version.uploader && (
                  <>
                    <span>•</span>
                    <span>{version.uploader.email || version.uploader.phone}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canPreview(file.file_type) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreview(version)}
                  title="Preview this version"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(version)}
                title="Download this version"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRestore(version)}
                title="Restore this version"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {previewVersion && (
        <FilePreview
          file={previewVersion.file}
          open={!!previewVersion}
          onClose={() => setPreviewVersion(null)}
        />
      )}

      {compareVersions && (
        <VersionCompare
          fileId={file.id}
          fileName={file.name}
          version1={compareVersions.v1}
          version2={compareVersions.v2}
          open={!!compareVersions}
          onClose={() => {
            setCompareVersions(null);
            setSelectedVersions([]);
          }}
        />
      )}
    </>
  );
}
