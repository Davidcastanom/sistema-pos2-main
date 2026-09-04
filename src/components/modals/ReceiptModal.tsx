import React, { useRef, useState } from 'react';
import { SaleTransaction, StoreInfo } from '@/types';
import { formatCOP } from '@/lib/utils';
import { 
  generateInvoicePDF, 
  printThermalReceipt, 
  getWhatsAppShareUrl, 
  getInvoicePlainText,
  getSavedStoreInfo
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
  Receipt,
  Store,
  Image as ImageIcon
} from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: SaleTransaction | null;
  onNewSale: () => void;
  storeInfo?: StoreInfo;
  onOpenStoreInfo?: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onNewSale,
  storeInfo,
  onOpenStoreInfo,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>('80mm');

  const activeStore = storeInfo || getSavedStoreInfo();

  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    printThermalReceipt(transaction, activeStore);
  };

  const handleDownloadPDF = () => {
    try {
      generateInvoicePDF(transaction, true, activeStore);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Error generating PDF invoice:', err);
    }
  };

  const handleCopyText = async () => {
    try {
      const text = getInvoicePlainText(transaction, activeStore);
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
    const url = getWhatsAppShareUrl(transaction, activeStore);
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

        {/* Printable Thermal Receipt Container (Scrollable stage with no cutoffs) */}
        <div className="p-3 sm:p-5 bg-slate-900/10 flex flex-col items-center overflow-y-auto flex-1 min-h-0 scroll-smooth">
          {/* Paper roll format switcher */}
          <div className="flex items-center justify-between w-full max-w-[340px] mb-2 px-1 text-[11px] shrink-0">
            <span className="text-slate-600 font-semibold text-[10.5px]">Formato de Impresión:</span>
            <div className="inline-flex bg-slate-200/90 p-0.5 rounded-lg text-slate-700 text-[10.5px]">
              <button
                type="button"
                onClick={() => setPaperWidth('80mm')}
                className={`px-2.5 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                  paperWidth === '80mm'
                    ? 'bg-[#214C6A] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                80mm Estándar
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth('58mm')}
                className={`px-2.5 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                  paperWidth === '58mm'
                    ? 'bg-[#214C6A] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                58mm Mini
              </button>
            </div>
          </div>

          {/* Continuous Thermal Ticket Card */}
          <div
            ref={receiptRef}
            className={`print-only-receipt w-full ${
              paperWidth === '80mm' ? 'max-w-[340px]' : 'max-w-[275px] text-[10px]'
            } bg-white p-4 sm:p-5 shadow-[0_4px_25px_rgba(0,0,0,0.12)] rounded-none border border-slate-300 font-mono text-slate-800 space-y-2.5 mb-6 print:shadow-none print:border-none print:m-0 print:p-2 relative`}
          >
            {/* Header */}
            <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-2.5">
              {/* 1:1 Circular Store Logo */}
              <div className="flex justify-center mb-1.5">
                <div className="w-16 h-16 rounded-full border-2 border-[#214C6A] p-0.5 bg-white shadow-2xs overflow-hidden flex items-center justify-center aspect-square">
                  {activeStore.logoUrl ? (
                    <img
                      src={activeStore.logoUrl}
                      alt={activeStore.name}
                      className="w-full h-full object-contain rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[#214C6A] font-bold text-xs">
                      {activeStore.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              <div className="font-bold text-xs text-slate-900 tracking-wider">
                {activeStore.name.toUpperCase()}
              </div>
              {activeStore.shortName && activeStore.shortName.toUpperCase() !== activeStore.name.toUpperCase() && (
                <div className="font-extrabold text-sm text-[#214C6A]">
                  {activeStore.shortName.toUpperCase()}
                </div>
              )}
              <div className="text-[9.5px]">NIT: {activeStore.nit}{activeStore.regimen ? ` • ${activeStore.regimen}` : ''}</div>
              <div className="text-[9.5px]">{activeStore.address}{activeStore.city ? `, ${activeStore.city}` : ''}</div>
              <div className="text-[9.5px]">
                {[activeStore.landline ? `Tel: ${activeStore.landline}` : '', activeStore.phone ? `Cel: ${activeStore.phone}` : ''].filter(Boolean).join(' • ')}
              </div>
              
              {onOpenStoreInfo && (
                <div className="pt-1 flex justify-center">
                  <button
                    type="button"
                    onClick={onOpenStoreInfo}
                    className="inline-flex items-center gap-1.5 text-[10px] font-sans font-bold text-[#214C6A] bg-[#FFF9F0] hover:bg-[#F6E1C6] border border-[#214C6A]/25 px-2.5 py-1 rounded-full transition-colors cursor-pointer shadow-2xs"
                    title="Editar logotipo 1:1 circular y datos oficiales"
                  >
                    <ImageIcon className="w-3 h-3 text-[#BC6343]" />
                    <span>Editar Logo (1:1 en Círculo)</span>
                  </button>
                </div>
              )}
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
              <p className="font-semibold">{activeStore.invoiceFooterMessage || '¡GRACIAS POR SU COMPRA!'}</p>
              <p>Conserve esta tirilla para cualquier reclamo o garantía.</p>
              {activeStore.resolutionInfo && (
                <p className="text-[8px] text-slate-400">{activeStore.resolutionInfo}</p>
              )}
              <p className="text-[8.5px] text-slate-400">Software POS {activeStore.shortName || activeStore.name}</p>
            </div>

            {/* Jagged Thermal Paper Cut Edge (Visual roll finish) */}
            <div className="w-full h-3 -mb-5 mt-4 overflow-hidden relative opacity-70">
              <svg className="w-full h-full text-slate-300" preserveAspectRatio="none" viewBox="0 0 120 12">
                <path
                  d="M0,0 L5,8 L10,0 L15,8 L20,0 L25,8 L30,0 L35,8 L40,0 L45,8 L50,0 L55,8 L60,0 L65,8 L70,0 L75,8 L80,0 L85,8 L90,0 L95,8 L100,0 L105,8 L110,0 L115,8 L120,0 L120,12 L0,12 Z"
                  fill="currentColor"
                />
              </svg>
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
