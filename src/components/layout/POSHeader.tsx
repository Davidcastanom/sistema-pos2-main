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
  Check,
  Truck,
  ChevronLeft,
  ChevronRight,
  Edit3,
  GripHorizontal
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
  onOpenSuppliers?: () => void;
  onOpenReports: () => void;
  onOpenManagerDashboard?: () => void;
  showCategoryGallery: boolean;
  onToggleCategoryGallery: () => void;
  quickSearchChips: string[];
  onAddSearchChip: (chip: string) => void;
  onRemoveSearchChip: (chip: string) => void;
  onOpenManageQuickSearch: () => void;
  onOpenScannerModal?: () => void;
  onOpenLiquidGlassGuide?: () => void;
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
  onOpenSuppliers,
  onOpenReports,
  onOpenManagerDashboard,
  showCategoryGallery,
  onToggleCategoryGallery,
  quickSearchChips,
  onAddSearchChip,
  onRemoveSearchChip,
  onOpenManageQuickSearch,
  onOpenScannerModal,
  onOpenLiquidGlassGuide,
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
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const navScrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(false);
  const [hasOverflow, setHasOverflow] = useState<boolean>(false);
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  // Drag-to-scroll ("agarre y desplazamiento")
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const isMouseDownRef = React.useRef<boolean>(false);
  const startXRef = React.useRef<number>(0);
  const scrollLeftStartRef = React.useRef<number>(0);
  const hasMovedRef = React.useRef<boolean>(false);

  const checkNavScroll = React.useCallback(() => {
    if (navScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = navScrollRef.current;
      const maxScroll = Math.max(0, scrollWidth - clientWidth);
      setHasOverflow(maxScroll > 10);
      setCanScrollLeft(scrollLeft > 6);
      setCanScrollRight(scrollLeft < maxScroll - 6);
      setScrollProgress(maxScroll > 0 ? Math.min(100, Math.max(0, (scrollLeft / maxScroll) * 100)) : 0);
    }
  }, []);

  useEffect(() => {
    checkNavScroll();
    const el = navScrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkNavScroll, { passive: true });
    }
    window.addEventListener('resize', checkNavScroll);
    return () => {
      if (el) el.removeEventListener('scroll', checkNavScroll);
      window.removeEventListener('resize', checkNavScroll);
    };
  }, [checkNavScroll]);

  // Translate vertical wheel on navigation into smooth horizontal scrolling
  useEffect(() => {
    const el = navScrollRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return;
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY * 0.9;
        checkNavScroll();
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, [checkNavScroll]);

  const handleNavScroll = (dir: 'left' | 'right') => {
    if (navScrollRef.current) {
      const offset = dir === 'left' ? -220 : 220;
      navScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
      setTimeout(checkNavScroll, 280);
    }
  };

  // Mouse drag-to-scroll handlers
  const handleNavMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only primary click
    if (!navScrollRef.current) return;
    isMouseDownRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.pageX - navScrollRef.current.offsetLeft;
    scrollLeftStartRef.current = navScrollRef.current.scrollLeft;
  };

  const handleNavMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDownRef.current || !navScrollRef.current) return;
    const x = e.pageX - navScrollRef.current.offsetLeft;
    const walk = (x - startXRef.current);
    if (Math.abs(walk) > 5) {
      hasMovedRef.current = true;
      setIsDragging(true);
      e.preventDefault();
    }
    navScrollRef.current.scrollLeft = scrollLeftStartRef.current - walk;
    checkNavScroll();
  };

  const handleNavMouseUp = () => {
    isMouseDownRef.current = false;
    setTimeout(() => {
      setIsDragging(false);
      hasMovedRef.current = false;
    }, 60);
    checkNavScroll();
  };

  // Prevents accidental click on items if user was performing a drag movement
  const safeNavClick = (action: () => void) => (e: React.MouseEvent) => {
    if (isDragging || hasMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    action();
  };

  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stock <= (p.minStock || 10)).length;
  }, [products]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 15) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
        onSearchChange('');
        setTimeout(() => setJustAddedTitle(null), 2500);
      }
    } else if (
      e.key === 'Escape' || 
      (e.altKey && (e.key === 'b' || e.key === 'B' || e.key === 'c' || e.key === 'C')) ||
      (e.ctrlKey && (e.key === 'Backspace' || e.key === 'Delete' || e.key === 'k' || e.key === 'K')) ||
      (e.shiftKey && e.key === 'Escape')
    ) {
      // Acceso rápido de teclado: borrado instantáneo del motor de búsqueda
      e.preventDefault();
      e.stopPropagation();
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
    <header className={`sticky top-0 z-40 transition-all duration-300 modern-menu-header ${
      isScrolled ? 'is-scrolled' : ''
    }`}>
      {/* 64px Modern Glass Navigation Bar with Inter Typography */}
      <div className="max-w-7xl mx-auto modern-menu-bar">
        {/* Left: Brand Logo with Dot, Circular Icon and Cashier Status */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <div className="modern-logo cursor-default" title="Tienda Mixta La Esquinita">
            {/* Circular Official Brand Avatar (Enlarged and refined) */}
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full p-0.5 bg-gradient-to-tr from-[#EB9D52] via-[#BC6343] to-[#FFF9F0] shrink-0 shadow-md flex items-center justify-center transition-transform hover:scale-105">
              <div className="w-full h-full rounded-full bg-[#1b2631] flex items-center justify-center overflow-hidden">
                <img 
                  src="https://res.cloudinary.com/unhl90nr/image/upload/v1788376390/logo_sl8qs4.png" 
                  alt="Logo Tienda Mixta La Esquinita" 
                  className="w-full h-full object-contain p-0.5"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Brand Title */}
            <div className="flex flex-col">
              <span className="font-bold text-[17px] sm:text-[19px] tracking-[-0.01em] text-[#FFF9F0] font-sans leading-tight">
                La Esquinita
              </span>
              <span className="text-[9px] sm:text-[10px] text-[#F6E1C6]/75 font-medium tracking-wide leading-none hidden sm:block">
                Tienda Mixta
              </span>
            </div>
          </div>

          {/* Shift / Cashier Pill with direct edit trigger */}
          <div className="flex items-center gap-1.5 pl-1.5 border-l border-white/15 shrink-0">
            <button
              type="button"
              onClick={onOpenCashShift}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium border backdrop-blur-md transition-all hover:scale-105 cursor-pointer ${
                isShiftOpen
                  ? 'bg-emerald-900/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-800/50'
                  : 'bg-rose-900/40 text-rose-300 border-rose-500/30 hover:bg-rose-800/50'
              }`}
              title="Estado de caja: Clic para abrir arqueo, cambiar cajero o inicio de caja"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isShiftOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <span>{isShiftOpen ? 'Caja' : 'Cerrada'}</span>
            </button>
            <button
              type="button"
              onClick={onOpenCashShift}
              className="text-[10px] sm:text-[11px] text-[#F6E1C6]/90 hover:text-white font-sans flex items-center gap-1 transition-colors px-1 py-0.5 rounded hover:bg-white/10 cursor-pointer"
              title="Encargado de turno: Clic para editar cajero o base inicial de caja"
            >
              <span className="font-semibold max-w-[70px] sm:max-w-[120px] truncate">{currentShift?.cashierName || 'Don Esteban'}</span>
              <Edit3 className="w-2.5 h-2.5 text-[#EB9D52]" />
            </button>
          </div>
        </div>

        {/* Center: Navigation Links Scroll Track with Grab & Drag and Carousel Navigation */}
        <div 
          className="modern-nav-links-wrapper group"
          title="Arrastra con el ratón o usa las flechas del carrusel para explorar todos los apartados"
        >
          {/* Left Carousel Paddle & Fade Edge Mask */}
          {canScrollLeft && (
            <>
              <div className="modern-nav-fade-left" />
              <button
                type="button"
                onClick={() => handleNavScroll('left')}
                className="modern-nav-scroll-btn modern-nav-scroll-left"
                title="Desplazar carrusel a la izquierda (o arrastra con el ratón)"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-4 h-4 text-[#FFF9F0]" />
              </button>
            </>
          )}

          <nav 
            ref={navScrollRef}
            className={`modern-nav-links ${isDragging ? 'is-dragging' : ''}`}
            onMouseDown={handleNavMouseDown}
            onMouseMove={handleNavMouseMove}
            onMouseUp={handleNavMouseUp}
            onMouseLeave={handleNavMouseUp}
          >
            {/* Módulo 1: Control de Caja & Arqueo */}
            <button
              onClick={safeNavClick(onOpenCashShift)}
              className={`modern-nav-item ${
                !isShiftOpen ? 'border-rose-400/50 bg-rose-950/40 text-rose-200' : ''
              }`}
              title="Abrir/Cerrar Turno, Arqueo de Caja y Gastos"
            >
              <Vault className="w-4 h-4 text-[#EB9D52]" />
              <span>Caja & Arqueo</span>
            </button>

            {/* Módulo 2: Clientes & Fiados */}
            <button
              onClick={safeNavClick(onOpenCustomers)}
              className="modern-nav-item"
              title="Directorio de clientes, cartera y abonos"
            >
              <Users className="w-4 h-4 text-[#EB9D52]" />
              <span>Clientes</span>
            </button>

            {/* Módulo 3: Inventario & Kardex */}
            <button
              onClick={safeNavClick(onOpenInventoryManager)}
              className="modern-nav-item"
              title="Gestión de inventario, stock y márgenes"
            >
              <Package className="w-4 h-4 text-[#EB9D52]" />
              <span>Kardex</span>
            </button>

            {/* Módulo Proveedores & Abastecimiento */}
            {onOpenSuppliers && (
              <button
                onClick={safeNavClick(onOpenSuppliers)}
                className="modern-nav-item"
                title="Trazabilidad de proveedores, pedidos y costos"
              >
                <Truck className="w-4 h-4 text-[#EB9D52]" />
                <span>Proveedores</span>
                {lowStockCount > 0 && (
                  <span
                    className="bg-[#BC6343] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full tracking-tight ml-0.5 shadow-2xs"
                    title={`${lowStockCount} productos requieren reabastecimiento`}
                  >
                    {lowStockCount}
                  </span>
                )}
              </button>
            )}

            {/* Módulo Categorías (Visibilidad garantizada para todos los usuarios) */}
            {onOpenManageCategories && (
              <button
                onClick={safeNavClick(onOpenManageCategories)}
                className="modern-nav-item"
                title="Organizar categorías de productos"
              >
                <Layers className="w-4 h-4 text-[#EB9D52]" />
                <span>Categorías</span>
              </button>
            )}

            {/* Módulo Reportes (Visibilidad garantizada para todos los usuarios) */}
            <button
              onClick={safeNavClick(onOpenReports)}
              className="modern-nav-item"
              title="Estadísticas de ventas y ganancias"
            >
              <BarChart3 className="w-4 h-4 text-[#EB9D52]" />
              <span>Reportes</span>
            </button>

            {/* Módulo Semáforo & Bolsillo (Dashboard Gerencial - Visibilidad garantizada) */}
            {onOpenManagerDashboard && (
              <button
                onClick={safeNavClick(onOpenManagerDashboard)}
                className="modern-terracotta-btn"
                title="Dashboard Gerencial: Semáforo de inventario, punto de equilibrio y plata en caja"
              >
                <Store className="w-3.5 h-3.5 text-[#FFF9F0]" />
                <span className="font-semibold">Semáforo & Bolsillo</span>
              </button>
            )}
          </nav>

          {/* Right Carousel Paddle & Fade Edge Mask */}
          {canScrollRight && (
            <>
              <div className="modern-nav-fade-right" />
              <button
                type="button"
                onClick={() => handleNavScroll('right')}
                className="modern-nav-scroll-btn modern-nav-scroll-right"
                title="Desplazar carrusel a la derecha (o arrastra con el ratón)"
                aria-label="Siguiente"
              >
                <ChevronRight className="w-4 h-4 text-[#FFF9F0]" />
              </button>
            </>
          )}

          {/* Carousel Mini Progress Indicator Track */}
          {hasOverflow && (
            <div 
              className="modern-nav-carousel-track flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity" 
              title={`Posición carrusel: ${Math.round(scrollProgress)}% - Arrastra para explorar`}
            >
              <div 
                className="modern-nav-carousel-thumb" 
                style={{ 
                  width: '35%', 
                  transform: `translateX(${(scrollProgress / 100) * 185}%)` 
                }} 
              />
            </div>
          )}
        </div>

        {/* Right: Auth & Action Buttons (Monto, Ventas Hoy, Galería, + Producto) */}
        <div className="modern-auth">
          {/* Quick Amount (Ghost Button with Glass Hover) */}
          <button
            onClick={onOpenQuickAmount}
            className="modern-ghost-btn"
            title="Venta rápida por monto (F8)"
          >
            <Zap className="w-3.5 h-3.5 text-[#EB9D52]" />
            <span className="hidden sm:inline">Monto ($)</span>
            <span className="sm:hidden font-bold">$</span>
          </button>

          {/* Daily Sales Quick Pill (Ghost Button with Glass Hover) */}
          <button
            onClick={onOpenHistory}
            className="modern-ghost-btn"
            title="Ver historial de facturas del día (F10)"
          >
            <History className="w-3.5 h-3.5 text-[#EB9D52]" />
            <span className="font-bold text-xs font-mono">
              {formatCOP(totalSalesToday)}
            </span>
            <span className="text-[10px] bg-[#EB9D52] text-[#1b2631] font-extrabold px-1.5 py-0.2 rounded-full">
              {transactionsToday.length}
            </span>
          </button>

          {/* Toggle Category Gallery */}
          <button
            onClick={onToggleCategoryGallery}
            className={`modern-ghost-btn ${
              showCategoryGallery ? 'border-white/40 bg-white/15' : ''
            }`}
            title="Ver / ocultar galería de categorías"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-[#EB9D52]" />
            <span className="hidden md:inline">Galería</span>
          </button>

          {/* + Producto (Outlined Button with Glass Hover) */}
          <button
            onClick={onOpenAddProduct}
            className="modern-outlined-btn"
            title="Registrar nuevo producto al catálogo (F9)"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Producto</span>
          </button>
        </div>
      </div>

      {/* Search & Barcode Scan Toolbar with Modern Glass Harmonization */}
      <div className="editorial-search-bar px-3 sm:px-6 lg:px-8 py-2 border-t border-white/10">
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
              placeholder="Buscar o pegar nombre de producto (ej: Arroz, Leche, Huevos, Jabón, Aceite...)"
              className="w-full pl-9 pr-24 sm:pr-28 py-1.5 rounded-lg bg-[#1a3d55]/80 border border-white/20 text-[#FFF9F0] placeholder-[#F6E1C6]/70 text-xs font-sans font-normal focus:ring-1 focus:ring-[#EB9D52] focus:border-[#EB9D52] focus:outline-none shadow-inner backdrop-blur-md transition-all"
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
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
                  className="px-2 py-0.5 rounded-md bg-[#BC6343] hover:bg-[#964937] text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-xs border border-white/30"
                  title="Presiona Enter o haz clic para agregar directo a la factura"
                >
                  <Zap className="w-3 h-3 text-[#EB9D52]" />
                  <span>Enter</span>
                </button>
              )}
              <span className="hidden sm:inline-block px-1.5 py-0.2 rounded-md bg-[#214C6A]/90 border border-white/20 text-[9px] font-mono text-[#EB9D52]">
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
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  setBarcodeInput('');
                }
              }}
              placeholder="Pistola / Código de barras"
              className="w-full pl-9 pr-20 py-1.5 rounded-lg bg-[#1a3d55]/80 border border-white/20 text-[#FFF9F0] placeholder-[#F6E1C6]/70 text-xs font-mono focus:ring-1 focus:ring-[#EB9D52] focus:border-[#EB9D52] focus:outline-none shadow-inner backdrop-blur-md transition-all"
            />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {onOpenScannerModal && (
                <button
                  type="button"
                  onClick={onOpenScannerModal}
                  className="p-1 rounded-md bg-[#214C6A] hover:bg-[#15344a] border border-white/25 text-[#EB9D52] hover:text-white transition-all cursor-pointer"
                  title="Lector con cámara (F3)"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="submit"
                className="px-2.5 py-1 rounded-md bg-[#BC6343] hover:bg-[#964937] text-[#FFF9F0] text-[11px] font-bold cursor-pointer shadow-xs border border-white/20"
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
                  <span>{isTopMatchFavorite ? 'En Botones Rápidos' : 'Fijar a Botones Rápidos'}</span>
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
