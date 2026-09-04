import jsPDF from 'jspdf';
import { SaleTransaction, StoreInfo } from '@/types';
import { DEFAULT_STORE_INFO } from '@/data/initialData';
import { formatCOP } from '@/lib/utils';

/**
 * Returns saved store info from localStorage or default fallback
 */
export function getSavedStoreInfo(): StoreInfo {
  try {
    const saved = localStorage.getItem('pos_store_info_v1');
    if (saved) {
      return { ...DEFAULT_STORE_INFO, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Error reading pos_store_info_v1:', e);
  }
  return DEFAULT_STORE_INFO;
}

/**
 * Generates an authentic 80mm thermal receipt PDF and triggers download
 */
export function generateInvoicePDF(
  transaction: SaleTransaction, 
  _autoDownload: boolean = true,
  customStoreInfo?: StoreInfo
): void {
  try {
    const store = customStoreInfo || getSavedStoreInfo();
    const itemLineCount = transaction.items.length;
    const taxCount = transaction.taxBreakdown?.length || 1;
    
    // Calculate total height accurately based on content sections to prevent white cutoffs or blank voids
    const hasLogo = Boolean(store.logoUrl);
    let neededHeight = hasLogo ? 38 : 22; // Header with or without 1:1 circular logo
    neededHeight += (store.shortName && store.shortName.toUpperCase() !== store.name.slice(0, 32).toUpperCase()) ? 6 : 0;
    neededHeight += 18; // NIT, address, phones
    neededHeight += 24; // Invoice meta (POS #, date, cashier, client, payment method)
    if (transaction.customerDocument) neededHeight += 4;
    neededHeight += itemLineCount * 6; // Item lines
    neededHeight += 16; // Subtotal and discounts
    neededHeight += taxCount * 3.8; // Taxes breakdown
    neededHeight += 12; // Total prominent
    if (transaction.paymentMethod === 'Efectivo' && transaction.amountReceived) neededHeight += 10;
    if (transaction.customDetails) neededHeight += 5;
    neededHeight += 18; // Footer messages and resolution
    neededHeight += 12; // Safety bottom roll buffer

    const estimatedHeight = Math.max(90, Math.ceil(neededHeight));

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, estimatedHeight],
    });

    let currentY = 5;

    // 1:1 Circular Logo at top of PDF
    if (store.logoUrl) {
      try {
        // Render 1:1 square image (14mm x 14mm) centered at x = (80 - 14)/2 = 33mm
        doc.addImage(store.logoUrl, 'PNG', 33, currentY, 14, 14);
        // Draw elegant circular border around 1:1 logo
        doc.setDrawColor(33, 76, 106);
        doc.setLineWidth(0.35);
        doc.circle(40, currentY + 7, 7.3, 'S');
        currentY += 17;
      } catch {
        // Fallback: draw circular monogram badge
        doc.setFillColor(33, 76, 106);
        doc.circle(40, currentY + 6.5, 6.5, 'F');
        doc.setFont('courier', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(255, 255, 255);
        const initials = (store.shortName || store.name).slice(0, 2).toUpperCase();
        doc.text(initials, 40, currentY + 9, { align: 'center' });
        currentY += 16;
      }
    } else {
      currentY += 2;
    }

    // Header styling
    doc.setFont('courier', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(27, 38, 49);
    doc.text(store.name.slice(0, 32).toUpperCase(), 40, currentY, { align: 'center' });
    currentY += 5;

    if (store.shortName && store.shortName.toUpperCase() !== store.name.slice(0, 32).toUpperCase()) {
      doc.setFontSize(12);
      doc.setTextColor(33, 76, 106);
      doc.text(store.shortName.toUpperCase(), 40, currentY, { align: 'center' });
      currentY += 5;
    }

    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(60, 60, 60);
    const regimenStr = store.regimen ? ` • ${store.regimen}` : '';
    doc.text(`NIT: ${store.nit}${regimenStr}`, 40, currentY, { align: 'center' });
    currentY += 4;
    const locationStr = store.city ? `${store.address} - ${store.city}` : store.address;
    doc.text(locationStr.slice(0, 42), 40, currentY, { align: 'center' });
    currentY += 4;
    
    const phoneParts: string[] = [];
    if (store.landline) phoneParts.push(`Tel: ${store.landline}`);
    if (store.phone) phoneParts.push(`Cel: ${store.phone}`);
    if (phoneParts.length > 0) {
      doc.text(phoneParts.join(' • '), 40, currentY, { align: 'center' });
      currentY += 4;
    }

    // Separator line
    doc.setDrawColor(180, 180, 180);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(4, currentY, 76, currentY);
    currentY += 4;

    // Invoice Meta
    doc.setFontSize(8);
    doc.setTextColor(30, 30, 30);
    doc.text(`FACTURA POS: #${transaction.id}`, 4, currentY);
    currentY += 4;

    const dateStr =
      transaction.timestamp instanceof Date
        ? transaction.timestamp.toLocaleString('es-CO')
        : new Date(transaction.timestamp).toLocaleString('es-CO');

    doc.text(`FECHA: ${dateStr}`, 4, currentY);
    currentY += 4;
    doc.text(`CAJERO: ${transaction.cashierName || store.defaultCashierName || 'Don Esteban'}`, 4, currentY);
    currentY += 4;
    doc.text(`CLIENTE: ${(transaction.customerName || 'Consumidor Final').slice(0, 25)}`, 4, currentY);
    currentY += 4;

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
    doc.text(
      (store.invoiceFooterMessage || 'MUCHAS GRACIAS POR SU COMPRA').slice(0, 48),
      40,
      currentY,
      { align: 'center' }
    );
    currentY += 3.5;
    if (store.resolutionInfo) {
      doc.text(store.resolutionInfo.slice(0, 50), 40, currentY, { align: 'center' });
      currentY += 3.5;
    }
    doc.text(`Software POS ${store.shortName || store.name} • Colombia`, 40, currentY, { align: 'center' });

    // Download document directly
    doc.save(`Factura_POS_${transaction.id}.pdf`);
  } catch (error) {
    console.error('Error generating PDF with jsPDF:', error);
    // Fallback: Trigger thermal print
    printThermalReceipt(transaction, customStoreInfo);
  }
}

/**
 * Prints the POS thermal receipt directly using a hidden iframe.
 * This completely isolates the receipt ticket so only the 80mm receipt is printed,
 * avoiding blank pages and browser popup blocks inside iframes.
 */
export function printThermalReceipt(transaction: SaleTransaction, customStoreInfo?: StoreInfo): void {
  const store = customStoreInfo || getSavedStoreInfo();
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

  const phoneText = [store.landline ? `Tel: ${store.landline}` : '', store.phone ? `Cel: ${store.phone}` : '']
    .filter(Boolean)
    .join(' • ');

  const receiptHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Factura POS #${transaction.id}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          html, body {
            margin: 0;
            padding: 0;
            background: #fff;
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            line-height: 1.3;
            color: #000;
            background: #fff;
            margin: 0 auto;
            padding: 6mm 4mm 10mm 4mm;
            max-width: 76mm;
            box-sizing: border-box;
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
          ${
            store.logoUrl
              ? `
            <div style="margin-bottom: 8px; display: flex; justify-content: center; align-items: center;">
              <div style="display: inline-block; width: 54px; height: 54px; border-radius: 50%; border: 1.5px solid #214C6A; padding: 2px; background: #ffffff; box-sizing: border-box; overflow: hidden;">
                <img 
                  src="${store.logoUrl}" 
                  alt="Logo" 
                  style="width: 100%; height: 100%; object-fit: contain; border-radius: 50%; display: block;" 
                />
              </div>
            </div>
          `
              : ''
          }
          <h2 style="margin: 0; font-size: 13px; font-weight: bold;">${store.name.toUpperCase()}</h2>
          ${
            store.shortName && store.shortName.toUpperCase() !== store.name.toUpperCase()
              ? `<h1 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 900; color: #214C6A;">${store.shortName.toUpperCase()}</h1>`
              : ''
          }
          <div style="font-size: 9.5px; color: #333;">NIT: ${store.nit}${store.regimen ? ` • ${store.regimen}` : ''}</div>
          <div style="font-size: 9.5px; color: #333;">${store.address}${store.city ? `, ${store.city}` : ''}</div>
          ${phoneText ? `<div style="font-size: 9.5px; color: #333;">${phoneText}</div>` : ''}
        </div>

        <div class="divider"></div>

        <div style="font-size: 10px; line-height: 1.35;">
          <div><strong>FACTURA POS:</strong> #${transaction.id}</div>
          <div><strong>FECHA / HORA:</strong> ${dateStr}</div>
          <div><strong>CAJERO:</strong> ${transaction.cashierName || store.defaultCashierName || 'Don Esteban'}</div>
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
          <p style="margin: 2px 0; font-weight: bold;">${store.invoiceFooterMessage || '¡GRACIAS POR SU COMPRA!'}</p>
          ${store.resolutionInfo ? `<p style="margin: 2px 0; font-size: 8px; color: #666;">${store.resolutionInfo}</p>` : ''}
          <p style="margin: 4px 0 0 0; font-size: 8px; color: #777;">Software POS ${store.shortName || store.name} • Cloud Edition</p>
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
export function getInvoicePlainText(transaction: SaleTransaction, customStoreInfo?: StoreInfo): string {
  const store = customStoreInfo || getSavedStoreInfo();
  const dateStr =
    transaction.timestamp instanceof Date
      ? transaction.timestamp.toLocaleString('es-CO')
      : new Date(transaction.timestamp).toLocaleString('es-CO');

  let text = `==============================\n`;
  text += `   ${store.name.toUpperCase()}\n`;
  if (store.shortName && store.shortName.toUpperCase() !== store.name.toUpperCase()) {
    text += `   ${store.shortName.toUpperCase()}\n`;
  }
  text += `     NIT: ${store.nit}\n`;
  text += `${store.address}${store.city ? ` - ${store.city}` : ''}\n`;
  if (store.phone) {
    text += `Cel / WhatsApp: ${store.phone}\n`;
  }
  text += `==============================\n`;
  text += `FACTURA POS: #${transaction.id}\n`;
  text += `FECHA: ${dateStr}\n`;
  text += `CAJERO: ${transaction.cashierName || store.defaultCashierName || 'Don Esteban'}\n`;
  text += `CLIENTE: ${transaction.customerName || 'Consumidor Final'}\n`;
  if (transaction.customerDocument) {
    text += `DOCUMENTO: ${transaction.customerDocument}\n`;
  }
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
  text += `   ${store.invoiceFooterMessage || '¡GRACIAS POR SU COMPRA!'}\n`;
  if (store.resolutionInfo) {
    text += `   ${store.resolutionInfo}\n`;
  }
  text += `==============================\n`;

  return text;
}

/**
 * Generates a WhatsApp share link with pre-filled message
 */
export function getWhatsAppShareUrl(transaction: SaleTransaction, customStoreInfo?: StoreInfo): string {
  const plainText = getInvoicePlainText(transaction, customStoreInfo);
  const encoded = encodeURIComponent(plainText);
  return `https://api.whatsapp.com/send?text=${encoded}`;
}
