import React, { useState, useEffect } from 'react';
import { CashShift, CashMovement, SaleTransaction, DebtPayment } from '@/types';
import { formatCOP } from '@/lib/utils';
import { 
  Vault, 
  ArrowDownRight, 
  ArrowUpRight, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  Receipt, 
  X, 
  Plus, 
  Minus,
  Lock,
  Unlock,
  Coins,
  History,
  Edit3,
  User,
  UserCheck,
  Check,
  Sparkles
} from 'lucide-react';

const POPULAR_CASHIERS = ['Don Esteban', 'Doña Gloria', 'Mateo', 'Valentina', 'Camilo'];
const POPULAR_BASES = [50000, 100000, 150000, 200000, 300000, 500000];
const POPULAR_REASONS = [
  'Relevo de turno',
  'Ajuste de base matutina',
  'Corrección de conteo',
  'Monedas para cambio y vueltas'
];

interface CashShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentShift: CashShift | null;
  cashMovements?: CashMovement[];
  transactions?: SaleTransaction[];
  debtPayments?: DebtPayment[];
  onOpenShift: (initialBase: number, cashierName: string) => void;
  onUpdateShift?: (updates: { cashierName: string; initialCash: number; reason?: string }) => void;
  onAddCashMovement: 
    | ((movement: Omit<CashMovement, 'id' | 'timestamp'>) => void)
    | ((type: 'inflow' | 'outflow', amount: number, category: string, reason: string) => void);
  onCloseShift: 
    | ((finalCount: number, notes?: string) => void)
    | ((finalCashCounted: number, difference: number, observations?: string) => void);
  shiftHistory: CashShift[];
  cashierName?: string;
}

export const CashShiftModal: React.FC<CashShiftModalProps> = ({
  isOpen,
  onClose,
  currentShift,
  cashMovements = currentShift?.movements || [],
  transactions = [],
  debtPayments = [],
  onOpenShift,
  onUpdateShift,
  onAddCashMovement,
  onCloseShift,
  shiftHistory,
  cashierName = currentShift?.cashierName || 'Don Esteban',
}) => {
  const [activeTab, setActiveTab] = useState<'current' | 'movement' | 'close' | 'history'>('current');
  
  // Open shift state
  const [baseInput, setBaseInput] = useState<number>(100000);
  const [cashierInput, setCashierInput] = useState<string>(cashierName || 'Don Esteban');

  // Edit active shift state
  const [isEditingShift, setIsEditingShift] = useState<boolean>(false);
  const [editCashier, setEditCashier] = useState<string>(currentShift?.cashierName || cashierName || 'Don Esteban');
  const [editBase, setEditBase] = useState<number>(currentShift?.initialCash ?? currentShift?.initialBase ?? 150000);
  const [editReason, setEditReason] = useState<string>('');
  const [shiftEditSavedMessage, setShiftEditSavedMessage] = useState<string>('');

  // Movement input state
  const [movType, setMovType] = useState<'inflow' | 'outflow'>('outflow');
  const [movAmount, setMovAmount] = useState<number>(0);
  const [movCategory, setMovCategory] = useState<CashMovement['category']>('Gasto Menor');
  const [movReason, setMovReason] = useState<string>('');

  // Close shift counting state
  const [physicalCashCount, setPhysicalCashCount] = useState<number>(0);
  const [closeNotes, setCloseNotes] = useState<string>('');
  const [billCounts, setBillCounts] = useState<{ [denom: number]: number }>({
    100000: 0,
    50000: 0,
    20000: 0,
    10000: 0,
    5000: 0,
    2000: 0,
    1000: 0,
    500: 0,
    200: 0,
    100: 0,
    50: 0,
  });

  // Keep edit state in sync with currentShift
  useEffect(() => {
    if (currentShift) {
      setEditCashier(currentShift.cashierName || 'Don Esteban');
      setEditBase(currentShift.initialCash ?? currentShift.initialBase ?? 150000);
    }
  }, [currentShift]);

  if (!isOpen) return null;

  // Calculate live numbers for the open shift
  const shiftStartTime = currentShift ? new Date(currentShift.openedAt) : new Date();
  
  // Shift sales
  const shiftSales = transactions.filter((t) => new Date(t.timestamp) >= shiftStartTime);
  const cashSalesTotal = shiftSales
    .filter((t) => t.paymentMethod === 'Efectivo')
    .reduce((sum, t) => sum + t.total, 0);

  const electronicSalesTotal = shiftSales
    .filter((t) => t.paymentMethod === 'Nequi / Daviplata' || t.paymentMethod === 'Tarjeta Débito/Crédito')
    .reduce((sum, t) => sum + t.total, 0);

  const fiadoSalesTotal = shiftSales
    .filter((t) => t.paymentMethod === 'Crédito / Fiado')
    .reduce((sum, t) => sum + t.total, 0);

  // Shift movements - exclude base opening movement to avoid double counting
  const shiftMovements = cashMovements.filter((m) => new Date(m.timestamp) >= shiftStartTime);
  const totalInflows = shiftMovements
    .filter((m) => m.type === 'inflow' && m.category !== 'Apertura de Caja' && m.id !== 'mov-init')
    .reduce((sum, m) => sum + m.amount, 0);

  const totalOutflows = shiftMovements
    .filter((m) => m.type === 'outflow')
    .reduce((sum, m) => sum + m.amount, 0);

  // Shift debt payments in cash
  const shiftDebtPayments = debtPayments.filter(
    (d) => new Date(d.timestamp) >= shiftStartTime && d.paymentMethod === 'Efectivo'
  );
  const totalDebtCollectedCash = shiftDebtPayments.reduce((sum, d) => sum + d.amount, 0);

  // Expected Physical Cash in the Register
  const initialBase = currentShift?.initialCash ?? currentShift?.initialBase ?? 0;
  const expectedCashInDrawer = initialBase + cashSalesTotal + totalInflows + totalDebtCollectedCash - totalOutflows;

  // Handle bill counter calculation
  const updateBillCount = (denom: number, count: number) => {
    const nextCounts = { ...billCounts, [denom]: Math.max(0, count) };
    setBillCounts(nextCounts);
    const sum = Object.entries(nextCounts).reduce(
      (acc, [val, cnt]) => acc + Number(val) * Number(cnt || 0),
      0
    );
    setPhysicalCashCount(sum);
  };

  const handleOpenShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onOpenShift(baseInput, cashierInput);
    setActiveTab('current');
  };

  const handleSaveShiftEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCashier = editCashier.trim() || currentShift?.cashierName || 'Don Esteban';
    const finalBase = Math.max(0, Number(editBase) || 0);

    if (onUpdateShift) {
      onUpdateShift({
        cashierName: finalCashier,
        initialCash: finalBase,
        reason: editReason.trim() || undefined,
      });
    }

    setShiftEditSavedMessage(`¡Actualizado! Encargado: ${finalCashier} • Base: ${formatCOP(finalBase)}`);
    setTimeout(() => {
      setShiftEditSavedMessage('');
      setIsEditingShift(false);
    }, 1200);
  };

  const handleMovementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (movAmount <= 0 || !movReason.trim()) return;

    if (typeof onAddCashMovement === 'function') {
      if (onAddCashMovement.length === 1) {
        (onAddCashMovement as (movement: Omit<CashMovement, 'id' | 'timestamp'>) => void)({
          type: movType,
          amount: movAmount,
          reason: movReason.trim(),
          category: movCategory,
          cashierName: currentShift?.cashierName || cashierName,
        });
      } else {
        (onAddCashMovement as (type: 'inflow' | 'outflow', amount: number, category: string, reason: string) => void)(
          movType,
          movAmount,
          movCategory || 'Gasto Menor',
          movReason.trim()
        );
      }
    }

    setMovAmount(0);
    setMovReason('');
    setActiveTab('current');
  };

  const handleCloseShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const diff = physicalCashCount - expectedCashInDrawer;
    if (typeof onCloseShift === 'function') {
      if (onCloseShift.length === 2) {
        (onCloseShift as (finalCount: number, notes?: string) => void)(physicalCashCount, closeNotes);
      } else {
        (onCloseShift as (finalCashCounted: number, difference: number, observations?: string) => void)(
          physicalCashCount,
          diff,
          closeNotes
        );
      }
    }
    setActiveTab('history');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#222E3A]/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#FFF9F0] rounded-none max-w-4xl w-full shadow-2xl border-2 border-[#214C6A] overflow-hidden flex flex-col max-h-[92vh] text-[#222E3A]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#214C6A] border-b border-[#214C6A] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-none bg-[#BC6343] border border-white/20 flex items-center justify-center text-white shadow-xs">
              <Vault className="w-5 h-5 text-[#FFF9F0]" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#EB9D52]">
                Control Financiero
              </span>
              <h3 className="text-lg sm:text-xl font-bold font-title text-[#FFF9F0]">
                Gestión de Caja, Arqueo y Cierre de Turno (Reporte Z)
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

        {/* Tab Navigation */}
        <div className="bg-[#F6E1C6]/70 border-b border-[#214C6A]/20 p-2 flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-3 py-1.5 rounded-none text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'current'
                ? 'bg-[#214C6A] text-white shadow-xs'
                : 'bg-[#FFF9F0] text-[#63665B] hover:text-[#222E3A] border border-[#214C6A]/20'
            }`}
          >
            <Vault className="w-3.5 h-3.5" />
            <span>Estado Actual de Caja</span>
          </button>

          <button
            onClick={() => setActiveTab('movement')}
            disabled={!currentShift || currentShift.status !== 'open'}
            className={`px-3 py-1.5 rounded-none text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'movement'
                ? 'bg-[#214C6A] text-white shadow-xs'
                : 'bg-[#FFF9F0] text-[#63665B] hover:text-[#222E3A] border border-[#214C6A]/20 disabled:opacity-40'
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>Registrar Entrada / Gasto</span>
          </button>

          <button
            onClick={() => {
              setPhysicalCashCount(expectedCashInDrawer);
              setActiveTab('close');
            }}
            disabled={!currentShift || currentShift.status !== 'open'}
            className={`px-3 py-1.5 rounded-none text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'close'
                ? 'bg-[#BC6343] text-white shadow-xs'
                : 'bg-[#FFF9F0] text-[#63665B] hover:text-[#222E3A] border border-[#214C6A]/20 disabled:opacity-40'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Cerrar Turno (Reporte Z)</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-none text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-[#214C6A] text-white shadow-xs'
                : 'bg-[#FFF9F0] text-[#63665B] hover:text-[#222E3A] border border-[#214C6A]/20'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historial de Cierres</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB 1: CURRENT LIVE STATUS */}
          {activeTab === 'current' && (
            <div className="space-y-4">
              {/* If shift is NOT open */}
              {(!currentShift || currentShift.status === 'closed') ? (
                <div className="bg-amber-50 border-2 border-amber-400 p-5 rounded-none text-center space-y-3">
                  <div className="w-12 h-12 rounded-none bg-amber-200 text-amber-900 flex items-center justify-center mx-auto">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-amber-900">La Caja se encuentra Cerrada</h4>
                    <p className="text-xs text-amber-800 mt-1 max-w-md mx-auto">
                      Para iniciar la jornada de ventas y llevar el cuadre exacto del dinero, abre el turno especificando el cajero encargado y la base inicial en efectivo.
                    </p>
                  </div>

                  <form onSubmit={handleOpenShiftSubmit} className="max-w-md mx-auto space-y-3 text-left pt-2 bg-white p-4 border border-amber-300">
                    <div>
                      <label className="text-xs font-bold text-[#214C6A] block mb-1">
                        Nombre del Cajero(a) Encargado(a):
                      </label>
                      <input
                        type="text"
                        required
                        value={cashierInput}
                        onChange={(e) => setCashierInput(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-[#214C6A]/30 rounded-none text-xs font-bold text-[#222E3A]"
                      />
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="text-[10px] text-[#63665B] font-bold">Rápido:</span>
                        {POPULAR_CASHIERS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setCashierInput(c)}
                            className={`text-[10px] font-bold px-2 py-0.5 border cursor-pointer transition-colors ${
                              cashierInput === c
                                ? 'bg-[#214C6A] text-white border-[#214C6A]'
                                : 'bg-white text-[#214C6A] border-[#214C6A]/30 hover:bg-[#F6E1C6]/60'
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-[#214C6A]">
                          Base Inicial en Efectivo (COP):
                        </label>
                        <span className="text-xs font-black text-[#BC6343]">
                          {formatCOP(Number(baseInput) || 0)}
                        </span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        required
                        value={baseInput}
                        onChange={(e) => setBaseInput(Math.max(0, Number(e.target.value)))}
                        className="w-full px-3 py-1.5 bg-white border border-[#214C6A]/30 rounded-none text-base font-black text-[#214C6A]"
                      />
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="text-[10px] text-[#63665B] font-bold">Bases:</span>
                        {POPULAR_BASES.map((b) => (
                          <button
                            key={b}
                            type="button"
                            onClick={() => setBaseInput(b)}
                            className={`text-[10px] font-bold px-2 py-0.5 border cursor-pointer transition-colors ${
                              Number(baseInput) === b
                                ? 'bg-[#BC6343] text-white border-[#BC6343]'
                                : 'bg-white text-[#BC6343] border-[#BC6343]/30 hover:bg-[#F6E1C6]/60'
                            }`}
                          >
                            {formatCOP(b)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-none bg-[#214C6A] hover:bg-[#1a3d55] text-white text-xs font-black uppercase tracking-wider shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Abrir Turno de Caja</span>
                    </button>
                  </form>
                </div>
              ) : (
                <>
                  {/* Edit Shift Form (When toggled open) */}
                  {isEditingShift ? (
                    <form
                      onSubmit={handleSaveShiftEdit}
                      className="bg-white border-2 border-[#BC6343] p-4 sm:p-5 shadow-lg space-y-4 animate-fadeIn"
                    >
                      <div className="flex items-center justify-between border-b border-[#214C6A]/20 pb-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-[#BC6343] text-white flex items-center justify-center font-bold shadow-xs">
                            <Edit3 className="w-4 h-4 text-[#FFF9F0]" />
                          </div>
                          <div>
                            <h4 className="text-sm sm:text-base font-bold text-[#214C6A]">
                              Editar Encargado de Turno e Inicio de Caja
                            </h4>
                            <p className="text-[11px] text-[#63665B]">
                              Modifica quién está a cargo de la caja y el monto de dinero base sin necesidad de cerrar el turno.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsEditingShift(false)}
                          className="text-xs text-[#63665B] hover:text-[#BC6343] font-bold px-2.5 py-1 border border-gray-300 hover:border-[#BC6343] cursor-pointer"
                        >
                          ✕ Cancelar
                        </button>
                      </div>

                      {shiftEditSavedMessage && (
                        <div className="p-2.5 bg-emerald-50 border border-emerald-400 text-emerald-800 text-xs font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>{shiftEditSavedMessage}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Usuario Encargado */}
                        <div className="space-y-2 bg-[#FFF9F0] p-3.5 border border-[#214C6A]/20">
                          <label className="text-xs font-bold text-[#214C6A] flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <User className="w-4 h-4 text-[#BC6343]" />
                              Usuario Encargado del Turno:
                            </span>
                            <span className="text-[10px] text-[#63665B]">Actual: {currentShift.cashierName}</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={editCashier}
                            onChange={(e) => setEditCashier(e.target.value)}
                            className="w-full px-3 py-2 bg-white border-2 border-[#214C6A]/40 focus:border-[#214C6A] rounded-none text-sm font-bold text-[#222E3A] outline-none"
                            placeholder="Nombre del cajero(a)..."
                          />
                          <div>
                            <span className="text-[10px] uppercase font-bold text-[#63665B] block mb-1">
                              Cajeros Frecuentes:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {POPULAR_CASHIERS.map((name) => (
                                <button
                                  key={name}
                                  type="button"
                                  onClick={() => setEditCashier(name)}
                                  className={`text-xs px-2.5 py-1 font-bold border transition-colors cursor-pointer ${
                                    editCashier.toLowerCase() === name.toLowerCase()
                                      ? 'bg-[#214C6A] text-white border-[#214C6A]'
                                      : 'bg-white text-[#214C6A] border-[#214C6A]/30 hover:bg-[#F6E1C6]/60'
                                  }`}
                                >
                                  {name}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Inicio de Caja / Base Inicial */}
                        <div className="space-y-2 bg-[#FFF9F0] p-3.5 border border-[#214C6A]/20">
                          <label className="text-xs font-bold text-[#214C6A] flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Vault className="w-4 h-4 text-[#BC6343]" />
                              Inicio de Caja / Base Inicial (COP):
                            </span>
                            <span className="text-xs font-black text-[#BC6343]">
                              {formatCOP(Number(editBase) || 0)}
                            </span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-500 text-sm">$</span>
                            <input
                              type="number"
                              min="0"
                              step="1000"
                              required
                              value={editBase}
                              onChange={(e) => setEditBase(Math.max(0, Number(e.target.value)))}
                              className="w-full pl-7 pr-3 py-2 bg-white border-2 border-[#214C6A]/40 focus:border-[#214C6A] rounded-none text-lg font-black text-[#214C6A] outline-none"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-[#63665B] block mb-1">
                              Bases Rápidas Sugeridas:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {POPULAR_BASES.map((b) => (
                                <button
                                  key={b}
                                  type="button"
                                  onClick={() => setEditBase(b)}
                                  className={`text-[11px] px-2 py-0.5 font-bold border transition-colors cursor-pointer ${
                                    Number(editBase) === b
                                      ? 'bg-[#BC6343] text-white border-[#BC6343]'
                                      : 'bg-white text-[#BC6343] border-[#BC6343]/30 hover:bg-[#F6E1C6]/60'
                                  }`}
                                >
                                  {formatCOP(b)}
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={() => setEditBase((prev) => (Number(prev) || 0) + 10000)}
                                className="text-[11px] px-2 py-0.5 font-bold border bg-white text-[#214C6A] border-[#214C6A]/30 hover:bg-[#F6E1C6]/60 cursor-pointer"
                              >
                                +$10.000
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditBase((prev) => (Number(prev) || 0) + 50000)}
                                className="text-[11px] px-2 py-0.5 font-bold border bg-white text-[#214C6A] border-[#214C6A]/30 hover:bg-[#F6E1C6]/60 cursor-pointer"
                              >
                                +$50.000
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Motivo o Justificación */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#214C6A] block">
                          Motivo o Justificación del Cambio (Opcional para auditoría de caja):
                        </label>
                        <input
                          type="text"
                          value={editReason}
                          onChange={(e) => setEditReason(e.target.value)}
                          placeholder="Ej. Relevo de turno por la tarde, corrección de vueltas en billetes..."
                          className="w-full px-3 py-1.5 bg-white border border-[#214C6A]/30 rounded-none text-xs text-[#222E3A]"
                        />
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="text-[10px] text-[#63665B] font-bold">Sugerencias:</span>
                          {POPULAR_REASONS.map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setEditReason(r)}
                              className="text-[10px] px-2 py-0.5 bg-[#F6E1C6]/50 hover:bg-[#F6E1C6] text-[#214C6A] border border-[#214C6A]/20 cursor-pointer"
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Botones de acción del editor */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#214C6A]/20">
                        <button
                          type="button"
                          onClick={() => setIsEditingShift(false)}
                          className="px-4 py-2 border border-gray-400 hover:bg-gray-100 text-xs font-bold text-gray-700 cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-[#214C6A] hover:bg-[#1a3d55] text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Guardar Cambios de Turno</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* Active Shift Overview Banner */
                    <div className="bg-[#214C6A] text-white p-4 rounded-none border border-[#214C6A] flex flex-wrap items-center justify-between gap-3 shadow-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
                          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-300">
                            Turno de Caja Abierto
                          </span>
                        </div>
                        <h4 className="text-base sm:text-lg font-bold font-title mt-0.5">
                          Cajero(a) Encargado(a): <strong className="text-[#EB9D52] font-secondary">{currentShift.cashierName}</strong>
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-[#F6E1C6]/80">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Apertura: {new Date(currentShift.openedAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </span>
                          <span className="text-white/30">•</span>
                          <span>Base inicial: <strong className="text-white">{formatCOP(initialBase)}</strong></span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditCashier(currentShift.cashierName);
                            setEditBase(currentShift.initialCash ?? currentShift.initialBase ?? 150000);
                            setEditReason('');
                            setIsEditingShift(true);
                          }}
                          className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-none bg-[#EB9D52] hover:bg-[#F6E1C6] text-[#222E3A] transition-all cursor-pointer shadow-xs"
                          title="Editar usuario encargado de turno y su base inicial"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar Encargado e Inicio de Caja</span>
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-[#F6E1C6]/80 block">
                          Efectivo Teórico en Gaveta
                        </span>
                        <span className="text-2xl sm:text-3xl font-black text-[#EB9D52] font-secondary">
                          {formatCOP(expectedCashInDrawer)}
                        </span>
                        <span className="text-[10px] text-[#F6E1C6]/70 block mt-0.5">
                          Base {formatCOP(initialBase)} + Entradas - Salidas
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Cash Flow Balance Breakdown Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className="bg-[#FFF9F0] p-2.5 border border-[#214C6A]/20 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-[#63665B] block">1. Base Inicial</span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditCashier(currentShift.cashierName);
                              setEditBase(currentShift.initialCash ?? currentShift.initialBase ?? 150000);
                              setEditReason('');
                              setIsEditingShift(true);
                            }}
                            className="text-[10px] font-bold text-[#BC6343] hover:text-[#56291D] underline flex items-center gap-0.5 cursor-pointer"
                            title="Editar base de caja"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Editar</span>
                          </button>
                        </div>
                        <span className="text-base font-black text-[#214C6A]">{formatCOP(initialBase)}</span>
                      </div>
                      <span className="text-[10px] text-[#63665B] mt-1 truncate">
                        Por: {currentShift.cashierName}
                      </span>
                    </div>

                    <div className="bg-[#FFF9F0] p-2.5 border border-emerald-300 bg-emerald-50/50">
                      <span className="text-[10px] font-bold text-emerald-800 block">+ Ventas en Efectivo</span>
                      <span className="text-base font-black text-emerald-700">{formatCOP(cashSalesTotal)}</span>
                    </div>

                    <div className="bg-[#FFF9F0] p-2.5 border border-sky-300 bg-sky-50/50">
                      <span className="text-[10px] font-bold text-sky-800 block">+ Entradas / Abonos</span>
                      <span className="text-base font-black text-sky-700">{formatCOP(totalInflows + totalDebtCollectedCash)}</span>
                    </div>

                    <div className="bg-[#FFF9F0] p-2.5 border border-rose-300 bg-rose-50/50">
                      <span className="text-[10px] font-bold text-rose-800 block">- Gastos / Retiros</span>
                      <span className="text-base font-black text-rose-700">-{formatCOP(totalOutflows)}</span>
                    </div>
                  </div>

                  {/* Secondary payment methods summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="bg-indigo-50 border border-indigo-200 p-2.5 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-indigo-900 block">Ventas Electrónicas (Nequi / Datáfono)</span>
                        <span className="text-[10px] text-indigo-700">Entran a cuenta bancaria, no al cajón físico</span>
                      </div>
                      <span className="text-base font-black text-indigo-900">{formatCOP(electronicSalesTotal)}</span>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 p-2.5 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-amber-900 block">Ventas a Crédito (Fiadas)</span>
                        <span className="text-[10px] text-amber-700">Anotadas en cartera de clientes</span>
                      </div>
                      <span className="text-base font-black text-amber-900">{formatCOP(fiadoSalesTotal)}</span>
                    </div>
                  </div>

                  {/* Live Movements List in Current Shift */}
                  <div className="border border-[#214C6A]/20 bg-white p-3 space-y-2">
                    <div className="flex items-center justify-between border-b border-[#214C6A]/15 pb-1.5">
                      <h5 className="font-bold text-xs text-[#214C6A] flex items-center gap-1.5">
                        <ArrowDownRight className="w-4 h-4 text-[#BC6343]" />
                        Movimientos de Dinero en este Turno ({shiftMovements.length})
                      </h5>
                      <button
                        onClick={() => setActiveTab('movement')}
                        className="text-[11px] font-bold text-[#BC6343] hover:text-[#56291D] underline cursor-pointer"
                      >
                        + Registrar Salida / Entrada
                      </button>
                    </div>

                    {shiftMovements.length === 0 ? (
                      <p className="text-xs text-[#63665B] py-2 text-center">
                        No hay salidas ni entradas de dinero registradas en este turno.
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-44 overflow-y-auto">
                        {shiftMovements.map((m) => (
                          <div
                            key={m.id}
                            className={`p-2 rounded-none border text-xs flex items-center justify-between ${
                              m.type === 'inflow'
                                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                                : 'bg-rose-50/70 border-rose-200 text-rose-900'
                            }`}
                          >
                            <div>
                              <span className="font-bold mr-2">[{m.category || m.type}]</span>
                              <span>{m.reason}</span>
                              <span className="text-[10px] text-[#63665B] block">
                                {new Date(m.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} • por {m.cashierName}
                              </span>
                            </div>
                            <span className="font-black text-sm">
                              {m.type === 'inflow' ? '+' : '-'}{formatCOP(m.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: REGISTER CASH MOVEMENT (IN / OUT) */}
          {activeTab === 'movement' && (
            <form onSubmit={handleMovementSubmit} className="bg-white p-5 border-2 border-[#214C6A] shadow-md space-y-4 max-w-lg mx-auto">
              <div className="flex items-center justify-between border-b border-[#214C6A]/20 pb-2">
                <h4 className="font-bold text-sm text-[#214C6A]">Registrar Movimiento de Caja Menor</h4>
                <button
                  type="button"
                  onClick={() => setActiveTab('current')}
                  className="text-xs text-[#63665B] hover:text-[#e74c3c] font-bold"
                >
                  ✕ Volver
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-[#214C6A] block mb-1">Tipo de Movimiento:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovType('outflow')}
                    className={`py-2 rounded-none text-xs font-bold border-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      movType === 'outflow'
                        ? 'bg-rose-700 text-white border-rose-700'
                        : 'bg-[#FFF9F0] text-rose-900 border-rose-200 hover:bg-rose-50'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4" />
                    <span>Salida / Gasto (Resta de caja)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMovType('inflow')}
                    className={`py-2 rounded-none text-xs font-bold border-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      movType === 'inflow'
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-[#FFF9F0] text-emerald-900 border-emerald-200 hover:bg-emerald-50'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Entrada / Sencillo (Suma a caja)</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-[#214C6A] block mb-1">Monto (COP) *</label>
                  <input
                    type="number"
                    required
                    value={movAmount || ''}
                    onChange={(e) => setMovAmount(Number(e.target.value))}
                    placeholder="Ej: 15000"
                    className="w-full px-3 py-2 bg-[#FFF9F0] border border-[#214C6A]/30 rounded-none text-base font-black text-[#214C6A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#214C6A] block mb-1">Categoría</label>
                  <select
                    value={movCategory}
                    onChange={(e) => setMovCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#FFF9F0] border border-[#214C6A]/30 rounded-none text-xs font-bold text-[#214C6A]"
                  >
                    <option value="Gasto Menor">Gasto Menor (Tinto, Aseo, etc.)</option>
                    <option value="Pago Proveedor">Pago a Proveedor / Repartidor</option>
                    <option value="Ingreso Sencillo">Ingreso de Sencillo / Cambio</option>
                    <option value="Retiro Propietario">Retiro de Propietario</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#214C6A] block mb-1 text-xs">Concepto / Motivo Detallado *</label>
                <input
                  type="text"
                  required
                  value={movReason}
                  onChange={(e) => setMovReason(e.target.value)}
                  placeholder="Ej: Pago de 2 canastillas de leche a repartidor Colanta..."
                  className="w-full px-3 py-2 bg-[#FFF9F0] border border-[#214C6A]/30 rounded-none text-xs font-medium focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#214C6A] hover:bg-[#1a3d55] text-white text-xs font-black uppercase tracking-wider rounded-none cursor-pointer shadow-xs"
              >
                Guardar Movimiento en Caja
              </button>
            </form>
          )}

          {/* TAB 3: CLOSE SHIFT (REPORTE Z) */}
          {activeTab === 'close' && (
            <form onSubmit={handleCloseShiftSubmit} className="bg-white p-5 border-2 border-[#214C6A] shadow-md space-y-4 max-w-2xl mx-auto">
              <div className="border-b border-[#214C6A]/20 pb-2">
                <span className="text-[10px] uppercase font-black text-[#BC6343] tracking-wider">Reporte Z de Cierre</span>
                <h4 className="text-base font-extrabold text-[#214C6A]">Arqueo y Cierre de Turno de Caja</h4>
              </div>

              {/* Fast Bill Counter Drawer helper */}
              <div className="bg-[#F6E1C6]/40 p-3 border border-[#214C6A]/20 space-y-2">
                <span className="text-xs font-bold text-[#214C6A] flex items-center gap-1">
                  <Coins className="w-4 h-4 text-[#BC6343]" />
                  Contador Rápido de Billetes y Monedas (Opcional):
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-xs">
                  {[100000, 50000, 20000, 10000, 5000, 2000].map((b) => (
                    <div key={b} className="bg-white p-1 border border-[#214C6A]/20 text-center">
                      <span className="text-[10px] font-extrabold text-[#214C6A] block">${(b/1000)}k</span>
                      <input
                        type="number"
                        min="0"
                        value={billCounts[b] || ''}
                        onChange={(e) => updateBillCount(b, Number(e.target.value))}
                        placeholder="0"
                        className="w-full text-center text-xs font-bold border border-[#214C6A]/30 py-0.5"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Physical Cash Input vs Expected Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-[#FFF9F0] p-3 border border-[#214C6A]/20">
                  <span className="font-bold text-[#63665B] block">Efectivo Teórico Esperado</span>
                  <span className="text-lg font-black text-[#214C6A]">{formatCOP(expectedCashInDrawer)}</span>
                </div>

                <div className="bg-[#FFF9F0] p-3 border border-[#214C6A]/30">
                  <label className="font-bold text-[#214C6A] block mb-1">Efectivo Físico Contado (COP) *</label>
                  <input
                    type="number"
                    required
                    value={physicalCashCount || ''}
                    onChange={(e) => setPhysicalCashCount(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#214C6A] text-lg font-black text-[#214C6A]"
                  />
                </div>

                {/* Cash Difference Indicator */}
                {(() => {
                  const diff = physicalCashCount - expectedCashInDrawer;
                  const isPerfect = diff === 0;
                  const isShortage = diff < 0;

                  return (
                    <div className={`p-3 border font-bold ${
                      isPerfect
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : isShortage
                        ? 'bg-rose-50 border-rose-300 text-rose-900'
                        : 'bg-amber-50 border-amber-300 text-amber-900'
                    }`}>
                      <span className="block text-[10px] uppercase">Diferencia de Cuadre:</span>
                      <span className="text-lg font-black font-secondary">
                        {isPerfect ? '¡Cuadre Exacto! ($0)' : isShortage ? `Faltante: -${formatCOP(Math.abs(diff))}` : `Sobrante: +${formatCOP(diff)}`}
                      </span>
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="font-bold text-[#214C6A] block mb-1 text-xs">Observaciones de Cierre (Opcional)</label>
                <input
                  type="text"
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="Ej: Turno cerrado sin novedades, base de 100k queda para el siguiente turno..."
                  className="w-full px-3 py-1.5 bg-[#FFF9F0] border border-[#214C6A]/30 rounded-none text-xs"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('current')}
                  className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-none"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#BC6343] hover:bg-[#a5533a] text-white text-xs font-black uppercase tracking-wider rounded-none cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Lock className="w-4 h-4" />
                  <span>Confirmar y Cerrar Turno</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: SHIFT HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <h5 className="font-bold text-xs text-[#214C6A]">Historial de Turnos Cerrados</h5>
              {shiftHistory.length === 0 ? (
                <div className="p-8 text-center bg-white border border-[#214C6A]/20 text-[#63665B] text-xs">
                  Aún no se han guardado cierres de turnos anteriores.
                </div>
              ) : (
                <div className="space-y-2">
                  {shiftHistory.map((s) => (
                    <div key={s.id} className="bg-white p-3 border border-[#214C6A]/20 text-xs space-y-1.5">
                      <div className="flex items-center justify-between border-b border-[#214C6A]/10 pb-1">
                        <span className="font-bold text-[#214C6A]">
                          Turno #{s.id.slice(-4)} • Cajero: {s.cashierName}
                        </span>
                        <span className="text-[11px] text-[#63665B]">
                          {s.closedAt ? new Date(s.closedAt).toLocaleString('es-CO') : 'Cerrado'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        <div>Base: <strong>{formatCOP(s.initialBase)}</strong></div>
                        <div>Ventas Efvo: <strong>{formatCOP(s.summary?.cashSales || 0)}</strong></div>
                        <div>Físico Contado: <strong>{formatCOP(s.finalCashCount || 0)}</strong></div>
                        <div className={s.cashDifference && s.cashDifference < 0 ? 'text-rose-700 font-bold' : 'text-emerald-700 font-bold'}>
                          Diferencia: {formatCOP(s.cashDifference || 0)}
                        </div>
                      </div>
                      {s.notes && <p className="text-[10px] text-[#63665B] italic">Notas: {s.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-[#F6E1C6]/60 border-t-2 border-[#214C6A] flex items-center justify-between">
          <span className="text-xs text-[#56291D]">
            El cuadre de caja te permite auditar con precisión las ventas diarias y las salidas de caja menor.
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
