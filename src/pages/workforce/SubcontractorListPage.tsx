import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { Subcontractor } from '@/types/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Star, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO, isBefore, addDays } from 'date-fns';

export default function SubcontractorListPage() {
  const navigate = useNavigate();
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tradeFilter, setTradeFilter] = useState<string>('all');

  useEffect(() => {
    fetchSubcontractors();
  }, []);

  async function fetchSubcontractors() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('firm_id')
        .eq('id', user.id)
        .single();

      if (!profile?.firm_id) return;

      const { data, error } = await supabase
        .from('subcontractors')
        .select('*')
        .eq('firm_id', profile.firm_id)
        .order('name');

      if (error) throw error;
      setSubcontractors(data || []);
    } catch (error) {
      console.error('Error fetching subcontractors:', error);
      toast.error('Failed to load subcontractors');
    } finally {
      setLoading(false);
    }
  }

  const filteredSubcontractors = subcontractors.filter((sub) => {
    const matchesSearch = sub.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    const matchesTrade = tradeFilter === 'all' || sub.specialty === tradeFilter;

    return matchesSearch && matchesStatus && matchesTrade;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      active: 'default',
      inactive: 'secondary',
      suspended: 'destructive',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getRatingStars = (rating: number | null) => {
    if (!rating) return <span className="text-muted-foreground text-sm">No rating</span>;
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < rating ? 'fill-primary text-primary' : 'text-muted'}`}
          />
        ))}
        <span className="text-sm ml-1">({rating.toFixed(1)})</span>
      </div>
    );
  };

  const getInsuranceStatus = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const expiry = parseISO(expiryDate);
    const today = new Date();
    const thirtyDaysFromNow = addDays(today, 30);

    if (isBefore(expiry, today)) {
      return (
        <div className="flex items-center gap-1 text-destructive text-sm">
          <AlertTriangle className="h-4 w-4" />
          <span>Expired</span>
        </div>
      );
    } else if (isBefore(expiry, thirtyDaysFromNow)) {
      return (
        <div className="flex items-center gap-1 text-yellow-600 text-sm">
          <AlertTriangle className="h-4 w-4" />
          <span>Expiring soon</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1 text-green-600 text-sm">
          <CheckCircle className="h-4 w-4" />
          <span>Valid</span>
        </div>
      );
    }
  };

  const uniqueTrades = Array.from(new Set(subcontractors.map(s => s.specialty).filter(Boolean)));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading subcontractors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Subcontractors</h1>
            <p className="text-muted-foreground mt-1">
              Manage your subcontractor directory and track performance
            </p>
          </div>
          <Button onClick={() => navigate('/subcontractors/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Subcontractor
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Subcontractors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subcontractors.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {subcontractors.filter(s => s.status === 'active').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {subcontractors.filter(s => s.rating).length > 0
                  ? (subcontractors.reduce((sum, s) => sum + (s.rating || 0), 0) /
                      subcontractors.filter(s => s.rating).length).toFixed(1)
                  : 'N/A'}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Insurance Expiring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {subcontractors.filter(s => {
                  if (!s.insurance_expiry) return false;
                  const expiry = parseISO(s.insurance_expiry);
                  const thirtyDaysFromNow = addDays(new Date(), 30);
                  return isBefore(expiry, thirtyDaysFromNow);
                }).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search subcontractors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Select value={tradeFilter} onValueChange={setTradeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by trade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trades</SelectItem>
                  {uniqueTrades.map((trade) => (
                    <SelectItem key={trade} value={trade!}>
                      {trade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Subcontractor List */}
        {filteredSubcontractors.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || tradeFilter !== 'all'
                  ? 'No subcontractors match your filters'
                  : 'No subcontractors yet. Add your first subcontractor to get started.'}
              </p>
              {!searchTerm && statusFilter === 'all' && tradeFilter === 'all' && (
                <Button onClick={() => navigate('/subcontractors/new')} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Subcontractor
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSubcontractors.map((sub) => (
              <Card
                key={sub.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/subcontractors/${sub.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{sub.company_name}</CardTitle>
                      {sub.specialty && (
                        <p className="text-sm text-muted-foreground mt-1">{sub.specialty}</p>
                      )}
                    </div>
                    {getStatusBadge(sub.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sub.contact_person && (
                    <div>
                      <p className="text-sm font-medium">Contact</p>
                      <p className="text-sm text-muted-foreground">{sub.contact_person}</p>
                    </div>
                  )}
                  {sub.email && (
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{sub.email}</p>
                    </div>
                  )}
                  {sub.phone && (
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">{sub.phone}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium mb-1">Performance Rating</p>
                    {getRatingStars(sub.rating)}
                  </div>
                  {sub.insurance_expiry && (
                    <div>
                      <p className="text-sm font-medium mb-1">Insurance Status</p>
                      {getInsuranceStatus(sub.insurance_expiry)}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
