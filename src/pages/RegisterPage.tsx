import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Loader2, Mail, CheckCircle, XCircle } from 'lucide-react';
import { getInvitationByToken, acceptInvitation } from '@/lib/api';
import type { Invitation } from '@/types/types';

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(!!token);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  
  const { signUp } = useAuth();
  const navigate = useNavigate();

  // Validate invitation token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setValidatingToken(false);
        return;
      }

      try {
        const inv = await getInvitationByToken(token);
        
        if (!inv) {
          setTokenError('Invalid invitation link');
        } else if (inv.accepted_at) {
          setTokenError('This invitation has already been accepted');
        } else if (new Date(inv.expires_at) < new Date()) {
          setTokenError('This invitation has expired');
        } else {
          setInvitation(inv);
          setEmail(inv.email);
        }
      } catch (error) {
        console.error('Error validating token:', error);
        setTokenError('Failed to validate invitation');
      } finally {
        setValidatingToken(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreeTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }

    setLoading(true);

    try {
      // Sign up the user
      const { error } = await signUp(email, password, fullName);
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      // If there's an invitation, accept it
      if (invitation && token) {
        try {
          await acceptInvitation(token);
          toast.success('Account created and invitation accepted! You can now sign in.');
        } catch (invError) {
          console.error('Error accepting invitation:', invError);
          toast.warning('Account created but failed to accept invitation. Please contact support.');
        }
      } else {
        toast.success('Account created successfully! You can now sign in.');
      }

      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  if (validatingToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Validating invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-semibold">Create Account</CardTitle>
          <CardDescription>
            {invitation ? 'Complete your registration to join the team' : 'Register for a new LynkPro account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Token validation alerts */}
          {tokenError && (
            <Alert variant="destructive" className="mb-4">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{tokenError}</AlertDescription>
            </Alert>
          )}
          
          {invitation && !tokenError && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Invitation Valid!</strong> You're joining as a client.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading || !!invitation}
                  className={invitation ? 'pr-10' : ''}
                />
                {invitation && (
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                )}
              </div>
              {invitation && (
                <p className="text-xs text-muted-foreground">
                  Email is pre-filled from your invitation
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={agreeTerms}
                onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                disabled={loading}
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                I agree to the{' '}
                <span className="text-primary hover:underline cursor-pointer">User Agreement</span> and{' '}
                <span className="text-primary hover:underline cursor-pointer">Privacy Policy</span>
              </label>
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !agreeTerms || !!tokenError}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/login" className="text-primary hover:underline">
              Sign In
            </Link>
          </div>
          {!invitation && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> The first registered user will automatically become an admin. Please review and customize the User Agreement and Privacy Policy to meet your legal requirements.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
