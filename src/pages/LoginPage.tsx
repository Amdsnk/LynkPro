import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TwoFactorDialog } from '@/components/auth/TwoFactorDialog';
import { toast } from 'sonner';
import { Loader2, Info, User, Users, HardHat, Shield, Building, Wrench } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [pendingUserId, setPendingUserId] = useState('');
  const [pendingCredentials, setPendingCredentials] = useState<{ email: string; password: string } | null>(null);
  const [showDemoUsers, setShowDemoUsers] = useState(false);
  const { signIn, complete2FALogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: string })?.from || '/';

  const demoUsers = [
    {
      icon: User,
      role: 'Admin',
      email: 'admin@lynkpro.com',
      description: 'Full system access',
      badge: 'admin',
    },
    {
      icon: Users,
      role: 'Project Manager',
      email: 'pm@lynkpro.com',
      description: 'Project management',
      badge: 'staff',
    },
    {
      icon: HardHat,
      role: 'Field Worker',
      email: 'field@lynkpro.com',
      description: 'Field operations',
      badge: 'staff',
    },
    {
      icon: Shield,
      role: 'Safety Officer',
      email: 'safety@lynkpro.com',
      description: 'Safety & compliance',
      badge: 'staff',
    },
    {
      icon: Building,
      role: 'Client',
      email: 'client@lynkpro.com',
      description: 'Portal view-only',
      badge: 'client',
    },
    {
      icon: Wrench,
      role: 'Subcontractor',
      email: 'subcontractor@lynkpro.com',
      description: 'Tasks & timesheets',
      badge: 'client',
    },
  ];

  const quickLogin = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('demo123');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error, requires2FA, userId } = await signIn(email, password);
      if (error) {
        toast.error(error.message);
      } else if (requires2FA && userId) {
        // Store credentials temporarily for re-login after 2FA
        setPendingCredentials({ email, password });
        setPendingUserId(userId);
        setShow2FA(true);
        toast.info('Please enter your 2FA code');
      } else {
        toast.success('Signed in successfully');
        navigate(from, { replace: true });
      }
    } catch (error) {
      toast.error('An error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  const handle2FASuccess = async () => {
    setShow2FA(false);
    try {
      // After 2FA verification, sign in with stored credentials (bypass 2FA check)
      if (pendingCredentials) {
        const { error } = await signIn(pendingCredentials.email, pendingCredentials.password, true);
        if (error) {
          toast.error('Failed to complete login');
          return;
        }
      }
      toast.success('Signed in successfully');
      setPendingCredentials(null);
      navigate(from, { replace: true });
    } catch (error) {
      toast.error('Failed to complete login');
    }
  };

  const handle2FAClose = () => {
    setShow2FA(false);
    setPendingUserId('');
    setPendingCredentials(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-4xl space-y-6">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl font-semibold">Sign In</CardTitle>
            <CardDescription>Enter your credentials to access LynkPro</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
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
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link to="/register" className="text-primary hover:underline">
                Register
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Demo Users Card */}
        <Card className="w-full max-w-md mx-auto border-primary/20">
          <Collapsible open={showDemoUsers} onOpenChange={setShowDemoUsers}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Demo User Accounts</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm">
                    {showDemoUsers ? 'Hide' : 'Show'}
                  </Button>
                </div>
                <CardDescription>
                  Click to view demo credentials (Password: demo123)
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-3 pt-0">
                {demoUsers.map((user) => {
                  const IconComponent = user.icon;
                  return (
                    <div
                      key={user.email}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <IconComponent className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm">{user.role}</p>
                            <Badge variant={user.badge === 'admin' ? 'default' : 'secondary'} className="text-xs">
                              {user.badge}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          <p className="text-xs text-muted-foreground">{user.description}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => quickLogin(user.email)}
                        type="button"
                      >
                        Use
                      </Button>
                    </div>
                  );
                })}
                <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs text-muted-foreground text-center">
                    <strong>Password for all demo users:</strong> demo123
                  </p>
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    Click "Use" to auto-fill credentials, then click "Sign In"
                  </p>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </div>

      <TwoFactorDialog
        open={show2FA}
        onClose={handle2FAClose}
        onSuccess={handle2FASuccess}
        userId={pendingUserId}
      />
    </div>
  );
}
