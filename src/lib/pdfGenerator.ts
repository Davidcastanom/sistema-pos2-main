import { SaleTransaction } from '@/types';
import { formatCOP } from '@/lib/utils';

/**
 * Generates and downloads or prints a thermal POS receipt format
 */
export function generateInvoicePDF(transaction: SaleTransaction, autoDownload: boolean = true): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    // Fallback if popups are blocked: trigger direct print of receipt
    window.print();
    return;
  }

  const itemsHtml = transaction.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 4px 0; border-bottom: 1px dashed #ddd; font-size: 11px;">
          <strong>${item.product.title}</strong><br/>
          <span style="color: #666; font-size: 10px;">${item.quantity} x ${formatCOP(item.product.price)}</span>
        </td>
        <td style="padding: 4px 0; border-bottom: 1px dashed #ddd; text-align: right; font-size: 11px; font-weight: bold;">
          ${formatCOP(item.quantity * item.product.price * (1 - (item.discount || 0) / 100))}
        </td>
      </tr>
    `
    )
    .join('');

  const taxRows = transaction.taxBreakdown && transaction.taxBreakdown.length > 0
    ? transaction.taxBreakdown
        .map(
          (t) => `
          <div style="display: flex; justify-content: space-between; font-size: 10px; color: #555;">
            <span>IVA ${t.rate}% (Base ${formatCOP(t.baseAmount)}):</span>
            <span>${formatCOP(t.taxAmount)}</span>
          </div>
        `
        )
        .join('')
    : `<div style="display: flex; justify-content: space-between; font-size: 10px; color: #555;">
         <span>IVA incluido:</span>
         <span>${formatCOP(transaction.tax)}</span>
       </div>`;

  const dateStr = transaction.timestamp instanceof Date 
    ? transaction.timestamp.toLocaleString('es-CO') 
    : new Date(transaction.timestamp).toLocaleString('es-CO');

  const invoiceHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Factura POS #${transaction.id}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 4mm;
          }
          body {
            font-family: 'Courier New', Courier, monospace, system-ui, sans-serif;
            font-size: 11px;
            line-height: 1.3;
            color: #000;
            background: #fff;
            padding: 10px;
            max-width: 320px;
            margin: 0 auto;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .double-divider { border-top: 2px dashed #000; margin: 10px 0; }
          table { width: 100%; border-collapse: collapse; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="text-center">
          <img src="https://res.cloudinary.com/unhl90nr/image/upload/v1788376390/logo_sl8qs4.png" alt="Logo" style="width: 54px; height: 54px; border-radius: 50%; object-fit: contain; margin: 0 auto 6px auto; display: block;" />
          <h2 style="margin: 0 0 2px 0; font-size: 16px; font-weight: 900;">TIENDA MIXTA LA ESQUINITA</h2>
          <div style="font-size: 10px; color: #333;">NIT: 901.482.391-4 • Régimen Simple</div>
          <div style="font-size: 10px; color: #333;">Cl. 45 #23-18, Barrio El Prado</div>
          <div style="font-size: 10px; color: #333;">Tel: (604) 321-4567 • Cel/Nequi: 312 456 7890</div>
        </div>

        <div class="divider"></div>

        <div style="font-size: 10px;">
          <div><strong>Factura de Venta POS:</strong> #${transaction.id}</div>
          <div><strong>Fecha / Hora:</strong> ${dateStr}</div>
          <div><strong>Cajero:</strong> ${transaction.cashierName || 'Caja Principal'}</div>
          ${transaction.customerName ? `<div><strong>Cliente:</strong> ${transaction.customerName}</div>` : ''}
          ${transaction.customerDocument ? `<div><strong>Doc / CC:</strong> ${transaction.customerDocument}</div>` : ''}
          <div><strong>Medio de Pago:</strong> ${transaction.paymentMethod}</div>
        </div>

        <div class="divider"></div>

        <table>
          <thead>
            <tr style="border-bottom: 1px solid #000;">
              <th style="text-align: left; font-size: 10px; padding-bottom: 4px;">DESCRIPCIÓN</th>
              <th style="text-align: right; font-size: 10px; padding-bottom: 4px;">VALOR</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="divider"></div>

        <div style="display: flex; justify-content: space-between; font-size: 11px;">
          <span>Subtotal:</span>
          <span>${formatCOP(transaction.subtotal)}</span>
        </div>
        ${transaction.discount > 0 ? `
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: #c00;">
            <span>Descuento:</span>
            <span>-${formatCOP(transaction.discount)}</span>
          </div>
        ` : ''}
        ${taxRows}

        <div class="double-divider"></div>

        <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 900;">
          <span>TOTAL:</span>
          <span>${formatCOP(transaction.total)}</span>
        </div>

        ${transaction.paymentMethod === 'Efectivo' && transaction.amountReceived ? `
          <div style="margin-top: 6px; font-size: 10px;">
            <div style="display: flex; justify-content: space-between;">
              <span>Recibido:</span>
              <span>${formatCOP(transaction.amountReceived)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: bold;">
              <span>Cambio / Vueltas:</span>
              <span>${formatCOP(transaction.change || 0)}</span>
            </div>
          </div>
        ` : ''}

        <div class="divider"></div>

        <div class="text-center" style="font-size: 10px; color: #444; margin-top: 8px;">
          <p style="margin: 2px 0;">¡Muchas gracias por su compra!</p>
          <p style="margin: 2px 0;">Conserve este comprobante para cualquier reclamo.</p>
          <p style="margin: 4px 0 0 0; font-size: 8px; color: #888;">Software POS La Esquinita • Cloud Edition</p>
        </div>

        <div class="no-print" style="margin-top: 20px; text-align: center;">
          <button onclick="window.print()" style="padding: 8px 16px; background: #214C6A; color: #fff; border: none; font-weight: bold; cursor: pointer;">
            Imprimir Comprobante
          </button>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(invoiceHtml);
  printWindow.document.close();

  if (autoDownload) {
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 400);
  }
}
