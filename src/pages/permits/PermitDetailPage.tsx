import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { Permit, PermitStatus } from '@/types/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Calendar,
  FileText,
  Building2,
  Hash,
  Clock,
  AlertCircle,
  Download,
  Edit,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function PermitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [permit, setPermit] = useState<Permit | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPermit();
    }
  }, [id]);

  const fetchPermit = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('permits')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error('Permit not found');
        navigate('/permits');
        return;
      }

      setPermit(data);
    } catch (error) {
      console.error('Error fetching permit:', error);
      toast.error('Failed to load permit details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!permit) return;

    try {
      setDeleting(true);
      const { error } = await supabase.from('permits').delete().eq('id', permit.id);

      if (error) throw error;

      toast.success('Permit deleted successfully');
      navigate('/permits');
    } catch (error) {
      console.error('Error deleting permit:', error);
      toast.error('Failed to delete permit');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusColor = (status: PermitStatus) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'renewed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rejected':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isExpiringSoon = (expirationDate: string) => {
    const expDate = new Date(expirationDate);
    const today = new Date();
    const thirtyDaysFromNow = addDays(today, 30);
    return isAfter(expDate, today) && isBefore(expDate, thirtyDaysFromNow);
  };

  const isExpired = (expirationDate: string) => {
    return isBefore(new Date(expirationDate), new Date());
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">Loading permit details...</p>
        </div>
      </div>
    );
  }

  if (!permit) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/permits')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-light tracking-tight text-foreground">Permit Details</h1>
            <p className="mt-1 text-sm text-muted-foreground">View and manage permit information</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/permits/${permit.id}/edit`)} className="gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Permit</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this permit? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Alert Banner */}
        {(isExpired(permit.expiration_date) || isExpiringSoon(permit.expiration_date)) && (
          <Card
            className={
              isExpired(permit.expiration_date)
                ? 'border-red-200 bg-red-50'
                : 'border-yellow-200 bg-yellow-50'
            }
          >
            <CardContent className="flex items-center gap-3 p-4">
              <AlertCircle
                className={`h-5 w-5 ${isExpired(permit.expiration_date) ? 'text-red-600' : 'text-yellow-600'}`}
              />
              <div>
                <p
                  className={`text-sm font-medium ${isExpired(permit.expiration_date) ? 'text-red-900' : 'text-yellow-900'}`}
                >
                  {isExpired(permit.expiration_date)
                    ? 'This permit has expired'
                    : 'This permit is expiring soon'}
                </p>
                <p
                  className={`text-xs ${isExpired(permit.expiration_date) ? 'text-red-700' : 'text-yellow-700'}`}
                >
                  {isExpired(permit.expiration_date)
                    ? 'Immediate action required'
                    : 'Expires within 30 days'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl font-medium">{permit.permit_name}</CardTitle>
                <p className="text-sm text-muted-foreground">{permit.permit_number}</p>
              </div>
              <Badge className={getStatusColor(permit.status)} variant="outline">
                {permit.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">Basic Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 space-y-1">
                    <p className="text-xs text-muted-foreground">Permit Type</p>
                    <p className="text-sm font-medium">{permit.permit_type}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 space-y-1">
                    <p className="text-xs text-muted-foreground">Issuing Authority</p>
                    <p className="text-sm font-medium">{permit.issuing_authority}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Hash className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 space-y-1">
                    <p className="text-xs text-muted-foreground">Permit Number</p>
                    <p className="text-sm font-medium">{permit.permit_number}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 space-y-1">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="text-sm font-medium capitalize">{permit.status}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Dates */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">Important Dates</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 space-y-1">
                    <p className="text-xs text-muted-foreground">Issue Date</p>
                    <p className="text-sm font-medium">
                      {format(new Date(permit.issue_date), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 space-y-1">
                    <p className="text-xs text-muted-foreground">Expiration Date</p>
                    <p
                      className={`text-sm font-medium ${
                        isExpired(permit.expiration_date)
                          ? 'text-red-600'
                          : isExpiringSoon(permit.expiration_date)
                            ? 'text-yellow-600'
                            : ''
                      }`}
                    >
                      {format(new Date(permit.expiration_date), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Document */}
            {permit.document_url && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-foreground">Document</h3>
                  <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Permit Document</p>
                        <p className="text-xs text-muted-foreground">Click to view or download</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(permit.document_url!, '_blank')}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      View
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Notes */}
            {permit.notes && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-foreground">Notes</h3>
                  <p className="text-sm text-muted-foreground">{permit.notes}</p>
                </div>
              </>
            )}

            {/* Metadata */}
            <Separator />
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">Metadata</h3>
              <div className="grid gap-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span>{format(new Date(permit.created_at), 'MMM d, yyyy h:mm a')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Updated:</span>
                  <span>{format(new Date(permit.updated_at), 'MMM d, yyyy h:mm a')}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
