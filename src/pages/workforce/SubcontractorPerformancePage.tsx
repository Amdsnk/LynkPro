import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Award, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { PerformanceRating } from '@/components/workforce/PerformanceRating';

interface SubcontractorPerformance {
  id: string;
  company_name: string;
  specialty: string;
  rating: number | null;
  assignmentCount: number;
  activeAssignments: number;
  completedAssignments: number;
}

export default function SubcontractorPerformancePage() {
  const [loading, setLoading] = useState(true);
  const [subcontractors, setSubcontractors] = useState<SubcontractorPerformance[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('firm_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.firm_id) return;

      // Fetch subcontractors
      const { data: subcontractorsData, error: subcontractorsError } = await supabase
        .from('subcontractors')
        .select('id, company_name, specialty, rating')
        .eq('firm_id', profile.firm_id)
        .order('rating', { ascending: false, nullsFirst: false });

      if (subcontractorsError) throw subcontractorsError;

      // Fetch assignments for each subcontractor
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('subcontractor_assignments')
        .select('subcontractor_id, status')
        .eq('firm_id', profile.firm_id);

      if (assignmentsError) throw assignmentsError;

      // Aggregate assignment counts
      const assignmentCounts: Record<string, { total: number; active: number; completed: number }> = {};
      
      (assignmentsData || []).forEach((assignment) => {
        if (!assignmentCounts[assignment.subcontractor_id]) {
          assignmentCounts[assignment.subcontractor_id] = { total: 0, active: 0, completed: 0 };
        }
        assignmentCounts[assignment.subcontractor_id].total += 1;
        if (assignment.status === 'active') {
          assignmentCounts[assignment.subcontractor_id].active += 1;
        } else if (assignment.status === 'completed') {
          assignmentCounts[assignment.subcontractor_id].completed += 1;
        }
      });

      // Combine data
      const performanceData = (subcontractorsData || []).map((sub) => ({
        ...sub,
        assignmentCount: assignmentCounts[sub.id]?.total || 0,
        activeAssignments: assignmentCounts[sub.id]?.active || 0,
        completedAssignments: assignmentCounts[sub.id]?.completed || 0,
      }));

      setSubcontractors(performanceData);
    } catch (error) {
      console.error('Error fetching performance data:', error);
      toast.error('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  }

  function exportReport() {
    const csv = [
      ['Company Name', 'Specialty', 'Rating', 'Total Assignments', 'Active', 'Completed', 'Completion Rate'],
      ...subcontractors.map(sub => [
        sub.company_name,
        sub.specialty,
        sub.rating?.toString() || 'N/A',
        sub.assignmentCount.toString(),
        sub.activeAssignments.toString(),
        sub.completedAssignments.toString(),
        sub.assignmentCount > 0
          ? `${((sub.completedAssignments / sub.assignmentCount) * 100).toFixed(1)}%`
          : 'N/A',
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subcontractor-performance-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
  }

  const avgRating = subcontractors.filter(s => s.rating).length > 0
    ? subcontractors.reduce((sum, s) => sum + (s.rating || 0), 0) / subcontractors.filter(s => s.rating).length
    : 0;

  const topPerformers = subcontractors.filter(s => s.rating && s.rating >= 4).length;
  const totalAssignments = subcontractors.reduce((sum, s) => sum + s.assignmentCount, 0);
  const totalCompleted = subcontractors.reduce((sum, s) => sum + s.completedAssignments, 0);
  const completionRate = totalAssignments > 0 ? (totalCompleted / totalAssignments) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Subcontractor Performance</h1>
            <p className="text-muted-foreground mt-2">
              Track and analyze subcontractor performance metrics
            </p>
          </div>
          <Button onClick={exportReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Award className="h-4 w-4" />
                Average Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{avgRating.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground mt-1">out of 5.0</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{topPerformers}</div>
              <p className="text-xs text-muted-foreground mt-1">rated 4+ stars</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalAssignments}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalCompleted} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{completionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">overall success rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Subcontractor Performance Details</CardTitle>
          </CardHeader>
          <CardContent>
            {subcontractors.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No subcontractors found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Company</th>
                      <th className="text-left py-3 px-4 font-medium">Specialty</th>
                      <th className="text-left py-3 px-4 font-medium">Rating</th>
                      <th className="text-center py-3 px-4 font-medium">Total</th>
                      <th className="text-center py-3 px-4 font-medium">Active</th>
                      <th className="text-center py-3 px-4 font-medium">Completed</th>
                      <th className="text-center py-3 px-4 font-medium">Success Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subcontractors.map((sub) => (
                      <tr key={sub.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-4 px-4 font-medium">{sub.company_name}</td>
                        <td className="py-4 px-4 text-muted-foreground">{sub.specialty}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <PerformanceRating rating={sub.rating || 0} readonly size="sm" />
                            <span className="text-sm text-muted-foreground">
                              {sub.rating ? sub.rating.toFixed(1) : 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">{sub.assignmentCount}</td>
                        <td className="py-4 px-4 text-center">{sub.activeAssignments}</td>
                        <td className="py-4 px-4 text-center">{sub.completedAssignments}</td>
                        <td className="py-4 px-4 text-center">
                          {sub.assignmentCount > 0 ? (
                            <span className={`font-medium ${
                              (sub.completedAssignments / sub.assignmentCount) >= 0.8
                                ? 'text-green-600'
                                : (sub.completedAssignments / sub.assignmentCount) >= 0.5
                                ? 'text-yellow-600'
                                : 'text-destructive'
                            }`}>
                              {((sub.completedAssignments / sub.assignmentCount) * 100).toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Performers */}
        {topPerformers > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subcontractors
                  .filter(s => s.rating && s.rating >= 4)
                  .slice(0, 6)
                  .map((sub) => (
                    <div key={sub.id} className="p-4 rounded-lg border">
                      <p className="font-medium">{sub.company_name}</p>
                      <p className="text-sm text-muted-foreground mt-1">{sub.specialty}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <PerformanceRating rating={sub.rating || 0} readonly size="sm" />
                        <span className="text-sm font-medium">{sub.rating?.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                        <span>{sub.completedAssignments} completed</span>
                        <span>{sub.activeAssignments} active</span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
