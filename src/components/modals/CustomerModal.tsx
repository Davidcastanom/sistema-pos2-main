import React, { useState } from 'react';
import { Customer, DebtPayment } from '@/types';
import { formatCOP } from '@/lib/utils';
import { 
  Users, 
  UserPlus, 
  Search, 
  DollarSign, 
  Phone, 
  MapPin, 
  FileText, 
  Check, 
  X, 
  AlertTriangle, 
  Receipt,
  Edit2,
  Trash2,
  CheckCircle2,
  Plus
} from 'lucide-react';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  onAddCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
  onUpdateCustomer: (id: string, updates: Partial<Customer>) => void;
  onSelectCustomerForCart?: (customer: Customer) => void;
  onRecordDebtPayment: (payment: Omit<DebtPayment, 'id' | 'timestamp'>) => void;
  debtPayments: DebtPayment[];
  cashierName: string;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  customers,
  onAddCustomer,
  onUpdateCustomer,
  onSelectCustomerForCart,
  onRecordDebtPayment,
  debtPayments,
  cashierName,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDebtOnly, setFilterDebtOnly] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  
  // Payment modal state for debt settlement
  const [payingCustomer, setPayingCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Nequi / Daviplata' | 'Tarjeta Débito/Crédito'>('Efectivo');
  const [paymentNote, setPaymentNote] = useState('');

  // New / Edit Form state
  const [formData, setFormData] = useState({
    name: '',
    documentId: '',
    phone: '',
    address: '',
    creditLimit: 100000,
    currentDebt: 0,
    notes: '',
  });

  if (!isOpen) return null;

  const filteredCustomers = customers.filter((c) => {
    const matchesQuery = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.documentId && c.documentId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.phone && c.phone.includes(searchQuery));
    if (filterDebtOnly) {
      return matchesQuery && c.currentDebt > 0;
    }
    return matchesQuery;
  });

  const totalOutstandingDebt = customers.reduce((sum, c) => sum + (c.currentDebt || 0), 0);
  const customersWithDebtCount = customers.filter((c) => c.currentDebt > 0).length;

  const handleStartAdd = () => {
    setEditingCustomerId(null);
    setFormData({
      name: '',
      documentId: '',
      phone: '',
      address: '',
      creditLimit: 150000,
      currentDebt: 0,
      notes: '',
    });
    setShowAddForm(true);
  };

  const handleStartEdit = (customer: Customer) => {
    setEditingCustomerId(customer.id);
    setFormData({
      name: customer.name,
      documentId: customer.documentId || '',
      phone: customer.phone || '',
      address: customer.address || '',
      creditLimit: customer.creditLimit || 0,
      currentDebt: customer.currentDebt || 0,
      notes: customer.notes || '',
    });
    setShowAddForm(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingCustomerId) {
      onUpdateCustomer(editingCustomerId, {
        name: formData.name.trim(),
        documentId: formData.documentId.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        creditLimit: Number(formData.creditLimit) || 0,
        currentDebt: Number(formData.currentDebt) || 0,
        notes: formData.notes.trim(),
      });
    } else {
      onAddCustomer({
        name: formData.name.trim(),
        documentId: formData.documentId.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        creditLimit: Number(formData.creditLimit) || 0,
        currentDebt: Number(formData.currentDebt) || 0,
        notes: formData.notes.trim(),
      });
    }
    setShowAddForm(false);
  };

  const handleStartPayment = (customer: Customer) => {
    setPayingCustomer(customer);
    setPaymentAmount(customer.currentDebt);
    setPaymentMethod('Efectivo');
    setPaymentNote('');
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingCustomer || paymentAmount <= 0) return;

    onRecordDebtPayment({
      customerId: payingCustomer.id,
      customerName: payingCustomer.name,
      amount: paymentAmount,
      paymentMethod,
      note: paymentNote,
      cashierName,
    });

    setPayingCustomer(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#222E3A]/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#FFF9F0] rounded-none max-w-4xl w-full shadow-2xl border-2 border-[#214C6A] overflow-hidden flex flex-col max-h-[92vh] text-[#222E3A]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#214C6A] border-b border-[#214C6A] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-none bg-[#BC6343] border border-white/20 flex items-center justify-center text-white shadow-xs">
              <Users className="w-5 h-5 text-[#FFF9F0]" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#EB9D52]">
                Cartera & Terceros
              </span>
              <h3 className="text-lg sm:text-xl font-bold font-title text-[#FFF9F0]">
                Directorio de Clientes y Cuentas por Cobrar (Fiados)
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

        {/* Top Metric Bar */}
        <div className="p-3 sm:p-4 bg-[#F6E1C6]/70 border-b border-[#214C6A]/20 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-[#FFF9F0] p-2.5 rounded-none border border-[#214C6A]/20">
            <span className="text-[10px] font-bold text-[#63665B] uppercase block">Total Clientes Registrados</span>
            <span className="text-xl font-black text-[#214C6A] font-secondary">
              {customers.length} clientes
            </span>
          </div>

          <div className="bg-[#FFF9F0] p-2.5 rounded-none border border-rose-300">
            <span className="text-[10px] font-bold text-rose-800 uppercase block">Total Cartera Fiada Pendiente</span>
            <span className="text-xl font-black text-rose-700 font-secondary">
              {formatCOP(totalOutstandingDebt)}
            </span>
          </div>

          <div className="bg-[#FFF9F0] p-2.5 rounded-none border border-[#214C6A]/20 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-[#63665B] uppercase block">Con Saldo Pendiente</span>
              <span className="text-xl font-black text-[#56291D] font-secondary">
                {customersWithDebtCount} personas
              </span>
            </div>
            <button
              onClick={handleStartAdd}
              className="px-3 py-1.5 rounded-none bg-[#214C6A] hover:bg-[#1a3d55] text-white text-xs font-bold transition-all flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Nuevo Cliente</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Add / Edit Form Modal Sub-panel */}
          {showAddForm && (
            <form onSubmit={handleSubmitForm} className="bg-[#FFF9F0] p-4 border-2 border-[#214C6A] shadow-md space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[#214C6A]/20 pb-2">
                <h4 className="font-bold text-sm text-[#214C6A]">
                  {editingCustomerId ? 'Editar Datos del Cliente' : 'Registrar Nuevo Cliente en Directorio'}
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-[#63665B] hover:text-[#e74c3c] font-bold"
                >
                  ✕ Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="font-bold text-[#214C6A] block mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Doña Gloria Ramírez"
                    className="w-full px-2.5 py-1.5 bg-white border border-[#214C6A]/30 rounded-none text-xs font-medium focus:ring-1 focus:ring-[#214C6A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#214C6A] block mb-1">Cédula / NIT / Documento</label>
                  <input
                    type="text"
                    value={formData.documentId}
                    onChange={(e) => setFormData({ ...formData, documentId: e.target.value })}
                    placeholder="Ej: 52.849.201"
                    className="w-full px-2.5 py-1.5 bg-white border border-[#214C6A]/30 rounded-none text-xs font-medium focus:ring-1 focus:ring-[#214C6A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#214C6A] block mb-1">Teléfono Celular / Contacto</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Ej: 312 458 9201"
                    className="w-full px-2.5 py-1.5 bg-white border border-[#214C6A]/30 rounded-none text-xs font-medium focus:ring-1 focus:ring-[#214C6A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#214C6A] block mb-1">Dirección / Apto / Local</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Ej: Calle 14 # 8-42"
                    className="w-full px-2.5 py-1.5 bg-white border border-[#214C6A]/30 rounded-none text-xs font-medium focus:ring-1 focus:ring-[#214C6A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#214C6A] block mb-1">Cupo Máximo de Fiado (COP)</label>
                  <input
                    type="number"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                    placeholder="150000"
                    className="w-full px-2.5 py-1.5 bg-white border border-[#214C6A]/30 rounded-none text-xs font-medium focus:ring-1 focus:ring-[#214C6A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#214C6A] block mb-1">Saldo Actual Deuda (COP)</label>
                  <input
                    type="number"
                    value={formData.currentDebt}
                    onChange={(e) => setFormData({ ...formData, currentDebt: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full px-2.5 py-1.5 bg-white border border-[#214C6A]/30 rounded-none text-xs font-medium focus:ring-1 focus:ring-[#214C6A] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#214C6A] block mb-1 text-xs">Notas / Días de pago habituales</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ej: Vecina de confianza, cancela quincenalmente"
                  className="w-full px-2.5 py-1.5 bg-white border border-[#214C6A]/30 rounded-none text-xs font-medium focus:ring-1 focus:ring-[#214C6A] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-none bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-none bg-[#BC6343] hover:bg-[#a5533a] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          )}

          {/* Record Debt Payment Sub-modal */}
          {payingCustomer && (
            <form onSubmit={handleConfirmPayment} className="bg-emerald-50 p-4 border-2 border-emerald-600 shadow-md space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-emerald-300 pb-2">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-700" />
                  <h4 className="font-bold text-sm text-emerald-900">
                    Registrar Abono a Deuda • <strong>{payingCustomer.name}</strong>
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setPayingCustomer(null)}
                  className="text-xs text-emerald-800 font-bold"
                >
                  ✕ Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[#63665B] block font-bold">Deuda Actual:</span>
                  <span className="text-base font-black text-rose-700">{formatCOP(payingCustomer.currentDebt)}</span>
                </div>

                <div>
                  <label className="font-bold text-emerald-900 block mb-1">Monto que Abona (COP) *</label>
                  <input
                    type="number"
                    required
                    max={payingCustomer.currentDebt}
                    value={paymentAmount || ''}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-emerald-400 rounded-none text-base font-black text-emerald-900 focus:outline-none"
                  />
                  <div className="flex gap-1 mt-1">
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(payingCustomer.currentDebt)}
                      className="text-[10px] text-emerald-800 underline font-bold"
                    >
                      Pagar Total ({formatCOP(payingCustomer.currentDebt)})
                    </button>
                    {payingCustomer.currentDebt > 20000 && (
                      <button
                        type="button"
                        onClick={() => setPaymentAmount(Math.floor(payingCustomer.currentDebt / 2))}
                        className="text-[10px] text-emerald-800 underline font-bold ml-2"
                      >
                        50% ({formatCOP(Math.floor(payingCustomer.currentDebt / 2))})
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-emerald-900 block mb-1">Método de Pago</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-white border border-emerald-400 rounded-none text-xs font-bold text-emerald-900"
                  >
                    <option value="Efectivo">Efectivo (Entra a Caja)</option>
                    <option value="Nequi / Daviplata">Nequi / Daviplata</option>
                    <option value="Tarjeta Débito/Crédito">Tarjeta Débito/Crédito</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-emerald-900 block mb-1 text-xs">Nota / Observación del Abono</label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="Ej: Abono quincenal, queda debiendo saldo restante..."
                  className="w-full px-2.5 py-1 bg-white border border-emerald-400 rounded-none text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-emerald-900">
                  Nuevo saldo tras abono: <strong>{formatCOP(Math.max(0, payingCustomer.currentDebt - paymentAmount))}</strong>
                </div>
                <button
                  type="submit"
                  disabled={paymentAmount <= 0}
                  className="px-5 py-2 rounded-none bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white text-xs font-black shadow-xs cursor-pointer"
                >
                  Registrar Abono y Generar Comprobante
                </button>
              </div>
            </form>
          )}

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#214C6A]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape' && searchQuery) {
                    e.preventDefault();
                    e.stopPropagation();
                    setSearchQuery('');
                  }
                }}
                placeholder="Buscar por nombre, cédula o teléfono de cliente..."
                className={`w-full pl-9 ${searchQuery ? 'pr-8' : 'pr-3'} py-1.5 rounded-none bg-[#FFF9F0] border border-[#214C6A]/30 text-xs text-[#222E3A] placeholder-[#63665B]/60 focus:ring-1 focus:ring-[#214C6A] focus:outline-none`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-600 p-0.5 rounded cursor-pointer transition-colors"
                  title="Borrar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => setFilterDebtOnly(!filterDebtOnly)}
              className={`px-3 py-1.5 rounded-none text-xs font-bold border transition-all cursor-pointer ${
                filterDebtOnly
                  ? 'bg-rose-700 text-white border-rose-700 shadow-2xs'
                  : 'bg-[#FFF9F0] text-rose-800 border-rose-300 hover:bg-rose-50'
              }`}
            >
              {filterDebtOnly ? 'Mostrando solo con Deuda' : 'Ver solo con Deuda'}
            </button>
          </div>

          {/* Customers Table / Grid */}
          <div className="border border-[#214C6A]/20 bg-white overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#214C6A] text-[#FFF9F0] text-[11px] font-bold uppercase tracking-wider">
                  <th className="p-2.5">Cliente</th>
                  <th className="p-2.5">Contacto / Cédula</th>
                  <th className="p-2.5">Cupo Fiado</th>
                  <th className="p-2.5">Deuda Pendiente</th>
                  <th className="p-2.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#214C6A]/10 text-[#222E3A]">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-[#63665B]">
                      No se encontraron clientes con el criterio de búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => {
                    const isOverLimit = (cust.creditLimit || 0) > 0 && cust.currentDebt >= (cust.creditLimit || 0);

                    return (
                      <tr key={cust.id} className="hover:bg-[#F6E1C6]/30 transition-colors">
                        <td className="p-2.5">
                          <div className="font-bold text-[#214C6A]">{cust.name}</div>
                          {cust.notes && <div className="text-[10px] text-[#63665B] italic">{cust.notes}</div>}
                        </td>
                        <td className="p-2.5">
                          {cust.documentId && <div className="font-mono text-[11px]">CC: {cust.documentId}</div>}
                          {cust.phone && <div className="text-[11px] text-[#63665B]">Tel: {cust.phone}</div>}
                          {cust.address && <div className="text-[10px] text-[#63665B] truncate max-w-[140px]">{cust.address}</div>}
                        </td>
                        <td className="p-2.5 font-medium">
                          {cust.creditLimit ? formatCOP(cust.creditLimit) : 'Sin límite'}
                        </td>
                        <td className="p-2.5">
                          {cust.currentDebt > 0 ? (
                            <div>
                              <span className="font-black text-rose-700 text-sm">
                                {formatCOP(cust.currentDebt)}
                              </span>
                              {isOverLimit && (
                                <span className="block text-[9px] font-black text-rose-800 bg-rose-100 px-1 py-0.2 rounded-none mt-0.5 border border-rose-300">
                                  Cupo copado
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-emerald-700 font-bold text-xs">Al día</span>
                          )}
                        </td>
                        <td className="p-2.5 text-right space-x-1">
                          {/* Choose for active cart */}
                          {onSelectCustomerForCart && (
                            <button
                              onClick={() => {
                                onSelectCustomerForCart(cust);
                                onClose();
                              }}
                              className="px-2 py-1 bg-[#214C6A] hover:bg-[#1a3d55] text-white text-[10px] font-bold rounded-none cursor-pointer"
                              title="Poner a este cliente en la cuenta de cobro actual"
                            >
                              Seleccionar
                            </button>
                          )}

                          {/* Record Payment if debt > 0 */}
                          {cust.currentDebt > 0 && (
                            <button
                              onClick={() => handleStartPayment(cust)}
                              className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold rounded-none cursor-pointer"
                              title="Registrar abono de dinero a la deuda"
                            >
                              Abonar
                            </button>
                          )}

                          {/* Edit button */}
                          <button
                            onClick={() => handleStartEdit(cust)}
                            className="p-1 text-[#63665B] hover:text-[#214C6A] cursor-pointer"
                            title="Editar datos del cliente"
                          >
                            <Edit2 className="w-3.5 h-3.5 inline" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-[#F6E1C6]/60 border-t-2 border-[#214C6A] flex items-center justify-between">
          <span className="text-xs text-[#56291D]">
            Las ventas registradas como <strong>Crédito / Fiado</strong> se suman automáticamente a la deuda del cliente.
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
