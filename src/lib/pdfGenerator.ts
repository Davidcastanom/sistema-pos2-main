import jsPDF from 'jspdf';
import { SaleTransaction } from '@/types';
import { formatCOP } from '@/lib/utils';

/**
 * Generates an authentic 80mm thermal receipt PDF and triggers download
 */
export function generateInvoicePDF(transaction: SaleTransaction, _autoDownload: boolean = true): void {
  try {
    const itemLineCount = transaction.items.length;
    const taxCount = transaction.taxBreakdown?.length || 1;
    // Calculate total height needed based on items and details
    const estimatedHeight = Math.max(160, 130 + itemLineCount * 7 + taxCount * 5);

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, estimatedHeight],
    });

    // Header styling
    doc.setFont('courier', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(27, 38, 49);
    doc.text('TIENDA MIXTA', 40, 9, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(33, 76, 106);
    doc.text('LA ESQUINITA', 40, 15, { align: 'center' });

    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(60, 60, 60);
    doc.text('NIT: 900.842.193-4 • Regimen Simple', 40, 20, { align: 'center' });
    doc.text('Cra 43A # 18 Sur - 45, Medellin', 40, 24, { align: 'center' });
    doc.text('Tel: (604) 444 8920 • Cel: 310 847 9201', 40, 28, { align: 'center' });

    // Separator line
    doc.setDrawColor(180, 180, 180);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(4, 31, 76, 31);

    // Invoice Meta
    doc.setFontSize(8);
    doc.setTextColor(30, 30, 30);
    doc.text(`FACTURA POS: #${transaction.id}`, 4, 35);

    const dateStr =
      transaction.timestamp instanceof Date
        ? transaction.timestamp.toLocaleString('es-CO')
        : new Date(transaction.timestamp).toLocaleString('es-CO');

    doc.text(`FECHA: ${dateStr}`, 4, 39);
    doc.text(`CAJERO: ${transaction.cashierName || 'Don Esteban'}`, 4, 43);
    doc.text(`CLIENTE: ${(transaction.customerName || 'Consumidor Final').slice(0, 25)}`, 4, 47);

    let currentY = 51;
    if (transaction.customerDocument) {
      doc.text(`DOC: ${transaction.customerDocument}`, 4, currentY);
      currentY += 4;
    }

    doc.text(`MEDIO PAGO: ${transaction.paymentMethod}`, 4, currentY);
    currentY += 4;

    doc.line(4, currentY, 76, currentY);
    currentY += 4;

    // Items Table Header
    doc.setFont('courier', 'bold');
    doc.text('CANT  DESCRIPCION', 4, currentY);
    doc.text('TOTAL', 76, currentY, { align: 'right' });
    currentY += 2;
    doc.line(4, currentY, 76, currentY);
    currentY += 4;

    // Items Rows
    doc.setFont('courier', 'normal');
    transaction.items.forEach((item) => {
      const disc = item.product.discount || 0;
      const unitEff = item.product.price * (1 - disc / 100);
      const rowTotal = formatCOP(unitEff * item.quantity);
      const title =
        item.product.title.length > 20
          ? item.product.title.slice(0, 19) + '..'
          : item.product.title;

      doc.text(`${item.quantity}x ${title}`, 4, currentY);
      doc.text(rowTotal, 76, currentY, { align: 'right' });
      currentY += 5;
    });

    doc.line(4, currentY, 76, currentY);
    currentY += 4;

    // Subtotal and Discounts
    doc.text('SUBTOTAL BRUTO:', 4, currentY);
    doc.text(formatCOP(transaction.subtotal), 76, currentY, { align: 'right' });
    currentY += 4;

    if (transaction.discount > 0) {
      doc.text('DESCUENTO TOTAL:', 4, currentY);
      doc.text(`-${formatCOP(transaction.discount)}`, 76, currentY, { align: 'right' });
      currentY += 4;
    }

    // Taxes
    if (transaction.taxBreakdown && transaction.taxBreakdown.length > 0) {
      transaction.taxBreakdown.forEach((tb) => {
        doc.setFontSize(7);
        doc.text(
          tb.rate === 0
            ? `Base Exenta (0%): ${formatCOP(tb.baseAmount)}`
            : `Base Grav. (${tb.rate}%): ${formatCOP(tb.baseAmount)}`,
          4,
          currentY
        );
        doc.text(tb.rate > 0 ? `IVA: ${formatCOP(tb.taxAmount)}` : '$0', 76, currentY, {
          align: 'right',
        });
        currentY += 3.5;
      });
      doc.setFontSize(8);
    } else {
      doc.setFontSize(7);
      doc.text(`TOTAL IVA LIQUIDADO:`, 4, currentY);
      doc.text(formatCOP(transaction.tax || 0), 76, currentY, { align: 'right' });
      currentY += 3.5;
      doc.setFontSize(8);
    }

    doc.setLineDashPattern([], 0);
    doc.setDrawColor(100, 100, 100);
    doc.line(4, currentY, 76, currentY);
    currentY += 4.5;

    // Total Prominent
    doc.setFont('courier', 'bold');
    doc.setFontSize(10.5);
    doc.text('TOTAL COP:', 4, currentY);
    doc.text(formatCOP(transaction.total), 76, currentY, { align: 'right' });
    currentY += 5;

    // Payment details
    doc.setFontSize(8);
    doc.setFont('courier', 'normal');
    if (transaction.paymentMethod === 'Efectivo' && transaction.amountReceived) {
      doc.text('RECIBIDO:', 4, currentY);
      doc.text(formatCOP(transaction.amountReceived), 76, currentY, { align: 'right' });
      currentY += 4;
      doc.text('CAMBIO / VUELTAS:', 4, currentY);
      doc.text(formatCOP(transaction.change || 0), 76, currentY, { align: 'right' });
      currentY += 4.5;
    }

    if (transaction.customDetails) {
      doc.setFontSize(7.5);
      doc.text(`REF/NOTA: ${transaction.customDetails.slice(0, 32)}`, 4, currentY);
      currentY += 4;
    }

    doc.setLineDashPattern([1, 1], 0);
    doc.line(4, currentY, 76, currentY);
    currentY += 4.5;

    // Footer
    doc.setFontSize(7);
    doc.text('MUCHAS GRACIAS POR SU COMPRA', 40, currentY, { align: 'center' });
    currentY += 3.5;
    doc.text('Conserve este comprobante para garantias', 40, currentY, { align: 'center' });
    currentY += 3.5;
    doc.text('Software POS La Esquinita • Colombia', 40, currentY, { align: 'center' });

    // Download document directly
    doc.save(`Factura_POS_${transaction.id}.pdf`);
  } catch (error) {
    console.error('Error generating PDF with jsPDF:', error);
    // Fallback: Trigger thermal print
    printThermalReceipt(transaction);
  }
}

/**
 * Prints the POS thermal receipt directly using a hidden iframe.
 * This completely isolates the receipt ticket so only the 80mm receipt is printed,
 * avoiding blank pages and browser popup blocks inside iframes.
 */
export function printThermalReceipt(transaction: SaleTransaction): void {
  const dateStr =
    transaction.timestamp instanceof Date
      ? transaction.timestamp.toLocaleString('es-CO')
      : new Date(transaction.timestamp).toLocaleString('es-CO');

  const itemsHtml = transaction.items
    .map((item) => {
      const disc = item.product.discount || 0;
      const unitEff = item.product.price * (1 - disc / 100);
      return `
        <tr>
          <td style="padding: 3px 0; border-bottom: 1px dashed #bbb; font-size: 11px;">
            <strong>${item.quantity}x ${item.product.title}</strong><br/>
            <span style="color: #555; font-size: 9.5px;">${formatCOP(unitEff)} c/u</span>
          </td>
          <td style="padding: 3px 0; border-bottom: 1px dashed #bbb; text-align: right; font-size: 11px; font-weight: bold;">
            ${formatCOP(unitEff * item.quantity)}
          </td>
        </tr>
      `;
    })
    .join('');

  const taxRows =
    transaction.taxBreakdown && transaction.taxBreakdown.length > 0
      ? transaction.taxBreakdown
          .map(
            (t) => `
            <div style="display: flex; justify-content: space-between; font-size: 10px; color: #444;">
              <span>${t.rate === 0 ? 'Base Exenta (0%):' : `Base IVA ${t.rate}%:`} ${formatCOP(t.baseAmount)}</span>
              <span>${formatCOP(t.taxAmount)}</span>
            </div>
          `
          )
          .join('')
      : `<div style="display: flex; justify-content: space-between; font-size: 10px; color: #444;">
           <span>IVA Total:</span>
           <span>${formatCOP(transaction.tax || 0)}</span>
         </div>`;

  const receiptHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Factura POS #${transaction.id}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 2mm;
          }
          body {
            font-family: 'Courier New', Courier, monospace, monospace;
            font-size: 11px;
            line-height: 1.3;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 8px;
            max-width: 76mm;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          .double-divider { border-top: 2px dashed #000; margin: 8px 0; }
          table { width: 100%; border-collapse: collapse; }
        </style>
      </head>
      <body>
        <div class="text-center">
          <h2 style="margin: 0; font-size: 15px; font-weight: bold;">TIENDA MIXTA</h2>
          <h1 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 900; color: #214C6A;">LA ESQUINITA</h1>
          <div style="font-size: 9.5px; color: #333;">NIT: 900.842.193-4 • Régimen Simple</div>
          <div style="font-size: 9.5px; color: #333;">Cra 43A # 18 Sur - 45, Medellín</div>
          <div style="font-size: 9.5px; color: #333;">Tel: (604) 444 8920 • Cel: 310 847 9201</div>
        </div>

        <div class="divider"></div>

        <div style="font-size: 10px; line-height: 1.35;">
          <div><strong>FACTURA POS:</strong> #${transaction.id}</div>
          <div><strong>FECHA / HORA:</strong> ${dateStr}</div>
          <div><strong>CAJERO:</strong> ${transaction.cashierName || 'Don Esteban'}</div>
          <div><strong>CLIENTE:</strong> ${transaction.customerName || 'Consumidor Final'}</div>
          ${transaction.customerDocument ? `<div><strong>DOC / CC:</strong> ${transaction.customerDocument}</div>` : ''}
          <div><strong>FORMA DE PAGO:</strong> ${transaction.paymentMethod}</div>
        </div>

        <div class="divider"></div>

        <table>
          <thead>
            <tr style="border-bottom: 1px solid #000; font-size: 10px;">
              <th style="text-align: left; padding-bottom: 3px;">DESCRIPCIÓN</th>
              <th style="text-align: right; padding-bottom: 3px;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="divider"></div>

        <div style="display: flex; justify-content: space-between; font-size: 11px;">
          <span>Subtotal Bruto:</span>
          <span>${formatCOP(transaction.subtotal)}</span>
        </div>

        ${
          transaction.discount > 0
            ? `
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: #c00;">
            <span>Descuento Total:</span>
            <span>-${formatCOP(transaction.discount)}</span>
          </div>
        `
            : ''
        }

        ${taxRows}

        <div class="double-divider"></div>

        <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 900;">
          <span>TOTAL A PAGAR:</span>
          <span>${formatCOP(transaction.total)}</span>
        </div>

        ${
          transaction.paymentMethod === 'Efectivo' && transaction.amountReceived
            ? `
          <div style="margin-top: 4px; font-size: 10px;">
            <div style="display: flex; justify-content: space-between;">
              <span>Dinero Recibido:</span>
              <span>${formatCOP(transaction.amountReceived)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: bold;">
              <span>Cambio / Vueltas:</span>
              <span>${formatCOP(transaction.change || 0)}</span>
            </div>
          </div>
        `
            : ''
        }

        ${
          transaction.customDetails
            ? `
          <div style="margin-top: 4px; font-size: 9.5px; color: #333;">
            <span>Ref/Nota: ${transaction.customDetails}</span>
          </div>
        `
            : ''
        }

        <div class="divider"></div>

        <div class="text-center" style="font-size: 9.5px; color: #444; margin-top: 6px;">
          <p style="margin: 2px 0; font-weight: bold;">¡GRACIAS POR SU COMPRA!</p>
          <p style="margin: 2px 0;">Conserve este comprobante para cualquier reclamo.</p>
          <p style="margin: 4px 0 0 0; font-size: 8px; color: #777;">Software POS La Esquinita • Cloud Edition</p>
        </div>
      </body>
    </html>
  `;

  // Use a temporary hidden iframe to trigger print without modifying the current view
  let iframe = document.getElementById('pos-thermal-print-frame') as HTMLIFrameElement | null;
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'pos-thermal-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
  }

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (doc) {
    doc.open();
    doc.write(receiptHtml);
    doc.close();

    setTimeout(() => {
      iframe?.contentWindow?.focus();
      iframe?.contentWindow?.print();
    }, 250);
  } else {
    window.print();
  }
}

/**
 * Returns clean plain text format of the receipt for clipboard or quick view
 */
export function getInvoicePlainText(transaction: SaleTransaction): string {
  const dateStr =
    transaction.timestamp instanceof Date
      ? transaction.timestamp.toLocaleString('es-CO')
      : new Date(transaction.timestamp).toLocaleString('es-CO');

  let text = `==============================\n`;
  text += `   TIENDA MIXTA LA ESQUINITA\n`;
  text += `     NIT: 900.842.193-4\n`;
  text += `Cra 43A # 18 Sur - 45, Medellín\n`;
  text += `==============================\n`;
  text += `FACTURA POS: #${transaction.id}\n`;
  text += `FECHA: ${dateStr}\n`;
  text += `CAJERO: ${transaction.cashierName || 'Don Esteban'}\n`;
  text += `CLIENTE: ${transaction.customerName || 'Consumidor Final'}\n`;
  text += `PAGO: ${transaction.paymentMethod}\n`;
  text += `------------------------------\n`;
  text += `CANT  DESCRIPCION       TOTAL\n`;
  text += `------------------------------\n`;

  transaction.items.forEach((it) => {
    const disc = it.product.discount || 0;
    const unitEff = it.product.price * (1 - disc / 100);
    const sub = formatCOP(unitEff * it.quantity);
    text += `${it.quantity}x ${it.product.title.slice(0, 16).padEnd(16)} ${sub}\n`;
  });

  text += `------------------------------\n`;
  text += `SUBTOTAL: ${formatCOP(transaction.subtotal)}\n`;
  if (transaction.discount > 0) {
    text += `DESCUENTO: -${formatCOP(transaction.discount)}\n`;
  }
  text += `TOTAL A PAGAR: ${formatCOP(transaction.total)}\n`;

  if (transaction.paymentMethod === 'Efectivo' && transaction.amountReceived) {
    text += `RECIBIDO: ${formatCOP(transaction.amountReceived)}\n`;
    text += `CAMBIO: ${formatCOP(transaction.change || 0)}\n`;
  }

  if (transaction.customDetails) {
    text += `NOTA/REF: ${transaction.customDetails}\n`;
  }

  text += `==============================\n`;
  text += `   ¡GRACIAS POR SU COMPRA!\n`;
  text += `==============================\n`;

  return text;
}

/**
 * Generates a WhatsApp share link with pre-filled message
 */
export function getWhatsAppShareUrl(transaction: SaleTransaction): string {
  const plainText = getInvoicePlainText(transaction);
  const encoded = encodeURIComponent(plainText);
  return `https://api.whatsapp.com/send?text=${encoded}`;
}
