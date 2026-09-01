import React, { useState } from 'react';
import { CartItem, ProductItem, TaxBreakdownItem, Customer } from '@/types';
import { formatCOP } from '@/lib/utils';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  User, 
  Percent, 
  CreditCard, 
  Receipt, 
  PauseCircle,
  Zap,
  Tag,
  ShieldCheck,
  Users,
  X,
  RotateCcw
} from 'lucide-react';

interface POSCartDrawerProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: string | number, quantity: number) => void;
  onRemoveItem: (productId: string | number) => void;
  onClearCart: () => void;
  onProceedToPayment: () => void;
  discount: number; // percentage global
  onDiscountChange: (discount: number) => void;
  customerName: string;
  onCustomerNameChange: (name: string) => void;
  customers?: Customer[];
  onOpenCustomerDirectory?: () => void;
  parkedSales: { id: string; name: string; items: CartItem[]; timestamp: Date }[];
  onParkCurrentSale: () => void;
  onRestoreParkedSale: (parkedId: string) => void;
  onDeleteParkedSale: (parkedId: string) => void;
  onOpenQuickAmount: () => void;
}

const COMMON_CUSTOMERS = [
  'Consumidor Final',
  'Vecino(a)',
  'Doña Gloria',
  'Don Pedro',
];

export const POSCartDrawer: React.FC<POSCartDrawerProps> = ({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToPayment,
  discount,
  onDiscountChange,
  customerName,
  onCustomerNameChange,
  customers = [],
  onOpenCustomerDirectory,
  parkedSales,
  onParkCurrentSale,
  onRestoreParkedSale,
  onDeleteParkedSale,
  onOpenQuickAmount,
}) => {
  const [showDiscountSelector, setShowDiscountSelector] = useState(false);
  const [showParkedList, setShowParkedList] = useState(false);
  const [showTaxDetails, setShowTaxDetails] = useState(false);

  // Financial Calculations
  // 1. Gross subtotal (original unit prices without product discount)
  const grossSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // 2. Product-level discount savings
  const productDiscountsTotal = cart.reduce((sum, item) => {
    const itemDiscountRate = item.product.discount || 0;
    const itemOriginalPrice = item.product.price * item.quantity;
    return sum + (itemOriginalPrice * itemDiscountRate) / 100;
  }, 0);

  // 3. Subtotal after product-level discounts
  const subtotalAfterProductDiscounts = grossSubtotal - productDiscountsTotal;

  // 4. Cart-level global discount
  const globalDiscountAmount = (subtotalAfterProductDiscounts * discount) / 100;

  // Total discount across all items and global
  const totalSavings = productDiscountsTotal + globalDiscountAmount;

  // 5. Final Net Total to be paid
  const total = Math.max(0, subtotalAfterProductDiscounts - globalDiscountAmount);

  // 6. Detailed Tax Breakdown per IVA rate (0%, 5%, 19%)
  const taxBreakdownMap: Record<number, { base: number; tax: number; total: number }> = {};

  cart.forEach((item) => {
    const ivaRate = item.product.ivaRate ?? 0;
    const itemDiscRate = item.product.discount ?? 0;
    // Effective price for this line after item discount & proportional global discount
    const itemGross = item.product.price * item.quantity;
    const itemNet = itemGross * (1 - itemDiscRate / 100) * (1 - discount / 100);

    // In Colombian retail, price usually includes VAT or is calculated as Base = Net / (1 + Rate)
    const base = itemNet / (1 + ivaRate / 100);
    const tax = itemNet - base;

    if (!taxBreakdownMap[ivaRate]) {
      taxBreakdownMap[ivaRate] = { base: 0, tax: 0, total: 0 };
    }
    taxBreakdownMap[ivaRate].base += base;
    taxBreakdownMap[ivaRate].tax += tax;
    taxBreakdownMap[ivaRate].total += itemNet;
  });

  const totalTaxAmount = Object.values(taxBreakdownMap).reduce((sum, b) => sum + b.tax, 0);
  const totalTaxableBase = Object.values(taxBreakdownMap).reduce((sum, b) => sum + b.base, 0);
  const totalUnits = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <aside className="w-full lg:w-96 xl:w-[420px] shrink-0 bg-[#FFF9F0] rounded-none border-2 border-[#214C6A] shadow-md flex flex-col h-full overflow-hidden text-[#222E3A]">
      {/* Account / Order Header */}
      <div className="p-3.5 bg-[#214C6A] border-b border-[#214C6A] text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-none bg-[#BC6343] border border-white/20 flex items-center justify-center text-white shadow-xs">
            <Receipt className="w-4 h-4 text-[#FFF9F0]" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm font-['Outfit',sans-serif] tracking-tight text-[#FFF9F0] flex items-center gap-2">
              <span>Cuenta de Cobro</span>
              {cart.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-none bg-[#EB9D52] text-[#222E3A] text-[10px] font-black">
                  {totalUnits} uds
                </span>
              )}
            </h2>
            <p className="text-[10px] text-[#F6E1C6]/80 font-medium">
              {cart.length === 0 ? 'Sin artículos en cuenta' : `${cart.length} ref. registradas`}
            </p>
          </div>
        </div>

        {/* Parked Accounts Button */}
        {parkedSales.length > 0 && (
          <button
            onClick={() => setShowParkedList(!showParkedList)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-none bg-[#EB9D52] text-[#222E3A] text-xs font-black shadow-xs hover:bg-[#d8873d] transition-all cursor-pointer"
          >
            <PauseCircle className="w-3.5 h-3.5" />
            <span>En Espera ({parkedSales.length})</span>
          </button>
        )}
      </div>

      {/* Parked Accounts Drawer view if toggled */}
      {showParkedList && parkedSales.length > 0 && (
        <div className="bg-[#F6E1C6] border-b border-[#214C6A]/20 p-3 max-h-48 overflow-y-auto space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#56291D]">Cuentas Pausadas</span>
            <button
              onClick={() => setShowParkedList(false)}
              className="text-[10px] text-[#BC6343] hover:text-[#56291D] font-bold cursor-pointer uppercase"
            >
              Cerrar ✕
            </button>
          </div>
          {parkedSales.map((ps) => {
            const psTotal = ps.items.reduce((s, i) => s + i.product.price * i.quantity, 0);
            return (
              <div
                key={ps.id}
                className="bg-[#FFF9F0] rounded-none p-2 border border-[#214C6A]/20 flex items-center justify-between gap-2"
              >
                <div>
                  <div className="text-xs font-bold text-[#222E3A]">{ps.name}</div>
                  <div className="text-[10px] text-[#63665B]">
                    {ps.items.length} prods • {formatCOP(psTotal)}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      onRestoreParkedSale(ps.id);
                      setShowParkedList(false);
                    }}
                    className="px-2 py-0.5 rounded-none bg-[#214C6A] hover:bg-[#1a3d55] text-white text-[10px] font-bold cursor-pointer"
                  >
                    Retomar
                  </button>
                  <button
                    onClick={() => onDeleteParkedSale(ps.id)}
                    className="p-1 rounded-none text-[#63665B] hover:text-[#e74c3c] cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Customer Field with Quick Selection and Removal */}
      <div className="p-2.5 bg-[#F6E1C6]/60 border-b border-[#214C6A]/15 space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-[#214C6A] flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-[#BC6343] shrink-0" />
            <span>Cliente en Factura:</span>
          </label>
          <div className="flex items-center gap-1.5">
            {customerName && customerName !== 'Consumidor Final' && (
              <button
                type="button"
                onClick={() => onCustomerNameChange('Consumidor Final')}
                className="text-[10px] text-rose-700 hover:text-rose-900 font-bold underline cursor-pointer"
                title="Quitar nombre del cliente y dejar Consumidor Final"
              >
                ✕ Quitar (Consumidor Final)
              </button>
            )}
            {onOpenCustomerDirectory && (
              <button
                type="button"
                onClick={onOpenCustomerDirectory}
                className="px-2 py-0.5 rounded-none bg-[#214C6A] text-white text-[10px] font-bold cursor-pointer flex items-center gap-1 hover:bg-[#1a3d55]"
                title="Buscar o registrar clientes en el directorio"
              >
                <Users className="w-3 h-3" />
                <span>Directorio</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <input
            type="text"
            value={customerName}
            onChange={(e) => onCustomerNameChange(e.target.value)}
            placeholder="Escribe el nombre del cliente o digita su Cédula..."
            className="flex-1 text-xs bg-[#FFF9F0] px-2.5 py-1 rounded-none border border-[#214C6A]/30 text-[#222E3A] placeholder-[#63665B]/60 focus:outline-none focus:ring-1 focus:ring-[#214C6A] font-bold"
          />
          {customerName && (
            <button
              type="button"
              onClick={() => onCustomerNameChange('')}
              className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-none cursor-pointer"
              title="Borrar campo de cliente"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick Customer Pills */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pt-0.5">
          {['Consumidor Final', ...(customers || []).filter(c => c.name !== 'Consumidor Final').slice(0, 4).map(c => c.name)].map((cust) => (
            <button
              key={cust}
              type="button"
              onClick={() => onCustomerNameChange(cust)}
              className={`px-2 py-0.5 rounded-none text-[9px] font-bold shrink-0 border transition-all cursor-pointer ${
                customerName === cust
                  ? 'bg-[#214C6A] text-[#FFF9F0] border-[#214C6A]'
                  : 'bg-[#FFF9F0] text-[#63665B] border-[#214C6A]/20 hover:text-[#222E3A]'
              }`}
            >
              {cust}
            </button>
          ))}
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2 max-h-[380px] lg:max-h-[360px]">
        {cart.length === 0 ? (
          <div className="h-full min-h-[190px] flex flex-col items-center justify-center text-center p-4 text-[#63665B] space-y-2.5">
            <div className="w-12 h-12 rounded-none bg-[#214C6A]/10 border border-[#214C6A]/20 text-[#214C6A] flex items-center justify-center">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#214C6A]">Cuenta lista para cobrar</p>
              <p className="text-[11px] text-[#63665B] max-w-[210px] mt-0.5">
                Toca cualquier producto o digita un valor rápido para agregarlo.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenQuickAmount}
              className="px-3 py-1 rounded-none bg-[#BC6343] hover:bg-[#a5533a] text-[#FFF9F0] text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <Zap className="w-3.5 h-3.5 text-[#EB9D52]" />
              <span>Digitar Monto Rápido</span>
            </button>
          </div>
        ) : (
          cart.map((item) => {
            const itemDisc = item.product.discount || 0;
            const unitPriceAfterDisc = item.product.price * (1 - itemDisc / 100);
            const lineTotal = unitPriceAfterDisc * item.quantity;
            const isStockMax = item.quantity >= item.product.stock;
            const ivaRate = item.product.ivaRate ?? 0;

            return (
              <div
                key={item.product.id}
                className="bg-[#FFF9F0] hover:bg-white rounded-none p-2 border border-[#214C6A]/20 transition-all flex items-center gap-2 group shadow-2xs"
              >
                {/* Product Thumbnail */}
                <img
                  src={item.product.imageUrl}
                  alt={item.product.title}
                  className="w-10 h-10 rounded-none object-cover border border-[#214C6A]/15 shrink-0"
                />

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 flex-wrap">
                    <h4 className="text-xs font-bold text-[#222E3A] truncate font-['Outfit',sans-serif]">
                      {item.product.title}
                    </h4>
                    <span className={`text-[8px] font-extrabold px-1 py-0.2 rounded-none border ${
                      ivaRate > 0 ? 'bg-[#214C6A]/10 text-[#214C6A] border-[#214C6A]/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {ivaRate > 0 ? `IVA ${ivaRate}%` : '0% Exento'}
                    </span>
                    {itemDisc > 0 && (
                      <span className="text-[8px] font-black px-1 py-0.2 rounded-none bg-rose-600 text-white">
                        -{itemDisc}%
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-[#63665B] font-medium mt-0.5">
                    {formatCOP(unitPriceAfterDisc)} c/u {itemDisc > 0 && <span className="line-through text-[9px] text-[#63665B]/60">{formatCOP(item.product.price)}</span>}
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-1.5 mt-1">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                      className="w-6 h-6 rounded-none bg-[#F6E1C6] hover:bg-[#ebd0b0] border border-[#214C6A]/20 flex items-center justify-center text-[#56291D] font-bold text-xs active:scale-95 cursor-pointer"
                      title="Restar unidad"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="min-w-[20px] text-center text-xs font-black text-[#214C6A]">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                      disabled={isStockMax}
                      className="w-6 h-6 rounded-none bg-[#214C6A] hover:bg-[#1a3d55] disabled:bg-[#63665B]/30 disabled:opacity-40 text-white flex items-center justify-center font-bold text-xs active:scale-95 cursor-pointer"
                      title="Sumar unidad"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Price & Delete */}
                <div className="text-right flex flex-col items-end justify-between self-stretch">
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.product.id)}
                    className="text-[#63665B]/60 hover:text-[#e74c3c] transition-colors p-0.5 cursor-pointer"
                    title="Eliminar de la cuenta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-black text-[#BC6343] font-['Outfit',sans-serif]">
                    {formatCOP(lineTotal)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cart Summary & Checkout Footer */}
      <div className="p-3 bg-[#FFF9F0] border-t-2 border-[#214C6A] space-y-2.5">
        {/* Quick Actions Row */}
        <div className="flex items-center justify-between gap-1.5">
          {/* Quick Amount Button */}
          <button
            type="button"
            onClick={onOpenQuickAmount}
            className="flex items-center gap-1 px-2 py-1 rounded-none bg-[#EB9D52]/20 hover:bg-[#EB9D52]/30 border border-[#EB9D52]/50 text-[#56291D] text-xs font-bold transition-all cursor-pointer"
          >
            <Zap className="w-3 h-3 text-[#BC6343]" />
            <span>+ Monto</span>
          </button>

          {/* Discount Pill Button */}
          <button
            type="button"
            onClick={() => setShowDiscountSelector(!showDiscountSelector)}
            className="flex items-center gap-1 px-2 py-1 rounded-none bg-[#F6E1C6] border border-[#214C6A]/20 text-[#56291D] text-xs font-bold hover:bg-[#ecd0b1] transition-all cursor-pointer"
          >
            <Percent className="w-3 h-3 text-[#BC6343]" />
            <span>Desc. Global: {discount}%</span>
          </button>

          {/* Park Sale Button */}
          {cart.length > 0 && (
            <button
              type="button"
              onClick={onParkCurrentSale}
              className="flex items-center gap-1 px-2 py-1 rounded-none bg-[#214C6A]/10 border border-[#214C6A]/30 text-[#214C6A] hover:bg-[#214C6A]/20 text-xs font-bold transition-all cursor-pointer"
              title="Poner cuenta en espera para atender otro cliente"
            >
              <PauseCircle className="w-3 h-3" />
              <span>Espera</span>
            </button>
          )}

          {/* Clear Cart Button */}
          {cart.length > 0 && (
            <button
              type="button"
              onClick={onClearCart}
              className="text-xs text-[#e74c3c] hover:text-[#c0392b] font-bold px-1.5 py-0.5 cursor-pointer transition-colors"
            >
              Vaciar
            </button>
          )}
        </div>

        {/* Discount Selector Dropdown */}
        {showDiscountSelector && (
          <div className="bg-[#FFF9F0] p-1.5 rounded-none border border-[#214C6A] shadow-md flex items-center justify-between gap-1 animate-fadeIn">
            <span className="text-[11px] font-bold text-[#214C6A] pl-1">Desc. adicional:</span>
            {[0, 5, 10, 15, 20].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  onDiscountChange(d);
                  setShowDiscountSelector(false);
                }}
                className={`px-2 py-0.5 rounded-none text-xs font-bold transition-all cursor-pointer ${
                  discount === d
                    ? 'bg-[#BC6343] text-white shadow-2xs'
                    : 'bg-[#F6E1C6] hover:bg-[#ecd0b1] text-[#56291D]'
                }`}
              >
                {d === 0 ? '0%' : `${d}%`}
              </button>
            ))}
          </div>
        )}

        {/* Financial Breakdown */}
        <div className="space-y-1 text-xs text-[#63665B] bg-[#F6E1C6]/30 p-2 border border-[#214C6A]/10">
          <div className="flex justify-between">
            <span>Subtotal Bruto</span>
            <span className="font-bold text-[#222E3A]">{formatCOP(grossSubtotal)}</span>
          </div>

          {totalSavings > 0 && (
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>Descuentos Aplicados</span>
              <span>-{formatCOP(totalSavings)}</span>
            </div>
          )}

          <div className="flex justify-between text-[11px]">
            <div className="flex items-center gap-1">
              <span>Base Gravable / Subtotal Neto</span>
              <button 
                type="button" 
                onClick={() => setShowTaxDetails(!showTaxDetails)}
                className="text-[9px] text-[#214C6A] underline font-bold cursor-pointer"
              >
                {showTaxDetails ? 'Ocultar IVA' : 'Ver IVA'}
              </button>
            </div>
            <span className="font-semibold text-[#222E3A]">{formatCOP(totalTaxableBase)}</span>
          </div>

          <div className="flex justify-between text-[11px]">
            <span>Total IVA Liquidado</span>
            <span className="font-semibold text-[#222E3A]">{formatCOP(totalTaxAmount)}</span>
          </div>

          {/* Detailed Tax Breakdown by rate if expanded */}
          {showTaxDetails && (
            <div className="pt-1.5 mt-1 border-t border-[#214C6A]/15 space-y-0.5 text-[10px] text-[#214C6A]">
              {Object.entries(taxBreakdownMap).map(([rateStr, data]) => {
                const rate = Number(rateStr);
                return (
                  <div key={rate} className="flex justify-between pl-2">
                    <span>• {rate === 0 ? 'Tarifa 0% (Exento)' : `Tarifa IVA ${rate}%`}: Base {formatCOP(data.base)}</span>
                    <span className="font-bold">IVA: {formatCOP(data.tax)}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-2 border-t-2 border-[#214C6A]/30 flex justify-between items-baseline">
            <div className="flex flex-col">
              <span className="text-xs font-black text-[#214C6A]">TOTAL A COBRAR</span>
              <span className="text-[9px] text-[#63665B]">IVA y Descuentos calculados</span>
            </div>
            <span className="text-2xl font-black text-[#BC6343] font-['Outfit',sans-serif]">
              {formatCOP(total)}
            </span>
          </div>
        </div>

        {/* Main Pay Button */}
        <button
          type="button"
          onClick={onProceedToPayment}
          disabled={cart.length === 0}
          className="w-full py-3 px-4 rounded-none bg-[#BC6343] hover:bg-[#964937] disabled:bg-[#63665B]/40 disabled:opacity-40 disabled:cursor-not-allowed text-[#FFF9F0] font-black text-base flex items-center justify-between shadow-md active:scale-[0.99] transition-all cursor-pointer border border-[#EB9D52]/40"
        >
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#EB9D52]" />
            <span>Cobrar Venta</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-black text-[#FFF9F0]">{formatCOP(total)}</span>
            <span className="px-1.5 py-0.5 rounded-none bg-black/30 text-[#FFF9F0] font-mono text-[10px] border border-white/20">
              F4
            </span>
          </div>
        </button>
      </div>
    </aside>
  );
};

