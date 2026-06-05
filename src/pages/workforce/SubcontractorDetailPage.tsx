import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { Subcontractor } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Mail, Phone, MapPin, FileText, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { PerformanceRating } from '@/components/workforce/PerformanceRating';
import { format, parseISO, isBefore, addDays } from 'date-fns';

export default function SubcontractorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subcontractor, setSubcontractor] = useState<Subcontractor | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      fetchSubcontractor();
      fetchAssignments();
    }
  }, [id]);

  async function fetchSubcontractor() {
    try {
      const { data, error } = await supabase
        .from('subcontractors')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error('Subcontractor not found');
        navigate('/subcontractors');
        return;
      }

      setSubcontractor(data);
    } catch (error) {
      console.error('Error fetching subcontractor:', error);
      toast.error('Failed to load subcontractor details');
    } finally {
      setLoading(false);
    }
  }

  async function fetchAssignments() {
    try {
      const { data, error } = await supabase
        .from('subcontractor_assignments')
        .select('*, projects(name)')
        .eq('subcontractor_id', id)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  }

  async function updateRating(newRating: number) {
    if (!subcontractor) return;

    try {
      const { error } = await supabase
        .from('subcontractors')
        .update({ rating: newRating })
        .eq('id', subcontractor.id);

      if (error) throw error;

      setSubcontractor({ ...subcontractor, rating: newRating });
      toast.success('Rating updated successfully');
    } catch (error) {
      console.error('Error updating rating:', error);
      toast.error('Failed to update rating');
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      active: 'default',
      inactive: 'secondary',
      suspended: 'destructive',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getInsuranceStatus = () => {
    if (!subcontractor?.insurance_expiry) return null;
    const expiry = parseISO(subcontractor.insurance_expiry);
    const today = new Date();
    const thirtyDaysFromNow = addDays(today, 30);

    if (isBefore(expiry, today)) {
      return (
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <div>
            <p className="font-medium">Insurance Expired</p>
            <p className="text-sm">Expired on {format(expiry, 'MMM d, yyyy')}</p>
          </div>
        </div>
      );
    } else if (isBefore(expiry, thirtyDaysFromNow)) {
      return (
        <div className="flex items-center gap-2 text-yellow-600">
          <AlertTriangle className="h-5 w-5" />
          <div>
            <p className="font-medium">Insurance Expiring Soon</p>
            <p className="text-sm">Expires on {format(expiry, 'MMM d, yyyy')}</p>
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-5 w-5" />
          <div>
            <p className="font-medium">Insurance Valid</p>
            <p className="text-sm">Expires on {format(expiry, 'MMM d, yyyy')}</p>
          </div>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading subcontractor details...</p>
        </div>
      </div>
    );
  }

  if (!subcontractor) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/subcontractors')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{subcontractor.company_name}</h1>
              <p className="text-muted-foreground mt-1">{subcontractor.specialty}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(subcontractor.status)}
            <Button onClick={() => navigate(`/subcontractors/${id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Contact Person</p>
                  <p className="font-medium">{subcontractor.contact_person}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{subcontractor.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{subcontractor.phone}</p>
                </div>
              </div>
              {subcontractor.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">{subcontractor.address}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Rating */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance Rating</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-3">Overall Rating</p>
                <div className="flex items-center gap-3">
                  <PerformanceRating
                    rating={subcontractor.rating || 0}
                    onChange={updateRating}
                    size="lg"
                  />
                  <span className="text-2xl font-bold">
                    {subcontractor.rating ? subcontractor.rating.toFixed(1) : 'N/A'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Click stars to update rating</p>
              </div>
            </CardContent>
          </Card>

          {/* License & Insurance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">License & Insurance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {subcontractor.license_number && (
                <div>
                  <p className="text-sm text-muted-foreground">License Number</p>
                  <p className="font-medium">{subcontractor.license_number}</p>
                </div>
              )}
              {subcontractor.insurance_expiry && (
                <div className="pt-2 border-t">
                  {getInsuranceStatus()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Project Assignments */}
        <Card>
          <CardHeader>
            <CardTitle>Project Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No project assignments yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{(assignment as any).projects?.name || 'Unknown Project'}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {assignment.task_description}
                      </p>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-right">
                        <p className="text-muted-foreground">Start Date</p>
                        <p className="font-medium">
                          {format(parseISO(assignment.start_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      {assignment.end_date && (
                        <div className="text-right">
                          <p className="text-muted-foreground">End Date</p>
                          <p className="font-medium">
                            {format(parseISO(assignment.end_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      )}
                      <Badge variant={assignment.status === 'active' ? 'default' : 'secondary'}>
                        {assignment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        {subcontractor.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{subcontractor.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
