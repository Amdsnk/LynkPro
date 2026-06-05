import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { Permit, PermitStatus } from '@/types/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, FileText, AlertCircle, Calendar, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { format, isAfter, isBefore, addDays } from 'date-fns';

export default function PermitListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [permits, setPermits] = useState<Permit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<PermitStatus | 'all'>(
    (searchParams.get('status') as PermitStatus) || 'all'
  );
  const [expirationFilter, setExpirationFilter] = useState<'all' | 'expiring_soon' | 'expired'>(
    (searchParams.get('expiration') as 'all' | 'expiring_soon' | 'expired') || 'all'
  );

  useEffect(() => {
    fetchPermits();
  }, []);

  const fetchPermits = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to view permits');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('firm_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.firm_id) {
        toast.error('No firm associated with your account');
        return;
      }

      let query = supabase
        .from('permits')
        .select('*')
        .eq('firm_id', profile.firm_id)
        .order('expiration_date', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;

      setPermits(data || []);
    } catch (error) {
      console.error('Error fetching permits:', error);
      toast.error('Failed to load permits');
    } finally {
      setLoading(false);
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

  const filteredPermits = permits.filter((permit) => {
    // Search filter
    const matchesSearch =
      searchQuery === '' ||
      permit.permit_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permit.permit_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permit.permit_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permit.issuing_authority.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus = statusFilter === 'all' || permit.status === statusFilter;

    // Expiration filter
    let matchesExpiration = true;
    if (expirationFilter === 'expiring_soon') {
      matchesExpiration = isExpiringSoon(permit.expiration_date);
    } else if (expirationFilter === 'expired') {
      matchesExpiration = isExpired(permit.expiration_date);
    }

    return matchesSearch && matchesStatus && matchesExpiration;
  });

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    setSearchParams(params);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value as PermitStatus | 'all');
    const params = new URLSearchParams(searchParams);
    if (value !== 'all') {
      params.set('status', value);
    } else {
      params.delete('status');
    }
    setSearchParams(params);
  };

  const handleExpirationFilter = (value: string) => {
    setExpirationFilter(value as 'all' | 'expiring_soon' | 'expired');
    const params = new URLSearchParams(searchParams);
    if (value !== 'all') {
      params.set('expiration', value);
    } else {
      params.delete('expiration');
    }
    setSearchParams(params);
  };

  const expiringCount = permits.filter((p) => isExpiringSoon(p.expiration_date)).length;
  const expiredCount = permits.filter((p) => isExpired(p.expiration_date)).length;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-light tracking-tight text-foreground">Permits</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage project permits and track expiration dates
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/permits/calendar')} variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              Calendar View
            </Button>
            <Button onClick={() => navigate('/permits/new')} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Permit
            </Button>
          </div>
        </div>

        {/* Alert Cards */}
        {(expiringCount > 0 || expiredCount > 0) && (
          <div className="grid gap-4 md:grid-cols-2">
            {expiredCount > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="flex items-center gap-3 p-4">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-red-900">
                      {expiredCount} Expired Permit{expiredCount !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-red-700">Requires immediate attention</p>
                  </div>
                </CardContent>
              </Card>
            )}
            {expiringCount > 0 && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="flex items-center gap-3 p-4">
                  <Calendar className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900">
                      {expiringCount} Expiring Soon
                    </p>
                    <p className="text-xs text-yellow-700">Within 30 days</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid gap-4 md:grid-cols-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search permits..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="Filter by status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="renewed">Renewed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              {/* Expiration Filter */}
              <Select value={expirationFilter} onValueChange={handleExpirationFilter}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <SelectValue placeholder="Filter by expiration" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Permits</SelectItem>
                  <SelectItem value="expiring_soon">Expiring Soon (30 days)</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Permits List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="mt-4 text-sm text-muted-foreground">Loading permits...</p>
            </div>
          </div>
        ) : filteredPermits.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No permits found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery || statusFilter !== 'all' || expirationFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by adding your first permit'}
              </p>
              {!searchQuery && statusFilter === 'all' && expirationFilter === 'all' && (
                <Button onClick={() => navigate('/permits/new')} className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Add Permit
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPermits.map((permit) => (
              <Card
                key={permit.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => navigate(`/permits/${permit.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <CardTitle className="text-base font-medium leading-tight">
                        {permit.permit_name}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">{permit.permit_number}</p>
                    </div>
                    <Badge className={getStatusColor(permit.status)} variant="outline">
                      {permit.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="font-medium">{permit.permit_type}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Authority:</span>
                      <span className="truncate font-medium">{permit.issuing_authority}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Issued:</span>
                      <span className="font-medium">
                        {format(new Date(permit.issue_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Expires:</span>
                      <span
                        className={`font-medium ${
                          isExpired(permit.expiration_date)
                            ? 'text-red-600'
                            : isExpiringSoon(permit.expiration_date)
                              ? 'text-yellow-600'
                              : ''
                        }`}
                      >
                        {format(new Date(permit.expiration_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>

                  {(isExpired(permit.expiration_date) || isExpiringSoon(permit.expiration_date)) && (
                    <div
                      className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs ${
                        isExpired(permit.expiration_date)
                          ? 'bg-red-50 text-red-700'
                          : 'bg-yellow-50 text-yellow-700'
                      }`}
                    >
                      <AlertCircle className="h-3 w-3" />
                      {isExpired(permit.expiration_date) ? 'Expired' : 'Expiring soon'}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Results Count */}
        {!loading && filteredPermits.length > 0 && (
          <p className="text-center text-sm text-muted-foreground">
            Showing {filteredPermits.length} of {permits.length} permit{permits.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  );
}
