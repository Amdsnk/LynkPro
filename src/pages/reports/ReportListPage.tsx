import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { ExplainableMetric } from '@/components/shared/ExplainableMetric';
import { PagePresence } from '@/components/shared/PagePresence';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { useRealtimeReports } from '@/hooks/useRealtimeData';
import type { Report, ReportStatusType } from '@/types/types';
import { Plus, Search, Filter, ClipboardList, Calendar, MapPin, FileCheck, FileClock, X, CalendarIcon, User } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ReportListPage() {
  const { profile, isClient } = useAuth();
  
  // Real-time reports
  const { reports, loading } = useRealtimeReports(profile?.firm_id);
  
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReportStatusType[]>([]);
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [creatorFilter, setCreatorFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  // Extract unique projects and creators for filter dropdowns
  const uniqueProjects = useMemo(() => {
    const projects = reports
      .map(r => r.project)
      .filter((p, index, self) => p && self.findIndex(sp => sp?.id === p.id) === index);
    return projects as NonNullable<typeof projects[0]>[];
  }, [reports]);

  const uniqueCreators = useMemo(() => {
    const creators = reports
      .map(r => r.creator)
      .filter((c, index, self) => c && self.findIndex(sc => sc?.id === c.id) === index);
    return creators as NonNullable<typeof creators[0]>[];
  }, [reports]);

  useEffect(() => {
    let filtered = reports;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.site_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.project?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter (multi-select)
    if (statusFilter.length > 0) {
      filtered = filtered.filter((r) => statusFilter.includes(r.status as ReportStatusType));
    }

    // Project filter
    if (projectFilter !== 'all') {
      filtered = filtered.filter((r) => r.project_id === projectFilter);
    }

    // Creator filter
    if (creatorFilter !== 'all') {
      filtered = filtered.filter((r) => r.created_by === creatorFilter);
    }

    // Date range filter
    if (dateRange.from) {
      filtered = filtered.filter((r) => {
        const reportDate = new Date(r.created_at);
        const fromDate = new Date(dateRange.from!);
        fromDate.setHours(0, 0, 0, 0);
        return reportDate >= fromDate;
      });
    }

    if (dateRange.to) {
      filtered = filtered.filter((r) => {
        const reportDate = new Date(r.created_at);
        const toDate = new Date(dateRange.to!);
        toDate.setHours(23, 59, 59, 999);
        return reportDate <= toDate;
      });
    }

    setFilteredReports(filtered);
  }, [searchTerm, statusFilter, projectFilter, creatorFilter, dateRange, reports]);

  const totalReports = reports.filter(r => r.status === 'sent').length;
  const draftReports = reports.filter(r => r.status === 'draft').length;
  const completionRate = reports.length > 0 ? Math.round((totalReports / reports.length) * 100) : 0;

  const hasActiveFilters = 
    statusFilter.length > 0 || 
    projectFilter !== 'all' || 
    creatorFilter !== 'all' || 
    dateRange.from !== undefined || 
    dateRange.to !== undefined;

  const clearAllFilters = () => {
    setStatusFilter([]);
    setProjectFilter('all');
    setCreatorFilter('all');
    setDateRange({ from: undefined, to: undefined });
    setSearchTerm('');
  };

  const toggleStatus = (status: ReportStatusType) => {
    setStatusFilter(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  if (loading) {
    return (
      <div className="section-spacing">
        <Skeleton className="h-12 w-64 bg-muted" />
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="section-spacing">
      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title="Field Review Reports"
          description={`${filteredReports.length} ${filteredReports.length === 1 ? 'report' : 'reports'} total`}
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Reports' },
          ]}
          actions={
            !isClient && (
              <Button asChild>
                <Link to="/reports/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Report
                </Link>
              </Button>
            )
          }
        />
        <PagePresence page="reports" />
      </div>

      {/* Report Statistics */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <ExplainableMetric
          title="Total Reports"
          value={`${reports.length}`}
          icon={<ClipboardList className="h-4 w-4" />}
          trend="up"
          trendValue="+3 this week"
          explanation="Total number of field review reports created across all projects"
          calculation={`${reports.length} reports in database`}
          dataSource="Reports table"
          confidence={100}
          factors={['Field inspections', 'Project activity', 'Client requirements']}
        />
        <ExplainableMetric
          title="Submitted"
          value={`${totalReports}`}
          icon={<FileCheck className="h-4 w-4" />}
          trend="up"
          explanation="Reports successfully submitted and sent to clients"
          calculation={`${totalReports} reports with status = 'submitted'`}
          dataSource="Reports table"
          confidence={100}
          factors={['Inspector productivity', 'Review process', 'Client communication']}
        />
        <ExplainableMetric
          title="In Draft"
          value={`${draftReports}`}
          icon={<FileClock className="h-4 w-4" />}
          trend={draftReports > 5 ? 'down' : 'neutral'}
          explanation="Reports currently being drafted and awaiting submission"
          calculation={`${draftReports} reports with status = 'draft'`}
          dataSource="Reports table"
          confidence={100}
          factors={['Workload', 'Report complexity', 'Review requirements']}
        />
        <ExplainableMetric
          title="Completion Rate"
          value={`${completionRate}%`}
          icon={<FileCheck className="h-4 w-4" />}
          trend={completionRate >= 80 ? 'up' : 'neutral'}
          explanation="Percentage of reports completed and submitted vs total reports"
          calculation={`${totalReports} submitted / ${reports.length} total`}
          dataSource="Reports table"
          confidence={95}
          factors={['Team efficiency', 'Process optimization', 'Quality standards']}
        />
      </div>

      <Card className="shadow-sm">
        <div className="p-6 border-b border-border bg-muted/30">
          {/* Search Bar */}
          <div className="flex-1 relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reports by title, location, or project..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Advanced Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Date Range Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "MMM d, yyyy")
                    )
                  ) : (
                    <span>Date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3 space-y-2">
                  <div className="text-sm font-medium mb-2">Select Date Range</div>
                  <CalendarComponent
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                    initialFocus
                  />
                  <div className="text-xs text-muted-foreground mb-1">To Date:</div>
                  <CalendarComponent
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                  />
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setDateRange({ from: undefined, to: undefined })}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Project Filter */}
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {uniqueProjects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Multi-Select */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  {statusFilter.length > 0 ? (
                    <span>{statusFilter.length} status selected</span>
                  ) : (
                    <span>All statuses</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56" align="start">
                <div className="space-y-2">
                  <div className="text-sm font-medium mb-2">Filter by Status</div>
                  {(['draft', 'sent'] as ReportStatusType[]).map((status) => (
                    <label
                      key={status}
                      className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={statusFilter.includes(status)}
                        onChange={() => toggleStatus(status)}
                        className="rounded border-border"
                      />
                      <span className="text-sm capitalize">{status}</span>
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Creator Filter */}
            <Select value={creatorFilter} onValueChange={setCreatorFilter}>
              <SelectTrigger className="w-full">
                <User className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All creators" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Creators</SelectItem>
                {uniqueCreators.map((creator) => (
                  <SelectItem key={creator.id} value={creator.id}>
                    {creator.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              
              {statusFilter.map((status) => (
                <Badge key={status} variant="secondary" className="gap-1">
                  <span className="capitalize">{status}</span>
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => toggleStatus(status)}
                  />
                </Badge>
              ))}

              {projectFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {uniqueProjects.find(p => p.id === projectFilter)?.name}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setProjectFilter('all')}
                  />
                </Badge>
              )}

              {creatorFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {uniqueCreators.find(c => c.id === creatorFilter)?.full_name}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setCreatorFilter('all')}
                  />
                </Badge>
              )}

              {(dateRange.from || dateRange.to) && (
                <Badge variant="secondary" className="gap-1">
                  {dateRange.from && format(dateRange.from, "MMM d")}
                  {dateRange.from && dateRange.to && " - "}
                  {dateRange.to && format(dateRange.to, "MMM d, yyyy")}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setDateRange({ from: undefined, to: undefined })}
                  />
                </Badge>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="ml-auto"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>
        <CardContent className="p-0">
          {filteredReports.length === 0 ? (
            <div className="empty-state py-12">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No reports found</p>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm || hasActiveFilters
                  ? 'Try adjusting your search or filters'
                  : 'Create your first field review report to get started'}
              </p>
              {!isClient && !searchTerm && !hasActiveFilters && (
                <Link to="/reports/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Report
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="w-12">
                      <input type="checkbox" className="rounded border-border" />
                    </th>
                    <th>Title</th>
                    <th>Project</th>
                    <th>Creator</th>
                    <th>Created Date</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => (
                    <tr key={report.id}>
                      <td>
                        <input type="checkbox" className="rounded border-border" />
                      </td>
                      <td>
                        <Link to={`/reports/${report.id}`} className="hover:text-primary font-medium">
                          {report.title}
                        </Link>
                        {report.observations && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {report.observations}
                          </p>
                        )}
                      </td>
                      <td>
                        <span>{report.project?.name || 'No project'}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{report.creator?.full_name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(report.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <StatusBadge 
                          status={report.status}
                          variant={
                            report.status === 'sent' ? 'success' :
                            'default'
                          }
                        />
                      </td>
                      <td className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/reports/${report.id}`}>
                            View Details
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
