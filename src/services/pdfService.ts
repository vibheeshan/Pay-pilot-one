import jsPDF from 'jspdf';
import { Invoice, Business } from '../types';

export function generateInvoicePDF(invoice: Invoice, business: Business) {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });

  // Color palette
  const primaryColor = [15, 23, 42]; // Slate 900
  const secondaryColor = [71, 85, 105]; // Slate 600
  const lightGray = [241, 245, 249]; // Slate 100
  const accentColor = [79, 70, 229]; // Indigo 600

  // 1. Header & Brand
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(business.name, 40, 50);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text(business.description, 40, 66);
  doc.text(`Contact: ${business.business_email}`, 40, 78);

  // Status Badge on top-right
  const statusX = 460;
  const statusY = 40;
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.roundedRect(statusX, statusY, 95, 26, 4, 4, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  if (invoice.status === 'paid') {
    doc.setTextColor(16, 185, 129); // Green
  } else if (invoice.status === 'overdue') {
    doc.setTextColor(239, 68, 68); // Red
  } else {
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  }
  doc.text(invoice.status.toUpperCase(), statusX + 22, statusY + 17);

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1);
  doc.line(40, 95, 555, 95);

  // 2. Invoice Details & Customer Info Grid
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('BILLED TO:', 40, 125);
  doc.text('INVOICE DETAILS:', 340, 125);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  
  // Left: Customer details
  doc.text(invoice.customer_name, 40, 142);
  if (invoice.customer_company) {
    doc.text(invoice.customer_company, 40, 156);
  }
  doc.text(invoice.customer_email, 40, 170);
  if (invoice.customer_address) {
    doc.text(invoice.customer_address, 40, 184);
  }

  // Right: Invoice numbers & dates
  doc.text(`Invoice Number:`, 340, 142);
  doc.text(`Issue Date:`, 340, 156);
  doc.text(`Payment Due:`, 340, 170);
  doc.text(`Currency:`, 340, 184);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(invoice.invoice_number, 440, 142);
  doc.text(invoice.issue_date, 440, 156);
  doc.text(invoice.due_date, 440, 170);
  doc.text(invoice.currency, 440, 184);

  // 3. Line Items Table Header
  const tableTop = 220;
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.rect(40, tableTop, 515, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text('DESCRIPTION', 50, tableTop + 16);
  doc.text('QTY', 330, tableTop + 16);
  doc.text('UNIT PRICE', 390, tableTop + 16);
  doc.text('TOTAL', 495, tableTop + 16);

  // 4. Line Items Rows
  let curY = tableTop + 38;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);

  invoice.items.forEach((item) => {
    doc.text(item.description, 50, curY);
    doc.text(String(item.quantity), 335, curY);
    doc.text(`$${item.unit_price.toFixed(2)}`, 390, curY);
    doc.text(`$${item.line_total.toFixed(2)}`, 495, curY);

    doc.setDrawColor(241, 245, 249);
    doc.line(40, curY + 8, 555, curY + 8);
    curY += 26;
  });

  // 5. Totals Box
  curY += 15;
  const totalsLeft = 340;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  
  doc.text('Subtotal:', totalsLeft, curY);
  doc.text(`$${invoice.subtotal.toFixed(2)}`, 495, curY);

  curY += 18;
  doc.text(`Tax (${business.tax_rate}%):`, totalsLeft, curY);
  doc.text(`$${invoice.tax_amount.toFixed(2)}`, 495, curY);

  curY += 22;
  doc.setDrawColor(226, 232, 240);
  doc.line(totalsLeft, curY - 10, 555, curY - 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Total Due:', totalsLeft, curY + 5);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text(`$${invoice.total_amount.toFixed(2)}`, 480, curY + 5);

  // 6. Notes & Payment terms
  if (invoice.notes) {
    curY += 45;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text('PAYMENT INSTRUCTIONS & NOTES', 40, curY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(invoice.notes, 40, curY + 14);
  }

  // 7. Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text('Thank you for partnering with PayPilot One. For settlement support, email ops@example.com.', 40, 780);
  doc.text('Page 1 of 1', 510, 780);

  // Download trigger
  doc.save(`${invoice.invoice_number}_${invoice.customer_name.replace(/\s+/g, '_')}.pdf`);
}
