import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import type { FileShare, File as ProjectFile, FileShareItem } from '@/types/types';
import { Download, Eye, Lock, AlertCircle, FileText, Package } from 'lucide-react';

export default function SharePage() {
  const { token } = useParams();
  const [share, setShare] = useState<FileShare | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchShare();
    }
  }, [token]);

  const fetchShare = async () => {
    try {
      // Fetch share details (without authentication)
      const { data: shareData, error: shareError } = await supabase
        .from('file_shares')
        .select('*')
        .eq('share_token', token)
        .single();

      if (shareError) throw new Error('Share link not found');

      // Check if expired
      if (shareData.expires_at && new Date(shareData.expires_at) < new Date()) {
        throw new Error('This share link has expired');
      }

      setShare(shareData);

      // Get files
      if (shareData.is_bulk) {
        const { data: items, error: itemsError } = await supabase
          .from('file_share_items')
          .select(`
            file_id,
            file:file_id(*)
          `)
          .eq('share_id', shareData.id);

        if (itemsError) throw itemsError;
        const fileList = items
          .map((item: any) => item.file)
          .filter((f: any) => f !== null);
        setFiles(fileList);
      } else {
        const { data: file, error: fileError } = await supabase
          .from('files')
          .select('*')
          .eq('id', shareData.file_id)
          .single();

        if (fileError) throw fileError;
        setFiles([file]);
      }

      // Check if password required
      if (shareData.password_hash) {
        setPasswordRequired(true);
      } else {
        // Log access and handle auto-renewal
        await logAccess(shareData.id, 'view');
        if (shareData.auto_renew && shareData.expiration_duration) {
          await handleAutoRenew(shareData.id);
        }
      }
    } catch (error: any) {
      console.error('Error fetching share:', error);
      setError(error.message || 'Failed to load share');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoRenew = async (shareId: string) => {
    try {
      await supabase.rpc('auto_renew_share', {
        share_id_param: shareId,
      });
    } catch (error) {
      console.error('Error auto-renewing share:', error);
    }
  };

  const verifyPassword = async () => {
    if (!password || !share) return;

    setVerifying(true);
    try {
      // Hash the entered password
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Compare with stored hash
      if (passwordHash !== share.password_hash) {
        toast.error('Incorrect password');
        return;
      }

      setPasswordRequired(false);
      await logAccess(share.id, 'view');
      if (share.auto_renew && share.expiration_duration) {
        await handleAutoRenew(share.id);
      }
      toast.success('Access granted');
    } catch (error) {
      console.error('Error verifying password:', error);
      toast.error('Failed to verify password');
    } finally {
      setVerifying(false);
    }
  };

  const logAccess = async (shareId: string, action: 'view' | 'download') => {
    try {
      // Call the log_share_access function
      await supabase.rpc('log_share_access', {
        share_id_param: shareId,
        ip_address_param: null,
        user_agent_param: navigator.userAgent,
        action_param: action,
      });
    } catch (error) {
      console.error('Error logging access:', error);
    }
  };

  const handleDownload = async () => {
    if (!share) return;

    if (share.permission_level === 'view') {
      toast.error('Download permission not granted for this link');
      return;
    }

    try {
      // Use Edge Function for download (handles both single and bulk)
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const response = await fetch(
        `${supabaseUrl}/functions/v1/download-share?token=${token}`,
        {
          headers: {
            'apikey': supabaseKey,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Download failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = share.is_bulk ? 'shared-files.zip' : files[0]?.name || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      await logAccess(share.id, 'download');
      toast.success(share.is_bulk ? 'Files downloaded as ZIP' : 'File downloaded successfully');
    } catch (error) {
      console.error('Error downloading:', error);
      toast.error('Failed to download');
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
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <Skeleton className="h-8 w-64 bg-muted" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 bg-muted" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (passwordRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Password Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This file is password protected. Please enter the password to continue.
            </p>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && verifyPassword()}
                placeholder="Enter password"
              />
            </div>
            <Button
              onClick={verifyPassword}
              disabled={!password || verifying}
              className="w-full"
            >
              {verifying ? 'Verifying...' : 'Continue'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl card-enhanced">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {share?.is_bulk ? (
              <>
                <Package className="h-5 w-5" />
                Shared Files ({files.length})
              </>
            ) : (
              <>
                <FileText className="h-5 w-5" />
                {files[0]?.name}
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {share?.custom_message && (
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm">{share.custom_message}</p>
            </div>
          )}

          {share?.is_bulk && (
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <h4 className="text-sm font-medium mb-2">Files in this share:</h4>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground ml-2">
                      {formatFileSize(file.file_size)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            {!share?.is_bulk && files[0] && (
              <>
                <div>
                  <p className="text-muted-foreground mb-1">File Size</p>
                  <p className="font-medium">{formatFileSize(files[0].file_size)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">File Type</p>
                  <p className="font-medium">{files[0].file_type}</p>
                </div>
              </>
            )}
            {share?.is_bulk && (
              <div>
                <p className="text-muted-foreground mb-1">Total Size</p>
                <p className="font-medium">
                  {formatFileSize(files.reduce((sum, f) => sum + f.file_size, 0))}
                </p>
              </div>
            )}
            {share?.expires_at && (
              <div>
                <p className="text-muted-foreground mb-1">Expires</p>
                <p className="font-medium">
                  {new Date(share.expires_at).toLocaleDateString()}
                </p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground mb-1">Permission</p>
              <p className="font-medium capitalize">{share?.permission_level}</p>
            </div>
          </div>

          <div className="flex gap-3">
            {share?.permission_level === 'download' && (
              <Button onClick={handleDownload} className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                {share.is_bulk ? 'Download as ZIP' : 'Download File'}
              </Button>
            )}
            {share?.permission_level === 'view' && (
              <div className="flex-1 p-4 rounded-lg bg-muted/50 border border-border text-center">
                <Eye className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  View-only access. Download not permitted.
                </p>
              </div>
            )}
          </div>

          <div className="text-xs text-muted-foreground text-center pt-4 border-t border-border">
            <p>Shared via LynkPro</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
