import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PDFOptions {
  title: string;
  documentNumber?: string;
  date?: string;
  dueDate?: string;
  status?: string;
}

export interface CompanyInfo {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string; // Base64 or URL
}

export interface ClientInfo {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export class PDFGenerator {
  protected doc: jsPDF;
  protected pageWidth: number;
  protected pageHeight: number;
  protected margin: number = 20;
  protected currentY: number = 20;

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  // Add header with company info and logo
  protected addHeader(company: CompanyInfo, options: PDFOptions) {
    const leftX = this.margin;
    const rightX = this.pageWidth - this.margin;
    
    // Add logo if available
    if (company.logo) {
      try {
        this.doc.addImage(company.logo, 'PNG', leftX, this.currentY, 30, 30);
      } catch (error) {
        console.error('Error adding logo:', error);
      }
    }

    // Company name and info (right side)
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(company.name, rightX, this.currentY + 5, { align: 'right' });

    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    let infoY = this.currentY + 12;

    if (company.address) {
      this.doc.text(company.address, rightX, infoY, { align: 'right' });
      infoY += 4;
    }
    if (company.city && company.state && company.zip) {
      this.doc.text(`${company.city}, ${company.state} ${company.zip}`, rightX, infoY, { align: 'right' });
      infoY += 4;
    }
    if (company.phone) {
      this.doc.text(company.phone, rightX, infoY, { align: 'right' });
      infoY += 4;
    }
    if (company.email) {
      this.doc.text(company.email, rightX, infoY, { align: 'right' });
      infoY += 4;
    }

    this.currentY = Math.max(this.currentY + 35, infoY + 5);

    // Document title
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(options.title, leftX, this.currentY);
    this.currentY += 10;

    // Document details
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    if (options.documentNumber) {
      this.doc.text(`Number: ${options.documentNumber}`, leftX, this.currentY);
      this.currentY += 5;
    }
    if (options.date) {
      this.doc.text(`Date: ${options.date}`, leftX, this.currentY);
      this.currentY += 5;
    }
    if (options.dueDate) {
      this.doc.text(`Due Date: ${options.dueDate}`, leftX, this.currentY);
      this.currentY += 5;
    }
    if (options.status) {
      this.doc.text(`Status: ${options.status.toUpperCase()}`, leftX, this.currentY);
      this.currentY += 5;
    }

    this.currentY += 5;
  }

  // Add client information section
  protected addClientInfo(client: ClientInfo) {
    const leftX = this.margin;

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Bill To:', leftX, this.currentY);
    this.currentY += 6;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(client.name, leftX, this.currentY);
    this.currentY += 5;

    if (client.address) {
      this.doc.text(client.address, leftX, this.currentY);
      this.currentY += 5;
    }
    if (client.city && client.state && client.zip) {
      this.doc.text(`${client.city}, ${client.state} ${client.zip}`, leftX, this.currentY);
      this.currentY += 5;
    }
    if (client.email) {
      this.doc.text(client.email, leftX, this.currentY);
      this.currentY += 5;
    }
    if (client.phone) {
      this.doc.text(client.phone, leftX, this.currentY);
      this.currentY += 5;
    }

    this.currentY += 5;
  }

  // Add line items table
  protected addLineItemsTable(items: LineItem[], totalAmount: number) {
    const tableData = items.map(item => [
      item.description,
      item.quantity.toString(),
      `$${item.unit_price.toFixed(2)}`,
      `$${item.total.toFixed(2)}`,
    ]);

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Description', 'Quantity', 'Unit Price', 'Total']],
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
        0: { cellWidth: 'auto' },
        1: { cellWidth: 25, halign: 'right' },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' },
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
    });

    // @ts-ignore - autoTable adds finalY to doc
    this.currentY = this.doc.lastAutoTable.finalY + 5;

    // Add total
    const totalX = this.pageWidth - this.margin - 30;
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Total:', totalX - 35, this.currentY, { align: 'right' });
    this.doc.text(`$${totalAmount.toFixed(2)}`, totalX + 30, this.currentY, { align: 'right' });
    this.currentY += 10;
  }

  // Add notes section
  protected addNotes(notes: string) {
    if (!notes) return;

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Notes:', this.margin, this.currentY);
    this.currentY += 6;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    const lines = this.doc.splitTextToSize(notes, this.pageWidth - 2 * this.margin);
    this.doc.text(lines, this.margin, this.currentY);
    this.currentY += lines.length * 5 + 5;
  }

  // Add footer with page numbers
  protected addFooter() {
    const pageCount = this.doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(156, 163, 175);
      
      const footerText = `Page ${i} of ${pageCount}`;
      const textWidth = this.doc.getTextWidth(footerText);
      this.doc.text(
        footerText,
        (this.pageWidth - textWidth) / 2,
        this.pageHeight - 10
      );
      
      // Add generation date
      const dateText = `Generated on ${new Date().toLocaleDateString()}`;
      this.doc.text(dateText, this.margin, this.pageHeight - 10);
    }
  }

  // Save PDF
  public save(filename: string) {
    this.addFooter();
    this.doc.save(filename);
  }

  // Get PDF as blob
  public getBlob(): Blob {
    this.addFooter();
    return this.doc.output('blob');
  }

  // Get PDF as base64
  public getBase64(): string {
    this.addFooter();
    return this.doc.output('datauristring');
  }

  // Get PDF as array buffer
  public getArrayBuffer(): ArrayBuffer {
    this.addFooter();
    return this.doc.output('arraybuffer');
  }
}
