import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import type { File as ProjectFile } from '@/types/types';
import { Share2, Copy, Check, Loader2, Mail, Lock, Calendar, Shield, FileText } from 'lucide-react';

interface ShareFileProps {
  file?: ProjectFile;
  files?: ProjectFile[];
  open: boolean;
  onClose: () => void;
  onShared?: () => void;
}

export function ShareFile({ file, files, open, onClose, onShared }: ShareFileProps) {
  const isBulk = !!files && files.length > 1;
  const targetFiles = files || (file ? [file] : []);
  const fileIds = targetFiles.map(f => f.id);
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  
  // Form state
  const [sharedWithEmail, setSharedWithEmail] = useState('');
  const [expiresIn, setExpiresIn] = useState('7');
  const [password, setPassword] = useState('');
  const [permissionLevel, setPermissionLevel] = useState<'view' | 'download'>('download');
  const [customMessage, setCustomMessage] = useState('');
  const [sendEmail, setSendEmail] = useState(false);
  const [autoRenew, setAutoRenew] = useState(false);

  const handleShare = async () => {
    setLoading(true);
    try {
      // Calculate expiration date
      let expiresAt: string | undefined;
      let expirationDuration: number | undefined;
      if (expiresIn !== 'never') {
        const days = parseInt(expiresIn);
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + days);
        expiresAt = expDate.toISOString();
        expirationDuration = days;
      }

      // Call Edge Function
      const { data, error } = await supabase.functions.invoke('share-file', {
        body: {
          fileIds,
          sharedWithEmail: sharedWithEmail || undefined,
          expiresAt,
          expirationDuration,
          password: password || undefined,
          permissionLevel,
          customMessage: customMessage || undefined,
          sendEmail: sendEmail && !!sharedWithEmail,
          autoRenew: autoRenew && expiresIn !== 'never',
        },
      });

      if (error) throw error;

      setShareUrl(data.shareUrl);
      toast.success(`Share link created for ${data.fileCount} file${data.fileCount !== 1 ? 's' : ''}`);
      onShared?.();
    } catch (error) {
      console.error('Error creating share:', error);
      toast.error('Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleClose = () => {
    setShareUrl('');
    setSharedWithEmail('');
    setExpiresIn('7');
    setPassword('');
    setPermissionLevel('download');
    setCustomMessage('');
    setSendEmail(false);
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            {isBulk ? `Share ${targetFiles.length} Files` : `Share File: ${targetFiles[0]?.name}`}
          </DialogTitle>
        </DialogHeader>

        {!shareUrl ? (
          <div className="space-y-6">
            {isBulk && (
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <h4 className="text-sm font-medium mb-2">Selected Files ({targetFiles.length})</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {targetFiles.map((f) => (
                    <div key={f.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-3 w-3" />
                      <span className="truncate">{f.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Share with (optional)
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="recipient@example.com"
                  value={sharedWithEmail}
                  onChange={(e) => setSharedWithEmail(e.target.value)}
                />
                {sharedWithEmail && (
                  <div className="flex items-center gap-2 mt-2">
                    <Checkbox
                      id="sendEmail"
                      checked={sendEmail}
                      onCheckedChange={(checked) => setSendEmail(checked as boolean)}
                    />
                    <Label htmlFor="sendEmail" className="text-sm font-normal cursor-pointer">
                      Send email notification
                    </Label>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Link expires in
                </Label>
                <Select value={expiresIn} onValueChange={setExpiresIn}>
                  <SelectTrigger id="expires">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
                {expiresIn !== 'never' && (
                  <div className="flex items-center gap-2 mt-2">
                    <Checkbox
                      id="autoRenew"
                      checked={autoRenew}
                      onCheckedChange={(checked) => setAutoRenew(checked as boolean)}
                    />
                    <Label htmlFor="autoRenew" className="text-sm font-normal cursor-pointer">
                      Auto-renew on access (extends by {expiresIn} day{expiresIn === '1' ? '' : 's'})
                    </Label>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password protection (optional)
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="permission" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Permission level
                </Label>
                <Select value={permissionLevel} onValueChange={(value) => setPermissionLevel(value as 'view' | 'download')}>
                  <SelectTrigger id="permission">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">View only</SelectItem>
                    <SelectItem value="download">View and download</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Custom message (optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Add a message for the recipient..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleShare} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Share Link
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-success/10 border border-success/20">
              <p className="text-sm font-medium text-success mb-2">
                Share link created successfully!
              </p>
              <p className="text-xs text-muted-foreground">
                {isBulk && 'Files will be downloaded as a ZIP archive. '}
                {expiresIn === 'never' 
                  ? 'This link will never expire'
                  : `This link will expire in ${expiresIn} day${expiresIn === '1' ? '' : 's'}`}
                {password && ' and is password protected'}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Share link</Label>
              <div className="flex gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {password && (
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm font-medium mb-1">Password</p>
                <p className="text-sm text-muted-foreground font-mono">{password}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Make sure to share this password with the recipient separately
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
