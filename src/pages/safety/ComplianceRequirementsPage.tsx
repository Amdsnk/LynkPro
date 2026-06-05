import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { ComplianceRequirement } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function ComplianceRequirementsPage() {
  const [loading, setLoading] = useState(true);
  const [requirements, setRequirements] = useState<ComplianceRequirement[]>([]);

  useEffect(() => {
    fetchRequirements();
  }, []);

  async function fetchRequirements() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('firm_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.firm_id) return;

      const { data, error } = await supabase
        .from('compliance_requirements')
        .select('*')
        .eq('firm_id', profile.firm_id)
        .order('requirement_name', { ascending: true });

      if (error) throw error;
      setRequirements(data || []);
    } catch (error) {
      console.error('Error fetching requirements:', error);
      toast.error('Failed to load requirements');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading requirements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Compliance Requirements</h1>
            <p className="text-muted-foreground mt-2">
              Manage regulatory requirements library
            </p>
          </div>
          <Button onClick={() => {}}>
            <Plus className="h-4 w-4 mr-2" />
            Add Requirement
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Total Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{requirements.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Requirements ({requirements.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {requirements.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No requirements yet. Add your first requirement to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {requirements.map((req) => (
                  <div key={req.id} className="p-4 rounded-lg border">
                    <p className="font-medium">{req.requirement_name}</p>
                    {req.description && (
                      <p className="text-sm text-muted-foreground mt-1">{req.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      {req.regulation_reference && <span>{req.regulation_reference}</span>}
                      {req.frequency && <span>Frequency: {req.frequency}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
