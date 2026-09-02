import React, { useState, useMemo } from 'react';
import { 
  SaleTransaction, 
  ProductItem, 
  CashShift, 
  Customer, 
  FixedMonthlyCosts 
} from '@/types';
import { formatCOP } from '@/lib/utils';
import { 
  calculateBreakEven, 
  calculateCashInDrawer, 
  calculateTopSellingChampions, 
  calculateInventoryTrafficLight,
  calculateTotalFixedCosts,
  calculateAverageMargin,
  DEFAULT_FIXED_COSTS 
} from '@/lib/businessLogic';
import { 
  X, 
  Store, 
  TrendingUp, 
  Coins, 
  Wallet, 
  Target, 
  Award, 
  AlertTriangle, 
  CheckCircle2, 
  Flame, 
  Settings, 
  ArrowRight, 
  Sparkles, 
  Package, 
  DollarSign, 
  Calendar,
  Layers,
  HelpCircle,
  Save,
  RotateCcw,
  Clock,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface ManagerDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: SaleTransaction[];
  products: ProductItem[];
  currentShift: CashShift | null;
  customers: Customer[];
  fixedCosts: FixedMonthlyCosts;
  onSaveFixedCosts: (newCosts: FixedMonthlyCosts) => void;
  onOpenInventory?: () => void;
}

export const ManagerDashboardModal: React.FC<ManagerDashboardModalProps> = ({
  isOpen,
  onClose,
  transactions,
  products,
  currentShift,
  customers,
  fixedCosts,
  onSaveFixedCosts,
  onOpenInventory,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'costs'>('dashboard');

  // Local state for editing fixed costs
  const [editCosts, setEditCosts] = useState<FixedMonthlyCosts>({ ...fixedCosts });
  const [showSaveSuccess, setShowSaveSuccess] = useState<boolean>(false);

  // Sync state when fixedCosts prop changes or modal opens
  React.useEffect(() => {
    setEditCosts({ ...fixedCosts });
  }, [fixedCosts, isOpen]);

  // Date filters for "Hoy" and "Este Mes"
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Sales Today
  const salesToday = useMemo(() => {
    return transactions.filter((t) => new Date(t.timestamp) >= todayStart);
  }, [transactions, todayStart]);

  const totalSalesToday = useMemo(() => {
    return salesToday.reduce((sum, t) => sum + t.total, 0);
  }, [salesToday]);

  // Sales This Month
  const salesThisMonth = useMemo(() => {
    return transactions.filter((t) => new Date(t.timestamp) >= monthStart);
  }, [transactions, monthStart]);

  const totalSalesThisMonth = useMemo(() => {
    return salesThisMonth.reduce((sum, t) => sum + t.total, 0);
  }, [salesThisMonth]);

  // 1. Resumen de Efectivo en Caja / Cambio ("Bolsillo")
  const cashInDrawerData = useMemo(() => {
    return calculateCashInDrawer(currentShift, salesToday);
  }, [currentShift, salesToday]);

  // 2. Progreso hacia el Punto de Equilibrio
  const breakEvenData = useMemo(() => {
    return calculateBreakEven(fixedCosts, products, totalSalesThisMonth);
  }, [fixedCosts, products, totalSalesThisMonth]);

  // 3. Campeones de la Tienda (Top Productos Vendidos del día o mes)
  const topChampions = useMemo(() => {
    // If there are sales today, prioritize today; otherwise show month
    const source = salesToday.length > 0 ? salesToday : salesThisMonth;
    return calculateTopSellingChampions(source, 5);
  }, [salesToday, salesThisMonth]);

  // 4. Semáforo de Inventario
  const trafficLight = useMemo(() => {
    return calculateInventoryTrafficLight(products);
  }, [products]);

  // Live simulation in the Cost editing tab
  const simulatedBreakEven = useMemo(() => {
    const totalSimCosts = calculateTotalFixedCosts(editCosts);
    const avgMargin = calculateAverageMargin(products);
    const marginDec = avgMargin / 100;
    const monthlyTarget = marginDec > 0 ? Math.round(totalSimCosts / marginDec) : totalSimCosts * 4;
    const dailyTarget = Math.round(monthlyTarget / 30);
    return {
      totalSimCosts,
      avgMargin,
      monthlyTarget,
      dailyTarget,
    };
  }, [editCosts, products]);

  const handleSaveCosts = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveFixedCosts(editCosts);
    setShowSaveSuccess(true);
    setTimeout(() => {
      setShowSaveSuccess(false);
      setActiveTab('dashboard');
    }, 1200);
  };

  const handleResetToDefaults = () => {
    setEditCosts({ ...DEFAULT_FIXED_COSTS });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#FFF9F0]/92 backdrop-blur-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl border-2 border-[#214C6A] overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-[#214C6A]/95 backdrop-blur-xl px-4 sm:px-6 py-3.5 sm:py-4 text-[#FFF9F0] flex items-center justify-between border-b-2 border-[#BC6343] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1a3d55] border border-white/30 flex items-center justify-center text-[#FFF9F0] shadow-sm overflow-hidden p-0.5 shrink-0">
              <img 
                src="https://res.cloudinary.com/unhl90nr/image/upload/v1788376390/logo_sl8qs4.png" 
                alt="Logo Tienda Mixta" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight font-title">
                  Panel Gerencial del Tendero
                </h2>
                <span className="bg-[#EB9D52] text-[#222E3A] text-[10px] font-black uppercase px-2 py-0.5 tracking-wider shadow-2xs font-secondary">
                  Semáforo & Bolsillo
                </span>
              </div>
              <p className="text-xs text-[#F6E1C6]/90 hidden sm:block">
                Toma el control de tu dinero, gastos fijos y metas sin complicaciones contables
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switchers */}
            <div className="flex items-center bg-[#1a3d55]/90 backdrop-blur-md p-1 border border-white/15">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === 'dashboard'
                    ? 'bg-[#EB9D52] text-[#222E3A] shadow-xs'
                    : 'text-[#FFF9F0] hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Mi Negocio Hoy</span>
              </button>
              <button
                onClick={() => setActiveTab('costs')}
                className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === 'costs'
                    ? 'bg-[#EB9D52] text-[#222E3A] shadow-xs'
                    : 'text-[#FFF9F0] hover:text-white'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Mis Gastos & Meta</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-[#F6E1C6]/30 backdrop-blur-sm space-y-6">
          
          {/* TAB 1: DASHBOARD GERENCIAL SIMPLIFICADO */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* =========================================================================
                  BLOQUE 1: RESUMEN DEL DÍA Y EFECTIVO EN CAJA ("BOLSILLO")
                  ========================================================================= */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1.1 Venta Total del Día */}
                <div className="bg-white/80 backdrop-blur-xl border border-white/85 p-5 shadow-[0_8px_24px_rgba(33,76,106,0.08)] relative overflow-hidden flex flex-col justify-between hover:bg-white/95 transition-all">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#EB9D52]/10 -mr-6 -mt-6 rounded-full pointer-events-none" />
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black uppercase tracking-wider text-[#214C6A] flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-[#BC6343]" />
                        Venta Total del Día (Hoy)
                      </span>
                      <span className="text-[11px] font-bold text-[#56291D] bg-[#F6E1C6]/80 px-2 py-0.5 border border-white/60">
                        {salesToday.length} {salesToday.length === 1 ? 'factura' : 'facturas'}
                      </span>
                    </div>

                    <div className="my-2">
                      <div className="text-3xl sm:text-4xl font-black text-[#214C6A] font-secondary tracking-tight">
                        {formatCOP(totalSalesToday)}
                      </div>
                      <p className="text-xs text-[#56291D]/80 mt-1">
                        Suma de todas las ventas cobradas hoy (efectivo, transferencias y tarjetas).
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#214C6A]/15 mt-3 flex items-center justify-between text-xs text-[#222E3A]">
                    <span className="text-xs text-[#56291D]">Mes acumulado:</span>
                    <span className="font-extrabold text-[#214C6A] font-mono text-sm">
                      {formatCOP(totalSalesThisMonth)}
                    </span>
                  </div>
                </div>

                {/* 1.2 Efectivo Estimado en Caja / Cambio ("El Bolsillo") */}
                <div className="bg-white/80 backdrop-blur-xl border border-white/85 p-5 shadow-[0_8px_24px_rgba(188,99,67,0.08)] relative overflow-hidden flex flex-col justify-between hover:bg-white/95 transition-all">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#BC6343]/10 -mr-6 -mt-6 rounded-full pointer-events-none" />

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black uppercase tracking-wider text-[#BC6343] flex items-center gap-1.5">
                        <Wallet className="w-4 h-4 text-[#BC6343]" />
                        Efectivo Estimado en Caja (Para Vueltas)
                      </span>
                      <span className="text-[10px] font-bold bg-[#BC6343] text-white px-2 py-0.5 uppercase shadow-2xs">
                        Plata en Cajón
                      </span>
                    </div>

                    <div className="my-2">
                      <div className="text-3xl sm:text-4xl font-black text-[#BC6343] font-secondary tracking-tight">
                        {formatCOP(cashInDrawerData.estimatedCashInHand)}
                      </div>
                      <p className="text-xs text-[#56291D]/80 mt-1">
                        Dinero físico disponible en el cajón para dar cambio (Base + Ventas en billete - Salidas).
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#BC6343]/20 mt-3 grid grid-cols-3 gap-2 text-[11px] text-center">
                    <div className="bg-[#F6E1C6]/50 backdrop-blur-xs p-1.5 border border-white/60">
                      <span className="block text-[10px] text-[#56291D] font-bold">Base Inicial</span>
                      <strong className="text-[#214C6A] font-mono">{formatCOP(cashInDrawerData.baseCash)}</strong>
                    </div>
                    <div className="bg-[#F6E1C6]/50 backdrop-blur-xs p-1.5 border border-white/60">
                      <span className="block text-[10px] text-emerald-800 font-bold">+ Venta Efectivo</span>
                      <strong className="text-emerald-700 font-mono">+{formatCOP(cashInDrawerData.cashSalesToday)}</strong>
                    </div>
                    <div className="bg-[#F6E1C6]/50 backdrop-blur-xs p-1.5 border border-white/60">
                      <span className="block text-[10px] text-rose-800 font-bold">- Gastos Caja</span>
                      <strong className="text-rose-700 font-mono">-{formatCOP(cashInDrawerData.cashOutflows)}</strong>
                    </div>
                  </div>
                </div>

              </div>

              {/* =========================================================================
                  BLOQUE 2: PROGRESO HACIA LA META (PUNTO DE EQUILIBRIO SIMPLIFICADO)
                  ========================================================================= */}
              <div className="bg-white/80 backdrop-blur-xl border border-white/85 p-5 shadow-[0_8px_24px_rgba(33,76,106,0.08)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#214C6A] text-[#EB9D52] flex items-center justify-center font-bold shadow-xs">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#214C6A] text-sm sm:text-base font-title">
                        Progreso hacia la Meta del Mes (Punto de Equilibrio)
                      </h3>
                      <p className="text-xs text-[#56291D]">
                        Lo que necesitas vender en el mes para cubrir arriendo, servicios y gastos fijos.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('costs')}
                    className="self-start sm:self-auto flex items-center gap-1 text-xs font-bold text-[#BC6343] hover:text-[#964937] underline cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Ajustar mis gastos fijos ({formatCOP(breakEvenData.totalFixedCosts)})</span>
                  </button>
                </div>

                {/* Motivational Callout Box with glass glow */}
                <div className={`p-4 border-l-4 my-4 flex items-start gap-3 backdrop-blur-md shadow-2xs ${
                  breakEvenData.isBreakEvenReached
                    ? 'bg-emerald-50/90 border-emerald-600 text-emerald-950'
                    : breakEvenData.progressPercentage >= 50
                    ? 'bg-amber-50/90 border-amber-600 text-amber-950'
                    : 'bg-blue-50/90 border-[#214C6A] text-[#214C6A]'
                }`}>
                  <div className="shrink-0 mt-0.5">
                    {breakEvenData.isBreakEvenReached ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-[#EB9D52]" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold leading-snug">
                      {breakEvenData.motivationalMessage}
                    </p>
                  </div>
                </div>

                {/* Visual Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[#56291D]">
                      Vendido este mes: <strong className="text-[#214C6A] text-sm font-mono">{formatCOP(breakEvenData.currentMonthSales)}</strong>
                    </span>
                    <span className="text-[#BC6343] font-black text-sm">
                      {breakEvenData.progressPercentage}% alcanzado
                    </span>
                    <span className="text-[#56291D]">
                      Meta total de venta: <strong className="text-[#214C6A] text-sm font-mono">{formatCOP(breakEvenData.breakEvenMonthlySales)}</strong>
                    </span>
                  </div>

                  <div className="w-full bg-[#E5D2BA]/80 h-5 overflow-hidden border border-[#214C6A]/25 relative shadow-inner">
                    <div 
                      className={`h-full transition-all duration-500 flex items-center justify-end px-2 text-[10px] font-black text-white ${
                        breakEvenData.isBreakEvenReached
                          ? 'bg-emerald-600'
                          : breakEvenData.progressPercentage >= 50
                          ? 'bg-[#EB9D52]'
                          : 'bg-[#214C6A]'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, breakEvenData.progressPercentage))}%` }}
                    >
                      {breakEvenData.progressPercentage}%
                    </div>
                  </div>
                </div>

                {/* 3 Metric Pills for Quick Understanding */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-3 border-t border-[#214C6A]/10 text-xs">
                  <div className="bg-[#F6E1C6]/45 backdrop-blur-sm p-2.5 border border-white/70 shadow-2xs">
                    <span className="text-[11px] text-[#56291D] block font-bold">Gastos Fijos del Mes</span>
                    <strong className="text-sm font-bold text-[#214C6A] font-mono">
                      {formatCOP(breakEvenData.totalFixedCosts)}
                    </strong>
                    <span className="text-[10px] text-[#56291D]/70 block mt-0.5">Arriendo, luz, agua, empleados</span>
                  </div>

                  <div className="bg-[#F6E1C6]/45 backdrop-blur-sm p-2.5 border border-white/70 shadow-2xs">
                    <span className="text-[11px] text-[#56291D] block font-bold">Meta de Venta Diaria Sugerida</span>
                    <strong className="text-sm font-bold text-[#BC6343] font-mono">
                      {formatCOP(breakEvenData.breakEvenDailySales)} / día
                    </strong>
                    <span className="text-[10px] text-[#56291D]/70 block mt-0.5">Promedio diario para estar tranquilo</span>
                  </div>

                  <div className="bg-[#F6E1C6]/45 backdrop-blur-sm p-2.5 border border-white/70 shadow-2xs">
                    <span className="text-[11px] text-[#56291D] block font-bold">Margen de Ganancia Promedio</span>
                    <strong className="text-sm font-bold text-emerald-800 font-mono">
                      {breakEvenData.averageMarginPercentage}% de ganancia
                    </strong>
                    <span className="text-[10px] text-[#56291D]/70 block mt-0.5">Calculado sobre los productos de la tienda</span>
                  </div>
                </div>
              </div>

              {/* =========================================================================
                  BLOQUE 3 Y BLOQUE 4: CAMPEONES DE LA TIENDA Y SEMÁFORO DE INVENTARIO
                  ========================================================================= */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                
                {/* BLOQUE 3: Los Campeones de la Tienda (Productos con Mayor Rotación) */}
                <div className="bg-white/80 backdrop-blur-xl border border-white/85 p-5 shadow-[0_8px_24px_rgba(33,76,106,0.08)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-[#214C6A] text-sm sm:text-base flex items-center gap-2 font-title">
                        <Award className="w-5 h-5 text-[#EB9D52]" />
                        Los Campeones de la Tienda
                      </h3>
                      <span className="text-[10px] bg-[#EB9D52] text-[#222E3A] font-black px-2 py-0.5 uppercase shadow-2xs">
                        Más Vendidos
                      </span>
                    </div>

                    <p className="text-xs text-[#56291D] mb-3">
                      Productos que más rotan y más plata traen a la caja. Guíate con esto para no quedarte sin surtido:
                    </p>

                    {topChampions.length === 0 ? (
                      <div className="bg-[#F6E1C6]/40 backdrop-blur-xs p-6 text-center border border-dashed border-[#214C6A]/20 my-2">
                        <Package className="w-8 h-8 text-[#56291D]/40 mx-auto mb-2" />
                        <p className="text-xs font-bold text-[#56291D]">
                          Aún no se registran ventas hoy para generar el podio de campeones.
                        </p>
                        <p className="text-[11px] text-[#56291D]/70 mt-1">
                          Apenas registres ventas en la caja, aquí aparecerán automáticamente los productos estrella.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 my-2">
                        {topChampions.map((champ) => {
                          const medalColor = 
                            champ.rank === 1 ? 'bg-amber-400 text-amber-950 border-amber-600 shadow-2xs' :
                            champ.rank === 2 ? 'bg-slate-300 text-slate-900 border-slate-400 shadow-2xs' :
                            champ.rank === 3 ? 'bg-amber-700 text-amber-100 border-amber-800 shadow-2xs' :
                            'bg-[#214C6A] text-white border-[#214C6A]';

                          return (
                            <div 
                              key={champ.id}
                              className="flex items-center justify-between p-2.5 bg-[#FFF9F0]/80 hover:bg-white backdrop-blur-md border border-white/80 shadow-2xs transition-all"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-6 h-6 shrink-0 flex items-center justify-center font-black text-xs border ${medalColor}`}>
                                  {champ.rank}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-xs font-bold text-[#214C6A] truncate font-title">
                                    {champ.title}
                                  </h4>
                                  <span className="text-[10px] text-[#56291D] block">
                                    {champ.category}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right shrink-0 pl-2">
                                <div className="text-xs font-black text-[#BC6343] font-mono">
                                  {champ.quantitySold} {champ.quantitySold === 1 ? 'und' : 'unds'}
                                </div>
                                <span className="text-[10px] font-bold text-[#214C6A]">
                                  {formatCOP(champ.totalRevenue)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#214C6A]/10 mt-3 text-[11px] text-[#56291D] flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-[#BC6343]" />
                    <span>Mantén siempre suficiente inventario de estos productos.</span>
                  </div>
                </div>

                {/* BLOQUE 4: Alertas de Inventario y Reabastecimiento ("Semáforo") */}
                <div className="bg-white/80 backdrop-blur-xl border border-white/85 p-5 shadow-[0_8px_24px_rgba(33,76,106,0.08)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-[#214C6A] text-sm sm:text-base flex items-center gap-2 font-title">
                        <span className="flex h-3 w-3 relative">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                            trafficLight.status === 'red' ? 'bg-rose-500' :
                            trafficLight.status === 'yellow' ? 'bg-amber-500' : 'bg-emerald-500'
                          }`} />
                          <span className={`relative inline-flex rounded-full h-3 w-3 ${
                            trafficLight.status === 'red' ? 'bg-rose-600' :
                            trafficLight.status === 'yellow' ? 'bg-amber-600' : 'bg-emerald-600'
                          }`} />
                        </span>
                        Semáforo de Inventario
                      </h3>
                      <span className={`text-[10px] font-black px-2 py-0.5 uppercase shadow-2xs ${
                        trafficLight.status === 'red' ? 'bg-rose-100/90 text-rose-900 border border-rose-400' :
                        trafficLight.status === 'yellow' ? 'bg-amber-100/90 text-amber-900 border border-amber-400' :
                        'bg-emerald-100/90 text-emerald-900 border border-emerald-400'
                      }`}>
                        {trafficLight.status === 'red' ? 'Alerta Crítica' :
                         trafficLight.status === 'yellow' ? 'Revisar Stock' : 'Saludable'}
                      </span>
                    </div>

                    {/* Traffic Light Main Banner with glass backdrop */}
                    <div className={`p-3.5 border-2 mb-3 backdrop-blur-md shadow-2xs ${
                      trafficLight.status === 'red' ? 'bg-rose-50/90 border-rose-600 text-rose-950' :
                      trafficLight.status === 'yellow' ? 'bg-amber-50/90 border-amber-600 text-amber-950' :
                      'bg-emerald-50/90 border-emerald-600 text-emerald-950'
                    }`}>
                      <h4 className="text-xs font-black mb-1">
                        {trafficLight.title}
                      </h4>
                      <p className="text-xs leading-relaxed">
                        {trafficLight.description}
                      </p>
                    </div>

                    {/* Stock Alert Summary Cards (Strictly NO WhatsApp buttons) */}
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {trafficLight.criticalProducts.slice(0, 4).map((p) => (
                        <div 
                          key={p.id}
                          className="flex items-center justify-between p-2 bg-rose-100/80 backdrop-blur-xs border border-rose-300 text-xs shadow-2xs"
                        >
                          <div className="min-w-0 pr-2">
                            <strong className="text-rose-950 block truncate font-bold">{p.title}</strong>
                            <span className="text-[10px] text-rose-800">Mínimo sugerido: {p.minStock || 5} {p.unit}</span>
                          </div>
                          <span className="bg-rose-600 text-white font-black px-2 py-0.5 text-xs shrink-0 shadow-2xs">
                            {p.stock <= 0 ? 'AGOTADO (0)' : `Queda: ${p.stock}`}
                          </span>
                        </div>
                      ))}

                      {trafficLight.lowStockProducts.slice(0, 3).map((p) => (
                        <div 
                          key={p.id}
                          className="flex items-center justify-between p-2 bg-amber-100/80 backdrop-blur-xs border border-amber-300 text-xs shadow-2xs"
                        >
                          <div className="min-w-0 pr-2">
                            <strong className="text-amber-950 block truncate font-bold">{p.title}</strong>
                            <span className="text-[10px] text-amber-800">Stock por debajo del mínimo</span>
                          </div>
                          <span className="bg-amber-600 text-white font-black px-2 py-0.5 text-xs shrink-0 shadow-2xs">
                            {p.stock} unds
                          </span>
                        </div>
                      ))}

                      {trafficLight.status === 'green' && (
                        <div className="p-4 text-center bg-emerald-50/70 backdrop-blur-xs border border-emerald-200">
                          <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                          <p className="text-xs font-bold text-emerald-900">
                            ¡Todos tus {products.length} productos tienen existencias suficientes!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Direct Internal Action (NO WhatsApp) */}
                  <div className="pt-3 border-t border-[#214C6A]/10 mt-3 flex items-center justify-between">
                    <span className="text-[10px] text-[#56291D]">
                      Total catálogo: <strong>{products.length} productos</strong>
                    </span>
                    {onOpenInventory && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenInventory();
                        }}
                        className="flex items-center gap-1 text-xs font-bold text-[#214C6A] hover:text-[#BC6343] cursor-pointer"
                      >
                        <span>Ir a ajustar existencias en Kardex</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: MÓDULO DE INGRESO DE COSTOS Y PUNTO DE EQUILIBRIO */}
          {activeTab === 'costs' && (
            <form onSubmit={handleSaveCosts} className="space-y-6 animate-fadeIn">
              
              <div className="bg-white/80 backdrop-blur-xl border border-white/85 p-5 shadow-[0_8px_24px_rgba(33,76,106,0.08)]">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 bg-[#BC6343] text-white flex items-center justify-center font-bold shadow-xs">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#214C6A] text-base font-title">
                      Configuración de Gastos Fijos Mensuales del Negocio
                    </h3>
                    <p className="text-xs text-[#56291D]">
                      Ingresa cuánto pagas al mes por cada concepto. Con esto calculamos tu meta exacta de venta diaria y mensual.
                    </p>
                  </div>
                </div>

                {showSaveSuccess && (
                  <div className="my-3 p-3 bg-emerald-100/90 backdrop-blur-xs border-2 border-emerald-600 text-emerald-900 text-xs font-black flex items-center gap-2 animate-fadeIn shadow-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>¡Gastos fijos guardados exitosamente! Calculando nuevas metas...</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-4">
                  
                  {/* Arriendo */}
                  <div className="space-y-1 bg-[#F6E1C6]/40 backdrop-blur-xs p-3 border border-white/70 shadow-2xs">
                    <label className="text-xs font-black text-[#214C6A] flex items-center justify-between">
                      <span>1. Arriendo del Local</span>
                      <span className="text-[10px] text-[#BC6343] font-mono">Mensual</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2.5 text-xs font-bold text-[#56291D]">$</span>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={editCosts.rent || ''}
                        onChange={(e) => setEditCosts({ ...editCosts, rent: Math.max(0, parseInt(e.target.value) || 0) })}
                        placeholder="350000"
                        className="w-full pl-7 pr-3 py-2 bg-white/90 border border-[#214C6A]/30 text-xs font-bold font-mono text-[#214C6A] focus:outline-none focus:border-[#BC6343]"
                      />
                    </div>
                    <span className="text-[10px] text-[#56291D]/70 block">Valor del alquiler mensual de la tienda</span>
                  </div>

                  {/* Servicios Públicos */}
                  <div className="space-y-1 bg-[#F6E1C6]/40 backdrop-blur-xs p-3 border border-white/70 shadow-2xs">
                    <label className="text-xs font-black text-[#214C6A] flex items-center justify-between">
                      <span>2. Servicios (Luz, Agua, Gas)</span>
                      <span className="text-[10px] text-[#BC6343] font-mono">Mensual</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2.5 text-xs font-bold text-[#56291D]">$</span>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={editCosts.utilities || ''}
                        onChange={(e) => setEditCosts({ ...editCosts, utilities: Math.max(0, parseInt(e.target.value) || 0) })}
                        placeholder="120000"
                        className="w-full pl-7 pr-3 py-2 bg-white/90 border border-[#214C6A]/30 text-xs font-bold font-mono text-[#214C6A] focus:outline-none focus:border-[#BC6343]"
                      />
                    </div>
                    <span className="text-[10px] text-[#56291D]/70 block">Promedio de recibos de energía y acueducto</span>
                  </div>

                  {/* Empleado / Ayudante / Jornal */}
                  <div className="space-y-1 bg-[#F6E1C6]/40 backdrop-blur-xs p-3 border border-white/70 shadow-2xs">
                    <label className="text-xs font-black text-[#214C6A] flex items-center justify-between">
                      <span>3. Ayudante / Empleados</span>
                      <span className="text-[10px] text-[#BC6343] font-mono">Mensual</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2.5 text-xs font-bold text-[#56291D]">$</span>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={editCosts.payroll || ''}
                        onChange={(e) => setEditCosts({ ...editCosts, payroll: Math.max(0, parseInt(e.target.value) || 0) })}
                        placeholder="200000"
                        className="w-full pl-7 pr-3 py-2 bg-white/90 border border-[#214C6A]/30 text-xs font-bold font-mono text-[#214C6A] focus:outline-none focus:border-[#BC6343]"
                      />
                    </div>
                    <span className="text-[10px] text-[#56291D]/70 block">Pago mensual o jornales de colaboradores</span>
                  </div>

                  {/* Internet / Teléfono / Datáfono */}
                  <div className="space-y-1 bg-[#F6E1C6]/40 backdrop-blur-xs p-3 border border-white/70 shadow-2xs">
                    <label className="text-xs font-black text-[#214C6A] flex items-center justify-between">
                      <span>4. Internet, Datáfono y Teléfono</span>
                      <span className="text-[10px] text-[#BC6343] font-mono">Mensual</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2.5 text-xs font-bold text-[#56291D]">$</span>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={editCosts.services || ''}
                        onChange={(e) => setEditCosts({ ...editCosts, services: Math.max(0, parseInt(e.target.value) || 0) })}
                        placeholder="50000"
                        className="w-full pl-7 pr-3 py-2 bg-white/90 border border-[#214C6A]/30 text-xs font-bold font-mono text-[#214C6A] focus:outline-none focus:border-[#BC6343]"
                      />
                    </div>
                    <span className="text-[10px] text-[#56291D]/70 block">Planes de internet para el POS y datáfonos</span>
                  </div>

                  {/* Otros Gastos Fijos */}
                  <div className="space-y-1 bg-[#F6E1C6]/40 backdrop-blur-xs p-3 border border-white/70 shadow-2xs">
                    <label className="text-xs font-black text-[#214C6A] flex items-center justify-between">
                      <span>5. Otros Gastos / Imprevistos</span>
                      <span className="text-[10px] text-[#BC6343] font-mono">Mensual</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2.5 text-xs font-bold text-[#56291D]">$</span>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={editCosts.other || ''}
                        onChange={(e) => setEditCosts({ ...editCosts, other: Math.max(0, parseInt(e.target.value) || 0) })}
                        placeholder="80000"
                        className="w-full pl-7 pr-3 py-2 bg-white/90 border border-[#214C6A]/30 text-xs font-bold font-mono text-[#214C6A] focus:outline-none focus:border-[#BC6343]"
                      />
                    </div>
                    <span className="text-[10px] text-[#56291D]/70 block">Aseo, bolsas, mantenimiento o seguridad</span>
                  </div>

                  {/* Total Gastos Fijos (Calculado en Vivo) */}
                  <div className="space-y-1 bg-[#214C6A]/90 backdrop-blur-md text-[#FFF9F0] p-3 flex flex-col justify-between border border-white/20 shadow-md">
                    <div>
                      <span className="text-[10px] uppercase font-black text-[#EB9D52] tracking-wider block font-secondary">
                        Total Gastos Fijos
                      </span>
                      <div className="text-xl sm:text-2xl font-black font-secondary mt-1 text-white">
                        {formatCOP(simulatedBreakEven.totalSimCosts)}
                      </div>
                    </div>
                    <span className="text-[10px] text-[#F6E1C6]/90 block">
                      Esto es lo que tu tienda debe pagar cada mes pase lo que pase.
                    </span>
                  </div>

                </div>

                {/* Resumen del Cálculo Matemático para el Tendero */}
                <div className="mt-4 p-4 bg-[#F6E1C6]/45 backdrop-blur-md border-2 border-[#BC6343]/40 space-y-2 shadow-2xs">
                  <h4 className="text-xs font-black text-[#214C6A] uppercase flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-[#BC6343]" />
                    ¿Cómo funciona el cálculo de tu Punto de Equilibrio?
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-2">
                    <div className="bg-white/85 backdrop-blur-xs p-2.5 border border-white/80 shadow-2xs">
                      <span className="text-[10px] text-[#56291D] font-bold block">1. Margen de Ganancia Promedio</span>
                      <strong className="text-sm font-extrabold text-[#214C6A]">
                        {simulatedBreakEven.avgMargin}%
                      </strong>
                      <p className="text-[10px] text-[#56291D]/80 mt-0.5">
                        Por cada $100 que vendes en promedio, te quedan aproximadamente ${simulatedBreakEven.avgMargin} libres.
                      </p>
                    </div>

                    <div className="bg-white/85 backdrop-blur-xs p-2.5 border border-white/80 shadow-2xs">
                      <span className="text-[10px] text-[#56291D] font-bold block">2. Meta Mensual para no Perder</span>
                      <strong className="text-sm font-extrabold text-[#BC6343] font-mono">
                        {formatCOP(simulatedBreakEven.monthlyTarget)}
                      </strong>
                      <p className="text-[10px] text-[#56291D]/80 mt-0.5">
                        Al vender este monto al mes, cubres exactamente los {formatCOP(simulatedBreakEven.totalSimCosts)} de gastos.
                      </p>
                    </div>

                    <div className="bg-white/85 backdrop-blur-xs p-2.5 border border-white/80 shadow-2xs">
                      <span className="text-[10px] text-[#56291D] font-bold block">3. Meta Diaria Recomendada</span>
                      <strong className="text-sm font-extrabold text-emerald-700 font-mono">
                        {formatCOP(simulatedBreakEven.dailyTarget)} / día
                      </strong>
                      <p className="text-[10px] text-[#56291D]/80 mt-0.5">
                        Si vendes al menos esto cada día (en 30 días), tienes tu negocio al día y sin deudas.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form Action Buttons */}
                <div className="mt-5 pt-3 border-t border-[#214C6A]/20 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleResetToDefaults}
                    className="px-3 py-2 text-xs font-bold text-[#56291D] hover:text-[#214C6A] hover:bg-black/5 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restablecer valores de ejemplo</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('dashboard')}
                      className="px-4 py-2 bg-white/80 border border-[#214C6A]/30 text-xs font-bold text-[#214C6A] hover:bg-[#F6E1C6]/50 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#214C6A] hover:bg-[#1a3d55] text-white text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer border border-[#EB9D52]"
                    >
                      <Save className="w-4 h-4 text-[#EB9D52]" />
                      <span>Guardar Gastos y Actualizar Metas</span>
                    </button>
                  </div>
                </div>

              </div>

            </form>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-[#FFF9F0]/90 backdrop-blur-md px-4 sm:px-6 py-3 border-t-2 border-[#214C6A]/20 flex items-center justify-between text-xs text-[#56291D]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span className="hidden sm:inline">Cifras redondeadas a enteros en Pesos Colombianos (COP) para lectura ágil sin confusiones.</span>
            <span className="sm:hidden font-bold">Modo Tendero Ágil</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#214C6A] hover:bg-[#1a3d55] text-white font-bold text-xs cursor-pointer shadow-xs"
          >
            Volver a la Caja
          </button>
        </div>

      </div>
    </div>
  );
};
