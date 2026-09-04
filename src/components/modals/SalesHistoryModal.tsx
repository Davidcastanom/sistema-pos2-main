import React, { useState } from 'react';
import { SaleTransaction } from '@/types';
import { formatCOP } from '@/lib/utils';
import { generateInvoicePDF } from '@/lib/pdfGenerator';
import { 
  History, 
  X, 
  Receipt, 
  DollarSign, 
  BookOpen, 
  Smartphone, 
  CreditCard,
  CheckCircle2,
  Users,
  FileDown
} from 'lucide-react';

interface SalesHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: SaleTransaction[];
  onSelectReceipt: (tx: SaleTransaction) => void;
  onMarkFiadoAsPaid?: (txId: string) => void;
}

export const SalesHistoryModal: React.FC<SalesHistoryModalProps> = ({
  isOpen,
  onClose,
  transactions,
  onSelectReceipt,
  onMarkFiadoAsPaid,
}) => {
  const [activeTab, setActiveTab] = useState<'todas' | 'cuadre' | 'fiados'>('todas');

  if (!isOpen) return null;

  const totalRevenue = transactions.reduce((acc, tx) => acc + tx.total, 0);
  const totalClients = transactions.length;
  const totalItemsSold = transactions.reduce(
    (acc, tx) => acc + tx.items.reduce((s, i) => s + i.quantity, 0),
    0
  );

  // Average spend per client explained in super simple terms
  const averageSpentPerCustomer = totalClients > 0 ? Math.round(totalRevenue / totalClients) : 0;

  const paymentBreakdown = transactions.reduce((acc, tx) => {
    acc[tx.paymentMethod] = (acc[tx.paymentMethod] || 0) + tx.total;
    return acc;
  }, {} as Record<string, number>);

  const fiadosList = transactions.filter((tx) => tx.paymentMethod === 'Crédito / Fiado');
  const totalFiados = fiadosList.reduce((sum, tx) => sum + tx.total, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-[#222E3A]/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#FFF9F0] rounded-none max-w-2xl w-full shadow-2xl border-2 border-[#214C6A] overflow-hidden flex flex-col max-h-[90vh] text-[#222E3A]">
        {/* Header */}
        <div className="p-3.5 sm:p-5 bg-[#214C6A] border-b border-[#214C6A] text-white flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-none bg-[#BC6343] border border-white/20 flex items-center justify-center text-white shadow-xs shrink-0">
              <History className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-lg font-bold font-title text-white truncate">
                Historial de Ventas & Cuadre del Día
              </h3>
              <p className="text-[11px] sm:text-xs text-[#F6E1C6]/80 truncate">
                Resumen de caja ({new Date().toLocaleDateString('es-CO')})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-none bg-[#1a3d55] hover:bg-[#0f2433] flex items-center justify-center text-[#F6E1C6] hover:text-white transition-colors cursor-pointer border border-white/10 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation with clear, non-technical names */}
        <div className="flex border-b border-[#214C6A]/20 bg-[#F6E1C6]/60 p-1 sm:p-1.5 gap-1 sm:gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('todas')}
            className={`flex-1 min-w-[100px] py-1.5 sm:py-2 px-1.5 rounded-none text-[11px] sm:text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 ${
              activeTab === 'todas'
                ? 'bg-[#BC6343] text-white shadow-xs'
                : 'text-[#63665B] hover:text-[#222E3A] hover:bg-[#FFF9F0]/60'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Ventas ({transactions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('cuadre')}
            className={`flex-1 min-w-[90px] py-1.5 sm:py-2 px-1.5 rounded-none text-[11px] sm:text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 ${
              activeTab === 'cuadre'
                ? 'bg-[#214C6A] text-white shadow-xs'
                : 'text-[#63665B] hover:text-[#222E3A] hover:bg-[#FFF9F0]/60'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Cuadre Caja</span>
          </button>

          <button
            onClick={() => setActiveTab('fiados')}
            className={`flex-1 min-w-[100px] py-1.5 sm:py-2 px-1.5 rounded-none text-[11px] sm:text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 ${
              activeTab === 'fiados'
                ? 'bg-[#964937] text-white shadow-xs'
                : 'text-[#63665B] hover:text-[#222E3A] hover:bg-[#FFF9F0]/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Fiados ({fiadosList.length})</span>
          </button>
        </div>

        {/* Tab 1: Ventas Realizadas */}
        {activeTab === 'todas' && (
          <div className="p-3 sm:p-5 flex-1 overflow-y-auto overflow-x-hidden space-y-3">
            {/* Ultra-Intuitive Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
              {/* Total Vendido */}
              <div className="bg-[#F6E1C6]/60 p-2.5 sm:p-3 rounded-none border border-[#214C6A]/20 text-center">
                <span className="text-[9px] sm:text-[10px] text-[#56291D] uppercase block font-extrabold tracking-wider">
                  Total Dinero Vendido
                </span>
                <span className="text-sm sm:text-lg font-black text-[#BC6343] font-secondary block truncate">
                  {formatCOP(totalRevenue)}
                </span>
              </div>

              {/* Clientes Atendidos */}
              <div className="bg-[#F6E1C6]/60 p-2.5 sm:p-3 rounded-none border border-[#214C6A]/20 text-center">
                <span className="text-[9px] sm:text-[10px] text-[#63665B] uppercase block font-extrabold tracking-wider">
                  Clientes Atendidos
                </span>
                <span className="text-sm sm:text-lg font-black text-[#214C6A] font-secondary block truncate">
                  {totalClients} {totalClients === 1 ? 'cliente' : 'clientes'}
                </span>
              </div>

              {/* Productos Despachados */}
              <div className="bg-[#F6E1C6]/60 p-2.5 sm:p-3 rounded-none border border-[#214C6A]/20 text-center col-span-2 sm:col-span-1">
                <span className="text-[9px] sm:text-[10px] text-emerald-800 uppercase block font-extrabold tracking-wider">
                  Productos Despachados
                </span>
                <span className="text-sm sm:text-lg font-black text-emerald-800 font-secondary block truncate">
                  {totalItemsSold} unidades
                </span>
              </div>
            </div>

            {/* Simple, intuitive explanation of spend per client */}
            {totalClients > 0 && (
              <div className="bg-[#F6E1C6]/40 p-2.5 sm:p-3 rounded-none border border-[#214C6A]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-none bg-[#214C6A]/10 text-[#214C6A] flex items-center justify-center font-bold shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-[#222E3A] block truncate">
                      ¿Cuánto gasta cada cliente en promedio?
                    </span>
                    <span className="text-[11px] text-[#63665B] block truncate sm:whitespace-normal">
                      Cada persona que vino a la tienda se llevó aproximadamente:
                    </span>
                  </div>
                </div>
                <span className="text-sm sm:text-base font-black text-[#214C6A] font-secondary shrink-0 self-end sm:self-center">
                  {formatCOP(averageSpentPerCustomer)}
                </span>
              </div>
            )}

            {transactions.length === 0 ? (
              <div className="text-center py-10 text-[#63665B]">
                <Receipt className="w-10 h-10 mx-auto mb-2 opacity-40 text-[#BC6343]" />
                <p className="text-sm font-semibold text-[#222E3A]">No hay ventas registradas hoy todavía</p>
                <p className="text-xs text-[#63665B]">Las compras que cobres hoy aparecerán aquí en orden.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#214C6A] block">
                  Lista de compras cobradas hoy ({transactions.length}):
                </span>
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="bg-[#FFF9F0] hover:bg-[#F6E1C6]/40 p-2.5 sm:p-3 rounded-none border border-[#214C6A]/20 transition-all shadow-2xs space-y-2 sm:space-y-0"
                  >
                    {/* Desktop & Tablet Layout (sm and up) */}
                    <div className="hidden sm:flex sm:items-center sm:justify-between sm:gap-3">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-none bg-[#214C6A]/10 border border-[#214C6A]/20 text-[#214C6A] font-black flex items-center justify-center text-xs shrink-0">
                          #{tx.id.slice(-4)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#222E3A] truncate max-w-[180px]">
                              {tx.customerName || 'Consumidor Final'}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-none bg-[#F6E1C6] text-[#56291D] border border-[#214C6A]/20 font-medium shrink-0">
                              {tx.paymentMethod}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#63665B] flex items-center gap-1.5 mt-0.5">
                            <span>{new Date(tx.timestamp).toLocaleTimeString('es-CO')}</span>
                            <span>•</span>
                            <span className="truncate">{tx.items.length} productos ({tx.items.reduce((s, i) => s + i.quantity, 0)} uds)</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <span className="text-sm font-black text-[#BC6343] font-secondary block leading-tight">
                            {formatCOP(tx.total)}
                          </span>
                          {tx.discount > 0 && (
                            <span className="text-[10px] text-rose-700 font-semibold block">
                              Desc: -{formatCOP(tx.discount)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => generateInvoicePDF(tx, true)}
                            className="p-2 rounded-none bg-[#214C6A]/10 hover:bg-[#214C6A] text-[#214C6A] hover:text-white text-xs font-semibold transition-colors cursor-pointer border border-[#214C6A]/20"
                            title="Descargar Factura en Formato PDF"
                          >
                            <FileDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              onSelectReceipt(tx);
                              onClose();
                            }}
                            className="p-2 rounded-none bg-[#F6E1C6]/70 hover:bg-[#BC6343] text-[#56291D] hover:text-white text-xs font-semibold transition-colors cursor-pointer border border-[#214C6A]/20"
                            title="Ver e imprimir tirilla de compra"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Layout (< sm) - 2 rows structured without horizontal overflow */}
                    <div className="sm:hidden space-y-1.5">
                      {/* Top Row: Ticket ID, Customer, and Total Price */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span className="px-1 py-0.5 rounded-none bg-[#214C6A]/10 border border-[#214C6A]/20 text-[#214C6A] font-black text-[10px] shrink-0">
                            #{tx.id.slice(-4)}
                          </span>
                          <span className="text-xs font-bold text-[#222E3A] truncate">
                            {tx.customerName || 'Consumidor Final'}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-[#BC6343] font-secondary">
                            {formatCOP(tx.total)}
                          </span>
                        </div>
                      </div>

                      {/* Bottom Row: Payment method badge, time, items count, and Action buttons */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#214C6A]/10 text-[10px]">
                        <div className="flex items-center gap-1.5 min-w-0 text-[#63665B] truncate">
                          <span className="px-1.5 py-0.5 rounded-none bg-[#F6E1C6] text-[#56291D] font-medium shrink-0 border border-[#214C6A]/15 text-[9px]">
                            {tx.paymentMethod}
                          </span>
                          <span className="shrink-0">{new Date(tx.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span>•</span>
                          <span className="truncate">{tx.items.length} prod ({tx.items.reduce((s, i) => s + i.quantity, 0)} u)</span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {tx.discount > 0 && (
                            <span className="text-[9px] text-rose-700 font-bold bg-rose-50 px-1 py-0.5 border border-rose-200">
                              -{formatCOP(tx.discount)}
                            </span>
                          )}
                          <button
                            onClick={() => generateInvoicePDF(tx, true)}
                            className="p-1 rounded-none bg-[#214C6A]/10 hover:bg-[#214C6A] text-[#214C6A] hover:text-white transition-colors cursor-pointer border border-[#214C6A]/20"
                            title="Descargar Factura en PDF"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              onSelectReceipt(tx);
                              onClose();
                            }}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded-none bg-[#F6E1C6]/80 hover:bg-[#BC6343] text-[#56291D] hover:text-white font-bold transition-colors cursor-pointer border border-[#214C6A]/20 text-[10px]"
                            title="Ver e imprimir tirilla"
                          >
                            <Receipt className="w-3 h-3" />
                            <span>Tirilla</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Cuadre de Caja */}
        {activeTab === 'cuadre' && (
          <div className="p-3 sm:p-5 flex-1 overflow-y-auto overflow-x-hidden space-y-3.5 sm:space-y-4">
            <div className="bg-[#214C6A] p-3.5 sm:p-4 rounded-none border border-[#214C6A] text-center text-white">
              <span className="text-xs font-bold text-[#F6E1C6] uppercase">Total Bruto Recaudado Hoy</span>
              <div className="text-2xl sm:text-3xl font-black text-white font-secondary mt-1">
                {formatCOP(totalRevenue)}
              </div>
              <p className="text-[11px] text-[#F6E1C6]/80 mt-1">Suma de todo lo vendido en el día</p>
            </div>

            <div className="space-y-2 sm:space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#214C6A]">
                ¿Dónde está el dinero del día?:
              </h4>

              {/* Efectivo */}
              <div className="bg-[#FFF9F0] p-3 sm:p-3.5 rounded-none border border-emerald-300 flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-none bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[#222E3A] block truncate">Efectivo en el Cajón</span>
                    <span className="text-[10px] text-[#63665B] block truncate">Billetes y monedas en la caja física</span>
                  </div>
                </div>
                <span className="text-sm sm:text-base font-black text-emerald-800 font-secondary shrink-0">
                  {formatCOP(paymentBreakdown['Efectivo'] || 0)}
                </span>
              </div>

              {/* Nequi / Davi */}
              <div className="bg-[#FFF9F0] p-3 sm:p-3.5 rounded-none border border-[#214C6A]/20 flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-none bg-[#BC6343]/15 text-[#BC6343] flex items-center justify-center font-bold shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[#222E3A] block truncate">Nequi & Daviplata</span>
                    <span className="text-[10px] text-[#63665B] block truncate">Transferencias que entraron a la cuenta</span>
                  </div>
                </div>
                <span className="text-sm sm:text-base font-black text-[#BC6343] font-secondary shrink-0">
                  {formatCOP(paymentBreakdown['Nequi / Daviplata'] || 0)}
                </span>
              </div>

              {/* Tarjetas */}
              <div className="bg-[#FFF9F0] p-3 sm:p-3.5 rounded-none border border-[#214C6A]/20 flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-none bg-[#214C6A]/15 text-[#214C6A] flex items-center justify-center font-bold shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[#222E3A] block truncate">Datáfono / Tarjetas</span>
                    <span className="text-[10px] text-[#63665B] block truncate">Cobros por datáfono</span>
                  </div>
                </div>
                <span className="text-sm sm:text-base font-black text-[#214C6A] font-secondary shrink-0">
                  {formatCOP(paymentBreakdown['Tarjeta Débito/Crédito'] || 0)}
                </span>
              </div>

              {/* Fiados */}
              <div className="bg-[#FFF9F0] p-3 sm:p-3.5 rounded-none border border-[#214C6A]/20 flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-none bg-[#EB9D52]/20 text-[#BC6343] flex items-center justify-center font-bold shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[#222E3A] block truncate">Cuaderno de Fiados</span>
                    <span className="text-[10px] text-[#63665B] block truncate">Dinero pendiente por cobrar</span>
                  </div>
                </div>
                <span className="text-sm sm:text-base font-black text-[#BC6343] font-secondary shrink-0">
                  {formatCOP(paymentBreakdown['Crédito / Fiado'] || 0)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Cuaderno de Fiados */}
        {activeTab === 'fiados' && (
          <div className="p-3 sm:p-5 flex-1 overflow-y-auto overflow-x-hidden space-y-3">
            <div className="bg-[#F6E1C6]/70 p-3 sm:p-3.5 rounded-none border border-[#214C6A]/20 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] sm:text-[11px] font-bold text-[#56291D] uppercase block truncate">Total en Cuentas por Cobrar</span>
                <div className="text-xl sm:text-2xl font-black text-[#BC6343] font-secondary">
                  {formatCOP(totalFiados)}
                </div>
              </div>
              <span className="px-2.5 sm:px-3 py-1 rounded-none bg-[#BC6343]/20 border border-[#BC6343]/40 text-[#56291D] text-xs font-bold shrink-0">
                {fiadosList.length} {fiadosList.length === 1 ? 'cuenta' : 'cuentas'}
              </span>
            </div>

            {fiadosList.length === 0 ? (
              <div className="text-center py-10 text-[#63665B]">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-600" />
                <p className="text-sm font-semibold text-[#222E3A]">¡Al día! No hay cuentas fiadas pendientes</p>
                <p className="text-xs text-[#63665B]">Cuando fíes a un vecino aparecerá registrado aquí para cobrarle.</p>
              </div>
            ) : (
              fiadosList.map((tx) => (
                <div
                  key={tx.id}
                  className="bg-[#FFF9F0] p-3 rounded-none border border-[#214C6A]/20 flex items-center justify-between gap-2.5 shadow-2xs"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-bold text-[#222E3A] block truncate">
                      {tx.customerName || 'Vecino'}
                    </span>
                    <span className="text-xs text-[#63665B] block truncate">
                      {new Date(tx.timestamp).toLocaleTimeString('es-CO')} • {tx.items.length} productos ({tx.items.reduce((s, i) => s + i.quantity, 0)} uds)
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-[#BC6343] font-secondary block">
                      {formatCOP(tx.total)}
                    </span>
                    <button
                      onClick={() => {
                        onSelectReceipt(tx);
                        onClose();
                      }}
                      className="text-[11px] text-[#214C6A] hover:text-[#BC6343] underline font-medium cursor-pointer"
                    >
                      Ver Detalle
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-3.5 bg-[#F6E1C6]/60 border-t-2 border-[#214C6A] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-none bg-[#214C6A] hover:bg-[#1a3d55] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            Entendido, Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

