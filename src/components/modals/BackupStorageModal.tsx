import React, { useState, useRef, useMemo } from 'react';
import {
  ProductItem,
  CategoryName,
  Customer,
  Supplier,
  SupplierOrder,
  FixedMonthlyCosts,
  SaleTransaction,
  CashShift,
  StoreInfo,
  FullBackupData
} from '@/types';
import {
  getStorageUsageReport,
  buildMasterBackup,
  downloadJsonFile,
  validateBackupData,
  filterSalesForPruning,
  formatBytes
} from '@/lib/storageManager';
import {
  X,
  HardDrive,
  Download,
  Upload,
  ShieldCheck,
  Trash2,
  AlertTriangle,
  FileJson,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
  Archive,
  RefreshCw,
  Layers,
  Lock
} from 'lucide-react';

interface BackupStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductItem[];
  categories: CategoryName[];
  customers: Customer[];
  suppliers: Supplier[];
  supplierOrders: SupplierOrder[];
  fixedCosts: FixedMonthlyCosts;
  salesHistory: SaleTransaction[];
  shiftHistory: CashShift[];
  currentShift: CashShift | null;
  storeInfo: StoreInfo;
  quickSearchChips: string[];
  favoriteProductIds: string[];
  onRestoreBackup: (backup: FullBackupData) => void;
  onPruneSales: (keptSales: SaleTransaction[], prunedCount: number) => void;
}

export const BackupStorageModal: React.FC<BackupStorageModalProps> = ({
  isOpen,
  onClose,
  products,
  categories,
  customers,
  suppliers,
  supplierOrders,
  fixedCosts,
  salesHistory,
  shiftHistory,
  currentShift,
  storeInfo,
  quickSearchChips,
  favoriteProductIds,
  onRestoreBackup,
  onPruneSales,
}) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'prune' | 'health'>('backup');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [pendingBackupData, setPendingBackupData] = useState<FullBackupData | null>(null);
  const [pendingSummary, setPendingSummary] = useState<any | null>(null);

  // Pruning options
  const [pruneMode, setPruneMode] = useState<'keepLast' | 'olderThanDays'>('keepLast');
  const [keepCount, setKeepCount] = useState<number>(100);
  const [olderDays, setOlderDays] = useState<number>(60);
  const [pruneSuccessMessage, setPruneSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const storageReport = useMemo(() => {
    return getStorageUsageReport(salesHistory.length);
  }, [salesHistory.length, products.length, customers.length, suppliers.length, isOpen]);

  const { keptSales, prunedSales } = useMemo(() => {
    return filterSalesForPruning(salesHistory, {
      mode: pruneMode,
      keepCount,
      days: olderDays,
    });
  }, [salesHistory, pruneMode, keepCount, olderDays]);

  if (!isOpen) return null;

  // Handle Export Full Backup
  const handleExportMasterBackup = () => {
    const backup = buildMasterBackup({
      storeInfo,
      products,
      categories,
      customers,
      suppliers,
      supplierOrders,
      fixedCosts,
      salesHistory,
      shiftHistory,
      currentShift,
      quickSearchChips,
      favoriteProductIds,
    });

    const dateSlug = new Date().toISOString().split('T')[0];
    const cleanStoreName = (storeInfo.shortName || storeInfo.name || 'tienda')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');
    const filename = `respaldo_${cleanStoreName}_${dateSlug}.json`;

    downloadJsonFile(filename, backup);
    setUploadSuccess(`Copia de seguridad descargada exitosamente: ${filename}`);
    setTimeout(() => setUploadSuccess(null), 5000);
  };

  // Handle File Upload for Restore
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadSuccess(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const validation = validateBackupData(parsed);

        if (!validation.isValid) {
          setUploadError(validation.error || 'El archivo no es un respaldo válido.');
          return;
        }

        setPendingBackupData(parsed as FullBackupData);
        setPendingSummary(validation.summary);
      } catch (err: any) {
        setUploadError('Error al leer el archivo JSON: ' + (err?.message || 'Archivo corrupto'));
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Confirm Restore
  const handleConfirmRestore = () => {
    if (!pendingBackupData) return;
    onRestoreBackup(pendingBackupData);
    setPendingBackupData(null);
    setPendingSummary(null);
    setUploadSuccess('¡Datos restaurados con éxito! Todo tu inventario, clientes y ventas están al día.');
  };

  // Handle Pruning with Automatic Prior Archive Download
  const handleExecutePrune = () => {
    if (prunedSales.length === 0) return;

    // 1. Auto-download archived sales file for safety
    const dateSlug = new Date().toISOString().split('T')[0];
    const archiveFileName = `archivo_ventas_anteriores_${dateSlug}_(${prunedSales.length}_facturas).json`;
    downloadJsonFile(archiveFileName, {
      description: 'Historial de facturas depurado y archivado para mantener la memoria del POS rápida y liviana.',
      archiveDate: new Date().toISOString(),
      store: storeInfo.name,
      totalArchivedSales: prunedSales.length,
      sales: prunedSales,
    });

    // 2. Perform pruning in state
    onPruneSales(keptSales, prunedSales.length);
    setPruneSuccessMessage(
      `Se depuraron ${prunedSales.length} facturas antiguas. Tu respaldo contable se descargó automáticamente (${archiveFileName}).`
    );
    setTimeout(() => setPruneSuccessMessage(null), 8000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#214C6A] text-white p-4 sm:p-5 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#EB9D52]">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg tracking-tight flex items-center gap-2">
                Memoria, Copias y Respaldo
                <span className="text-[10px] uppercase font-bold bg-[#EB9D52] text-[#214C6A] px-2 py-0.5 rounded-full">
                  100% Seguro
                </span>
              </h3>
              <p className="text-xs text-[#F6E1C6]/80">
                Protege tus productos, clientes y fiados sin riesgo de pérdida de datos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2 py-2.5 px-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'backup'
                ? 'border-[#214C6A] text-[#214C6A] bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-[#EB9D52]" />
            <span>Copia Maestra & Restaurar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('prune')}
            className={`flex items-center gap-2 py-2.5 px-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'prune'
                ? 'border-[#214C6A] text-[#214C6A] bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#BC6343]" />
            <span>Depuración con Consentimiento</span>
            {salesHistory.length > 200 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('health')}
            className={`flex items-center gap-2 py-2.5 px-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'health'
                ? 'border-[#214C6A] text-[#214C6A] bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>Uso de Memoria</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 bg-[#FDFBF7]">
          {/* Global feedback alerts */}
          {uploadSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2.5 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{uploadSuccess}</span>
            </div>
          )}

          {uploadError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2.5 shadow-2xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* TAB 1: BACKUP & RESTORE */}
          {activeTab === 'backup' && (
            <div className="space-y-5">
              {/* Export Card */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#214C6A]/10 text-[#214C6A] flex items-center justify-center font-bold">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">1. Descargar Respaldo Maestro (.json)</h4>
                      <p className="text-xs text-slate-500">Guarda en 1 solo archivo toda la vida de tu negocio</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {formatBytes(storageReport.totalUsedBytes)} de datos
                  </span>
                </div>

                <div className="bg-[#FFF9F0] border border-[#EB9D52]/30 rounded-lg p-3 text-xs text-[#56291D] space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5 text-[#214C6A]">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>¿Qué incluye este archivo de respaldo?</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                    <div className="flex items-center gap-1">
                      <span className="text-emerald-600 font-bold">✓</span> {products.length} Productos y Precios
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-emerald-600 font-bold">✓</span> {customers.length} Clientes y Fiados
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-emerald-600 font-bold">✓</span> {suppliers.length} Proveedores
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-emerald-600 font-bold">✓</span> {salesHistory.length} Ventas realizadas
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-emerald-600 font-bold">✓</span> {categories.length} Categorías
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-emerald-600 font-bold">✓</span> Logotipo y NIT de Tienda
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleExportMasterBackup}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#214C6A] hover:bg-[#1a3d55] text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer active:scale-98"
                  >
                    <Download className="w-4 h-4 text-[#EB9D52]" />
                    <span>Descargar Copia de Seguridad Ahora</span>
                  </button>
                  <span className="text-[11px] text-slate-400 text-center sm:text-right">
                    Guárdalo en tu WhatsApp, USB o Google Drive.
                  </span>
                </div>
              </div>

              {/* Restore Card */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">2. Restaurar Copia de Seguridad</h4>
                    <p className="text-xs text-slate-500">¿Cambiaste de equipo o borraste el historial? Vuelve a cargar tu negocio aquí</p>
                  </div>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="backup-file-input"
                />

                {!pendingBackupData ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-[#214C6A] rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-slate-50 group"
                  >
                    <FileJson className="w-9 h-9 text-slate-400 group-hover:text-[#214C6A] transition-colors mb-2" />
                    <span className="text-xs font-bold text-slate-700">Toca aquí para seleccionar tu archivo de respaldo (.json)</span>
                    <span className="text-[11px] text-slate-400 mt-0.5">Ej: respaldo_la_promesa_2026.json</span>
                  </div>
                ) : (
                  /* Verification Preview Before Restore */
                  <div className="p-4 bg-emerald-50/60 border border-emerald-300 rounded-xl space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-emerald-900">Archivo de Respaldo Verificado</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPendingBackupData(null);
                          setPendingSummary(null);
                        }}
                        className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                      >
                        Cancelar selección
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-700">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Negocio:</span>
                        <strong className="text-slate-900">{pendingSummary.storeName}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Fecha Exportado:</span>
                        <strong>{new Date(pendingSummary.exportDate).toLocaleDateString('es-CO')}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Productos:</span>
                        <strong className="text-emerald-700">{pendingSummary.productsCount} productos</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Clientes:</span>
                        <strong>{pendingSummary.customersCount} clientes</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Proveedores:</span>
                        <strong>{pendingSummary.suppliersCount} proveedores</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Facturas:</span>
                        <strong>{pendingSummary.salesCount} ventas</strong>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={handleConfirmRestore}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Confirmar y Restaurar Todo al POS</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SELECTIVE PRUNING WITH CONSENT */}
          {activeTab === 'prune' && (
            <div className="space-y-5">
              {/* Golden Rule Notice */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                <Lock className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 space-y-1">
                  <h4 className="font-bold text-emerald-950">Garantía Inviolable de Seguridad:</h4>
                  <p>
                    <strong>Tus Productos creados, Clientes, Fiados pendientes y Proveedores NUNCA se tocan ni se borrarán.</strong>{' '}
                    Esta herramienta únicamente depura <em>facturas antiguas ya cerradas</em> que acumulan peso en el navegador.
                  </p>
                </div>
              </div>

              {pruneSuccessMessage && (
                <div className="p-3.5 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-center gap-2 shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{pruneSuccessMessage}</span>
                </div>
              )}

              {/* Pruning Options Card */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#BC6343]" />
                    Depurar Facturas Antiguas con Consentimiento
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Actualmente tienes <strong>{salesHistory.length} facturas</strong> registradas en el POS.
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Option 1: Keep Last N */}
                  <label
                    className={`block p-3 rounded-xl border cursor-pointer transition-all ${
                      pruneMode === 'keepLast'
                        ? 'border-[#214C6A] bg-[#214C6A]/5 ring-1 ring-[#214C6A]'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="pruneMode"
                        checked={pruneMode === 'keepLast'}
                        onChange={() => setPruneMode('keepLast')}
                        className="text-[#214C6A] focus:ring-[#214C6A]"
                      />
                      <div className="flex-1">
                        <span className="text-xs font-bold text-slate-800">Conservar solo las ventas más recientes</span>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-slate-600">Mantener las últimas:</span>
                          <select
                            value={keepCount}
                            onChange={(e) => setKeepCount(Number(e.target.value))}
                            disabled={pruneMode !== 'keepLast'}
                            className="text-xs font-bold bg-white border border-slate-300 rounded-md px-2 py-1 focus:ring-1 focus:ring-[#214C6A]"
                          >
                            <option value={50}>50 facturas más recientes</option>
                            <option value={100}>100 facturas más recientes</option>
                            <option value={200}>200 facturas más recientes</option>
                            <option value={500}>500 facturas más recientes</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </label>

                  {/* Option 2: Older Than Days */}
                  <label
                    className={`block p-3 rounded-xl border cursor-pointer transition-all ${
                      pruneMode === 'olderThanDays'
                        ? 'border-[#214C6A] bg-[#214C6A]/5 ring-1 ring-[#214C6A]'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="pruneMode"
                        checked={pruneMode === 'olderThanDays'}
                        onChange={() => setPruneMode('olderThanDays')}
                        className="text-[#214C6A] focus:ring-[#214C6A]"
                      />
                      <div className="flex-1">
                        <span className="text-xs font-bold text-slate-800">Depurar por antigüedad de días</span>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-slate-600">Depurar facturas con más de:</span>
                          <select
                            value={olderDays}
                            onChange={(e) => setOlderDays(Number(e.target.value))}
                            disabled={pruneMode !== 'olderThanDays'}
                            className="text-xs font-bold bg-white border border-slate-300 rounded-md px-2 py-1 focus:ring-1 focus:ring-[#214C6A]"
                          >
                            <option value={30}>30 días de antigüedad</option>
                            <option value={60}>60 días de antigüedad (2 meses)</option>
                            <option value={90}>90 días de antigüedad (3 meses)</option>
                            <option value={180}>180 días de antigüedad (6 meses)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Calculation Impact Summary */}
                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Facturas que permanecerán en el POS:</span>
                    <strong className="text-emerald-700 text-sm">{keptSales.length} facturas activas</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Facturas que se van a archivar y liberar:</span>
                    <strong className="text-[#BC6343] text-sm">{prunedSales.length} facturas antiguas</strong>
                  </div>
                  <p className="text-[11px] text-amber-800 pt-1 border-t border-amber-200/60 flex items-center gap-1.5">
                    <Archive className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>
                      <strong>Protección Contable Automática:</strong> Al pulsar el botón, el sistema descargará{' '}
                      <em>inmediatamente</em> un archivo con las {prunedSales.length} facturas archivadas para que nunca pierdas tu contabilidad.
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleExecutePrune}
                  disabled={prunedSales.length === 0}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#BC6343] hover:bg-[#a35235] disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  <Archive className="w-4 h-4 text-[#FFF9F0]" />
                  <span>
                    {prunedSales.length > 0
                      ? `Descargar Archivo Contable y Depurar ${prunedSales.length} Facturas Antiguas`
                      : 'No hay facturas que cumplan este criterio para depurar'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: STORAGE HEALTH & PRACTICAL TIPS */}
          {activeTab === 'health' && (
            <div className="space-y-5">
              {/* Storage Gauge */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <HardDrive className="w-4 h-4 text-[#214C6A]" />
                    <span>Capacidad de Almacenamiento del Navegador</span>
                  </div>
                  <span className="text-xs font-extrabold text-[#214C6A]">
                    {storageReport.usagePercent}% Usado ({formatBytes(storageReport.totalUsedBytes)} de ~5 MB)
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200 p-0.5">
                  <div
                    className={`h-full rounded-full transition-all ${
                      storageReport.usagePercent > 75
                        ? 'bg-rose-500'
                        : storageReport.usagePercent > 50
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.max(4, storageReport.usagePercent)}%` }}
                  />
                </div>

                <p className="text-[11px] text-slate-500">
                  {storageReport.usagePercent < 50 ? (
                    <span className="text-emerald-700 font-semibold">
                      ✓ Estado Óptimo: Tienes espacio suficiente para meses continuos de ventas.
                    </span>
                  ) : (
                    <span className="text-amber-700 font-semibold">
                      Te sugerimos realizar una copia de respaldo y depurar facturas viejas.
                    </span>
                  )}
                </p>
              </div>

              {/* Data Breakdown Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700">
                  Desglose de Datos en Memoria
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {storageReport.items.map((item) => (
                    <div key={item.key} className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {item.isVital ? (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-sm">
                            PROTEGIDO
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-sm">
                            HISTORIAL
                          </span>
                        )}
                        <span className="font-semibold text-slate-800">{item.label}</span>
                        <span className="text-slate-400 text-[11px]">({item.count} registros)</span>
                      </div>
                      <span className="font-mono text-slate-600 text-[11px]">{formatBytes(item.bytes)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Practical Tips For The Shopkeeper */}
              <div className="p-4 bg-[#FFF9F0] border border-[#EB9D52]/40 rounded-xl space-y-2 text-xs text-[#56291D]">
                <div className="font-bold flex items-center gap-1.5 text-[#214C6A]">
                  <Info className="w-4 h-4 text-[#BC6343]" />
                  <span>3 Reglas de Oro para Operar Seguro sin Base de Datos:</span>
                </div>
                <ol className="list-decimal pl-4 space-y-1.5 text-[11.5px]">
                  <li>
                    <strong>Respaldo mensual en 1 clic:</strong> Al finalizar cada mes, ve a la pestaña "Copia Maestra" y descarga tu archivo. Envíatelo a tu propio WhatsApp o guárdalo en tu correo.
                  </li>
                  <li>
                    <strong>No borres los datos del navegador a ciegas:</strong> Si tu navegador te pide "Liberar espacio", no selecciones "Borrar datos de sitios web". En su lugar, usa el botón de depuración de esta ventana.
                  </li>
                  <li>
                    <strong>Para cambiar de equipo:</strong> Si compras un computador nuevo o cambias de celular, descargas el respaldo en el equipo viejo, abres el link de Vercel en el equipo nuevo, presionas "Restaurar Copia de Seguridad" y en 1 segundo tu negocio sigue funcionando idéntico.
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tus datos de productos y fiados son prioritarios y están protegidos</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
