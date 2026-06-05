import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { Permit, PermitStatus } from '@/types/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  isBefore,
  isAfter,
  addDays,
  startOfWeek,
  endOfWeek,
} from 'date-fns';

export default function PermitCalendarPage() {
  const navigate = useNavigate();
  const [permits, setPermits] = useState<Permit[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDayPermits, setSelectedDayPermits] = useState<Permit[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<PermitStatus | 'all'>('all');
  const [permitTypes, setPermitTypes] = useState<string[]>([]);

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

      const { data, error } = await supabase
        .from('permits')
        .select('*')
        .eq('firm_id', profile.firm_id)
        .order('expiration_date', { ascending: true });

      if (error) throw error;

      setPermits(data || []);

      // Extract unique permit types for filter
      const types = Array.from(new Set((data || []).map((p) => p.permit_type)));
      setPermitTypes(types);
    } catch (error) {
      console.error('Error fetching permits:', error);
      toast.error('Failed to load permits');
    } finally {
      setLoading(false);
    }
  };

  const getPermitColor = (expirationDate: string) => {
    const expDate = new Date(expirationDate);
    const today = new Date();
    const thirtyDaysFromNow = addDays(today, 30);

    if (isBefore(expDate, today)) {
      return 'expired'; // Red
    } else if (isBefore(expDate, thirtyDaysFromNow)) {
      return 'expiring-soon'; // Yellow
    } else {
      return 'active'; // Green
    }
  };

  const filteredPermits = permits.filter((permit) => {
    const matchesType = typeFilter === 'all' || permit.permit_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || permit.status === statusFilter;
    return matchesType && matchesStatus;
  });

  const getPermitsForDay = (day: Date) => {
    return filteredPermits.filter((permit) =>
      isSameDay(new Date(permit.expiration_date), day)
    );
  };

  const getDayColorClass = (day: Date) => {
    const dayPermits = getPermitsForDay(day);
    if (dayPermits.length === 0) return '';

    const hasExpired = dayPermits.some((p) => getPermitColor(p.expiration_date) === 'expired');
    const hasExpiringSoon = dayPermits.some((p) => getPermitColor(p.expiration_date) === 'expiring-soon');
    const hasActive = dayPermits.some((p) => getPermitColor(p.expiration_date) === 'active');

    // Priority: expired > expiring soon > active
    if (hasExpired) return 'bg-red-100 border-red-300';
    if (hasExpiringSoon) return 'bg-yellow-100 border-yellow-300';
    if (hasActive) return 'bg-green-100 border-green-300';
    return '';
  };

  const handleDayClick = (day: Date) => {
    const dayPermits = getPermitsForDay(day);
    if (dayPermits.length > 0) {
      setSelectedDate(day);
      setSelectedDayPermits(dayPermits);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Generate calendar days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-light tracking-tight text-foreground">Permit Calendar</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              View permits organized by expiration date
            </p>
          </div>
          <Button onClick={() => navigate('/permits')} variant="outline" className="gap-2">
            <CalendarIcon className="h-4 w-4" />
            View List
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {permitTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as PermitStatus | 'all')}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
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

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setTypeFilter('all');
                    setStatusFilter('all');
                  }}
                  className="flex-1"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-medium text-foreground">Legend:</span>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded border border-red-300 bg-red-100" />
                <span className="text-sm text-muted-foreground">Expired</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded border border-yellow-300 bg-yellow-100" />
                <span className="text-sm text-muted-foreground">Expiring Soon (30 days)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded border border-green-300 bg-green-100" />
                <span className="text-sm text-muted-foreground">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-medium">
                {format(currentDate, 'MMMM yyyy')}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleToday}>
                  Today
                </Button>
                <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="mt-4 text-sm text-muted-foreground">Loading calendar...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Week day headers */}
                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((day) => (
                    <div
                      key={day}
                      className="p-2 text-center text-xs font-medium text-muted-foreground"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day, index) => {
                    const dayPermits = getPermitsForDay(day);
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isTodayDate = isToday(day);
                    const colorClass = getDayColorClass(day);

                    return (
                      <button
                        key={index}
                        onClick={() => handleDayClick(day)}
                        disabled={dayPermits.length === 0}
                        className={`
                          relative min-h-[80px] rounded-lg border p-2 text-left transition-all
                          ${isCurrentMonth ? 'bg-card' : 'bg-muted/30'}
                          ${colorClass}
                          ${isTodayDate ? 'ring-2 ring-primary ring-offset-2' : ''}
                          ${dayPermits.length > 0 ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}
                          ${!isCurrentMonth ? 'opacity-50' : ''}
                        `}
                      >
                        <div className="flex flex-col gap-1">
                          <span
                            className={`text-sm font-medium ${
                              isTodayDate ? 'text-primary' : 'text-foreground'
                            }`}
                          >
                            {format(day, 'd')}
                          </span>
                          {dayPermits.length > 0 && (
                            <div className="space-y-1">
                              <div className="text-xs font-medium text-foreground">
                                {dayPermits.length} permit{dayPermits.length !== 1 ? 's' : ''}
                              </div>
                              {dayPermits.slice(0, 2).map((permit) => (
                                <div
                                  key={permit.id}
                                  className="truncate text-xs text-muted-foreground"
                                  title={permit.permit_name}
                                >
                                  {permit.permit_name}
                                </div>
                              ))}
                              {dayPermits.length > 2 && (
                                <div className="text-xs text-muted-foreground">
                                  +{dayPermits.length - 2} more
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-red-100 p-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-light">
                    {filteredPermits.filter((p) => getPermitColor(p.expiration_date) === 'expired').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Expired Permits</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-yellow-100 p-2">
                  <CalendarIcon className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-light">
                    {filteredPermits.filter((p) => getPermitColor(p.expiration_date) === 'expiring-soon').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Expiring Soon</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-100 p-2">
                  <CalendarIcon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-light">
                    {filteredPermits.filter((p) => getPermitColor(p.expiration_date) === 'active').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Active Permits</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Day Detail Dialog */}
      <Dialog open={selectedDate !== null} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Permits Expiring on {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {selectedDayPermits.map((permit) => (
              <Card
                key={permit.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => {
                  setSelectedDate(null);
                  navigate(`/permits/${permit.id}`);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-medium text-foreground">{permit.permit_name}</h4>
                          <p className="text-xs text-muted-foreground">{permit.permit_number}</p>
                        </div>
                        <Badge className={getStatusColor(permit.status)} variant="outline">
                          {permit.status}
                        </Badge>
                      </div>
                      <div className="grid gap-2 text-sm md:grid-cols-2">
                        <div>
                          <span className="text-muted-foreground">Type: </span>
                          <span className="font-medium">{permit.permit_type}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Authority: </span>
                          <span className="font-medium">{permit.issuing_authority}</span>
                        </div>
                      </div>
                      <div
                        className={`inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs ${
                          getPermitColor(permit.expiration_date) === 'expired'
                            ? 'bg-red-50 text-red-700'
                            : getPermitColor(permit.expiration_date) === 'expiring-soon'
                              ? 'bg-yellow-50 text-yellow-700'
                              : 'bg-green-50 text-green-700'
                        }`}
                      >
                        <AlertCircle className="h-3 w-3" />
                        {getPermitColor(permit.expiration_date) === 'expired'
                          ? 'Expired'
                          : getPermitColor(permit.expiration_date) === 'expiring-soon'
                            ? 'Expiring Soon'
                            : 'Active'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
