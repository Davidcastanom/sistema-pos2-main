import React, { useState, useEffect, useMemo } from 'react';
import { 
  Store, 
  Search, 
  Barcode, 
  Clock, 
  DollarSign, 
  ShoppingBag, 
  History, 
  PlusCircle, 
  Sparkles, 
  LayoutGrid, 
  Layers, 
  Zap, 
  Tag, 
  Plus, 
  X, 
  Settings2,
  Camera,
  Vault,
  Users,
  Package,
  BarChart3,
  Star,
  Check
} from 'lucide-react';
import { formatCOP, playBeep } from '@/lib/utils';
import { SaleTransaction, CashShift, ProductItem } from '@/types';

interface POSHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onBarcodeScan: (barcode: string) => void;
  totalSalesToday: number;
  transactionsToday: SaleTransaction[];
  currentShift: CashShift | null;
  onOpenHistory: () => void;
  onOpenAddProduct: () => void;
  onOpenManageCategories?: () => void;
  onOpenQuickAmount: () => void;
  onOpenCashShift: () => void;
  onOpenCustomers: () => void;
  onOpenInventoryManager: () => void;
  onOpenReports: () => void;
  showCategoryGallery: boolean;
  onToggleCategoryGallery: () => void;
  quickSearchChips: string[];
  onAddSearchChip: (chip: string) => void;
  onRemoveSearchChip: (chip: string) => void;
  onOpenManageQuickSearch: () => void;
  onOpenScannerModal?: () => void;
  products?: ProductItem[];
  favoriteIds?: (string | number)[];
  onAddToCart?: (product: ProductItem) => void;
  onToggleFavorite?: (productId: string | number) => void;
}

export const POSHeader: React.FC<POSHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onBarcodeScan,
  totalSalesToday,
  transactionsToday,
  currentShift,
  onOpenHistory,
  onOpenAddProduct,
  onOpenManageCategories,
  onOpenQuickAmount,
  onOpenCashShift,
  onOpenCustomers,
  onOpenInventoryManager,
  onOpenReports,
  showCategoryGallery,
  onToggleCategoryGallery,
  quickSearchChips,
  onAddSearchChip,
  onRemoveSearchChip,
  onOpenManageQuickSearch,
  onOpenScannerModal,
  products = [],
  favoriteIds = [],
  onAddToCart,
  onToggleFavorite,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [isEditingChips, setIsEditingChips] = useState<boolean>(false);
  const [inlineNewChip, setInlineNewChip] = useState<string>('');
  const [showInlineAdd, setShowInlineAdd] = useState<boolean>(false);
  const [justAddedTitle, setJustAddedTitle] = useState<string | null>(null);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute live search matches for instant quick registration
  const searchMatches = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [products, searchQuery]);

  const topMatch = searchMatches[0];
  const isTopMatchFavorite = topMatch ? favoriteIds.includes(topMatch.id) : false;

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      onBarcodeScan(barcodeInput.trim());
      setBarcodeInput('');
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (topMatch && onAddToCart) {
        e.preventDefault();
        onAddToCart(topMatch);
        playBeep();
        setJustAddedTitle(topMatch.title);
        setTimeout(() => setJustAddedTitle(null), 2500);
      }
    } else if (e.key === 'Escape') {
      onSearchChange('');
    }
  };

  const handleInlineAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = inlineNewChip.trim();
    if (val) {
      onAddSearchChip(val);
      setInlineNewChip('');
      setShowInlineAdd(false);
    }
  };

  const isShiftOpen = currentShift && currentShift.status === 'open';

  return (
    <header className="sticky top-0 z-30 bg-[#214C6A] border-b-2 border-[#1a3d55] shadow-lg">
      {/* Top Banner with Store Info, Modules & Status */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2.5">
        {/* Store Brand & Cashier */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-none bg-[#BC6343] flex items-center justify-center text-[#FFF9F0] border border-white/20 shrink-0 shadow-xs">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm sm:text-base text-[#FFF9F0] tracking-tight font-['Outfit',sans-serif]">
                Tienda Mixta <span className="text-[#EB9D52]">La Esquinita</span>
              </h1>
              <span className={`hidden md:inline-flex items-center gap-1 px-2 py-0.2 rounded-none text-[10px] font-black border ${
                isShiftOpen
                  ? 'bg-emerald-900/60 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-900/60 text-rose-300 border-rose-500/40'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isShiftOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                {isShiftOpen ? 'Caja Abierta' : 'Caja Cerrada'}
              </span>
            </div>
            <p className="text-[10px] text-[#F6E1C6]/80 flex items-center gap-1.5">
              <span>Cajero: <strong className="text-[#FFF9F0]">{currentShift?.cashierName || 'Don Esteban'}</strong></span>
              <span className="text-white/40">•</span>
              <span className="flex items-center gap-1 text-[#EB9D52] font-mono text-[10px]">
                <Clock className="w-3 h-3 text-[#EB9D52]" />
                {currentTime || '10:00 AM'}
              </span>
            </p>
          </div>
        </div>

        {/* Professional Navigation Modules & Quick Actions Bar */}
        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
          {/* Módulo 1: Control de Caja & Arqueo */}
          <button
            onClick={onOpenCashShift}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-none border text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 ${
              isShiftOpen
                ? 'bg-[#1a3d55] hover:bg-[#0f2433] text-white border-white/20'
                : 'bg-rose-700 hover:bg-rose-800 text-white border-rose-500 animate-pulse'
            }`}
            title="Abrir/Cerrar Turno, Arqueo de Caja y Control de Gastos Menores"
          >
            <Vault className="w-3.5 h-3.5 text-[#EB9D52]" />
            <span className="hidden sm:inline">Caja & Arqueo</span>
          </button>

          {/* Módulo 2: Clientes & Fiados */}
          <button
            onClick={onOpenCustomers}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-none bg-[#1a3d55] hover:bg-[#0f2433] border border-white/20 text-[#FFF9F0] text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            title="Directorio de clientes, cartera pendiente y abonos de fiados"
          >
            <Users className="w-3.5 h-3.5 text-[#EB9D52]" />
            <span className="hidden sm:inline">Clientes / Fiados</span>
          </button>

          {/* Módulo 3: Inventario & Kardex */}
          <button
            onClick={onOpenInventoryManager}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-none bg-[#1a3d55] hover:bg-[#0f2433] border border-white/20 text-[#FFF9F0] text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            title="Gestión de inventario, márgenes de ganancia, exportar/importar Excel"
          >
            <Package className="w-3.5 h-3.5 text-[#EB9D52]" />
            <span className="hidden sm:inline">Kardex</span>
          </button>

          {/* Módulo Categorías */}
          {onOpenManageCategories && (
            <button
              onClick={onOpenManageCategories}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-none bg-[#1a3d55] hover:bg-[#0f2433] border border-white/20 text-[#FFF9F0] text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
              title="Añadir, modificar y organizar categorías de productos"
            >
              <Layers className="w-3.5 h-3.5 text-[#EB9D52]" />
              <span className="hidden md:inline">Categorías</span>
            </button>
          )}

          {/* Módulo + Producto */}
          <button
            onClick={onOpenAddProduct}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-none bg-emerald-800 hover:bg-emerald-700 border border-emerald-500/50 text-[#FFF9F0] text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            title="Registrar nuevo producto al catálogo (F9)"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#EB9D52]" />
            <span className="hidden md:inline">+ Producto</span>
          </button>

          {/* Módulo 4: Reportes Financieros */}
          <button
            onClick={onOpenReports}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-none bg-[#1a3d55] hover:bg-[#0f2433] border border-white/20 text-[#FFF9F0] text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            title="Estadísticas de ventas, ganancias netas y productos más vendidos"
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#EB9D52]" />
            <span className="hidden sm:inline">Reportes</span>
          </button>

          {/* Quick Amount Button */}
          <button
            onClick={onOpenQuickAmount}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-none bg-[#BC6343] hover:bg-[#964937] border border-[#EB9D52]/50 text-[#FFF9F0] text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            title="Venta rápida por monto (F8)"
          >
            <Zap className="w-3.5 h-3.5 text-[#EB9D52]" />
            <span>Monto ($)</span>
          </button>

          {/* Daily Sales Quick Pill */}
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-none bg-[#1a3d55] hover:bg-[#0f2433] border border-white/20 text-[#FFF9F0] transition-all text-xs font-medium cursor-pointer shadow-xs active:scale-95"
            title="Ver historial de facturas del día (F10)"
          >
            <History className="w-3.5 h-3.5 text-[#EB9D52]" />
            <span className="font-extrabold text-xs font-['Outfit',sans-serif]">
              {formatCOP(totalSalesToday)}
            </span>
            <span className="text-[10px] bg-[#EB9D52] text-[#222E3A] font-black px-1 py-0.2 rounded-none">
              {transactionsToday.length}
            </span>
          </button>

          {/* Toggle Category Gallery */}
          <button
            onClick={onToggleCategoryGallery}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-none border text-xs font-bold transition-all cursor-pointer shadow-xs ${
              showCategoryGallery
                ? 'bg-[#EB9D52] text-[#222E3A] border-[#FFF9F0]'
                : 'bg-white/10 hover:bg-white/20 text-[#FFF9F0] border-white/15'
            }`}
            title="Ver / ocultar galería de categorías"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Galería</span>
          </button>
        </div>
      </div>

      {/* Search & Barcode Scan Bar */}
      <div className="bg-[#1a3d55] border-t border-white/10 px-3 sm:px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch gap-2">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#EB9D52]" />
            <input
              id="pos-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="🔍 Buscar o pegar nombre de producto (ej: Arroz, Leche, Huevos, Jabón, Aceite...)"
              className="w-full pl-9 pr-24 py-2 rounded-none bg-[#214C6A] border border-white/20 text-[#FFF9F0] placeholder-[#F6E1C6]/60 text-xs font-medium focus:ring-1 focus:ring-[#EB9D52] focus:outline-none shadow-inner"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="text-[#F6E1C6]/70 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded-none hover:bg-black/20 cursor-pointer"
                  title="Limpiar búsqueda (Esc)"
                >
                  ✕
                </button>
              )}
              {topMatch && (
                <button
                  type="button"
                  onClick={() => {
                    if (onAddToCart) {
                      onAddToCart(topMatch);
                      playBeep();
                      setJustAddedTitle(topMatch.title);
                      setTimeout(() => setJustAddedTitle(null), 2500);
                    }
                  }}
                  className="px-1.5 py-0.5 rounded-none bg-[#BC6343] hover:bg-[#964937] text-white text-[10px] font-extrabold flex items-center gap-1 cursor-pointer shadow-xs border border-white/30"
                  title="Presiona Enter o haz clic para agregar directo a la factura"
                >
                  <Zap className="w-3 h-3 text-[#EB9D52]" />
                  <span>Enter</span>
                </button>
              )}
              <span className="hidden sm:inline-block px-1.5 py-0.2 rounded-none bg-[#1a3d55] border border-white/20 text-[9px] font-mono text-[#EB9D52]">
                F2
              </span>
            </div>
          </div>

          {/* Barcode Scanner Input with Camera Button */}
          <form onSubmit={handleBarcodeSubmit} className="relative w-full md:w-80">
            <Barcode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#EB9D52]" />
            <input
              id="pos-barcode-input"
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Pistola / Código de barras"
              className="w-full pl-9 pr-24 py-2 rounded-none bg-[#214C6A] border border-white/20 text-[#FFF9F0] placeholder-[#F6E1C6]/60 text-xs font-mono focus:ring-1 focus:ring-[#EB9D52] focus:outline-none shadow-inner"
            />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {onOpenScannerModal && (
                <button
                  type="button"
                  onClick={onOpenScannerModal}
                  className="p-1 rounded-none bg-[#1a3d55] hover:bg-[#0f2433] border border-white/20 text-[#EB9D52] hover:text-white transition-all cursor-pointer"
                  title="Lector con cámara (F3)"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="submit"
                className="px-2 py-1 rounded-none bg-[#BC6343] hover:bg-[#964937] text-[#FFF9F0] text-[11px] font-bold cursor-pointer"
              >
                Escanear
              </button>
            </div>
          </form>
        </div>

        {/* Instant Search Match & Quick Register Banner */}
        {searchQuery && searchMatches.length > 0 && topMatch && (
          <div className="max-w-7xl mx-auto mt-2 p-2 bg-[#0c1e2b] border border-[#EB9D52]/50 shadow-md flex flex-wrap items-center justify-between gap-2 animate-fadeIn">
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-[10px] font-black text-[#EB9D52] uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-[#EB9D52]" /> Coincidencia lista para facturar:
              </span>
              <button
                type="button"
                onClick={() => {
                  if (onAddToCart) {
                    onAddToCart(topMatch);
                    playBeep();
                    setJustAddedTitle(topMatch.title);
                    setTimeout(() => setJustAddedTitle(null), 2500);
                  }
                }}
                className="px-3 py-1 bg-[#BC6343] hover:bg-[#a64f32] text-white text-xs font-black rounded-none flex items-center gap-1.5 cursor-pointer shadow-xs border border-[#EB9D52]/70 active:scale-95 transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5 text-[#EB9D52]" />
                <span>+ Facturar Ahora: <strong>{topMatch.title}</strong> ({formatCOP(topMatch.price)}) [Enter]</span>
              </button>

              {justAddedTitle && (
                <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 border border-emerald-500/40 flex items-center gap-1 animate-pulse">
                  <Check className="w-3 h-3 text-emerald-400 stroke-[3]" /> ¡Agregado a la factura!
                </span>
              )}
            </div>

            {/* Quick Favorites & Search Chip Actions for this searched term */}
            <div className="flex items-center gap-1.5">
              {onToggleFavorite && (
                <button
                  type="button"
                  onClick={() => onToggleFavorite(topMatch.id)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-none flex items-center gap-1 cursor-pointer transition-all border ${
                    isTopMatchFavorite
                      ? 'bg-amber-400 text-slate-900 border-amber-300 shadow-xs'
                      : 'bg-white/10 hover:bg-white/20 text-[#F6E1C6] border-white/20'
                  }`}
                  title="Fijar este producto en los botones de acceso rápido superiores"
                >
                  <Star className={`w-3.5 h-3.5 ${isTopMatchFavorite ? 'fill-amber-900 text-amber-900' : 'text-amber-300'}`} />
                  <span>{isTopMatchFavorite ? 'En Botones Rápidos ⭐' : 'Fijar a Botones Rápidos ⭐'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  const clean = searchQuery.trim();
                  if (clean && !quickSearchChips.includes(clean)) {
                    onAddSearchChip(clean);
                  }
                }}
                className="px-2 py-1 text-[11px] font-bold rounded-none bg-white/10 hover:bg-white/20 text-[#F6E1C6] border border-white/20 flex items-center gap-1 cursor-pointer"
                title="Guardar esta búsqueda como chip de acceso rápido"
              >
                <Tag className="w-3 h-3 text-[#EB9D52]" />
                <span>+ Guardar Chip</span>
              </button>
            </div>

            {/* Secondary matches if any */}
            {searchMatches.length > 1 && (
              <div className="w-full flex items-center gap-1.5 text-[11px] text-[#F6E1C6]/80 overflow-x-auto scrollbar-none pt-1 border-t border-white/10">
                <span className="text-[10px] text-white/50 shrink-0">Otras coincidencias:</span>
                {searchMatches.slice(1, 5).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      if (onAddToCart) {
                        onAddToCart(p);
                        playBeep();
                        setJustAddedTitle(p.title);
                        setTimeout(() => setJustAddedTitle(null), 2500);
                      }
                    }}
                    className="px-2 py-0.5 bg-[#1a3d55] hover:bg-[#214C6A] text-white rounded-none border border-white/20 text-[10px] font-semibold flex items-center gap-1 cursor-pointer truncate shrink-0 transition-colors"
                  >
                    <span>+ {p.title} ({formatCOP(p.price)})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Search Chips Bar with subtle glass finish */}
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto pt-2 pb-0.5 text-xs text-[#F6E1C6] scrollbar-none">
          <span className="text-[10px] font-bold text-[#EB9D52] uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Tag className="w-3 h-3 text-[#EB9D52]" /> Búsqueda rápida:
          </span>

          {quickSearchChips.map((chip) => (
            <div key={chip} className="flex items-center shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (isEditingChips) {
                    onRemoveSearchChip(chip);
                  } else {
                    onSearchChange(searchQuery === chip ? '' : chip);
                  }
                }}
                className={`px-2.5 py-0.5 rounded-none text-[11px] font-medium transition-all shrink-0 cursor-pointer border flex items-center gap-1 backdrop-blur-xs shadow-2xs ${
                  isEditingChips
                    ? 'bg-rose-700 border-rose-500 text-white'
                    : searchQuery === chip
                    ? 'bg-[#BC6343] text-white border-[#EB9D52] font-bold shadow-xs'
                    : 'bg-white/85 hover:bg-white text-[#214C6A] border-white/60 font-semibold'
                }`}
              >
                <span>{chip}</span>
                {isEditingChips ? <X className="w-3 h-3 text-white stroke-[3]" /> : null}
              </button>
            </div>
          ))}

          {/* Inline Add Chip Form or Trigger Button */}
          {showInlineAdd ? (
            <form onSubmit={handleInlineAddSubmit} className="flex items-center gap-1 shrink-0">
              <input
                type="text"
                value={inlineNewChip}
                onChange={(e) => setInlineNewChip(e.target.value)}
                placeholder="Nombre..."
                className="w-24 px-2 py-0.5 rounded-none bg-[#1a3d55]/90 backdrop-blur-xs border border-[#EB9D52] text-[#FFF9F0] text-[11px] focus:outline-none"
                autoFocus
              />
              <button
                type="submit"
                className="px-2 py-0.5 rounded-none bg-[#BC6343] hover:bg-[#a5533a] text-[#FFF9F0] text-[10px] font-bold cursor-pointer shadow-xs"
              >
                OK
              </button>
              <button
                type="button"
                onClick={() => setShowInlineAdd(false)}
                className="px-1 text-[#F6E1C6] hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowInlineAdd(true)}
              className="px-2.5 py-0.5 rounded-none text-[10px] font-bold text-[#222E3A] bg-[#EB9D52]/90 hover:bg-[#EB9D52] backdrop-blur-xs transition-all shrink-0 cursor-pointer flex items-center gap-1 shadow-xs border border-white/30"
              title="Añadir nueva palabra a la búsqueda rápida"
            >
              <Plus className="w-3 h-3 stroke-[3]" />
              <span>Añadir</span>
            </button>
          )}

          {/* Edit / Remove Chips Mode Button */}
          {quickSearchChips.length > 0 && (
            <button
              type="button"
              onClick={() => setIsEditingChips(!isEditingChips)}
              className={`px-2 py-0.5 rounded-none text-[10px] font-bold transition-all shrink-0 cursor-pointer border backdrop-blur-xs ${
                isEditingChips
                  ? 'bg-[#EB9D52] text-[#222E3A] border-white shadow-xs'
                  : 'bg-white/10 hover:bg-white/20 text-[#F6E1C6] border-white/20'
              }`}
            >
              {isEditingChips ? 'Listo' : 'Quitar'}
            </button>
          )}

          {/* Full Manage Chips Modal Button */}
          <button
            type="button"
            onClick={onOpenManageQuickSearch}
            className="text-[#EB9D52] hover:text-[#FFF9F0] p-1 shrink-0 cursor-pointer transition-colors"
            title="Administrar toda la lista de búsqueda rápida"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
