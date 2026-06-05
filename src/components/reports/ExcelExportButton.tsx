import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import type { FilterMetadata } from '@/types/filterMetadata';
import { logExport } from '@/utils/exportLogger';

interface ExcelExportButtonProps {
  data: Record<string, unknown>[] | Record<string, Record<string, unknown>[]>;
  filename: string;
  sheetName?: string;
  filterMetadata?: FilterMetadata;
  reportType?: string;
  reportName?: string;
  className?: string;
}

export default function ExcelExportButton({ 
  data, 
  filename, 
  sheetName = 'Sheet1',
  filterMetadata,
  reportType,
  reportName,
  className = '' 
}: ExcelExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);

      // Create a new workbook
      const workbook = XLSX.utils.book_new();

      // Add filter summary sheet if metadata is provided
      if (filterMetadata) {
        const summaryData: Record<string, string>[] = [
          { Field: 'Report', Value: filterMetadata.reportTitle },
          { Field: 'Exported', Value: filterMetadata.exportTimestamp },
          { Field: '', Value: '' },
          { Field: 'APPLIED FILTERS', Value: '' },
        ];

        if (filterMetadata.presetName) {
          summaryData.push({ Field: 'Preset', Value: filterMetadata.presetName });
        }

        if (filterMetadata.dateRange?.startDate || filterMetadata.dateRange?.endDate) {
          const start = filterMetadata.dateRange.startDate || 'Not set';
          const end = filterMetadata.dateRange.endDate || 'Not set';
          summaryData.push({ Field: 'Date Range', Value: `${start} to ${end}` });
        }

        if (filterMetadata.selectedProjects && filterMetadata.selectedProjects.length > 0) {
          summaryData.push({ Field: 'Projects', Value: filterMetadata.selectedProjects.join(', ') });
        }

        if (filterMetadata.selectedCategories && filterMetadata.selectedCategories.values.length > 0) {
          summaryData.push({ 
            Field: filterMetadata.selectedCategories.label, 
            Value: filterMetadata.selectedCategories.values.join(', ') 
          });
        }

        if (filterMetadata.selectedStatus && filterMetadata.selectedStatus.value !== 'all') {
          summaryData.push({ 
            Field: filterMetadata.selectedStatus.label, 
            Value: filterMetadata.selectedStatus.value 
          });
        }

        if (filterMetadata.additionalFilters) {
          Object.entries(filterMetadata.additionalFilters).forEach(([key, value]) => {
            const displayValue = Array.isArray(value) ? value.join(', ') : value;
            summaryData.push({ Field: key, Value: displayValue });
          });
        }

        const summarySheet = XLSX.utils.json_to_sheet(summaryData);
        summarySheet['!cols'] = [{ wch: 20 }, { wch: 60 }];
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Filter Summary');
      }

      // Check if data is multi-sheet (object with sheet names as keys)
      if (Array.isArray(data)) {
        // Single sheet export
        const worksheet = XLSX.utils.json_to_sheet(data);
        
        // Auto-size columns
        const maxWidth = 50;
        const colWidths = Object.keys(data[0] || {}).map(key => {
          const maxLength = Math.max(
            key.length,
            ...data.map(row => String(row[key] || '').length)
          );
          return { wch: Math.min(maxLength + 2, maxWidth) };
        });
        worksheet['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      } else {
        // Multi-sheet export
        Object.entries(data).forEach(([name, sheetData]) => {
          const worksheet = XLSX.utils.json_to_sheet(sheetData);
          
          // Auto-size columns
          const maxWidth = 50;
          if (sheetData.length > 0) {
            const colWidths = Object.keys(sheetData[0]).map(key => {
              const maxLength = Math.max(
                key.length,
                ...sheetData.map(row => String(row[key] || '').length)
              );
              return { wch: Math.min(maxLength + 2, maxWidth) };
            });
            worksheet['!cols'] = colWidths;
          }

          XLSX.utils.book_append_sheet(workbook, worksheet, name);
        });
      }

      // Generate Excel file and trigger download
      XLSX.writeFile(workbook, `${filename}.xlsx`);

      // Log export to history
      if (reportType && reportName) {
        await logExport({
          reportType,
          reportName,
          exportFormat: 'Excel',
          filterMetadata,
        });
      }

      toast.success('Excel file exported successfully');
    } catch (error) {
      console.error('Excel export error:', error);
      toast.error('Failed to export Excel file');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={exporting || (Array.isArray(data) ? data.length === 0 : Object.keys(data).length === 0)}
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
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export Excel
        </>
      )}
    </Button>
  );
}
