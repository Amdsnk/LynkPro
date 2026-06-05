import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { InviteClientDialog } from '@/components/dialogs/InviteClientDialog';
import { getInvitations, deleteInvitation } from '@/lib/api';
import { supabase } from '@/db/supabase';
import type { Invitation } from '@/types/types';
import { Mail, Clock, CheckCircle, XCircle, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function InvitationsPage() {
  const { profile } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState<string | null>(null);

  const fetchInvitations = async () => {
    if (!profile?.firm_id) return;
    try {
      const data = await getInvitations(profile.firm_id);
      setInvitations(data);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      toast.error('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [profile]);

  const handleResend = async (invitation: Invitation) => {
    if (!profile?.firm_id) return;
    
    setResending(invitation.id);
    try {
      // Get firm details
      const { data: firm } = await supabase
        .from('firms')
        .select('name')
        .eq('id', profile.firm_id)
        .single();

      // Resend invitation email
      const { error } = await supabase.functions.invoke('send-invitation', {
        body: {
          invitationId: invitation.id,
          email: invitation.email,
          inviterName: profile.full_name || profile.email,
          firmName: firm?.name || 'Your Firm',
          token: invitation.token,
        },
      });

      if (error) {
        throw error;
      }

      toast.success('Invitation resent successfully');
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast.error('Failed to resend invitation');
    } finally {
      setResending(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invitation?')) return;

    try {
      await deleteInvitation(id);
      setInvitations(invitations.filter(inv => inv.id !== id));
      toast.success('Invitation deleted');
    } catch (error) {
      console.error('Error deleting invitation:', error);
      toast.error('Failed to delete invitation');
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const getInvitationStatus = (invitation: Invitation) => {
    if (invitation.accepted_at) return 'accepted';
    if (isExpired(invitation.expires_at)) return 'expired';
    return 'pending';
  };

  if (loading) {
    return (
      <div className="section-spacing">
        <Skeleton className="h-12 w-64 bg-muted" />
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const pendingInvitations = invitations.filter(inv => getInvitationStatus(inv) === 'pending');
  const acceptedInvitations = invitations.filter(inv => getInvitationStatus(inv) === 'accepted');
  const expiredInvitations = invitations.filter(inv => getInvitationStatus(inv) === 'expired');

  return (
    <div className="section-spacing">
      <PageHeader
        title="Client Invitations"
        description={`${pendingInvitations.length} pending, ${acceptedInvitations.length} accepted, ${expiredInvitations.length} expired`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Admin', href: '/admin' },
          { label: 'Invitations' },
        ]}
        actions={<InviteClientDialog onInviteSent={fetchInvitations} />}
      />

      {invitations.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-12">
            <div className="empty-state">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No invitations yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Invite clients to join your firm on LynkPro
              </p>
              <InviteClientDialog onInviteSent={fetchInvitations} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Pending Invitations */}
          {pendingInvitations.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Pending Invitations ({pendingInvitations.length})
              </h3>
              <div className="grid gap-3">
                {pendingInvitations.map((invitation) => (
                  <Card key={invitation.id} className="shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{invitation.email}</span>
                            <StatusBadge status="pending" variant="info" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Sent {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true })} • 
                            Expires {formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResend(invitation)}
                            disabled={resending === invitation.id}
                          >
                            {resending === invitation.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Resend
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(invitation.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Accepted Invitations */}
          {acceptedInvitations.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Accepted Invitations ({acceptedInvitations.length})
              </h3>
              <div className="grid gap-3">
                {acceptedInvitations.map((invitation) => (
                  <Card key={invitation.id} className="shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{invitation.email}</span>
                            <StatusBadge status="accepted" variant="success" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Accepted {formatDistanceToNow(new Date(invitation.accepted_at!), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Expired Invitations */}
          {expiredInvitations.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                Expired Invitations ({expiredInvitations.length})
              </h3>
              <div className="grid gap-3">
                {expiredInvitations.map((invitation) => (
                  <Card key={invitation.id} className="shadow-sm border-red-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{invitation.email}</span>
                            <StatusBadge status="expired" variant="danger" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Expired {formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResend(invitation)}
                            disabled={resending === invitation.id}
                          >
                            {resending === invitation.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Resend
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(invitation.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
