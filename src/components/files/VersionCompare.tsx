import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/db/supabase';
import type { FileVersion } from '@/types/types';
import { X, ArrowLeftRight } from 'lucide-react';
import { toast } from 'sonner';

interface VersionCompareProps {
  fileId: string;
  fileName: string;
  version1: FileVersion;
  version2: FileVersion;
  open: boolean;
  onClose: () => void;
}

export function VersionCompare({ fileId, fileName, version1, version2, open, onClose }: VersionCompareProps) {
  const [content1, setContent1] = useState<string>('');
  const [content2, setContent2] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadContents();
    }
  }, [open, version1, version2]);

  const loadContents = async () => {
    setLoading(true);
    try {
      // Load version 1
      const { data: data1, error: error1 } = await supabase.storage
        .from('project-files')
        .download(version1.file_path);

      if (error1) throw error1;

      // Load version 2
      const { data: data2, error: error2 } = await supabase.storage
        .from('project-files')
        .download(version2.file_path);

      if (error2) throw error2;

      // Convert to text
      const text1 = await data1.text();
      const text2 = await data2.text();

      setContent1(text1);
      setContent2(text2);
    } catch (error) {
      console.error('Error loading file contents:', error);
      toast.error('Failed to load file contents for comparison');
    } finally {
      setLoading(false);
    }
  };

  const getDifferences = () => {
    const lines1 = content1.split('\n');
    const lines2 = content2.split('\n');
    const maxLines = Math.max(lines1.length, lines2.length);

    const differences: Array<{ line: number; content1: string; content2: string; isDifferent: boolean }> = [];

    for (let i = 0; i < maxLines; i++) {
      const line1 = lines1[i] || '';
      const line2 = lines2[i] || '';
      differences.push({
        line: i + 1,
        content1: line1,
        content2: line2,
        isDifferent: line1 !== line2,
      });
    }

    return differences;
  };

  const differences = loading ? [] : getDifferences();
  const changedLines = differences.filter(d => d.isDifferent).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="truncate pr-4">
              Compare Versions: {fileName}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex items-center justify-between py-2 border-b border-border">
          <div className="flex items-center gap-4 text-sm">
            <span className="font-medium">Version {version1.version}</span>
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Version {version2.version}</span>
          </div>
          {!loading && (
            <span className="text-sm text-muted-foreground">
              {changedLines} line{changedLines !== 1 ? 's' : ''} changed
            </span>
          )}
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="space-y-2 p-4">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-6 bg-muted" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 p-4">
              <div>
                <h3 className="text-sm font-medium mb-2 sticky top-0 bg-background py-2">
                  Version {version1.version}
                </h3>
                <div className="space-y-1">
                  {differences.map((diff, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-2 text-sm font-mono ${
                        diff.isDifferent ? 'bg-destructive/10' : ''
                      }`}
                    >
                      <span className="text-muted-foreground w-8 text-right flex-shrink-0">
                        {diff.line}
                      </span>
                      <span className="flex-1 whitespace-pre-wrap break-all">
                        {diff.content1 || ' '}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2 sticky top-0 bg-background py-2">
                  Version {version2.version}
                </h3>
                <div className="space-y-1">
                  {differences.map((diff, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-2 text-sm font-mono ${
                        diff.isDifferent ? 'bg-success/10' : ''
                      }`}
                    >
                      <span className="text-muted-foreground w-8 text-right flex-shrink-0">
                        {diff.line}
                      </span>
                      <span className="flex-1 whitespace-pre-wrap break-all">
                        {diff.content2 || ' '}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-destructive/10 border border-destructive/20 rounded" />
              <span>Removed/Changed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-success/10 border border-success/20 rounded" />
              <span>Added/Changed</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
