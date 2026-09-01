import React, { useState } from 'react';
import { SaleTransaction, Customer } from '@/types';
import { formatCOP } from '@/lib/utils';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Download, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  X, 
  ArrowUpRight,
  PieChart,
  Award,
  CreditCard
} from 'lucide-react';

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: SaleTransaction[];
  customers: Customer[];
}

export const ReportsModal: React.FC<ReportsModalProps> = ({
  isOpen,
  onClose,
  transactions,
  customers,
}) => {
  const [timePeriod, setTimePeriod] = useState<'today' | '7days' | '30days' | 'all'>('today');

  if (!isOpen) return null;

  // Filter transactions by period
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const filteredSales = transactions.filter((t) => {
    const d = new Date(t.timestamp);
    if (timePeriod === 'today') return d >= todayStart;
    if (timePeriod === '7days') return d >= sevenDaysAgo;
    if (timePeriod === '30days') return d >= thirtyDaysAgo;
    return true;
  });

  // Calculate Aggregates
  const totalSalesRevenue = filteredSales.reduce((sum, t) => sum + t.total, 0);
  const totalTransactionsCount = filteredSales.length;
  const averageTicket = totalTransactionsCount > 0 ? Math.round(totalSalesRevenue / totalTransactionsCount) : 0;

  // Calculate estimated total cost of sold items and gross profit
  const totalEstimatedCost = filteredSales.reduce((sum, t) => {
    const cost = t.costTotal || t.items.reduce((itemSum, item) => {
      const itemCost = item.product.costPrice || Math.round(item.product.price * 0.75);
      return itemSum + itemCost * item.quantity;
    }, 0);
    return sum + cost;
  }, 0);

  const totalGrossProfit = Math.max(0, totalSalesRevenue - totalEstimatedCost);
  const profitMarginPct = totalSalesRevenue > 0 ? Math.round((totalGrossProfit / totalSalesRevenue) * 100) : 25;

  // Sales by payment method
  const paymentMethodSummary: { [method: string]: { count: number; total: number } } = {};
  filteredSales.forEach((t) => {
    const m = t.paymentMethod;
    if (!paymentMethodSummary[m]) {
      paymentMethodSummary[m] = { count: 0, total: 0 };
    }
    paymentMethodSummary[m].count += 1;
    paymentMethodSummary[m].total += t.total;
  });

  // Top Products Ranking
  const productRankingMap: { [id: string]: { title: string; count: number; revenue: number } } = {};
  filteredSales.forEach((t) => {
    t.items.forEach((item) => {
      const id = String(item.product.id);
      if (!productRankingMap[id]) {
        productRankingMap[id] = { title: item.product.title, count: 0, revenue: 0 };
      }
      productRankingMap[id].count += item.quantity;
      productRankingMap[id].revenue += item.product.price * item.quantity;
    });
  });

  const topProducts = Object.values(productRankingMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Total Customer Outstanding Debt
  const totalOutstandingCredit = customers.reduce((sum, c) => sum + (c.currentDebt || 0), 0);

  // Export Sales Report to CSV
  const handleExportSalesCSV = () => {
    const headers = ['ID_Venta', 'Fecha_Hora', 'Cliente', 'Cajero', 'MetodoPago', 'Subtotal', 'Descuento', 'IVA', 'Total', 'NumProductos'];
    const rows = filteredSales.map((t) => [
      t.id,
      `"${new Date(t.timestamp).toLocaleString('es-CO')}"`,
      `"${t.customerName || 'Consumidor Final'}"`,
      `"${t.cashierName}"`,
      `"${t.paymentMethod}"`,
      t.subtotal,
      t.discount,
      t.tax,
      t.total,
      t.items.reduce((s, i) => s + i.quantity, 0),
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ReporteVentas_${timePeriod}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#222E3A]/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#FFF9F0] rounded-none max-w-5xl w-full shadow-2xl border-2 border-[#214C6A] overflow-hidden flex flex-col max-h-[92vh] text-[#222E3A]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#214C6A] border-b border-[#214C6A] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-none bg-[#BC6343] border border-white/20 flex items-center justify-center text-white shadow-xs">
              <BarChart3 className="w-5 h-5 text-[#FFF9F0]" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#EB9D52]">
                Estadísticas del Negocio
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold font-['Outfit',sans-serif] text-[#FFF9F0]">
                Informes de Ventas, Utilidad y Rendimiento
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-none bg-[#1a3d55] hover:bg-[#0f2433] flex items-center justify-center text-[#F6E1C6] hover:text-white transition-colors cursor-pointer border border-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Period Selector & Export Bar */}
        <div className="p-3 bg-[#F6E1C6]/70 border-b border-[#214C6A]/20 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-[#214C6A] mr-2 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Período:
            </span>
            {(['today', '7days', '30days', 'all'] as const).map((p) => {
              const labelMap = {
                today: 'Hoy',
                '7days': 'Últimos 7 Días',
                '30days': 'Este Mes',
                all: 'Todo el Historial',
              };
              return (
                <button
                  key={p}
                  onClick={() => setTimePeriod(p)}
                  className={`px-3 py-1 text-xs font-bold rounded-none transition-all cursor-pointer ${
                    timePeriod === p
                      ? 'bg-[#214C6A] text-white shadow-xs'
                      : 'bg-[#FFF9F0] text-[#63665B] border border-[#214C6A]/20 hover:text-[#222E3A]'
                  }`}
                >
                  {labelMap[p]}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleExportSalesCSV}
            className="px-3.5 py-1.5 bg-[#214C6A] hover:bg-[#1a3d55] text-white text-xs font-bold rounded-none flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Ventas a CSV / Excel</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Main Key Figures */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3 border border-[#214C6A]/20 shadow-2xs">
              <span className="text-[10px] font-bold text-[#63665B] uppercase block">Ventas Netas Totales</span>
              <span className="text-xl font-black text-[#214C6A] font-['Outfit',sans-serif]">
                {formatCOP(totalSalesRevenue)}
              </span>
              <span className="text-[10px] text-[#63665B] block mt-0.5">{totalTransactionsCount} transacciones</span>
            </div>

            <div className="bg-emerald-50/70 p-3 border border-emerald-300 shadow-2xs">
              <span className="text-[10px] font-bold text-emerald-800 uppercase block">Ganancia Bruta Estimada</span>
              <span className="text-xl font-black text-emerald-700 font-['Outfit',sans-serif]">
                {formatCOP(totalGrossProfit)}
              </span>
              <span className="text-[10px] text-emerald-800 font-bold block mt-0.5">Margen aprox: {profitMarginPct}%</span>
            </div>

            <div className="bg-white p-3 border border-[#214C6A]/20 shadow-2xs">
              <span className="text-[10px] font-bold text-[#63665B] uppercase block">Ticket Promedio</span>
              <span className="text-xl font-black text-[#BC6343] font-['Outfit',sans-serif]">
                {formatCOP(averageTicket)}
              </span>
              <span className="text-[10px] text-[#63665B] block mt-0.5">por factura</span>
            </div>

            <div className="bg-rose-50/70 p-3 border border-rose-300 shadow-2xs">
              <span className="text-[10px] font-bold text-rose-800 uppercase block">Cartera Total Fiada</span>
              <span className="text-xl font-black text-rose-700 font-['Outfit',sans-serif]">
                {formatCOP(totalOutstandingCredit)}
              </span>
              <span className="text-[10px] text-rose-800 block mt-0.5">Pendiente por cobrar a vecinos</span>
            </div>
          </div>

          {/* Two-Column Grid: Payment Breakdown & Top Ranking */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Payment Methods Breakdown */}
            <div className="bg-white p-4 border border-[#214C6A]/20 shadow-2xs space-y-3">
              <h4 className="font-bold text-xs text-[#214C6A] uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-[#BC6343]" />
                Ventas por Medio de Pago
              </h4>

              {Object.keys(paymentMethodSummary).length === 0 ? (
                <p className="text-xs text-[#63665B] py-4 text-center">No hay ventas en el período seleccionado.</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(paymentMethodSummary).map(([method, data]) => {
                    const pct = totalSalesRevenue > 0 ? Math.round((data.total / totalSalesRevenue) * 100) : 0;
                    return (
                      <div key={method} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-[#214C6A]">{method} ({data.count} ventas)</span>
                          <span className="text-[#56291D]">{formatCOP(data.total)} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-none overflow-hidden">
                          <div
                            className={`h-full ${
                              method === 'Efectivo'
                                ? 'bg-emerald-600'
                                : method.includes('Nequi')
                                ? 'bg-indigo-600'
                                : method === 'Crédito / Fiado'
                                ? 'bg-amber-600'
                                : 'bg-sky-600'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Top 8 Selling Products */}
            <div className="bg-white p-4 border border-[#214C6A]/20 shadow-2xs space-y-3">
              <h4 className="font-bold text-xs text-[#214C6A] uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#EB9D52]" />
                Productos Más Vendidos (Top Ranking)
              </h4>

              {topProducts.length === 0 ? (
                <p className="text-xs text-[#63665B] py-4 text-center">No hay artículos vendidos en el período seleccionado.</p>
              ) : (
                <div className="space-y-2">
                  {topProducts.map((p, index) => (
                    <div
                      key={p.title}
                      className="flex items-center justify-between text-xs p-1.5 bg-[#FFF9F0] border border-[#214C6A]/10"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-[#214C6A] text-white font-black text-[10px] flex items-center justify-center">
                          #{index + 1}
                        </span>
                        <span className="font-bold text-[#214C6A] truncate max-w-[180px]">{p.title}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-[#56291D] block">{p.count} uds</span>
                        <span className="text-[10px] text-[#63665B]">{formatCOP(p.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Sales Ledger Table */}
          <div className="bg-white border border-[#214C6A]/20 shadow-2xs p-3 space-y-2">
            <h4 className="font-bold text-xs text-[#214C6A] uppercase tracking-wider">
              Últimas Facturas Emitidas ({filteredSales.length})
            </h4>

            <div className="max-h-52 overflow-y-auto border border-[#214C6A]/10">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#214C6A] text-[#FFF9F0] text-[10px] font-bold uppercase">
                    <th className="p-2">Factura</th>
                    <th className="p-2">Hora</th>
                    <th className="p-2">Cliente</th>
                    <th className="p-2">Medio Pago</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#214C6A]/10">
                  {filteredSales.slice(0, 15).map((t) => (
                    <tr key={t.id} className="hover:bg-[#F6E1C6]/20">
                      <td className="p-2 font-mono font-bold text-[#214C6A]">#{t.id}</td>
                      <td className="p-2 text-[11px] text-[#63665B]">
                        {new Date(t.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-2 font-medium">{t.customerName || 'Consumidor Final'}</td>
                      <td className="p-2">
                        <span className="px-1.5 py-0.5 bg-slate-100 font-bold text-[10px]">
                          {t.paymentMethod}
                        </span>
                      </td>
                      <td className="p-2 text-right font-black text-[#BC6343]">
                        {formatCOP(t.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-[#F6E1C6]/60 border-t-2 border-[#214C6A] flex items-center justify-between">
          <span className="text-xs text-[#56291D]">
            Todos los cálculos de utilidad se generan a partir de los costos registrados en tu catálogo.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-none bg-[#214C6A] hover:bg-[#1a3d55] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            Listo / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
