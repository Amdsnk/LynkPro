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

interface Material {
  id: string;
  name: string;
  unit: string;
  current_quantity: number;
  min_quantity: number;
  unit_cost: number;
  status: string;
}

interface MaterialConsumption {
  material_id: string;
  quantity: number;
  consumed_date: string;
  material: { name: string };
}

export default function MaterialsInventoryReportPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [consumption, setConsumption] = useState<MaterialConsumption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const [projectNames, setProjectNames] = useState<Record<string, string>>({});

  // Filter state
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedMaterialTypes, setSelectedMaterialTypes] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [presetRefreshTrigger, setPresetRefreshTrigger] = useState(0);

  // Material type options (common construction materials)
  const materialTypeOptions = [
    { label: 'Concrete', value: 'concrete' },
    { label: 'Steel', value: 'steel' },
    { label: 'Lumber', value: 'lumber' },
    { label: 'Electrical', value: 'electrical' },
    { label: 'Plumbing', value: 'plumbing' },
    { label: 'Drywall', value: 'drywall' },
    { label: 'Insulation', value: 'insulation' },
    { label: 'Roofing', value: 'roofing' },
    { label: 'Paint', value: 'paint' },
    { label: 'Hardware', value: 'hardware' },
  ];

  // Status options
  const statusOptions = [
    { label: 'All Statuses', value: 'all' },
    { label: 'In Stock', value: 'in_stock' },
    { label: 'Low Stock', value: 'low_stock' },
    { label: 'Out of Stock', value: 'out_of_stock' },
  ];

  useEffect(() => {
    fetchData();
  }, [profile, startDate, endDate, selectedProjects, selectedMaterialTypes, selectedStatus]);

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
      // Fetch materials with filters
      let materialsQuery = supabase
        .from('materials')
        .select('*')
        .eq('firm_id', profile.firm_id);

      // Apply project filter
      if (selectedProjects.length > 0) {
        materialsQuery = materialsQuery.in('project_id', selectedProjects);
      }

      // Apply material type filter (assuming there's a material_type column)
      if (selectedMaterialTypes.length > 0) {
        materialsQuery = materialsQuery.in('material_type', selectedMaterialTypes);
      }

      // Apply status filter
      if (selectedStatus !== 'all') {
        materialsQuery = materialsQuery.eq('status', selectedStatus);
      }

      materialsQuery = materialsQuery.order('name');

      const { data: materialsData, error: materialsError } = await materialsQuery;

      if (materialsError) throw materialsError;

      // Fetch consumption data with filters
      let consumptionQuery = supabase
        .from('material_consumption')
        .select('*, material:materials(name)')
        .eq('firm_id', profile.firm_id);

      // Apply date range filter
      if (startDate) {
        consumptionQuery = consumptionQuery.gte('consumed_date', startDate.toISOString());
      }
      if (endDate) {
        consumptionQuery = consumptionQuery.lte('consumed_date', endDate.toISOString());
      }

      consumptionQuery = consumptionQuery.order('consumed_date', { ascending: true });

      const { data: consumptionData, error: consumptionError } = await consumptionQuery;

      if (consumptionError) throw consumptionError;

      setMaterials(materialsData || []);
      setConsumption(consumptionData || []);
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
    if (config.selectedMaterialTypes) setSelectedMaterialTypes(config.selectedMaterialTypes as string[]);
    if (config.selectedStatus) setSelectedStatus(config.selectedStatus as string);
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedProjects([]);
    setSelectedMaterialTypes([]);
    setSelectedStatus('all');
    toast.success('Filters cleared');
  };

  // Get current filter config for saving
  const currentFilterConfig = {
    startDate: startDate?.toISOString(),
    endDate: endDate?.toISOString(),
    selectedProjects,
    selectedMaterialTypes,
    selectedStatus,
  };

  // Calculate metrics
  const totalMaterials = materials.length;
  const lowStockCount = materials.filter(m => m.status === 'low_stock').length;
  const outOfStockCount = materials.filter(m => m.status === 'out_of_stock').length;
  const totalValue = materials.reduce((sum, m) => sum + (m.current_quantity * m.unit_cost), 0);

  // Prepare chart data
  const statusData = [
    { name: 'In Stock', value: materials.filter(m => m.status === 'in_stock').length, color: '#10b981' },
    { name: 'Low Stock', value: lowStockCount, color: '#f59e0b' },
    { name: 'Out of Stock', value: outOfStockCount, color: '#ef4444' },
  ];

  // Top 10 consumed materials
  const consumptionByMaterial = consumption.reduce((acc, item) => {
    const materialName = item.material?.name || 'Unknown';
    acc[materialName] = (acc[materialName] || 0) + Number(item.quantity);
    return acc;
  }, {} as Record<string, number>);

  const top10Consumed = Object.entries(consumptionByMaterial)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  // Consumption trends (last 30 days)
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);

  const consumptionTrends = consumption
    .filter(c => new Date(c.consumed_date) >= last30Days)
    .reduce((acc, item) => {
      const date = new Date(item.consumed_date).toLocaleDateString();
      acc[date] = (acc[date] || 0) + Number(item.quantity);
      return acc;
    }, {} as Record<string, number>);

  const trendData = Object.entries(consumptionTrends)
    .map(([date, quantity]) => ({ date, quantity }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Prepare export data
  const exportData = useMemo(() => materials.map(material => ({
    'Material Name': material.name,
    'Unit': material.unit,
    'Current Quantity': material.current_quantity,
    'Minimum Quantity': material.min_quantity,
    'Unit Cost': `$${material.unit_cost.toFixed(2)}`,
    'Total Value': `$${(material.current_quantity * material.unit_cost).toFixed(2)}`,
    'Status': material.status,
  })), [materials]);

  // Prepare filter metadata for export
  const filterMetadata: FilterMetadata = useMemo(() => {
    const selectedProjectNames = selectedProjects.map(id => projectNames[id] || id);
    const selectedMaterialTypeLabels = selectedMaterialTypes.map(
      type => materialTypeOptions.find(opt => opt.value === type)?.label || type
    );
    const statusLabel = statusOptions.find(opt => opt.value === selectedStatus)?.label || selectedStatus;

    return {
      reportType: 'materials_inventory',
      reportTitle: 'Materials Inventory Report',
      exportTimestamp: new Date().toLocaleString(),
      dateRange: {
        startDate: startDate?.toLocaleDateString(),
        endDate: endDate?.toLocaleDateString(),
      },
      selectedProjects: selectedProjectNames.length > 0 ? selectedProjectNames : undefined,
      selectedCategories: selectedMaterialTypes.length > 0 ? {
        label: 'Material Types',
        values: selectedMaterialTypeLabels,
      } : undefined,
      selectedStatus: selectedStatus !== 'all' ? {
        label: 'Status',
        value: statusLabel,
      } : undefined,
    };
  }, [startDate, endDate, selectedProjects, projectNames, selectedMaterialTypes, selectedStatus]);

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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/reports')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Materials Inventory Report</h1>
              <p className="text-muted-foreground">
                Current inventory levels, consumption trends, and cost analysis
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <CSVExportButton
              data={exportData}
              filename={`materials-inventory-report-${new Date().toISOString().split('T')[0]}`}
              filterMetadata={filterMetadata}
              reportType="materials_inventory"
              reportName="Materials Inventory Report"
            />
            <ExcelExportButton
              data={exportData}
              filename={`materials-inventory-report-${new Date().toISOString().split('T')[0]}`}
              sheetName="Materials Inventory"
              filterMetadata={filterMetadata}
              reportType="materials_inventory"
              reportName="Materials Inventory Report"
            />
            <PDFExportButton
              contentId="materials-report-content"
              filename={`materials-inventory-report-${new Date().toISOString().split('T')[0]}`}
              title="Materials Inventory Report"
              filterMetadata={filterMetadata}
              reportType="materials_inventory"
              reportName="Materials Inventory Report"
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
                reportType="materials_inventory"
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
                  label="Material Types"
                  options={materialTypeOptions}
                  selected={selectedMaterialTypes}
                  onChange={setSelectedMaterialTypes}
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
                  reportType="materials_inventory"
                  onSaved={() => setPresetRefreshTrigger(prev => prev + 1)}
                />
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Report Content */}
        <div id="materials-report-content" className="space-y-6 bg-white p-8 rounded-lg">
          {/* Summary Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Materials</CardDescription>
                <CardTitle className="text-3xl">{totalMaterials}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Low Stock Alerts</CardDescription>
                <CardTitle className="text-3xl text-orange-600">{lowStockCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Out of Stock</CardDescription>
                <CardTitle className="text-3xl text-red-600">{outOfStockCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Value</CardDescription>
                <CardTitle className="text-3xl">${totalValue.toLocaleString()}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Stock Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Stock Status Distribution</CardTitle>
                <CardDescription>Current inventory status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top 10 Consumed Materials */}
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Consumed Materials</CardTitle>
                <CardDescription>Most used materials by quantity</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={top10Consumed} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} />
                    <Tooltip />
                    <Bar dataKey="quantity" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Consumption Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Consumption Trends (Last 30 Days)</CardTitle>
              <CardDescription>Daily material consumption over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="quantity" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Materials Table */}
          <Card>
            <CardHeader>
              <CardTitle>Current Inventory Levels</CardTitle>
              <CardDescription>Detailed material inventory status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Material Name</th>
                      <th className="text-left p-2">Current Qty</th>
                      <th className="text-left p-2">Min Qty</th>
                      <th className="text-left p-2">Unit</th>
                      <th className="text-left p-2">Unit Cost</th>
                      <th className="text-left p-2">Total Value</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((material) => (
                      <tr key={material.id} className="border-b">
                        <td className="p-2">{material.name}</td>
                        <td className="p-2">{material.current_quantity}</td>
                        <td className="p-2">{material.min_quantity}</td>
                        <td className="p-2">{material.unit}</td>
                        <td className="p-2">${material.unit_cost.toFixed(2)}</td>
                        <td className="p-2">${(material.current_quantity * material.unit_cost).toFixed(2)}</td>
                        <td className="p-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            material.status === 'in_stock' ? 'bg-green-50 text-green-700' :
                            material.status === 'low_stock' ? 'bg-orange-50 text-orange-700' :
                            'bg-red-50 text-red-700'
                          }`}>
                            {material.status.replace('_', ' ')}
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
