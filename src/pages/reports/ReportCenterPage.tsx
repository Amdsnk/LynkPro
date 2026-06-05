import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Package, Wrench, Shield, DollarSign, FileText, History } from 'lucide-react';

export default function ReportCenterPage() {
  const navigate = useNavigate();

  const reportTypes = [
    {
      id: 'materials',
      title: 'Materials Inventory Report',
      description: 'Current inventory levels, consumption trends, waste analysis, and cost breakdown',
      icon: Package,
      path: '/reports/materials-inventory',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      id: 'equipment',
      title: 'Equipment Utilization Report',
      description: 'Utilization rates, usage hours, downtime analysis, and cost per hour',
      icon: Wrench,
      path: '/reports/equipment-utilization',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      id: 'safety',
      title: 'Safety Incident Summary Report',
      description: 'Incident trends, type breakdown, severity distribution, and compliance scores',
      icon: Shield,
      path: '/reports/safety-incidents',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      id: 'budget',
      title: 'Budget Variance Analysis Report',
      description: 'Budget vs actual comparison, variance by project and category, AI predictions',
      icon: DollarSign,
      path: '/reports/budget-variance',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <div className="flex flex-col gap-8 p-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Report Center</h1>
              <p className="text-muted-foreground">
                Comprehensive reports with PDF export for management review
              </p>
            </div>
          </div>
        </div>

        {/* Report Type Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <Card key={report.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${report.bgColor}`}>
                        <Icon className={`h-6 w-6 ${report.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{report.title}</CardTitle>
                        <CardDescription className="mt-2">
                          {report.description}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => navigate(report.path)}
                    className="w-full"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Report
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Export History Section */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50">
                  <History className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Export History</CardTitle>
                  <CardDescription className="mt-2">
                    View all report exports with applied filters and metadata
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate('/reports/export-history')}
              variant="outline"
              className="w-full"
            >
              <History className="mr-2 h-4 w-4" />
              View Export History
            </Button>
          </CardContent>
        </Card>

        {/* Info Section */}
        <Card>
          <CardHeader>
            <CardTitle>About Reports</CardTitle>
            <CardDescription>
              All reports include interactive charts, detailed data tables, and PDF export functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="font-semibold">Features</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Interactive charts and graphs</li>
                  <li>Customizable date ranges</li>
                  <li>Project and category filters</li>
                  <li>Real-time data updates</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Export Options</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>PDF export with company branding</li>
                  <li>Print-friendly formatting</li>
                  <li>High-resolution charts</li>
                  <li>Professional layout</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
