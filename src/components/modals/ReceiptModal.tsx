import React, { useRef, useState } from 'react';
import { SaleTransaction } from '@/types';
import { formatCOP } from '@/lib/utils';
import { 
  generateInvoicePDF, 
  printThermalReceipt, 
  getWhatsAppShareUrl, 
  getInvoicePlainText 
} from '@/lib/pdfGenerator';
import { 
  Printer, 
  Check, 
  X, 
  FileDown, 
  ArrowRight, 
  FileText, 
  Share2, 
  Copy, 
  CheckCheck,
  Receipt
} from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: SaleTransaction | null;
  onNewSale: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onNewSale,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);

  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    printThermalReceipt(transaction);
  };

  const handleDownloadPDF = () => {
    try {
      generateInvoicePDF(transaction, true);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Error generating PDF invoice:', err);
    }
  };

  const handleCopyText = async () => {
    try {
      const text = getInvoicePlainText(transaction);
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2500);
    } catch (err) {
      console.error('Could not copy receipt:', err);
    }
  };

  const handleWhatsApp = () => {
    const url = getWhatsAppShareUrl(transaction);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-[#222E3A]/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-[#FFF9F0] rounded-none max-w-md w-full shadow-2xl border-2 border-[#214C6A] overflow-hidden my-4 sm:my-6 text-[#222E3A] flex flex-col max-h-[92vh]">
        {/* Top Success Bar */}
        <div className="p-3.5 sm:p-4 bg-[#214C6A] border-b border-white/20 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none bg-emerald-500/25 border border-emerald-400/50 flex items-center justify-center text-emerald-300">
              <Check className="w-5 h-5 stroke-[3]" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base font-title text-white flex items-center gap-1.5">
                <span>¡Venta Facturada con Éxito!</span>
              </h3>
              <p className="text-[11px] text-[#EB9D52] font-mono font-bold">Factura POS #{transaction.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-none bg-[#1a3d55] hover:bg-[#0f2433] flex items-center justify-center text-[#F6E1C6] hover:text-white transition-colors cursor-pointer border border-white/10"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Feedback Alert */}
        {downloadSuccess && (
          <div className="bg-emerald-100 border-b border-emerald-300 px-4 py-2 text-xs font-bold text-emerald-900 flex items-center gap-2 justify-center animate-fadeIn">
            <FileText className="w-4 h-4 text-emerald-700" />
            <span>¡Factura PDF descargada correctamente en su equipo!</span>
          </div>
        )}

        {copiedSuccess && (
          <div className="bg-sky-100 border-b border-sky-300 px-4 py-2 text-xs font-bold text-sky-900 flex items-center gap-2 justify-center animate-fadeIn">
            <CheckCheck className="w-4 h-4 text-sky-700" />
            <span>¡Texto de la factura copiado al portapapeles!</span>
          </div>
        )}

        {/* Printable Thermal Receipt Card */}
        <div className="p-3 sm:p-5 bg-[#F6E1C6]/35 flex justify-center overflow-y-auto flex-1">
          <div
            ref={receiptRef}
            className="print-only-receipt w-full max-w-[340px] bg-white p-3.5 sm:p-4 shadow-md rounded-none border border-[#214C6A]/20 font-mono text-[11px] text-slate-800 space-y-2.5 print:shadow-none print:border-none print:m-0 print:p-2"
          >
            {/* Header */}
            <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-2.5">
              <div className="flex justify-center mb-1">
                <img
                  src="https://res.cloudinary.com/unhl90nr/image/upload/v1788376390/logo_sl8qs4.png"
                  alt="Logo Tienda Mixta La Esquinita"
                  className="w-12 h-12 rounded-full object-contain mx-auto"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="font-bold text-xs text-slate-900 tracking-wider">
                TIENDA MIXTA
              </div>
              <div className="font-extrabold text-sm text-[#214C6A]">
                LA ESQUINITA
              </div>
              <div className="text-[9.5px]">NIT: 900.842.193-4 • Régimen Simple</div>
              <div className="text-[9.5px]">Cra 43A # 18 Sur - 45, Medellín</div>
              <div className="text-[9.5px]">Tel: (604) 444 8920 • Cel: 310 847 9201</div>
            </div>

            {/* Invoice Info */}
            <div className="border-b border-dashed border-slate-300 pb-2 space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span>FACTURA POS:</span>
                <span className="font-bold text-slate-900">#{transaction.id}</span>
              </div>
              <div className="flex justify-between">
                <span>FECHA / HORA:</span>
                <span>
                  {new Date(transaction.timestamp).toLocaleDateString('es-CO')}{' '}
                  {new Date(transaction.timestamp).toLocaleTimeString('es-CO')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>CAJERO:</span>
                <span>{transaction.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span>CLIENTE:</span>
                <span className="font-bold truncate max-w-[170px]">
                  {transaction.customerName || 'Consumidor Final'}
                </span>
              </div>
              {transaction.customerDocument && (
                <div className="flex justify-between">
                  <span>DOC / CC:</span>
                  <span>{transaction.customerDocument}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>FORMA DE PAGO:</span>
                <span className="font-bold text-[#BC6343]">{transaction.paymentMethod}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="border-b border-dashed border-slate-300 pb-2">
              <div className="flex justify-between font-bold text-[10px] pb-1 border-b border-slate-200">
                <span>CANT. DESCRIPCIÓN</span>
                <span>TOTAL</span>
              </div>
              <div className="space-y-1 pt-1.5">
                {transaction.items.map((item) => {
                  const itemDisc = item.product.discount || 0;
                  const itemIva = item.product.ivaRate ?? 0;
                  const unitPriceEff = item.product.price * (1 - itemDisc / 100);

                  return (
                    <div key={item.product.id} className="flex justify-between items-start gap-1">
                      <div className="min-w-0 pr-1">
                        <div className="font-semibold text-slate-900 truncate">
                          {item.quantity}x {item.product.title}
                        </div>
                        <div className="text-[9px] text-slate-500">
                          {formatCOP(unitPriceEff)} / {item.product.unit || 'und'}
                          {itemIva > 0 && <span className="ml-1 text-slate-600 font-bold">[IVA {itemIva}%]</span>}
                          {itemDisc > 0 && <span className="ml-1 text-rose-600 font-bold">[-{itemDisc}%]</span>}
                        </div>
                      </div>
                      <span className="font-bold shrink-0">
                        {formatCOP(unitPriceEff * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Totals & Tax Breakdown */}
            <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-2">
              <div className="flex justify-between">
                <span>SUBTOTAL BRUTO:</span>
                <span>{formatCOP(transaction.subtotal)}</span>
              </div>
              {transaction.discount > 0 && (
                <div className="flex justify-between text-rose-700 font-bold">
                  <span>DESCUENTO TOTAL:</span>
                  <span>-{formatCOP(transaction.discount)}</span>
                </div>
              )}

              {/* Tax Breakdown */}
              {transaction.taxBreakdown && transaction.taxBreakdown.length > 0 ? (
                <div className="pt-1 border-t border-slate-200 space-y-0.5 text-[9.5px] text-slate-600">
                  {transaction.taxBreakdown.map((tb) => (
                    <div key={tb.rate} className="flex justify-between">
                      <span>{tb.rate === 0 ? 'Base Exenta (0%):' : `Base Gravada (${tb.rate}%):`}</span>
                      <span>{formatCOP(tb.baseAmount)} {tb.rate > 0 && `(IVA: ${formatCOP(tb.taxAmount)})`}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex justify-between text-[9.5px] text-slate-500">
                  <span>TOTAL IVA LIQUIDADO:</span>
                  <span>{formatCOP(transaction.tax || 0)}</span>
                </div>
              )}

              <div className="flex justify-between font-black text-sm text-slate-950 pt-1.5 border-t border-slate-300">
                <span>TOTAL A PAGAR:</span>
                <span className="text-[#BC6343]">{formatCOP(transaction.total)}</span>
              </div>
            </div>

            {/* Payment & Change info */}
            <div className="text-[10px] space-y-0.5 border-b border-dashed border-slate-300 pb-2">
              <div className="flex justify-between">
                <span>MÉTODO:</span>
                <span className="font-bold">{transaction.paymentMethod}</span>
              </div>
              {transaction.amountReceived !== undefined && transaction.amountReceived > 0 && (
                <div className="flex justify-between">
                  <span>RECIBIDO EN EFECTIVO:</span>
                  <span>{formatCOP(transaction.amountReceived)}</span>
                </div>
              )}
              {transaction.change !== undefined && transaction.change > 0 && (
                <div className="flex justify-between font-bold text-[#214C6A]">
                  <span>CAMBIO / VUELTAS:</span>
                  <span>{formatCOP(transaction.change)}</span>
                </div>
              )}
              {transaction.customDetails && (
                <div className="text-[9.5px] text-slate-600 pt-0.5">
                  <span>Nota / Referencia: {transaction.customDetails}</span>
                </div>
              )}
            </div>

            {/* Footer Notice */}
            <div className="text-center text-[9.5px] space-y-1 pt-1 text-slate-600">
              <p className="font-semibold">¡GRACIAS POR SU COMPRA!</p>
              <p>Conserve esta tirilla para cualquier reclamo o garantía.</p>
              <p className="text-[8.5px] text-slate-400">Software POS Tienda Mixta La Esquinita</p>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons: Multi-channel sharing and printing */}
        <div className="p-3 sm:p-4 bg-[#FFF9F0] border-t-2 border-[#214C6A] space-y-2 shrink-0">
          {/* Print & PDF row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
            <button
              onClick={handleDownloadPDF}
              className="py-2 px-2 rounded-none bg-[#214C6A] hover:bg-[#1a3d55] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Descargar archivo PDF oficial en su computador o teléfono"
            >
              <FileDown className="w-3.5 h-3.5 text-[#EB9D52]" />
              <span>Bajar PDF</span>
            </button>

            <button
              onClick={handlePrint}
              className="py-2 px-2 rounded-none bg-[#1a3d55] hover:bg-[#122b3d] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs border border-white/20"
              title="Imprimir directamente en la impresora térmica POS 80mm/58mm"
            >
              <Printer className="w-3.5 h-3.5 text-[#EB9D52]" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={handleWhatsApp}
              className="py-2 px-2 rounded-none bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Enviar tirilla detallada al cliente por WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleCopyText}
              className="py-2 px-2 rounded-none bg-[#FFF9F0] hover:bg-[#F6E1C6] border border-[#214C6A]/30 text-[#56291D] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Copiar texto de la tirilla al portapapeles"
            >
              <Copy className="w-3.5 h-3.5 text-[#BC6343]" />
              <span>Copiar</span>
            </button>
          </div>

          <button
            onClick={() => {
              onNewSale();
              onClose();
            }}
            className="w-full py-2.5 px-3 rounded-none bg-[#BC6343] hover:bg-[#a5533a] text-white text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md border border-[#EB9D52]/50 active:scale-98"
          >
            <Receipt className="w-4 h-4 text-[#EB9D52]" />
            <span>Continuar con Nueva Venta</span>
            <ArrowRight className="w-4 h-4 text-[#EB9D52]" />
          </button>
        </div>
      </div>
    </div>
  );
};
