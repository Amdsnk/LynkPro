import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import type { FileShare, ShareAccessLog, File as ProjectFile } from '@/types/types';
import { format } from 'date-fns';

export interface ExportData {
  shares: FileShare[];
  logs: ShareAccessLog[];
  files: ProjectFile[];
  metrics: {
    totalShares: number;
    activeShares: number;
    expiredShares: number;
    totalViews: number;
    totalDownloads: number;
    avgViewsPerShare: number;
    downloadRate: number;
  };
  dateRange: { from: Date; to: Date } | null;
}

// Export to CSV
export async function exportToCSV(data: ExportData): Promise<void> {
  const { shares, logs, metrics, dateRange } = data;

  // Create CSV content
  let csv = 'LynkPro Share Analytics Export\n';
  csv += `Export Date: ${format(new Date(), 'MMM d, yyyy HH:mm')}\n`;
  if (dateRange) {
    csv += `Date Range: ${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}\n`;
  } else {
    csv += 'Date Range: All Time\n';
  }
  csv += '\n';

  // Metrics section
  csv += 'SUMMARY METRICS\n';
  csv += 'Metric,Value\n';
  csv += `Total Shares,${metrics.totalShares}\n`;
  csv += `Active Shares,${metrics.activeShares}\n`;
  csv += `Expired Shares,${metrics.expiredShares}\n`;
  csv += `Total Views,${metrics.totalViews}\n`;
  csv += `Total Downloads,${metrics.totalDownloads}\n`;
  csv += `Average Views per Share,${metrics.avgViewsPerShare.toFixed(2)}\n`;
  csv += `Download Conversion Rate,${metrics.downloadRate.toFixed(2)}%\n`;
  csv += '\n';

  // Shares section
  csv += 'SHARES\n';
  csv += 'ID,Created At,Shared With,Expires At,Permission,View Count,Status\n';
  shares.forEach(share => {
    const status = share.expires_at && new Date(share.expires_at) < new Date() ? 'Expired' : 'Active';
    csv += `${share.id},${format(new Date(share.created_at), 'MMM d, yyyy HH:mm')},${share.shared_with_email || 'Anyone'},${share.expires_at ? format(new Date(share.expires_at), 'MMM d, yyyy') : 'Never'},${share.permission_level},${share.view_count},${status}\n`;
  });
  csv += '\n';

  // Access logs section
  csv += 'ACCESS LOGS\n';
  csv += 'Share ID,Action,Accessed At,IP Address\n';
  logs.forEach(log => {
    csv += `${log.share_id},${log.action},${format(new Date(log.accessed_at), 'MMM d, yyyy HH:mm')},${log.ip_address || 'N/A'}\n`;
  });

  // Download CSV
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `lynkpro-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export to Excel
export async function exportToExcel(data: ExportData): Promise<void> {
  const { shares, logs, metrics, dateRange } = data;

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = [
    ['LynkPro Share Analytics Export'],
    [`Export Date: ${format(new Date(), 'MMM d, yyyy HH:mm')}`],
    dateRange
      ? [`Date Range: ${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}`]
      : ['Date Range: All Time'],
    [],
    ['SUMMARY METRICS'],
    ['Metric', 'Value'],
    ['Total Shares', metrics.totalShares],
    ['Active Shares', metrics.activeShares],
    ['Expired Shares', metrics.expiredShares],
    ['Total Views', metrics.totalViews],
    ['Total Downloads', metrics.totalDownloads],
    ['Average Views per Share', metrics.avgViewsPerShare.toFixed(2)],
    ['Download Conversion Rate', `${metrics.downloadRate.toFixed(2)}%`],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

  // Shares sheet
  const sharesData = shares.map(share => ({
    'ID': share.id,
    'Created At': format(new Date(share.created_at), 'MMM d, yyyy HH:mm'),
    'Shared With': share.shared_with_email || 'Anyone',
    'Expires At': share.expires_at ? format(new Date(share.expires_at), 'MMM d, yyyy') : 'Never',
    'Permission': share.permission_level,
    'View Count': share.view_count,
    'Status': share.expires_at && new Date(share.expires_at) < new Date() ? 'Expired' : 'Active',
    'Auto Renew': share.auto_renew ? 'Yes' : 'No',
  }));
  const sharesSheet = XLSX.utils.json_to_sheet(sharesData);
  XLSX.utils.book_append_sheet(wb, sharesSheet, 'Shares');

  // Access Logs sheet
  const logsData = logs.map(log => ({
    'Share ID': log.share_id,
    'Action': log.action,
    'Accessed At': format(new Date(log.accessed_at), 'MMM d, yyyy HH:mm'),
    'IP Address': log.ip_address || 'N/A',
  }));
  const logsSheet = XLSX.utils.json_to_sheet(logsData);
  XLSX.utils.book_append_sheet(wb, logsSheet, 'Access Logs');

  // Download Excel
  XLSX.writeFile(wb, `lynkpro-analytics-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

// Capture chart as image
export async function captureChartAsImage(elementId: string): Promise<string> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id ${elementId} not found`);
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    logging: false,
  });

  return canvas.toDataURL('image/png');
}

// Export to PDF
export async function exportToPDF(data: ExportData, chartIds: string[]): Promise<void> {
  const { metrics, dateRange } = data;

  // Create PDF
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Add header
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('LynkPro', margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Share Analytics Report', margin, yPosition);
  yPosition += 15;

  // Add metadata
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Export Date: ${format(new Date(), 'MMM d, yyyy HH:mm')}`, margin, yPosition);
  yPosition += 5;

  if (dateRange) {
    pdf.text(
      `Date Range: ${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}`,
      margin,
      yPosition
    );
  } else {
    pdf.text('Date Range: All Time', margin, yPosition);
  }
  yPosition += 15;

  // Add metrics
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('Summary Metrics', margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const metricsData = [
    ['Total Shares', metrics.totalShares.toString()],
    ['Active Shares', metrics.activeShares.toString()],
    ['Expired Shares', metrics.expiredShares.toString()],
    ['Total Views', metrics.totalViews.toString()],
    ['Total Downloads', metrics.totalDownloads.toString()],
    ['Average Views per Share', metrics.avgViewsPerShare.toFixed(2)],
    ['Download Conversion Rate', `${metrics.downloadRate.toFixed(2)}%`],
  ];

  metricsData.forEach(([label, value]) => {
    pdf.text(`${label}:`, margin, yPosition);
    pdf.text(value, margin + 60, yPosition);
    yPosition += 6;
  });

  yPosition += 10;

  // Add charts
  for (let i = 0; i < chartIds.length; i++) {
    try {
      const chartImage = await captureChartAsImage(chartIds[i]);

      // Check if we need a new page
      if (yPosition + 80 > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }

      // Add chart title
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      const chartTitle = chartIds[i].replace(/-/g, ' ').replace(/chart/gi, '').trim();
      pdf.text(chartTitle.charAt(0).toUpperCase() + chartTitle.slice(1), margin, yPosition);
      yPosition += 8;

      // Add chart image
      const imgWidth = pageWidth - 2 * margin;
      const imgHeight = 80;
      pdf.addImage(chartImage, 'PNG', margin, yPosition, imgWidth, imgHeight);
      yPosition += imgHeight + 15;
    } catch (error) {
      console.error(`Error capturing chart ${chartIds[i]}:`, error);
    }
  }

  // Add footer
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    pdf.text(
      'Generated by LynkPro',
      pageWidth - margin,
      pageHeight - 10,
      { align: 'right' }
    );
  }

  // Download PDF
  pdf.save(`lynkpro-analytics-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
