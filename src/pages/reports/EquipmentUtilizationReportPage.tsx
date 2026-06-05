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

interface Equipment {
  id: string;
  name: string;
  equipment_type: string;
  status: string;
  purchase_cost: number;
}

interface EquipmentUsage {
  equipment_id: string;
  start_time: string;
  end_time: string | null;
  fuel_consumed: number | null;
  equipment: { name: string };
}

export default function EquipmentUtilizationReportPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [usage, setUsage] = useState<EquipmentUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const [projectNames, setProjectNames] = useState<Record<string, string>>({});

  // Filter state
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedEquipmentTypes, setSelectedEquipmentTypes] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [presetRefreshTrigger, setPresetRefreshTrigger] = useState(0);

  // Equipment type options
  const equipmentTypeOptions = [
    { label: 'Excavator', value: 'excavator' },
    { label: 'Crane', value: 'crane' },
    { label: 'Bulldozer', value: 'bulldozer' },
    { label: 'Loader', value: 'loader' },
    { label: 'Truck', value: 'truck' },
    { label: 'Generator', value: 'generator' },
    { label: 'Compressor', value: 'compressor' },
    { label: 'Forklift', value: 'forklift' },
    { label: 'Mixer', value: 'mixer' },
    { label: 'Pump', value: 'pump' },
  ];

  // Status options
  const statusOptions = [
    { label: 'All Statuses', value: 'all' },
    { label: 'Available', value: 'available' },
    { label: 'In Use', value: 'in_use' },
    { label: 'Maintenance', value: 'maintenance' },
    { label: 'Out of Service', value: 'out_of_service' },
  ];

  useEffect(() => {
    fetchData();
  }, [profile, startDate, endDate, selectedProjects, selectedEquipmentTypes, selectedStatus]);

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
      // Fetch equipment with filters
      let equipmentQuery = supabase
        .from('equipment')
        .select('*')
        .eq('firm_id', profile.firm_id);

      // Apply project filter
      if (selectedProjects.length > 0) {
        equipmentQuery = equipmentQuery.in('project_id', selectedProjects);
      }

      // Apply equipment type filter
      if (selectedEquipmentTypes.length > 0) {
        equipmentQuery = equipmentQuery.in('equipment_type', selectedEquipmentTypes);
      }

      // Apply status filter
      if (selectedStatus !== 'all') {
        equipmentQuery = equipmentQuery.eq('status', selectedStatus);
      }

      const { data: equipmentData, error: equipmentError } = await equipmentQuery;

      if (equipmentError) throw equipmentError;

      // Fetch usage data with filters
      let usageQuery = supabase
        .from('equipment_usage')
        .select('*, equipment:equipment(name)')
        .eq('firm_id', profile.firm_id)
        .not('end_time', 'is', null);

      // Apply date range filter
      if (startDate) {
        usageQuery = usageQuery.gte('start_time', startDate.toISOString());
      }
      if (endDate) {
        usageQuery = usageQuery.lte('end_time', endDate.toISOString());
      }

      const { data: usageData, error: usageError } = await usageQuery;

      if (usageError) throw usageError;

      setEquipment(equipmentData || []);
      setUsage(usageData || []);
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
    if (config.selectedEquipmentTypes) setSelectedEquipmentTypes(config.selectedEquipmentTypes as string[]);
    if (config.selectedStatus) setSelectedStatus(config.selectedStatus as string);
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedProjects([]);
    setSelectedEquipmentTypes([]);
    setSelectedStatus('all');
    toast.success('Filters cleared');
  };

  // Get current filter config for saving
  const currentFilterConfig = {
    startDate: startDate?.toISOString(),
    endDate: endDate?.toISOString(),
    selectedProjects,
    selectedEquipmentTypes,
    selectedStatus,
  };

  const totalEquipment = equipment.length;
  const availableCount = equipment.filter(e => e.status === 'available').length;
  const inUseCount = equipment.filter(e => e.status === 'in_use').length;
  const maintenanceCount = equipment.filter(e => e.status === 'maintenance').length;

  const statusData = [
    { name: 'Available', value: availableCount, color: '#10b981' },
    { name: 'In Use', value: inUseCount, color: '#3b82f6' },
    { name: 'Maintenance', value: maintenanceCount, color: '#f59e0b' },
    { name: 'Out of Service', value: equipment.filter(e => e.status === 'out_of_service').length, color: '#ef4444' },
  ];

  // Calculate usage hours per equipment
  const usageByEquipment = usage.reduce((acc, item) => {
    const equipmentName = item.equipment?.name || 'Unknown';
    const hours = item.end_time && item.start_time
      ? (new Date(item.end_time).getTime() - new Date(item.start_time).getTime()) / (1000 * 60 * 60)
      : 0;
    acc[equipmentName] = (acc[equipmentName] || 0) + hours;
    return acc;
  }, {} as Record<string, number>);

  const usageData = Object.entries(usageByEquipment)
    .map(([name, hours]) => ({ name, hours: Number(hours.toFixed(2)) }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 10);

  // Prepare export data
  const exportData = useMemo(() => equipment.map(eq => {
    const totalHours = usageByEquipment[eq.name] || 0;
    return {
      'Equipment Name': eq.name,
      'Type': eq.equipment_type,
      'Status': eq.status,
      'Purchase Cost': `$${eq.purchase_cost.toFixed(2)}`,
      'Total Usage Hours': totalHours.toFixed(2),
    };
  }), [equipment, usageByEquipment]);

  // Prepare filter metadata for export
  const filterMetadata: FilterMetadata = useMemo(() => {
    const selectedProjectNames = selectedProjects.map(id => projectNames[id] || id);
    const selectedEquipmentTypeLabels = selectedEquipmentTypes.map(
      type => equipmentTypeOptions.find(opt => opt.value === type)?.label || type
    );
    const statusLabel = statusOptions.find(opt => opt.value === selectedStatus)?.label || selectedStatus;

    return {
      reportType: 'equipment_utilization',
      reportTitle: 'Equipment Utilization Report',
      exportTimestamp: new Date().toLocaleString(),
      dateRange: {
        startDate: startDate?.toLocaleDateString(),
        endDate: endDate?.toLocaleDateString(),
      },
      selectedProjects: selectedProjectNames.length > 0 ? selectedProjectNames : undefined,
      selectedCategories: selectedEquipmentTypes.length > 0 ? {
        label: 'Equipment Types',
        values: selectedEquipmentTypeLabels,
      } : undefined,
      selectedStatus: selectedStatus !== 'all' ? {
        label: 'Status',
        value: statusLabel,
      } : undefined,
    };
  }, [startDate, endDate, selectedProjects, projectNames, selectedEquipmentTypes, selectedStatus]);

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
              <h1 className="text-3xl font-bold tracking-tight">Equipment Utilization Report</h1>
              <p className="text-muted-foreground">
                Utilization rates, usage hours, and equipment status analysis
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <CSVExportButton
              data={exportData}
              filename={`equipment-utilization-report-${new Date().toISOString().split('T')[0]}`}
              filterMetadata={filterMetadata}
              reportType="equipment_utilization"
              reportName="Equipment Utilization Report"
            />
            <ExcelExportButton
              data={exportData}
              filename={`equipment-utilization-report-${new Date().toISOString().split('T')[0]}`}
              sheetName="Equipment Utilization"
              filterMetadata={filterMetadata}
              reportType="equipment_utilization"
              reportName="Equipment Utilization Report"
            />
            <PDFExportButton
              contentId="equipment-report-content"
              filename={`equipment-utilization-report-${new Date().toISOString().split('T')[0]}`}
              filterMetadata={filterMetadata}
              reportType="equipment_utilization"
              reportName="Equipment Utilization Report"
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
                reportType="equipment_utilization"
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
              <div className="grid gap-4 md:grid-cols-2">
                <CheckboxGroup
                  label="Equipment Types"
                  options={equipmentTypeOptions}
                  selected={selectedEquipmentTypes}
                  onChange={setSelectedEquipmentTypes}
                />
                <RadioButtonGroup
                  label="Status"
                  options={statusOptions}
                  selected={selectedStatus}
                  onChange={setSelectedStatus}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <SaveFilterPresetDialog
                  filterConfig={currentFilterConfig}
                  reportType="equipment_utilization"
                  onSaved={() => setPresetRefreshTrigger(prev => prev + 1)}
                />
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        <div id="equipment-report-content" className="space-y-6 bg-white p-8 rounded-lg">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Equipment</CardDescription>
                <CardTitle className="text-3xl">{totalEquipment}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Available</CardDescription>
                <CardTitle className="text-3xl text-green-600">{availableCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>In Use</CardDescription>
                <CardTitle className="text-3xl text-blue-600">{inUseCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Maintenance</CardDescription>
                <CardTitle className="text-3xl text-orange-600">{maintenanceCount}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Equipment Status Distribution</CardTitle>
                <CardDescription>Current equipment status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
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
                <CardTitle>Top 10 Equipment by Usage Hours</CardTitle>
                <CardDescription>Most utilized equipment</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={usageData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} />
                    <Tooltip />
                    <Bar dataKey="hours" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Equipment Inventory</CardTitle>
              <CardDescription>Complete equipment list with status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Equipment Name</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Purchase Cost</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipment.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="p-2">{item.name}</td>
                        <td className="p-2">{item.equipment_type}</td>
                        <td className="p-2">${item.purchase_cost.toLocaleString()}</td>
                        <td className="p-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            item.status === 'available' ? 'bg-green-50 text-green-700' :
                            item.status === 'in_use' ? 'bg-blue-50 text-blue-700' :
                            item.status === 'maintenance' ? 'bg-orange-50 text-orange-700' :
                            'bg-red-50 text-red-700'
                          }`}>
                            {item.status.replace('_', ' ')}
                          </span>
                        </td>
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
