import React, { useState, useEffect } from 'react';
import { PaymentMethodType, CartItem, Customer } from '@/types';
import { formatCOP } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { 
  DollarSign, 
  Smartphone, 
  CreditCard, 
  BookOpen, 
  X, 
  CheckCircle, 
  Calculator,
  UserCheck,
  Users,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Check
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  customerName: string;
  onCustomerNameChange?: (name: string) => void;
  customers?: Customer[];
  onOpenCustomerDirectory?: () => void;
  onCompleteSale: (
    method: PaymentMethodType,
    amountReceived?: number,
    change?: number,
    customDetails?: string
  ) => void;
}

// Function to calculate breakdown of Colombian bills for change
function getColombianChangeBreakdown(changeAmount: number): string[] {
  if (changeAmount <= 0) return [];
  const bills = [
    { value: 50000, name: 'billete(s) de $50.000' },
    { value: 20000, name: 'billete(s) de $20.000' },
    { value: 10000, name: 'billete(s) de $10.000' },
    { value: 5000, name: 'billete(s) de $5.000' },
    { value: 2000, name: 'billete(s) de $2.000' },
    { value: 1000, name: 'moneda(s) de $1.000' },
    { value: 500, name: 'moneda(s) de $500' },
    { value: 200, name: 'moneda(s) de $200' },
    { value: 100, name: 'moneda(s) de $100' },
    { value: 50, name: 'moneda(s) de $50' },
  ];

  const breakdown: string[] = [];
  let remaining = changeAmount;

  for (const bill of bills) {
    if (remaining >= bill.value) {
      const count = Math.floor(remaining / bill.value);
      breakdown.push(`${count} ${bill.name}`);
      remaining = remaining % bill.value;
    }
  }

  return breakdown;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  total,
  discount,
  customerName,
  onCustomerNameChange,
  customers = [],
  onOpenCustomerDirectory,
  onCompleteSale,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('Efectivo');
  const [amountReceived, setAmountReceived] = useState<number>(total);
  const [customRef, setCustomRef] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [creditValidationError, setCreditValidationError] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setAmountReceived(total);
      setCustomRef('');
      setIsProcessing(false);
      setCreditValidationError(false);
    }
  }, [isOpen, total]);

  if (!isOpen) return null;

  const change = Math.max(0, amountReceived - total);
  const isInsufficientCash = selectedMethod === 'Efectivo' && amountReceived < total;
  const changeBreakdown = getColombianChangeBreakdown(change);

  // Colombian cash bill presets
  const billButtons = [
    { label: '$2.000', value: 2000 },
    { label: '$5.000', value: 5000 },
    { label: '$10.000', value: 10000 },
    { label: '$20.000', value: 20000 },
    { label: '$50.000', value: 50000 },
    { label: '$100.000', value: 100000 },
  ];

  const handleFinish = () => {
    if (isInsufficientCash || isProcessing) return;

    // Validate customer when paying with credit/fiado
    if (
      selectedMethod === 'Crédito / Fiado' &&
      (!customerName || customerName.trim() === '' || customerName === 'Consumidor Final')
    ) {
      setCreditValidationError(true);
      return;
    }

    setIsProcessing(true);

    // Trigger confetti celebration
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#60a5fa', '#93c5fd', '#10b981', '#f59e0b'],
      });
    } catch {
      // ignore
    }

    // Short feedback delay so user sees processing and receipt generation
    setTimeout(() => {
      onCompleteSale(
        selectedMethod,
        selectedMethod === 'Efectivo' ? amountReceived : total,
        selectedMethod === 'Efectivo' ? change : 0,
        customRef
      );
      setIsProcessing(false);
    }, 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleFinish();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-[#222E3A]/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#FFF9F0] rounded-none max-w-lg w-full shadow-2xl border-2 border-[#214C6A] overflow-hidden flex flex-col max-h-[94vh] text-[#222E3A]">
        {/* Modal Header */}
        <div className="p-3.5 sm:p-4 bg-[#214C6A] border-b border-white/20 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none bg-[#BC6343] border border-white/20 flex items-center justify-center text-white shadow-xs">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-[#FFF9F0]" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#EB9D52]">
                Punto de Venta • Caja Principal
              </span>
              <h3 className="text-base sm:text-lg font-bold font-title text-[#FFF9F0]">
                Confirmar Cobro y Facturar
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="w-7 h-7 rounded-none bg-[#1a3d55] hover:bg-[#0f2433] flex items-center justify-center text-[#F6E1C6] hover:text-white transition-colors cursor-pointer border border-white/10 disabled:opacity-50"
            title="Cancelar cobro"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3.5 sm:p-5 overflow-y-auto space-y-3.5 flex-1" onKeyDown={handleKeyDown}>
          {/* Big Total Box */}
          <div className="bg-[#F6E1C6]/70 rounded-none p-3 border border-[#214C6A]/20 text-center shadow-xs relative">
            <span className="text-xs font-bold text-[#56291D] uppercase tracking-wider">
              Total a Recibir del Cliente (COP)
            </span>
            <div className="text-3xl sm:text-4xl font-black text-[#BC6343] font-secondary mt-0.5">
              {formatCOP(total)}
            </div>
            {discount > 0 && (
              <span className="text-xs text-rose-700 font-bold block mt-0.5">
                (Ahorro total aplicado: -{formatCOP(discount)})
              </span>
            )}
          </div>

          {/* Customer Selection Box */}
          <div className="bg-[#FFF9F0] border-2 border-[#214C6A]/30 p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#214C6A] flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-[#BC6343]" />
                <span>Cliente Asignado a la Factura:</span>
              </label>
              {onCustomerNameChange && (
                <div className="flex items-center gap-1">
                  {customerName && customerName !== 'Consumidor Final' && (
                    <button
                      type="button"
                      onClick={() => onCustomerNameChange('Consumidor Final')}
                      className="text-[10px] text-rose-700 hover:text-rose-900 font-bold underline cursor-pointer"
                    >
                      Consumidor Final
                    </button>
                  )}
                  {onOpenCustomerDirectory && (
                    <button
                      type="button"
                      onClick={onOpenCustomerDirectory}
                      className="px-2 py-0.5 bg-[#214C6A] text-white text-[10px] font-bold rounded-none cursor-pointer flex items-center gap-1 hover:bg-[#1a3d55]"
                    >
                      <Users className="w-3 h-3" />
                      <span>Directorio</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={customerName}
                onChange={(e) => {
                  if (onCustomerNameChange) {
                    onCustomerNameChange(e.target.value);
                    if (creditValidationError) setCreditValidationError(false);
                  }
                }}
                placeholder="Nombre del cliente o NIT / Cédula"
                className="flex-1 text-xs px-2.5 py-1.5 bg-white border border-[#214C6A]/30 rounded-none font-bold text-[#214C6A] focus:outline-none focus:ring-1 focus:ring-[#214C6A]"
              />
              {onCustomerNameChange && customerName && (
                <button
                  type="button"
                  onClick={() => onCustomerNameChange('')}
                  className="px-2 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-none cursor-pointer"
                  title="Borrar campo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick customer selection buttons */}
            {onCustomerNameChange && customers.length > 0 && (
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pt-0.5">
                {customers.slice(0, 5).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onCustomerNameChange(c.name);
                      if (creditValidationError) setCreditValidationError(false);
                    }}
                    className={`px-2 py-0.5 text-[9px] font-bold shrink-0 border transition-all cursor-pointer ${
                      customerName === c.name
                        ? 'bg-[#214C6A] text-white border-[#214C6A]'
                        : 'bg-[#F6E1C6]/70 text-[#56291D] border-[#214C6A]/20 hover:bg-[#F6E1C6]'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Validation Alert for Credit without customer */}
          {creditValidationError && (
            <div className="p-2.5 bg-rose-50 border-2 border-rose-500 text-rose-900 text-xs rounded-none flex items-start gap-2 animate-fadeIn">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">¡Cliente requerido para fiados!</strong>
                <span>Debes ingresar el nombre del cliente o seleccionarlo del directorio para anotar la deuda en su cuenta de crédito.</span>
              </div>
            </div>
          )}

          {/* Payment Method Selector */}
          <div>
            <label className="text-xs font-bold text-[#214C6A] mb-2 block uppercase tracking-wide">
              1. Selecciona cómo paga el cliente:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedMethod('Efectivo');
                  setAmountReceived(total);
                  setCreditValidationError(false);
                }}
                className={`p-2.5 rounded-none border-2 flex flex-col items-center justify-center gap-1 text-xs font-bold transition-all cursor-pointer ${
                  selectedMethod === 'Efectivo'
                    ? 'bg-[#214C6A] text-white border-[#214C6A] shadow-xs'
                    : 'bg-[#FFF9F0] hover:bg-[#F6E1C6]/50 text-[#222E3A] border-[#214C6A]/20'
                }`}
              >
                <DollarSign className="w-5 h-5 text-[#EB9D52]" />
                <span>Efectivo</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedMethod('Nequi / Daviplata');
                  setCreditValidationError(false);
                }}
                className={`p-2.5 rounded-none border-2 flex flex-col items-center justify-center gap-1 text-xs font-bold transition-all cursor-pointer ${
                  selectedMethod === 'Nequi / Daviplata'
                    ? 'bg-[#214C6A] text-white border-[#214C6A] shadow-xs'
                    : 'bg-[#FFF9F0] hover:bg-[#F6E1C6]/50 text-[#222E3A] border-[#214C6A]/20'
                }`}
              >
                <Smartphone className="w-5 h-5 text-[#EB9D52]" />
                <span>Nequi / Davi</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedMethod('Tarjeta Débito/Crédito');
                  setCreditValidationError(false);
                }}
                className={`p-2.5 rounded-none border-2 flex flex-col items-center justify-center gap-1 text-xs font-bold transition-all cursor-pointer ${
                  selectedMethod === 'Tarjeta Débito/Crédito'
                    ? 'bg-[#214C6A] text-white border-[#214C6A] shadow-xs'
                    : 'bg-[#FFF9F0] hover:bg-[#F6E1C6]/50 text-[#222E3A] border-[#214C6A]/20'
                }`}
              >
                <CreditCard className="w-5 h-5 text-[#EB9D52]" />
                <span>Datáfono</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('Crédito / Fiado')}
                className={`p-2.5 rounded-none border-2 flex flex-col items-center justify-center gap-1 text-xs font-bold transition-all cursor-pointer ${
                  selectedMethod === 'Crédito / Fiado'
                    ? 'bg-[#964937] text-white border-[#964937] shadow-xs'
                    : 'bg-[#FFF9F0] hover:bg-[#F6E1C6]/50 text-[#222E3A] border-[#214C6A]/20'
                }`}
              >
                <BookOpen className="w-5 h-5 text-[#EB9D52]" />
                <span>Fiado</span>
              </button>
            </div>
          </div>

          {/* Dynamic Content: Efectivo with Bill Helper & Change Calculator */}
          {selectedMethod === 'Efectivo' && (
            <div className="space-y-3 bg-[#F6E1C6]/50 p-3 sm:p-3.5 rounded-none border border-[#214C6A]/20">
              <label className="text-xs font-bold text-[#214C6A] flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-[#BC6343]" />
                2. ¿Cuánto dinero en efectivo te entregó el cliente?
              </label>

              {/* Cash Input with Exact button */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#63665B]">
                    $
                  </span>
                  <input
                    type="number"
                    value={amountReceived ? amountReceived : ''}
                    onChange={(e) => setAmountReceived(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full pl-8 pr-3 py-2 bg-[#FFF9F0] border border-[#214C6A]/30 rounded-none text-base font-black text-[#222E3A] focus:ring-1 focus:ring-[#214C6A] focus:outline-none"
                    autoFocus
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setAmountReceived(total)}
                  className="px-3.5 py-2 rounded-none bg-[#214C6A] hover:bg-[#1a3d55] text-white text-xs font-extrabold shadow-xs cursor-pointer transition-all active:scale-95 shrink-0"
                >
                  Pago Exacto
                </button>
              </div>

              {/* Colombian Banknote Fast Selection Pills */}
              <div>
                <span className="text-[11px] text-[#63665B] block mb-1.5 font-medium">
                  Toca el billete recibido para calcular automáticamente:
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {billButtons.map((bill) => {
                    const isSelected = amountReceived === bill.value;
                    return (
                      <button
                        key={bill.label}
                        type="button"
                        onClick={() => setAmountReceived(bill.value)}
                        className={`py-2 px-1 rounded-none text-xs font-extrabold border transition-all cursor-pointer active:scale-95 shadow-2xs ${
                          isSelected
                            ? 'bg-[#214C6A] text-[#EB9D52] border-[#214C6A] ring-2 ring-[#EB9D52]'
                            : 'bg-[#214C6A] hover:bg-[#1a3d55] text-white border-[#214C6A]'
                        }`}
                      >
                        {bill.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Insufficient Cash Warning */}
              {isInsufficientCash && (
                <div className="p-2 bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center justify-between gap-2 animate-fadeIn">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Faltan <strong>{formatCOP(total - amountReceived)}</strong> para el total</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAmountReceived(total)}
                    className="px-2 py-0.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-[10px] cursor-pointer"
                  >
                    Completar
                  </button>
                </div>
              )}

              {/* Change Box Display */}
              <div className="bg-[#FFF9F0] p-3 rounded-none border border-[#214C6A]/20">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#56291D] uppercase">
                    Cambio / Vueltas a entregar:
                  </span>
                  <span className="text-2xl font-black text-[#214C6A] font-secondary">
                    {formatCOP(change)}
                  </span>
                </div>

                {change > 0 && changeBreakdown.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-[#214C6A]/10 text-xs">
                    <span className="font-semibold text-[#56291D] block mb-1">
                      Sugerencia de billetes y monedas:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {changeBreakdown.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-none bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-[10px]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Nequi / Daviplata instructions */}
          {selectedMethod === 'Nequi / Daviplata' && (
            <div className="bg-[#F6E1C6]/50 p-3 sm:p-3.5 rounded-none border border-[#214C6A]/20 text-center space-y-2">
              <div className="w-9 h-9 rounded-none bg-[#214C6A] text-[#FFF9F0] flex items-center justify-center mx-auto shadow-xs">
                <Smartphone className="w-5 h-5 text-[#EB9D52]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#214C6A]">Transferencia Nequi / Daviplata</h4>
                <p className="text-xs text-[#56291D]">Número de la tienda: <strong className="font-mono text-base text-[#BC6343] underline">310 847 9201</strong></p>
                <p className="text-[11px] text-[#63665B] mt-0.5">Pide al cliente que te muestre el comprobante exitoso por <strong>{formatCOP(total)}</strong></p>
              </div>
              <input
                type="text"
                value={customRef}
                onChange={(e) => setCustomRef(e.target.value)}
                placeholder="Código de aprobación / M-XXXXX (Opcional)"
                className="w-full px-3 py-1.5 bg-[#FFF9F0] rounded-none border border-[#214C6A]/30 text-xs font-medium text-[#222E3A] placeholder-[#63665B]/60 focus:ring-1 focus:ring-[#214C6A] focus:outline-none"
              />
            </div>
          )}

          {/* Datáfono / Tarjeta */}
          {selectedMethod === 'Tarjeta Débito/Crédito' && (
            <div className="bg-[#F6E1C6]/50 p-3 sm:p-3.5 rounded-none border border-[#214C6A]/20 text-center space-y-2">
              <div className="w-9 h-9 rounded-none bg-[#214C6A] text-[#FFF9F0] flex items-center justify-center mx-auto shadow-xs">
                <CreditCard className="w-5 h-5 text-[#EB9D52]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#214C6A]">Datáfono / Redeban / Bold</h4>
                <p className="text-xs text-[#56291D]">Digita en el datáfono el valor exacto: <strong className="text-base text-[#BC6343]">{formatCOP(total)}</strong></p>
              </div>
              <input
                type="text"
                value={customRef}
                onChange={(e) => setCustomRef(e.target.value)}
                placeholder="Número de voucher o últimos 4 dígitos (Opcional)"
                className="w-full px-3 py-1.5 bg-[#FFF9F0] rounded-none border border-[#214C6A]/30 text-xs font-medium text-[#222E3A] placeholder-[#63665B]/60 focus:ring-1 focus:ring-[#214C6A] focus:outline-none"
              />
            </div>
          )}

          {/* Cuaderno de Fiados */}
          {selectedMethod === 'Crédito / Fiado' && (
            <div className="bg-[#F6E1C6]/50 p-3 sm:p-3.5 rounded-none border border-[#214C6A]/20 space-y-2">
              <div className="flex items-center gap-2 text-[#56291D]">
                <BookOpen className="w-5 h-5 text-[#BC6343]" />
                <h4 className="text-sm font-bold">Anotar en Cuaderno de Fiados</h4>
              </div>
              <p className="text-xs text-[#56291D] leading-relaxed">
                Esta venta de <strong className="text-[#BC6343]">{formatCOP(total)}</strong> quedará registrada como cuenta por cobrar a nombre de <strong>{customerName || 'Cliente'}</strong>.
              </p>
              <input
                type="text"
                value={customRef}
                onChange={(e) => setCustomRef(e.target.value)}
                placeholder="Nota (ej: Paga el sábado, vecino del apto 302...)"
                className="w-full px-3 py-1.5 bg-[#FFF9F0] rounded-none border border-[#214C6A]/30 text-xs font-medium text-[#222E3A] placeholder-[#63665B]/60 focus:ring-1 focus:ring-[#214C6A] focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="p-3 sm:p-3.5 bg-[#FFF9F0] border-t-2 border-[#214C6A] flex items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-3.5 py-2.5 rounded-none bg-[#F6E1C6]/60 hover:bg-[#F6E1C6] border border-[#214C6A]/20 text-[#56291D] text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            id="btn-finalizar-venta"
            onClick={handleFinish}
            disabled={isInsufficientCash || isProcessing}
            className="flex-1 py-3 px-3 sm:px-4 rounded-none btn-checkout-prominent disabled:opacity-40 disabled:cursor-not-allowed text-[#FFF9F0] text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 text-[#EB9D52] animate-spin" />
                <span>Generando Factura POS...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#EB9D52]" />
                <span className="truncate">Finalizar y Facturar • {formatCOP(total)}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
