import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createInvitation } from '@/lib/api';
import { supabase } from '@/db/supabase';
import { Loader2, Mail, UserPlus } from 'lucide-react';

interface InviteClientDialogProps {
  onInviteSent?: () => void;
  trigger?: React.ReactNode;
}

export function InviteClientDialog({ onInviteSent, trigger }: InviteClientDialogProps) {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile?.firm_id) {
      toast.error('No firm associated with your account');
      return;
    }

    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      // Create invitation record
      const invitation = await createInvitation({
        firm_id: profile.firm_id,
        email: email.toLowerCase().trim(),
      });

      // Get firm details for email
      const { data: firm } = await supabase
        .from('firms')
        .select('name')
        .eq('id', profile.firm_id)
        .single();

      // Send invitation email via Edge Function
      const { error: emailError } = await supabase.functions.invoke('send-invitation', {
        body: {
          invitationId: invitation.id,
          email: invitation.email,
          inviterName: profile.full_name || profile.email,
          firmName: firm?.name || 'Your Firm',
          token: invitation.token,
        },
      });

      if (emailError) {
        console.error('Failed to send invitation email:', emailError);
        toast.error('Invitation created but email failed to send');
      } else {
        toast.success(`Invitation sent to ${email}`);
      }

      setEmail('');
      setOpen(false);
      onInviteSent?.();
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Client
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Invite Client to LynkPro
          </DialogTitle>
          <DialogDescription>
            Send an invitation email to a client. They'll receive a link to join your firm.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleInvite} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="client@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              The invitation link will be valid for 7 days
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
