import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Key, Loader2 } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

interface TwoFactorDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

export function TwoFactorDialog({ open, onClose, onSuccess, userId }: TwoFactorDialogProps) {
  const [code, setCode] = useState('');
  const [mode, setMode] = useState<'totp' | 'recovery'>('totp');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!code) {
      setError('Please enter a code');
      return;
    }

    if (mode === 'totp' && code.length !== 6) {
      setError('TOTP code must be 6 digits');
      return;
    }

    if (mode === 'recovery' && code.length !== 8) {
      setError('Recovery code must be 8 digits');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      const { data, error: verifyError } = await supabase.functions.invoke('verify_totp', {
        body: {
          userId,
          token: code,
          type: mode,
        }
      });

      if (verifyError) {
        const errorMsg = await verifyError?.context?.text();
        throw new Error(errorMsg || verifyError.message);
      }

      if (data?.data?.verified) {
        toast.success('Verification successful!');
        onSuccess();
      } else {
        setError('Invalid code. Please try again.');
      }
    } catch (error) {
      console.error('2FA verification error:', error);
      setError(error instanceof Error ? error.message : 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleModeSwitch = () => {
    setMode(mode === 'totp' ? 'recovery' : 'totp');
    setCode('');
    setError('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !verifying) {
      handleVerify();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            {mode === 'totp' 
              ? 'Enter the 6-digit code from your authenticator app'
              : 'Enter one of your 8-digit recovery codes'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="code">
              {mode === 'totp' ? 'Authenticator Code' : 'Recovery Code'}
            </Label>
            <Input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              onKeyPress={handleKeyPress}
              placeholder={mode === 'totp' ? '000000' : '00000000'}
              maxLength={mode === 'totp' ? 6 : 8}
              className="text-center text-2xl tracking-widest font-mono"
              autoFocus
              disabled={verifying}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleVerify}
              disabled={verifying}
              className="flex-1"
            >
              {verifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              disabled={verifying}
            >
              Cancel
            </Button>
          </div>

          <div className="text-center">
            <Button
              variant="link"
              onClick={handleModeSwitch}
              disabled={verifying}
              className="text-sm"
            >
              {mode === 'totp' ? (
                <>
                  <Key className="mr-2 h-4 w-4" />
                  Use recovery code instead
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Use authenticator code instead
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
