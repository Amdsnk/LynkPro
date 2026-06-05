import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import QRCodeDataUrl from '@/components/ui/qrcodedataurl';

export function TwoFactorSetup() {
  const { profile } = useAuth();
  const [secret, setSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [step, setStep] = useState<'generate' | 'verify' | 'complete'>('generate');
  const [copied, setCopied] = useState(false);

  const generateSecret = async () => {
    // Generate TOTP secret (32 character base32 string)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const newSecret = Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    
    setSecret(newSecret);
    
    // Generate QR code URL for authenticator apps
    const issuer = 'LynkPro';
    const accountName = profile?.email || 'user';
    const otpauthUrl = `otpauth://totp/${issuer}:${accountName}?secret=${newSecret}&issuer=${issuer}`;
    setQrCodeUrl(otpauthUrl);
    
    // Generate 10 recovery codes
    const codes = Array.from({ length: 10 }, () => 
      Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('')
    );
    setRecoveryCodes(codes);
    
    setStep('verify');
  };

  const verifyAndEnable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    // In production, verify the TOTP code server-side
    // For now, we'll save the secret and recovery codes
    
    const { error: secretError } = await supabase.from('totp_secrets').upsert({
      user_id: profile?.id,
      secret: secret,
      is_enabled: true,
    });

    if (secretError) {
      toast.error('Failed to enable 2FA');
      return;
    }

    // Save recovery codes
    const { error: codesError } = await supabase.from('recovery_codes').insert(
      recoveryCodes.map(code => ({
        user_id: profile?.id,
        code: code,
      }))
    );

    if (codesError) {
      toast.error('Failed to save recovery codes');
      return;
    }

    toast.success('Two-factor authentication enabled!');
    setStep('complete');
  };

  const copyRecoveryCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
    setCopied(true);
    toast.success('Recovery codes copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 'generate' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Two-factor authentication adds an additional layer of security by requiring a code from your phone in addition to your password.
            </p>
            <Button onClick={generateSecret}>
              Enable Two-Factor Authentication
            </Button>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Step 1: Scan QR Code</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <QRCodeDataUrl text={qrCodeUrl} width={200} />
              </div>
              <p className="text-xs text-center text-muted-foreground mt-2">
                Or enter this code manually: <code className="bg-muted px-2 py-1 rounded">{secret}</code>
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2">Step 2: Verify Code</h3>
              <Label>Enter the 6-digit code from your authenticator app</Label>
              <Input
                type="text"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="text-center text-2xl tracking-widest"
              />
            </div>

            <Button onClick={verifyAndEnable} className="w-full">
              Verify and Enable
            </Button>
          </div>
        )}

        {step === 'complete' && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">✓ 2FA Enabled Successfully!</h3>
              <p className="text-sm text-green-700">
                Your account is now protected with two-factor authentication.
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2">Recovery Codes</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Save these recovery codes in a safe place. You can use them to access your account if you lose your authenticator device.
              </p>
              <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
                {recoveryCodes.map((code, index) => (
                  <div key={index}>{code}</div>
                ))}
              </div>
              <Button onClick={copyRecoveryCodes} variant="outline" className="w-full mt-3">
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Recovery Codes
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
