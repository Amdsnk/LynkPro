import { PDFGenerator, CompanyInfo, ClientInfo, LineItem, PDFOptions } from './pdfGenerator';
import type { Proposal } from '@/types/types';
import { format } from 'date-fns';

export class ProposalPDFGenerator extends PDFGenerator {
  public generateProposal(
    proposal: Proposal,
    company: CompanyInfo,
    client: ClientInfo
  ): void {
    // Prepare options
    const options: PDFOptions = {
      title: 'PROPOSAL',
      documentNumber: proposal.proposal_number || 'Draft',
      date: proposal.created_at ? format(new Date(proposal.created_at), 'MMM dd, yyyy') : '',
      status: proposal.status,
    };

    // Add header
    this.addHeader(company, options);

    // Add proposal title
    if (proposal.title) {
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(proposal.title, this.margin, this.currentY);
      this.currentY += 8;
    }

    // Add client info
    this.addClientInfo(client);

    // Add project info if available
    if (proposal.project) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Project:', this.margin, this.currentY);
      this.currentY += 6;

      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(proposal.project.name, this.margin, this.currentY);
      this.currentY += 5;

      if (proposal.project.description) {
        const lines = this.doc.splitTextToSize(
          proposal.project.description,
          this.pageWidth - 2 * this.margin
        );
        this.doc.text(lines, this.margin, this.currentY);
        this.currentY += lines.length * 5 + 5;
      }

      this.currentY += 5;
    }

    // Add scope of work section
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Scope of Work', this.margin, this.currentY);
    this.currentY += 8;

    // Add line items
    const items: LineItem[] = (proposal.line_items || proposal.items || []).map(item => ({
      description: item.description || '',
      quantity: item.quantity || 1,
      unit_price: item.unit_price || 0,
      total: ('total' in item ? item.total : 'amount' in item ? item.amount : 0) || 0,
    }));

    if (items.length > 0) {
      this.addLineItemsTable(items, proposal.total_amount || 0);
    }

    // Add terms and conditions
    if (proposal.terms || (typeof proposal.content === 'object' && 'terms' in proposal.content)) {
      const terms = proposal.terms || (typeof proposal.content === 'object' && 'terms' in proposal.content ? String(proposal.content.terms) : '');
      
      if (terms) {
        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Terms & Conditions', this.margin, this.currentY);
        this.currentY += 6;

        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'normal');
        const lines = this.doc.splitTextToSize(terms, this.pageWidth - 2 * this.margin);
        this.doc.text(lines, this.margin, this.currentY);
        this.currentY += lines.length * 5 + 10;
      }
    }

    // Add signature section
    this.addSignatureSection();
  }

  private addSignatureSection() {
    // Check if we need a new page
    if (this.currentY > this.pageHeight - 60) {
      this.doc.addPage();
      this.currentY = this.margin;
    }

    this.currentY += 10;

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Acceptance', this.margin, this.currentY);
    this.currentY += 8;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    const acceptanceText = 'By signing below, you accept the terms and conditions outlined in this proposal.';
    this.doc.text(acceptanceText, this.margin, this.currentY);
    this.currentY += 15;

    // Signature line
    const lineWidth = 70;
    this.doc.line(this.margin, this.currentY, this.margin + lineWidth, this.currentY);
    this.currentY += 5;
    this.doc.setFontSize(9);
    this.doc.text('Client Signature', this.margin, this.currentY);
    
    // Date line
    const dateX = this.margin + lineWidth + 20;
    this.doc.line(dateX, this.currentY - 5, dateX + 40, this.currentY - 5);
    this.doc.text('Date', dateX, this.currentY);
  }
}

// Helper function to generate proposal PDF
export async function generateProposalPDF(
  proposal: Proposal,
  company: CompanyInfo,
  client: ClientInfo
): Promise<Blob> {
  const generator = new ProposalPDFGenerator();
  generator.generateProposal(proposal, company, client);
  return generator.getBlob();
}

// Helper function to download proposal PDF
export async function downloadProposalPDF(
  proposal: Proposal,
  company: CompanyInfo,
  client: ClientInfo
): Promise<void> {
  const generator = new ProposalPDFGenerator();
  generator.generateProposal(proposal, company, client);
  const filename = `Proposal-${proposal.proposal_number || 'Draft'}.pdf`;
  generator.save(filename);
}
