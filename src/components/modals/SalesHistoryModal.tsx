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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#222E3A]/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#FFF9F0] rounded-none max-w-2xl w-full shadow-2xl border-2 border-[#214C6A] overflow-hidden flex flex-col max-h-[88vh] text-[#222E3A]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#214C6A] border-b border-[#214C6A] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-none bg-[#BC6343] border border-white/20 flex items-center justify-center text-white shadow-xs">
              <History className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-title text-white">
                Historial de Ventas & Cuadre del Día
              </h3>
              <p className="text-xs text-[#F6E1C6]/80">
                Resumen fácil para la tienda ({new Date().toLocaleDateString('es-CO')})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-none bg-[#1a3d55] hover:bg-[#0f2433] flex items-center justify-center text-[#F6E1C6] hover:text-white transition-colors cursor-pointer border border-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation with clear, non-technical names */}
        <div className="flex border-b border-[#214C6A]/20 bg-[#F6E1C6]/60 p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab('todas')}
            className={`flex-1 py-2 rounded-none text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'todas'
                ? 'bg-[#BC6343] text-white shadow-xs'
                : 'text-[#63665B] hover:text-[#222E3A] hover:bg-[#FFF9F0]/60'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Ventas del Día ({transactions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('cuadre')}
            className={`flex-1 py-2 rounded-none text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'cuadre'
                ? 'bg-[#214C6A] text-white shadow-xs'
                : 'text-[#63665B] hover:text-[#222E3A] hover:bg-[#FFF9F0]/60'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Cuadre de Caja</span>
          </button>

          <button
            onClick={() => setActiveTab('fiados')}
            className={`flex-1 py-2 rounded-none text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'fiados'
                ? 'bg-[#964937] text-white shadow-xs'
                : 'text-[#63665B] hover:text-[#222E3A] hover:bg-[#FFF9F0]/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Cuaderno de Fiados ({fiadosList.length})</span>
          </button>
        </div>

        {/* Tab 1: Ventas Realizadas */}
        {activeTab === 'todas' && (
          <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-3">
            {/* Ultra-Intuitive Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {/* Total Vendido */}
              <div className="bg-[#F6E1C6]/60 p-3 rounded-none border border-[#214C6A]/20 text-center">
                <span className="text-[10px] text-[#56291D] uppercase block font-extrabold tracking-wider">
                  Total Dinero Vendido
                </span>
                <span className="text-base sm:text-lg font-black text-[#BC6343] font-secondary">
                  {formatCOP(totalRevenue)}
                </span>
              </div>

              {/* Clientes Atendidos */}
              <div className="bg-[#F6E1C6]/60 p-3 rounded-none border border-[#214C6A]/20 text-center">
                <span className="text-[10px] text-[#63665B] uppercase block font-extrabold tracking-wider">
                  Clientes Atendidos
                </span>
                <span className="text-base sm:text-lg font-black text-[#214C6A] font-secondary">
                  {totalClients} {totalClients === 1 ? 'cliente' : 'clientes'}
                </span>
              </div>

              {/* Productos Despachados */}
              <div className="bg-[#F6E1C6]/60 p-3 rounded-none border border-[#214C6A]/20 text-center col-span-2 sm:col-span-1">
                <span className="text-[10px] text-emerald-800 uppercase block font-extrabold tracking-wider">
                  Productos Despachados
                </span>
                <span className="text-base sm:text-lg font-black text-emerald-800 font-secondary">
                  {totalItemsSold} unidades
                </span>
              </div>
            </div>

            {/* Simple, intuitive explanation of spend per client */}
            {totalClients > 0 && (
              <div className="bg-[#F6E1C6]/40 p-3 rounded-none border border-[#214C6A]/20 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-none bg-[#214C6A]/10 text-[#214C6A] flex items-center justify-center font-bold shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-[#222E3A] block">
                      ¿Cuánto gasta cada cliente en promedio?
                    </span>
                    <span className="text-[11px] text-[#63665B]">
                      Cada persona que vino a la tienda se llevó aproximadamente:
                    </span>
                  </div>
                </div>
                <span className="text-sm sm:text-base font-black text-[#214C6A] font-secondary shrink-0">
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
                  Lista de compras cobradas hoy:
                </span>
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="bg-[#FFF9F0] hover:bg-[#F6E1C6]/50 p-3 rounded-none border border-[#214C6A]/20 transition-all flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-none bg-[#214C6A]/10 border border-[#214C6A]/20 text-[#214C6A] font-black flex items-center justify-center text-xs">
                        #{tx.id.slice(-4)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#222E3A]">
                            {tx.customerName || 'Consumidor Final'}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-none bg-[#F6E1C6] text-[#56291D] border border-[#214C6A]/20 font-medium">
                            {tx.paymentMethod}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#63665B] flex items-center gap-1.5 mt-0.5">
                          <span>{new Date(tx.timestamp).toLocaleTimeString('es-CO')}</span>
                          <span>•</span>
                          <span>{tx.items.length} productos ({tx.items.reduce((s, i) => s + i.quantity, 0)} uds)</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="text-right">
                        <span className="text-xs sm:text-sm font-black text-[#BC6343] font-secondary block">
                          {formatCOP(tx.total)}
                        </span>
                        {tx.discount > 0 && (
                          <span className="text-[10px] text-rose-700 font-semibold block">
                            Desc: -{formatCOP(tx.discount)}
                          </span>
                        )}
                      </div>
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
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Cuadre de Caja */}
        {activeTab === 'cuadre' && (
          <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
            <div className="bg-[#214C6A] p-4 rounded-none border border-[#214C6A] text-center text-white">
              <span className="text-xs font-bold text-[#F6E1C6] uppercase">Total Bruto Recaudado Hoy</span>
              <div className="text-3xl font-black text-white font-secondary mt-1">
                {formatCOP(totalRevenue)}
              </div>
              <p className="text-[11px] text-[#F6E1C6]/80 mt-1">Suma de todo lo vendido en el día</p>
            </div>

            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#214C6A]">
                ¿Dónde está el dinero del día?:
              </h4>

              {/* Efectivo */}
              <div className="bg-[#FFF9F0] p-3.5 rounded-none border border-emerald-300 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-none bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#222E3A] block">Efectivo en el Cajón</span>
                    <span className="text-[10px] text-[#63665B]">Billetes y monedas en la caja física</span>
                  </div>
                </div>
                <span className="text-base font-black text-emerald-800 font-secondary">
                  {formatCOP(paymentBreakdown['Efectivo'] || 0)}
                </span>
              </div>

              {/* Nequi / Davi */}
              <div className="bg-[#FFF9F0] p-3.5 rounded-none border border-[#214C6A]/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-none bg-[#BC6343]/15 text-[#BC6343] flex items-center justify-center font-bold">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#222E3A] block">Nequi & Daviplata</span>
                    <span className="text-[10px] text-[#63665B]">Transferencias que entraron a la cuenta</span>
                  </div>
                </div>
                <span className="text-base font-black text-[#BC6343] font-secondary">
                  {formatCOP(paymentBreakdown['Nequi / Daviplata'] || 0)}
                </span>
              </div>

              {/* Tarjetas */}
              <div className="bg-[#FFF9F0] p-3.5 rounded-none border border-[#214C6A]/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-none bg-[#214C6A]/15 text-[#214C6A] flex items-center justify-center font-bold">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#222E3A] block">Datáfono / Tarjetas</span>
                    <span className="text-[10px] text-[#63665B]">Cobros por datáfono</span>
                  </div>
                </div>
                <span className="text-base font-black text-[#214C6A] font-secondary">
                  {formatCOP(paymentBreakdown['Tarjeta Débito/Crédito'] || 0)}
                </span>
              </div>

              {/* Fiados */}
              <div className="bg-[#FFF9F0] p-3.5 rounded-none border border-[#214C6A]/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-none bg-[#EB9D52]/20 text-[#BC6343] flex items-center justify-center font-bold">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#222E3A] block">Cuaderno de Fiados</span>
                    <span className="text-[10px] text-[#63665B]">Dinero pendiente por cobrar a los vecinos</span>
                  </div>
                </div>
                <span className="text-base font-black text-[#BC6343] font-secondary">
                  {formatCOP(paymentBreakdown['Crédito / Fiado'] || 0)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Cuaderno de Fiados */}
        {activeTab === 'fiados' && (
          <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-3">
            <div className="bg-[#F6E1C6]/70 p-3.5 rounded-none border border-[#214C6A]/20 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#56291D] uppercase">Total en Cuentas por Cobrar</span>
                <div className="text-2xl font-black text-[#BC6343] font-secondary">
                  {formatCOP(totalFiados)}
                </div>
              </div>
              <span className="px-3 py-1 rounded-none bg-[#BC6343]/20 border border-[#BC6343]/40 text-[#56291D] text-xs font-bold">
                {fiadosList.length} {fiadosList.length === 1 ? 'cuenta pendiente' : 'cuentas pendientes'}
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
                  className="bg-[#FFF9F0] p-3.5 rounded-none border border-[#214C6A]/20 flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div>
                    <span className="text-sm font-bold text-[#222E3A] block">
                      {tx.customerName || 'Vecino'}
                    </span>
                    <span className="text-xs text-[#63665B]">
                      {new Date(tx.timestamp).toLocaleTimeString('es-CO')} • {tx.items.length} productos
                    </span>
                  </div>
                  <div className="text-right">
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

