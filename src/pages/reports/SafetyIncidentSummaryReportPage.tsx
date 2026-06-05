import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { PDFExportButton } from '@/components/reports/PDFExportButton';
import CSVExportButton from '@/components/reports/CSVExportButton';
import ExcelExportButton from '@/components/reports/ExcelExportButton';
import DateRangePicker from '@/components/reports/filters/DateRangePicker';
import ProjectMultiSelect from '@/components/reports/filters/ProjectMultiSelect';
import CheckboxGroup from '@/components/reports/filters/CheckboxGroup';
import RadioButtonGroup from '@/components/reports/filters/RadioButtonGroup';
import SaveFilterPresetDialog from '@/components/reports/filters/SaveFilterPresetDialog';
import FilterPresetSelector from '@/components/reports/filters/FilterPresetSelector';
import type { FilterMetadata } from '@/types/filterMetadata';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface SafetyIncident {
  id: string;
  incident_type: string;
  severity: string;
  incident_date: string;
  location: string;
  description: string;
  investigation_status: string;
}

export default function SafetyIncidentSummaryReportPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [incidents, setIncidents] = useState<SafetyIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const [projectNames, setProjectNames] = useState<Record<string, string>>({});

  // Filter state
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedIncidentTypes, setSelectedIncidentTypes] = useState<string[]>([]);
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([]);
  const [selectedInvestigationStatus, setSelectedInvestigationStatus] = useState('all');
  const [presetRefreshTrigger, setPresetRefreshTrigger] = useState(0);

  // Incident type options
  const incidentTypeOptions = [
    { label: 'Injury', value: 'injury' },
    { label: 'Near Miss', value: 'near_miss' },
    { label: 'Property Damage', value: 'property_damage' },
    { label: 'Environmental', value: 'environmental' },
  ];

  // Severity options
  const severityOptions = [
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
    { label: 'Critical', value: 'critical' },
  ];

  // Investigation status options
  const investigationStatusOptions = [
    { label: 'All Statuses', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Completed', value: 'completed' },
  ];

  useEffect(() => {
    fetchData();
  }, [profile, startDate, endDate, selectedProjects, selectedIncidentTypes, selectedSeverities, selectedInvestigationStatus]);

  // Fetch project names for selected projects
  useEffect(() => {
    const fetchProjectNames = async () => {
      if (!profile?.firm_id || selectedProjects.length === 0) {
        setProjectNames({});
        return;
      }

      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name')
          .eq('firm_id', profile.firm_id)
          .in('id', selectedProjects);

        if (error) throw error;

        const namesMap = (data || []).reduce((acc, project) => {
          acc[project.id] = project.name;
          return acc;
        }, {} as Record<string, string>);

        setProjectNames(namesMap);
      } catch (error) {
        console.error('Error fetching project names:', error);
      }
    };

    fetchProjectNames();
  }, [profile, selectedProjects]);

  const fetchData = async () => {
    if (!profile?.firm_id) return;

    try {
      let query = supabase
        .from('safety_incidents')
        .select('*')
        .eq('firm_id', profile.firm_id);

      // Apply date range filter
      if (startDate) {
        query = query.gte('incident_date', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('incident_date', endDate.toISOString());
      }

      // Apply project filter
      if (selectedProjects.length > 0) {
        query = query.in('project_id', selectedProjects);
      }

      // Apply incident type filter
      if (selectedIncidentTypes.length > 0) {
        query = query.in('incident_type', selectedIncidentTypes);
      }

      // Apply severity filter
      if (selectedSeverities.length > 0) {
        query = query.in('severity', selectedSeverities);
      }

      // Apply investigation status filter
      if (selectedInvestigationStatus !== 'all') {
        query = query.eq('investigation_status', selectedInvestigationStatus);
      }

      query = query.order('incident_date', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setIncidents(data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  // Handle apply preset
  const handleApplyPreset = (config: Record<string, unknown>) => {
    if (config.startDate) setStartDate(new Date(config.startDate as string));
    if (config.endDate) setEndDate(new Date(config.endDate as string));
    if (config.selectedProjects) setSelectedProjects(config.selectedProjects as string[]);
    if (config.selectedIncidentTypes) setSelectedIncidentTypes(config.selectedIncidentTypes as string[]);
    if (config.selectedSeverities) setSelectedSeverities(config.selectedSeverities as string[]);
    if (config.selectedInvestigationStatus) setSelectedInvestigationStatus(config.selectedInvestigationStatus as string);
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedProjects([]);
    setSelectedIncidentTypes([]);
    setSelectedSeverities([]);
    setSelectedInvestigationStatus('all');
    toast.success('Filters cleared');
  };

  // Get current filter config for saving
  const currentFilterConfig = {
    startDate: startDate?.toISOString(),
    endDate: endDate?.toISOString(),
    selectedProjects,
    selectedIncidentTypes,
    selectedSeverities,
    selectedInvestigationStatus,
  };

  const totalIncidents = incidents.length;
  const criticalCount = incidents.filter(i => i.severity === 'critical' || i.severity === 'high').length;
  const pendingInvestigations = incidents.filter(i => i.investigation_status === 'pending').length;

  const typeData = [
    { name: 'Injury', value: incidents.filter(i => i.incident_type === 'injury').length, color: '#ef4444' },
    { name: 'Near Miss', value: incidents.filter(i => i.incident_type === 'near_miss').length, color: '#f59e0b' },
    { name: 'Property Damage', value: incidents.filter(i => i.incident_type === 'property_damage').length, color: '#3b82f6' },
    { name: 'Environmental', value: incidents.filter(i => i.incident_type === 'environmental').length, color: '#10b981' },
  ];

  const severityData = [
    { name: 'Critical', value: incidents.filter(i => i.severity === 'critical').length, color: '#dc2626' },
    { name: 'High', value: incidents.filter(i => i.severity === 'high').length, color: '#ef4444' },
    { name: 'Medium', value: incidents.filter(i => i.severity === 'medium').length, color: '#f59e0b' },
    { name: 'Low', value: incidents.filter(i => i.severity === 'low').length, color: '#10b981' },
  ];

  // Incident trends (last 30 days)
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);

  const trendData = incidents
    .filter(i => new Date(i.incident_date) >= last30Days)
    .reduce((acc, item) => {
      const date = new Date(item.incident_date).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const trendChartData = Object.entries(trendData)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Prepare export data
  const exportData = useMemo(() => incidents.map(incident => ({
    'Date': new Date(incident.incident_date).toLocaleDateString(),
    'Type': incident.incident_type,
    'Severity': incident.severity,
    'Location': incident.location,
    'Description': incident.description,
    'Investigation Status': incident.investigation_status,
  })), [incidents]);

  // Prepare filter metadata for export
  const filterMetadata: FilterMetadata = useMemo(() => {
    const selectedProjectNames = selectedProjects.map(id => projectNames[id] || id);
    const selectedIncidentTypeLabels = selectedIncidentTypes.map(
      type => incidentTypeOptions.find(opt => opt.value === type)?.label || type
    );
    const selectedSeverityLabels = selectedSeverities.map(
      severity => severityOptions.find(opt => opt.value === severity)?.label || severity
    );
    const investigationStatusLabel = investigationStatusOptions.find(opt => opt.value === selectedInvestigationStatus)?.label || selectedInvestigationStatus;

    return {
      reportType: 'safety_incident_summary',
      reportTitle: 'Safety Incident Summary Report',
      exportTimestamp: new Date().toLocaleString(),
      dateRange: {
        startDate: startDate?.toLocaleDateString(),
        endDate: endDate?.toLocaleDateString(),
      },
      selectedProjects: selectedProjectNames.length > 0 ? selectedProjectNames : undefined,
      selectedCategories: selectedIncidentTypes.length > 0 ? {
        label: 'Incident Types',
        values: selectedIncidentTypeLabels,
      } : undefined,
      selectedStatus: selectedInvestigationStatus !== 'all' ? {
        label: 'Investigation Status',
        value: investigationStatusLabel,
      } : undefined,
      additionalFilters: selectedSeverities.length > 0 ? {
        'Severity': selectedSeverityLabels,
      } : undefined,
    };
  }, [startDate, endDate, selectedProjects, projectNames, selectedIncidentTypes, selectedSeverities, selectedInvestigationStatus]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading report data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <div className="flex flex-col gap-8 p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/reports')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Safety Incident Summary Report</h1>
              <p className="text-muted-foreground">
                Incident trends, type breakdown, and compliance analysis
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <CSVExportButton
              data={exportData}
              filename={`safety-incident-report-${new Date().toISOString().split('T')[0]}`}
              filterMetadata={filterMetadata}
              reportType="safety_incident_summary"
              reportName="Safety Incident Summary Report"
            />
            <ExcelExportButton
              data={exportData}
              filename={`safety-incident-report-${new Date().toISOString().split('T')[0]}`}
              sheetName="Safety Incidents"
              filterMetadata={filterMetadata}
              reportType="safety_incident_summary"
              reportName="Safety Incident Summary Report"
            />
            <PDFExportButton
              contentId="safety-report-content"
              filename={`safety-incident-report-${new Date().toISOString().split('T')[0]}`}
              filterMetadata={filterMetadata}
              reportType="safety_incident_summary"
              reportName="Safety Incident Summary Report"
            />
          </div>
        </div>

        {/* Filter Panel */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'Hide' : 'Show'}
              </Button>
            </div>
          </CardHeader>
          {showFilters && (
            <CardContent className="space-y-4">
              <FilterPresetSelector
                reportType="safety_incident_summary"
                onPresetApply={handleApplyPreset}
                refreshTrigger={presetRefreshTrigger}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <DateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                />
                <ProjectMultiSelect
                  selectedProjects={selectedProjects}
                  onProjectsChange={setSelectedProjects}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <CheckboxGroup
                  label="Incident Types"
                  options={incidentTypeOptions}
                  selected={selectedIncidentTypes}
                  onChange={setSelectedIncidentTypes}
                />
                <CheckboxGroup
                  label="Severity"
                  options={severityOptions}
                  selected={selectedSeverities}
                  onChange={setSelectedSeverities}
                />
                <RadioButtonGroup
                  label="Investigation Status"
                  options={investigationStatusOptions}
                  selected={selectedInvestigationStatus}
                  onChange={setSelectedInvestigationStatus}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <SaveFilterPresetDialog
                  filterConfig={currentFilterConfig}
                  reportType="safety_incident_summary"
                  onSaved={() => setPresetRefreshTrigger(prev => prev + 1)}
                />
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        <div id="safety-report-content" className="space-y-6 bg-white p-8 rounded-lg">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Incidents</CardDescription>
                <CardTitle className="text-3xl">{totalIncidents}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Critical/High Severity</CardDescription>
                <CardTitle className="text-3xl text-red-600">{criticalCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Pending Investigations</CardDescription>
                <CardTitle className="text-3xl text-orange-600">{pendingInvestigations}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Incident Type Breakdown</CardTitle>
                <CardDescription>Distribution by incident type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={typeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {typeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Severity Distribution</CardTitle>
                <CardDescription>Incidents by severity level</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={severityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Incident Trends (Last 30 Days)</CardTitle>
              <CardDescription>Daily incident count over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Incidents</CardTitle>
              <CardDescription>Latest safety incidents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Severity</th>
                      <th className="text-left p-2">Location</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidents.slice(0, 10).map((incident) => (
                      <tr key={incident.id} className="border-b">
                        <td className="p-2">{new Date(incident.incident_date).toLocaleDateString()}</td>
                        <td className="p-2">{incident.incident_type.replace('_', ' ')}</td>
                        <td className="p-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            incident.severity === 'critical' ? 'bg-red-100 text-red-700' :
                            incident.severity === 'high' ? 'bg-red-50 text-red-600' :
                            incident.severity === 'medium' ? 'bg-orange-50 text-orange-700' :
                            'bg-green-50 text-green-700'
                          }`}>
                            {incident.severity}
                          </span>
                        </td>
                        <td className="p-2">{incident.location}</td>
                        <td className="p-2">{incident.investigation_status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
