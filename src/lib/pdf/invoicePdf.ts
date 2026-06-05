import { PDFGenerator, CompanyInfo, ClientInfo, LineItem, PDFOptions } from './pdfGenerator';
import type { Invoice } from '@/types/types';
import { format } from 'date-fns';

export class InvoicePDFGenerator extends PDFGenerator {
  public generateInvoice(
    invoice: Invoice,
    company: CompanyInfo,
    client: ClientInfo
  ): void {
    // Prepare options
    const options: PDFOptions = {
      title: 'INVOICE',
      documentNumber: invoice.invoice_number || 'Draft',
      date: invoice.created_at ? format(new Date(invoice.created_at), 'MMM dd, yyyy') : '',
      dueDate: invoice.due_date ? format(new Date(invoice.due_date), 'MMM dd, yyyy') : undefined,
      status: invoice.status,
    };

    // Add header
    this.addHeader(company, options);

    // Add client info
    this.addClientInfo(client);

    // Add project info if available
    if (invoice.project) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Project:', this.margin, this.currentY);
      this.currentY += 6;

      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(invoice.project.name, this.margin, this.currentY);
      this.currentY += 8;
    }

    // Add payment status section
    this.addPaymentStatus(invoice);

    // Add line items
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Items', this.margin, this.currentY);
    this.currentY += 8;

    const items: LineItem[] = (invoice.line_items || invoice.items || []).map(item => ({
      description: item.description || '',
      quantity: item.quantity || 1,
      unit_price: item.unit_price || 0,
      total: ('total' in item ? item.total : 'amount' in item ? item.amount : 0) || 0,
    }));

    if (items.length > 0) {
      this.addLineItemsTable(items, invoice.total_amount || 0);
    }

    // Add payment summary
    this.addPaymentSummary(invoice);

    // Add notes
    if (invoice.notes) {
      this.addNotes(invoice.notes);
    }

    // Add payment instructions
    this.addPaymentInstructions();
  }

  private addPaymentStatus(invoice: Invoice) {
    const rightX = this.pageWidth - this.margin;
    
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');

    // Status badge
    let statusColor: [number, number, number] = [107, 114, 128]; // gray
    let statusText = invoice.status.toUpperCase();

    if (invoice.status === 'paid') {
      statusColor = [34, 197, 94]; // green
    } else if (invoice.status === 'overdue') {
      statusColor = [239, 68, 68]; // red
    } else if (invoice.status === 'sent') {
      statusColor = [251, 191, 36]; // yellow
    }

    this.doc.setTextColor(...statusColor);
    this.doc.text(statusText, rightX, this.currentY, { align: 'right' });
    this.doc.setTextColor(0, 0, 0);
    
    this.currentY += 8;
  }

  private addPaymentSummary(invoice: Invoice) {
    const rightX = this.pageWidth - this.margin;
    const labelX = rightX - 60;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');

    // Subtotal
    this.doc.text('Subtotal:', labelX, this.currentY, { align: 'right' });
    this.doc.text(`$${invoice.total_amount.toFixed(2)}`, rightX, this.currentY, { align: 'right' });
    this.currentY += 5;

    // Paid amount
    if (invoice.paid_amount && invoice.paid_amount > 0) {
      this.doc.text('Paid:', labelX, this.currentY, { align: 'right' });
      this.doc.text(`-$${invoice.paid_amount.toFixed(2)}`, rightX, this.currentY, { align: 'right' });
      this.currentY += 5;
    }

    // Amount due
    const amountDue = invoice.total_amount - (invoice.paid_amount || 0);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Amount Due:', labelX, this.currentY, { align: 'right' });
    this.doc.text(`$${amountDue.toFixed(2)}`, rightX, this.currentY, { align: 'right' });
    this.currentY += 10;
  }

  private addPaymentInstructions() {
    // Check if we need a new page
    if (this.currentY > this.pageHeight - 50) {
      this.doc.addPage();
      this.currentY = this.margin;
    }

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Payment Instructions', this.margin, this.currentY);
    this.currentY += 6;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    const instructions = [
      'Please make payment within the specified due date.',
      'Include the invoice number in your payment reference.',
      'Contact us if you have any questions about this invoice.',
    ];

    instructions.forEach(instruction => {
      this.doc.text(`• ${instruction}`, this.margin + 5, this.currentY);
      this.currentY += 5;
    });
  }
}

// Helper function to generate invoice PDF
export async function generateInvoicePDF(
  invoice: Invoice,
  company: CompanyInfo,
  client: ClientInfo
): Promise<Blob> {
  const generator = new InvoicePDFGenerator();
  generator.generateInvoice(invoice, company, client);
  return generator.getBlob();
}

// Helper function to download invoice PDF
export async function downloadInvoicePDF(
  invoice: Invoice,
  company: CompanyInfo,
  client: ClientInfo
): Promise<void> {
  const generator = new InvoicePDFGenerator();
  generator.generateInvoice(invoice, company, client);
  const filename = `Invoice-${invoice.invoice_number || 'Draft'}.pdf`;
  generator.save(filename);
}
