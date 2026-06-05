import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { FilterMetadata } from '@/types/filterMetadata';
import { logExport } from '@/utils/exportLogger';

interface PDFExportButtonProps {
  contentId: string;
  filename: string;
  title?: string;
  filterMetadata?: FilterMetadata;
  reportType?: string;
  reportName?: string;
}

export function PDFExportButton({ 
  contentId, 
  filename, 
  title,
  filterMetadata,
  reportType,
  reportName 
}: PDFExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const element = document.getElementById(contentId);
      if (!element) {
        throw new Error('Content element not found');
      }

      // Capture the content as canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      // Add image to PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if content is longer than one page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save PDF
      pdf.save(`${filename}.pdf`);

      // Log export to history
      if (reportType && reportName) {
        await logExport({
          reportType,
          reportName,
          exportFormat: 'PDF',
          filterMetadata,
        });
      }

      toast.success('Report exported successfully');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant="default"
    >
      {isExporting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <FileDown className="mr-2 h-4 w-4" />
          Export PDF
        </>
      )}
    </Button>
  );
}
