import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { exportToCSV, exportToExcel, exportToPDF, type ExportData } from '@/lib/exportAnalytics';
import { EmailExportDialog } from './EmailExportDialog';

interface ExportButtonProps {
  data: ExportData;
  chartIds: string[];
}

export function ExportButton({ data, chartIds }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<string | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    setExporting(true);
    setExportFormat(format);

    try {
      switch (format) {
        case 'csv':
          await exportToCSV(data);
          toast.success('CSV file downloaded successfully');
          break;
        case 'excel':
          await exportToExcel(data);
          toast.success('Excel file downloaded successfully');
          break;
        case 'pdf':
          toast.info('Generating PDF report...', { duration: 2000 });
          await exportToPDF(data, chartIds);
          toast.success('PDF report downloaded successfully');
          break;
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to export ${format.toUpperCase()}`);
    } finally {
      setExporting(false);
      setExportFormat(null);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={exporting}
            className="transition-smooth"
          >
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting {exportFormat?.toUpperCase()}...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={() => setEmailDialogOpen(true)}
            disabled={exporting}
            className="cursor-pointer"
          >
            <Mail className="h-4 w-4 mr-2" />
            Email Report
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => handleExport('pdf')}
            disabled={exporting}
            className="cursor-pointer"
          >
            <FileText className="h-4 w-4 mr-2" />
            Export as PDF
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="cursor-pointer"
          >
            <FileText className="h-4 w-4 mr-2" />
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleExport('excel')}
            disabled={exporting}
            className="cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export as Excel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EmailExportDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        data={data}
      />
    </>
  );
}
