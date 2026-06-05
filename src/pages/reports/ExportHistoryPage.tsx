import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Search, FileText, FileSpreadsheet, FileDown, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { FilterMetadata } from '@/types/filterMetadata';

interface ExportHistoryRecord {
  id: string;
  report_type: string;
  report_name: string;
  export_format: string;
  user_name: string;
  exported_at: string;
  filter_config: FilterMetadata | null;
}

export default function ExportHistoryPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [records, setRecords] = useState<ExportHistoryRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<ExportHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState('all');
  const [reportTypeFilter, setReportTypeFilter] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState<ExportHistoryRecord | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    fetchExportHistory();
  }, [profile]);

  useEffect(() => {
    filterRecords();
  }, [records, searchQuery, formatFilter, reportTypeFilter]);

  const fetchExportHistory = async () => {
    if (!profile?.firm_id) return;

    try {
      const { data, error } = await supabase
        .from('export_history')
        .select('*')
        .eq('firm_id', profile.firm_id)
        .order('exported_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching export history:', error);
      toast.error('Failed to load export history');
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = [...records];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(record =>
        record.report_name.toLowerCase().includes(query) ||
        record.user_name.toLowerCase().includes(query) ||
        record.report_type.toLowerCase().includes(query)
      );
    }

    // Format filter
    if (formatFilter !== 'all') {
      filtered = filtered.filter(record => record.export_format === formatFilter);
    }

    // Report type filter
    if (reportTypeFilter !== 'all') {
      filtered = filtered.filter(record => record.report_type === reportTypeFilter);
    }

    setFilteredRecords(filtered);
  };

  const handleViewDetails = (record: ExportHistoryRecord) => {
    setSelectedRecord(record);
    setShowDetailsDialog(true);
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'CSV':
        return <FileText className="h-4 w-4" />;
      case 'Excel':
        return <FileSpreadsheet className="h-4 w-4" />;
      case 'PDF':
        return <FileDown className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatReportType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const renderFilterDetails = (filterConfig: FilterMetadata | null) => {
    if (!filterConfig) {
      return <p className="text-sm text-muted-foreground">No filters were applied</p>;
    }

    return (
      <div className="space-y-3">
        {filterConfig.dateRange && (filterConfig.dateRange.startDate || filterConfig.dateRange.endDate) && (
          <div>
            <p className="text-sm font-medium">Date Range</p>
            <p className="text-sm text-muted-foreground">
              {filterConfig.dateRange.startDate || 'Not set'} to {filterConfig.dateRange.endDate || 'Not set'}
            </p>
          </div>
        )}

        {filterConfig.selectedProjects && filterConfig.selectedProjects.length > 0 && (
          <div>
            <p className="text-sm font-medium">Projects</p>
            <p className="text-sm text-muted-foreground">{filterConfig.selectedProjects.join(', ')}</p>
          </div>
        )}

        {filterConfig.selectedCategories && filterConfig.selectedCategories.values.length > 0 && (
          <div>
            <p className="text-sm font-medium">{filterConfig.selectedCategories.label}</p>
            <p className="text-sm text-muted-foreground">{filterConfig.selectedCategories.values.join(', ')}</p>
          </div>
        )}

        {filterConfig.selectedStatus && filterConfig.selectedStatus.value !== 'all' && (
          <div>
            <p className="text-sm font-medium">{filterConfig.selectedStatus.label}</p>
            <p className="text-sm text-muted-foreground">{filterConfig.selectedStatus.value}</p>
          </div>
        )}

        {filterConfig.additionalFilters && Object.keys(filterConfig.additionalFilters).length > 0 && (
          <div>
            <p className="text-sm font-medium">Additional Filters</p>
            {Object.entries(filterConfig.additionalFilters).map(([key, value]) => (
              <p key={key} className="text-sm text-muted-foreground">
                {key}: {Array.isArray(value) ? value.join(', ') : value}
              </p>
            ))}
          </div>
        )}

        {filterConfig.presetName && (
          <div>
            <p className="text-sm font-medium">Preset Used</p>
            <p className="text-sm text-muted-foreground">{filterConfig.presetName}</p>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading export history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <div className="flex flex-col gap-8 p-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/reports')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Export History</h1>
            <p className="text-muted-foreground">
              View all report exports with applied filters and metadata
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Export History</CardTitle>
            <CardDescription>Search and filter export records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by report name, user, or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={formatFilter} onValueChange={setFormatFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Formats" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Formats</SelectItem>
                  <SelectItem value="CSV">CSV</SelectItem>
                  <SelectItem value="Excel">Excel</SelectItem>
                  <SelectItem value="PDF">PDF</SelectItem>
                </SelectContent>
              </Select>

              <Select value={reportTypeFilter} onValueChange={setReportTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Report Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Report Types</SelectItem>
                  <SelectItem value="materials_inventory">Materials Inventory</SelectItem>
                  <SelectItem value="equipment_utilization">Equipment Utilization</SelectItem>
                  <SelectItem value="safety_incident_summary">Safety Incident Summary</SelectItem>
                  <SelectItem value="budget_variance_analysis">Budget Variance Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Export History Table */}
        <Card>
          <CardHeader>
            <CardTitle>Export Records</CardTitle>
            <CardDescription>
              {filteredRecords.length} {filteredRecords.length === 1 ? 'record' : 'records'} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredRecords.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">No export records found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="pb-3 text-left text-sm font-medium">Date</th>
                      <th className="pb-3 text-left text-sm font-medium">Report Name</th>
                      <th className="pb-3 text-left text-sm font-medium">User</th>
                      <th className="pb-3 text-left text-sm font-medium">Format</th>
                      <th className="pb-3 text-left text-sm font-medium">Filters Applied</th>
                      <th className="pb-3 text-right text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record) => (
                      <tr key={record.id} className="border-b last:border-0">
                        <td className="py-3 text-sm">{formatDate(record.exported_at)}</td>
                        <td className="py-3 text-sm font-medium">{record.report_name}</td>
                        <td className="py-3 text-sm text-muted-foreground">{record.user_name}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            {getFormatIcon(record.export_format)}
                            <span className="text-sm">{record.export_format}</span>
                          </div>
                        </td>
                        <td className="py-3 text-sm text-muted-foreground">
                          {record.filter_config ? 'Yes' : 'No filters'}
                        </td>
                        <td className="py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(record)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
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

      {/* Filter Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Export Details</DialogTitle>
            <DialogDescription>
              View the complete filter configuration for this export
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium">Report Name</p>
                  <p className="text-sm text-muted-foreground">{selectedRecord.report_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Report Type</p>
                  <p className="text-sm text-muted-foreground">{formatReportType(selectedRecord.report_type)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Export Format</p>
                  <div className="flex items-center gap-2">
                    {getFormatIcon(selectedRecord.export_format)}
                    <span className="text-sm text-muted-foreground">{selectedRecord.export_format}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">Exported By</p>
                  <p className="text-sm text-muted-foreground">{selectedRecord.user_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Export Date</p>
                  <p className="text-sm text-muted-foreground">{formatDate(selectedRecord.exported_at)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-3">Applied Filters</h3>
                {renderFilterDetails(selectedRecord.filter_config)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
