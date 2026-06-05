import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import type { FileShare, ShareAccessLog } from '@/types/types';
import { Share2, Eye, Download, Trash2, Copy, Check, Calendar, Lock, Mail, Shield, Clock, RefreshCw, CheckSquare, Square } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface ShareHistoryProps {
  fileId: string;
}

export function ShareHistory({ fileId }: ShareHistoryProps) {
  const [shares, setShares] = useState<FileShare[]>([]);
  const [accessLogs, setAccessLogs] = useState<Record<string, ShareAccessLog[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedShareId, setExpandedShareId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedShareIds, setSelectedShareIds] = useState<string[]>([]);
  const [extending, setExtending] = useState<string | null>(null);

  useEffect(() => {
    fetchShares();
  }, [fileId]);

  const fetchShares = async () => {
    try {
      const { data, error } = await supabase
        .from('file_shares')
        .select(`
          *,
          creator:created_by(id, email, phone)
        `)
        .eq('file_id', fileId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShares(data || []);
    } catch (error) {
      console.error('Error fetching shares:', error);
      toast.error('Failed to load share history');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccessLogs = async (shareId: string) => {
    if (accessLogs[shareId]) return; // Already loaded

    try {
      const { data, error } = await supabase
        .from('share_access_logs')
        .select('*')
        .eq('share_id', shareId)
        .order('accessed_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setAccessLogs(prev => ({ ...prev, [shareId]: data || [] }));
    } catch (error) {
      console.error('Error fetching access logs:', error);
      toast.error('Failed to load access logs');
    }
  };

  const handleDelete = async (shareId: string) => {
    if (!confirm('Are you sure you want to delete this share link?')) return;

    try {
      const { error } = await supabase
        .from('file_shares')
        .delete()
        .eq('id', shareId);

      if (error) throw error;

      toast.success('Share link deleted');
      fetchShares();
    } catch (error) {
      console.error('Error deleting share:', error);
      toast.error('Failed to delete share link');
    }
  };

  const handleCopy = async (shareToken: string) => {
    try {
      const shareUrl = `${window.location.origin}/share/${shareToken}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(shareToken);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleExpand = (shareId: string) => {
    if (expandedShareId === shareId) {
      setExpandedShareId(null);
    } else {
      setExpandedShareId(shareId);
      fetchAccessLogs(shareId);
    }
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const getExpirationStatus = (expiresAt?: string) => {
    if (!expiresAt) return null;
    
    const now = new Date();
    const expiration = new Date(expiresAt);
    const hoursUntilExpiry = (expiration.getTime() - now.getTime()) / (1000 * 60 * 60);
    const daysUntilExpiry = hoursUntilExpiry / 24;
    
    if (hoursUntilExpiry < 0) {
      // Expired
      const daysSinceExpiry = Math.abs(daysUntilExpiry);
      if (daysSinceExpiry <= 7) {
        return { status: 'expired-recent', label: 'Expired', color: 'destructive' };
      } else {
        return { status: 'expired-old', label: 'Long Expired', color: 'destructive' };
      }
    } else if (hoursUntilExpiry <= 48) {
      // Expiring soon (within 48 hours)
      return { status: 'expiring-soon', label: 'Expiring Soon', color: 'warning' };
    }
    
    return null;
  };

  const handleExtend = async (shareId: string, days: number = 7) => {
    setExtending(shareId);
    try {
      const { error } = await supabase.rpc('extend_share_expiration', {
        share_id_param: shareId,
        days_param: days,
      });

      if (error) throw error;

      toast.success(`Share extended by ${days} days`);
      fetchShares();
    } catch (error) {
      console.error('Error extending share:', error);
      toast.error('Failed to extend share');
    } finally {
      setExtending(null);
    }
  };

  const handleSelectShare = (shareId: string, checked: boolean) => {
    if (checked) {
      setSelectedShareIds([...selectedShareIds, shareId]);
    } else {
      setSelectedShareIds(selectedShareIds.filter(id => id !== shareId));
    }
  };

  const handleSelectAll = () => {
    setSelectedShareIds(shares.map(s => s.id));
  };

  const handleDeselectAll = () => {
    setSelectedShareIds([]);
  };

  const handleBulkExtend = async () => {
    if (selectedShareIds.length === 0) return;

    try {
      const { data, error } = await supabase.rpc('bulk_extend_shares', {
        share_ids_param: selectedShareIds,
        days_param: 7,
      });

      if (error) throw error;

      toast.success(`Extended ${data} share${data !== 1 ? 's' : ''} by 7 days`);
      setSelectedShareIds([]);
      fetchShares();
    } catch (error) {
      console.error('Error bulk extending shares:', error);
      toast.error('Failed to extend shares');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedShareIds.length === 0) return;
    if (!confirm(`Delete ${selectedShareIds.length} share${selectedShareIds.length !== 1 ? 's' : ''}?`)) return;

    try {
      const { error } = await supabase
        .from('file_shares')
        .delete()
        .in('id', selectedShareIds);

      if (error) throw error;

      toast.success(`Deleted ${selectedShareIds.length} share${selectedShareIds.length !== 1 ? 's' : ''}`);
      setSelectedShareIds([]);
      fetchShares();
    } catch (error) {
      console.error('Error bulk deleting shares:', error);
      toast.error('Failed to delete shares');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 bg-muted" />
        ))}
      </div>
    );
  }

  if (shares.length === 0) {
    return (
      <div className="empty-state py-8">
        <Share2 className="empty-state-icon" />
        <p className="empty-state-title">No shares yet</p>
        <p className="empty-state-description">
          Share this file to see the share history here
        </p>
      </div>
    );
  }

  const expiredShares = shares.filter(s => isExpired(s.expires_at));

  return (
    <div className="space-y-3">
      {shares.length > 0 && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={selectedShareIds.length === shares.length ? handleDeselectAll : handleSelectAll}
            >
              {selectedShareIds.length === shares.length ? (
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
            {selectedShareIds.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {selectedShareIds.length} share{selectedShareIds.length !== 1 ? 's' : ''} selected
              </span>
            )}
          </div>
          {selectedShareIds.length > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleBulkExtend}>
                <Clock className="h-4 w-4 mr-2" />
                Extend by 7 days
              </Button>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </div>
      )}

      {expiredShares.length > 0 && selectedShareIds.length === 0 && (
        <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
          <p className="text-sm text-warning">
            {expiredShares.length} expired share{expiredShares.length !== 1 ? 's' : ''}. Select and extend or delete them.
          </p>
        </div>
      )}

      {shares.map((share) => {
        const expired = isExpired(share.expires_at);
        const expirationStatus = getExpirationStatus(share.expires_at);
        const isExpanded = expandedShareId === share.id;
        const logs = accessLogs[share.id] || [];
        const isSelected = selectedShareIds.includes(share.id);

        return (
          <Collapsible
            key={share.id}
            open={isExpanded}
            onOpenChange={() => handleExpand(share.id)}
          >
            <div className={`rounded-lg border transition-smooth ${
              expired ? 'border-destructive/30 bg-destructive/5' : 'border-border hover:border-primary/30'
            }`}>
              <div className="flex items-start gap-4 p-5 hover:bg-accent/50 transition-smooth">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => handleSelectShare(share.id, checked as boolean)}
                />
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Share2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {share.shared_with_email && (
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium truncate">{share.shared_with_email}</span>
                      </div>
                    )}
                    {!share.shared_with_email && (
                      <span className="text-sm font-medium text-muted-foreground">Anyone with link</span>
                    )}
                    {expirationStatus && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        expirationStatus.color === 'destructive' 
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-warning/10 text-warning'
                      }`}>
                        {expirationStatus.label}
                      </span>
                    )}
                    {share.auto_renew && !expired && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success">
                        Auto-renew
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      <span className="capitalize">{share.permission_level}</span>
                    </div>
                    {share.password_hash && (
                      <div className="flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        <span>Password protected</span>
                      </div>
                    )}
                    {share.expires_at && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Expires {formatDate(share.expires_at)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{share.view_count} views</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Created {formatDate(share.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {share.view_count > 0 && (
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        title="View access logs"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  )}
                  {share.expires_at && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExtend(share.id, share.expiration_duration || 7)}
                      disabled={extending === share.id}
                      title="Extend expiration"
                    >
                      {extending === share.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(share.share_token)}
                    title="Copy link"
                  >
                    {copied === share.share_token ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(share.id)}
                    title="Delete share"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {share.view_count > 0 && (
                <CollapsibleContent>
                  <div className="border-t border-border p-5 bg-muted/30">
                    <h4 className="text-sm font-medium mb-3">Access Logs</h4>
                    {logs.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    ) : (
                      <div className="space-y-2">
                        {logs.map((log) => (
                          <div
                            key={log.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-background border border-border text-sm"
                          >
                            <div className="flex items-center gap-3">
                              {log.action === 'view' ? (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Download className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="capitalize">{log.action}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(log.accessed_at)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              )}
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
}
