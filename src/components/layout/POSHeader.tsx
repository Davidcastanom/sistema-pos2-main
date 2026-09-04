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
  GripHorizontal,
  Menu
} from 'lucide-react';
import { formatCOP, playBeep } from '@/lib/utils';
import { SaleTransaction, CashShift, ProductItem, StoreInfo } from '@/types';
import { getSavedStoreInfo } from '@/lib/pdfGenerator';

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
  storeInfo?: StoreInfo;
  onOpenStoreInfo?: () => void;
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
  cartItemCount?: number;
  cartTotal?: number;
  onOpenMobileCart?: () => void;
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
  storeInfo,
  onOpenStoreInfo,
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
  cartItemCount = 0,
  cartTotal = 0,
  onOpenMobileCart,
}) => {
  const activeStore = storeInfo || getSavedStoreInfo();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
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

  // Ribbon scrolling state (< lg) for mobile and tablet
  const ribbonScrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollRibbonLeft, setCanScrollRibbonLeft] = useState<boolean>(false);
  const [canScrollRibbonRight, setCanScrollRibbonRight] = useState<boolean>(false);
  const isRibbonMouseDownRef = React.useRef<boolean>(false);
  const ribbonStartXRef = React.useRef<number>(0);
  const ribbonScrollLeftStartRef = React.useRef<number>(0);
  const ribbonHasMovedRef = React.useRef<boolean>(false);
  const [isRibbonDragging, setIsRibbonDragging] = useState<boolean>(false);

  const checkRibbonScroll = React.useCallback(() => {
    if (ribbonScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = ribbonScrollRef.current;
      const maxScroll = Math.max(0, scrollWidth - clientWidth);
      setCanScrollRibbonLeft(scrollLeft > 6);
      setCanScrollRibbonRight(scrollLeft < maxScroll - 6);
    }
  }, []);

  useEffect(() => {
    checkRibbonScroll();
    const el = ribbonScrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkRibbonScroll, { passive: true });
    }
    window.addEventListener('resize', checkRibbonScroll);
    return () => {
      if (el) el.removeEventListener('scroll', checkRibbonScroll);
      window.removeEventListener('resize', checkRibbonScroll);
    };
  }, [checkRibbonScroll]);

  // Translate vertical wheel on ribbon into smooth horizontal scrolling
  useEffect(() => {
    const el = ribbonScrollRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return;
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY * 0.9;
        checkRibbonScroll();
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, [checkRibbonScroll]);

  const handleRibbonScroll = (dir: 'left' | 'right') => {
    if (ribbonScrollRef.current) {
      const offset = dir === 'left' ? -200 : 200;
      ribbonScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
      setTimeout(checkRibbonScroll, 280);
    }
  };

  const handleRibbonMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (!ribbonScrollRef.current) return;
    isRibbonMouseDownRef.current = true;
    ribbonHasMovedRef.current = false;
    ribbonStartXRef.current = e.pageX - ribbonScrollRef.current.offsetLeft;
    ribbonScrollLeftStartRef.current = ribbonScrollRef.current.scrollLeft;
  };

  const handleRibbonMouseMove = (e: React.MouseEvent) => {
    if (!isRibbonMouseDownRef.current || !ribbonScrollRef.current) return;
    const x = e.pageX - ribbonScrollRef.current.offsetLeft;
    const walk = x - ribbonStartXRef.current;
    if (Math.abs(walk) > 4) {
      ribbonHasMovedRef.current = true;
      setIsRibbonDragging(true);
      e.preventDefault();
    }
    ribbonScrollRef.current.scrollLeft = ribbonScrollLeftStartRef.current - walk;
    checkRibbonScroll();
  };

  const handleRibbonMouseUp = () => {
    isRibbonMouseDownRef.current = false;
    setTimeout(() => {
      setIsRibbonDragging(false);
      ribbonHasMovedRef.current = false;
    }, 60);
    checkRibbonScroll();
  };

  const safeRibbonClick = (action: () => void) => (e: React.MouseEvent) => {
    if (isRibbonDragging || ribbonHasMovedRef.current) {
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
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 min-w-0">
          <button 
            type="button"
            onClick={onOpenStoreInfo}
            className={`modern-logo text-left transition-all p-0.5 -m-0.5 rounded group ${onOpenStoreInfo ? 'cursor-pointer hover:bg-white/10' : 'cursor-default'}`} 
            title={`${activeStore.name} • NIT: ${activeStore.nit}${onOpenStoreInfo ? ' - Clic para editar datos de la tienda' : ''}`}
          >
            {/* Circular Official Brand Avatar */}
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full p-0.5 bg-gradient-to-tr from-[#EB9D52] via-[#BC6343] to-[#FFF9F0] shrink-0 shadow-md flex items-center justify-center transition-transform group-hover:scale-105">
              <div className="w-full h-full rounded-full bg-[#1b2631] flex items-center justify-center overflow-hidden">
                <img 
                  src={activeStore.logoUrl || "https://res.cloudinary.com/unhl90nr/image/upload/v1788376390/logo_sl8qs4.png"} 
                  alt={`Logo ${activeStore.name}`} 
                  className="w-full h-full object-contain p-0.5"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Brand Title */}
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm sm:text-[18px] tracking-[-0.01em] text-[#FFF9F0] font-sans leading-tight truncate group-hover:text-[#EB9D52] transition-colors">
                {activeStore.shortName || activeStore.name}
              </span>
              <span className="text-[9px] sm:text-[10px] text-[#F6E1C6]/75 font-medium tracking-wide leading-none hidden sm:flex items-center gap-1">
                <span className="truncate">{activeStore.name !== (activeStore.shortName || '') ? activeStore.name : 'Datos del Negocio'}</span>
                {onOpenStoreInfo && <Edit3 className="w-2.5 h-2.5 text-[#EB9D52] opacity-70 group-hover:opacity-100 shrink-0" />}
              </span>
            </div>
          </button>

          {/* Shift / Cashier Pill with responsive adaptation */}
          <div className="flex items-center gap-1 pl-1 sm:pl-1.5 border-l border-white/15 shrink-0">
            <button
              type="button"
              onClick={onOpenCashShift}
              className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium border backdrop-blur-md transition-all cursor-pointer ${
                isShiftOpen
                  ? 'bg-emerald-900/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-800/50'
                  : 'bg-rose-900/40 text-rose-300 border-rose-500/30 hover:bg-rose-800/50'
              }`}
              title={`Estado de caja: ${isShiftOpen ? 'Abierta' : 'Cerrada'} - Clic para turno o arqueo`}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isShiftOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <span className="hidden xs:inline">{isShiftOpen ? 'Caja' : 'Cerrada'}</span>
            </button>
            <button
              type="button"
              onClick={onOpenCashShift}
              className="hidden sm:flex text-[10px] sm:text-[11px] text-[#F6E1C6]/90 hover:text-white font-sans items-center gap-1 transition-colors px-1 py-0.5 rounded hover:bg-white/10 cursor-pointer"
              title="Encargado de turno: Clic para editar cajero o base inicial de caja"
            >
              <span className="font-semibold max-w-[80px] md:max-w-[120px] truncate">{currentShift?.cashierName || 'Don Esteban'}</span>
              <Edit3 className="w-2.5 h-2.5 text-[#EB9D52]" />
            </button>
          </div>
        </div>

        {/* Center: Navigation Links Scroll Track with Grab & Drag and Carousel Navigation */}
        <div 
          className="modern-nav-links-wrapper group hidden lg:flex"
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

            {/* Módulo Datos de la Tienda (Edición de Nombre, NIT, Dirección y Facturación) */}
            {onOpenStoreInfo && (
              <button
                onClick={safeNavClick(onOpenStoreInfo)}
                className="modern-nav-item border-l border-white/15 pl-3 ml-1"
                title={`Configurar Datos de la Tienda (${activeStore.name} • NIT: ${activeStore.nit})`}
              >
                <Store className="w-3.5 h-3.5 text-[#EB9D52]" />
                <span className="font-medium">Datos Tienda</span>
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
        <div className="modern-auth hidden lg:flex shrink-0">
          {/* Quick Amount (Ghost Button with Glass Hover) */}
          <button
            onClick={onOpenQuickAmount}
            className="modern-ghost-btn shrink-0"
            title="Venta rápida por monto (F8)"
          >
            <Zap className="w-3.5 h-3.5 text-[#EB9D52]" />
            <span className="hidden xl:inline">Monto ($)</span>
            <span className="xl:hidden font-bold">$</span>
          </button>

          {/* Daily Sales Quick Pill (Ghost Button with Glass Hover) */}
          <button
            onClick={onOpenHistory}
            className="modern-ghost-btn shrink-0"
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
            className={`modern-ghost-btn shrink-0 ${
              showCategoryGallery ? 'border-white/40 bg-white/15' : ''
            }`}
            title="Ver / ocultar galería de categorías"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-[#EB9D52]" />
            <span className="hidden xl:inline">Galería</span>
          </button>

          {/* + Producto (Outlined Button with Glass Hover) */}
          <button
            onClick={onOpenAddProduct}
            className="modern-outlined-btn shrink-0 cursor-pointer"
            title="Registrar nuevo producto al catálogo (F9)"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="font-bold">+ Producto</span>
          </button>
        </div>

        {/* Mobile / Tablet Actions (< lg) */}
        <div className="flex lg:hidden items-center gap-1 sm:gap-2 shrink-0">
          {/* Quick Amount ($) */}
          <button
            onClick={onOpenQuickAmount}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#EB9D52] border border-white/15 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1 shrink-0"
            title="Venta rápida por monto (F8)"
          >
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden md:inline text-xs font-semibold text-[#FFF9F0]">Monto</span>
          </button>

          {/* Quick Add Product - Visibilidad garantizada en tablets y móviles */}
          <button
            onClick={onOpenAddProduct}
            className="px-2 sm:px-3 py-1.5 rounded-lg bg-[#EB9D52] hover:bg-[#d8873d] text-[#1b2631] font-bold text-xs cursor-pointer shadow-md transition-all active:scale-95 border border-white/40 flex items-center justify-center gap-1.5 shrink-0"
            title="Registrar nuevo producto (F9)"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline font-bold">+ Producto</span>
          </button>

          {/* Mobile Cart Button */}
          {onOpenMobileCart && (
            <button
              onClick={onOpenMobileCart}
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#FFF9F0] border border-white/15 font-bold text-xs cursor-pointer shadow-sm transition-all active:scale-95 shrink-0"
              title="Ver cuenta de cobro"
            >
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#EB9D52]" />
              <span className="font-mono text-xs">{cartItemCount}</span>
            </button>
          )}

          {/* Hamburger Menu Drawer Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#BC6343] hover:bg-[#a04e33] text-white border border-[#EB9D52]/50 font-bold text-xs cursor-pointer shadow-xs transition-all active:scale-95 shrink-0"
            aria-label="Abrir menú de módulos"
          >
            <Menu className="w-4 h-4 text-[#EB9D52]" />
            <span className="hidden sm:inline">Módulos</span>
          </button>
        </div>
      </div>

      {/* Mobile Horizontal Quick-Access Ribbon (< lg) with Touch Pan, Drag-to-Scroll & Paddle Controls */}
      <div className="lg:hidden w-full bg-[#102434] border-t border-white/10 shadow-inner relative group select-none">
        {/* Left Carousel Paddle & Fade Mask */}
        {canScrollRibbonLeft && (
          <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center pl-1 pr-3 bg-gradient-to-r from-[#102434] via-[#102434]/90 to-transparent pointer-events-none">
            <button
              type="button"
              onClick={() => handleRibbonScroll('left')}
              className="pointer-events-auto w-6 h-6 rounded-full bg-[#214C6A] border border-[#EB9D52]/80 text-[#EB9D52] hover:bg-[#EB9D52] hover:text-[#102434] flex items-center justify-center shadow-md active:scale-90 transition-all cursor-pointer"
              title="Desplazar a la izquierda"
              aria-label="Desplazar a la izquierda"
            >
              <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        )}

        {/* Scrollable Ribbon Track */}
        <div 
          ref={ribbonScrollRef}
          className={`flex items-center gap-1.5 px-3 py-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden touch-pan-x whitespace-nowrap scroll-smooth ${
            isRibbonDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
          }`}
          onMouseDown={handleRibbonMouseDown}
          onMouseMove={handleRibbonMouseMove}
          onMouseUp={handleRibbonMouseUp}
          onMouseLeave={handleRibbonMouseUp}
        >
          {/* 1. Caja & Arqueo */}
          <button
            type="button"
            onClick={safeRibbonClick(onOpenCashShift)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold shrink-0 border transition-all cursor-pointer active:scale-95 ${
              isShiftOpen 
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' 
                : 'bg-rose-950/60 text-rose-300 border-rose-500/40'
            }`}
            title="Caja & Arqueo de Turno"
          >
            <Vault className="w-3.5 h-3.5 text-[#EB9D52]" />
            <span>Caja</span>
            <span className={`w-1.5 h-1.5 rounded-full ${isShiftOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
          </button>

          {/* 2. + Producto (Destacado prioritario para acceso inmediato en cualquier resolución) */}
          <button
            type="button"
            onClick={safeRibbonClick(onOpenAddProduct)}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold shrink-0 bg-[#EB9D52] hover:bg-[#d8873d] text-[#1b2631] border border-white/40 shadow-xs transition-all cursor-pointer active:scale-95"
            title="Registrar Nuevo Producto al Catálogo (F9)"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ Producto</span>
          </button>

          {/* 3. Clientes & Fiados */}
          <button
            type="button"
            onClick={safeRibbonClick(onOpenCustomers)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold shrink-0 bg-white/10 hover:bg-white/20 text-[#FFF9F0] border border-white/15 transition-all cursor-pointer active:scale-95"
            title="Clientes & Libreta de Fiados"
          >
            <Users className="w-3.5 h-3.5 text-[#EB9D52]" />
            <span>Clientes</span>
          </button>

          {/* 4. Inventario & Kardex */}
          <button
            type="button"
            onClick={safeRibbonClick(onOpenInventoryManager)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold shrink-0 bg-white/10 hover:bg-white/20 text-[#FFF9F0] border border-white/15 transition-all cursor-pointer active:scale-95"
            title="Inventario & Kardex"
          >
            <Package className="w-3.5 h-3.5 text-[#EB9D52]" />
            <span>Kardex</span>
          </button>

          {/* 5. Proveedores & Compras */}
          {onOpenSuppliers && (
            <button
              type="button"
              onClick={safeRibbonClick(onOpenSuppliers)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold shrink-0 bg-white/10 hover:bg-white/20 text-[#FFF9F0] border border-white/15 transition-all cursor-pointer active:scale-95"
              title="Proveedores & Pedidos Sugeridos"
            >
              <Truck className="w-3.5 h-3.5 text-[#EB9D52]" />
              <span>Proveedores</span>
              {lowStockCount > 0 && (
                <span className="bg-[#BC6343] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {lowStockCount}
                </span>
              )}
            </button>
          )}

          {/* 6. Categorías */}
          {onOpenManageCategories && (
            <button
              type="button"
              onClick={safeRibbonClick(onOpenManageCategories)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold shrink-0 bg-white/10 hover:bg-white/20 text-[#FFF9F0] border border-white/15 transition-all cursor-pointer active:scale-95"
              title="Organizar Categorías"
            >
              <Layers className="w-3.5 h-3.5 text-[#EB9D52]" />
              <span>Categorías</span>
            </button>
          )}

          {/* 7. Reportes & Ganancias */}
          <button
            type="button"
            onClick={safeRibbonClick(onOpenReports)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold shrink-0 bg-white/10 hover:bg-white/20 text-[#FFF9F0] border border-white/15 transition-all cursor-pointer active:scale-95"
            title="Reportes & Ganancias"
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#EB9D52]" />
            <span>Reportes</span>
          </button>

          {/* 8. Semáforo & Bolsillo */}
          {onOpenManagerDashboard && (
            <button
              type="button"
              onClick={safeRibbonClick(onOpenManagerDashboard)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold shrink-0 bg-[#BC6343] hover:bg-[#a64f32] text-[#FFF9F0] border border-[#EB9D52]/50 transition-all cursor-pointer active:scale-95 shadow-xs"
              title="Dashboard Gerencial: Semáforo de inventario y punto de equilibrio"
            >
              <Store className="w-3.5 h-3.5 text-[#FFF9F0]" />
              <span>Semáforo</span>
            </button>
          )}

          {/* 9. Datos de la Tienda (Edición centralizada) */}
          {onOpenStoreInfo && (
            <button
              type="button"
              onClick={safeRibbonClick(onOpenStoreInfo)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold shrink-0 bg-white/10 hover:bg-white/20 text-[#FFF9F0] border border-white/15 transition-all cursor-pointer active:scale-95"
              title="Editar Datos de la Tienda (Nombre, NIT, Dirección, Teléfono, etc.)"
            >
              <Store className="w-3.5 h-3.5 text-[#EB9D52]" />
              <span>Datos Tienda</span>
            </button>
          )}

          {/* 10. Ventas Hoy */}
          <button
            type="button"
            onClick={safeRibbonClick(onOpenHistory)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold shrink-0 bg-white/10 hover:bg-white/20 text-[#FFF9F0] border border-white/15 transition-all cursor-pointer active:scale-95"
            title="Historial de Ventas del Día"
          >
            <History className="w-3.5 h-3.5 text-[#EB9D52]" />
            <span>Ventas Hoy</span>
            <span className="font-mono text-[10px] text-[#EB9D52] font-black">
              {formatCOP(totalSalesToday)}
            </span>
          </button>

          {/* 10. Toggle Galería */}
          <button
            type="button"
            onClick={safeRibbonClick(onToggleCategoryGallery)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold shrink-0 border transition-all cursor-pointer active:scale-95 ${
              showCategoryGallery
                ? 'bg-[#EB9D52]/25 text-[#EB9D52] border-[#EB9D52]'
                : 'bg-white/10 text-[#FFF9F0] border-white/15'
            }`}
            title="Mostrar / Ocultar Galería Visual de Categorías"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Galería</span>
          </button>

          {/* 11. Monto ($) */}
          <button
            type="button"
            onClick={safeRibbonClick(onOpenQuickAmount)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold shrink-0 bg-white/10 hover:bg-white/20 text-[#FFF9F0] border border-white/15 transition-all cursor-pointer active:scale-95"
            title="Venta Rápida por Monto ($)"
          >
            <Zap className="w-3.5 h-3.5 text-[#EB9D52]" />
            <span>Monto ($)</span>
          </button>

          {/* 12. Botón Ver Más */}
          <button
            type="button"
            onClick={safeRibbonClick(() => setIsMobileMenuOpen(true))}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold shrink-0 bg-[#214C6A] hover:bg-[#1a3d55] text-[#EB9D52] border border-[#EB9D52]/40 transition-all cursor-pointer active:scale-95"
            title="Ver todos los módulos y opciones"
          >
            <Menu className="w-3.5 h-3.5" />
            <span>Más...</span>
          </button>
        </div>

        {/* Right Carousel Paddle & Fade Mask */}
        {canScrollRibbonRight && (
          <div className="absolute right-0 top-0 bottom-0 z-20 flex items-center pr-1 pl-3 bg-gradient-to-l from-[#102434] via-[#102434]/90 to-transparent pointer-events-none">
            <button
              type="button"
              onClick={() => handleRibbonScroll('right')}
              className="pointer-events-auto w-6 h-6 rounded-full bg-[#214C6A] border border-[#EB9D52]/80 text-[#EB9D52] hover:bg-[#EB9D52] hover:text-[#102434] flex items-center justify-center shadow-md active:scale-90 transition-all cursor-pointer"
              title="Desplazar a la derecha"
              aria-label="Desplazar a la derecha"
            >
              <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        )}
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
                className="px-1 text-[#F6E1C6] hover:text-white cursor-pointer flex items-center justify-center"
                title="Cancelar"
              >
                <X className="w-3.5 h-3.5" />
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

      {/* Mobile Navigation Drawer Modal */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-md lg:hidden animate-fadeIn">
          <div className="w-full max-w-sm sm:max-w-md bg-[#163347] text-[#FFF9F0] h-full shadow-2xl flex flex-col overflow-hidden border-l border-white/20 animate-slideLeft">
            {/* Header of Drawer */}
            <div className="p-4 bg-[#214C6A] border-b border-white/15 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#EB9D52] to-[#BC6343] flex items-center justify-center text-white shadow-md border border-white/30">
                  <Store className="w-4 h-4 text-[#FFF9F0]" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#FFF9F0] font-sans">
                    La Esquinita
                  </h3>
                  <p className="text-[10px] text-[#EB9D52] font-semibold uppercase">
                    Menú Principal de Módulos
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
                aria-label="Cerrar menú"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cashier Shift Status Card in Drawer */}
            <div className="p-3.5 bg-[#102737] border-b border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isShiftOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                  <span className={`text-xs font-bold uppercase ${isShiftOpen ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {isShiftOpen ? 'Turno Abierto' : 'Caja Cerrada'}
                  </span>
                </div>
                <span className="text-[11px] text-[#F6E1C6]/80 font-mono">
                  {currentTime}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#F6E1C6]/70">Cajero(a):</span>
                <span className="font-bold text-white font-sans">{currentShift?.cashierName || 'Don Esteban'}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#F6E1C6]/70">Ventas Hoy ({transactionsToday.length}):</span>
                <span className="font-black text-[#EB9D52] font-mono">{formatCOP(totalSalesToday)}</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenCashShift();
                }}
                className="w-full mt-1 py-1.5 px-2 bg-[#214C6A] hover:bg-[#1a3d55] text-[#EB9D52] hover:text-white border border-[#EB9D52]/40 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Vault className="w-3.5 h-3.5" />
                <span>Gestionar Turno & Arqueo</span>
              </button>
            </div>

            {/* Module Navigation List */}
            <div className="p-3 overflow-y-auto flex-1 space-y-4">
              {/* Sección 1: Mostrador & Caja */}
              <div>
                <p className="text-[10px] uppercase font-bold text-[#EB9D52] tracking-wider px-1 pb-1.5 flex items-center gap-1.5">
                  <Zap className="w-3 h-3" />
                  <span>Mostrador & Caja</span>
                </p>
                <div className="space-y-1.5">
                  {/* Caja & Arqueo */}
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenCashShift();
                    }}
                    className="w-full p-2.5 rounded-none bg-white/5 hover:bg-white/15 border border-white/10 flex items-center gap-3 transition-all text-left cursor-pointer active:scale-[0.98]"
                  >
                    <div className="w-8 h-8 rounded-none bg-[#214C6A] flex items-center justify-center text-[#EB9D52] shrink-0 border border-white/20">
                      <Vault className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs sm:text-sm text-white flex items-center justify-between">
                        <span>Caja & Arqueo</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isShiftOpen ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-rose-950 text-rose-300 border border-rose-500/40'}`}>
                          {isShiftOpen ? 'Abierta' : 'Cerrada'}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#F6E1C6]/70">Turno, base inicial, retiros y arqueo ciego</div>
                    </div>
                  </button>

                  {/* Venta Rápida por Monto ($) */}
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenQuickAmount();
                    }}
                    className="w-full p-2.5 rounded-none bg-white/5 hover:bg-white/15 border border-white/10 flex items-center gap-3 transition-all text-left cursor-pointer active:scale-[0.98]"
                  >
                    <div className="w-8 h-8 rounded-none bg-[#214C6A] flex items-center justify-center text-[#EB9D52] shrink-0 border border-white/20">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs sm:text-sm text-white">Venta Rápida por Monto ($)</div>
                      <div className="text-[10px] text-[#F6E1C6]/70">Cobrar un importe rápido sin código de barras</div>
                    </div>
                  </button>

                  {/* Ventas Hoy & Historial */}
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenHistory();
                    }}
                    className="w-full p-2.5 rounded-none bg-white/5 hover:bg-white/15 border border-white/10 flex items-center gap-3 transition-all text-left cursor-pointer active:scale-[0.98]"
                  >
                    <div className="w-8 h-8 rounded-none bg-[#214C6A] flex items-center justify-center text-[#EB9D52] shrink-0 border border-white/20">
                      <History className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs sm:text-sm text-white flex items-center justify-between">
                        <span>Ventas Hoy & Historial</span>
                        <span className="font-mono text-[11px] text-[#EB9D52] font-black">{formatCOP(totalSalesToday)}</span>
                      </div>
                      <div className="text-[10px] text-[#F6E1C6]/70">{transactionsToday.length} tickets facturados hoy • Reimpresión</div>
                    </div>
                  </button>

                  {/* Ver Cuenta / Carrito */}
                  {onOpenMobileCart && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenMobileCart();
                      }}
                      className="w-full p-2.5 rounded-none bg-[#EB9D52]/15 hover:bg-[#EB9D52]/25 border border-[#EB9D52]/40 flex items-center gap-3 transition-all text-left cursor-pointer active:scale-[0.98]"
                    >
                      <div className="w-8 h-8 rounded-none bg-[#EB9D52] flex items-center justify-center text-[#222E3A] font-black shrink-0 shadow-xs">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs sm:text-sm text-[#FFF9F0] flex items-center justify-between">
                          <span>Ver Cuenta / Facturar</span>
                          <span className="font-mono text-[11px] text-[#EB9D52] font-bold">
                            {cartItemCount} {cartItemCount === 1 ? 'ítem' : 'ítems'}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#F6E1C6]/80 font-mono">
                          Total actual: <strong className="text-white font-bold">{formatCOP(cartTotal)}</strong>
                        </div>
                      </div>
                    </button>
                  )}

                  {/* Lector con Cámara */}
                  {onOpenScannerModal && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenScannerModal();
                      }}
                      className="w-full p-2.5 rounded-none bg-white/5 hover:bg-white/15 border border-white/10 flex items-center gap-3 transition-all text-left cursor-pointer active:scale-[0.98]"
                    >
                      <div className="w-8 h-8 rounded-none bg-[#214C6A] flex items-center justify-center text-[#EB9D52] shrink-0 border border-white/20">
                        <Camera className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs sm:text-sm text-white">Lector de Códigos (Cámara)</div>
                        <div className="text-[10px] text-[#F6E1C6]/70">Escanear productos con la cámara de tu celular</div>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Sección 2: Catálogo & Inventario */}
              <div>
                <p className="text-[10px] uppercase font-bold text-[#EB9D52] tracking-wider px-1 pb-1.5 flex items-center gap-1.5">
                  <Package className="w-3 h-3" />
                  <span>Catálogo & Inventario</span>
                </p>
                <div className="space-y-1.5">
                  {/* Inventario & Kardex */}
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenInventoryManager();
                    }}
                    className="w-full p-2.5 rounded-none bg-white/5 hover:bg-white/15 border border-white/10 flex items-center gap-3 transition-all text-left cursor-pointer active:scale-[0.98]"
                  >
                    <div className="w-8 h-8 rounded-none bg-[#214C6A] flex items-center justify-center text-[#EB9D52] shrink-0 border border-white/20">
                      <Package className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs sm:text-sm text-white">Inventario & Kardex</div>
                      <div className="text-[10px] text-[#F6E1C6]/70">Control de stock, alertas de agotados, costos y márgenes</div>
                    </div>
                  </button>

                  {/* Nuevo Producto */}
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenAddProduct();
                    }}
                    className="w-full p-2.5 rounded-none bg-white/5 hover:bg-white/15 border border-white/10 flex items-center gap-3 transition-all text-left cursor-pointer active:scale-[0.98]"
                  >
                    <div className="w-8 h-8 rounded-none bg-[#EB9D52] text-[#1b2631] font-black flex items-center justify-center shrink-0 shadow-xs">
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs sm:text-sm text-white">+ Registrar Nuevo Producto</div>
                      <div className="text-[10px] text-[#F6E1C6]/70">Crear producto con código de barras, categoría y precio</div>
                    </div>
                  </button>

                  {/* Galería Visual de Categorías */}
                  <button
                    onClick={() => {
                      onToggleCategoryGallery();
                    }}
                    className={`w-full p-2.5 rounded-none border flex items-center gap-3 transition-all text-left cursor-pointer active:scale-[0.98] ${
                      showCategoryGallery
                        ? 'bg-[#EB9D52]/20 border-[#EB9D52]/60 text-white'
                        : 'bg-white/5 hover:bg-white/15 border-white/10 text-white'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-none bg-[#214C6A] flex items-center justify-center text-[#EB9D52] shrink-0 border border-white/20">
                      <LayoutGrid className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs sm:text-sm flex items-center justify-between">
                        <span>Galería Visual de Categorías</span>
                        <span className={`text-[10px] px-2 py-0.5 font-bold uppercase rounded-full ${showCategoryGallery ? 'bg-[#EB9D52] text-[#1b2631]' : 'bg-white/10 text-[#F6E1C6]'}`}>
                          {showCategoryGallery ? 'Visible' : 'Oculta'}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#F6E1C6]/70">Mostrar u ocultar los botones de categoría en pantalla</div>
                    </div>
                  </button>

                  {/* Gestión de Categorías */}
                  {onOpenManageCategories && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenManageCategories();
                      }}
                      className="w-full p-2.5 rounded-none bg-white/5 hover:bg-white/15 border border-white/10 flex items-center gap-3 transition-all text-left cursor-pointer active:scale-[0.98]"
                    >
                      <div className="w-8 h-8 rounded-none bg-[#214C6A] flex items-center justify-center text-[#EB9D52] shrink-0 border border-white/20">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs sm:text-sm text-white">Organizar Categorías</div>
                        <div className="text-[10px] text-[#F6E1C6]/70">Crear y renombrar secciones de la tienda</div>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Sección 3: Clientes & Proveedores */}
              <div>
                <p className="text-[10px] uppercase font-bold text-[#EB9D52] tracking-wider px-1 pb-1.5 flex items-center gap-1.5">
                  <Users className="w-3 h-3" />
                  <span>Clientes & Proveedores</span>
                </p>
                <div className="space-y-1.5">
                  {/* Clientes & Fiados */}
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenCustomers();
                    }}
                    className="w-full p-2.5 rounded-none bg-white/5 hover:bg-white/15 border border-white/10 flex items-center gap-3 transition-all text-left cursor-pointer active:scale-[0.98]"
                  >
                    <div className="w-8 h-8 rounded-none bg-[#214C6A] flex items-center justify-center text-[#EB9D52] shrink-0 border border-white/20">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs sm:text-sm text-white">Clientes & Libreta de Fiados</div>
                      <div className="text-[10px] text-[#F6E1C6]/70">Cuentas por cobrar, saldo pendiente, abonos y teléfono</div>
                    </div>
                  </button>

                  {/* Proveedores */}
                  {onOpenSuppliers && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenSuppliers();
                      }}
                      className="w-full p-2.5 rounded-none bg-white/5 hover:bg-white/15 border border-white/10 flex items-center gap-3 transition-all text-left cursor-pointer active:scale-[0.98]"
                    >
                      <div className="w-8 h-8 rounded-none bg-[#214C6A] flex items-center justify-center text-[#EB9D52] shrink-0 border border-white/20">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs sm:text-sm text-white flex items-center justify-between">
                          <span>Proveedores & Compras</span>
                          {lowStockCount > 0 && (
                            <span className="px-1.5 py-0.2 bg-[#BC6343] text-white text-[10px] font-bold rounded-full">
                              {lowStockCount} por pedir
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#F6E1C6]/70">Pedidos sugeridos y comparador de costos de compra</div>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Sección 4: Gerencia & Métricas */}
              <div>
                <p className="text-[10px] uppercase font-bold text-[#EB9D52] tracking-wider px-1 pb-1.5 flex items-center gap-1.5">
                  <Store className="w-3 h-3" />
                  <span>Gerencia & Finanzas</span>
                </p>
                <div className="space-y-1.5">
                  {/* Semáforo & Bolsillo */}
                  {onOpenManagerDashboard && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenManagerDashboard();
                      }}
                      className="w-full p-2.5 rounded-none bg-[#BC6343]/25 hover:bg-[#BC6343]/40 border border-[#EB9D52]/40 flex items-center gap-3 transition-all text-left cursor-pointer active:scale-[0.98]"
                    >
                      <div className="w-8 h-8 rounded-none bg-[#BC6343] flex items-center justify-center text-white shrink-0 border border-white/20">
                        <Store className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs sm:text-sm text-[#FFF9F0]">Semáforo & Bolsillo (Gerencial)</div>
                        <div className="text-[10px] text-[#F6E1C6]/80">Meta diaria, costos fijos, punto de equilibrio y plata real</div>
                      </div>
                    </button>
                  )}

                  {/* Reportes & Ganancias */}
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenReports();
                    }}
                    className="w-full p-2.5 rounded-none bg-white/5 hover:bg-white/15 border border-white/10 flex items-center gap-3 transition-all text-left cursor-pointer active:scale-[0.98]"
                  >
                    <div className="w-8 h-8 rounded-none bg-[#214C6A] flex items-center justify-center text-[#EB9D52] shrink-0 border border-white/20">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs sm:text-sm text-white">Reportes & Estadísticas</div>
                      <div className="text-[10px] text-[#F6E1C6]/70">Utilidad bruta, márgenes netos y productos más vendidos</div>
                    </div>
                  </button>

                  {/* Configurar Chips de Búsqueda Rápida */}
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenManageQuickSearch();
                    }}
                    className="w-full p-2.5 rounded-none bg-white/5 hover:bg-white/15 border border-white/10 flex items-center gap-3 transition-all text-left cursor-pointer active:scale-[0.98]"
                  >
                    <div className="w-8 h-8 rounded-none bg-[#214C6A] flex items-center justify-center text-[#EB9D52] shrink-0 border border-white/20">
                      <Settings2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs sm:text-sm text-white">Botones de Búsqueda Rápida</div>
                      <div className="text-[10px] text-[#F6E1C6]/70">Personalizar accesos rápidos (ej: Huevos, Leche, Pan...)</div>
                    </div>
                  </button>

                  {/* Datos de la Tienda & Facturación */}
                  {onOpenStoreInfo && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenStoreInfo();
                      }}
                      className="w-full p-2.5 rounded-none bg-[#EB9D52]/15 hover:bg-[#EB9D52]/25 border border-[#EB9D52]/40 flex items-center gap-3 transition-all text-left cursor-pointer active:scale-[0.98]"
                    >
                      <div className="w-8 h-8 rounded-none bg-[#214C6A] flex items-center justify-center text-[#EB9D52] shrink-0 border border-white/20">
                        <Store className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs sm:text-sm text-[#FFF9F0]">Datos de la Tienda & Facturación</div>
                        <div className="text-[10px] text-[#F6E1C6]/80">Nombre, NIT, dirección, teléfono, logo y pie de factura</div>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3.5 bg-[#102737] border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-[#F6E1C6]/60">
                La Esquinita POS Móvil
              </span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-4 py-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-md cursor-pointer transition-colors"
              >
                Cerrar Menú
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
