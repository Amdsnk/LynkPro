import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, TrendingDown, Filter } from 'lucide-react';
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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface BudgetCategory {
  id: string;
  name: string;
  budgeted_amount: number;
  project: { name: string };
}

interface ActualCost {
  cost_category_id: string;
  amount: number;
  cost_date: string;
}

export default function BudgetVarianceAnalysisReportPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [costs, setCosts] = useState<ActualCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const [projectNames, setProjectNames] = useState<Record<string, string>>({});

  // Filter state
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedCostCategories, setSelectedCostCategories] = useState<string[]>([]);
  const [selectedVarianceType, setSelectedVarianceType] = useState('all');
  const [presetRefreshTrigger, setPresetRefreshTrigger] = useState(0);

  // Cost category options
  const costCategoryOptions = [
    { label: 'Labor', value: 'labor' },
    { label: 'Materials', value: 'materials' },
    { label: 'Equipment', value: 'equipment' },
    { label: 'Subcontractors', value: 'subcontractors' },
  ];

  // Variance type options
  const varianceTypeOptions = [
    { label: 'All Variances', value: 'all' },
    { label: 'Over Budget', value: 'overrun' },
    { label: 'Under Budget', value: 'underrun' },
  ];

  useEffect(() => {
    fetchData();
  }, [profile, startDate, endDate, selectedProjects, selectedCostCategories, selectedVarianceType]);

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
      // Fetch cost categories with filters
      let categoriesQuery = supabase
        .from('cost_categories')
        .select('*, project:projects(name)')
        .eq('firm_id', profile.firm_id);

      // Apply project filter
      if (selectedProjects.length > 0) {
        categoriesQuery = categoriesQuery.in('project_id', selectedProjects);
      }

      // Apply cost category filter (assuming there's a category_type column)
      if (selectedCostCategories.length > 0) {
        categoriesQuery = categoriesQuery.in('category_type', selectedCostCategories);
      }

      const { data: categoriesData, error: categoriesError } = await categoriesQuery;

      if (categoriesError) throw categoriesError;

      // Fetch actual costs with filters
      let costsQuery = supabase
        .from('actual_costs')
        .select('*')
        .eq('firm_id', profile.firm_id);

      // Apply date range filter
      if (startDate) {
        costsQuery = costsQuery.gte('cost_date', startDate.toISOString());
      }
      if (endDate) {
        costsQuery = costsQuery.lte('cost_date', endDate.toISOString());
      }

      const { data: costsData, error: costsError } = await costsQuery;

      if (costsError) throw costsError;

      setCategories(categoriesData || []);
      setCosts(costsData || []);
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
    if (config.selectedCostCategories) setSelectedCostCategories(config.selectedCostCategories as string[]);
    if (config.selectedVarianceType) setSelectedVarianceType(config.selectedVarianceType as string);
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedProjects([]);
    setSelectedCostCategories([]);
    setSelectedVarianceType('all');
    toast.success('Filters cleared');
  };

  // Get current filter config for saving
  const currentFilterConfig = {
    startDate: startDate?.toISOString(),
    endDate: endDate?.toISOString(),
    selectedProjects,
    selectedCostCategories,
    selectedVarianceType,
  };

  // Calculate variance for each category
  let varianceData = categories.map(category => {
    const actualCosts = costs
      .filter(c => c.cost_category_id === category.id)
      .reduce((sum, c) => sum + Number(c.amount), 0);
    
    const variance = Number(category.budgeted_amount) - actualCosts;
    const variancePercent = Number(category.budgeted_amount) > 0
      ? (variance / Number(category.budgeted_amount)) * 100
      : 0;

    return {
      name: category.name,
      budgeted: Number(category.budgeted_amount),
      actual: actualCosts,
      variance,
      variancePercent,
      project: category.project?.name || 'Unknown',
    };
  });

  // Apply variance type filter
  if (selectedVarianceType === 'overrun') {
    varianceData = varianceData.filter(d => d.variance < 0);
  } else if (selectedVarianceType === 'underrun') {
    varianceData = varianceData.filter(d => d.variance >= 0);
  }

  const totalBudget = varianceData.reduce((sum, d) => sum + d.budgeted, 0);
  const totalActual = varianceData.reduce((sum, d) => sum + d.actual, 0);
  const totalVariance = totalBudget - totalActual;
  const overBudgetCount = varianceData.filter(d => d.variance < 0).length;

  // Sort by variance (most over budget first)
  const sortedVariance = [...varianceData].sort((a, b) => a.variance - b.variance);

  // Prepare export data
  const exportData = useMemo(() => varianceData.map(item => ({
    'Category': item.name,
    'Project': item.project,
    'Budgeted Amount': `$${item.budgeted.toFixed(2)}`,
    'Actual Spend': `$${item.actual.toFixed(2)}`,
    'Variance': `$${item.variance.toFixed(2)}`,
    'Variance %': `${item.variancePercent.toFixed(2)}%`,
    'Status': item.variance >= 0 ? 'Under Budget' : 'Over Budget',
  })), [varianceData]);

  // Prepare filter metadata for export
  const filterMetadata: FilterMetadata = useMemo(() => {
    const selectedProjectNames = selectedProjects.map(id => projectNames[id] || id);
    const selectedCostCategoryLabels = selectedCostCategories.map(
      cat => costCategoryOptions.find(opt => opt.value === cat)?.label || cat
    );
    const varianceTypeLabel = varianceTypeOptions.find(opt => opt.value === selectedVarianceType)?.label || selectedVarianceType;

    return {
      reportType: 'budget_variance_analysis',
      reportTitle: 'Budget Variance Analysis Report',
      exportTimestamp: new Date().toLocaleString(),
      dateRange: {
        startDate: startDate?.toLocaleDateString(),
        endDate: endDate?.toLocaleDateString(),
      },
      selectedProjects: selectedProjectNames.length > 0 ? selectedProjectNames : undefined,
      selectedCategories: selectedCostCategories.length > 0 ? {
        label: 'Cost Categories',
        values: selectedCostCategoryLabels,
      } : undefined,
      selectedStatus: selectedVarianceType !== 'all' ? {
        label: 'Variance Type',
        value: varianceTypeLabel,
      } : undefined,
    };
  }, [startDate, endDate, selectedProjects, projectNames, selectedCostCategories, selectedVarianceType]);

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
              <h1 className="text-3xl font-bold tracking-tight">Budget Variance Analysis Report</h1>
              <p className="text-muted-foreground">
                Budget vs actual comparison and variance analysis
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <CSVExportButton
              data={exportData}
              filename={`budget-variance-report-${new Date().toISOString().split('T')[0]}`}
              filterMetadata={filterMetadata}
              reportType="budget_variance_analysis"
              reportName="Budget Variance Analysis Report"
            />
            <ExcelExportButton
              data={exportData}
              filename={`budget-variance-report-${new Date().toISOString().split('T')[0]}`}
              sheetName="Budget Variance"
              filterMetadata={filterMetadata}
              reportType="budget_variance_analysis"
              reportName="Budget Variance Analysis Report"
            />
            <PDFExportButton
              contentId="budget-report-content"
              filename={`budget-variance-report-${new Date().toISOString().split('T')[0]}`}
              filterMetadata={filterMetadata}
              reportType="budget_variance_analysis"
              reportName="Budget Variance Analysis Report"
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
                reportType="budget_variance_analysis"
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
                  label="Cost Categories"
                  options={costCategoryOptions}
                  selected={selectedCostCategories}
                  onChange={setSelectedCostCategories}
                />
                <RadioButtonGroup
                  label="Variance Type"
                  options={varianceTypeOptions}
                  selected={selectedVarianceType}
                  onChange={setSelectedVarianceType}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <SaveFilterPresetDialog
                  filterConfig={currentFilterConfig}
                  reportType="budget_variance_analysis"
                  onSaved={() => setPresetRefreshTrigger(prev => prev + 1)}
                />
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        <div id="budget-report-content" className="space-y-6 bg-white p-8 rounded-lg">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Budget</CardDescription>
                <CardTitle className="text-3xl">${totalBudget.toLocaleString()}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Actual</CardDescription>
                <CardTitle className="text-3xl">${totalActual.toLocaleString()}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Variance</CardDescription>
                <CardTitle className={`text-3xl ${totalVariance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ${Math.abs(totalVariance).toLocaleString()}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Over Budget Count</CardDescription>
                <CardTitle className="text-3xl text-red-600">{overBudgetCount}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Budget vs Actual by Category</CardTitle>
              <CardDescription>Comparison of budgeted and actual costs</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={sortedVariance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={120} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="budgeted" fill="#10b981" name="Budgeted" />
                  <Bar dataKey="actual" fill="#3b82f6" name="Actual" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Variance by Category</CardTitle>
              <CardDescription>Positive values indicate under budget, negative values indicate over budget</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={sortedVariance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={120} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="variance" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detailed Variance Analysis</CardTitle>
              <CardDescription>Complete breakdown by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Category</th>
                      <th className="text-left p-2">Project</th>
                      <th className="text-right p-2">Budgeted</th>
                      <th className="text-right p-2">Actual</th>
                      <th className="text-right p-2">Variance</th>
                      <th className="text-right p-2">Variance %</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedVariance.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{item.name}</td>
                        <td className="p-2">{item.project}</td>
                        <td className="text-right p-2">${item.budgeted.toLocaleString()}</td>
                        <td className="text-right p-2">${item.actual.toLocaleString()}</td>
                        <td className={`text-right p-2 ${item.variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ${Math.abs(item.variance).toLocaleString()}
                        </td>
                        <td className={`text-right p-2 ${item.variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {item.variancePercent.toFixed(1)}%
                        </td>
                        <td className="p-2">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                            item.variance < 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                          }`}>
                            {item.variance < 0 ? (
                              <>
                                <TrendingUp className="h-3 w-3" />
                                Over Budget
                              </>
                            ) : (
                              <>
                                <TrendingDown className="h-3 w-3" />
                                Under Budget
                              </>
                            )}
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
