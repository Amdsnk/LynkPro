import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Papa from 'papaparse';
import type { FilterMetadata } from '@/types/filterMetadata';
import { logExport } from '@/utils/exportLogger';

interface CSVExportButtonProps {
  data: Record<string, unknown>[];
  filename: string;
  headers?: string[];
  filterMetadata?: FilterMetadata;
  reportType?: string;
  reportName?: string;
  className?: string;
}

export default function CSVExportButton({ 
  data, 
  filename, 
  headers,
  filterMetadata,
  reportType,
  reportName,
  className = '' 
}: CSVExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);

      let csvContent = '';

      // Add filter metadata section if provided
      if (filterMetadata) {
        csvContent += `${filterMetadata.reportTitle}\n`;
        csvContent += `Exported: ${filterMetadata.exportTimestamp}\n`;
        csvContent += '\n';
        
        csvContent += 'APPLIED FILTERS\n';
        csvContent += '===============\n';
        
        if (filterMetadata.presetName) {
          csvContent += `Preset: ${filterMetadata.presetName}\n`;
        }
        
        if (filterMetadata.dateRange?.startDate || filterMetadata.dateRange?.endDate) {
          const start = filterMetadata.dateRange.startDate || 'Not set';
          const end = filterMetadata.dateRange.endDate || 'Not set';
          csvContent += `Date Range: ${start} to ${end}\n`;
        }
        
        if (filterMetadata.selectedProjects && filterMetadata.selectedProjects.length > 0) {
          csvContent += `Projects: ${filterMetadata.selectedProjects.join(', ')}\n`;
        }
        
        if (filterMetadata.selectedCategories && filterMetadata.selectedCategories.values.length > 0) {
          csvContent += `${filterMetadata.selectedCategories.label}: ${filterMetadata.selectedCategories.values.join(', ')}\n`;
        }
        
        if (filterMetadata.selectedStatus && filterMetadata.selectedStatus.value !== 'all') {
          csvContent += `${filterMetadata.selectedStatus.label}: ${filterMetadata.selectedStatus.value}\n`;
        }
        
        if (filterMetadata.additionalFilters) {
          Object.entries(filterMetadata.additionalFilters).forEach(([key, value]) => {
            const displayValue = Array.isArray(value) ? value.join(', ') : value;
            csvContent += `${key}: ${displayValue}\n`;
          });
        }
        
        csvContent += '\n';
        csvContent += 'REPORT DATA\n';
        csvContent += '===========\n';
      }

      // Generate CSV using papaparse
      const csv = Papa.unparse(data, {
        header: true,
        columns: headers,
      });

      csvContent += csv;

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Log export to history
      if (reportType && reportName) {
        await logExport({
          reportType,
          reportName,
          exportFormat: 'CSV',
          filterMetadata,
        });
      }

      toast.success('CSV exported successfully');
    } catch (error) {
      console.error('CSV export error:', error);
      toast.error('Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={exporting || data.length === 0}
      variant="outline"
      className={className}
    >
      {exporting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <FileDown className="mr-2 h-4 w-4" />
          Export CSV
        </>
      )}
    </Button>
  );
}
