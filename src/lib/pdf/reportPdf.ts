import { PDFGenerator, CompanyInfo, ClientInfo, PDFOptions } from './pdfGenerator';
import type { Report } from '@/types/types';
import { format } from 'date-fns';
import autoTable from 'jspdf-autotable';

export class ReportPDFGenerator extends PDFGenerator {
  public async generateReport(
    report: Report,
    company: CompanyInfo,
    client: ClientInfo,
    photoUrls: string[] = []
  ): Promise<void> {
    // Prepare options
    const options: PDFOptions = {
      title: 'FIELD REVIEW REPORT',
      documentNumber: report.report_number || 'Draft',
      date: report.created_at ? format(new Date(report.created_at), 'MMM dd, yyyy') : '',
      status: report.status,
    };

    // Add header
    this.addHeader(company, options);

    // Add report title
    if (report.title) {
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(report.title, this.margin, this.currentY);
      this.currentY += 8;
    }

    // Add client info
    this.addClientInfo(client);

    // Add project info if available
    if (report.project) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Project:', this.margin, this.currentY);
      this.currentY += 6;

      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(report.project.name, this.margin, this.currentY);
      this.currentY += 5;

      if (report.site_location) {
        this.doc.text(`Location: ${report.site_location}`, this.margin, this.currentY);
        this.currentY += 8;
      } else {
        this.currentY += 3;
      }
    }

    // Add observations section
    if (report.observations) {
      const obsArray = Array.isArray(report.observations) 
        ? report.observations 
        : report.observations.split('\n').filter(o => o.trim());
      if (obsArray.length > 0) {
        this.addObservationsSection(obsArray);
      }
    }

    // Add recommendations section
    if (report.recommendations) {
      const recArray = Array.isArray(report.recommendations)
        ? report.recommendations
        : report.recommendations.split('\n').filter(r => r.trim());
      if (recArray.length > 0) {
        this.addRecommendationsSection(recArray);
      }
    }

    // Add AI narrative if available
    if (report.ai_narrative) {
      this.addNarrativeSection(report.ai_narrative);
    }

    // Add photos section
    if (photoUrls.length > 0) {
      await this.addPhotosSection(photoUrls);
    }

    // Add summary section
    if (report.summary) {
      this.addSummarySection(report.summary);
    }
  }

  private addObservationsSection(observations: string[]) {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Observations', this.margin, this.currentY);
    this.currentY += 8;

    const tableData = observations.map((obs, index) => [
      (index + 1).toString(),
      obs,
    ]);

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['#', 'Observation']],
      body: tableData,
      theme: 'plain',
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [249, 250, 251],
        textColor: [17, 24, 39],
        fontStyle: 'bold',
        lineWidth: 0.1,
        lineColor: [229, 231, 235],
      },
      bodyStyles: {
        textColor: [55, 65, 81],
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 'auto' },
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
    });

    // @ts-ignore
    this.currentY = this.doc.lastAutoTable.finalY + 10;
  }

  private addRecommendationsSection(recommendations: string[]) {
    // Check if we need a new page
    if (this.currentY > this.pageHeight - 60) {
      this.doc.addPage();
      this.currentY = this.margin;
    }

    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Recommendations', this.margin, this.currentY);
    this.currentY += 8;

    const tableData = recommendations.map((rec, index) => [
      (index + 1).toString(),
      rec,
    ]);

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['#', 'Recommendation']],
      body: tableData,
      theme: 'plain',
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [249, 250, 251],
        textColor: [17, 24, 39],
        fontStyle: 'bold',
        lineWidth: 0.1,
        lineColor: [229, 231, 235],
      },
      bodyStyles: {
        textColor: [55, 65, 81],
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 'auto' },
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
    });

    // @ts-ignore
    this.currentY = this.doc.lastAutoTable.finalY + 10;
  }

  private addNarrativeSection(narrative: string) {
    // Check if we need a new page
    if (this.currentY > this.pageHeight - 60) {
      this.doc.addPage();
      this.currentY = this.margin;
    }

    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Executive Summary', this.margin, this.currentY);
    this.currentY += 8;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    const lines = this.doc.splitTextToSize(narrative, this.pageWidth - 2 * this.margin);
    this.doc.text(lines, this.margin, this.currentY);
    this.currentY += lines.length * 5 + 10;
  }

  private addSummarySection(summary: string) {
    // Check if we need a new page
    if (this.currentY > this.pageHeight - 60) {
      this.doc.addPage();
      this.currentY = this.margin;
    }

    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Summary', this.margin, this.currentY);
    this.currentY += 8;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    const lines = this.doc.splitTextToSize(summary, this.pageWidth - 2 * this.margin);
    this.doc.text(lines, this.margin, this.currentY);
    this.currentY += lines.length * 5 + 10;
  }

  private async addPhotosSection(photoUrls: string[]) {
    if (photoUrls.length === 0) return;

    // Add new page for photos
    this.doc.addPage();
    this.currentY = this.margin;

    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Photo Documentation', this.margin, this.currentY);
    this.currentY += 10;

    const imageWidth = (this.pageWidth - 3 * this.margin) / 2;
    const imageHeight = imageWidth * 0.75; // 4:3 aspect ratio
    let column = 0;

    for (let i = 0; i < photoUrls.length; i++) {
      try {
        // Check if we need a new page
        if (this.currentY + imageHeight + 15 > this.pageHeight - this.margin) {
          this.doc.addPage();
          this.currentY = this.margin;
        }

        const x = this.margin + column * (imageWidth + this.margin);
        
        // Load and add image
        const img = await this.loadImage(photoUrls[i]);
        this.doc.addImage(img, 'JPEG', x, this.currentY, imageWidth, imageHeight);

        // Add caption
        this.doc.setFontSize(9);
        this.doc.setFont('helvetica', 'normal');
        this.doc.text(`Photo ${i + 1}`, x, this.currentY + imageHeight + 5);

        column++;
        if (column >= 2) {
          column = 0;
          this.currentY += imageHeight + 15;
        }
      } catch (error) {
        console.error('Error adding photo:', error);
      }
    }

    if (column > 0) {
      this.currentY += imageHeight + 15;
    }
  }

  private loadImage(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } else {
          reject(new Error('Failed to get canvas context'));
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });
  }
}

// Helper function to generate report PDF
export async function generateReportPDF(
  report: Report,
  company: CompanyInfo,
  client: ClientInfo,
  photoUrls: string[] = []
): Promise<Blob> {
  const generator = new ReportPDFGenerator();
  await generator.generateReport(report, company, client, photoUrls);
  return generator.getBlob();
}

// Helper function to download report PDF
export async function downloadReportPDF(
  report: Report,
  company: CompanyInfo,
  client: ClientInfo,
  photoUrls: string[] = []
): Promise<void> {
  const generator = new ReportPDFGenerator();
  await generator.generateReport(report, company, client, photoUrls);
  const filename = `Report-${report.report_number || 'Draft'}.pdf`;
  generator.save(filename);
}
