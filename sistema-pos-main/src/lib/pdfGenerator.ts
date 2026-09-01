import { jsPDF } from 'jspdf';
import { SaleTransaction } from '@/types';
import { formatCOP } from '@/lib/utils';

export const generateInvoicePDF = (transaction: SaleTransaction, shouldDownload: boolean = true) => {
  // Calculate dynamic height based on items count
  const baseHeight = 150;
  const itemsHeight = transaction.items.length * 9;
  const taxBreakdownCount = transaction.taxBreakdown ? transaction.taxBreakdown.length : 1;
  const totalHeight = Math.max(170, baseHeight + itemsHeight + taxBreakdownCount * 4);

  // 80mm thermal receipt format
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, totalHeight],
  });

  const pageWidth = 80;
  let y = 10;

  // Header
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(33, 76, 106); // #214C6A
  doc.text('TIENDA MIXTA', pageWidth / 2, y, { align: 'center' });
  y += 5;

  doc.setFontSize(13);
  doc.setTextColor(188, 99, 67); // #BC6343
  doc.text('LA ESQUINITA', pageWidth / 2, y, { align: 'center' });
  y += 4.5;

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  doc.text('NIT: 900.842.193-4', pageWidth / 2, y, { align: 'center' });
  y += 3.5;
  doc.text('Régimen Simple de Tributación', pageWidth / 2, y, { align: 'center' });
  y += 3.5;
  doc.text('Cra 43A # 18 Sur - 45, Medellín', pageWidth / 2, y, { align: 'center' });
  y += 3.5;
  doc.text('Tel: (604) 444 8920 • Cel: 310 847 9201', pageWidth / 2, y, { align: 'center' });
  y += 5;

  // Separator
  doc.setDrawColor(180, 180, 180);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(5, y, 75, y);
  y += 4;

  // Invoice Details
  doc.setFontSize(7.5);
  doc.setTextColor(40, 40, 40);

  const printRow = (label: string, value: string, isBold: boolean = false) => {
    if (isBold) {
      doc.setFont('courier', 'bold');
    } else {
      doc.setFont('courier', 'normal');
    }
    doc.text(label, 5, y);
    doc.text(value, 75, y, { align: 'right' });
    y += 3.8;
  };

  printRow('FACTURA POS:', `#${transaction.id}`, true);
  printRow('FECHA:', new Date(transaction.timestamp).toLocaleDateString('es-CO'));
  printRow('HORA:', new Date(transaction.timestamp).toLocaleTimeString('es-CO'));
  printRow('CAJERO:', transaction.cashierName);
  printRow('CLIENTE:', transaction.customerName || 'Consumidor Final', true);

  y += 1;
  doc.line(5, y, 75, y);
  y += 4;

  // Items Header
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.text('CANT. DESCRIPCIÓN (IVA/DESC)', 5, y);
  doc.text('TOTAL', 75, y, { align: 'right' });
  y += 3.5;

  doc.setLineDashPattern([0.5, 0.5], 0);
  doc.line(5, y, 75, y);
  y += 3.5;

  // Items List
  doc.setFont('courier', 'normal');
  doc.setFontSize(7);

  transaction.items.forEach((item) => {
    const itemDisc = item.product.discount || 0;
    const itemIva = item.product.ivaRate ?? 0;
    const unitPriceEffective = item.product.price * (1 - itemDisc / 100);
    const itemTotalStr = formatCOP(unitPriceEffective * item.quantity);
    const itemTitle = `${item.quantity}x ${item.product.title}`;
    
    // Truncate if too long to fit with price
    const maxChars = 22;
    const displayTitle = itemTitle.length > maxChars ? `${itemTitle.substring(0, maxChars - 2)}..` : itemTitle;
    
    doc.setFont('courier', 'bold');
    doc.text(displayTitle, 5, y);
    doc.text(itemTotalStr, 75, y, { align: 'right' });
    y += 3;

    doc.setFont('courier', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(100, 100, 100);
    
    const details = `@ ${formatCOP(item.product.price)} [IVA ${itemIva}%${itemDisc > 0 ? ` -${itemDisc}%` : ''}]`;
    doc.text(`   ${details}`, 5, y);
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(7);
    y += 3.5;
  });

  y += 1;
  doc.setLineDashPattern([1, 1], 0);
  doc.line(5, y, 75, y);
  y += 4;

  // Totals Section
  doc.setFontSize(7.5);
  printRow('SUBTOTAL BRUTO:', formatCOP(transaction.subtotal));

  if (transaction.discount > 0) {
    doc.setTextColor(180, 50, 50);
    printRow('DESCUENTO TOTAL:', `-${formatCOP(transaction.discount)}`, true);
    doc.setTextColor(40, 40, 40);
  }

  // Tax Breakdown discriminado
  if (transaction.taxBreakdown && transaction.taxBreakdown.length > 0) {
    transaction.taxBreakdown.forEach((tb) => {
      const label = tb.rate === 0 ? 'BASE EXENTA (0%):' : `BASE GRAVADA (${tb.rate}%):`;
      printRow(label, formatCOP(tb.baseAmount));
      if (tb.rate > 0) {
        printRow(`  IVA ${tb.rate}% LIQUIDADO:`, formatCOP(tb.taxAmount));
      }
    });
  } else {
    printRow('TOTAL IVA LIQUIDADO:', formatCOP(transaction.tax || 0));
  }

  y += 1;
  doc.line(5, y, 75, y);
  y += 4.5;

  // Total Big
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(33, 76, 106);
  doc.text('TOTAL A PAGAR:', 5, y);
  doc.text(formatCOP(transaction.total), 75, y, { align: 'right' });
  y += 5;

  doc.setLineDashPattern([1, 1], 0);
  doc.line(5, y, 75, y);
  y += 4;

  // Payment Details
  doc.setFontSize(7.5);
  doc.setTextColor(40, 40, 40);
  printRow('MÉTODO DE PAGO:', transaction.paymentMethod, true);

  if (transaction.amountReceived !== undefined && transaction.amountReceived > 0) {
    printRow('MONTO RECIBIDO:', formatCOP(transaction.amountReceived));
  }

  if (transaction.change !== undefined && transaction.change > 0) {
    doc.setTextColor(33, 76, 106);
    printRow('CAMBIO / VUELTAS:', formatCOP(transaction.change), true);
    doc.setTextColor(40, 40, 40);
  }

  y += 2;
  doc.line(5, y, 75, y);
  y += 5;

  // Footer
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(33, 76, 106);
  doc.text('¡GRACIAS POR SU COMPRA!', pageWidth / 2, y, { align: 'center' });
  y += 3.5;

  doc.setFont('courier', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(90, 90, 90);
  doc.text('Conserve esta tirilla para garantías.', pageWidth / 2, y, { align: 'center' });
  y += 3;
  doc.text('Sistema POS Tienda Mixta La Esquinita - Facturación Rápida', pageWidth / 2, y, { align: 'center' });

  if (shouldDownload) {
    const filename = `Factura-POS-${transaction.id}.pdf`;
    doc.save(filename);
  }

  return doc;
};

