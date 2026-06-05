import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, Users, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SetupResult {
  email: string;
  status: string;
  role?: string;
  user_id?: string;
}

interface SetupError {
  email: string;
  error: string;
}

export default function SetupDemoUsersPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SetupResult[]>([]);
  const [errors, setErrors] = useState<SetupError[]>([]);
  const [setupComplete, setSetupComplete] = useState(false);

  const setupDemoUsers = async () => {
    setLoading(true);
    setResults([]);
    setErrors([]);
    setSetupComplete(false);

    try {
      const { data, error } = await supabase.functions.invoke('setup-demo-users', {
        method: 'POST',
      });

      if (error) {
        toast.error(`Setup failed: ${error.message}`);
        return;
      }

      if (data.success) {
        setResults(data.results || []);
        setErrors(data.errors || []);
        setSetupComplete(true);
        toast.success(data.message);
      } else {
        toast.error(data.error || 'Setup failed');
      }
    } catch (error) {
      console.error('Setup error:', error);
      toast.error('Failed to setup demo users');
    } finally {
      setLoading(false);
    }
  };

  const demoUsers = [
    { email: 'admin@lynkpro.com', role: 'Admin', description: 'Full system access' },
    { email: 'pm@lynkpro.com', role: 'Project Manager', description: 'Project management' },
    { email: 'field@lynkpro.com', role: 'Field Worker', description: 'Field operations' },
    { email: 'safety@lynkpro.com', role: 'Safety Officer', description: 'Safety & compliance' },
    { email: 'client@lynkpro.com', role: 'Client', description: 'Portal view-only' },
    { email: 'subcontractor@lynkpro.com', role: 'Subcontractor', description: 'Tasks & timesheets' },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Demo Users Setup</h1>
          <p className="text-muted-foreground">
            Create all 6 demo user accounts for testing LynkPro
          </p>
        </div>

        {/* Setup Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              <CardTitle>Create Demo Users</CardTitle>
            </div>
            <CardDescription>
              This will create 6 demo user accounts with the password "demo123"
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Users to be created */}
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Users to be created:</h3>
              <div className="grid gap-2">
                {demoUsers.map((user) => (
                  <div
                    key={user.email}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                  >
                    <div>
                      <p className="font-medium text-sm">{user.role}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">{user.description}</p>
                    </div>
                    {results.find((r) => r.email === user.email) && (
                      <Badge
                        variant={
                          results.find((r) => r.email === user.email)?.status === 'created'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {results.find((r) => r.email === user.email)?.status === 'created'
                          ? 'Created'
                          : 'Exists'}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Setup Button */}
            <Button
              onClick={setupDemoUsers}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up demo users...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  Setup Demo Users
                </>
              )}
            </Button>

            {/* Info */}
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    <strong>Password:</strong> All demo users will have the password "demo123"
                  </p>
                  <p>
                    <strong>Note:</strong> If users already exist, they will be skipped
                  </p>
                  <p>
                    <strong>Firm:</strong> All users will be assigned to "LynkPro Demo Construction"
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {setupComplete && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <CardTitle>Setup Complete</CardTitle>
              </div>
              <CardDescription>
                {results.filter((r) => r.status === 'created').length} users created,{' '}
                {results.filter((r) => r.status === 'already_exists').length} already existed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Success Results */}
              {results.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium text-sm">Results:</h3>
                  <div className="space-y-2">
                    {results.map((result) => (
                      <div
                        key={result.email}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="font-medium text-sm">{result.email}</p>
                            <p className="text-xs text-muted-foreground">
                              {result.status === 'created' ? 'Successfully created' : 'Already exists'}
                            </p>
                          </div>
                        </div>
                        <Badge variant={result.status === 'created' ? 'default' : 'secondary'}>
                          {result.role || 'N/A'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors */}
              {errors.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium text-sm text-destructive">Errors:</h3>
                  <div className="space-y-2">
                    {errors.map((error) => (
                      <div
                        key={error.email}
                        className="flex items-start gap-3 p-3 rounded-lg border border-destructive/50 bg-destructive/5"
                      >
                        <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium text-sm">{error.email}</p>
                          <p className="text-xs text-muted-foreground">{error.error}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Steps */}
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                <h3 className="font-medium text-sm mb-2 text-green-900 dark:text-green-100">
                  ✅ Next Steps
                </h3>
                <ul className="text-xs text-green-800 dark:text-green-200 space-y-1">
                  <li>• Go to the login page</li>
                  <li>• Click "Show" on the demo users card</li>
                  <li>• Click "Use" next to any user</li>
                  <li>• Click "Sign In" to login</li>
                  <li>• Password for all users: demo123</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Documentation Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Documentation</CardTitle>
            <CardDescription>Learn more about demo users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid gap-2">
              <a
                href="/DEMO_USERS_GUIDE.md"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <p className="font-medium text-sm">Demo Users Guide</p>
                <p className="text-xs text-muted-foreground">
                  Complete guide with role descriptions and testing scenarios
                </p>
              </a>
              <a
                href="/USER_ROLES_SUMMARY.md"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <p className="font-medium text-sm">User Roles Summary</p>
                <p className="text-xs text-muted-foreground">
                  Quick reference and permission matrix
                </p>
              </a>
              <a
                href="/QUICK_START_DEMO_USERS.md"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <p className="font-medium text-sm">Quick Start Guide</p>
                <p className="text-xs text-muted-foreground">
                  30-second quick start and testing checklist
                </p>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
