import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  CategoryName, 
  CategoryInfo,
  ProductItem, 
  CartItem, 
  SaleTransaction, 
  PaymentMethodType,
  Customer,
  CashShift,
  CashMovement,
  DebtPayment,
  FixedMonthlyCosts,
  Supplier,
  ProductSupplierQuote,
  SupplierOrder,
  StoreInfo
} from './types';
import { INITIAL_PRODUCTS, INITIAL_CUSTOMERS, CATEGORIES, INITIAL_SUPPLIERS } from './data/initialData';
import { DEFAULT_FIXED_COSTS } from './lib/businessLogic';
import { getSavedStoreInfo } from './lib/pdfGenerator';
import { 
  POSHeader, 
  CategoryNav, 
  QuickFavoritesBar,
  ProductGrid, 
  POSCartDrawer,
  PaymentModal, 
  ReceiptModal, 
  SalesHistoryModal, 
  AddProductModal, 
  ManageCategoriesModal, 
  BarcodeScannerModal, 
  QuickAmountModal, 
  ManageQuickFavoritesModal, 
  ManageQuickSearchModal, 
  CustomerModal, 
  CashShiftModal, 
  InventoryManagerModal, 
  ReportsModal,
  ManagerDashboardModal,
  LiquidGlassGuideModal,
  SuppliersModal,
  StoreInfoModal
} from './components';
import { formatCOP } from './lib/utils';
import { 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  ShoppingBag, 
  Sparkles,
  Zap
} from 'lucide-react';

const DEFAULT_QUICK_SEARCH_CHIPS = [
  'Huevos',
  'Leche',
  'Arroz',
  'Aceite',
  'Pan',
  'Cerveza',
  'Gaseosa',
  'Jabón',
  'Chocoramo',
  'Pollo',
];

const getDefaultFavoriteIds = (prodList: ProductItem[]) => {
  const stapleTitles = ['Huevos', 'Pan', 'Leche', 'Arroz', 'Aceite', 'Gaseosa', 'Cerveza', 'Chocoramo'];
  const matched: (string | number)[] = [];
  stapleTitles.forEach((keyword) => {
    const found = prodList.find((p) => p.title.toLowerCase().includes(keyword.toLowerCase()));
    if (found && !matched.includes(found.id)) {
      matched.push(found.id);
    }
  });
  if (matched.length < 6) {
    prodList.slice(0, 6).forEach((p) => {
      if (!matched.includes(p.id)) matched.push(p.id);
    });
  }
  return matched;
};

// Sound effect for barcode scanner and cart addition
const playBeep = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.12);
  } catch {
    // AudioContext may be blocked before first user gesture
  }
};

export default function App() {
  // Categories state with persistence
  const [categories, setCategories] = useState<CategoryInfo[]>(() => {
    const saved = localStorage.getItem('pos_categories_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return CATEGORIES;
      }
    }
    return CATEGORIES;
  });

  // Products state with cost, margin & tax metadata
  const [products, setProducts] = useState<ProductItem[]>(() => {
    const saved = localStorage.getItem('pos_products_v2');
    if (saved) {
      try {
        const parsed: ProductItem[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge with INITIAL_PRODUCTS if parsed products lack supplier quotes or primary supplier info
          return parsed.map((p) => {
            const initMatch = INITIAL_PRODUCTS.find((ip) => String(ip.id) === String(p.id) || ip.barcode === p.barcode);
            return {
              ...p,
              primarySupplierId: p.primarySupplierId || initMatch?.primarySupplierId,
              primarySupplierName: p.primarySupplierName || initMatch?.primarySupplierName,
              supplierQuotes: (p.supplierQuotes && p.supplierQuotes.length > 0)
                ? p.supplierQuotes
                : (initMatch?.supplierQuotes || []),
            };
          });
        }
        return INITIAL_PRODUCTS;
      } catch {
        return INITIAL_PRODUCTS;
      }
    }
    return INITIAL_PRODUCTS;
  });

  // Customers state with credit & contact info
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('pos_customers_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_CUSTOMERS;
      }
    }
    return INITIAL_CUSTOMERS;
  });

  // Current active cash shift
  const [currentShift, setCurrentShift] = useState<CashShift | null>(() => {
    const saved = localStorage.getItem('pos_current_shift_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Return default open shift
      }
    }
    return {
      id: `shift-init-1`,
      openedAt: new Date(),
      cashierName: 'Don Esteban',
      initialCash: 150000,
      cashSales: 0,
      electronicSales: 0,
      creditSales: 0,
      inflows: 0,
      outflows: 0,
      movements: [
        {
          id: 'mov-init',
          timestamp: new Date(),
          type: 'inflow',
          category: 'Apertura de Caja',
          amount: 150000,
          reason: 'Base inicial en billetes y monedas para vueltas',
          cashierName: 'Don Esteban'
        }
      ],
      status: 'open'
    };
  });

  // Shift history
  const [shiftHistory, setShiftHistory] = useState<CashShift[]>(() => {
    const saved = localStorage.getItem('pos_shift_history_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('pos_cart_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [salesHistory, setSalesHistory] = useState<SaleTransaction[]>(() => {
    const saved = localStorage.getItem('pos_sales_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [parkedSales, setParkedSales] = useState<
    { id: string; name: string; items: CartItem[]; timestamp: Date }[]
  >([]);

  // Navigation & Filtering
  const [selectedCategory, setSelectedCategory] = useState<CategoryName | 'Todos'>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCategoryGallery, setShowCategoryGallery] = useState<boolean>(false);

  // Checkout info
  const [customerName, setCustomerName] = useState<string>('Consumidor Final');
  const [discount, setDiscount] = useState<number>(0);

  // Quick Search Chips state (Customizable)
  const [quickSearchChips, setQuickSearchChips] = useState<string[]>(() => {
    const saved = localStorage.getItem('pos_quick_search_chips_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_QUICK_SEARCH_CHIPS;
      }
    }
    return DEFAULT_QUICK_SEARCH_CHIPS;
  });

  // Favorite product IDs for Quick 1-Tap Buttons (Customizable)
  const [favoriteProductIds, setFavoriteProductIds] = useState<(string | number)[]>(() => {
    const saved = localStorage.getItem('pos_favorite_ids_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return getDefaultFavoriteIds(INITIAL_PRODUCTS);
      }
    }
    return getDefaultFavoriteIds(INITIAL_PRODUCTS);
  });

  // Modals visibility state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState<boolean>(false);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [isQuickAmountModalOpen, setIsQuickAmountModalOpen] = useState<boolean>(false);
  const [isManageFavoritesOpen, setIsManageFavoritesOpen] = useState<boolean>(false);
  const [isManageQuickSearchOpen, setIsManageQuickSearchOpen] = useState<boolean>(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState<boolean>(false);
  const [scannerMode, setScannerMode] = useState<'sale' | 'product'>('sale');
  const [scannedBarcodeForProduct, setScannedBarcodeForProduct] = useState<string>('');
  const [activeTransaction, setActiveTransaction] = useState<SaleTransaction | null>(null);

  // Professional Module Modals
  const [isMobileCartOpen, setIsMobileCartOpen] = useState<boolean>(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState<boolean>(false);
  const [isCashShiftModalOpen, setIsCashShiftModalOpen] = useState<boolean>(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState<boolean>(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState<boolean>(false);
  const [isManagerDashboardOpen, setIsManagerDashboardOpen] = useState<boolean>(false);
  const [isLiquidGlassGuideOpen, setIsLiquidGlassGuideOpen] = useState<boolean>(false);
  const [isSuppliersModalOpen, setIsSuppliersModalOpen] = useState<boolean>(false);
  const [supplierModalInitialTab, setSupplierModalInitialTab] = useState<'directory' | 'compare' | 'reorder' | 'orders'>('directory');
  const [supplierModalInitialProductId, setSupplierModalInitialProductId] = useState<string | number | undefined>(undefined);
  const [isStoreInfoModalOpen, setIsStoreInfoModalOpen] = useState<boolean>(false);

  // Centralized Store Information state with persistence
  const [storeInfo, setStoreInfo] = useState<StoreInfo>(() => getSavedStoreInfo());

  // Suppliers state with persistence
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('pos_suppliers_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {
        return INITIAL_SUPPLIERS;
      }
    }
    return INITIAL_SUPPLIERS;
  });

  // Supplier Purchase Orders state with persistence
  const [supplierOrders, setSupplierOrders] = useState<SupplierOrder[]>(() => {
    const saved = localStorage.getItem('pos_supplier_orders_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  // Fixed Monthly Costs state with persistence
  const [fixedCosts, setFixedCosts] = useState<FixedMonthlyCosts>(() => {
    const saved = localStorage.getItem('pos_fixed_costs_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_FIXED_COSTS;
      }
    }
    return DEFAULT_FIXED_COSTS;
  });

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('pos_suppliers_v1', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('pos_supplier_orders_v1', JSON.stringify(supplierOrders));
  }, [supplierOrders]);

  useEffect(() => {
    localStorage.setItem('pos_fixed_costs_v1', JSON.stringify(fixedCosts));
  }, [fixedCosts]);

  useEffect(() => {
    localStorage.setItem('pos_store_info_v1', JSON.stringify(storeInfo));
  }, [storeInfo]);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('pos_categories_v2', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('pos_products_v2', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('pos_customers_v1', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('pos_current_shift_v1', JSON.stringify(currentShift));
  }, [currentShift]);

  useEffect(() => {
    localStorage.setItem('pos_shift_history_v1', JSON.stringify(shiftHistory));
  }, [shiftHistory]);

  useEffect(() => {
    localStorage.setItem('pos_cart_v1', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('pos_sales_v2', JSON.stringify(salesHistory));
  }, [salesHistory]);

  useEffect(() => {
    localStorage.setItem('pos_quick_search_chips_v2', JSON.stringify(quickSearchChips));
  }, [quickSearchChips]);

  useEffect(() => {
    localStorage.setItem('pos_favorite_ids_v2', JSON.stringify(favoriteProductIds));
  }, [favoriteProductIds]);

  // Favorite products handlers
  const handleToggleFavoriteProduct = (productId: string | number) => {
    const prod = products.find((p) => p.id === productId);
    setFavoriteProductIds((prev) => {
      const exists = prev.includes(productId);
      if (exists) {
        showToast(prod ? `"${prod.title}" quitado de botones rápidos` : 'Botón rápido eliminado', 'info');
        return prev.filter((id) => id !== productId);
      } else {
        showToast(prod ? `"${prod.title}" agregado a botones rápidos` : 'Botón rápido agregado', 'success');
        return [...prev, productId];
      }
    });
  };

  const handleRemoveFavoriteProduct = (productId: string | number) => {
    const prod = products.find((p) => p.id === productId);
    setFavoriteProductIds((prev) => prev.filter((id) => id !== productId));
    showToast(prod ? `"${prod.title}" quitado de botones rápidos` : 'Botón rápido eliminado', 'info');
  };

  const handleClearFavorites = () => {
    setFavoriteProductIds([]);
    showToast('Se quitaron todos los botones rápidos', 'info');
  };

  const handleResetDefaultFavorites = () => {
    const def = getDefaultFavoriteIds(products);
    setFavoriteProductIds(def);
    showToast('Botones rápidos restablecidos a los sugeridos', 'success');
  };

  // Quick Search chips handlers
  const handleAddSearchChip = (chipText: string) => {
    const trimmed = chipText.trim();
    if (!trimmed) return;
    if (quickSearchChips.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      showToast(`"${trimmed}" ya está en la búsqueda rápida`, 'warning');
      return;
    }
    setQuickSearchChips((prev) => [...prev, trimmed]);
    showToast(`"${trimmed}" agregado a la búsqueda rápida`, 'success');
  };

  const handleRemoveSearchChip = (chipText: string) => {
    setQuickSearchChips((prev) => prev.filter((c) => c !== chipText));
    showToast(`"${chipText}" eliminado de la búsqueda rápida`, 'info');
  };

  const handleResetDefaultSearchChips = () => {
    setQuickSearchChips(DEFAULT_QUICK_SEARCH_CHIPS);
    showToast('Búsqueda rápida restablecida por defecto', 'success');
  };

  // Mutable refs for active search and open modals to avoid stale keyboard event closures
  const searchQueryRef = useRef(searchQuery);
  searchQueryRef.current = searchQuery;

  const modalsOpenRef = useRef(false);
  modalsOpenRef.current = Boolean(
    isPaymentModalOpen || isReceiptModalOpen || isHistoryModalOpen ||
    isAddProductModalOpen || isManageCategoriesOpen || isQuickAmountModalOpen ||
    isManageFavoritesOpen || isManageQuickSearchOpen || isScannerModalOpen ||
    isCustomerModalOpen || isCashShiftModalOpen || isInventoryModalOpen || isReportsModalOpen ||
    isManagerDashboardOpen || isLiquidGlassGuideOpen || isSuppliersModalOpen
  );

  // Keyboard shortcuts for high-speed POS operation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2: Enfocar buscador y seleccionar todo el texto para búsqueda o reemplazo instantáneo
      if (e.key === 'F2') {
        e.preventDefault();
        const searchEl = document.getElementById('pos-search-input') as HTMLInputElement | null;
        if (searchEl) {
          searchEl.focus();
          searchEl.select();
        }
        return;
      }

      // Acceso rápido global para limpiar motor de búsqueda: Alt + B o Alt + C
      if (e.altKey && (e.key === 'b' || e.key === 'B' || e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        setSearchQuery('');
        const searchEl = document.getElementById('pos-search-input') as HTMLInputElement | null;
        searchEl?.focus();
        return;
      }

      if (e.key === 'F3') {
        e.preventDefault();
        setScannerMode('sale');
        setIsScannerModalOpen(true);
        return;
      }

      if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0) {
          setIsPaymentModalOpen(true);
        } else {
          showToast('Agrega productos a la cuenta antes de cobrar', 'warning');
        }
        return;
      }

      if (e.key === 'F8') {
        e.preventDefault();
        setIsQuickAmountModalOpen(true);
        return;
      }

      if (e.key === 'F9') {
        e.preventDefault();
        setScannedBarcodeForProduct('');
        setIsAddProductModalOpen(true);
        return;
      }

      if (e.key === 'F10') {
        e.preventDefault();
        setIsHistoryModalOpen(true);
        return;
      }

      if (e.key === 'Escape') {
        // Si no hay modales abiertos y hay texto en la búsqueda, Esc borra la búsqueda rápidamente
        if (!modalsOpenRef.current && searchQueryRef.current) {
          e.preventDefault();
          setSearchQuery('');
          const searchEl = document.getElementById('pos-search-input') as HTMLInputElement | null;
          searchEl?.focus();
          return;
        }

        setIsPaymentModalOpen(false);
        setIsReceiptModalOpen(false);
        setIsHistoryModalOpen(false);
        setIsAddProductModalOpen(false);
        setIsManageCategoriesOpen(false);
        setIsQuickAmountModalOpen(false);
        setIsManageFavoritesOpen(false);
        setIsManageQuickSearchOpen(false);
        setIsScannerModalOpen(false);
        setIsCustomerModalOpen(false);
        setIsCashShiftModalOpen(false);
        setIsInventoryModalOpen(false);
        setIsReportsModalOpen(false);
        setIsManagerDashboardOpen(false);
        setIsLiquidGlassGuideOpen(false);
        setIsSuppliersModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart.length]);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Filtered products calculation
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart operations
  const handleAddToCart = (product: ProductItem) => {
    if (product.stock <= 0) {
      showToast(`El producto "${product.title}" está agotado`, 'warning');
      return;
    }

    playBeep();
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          showToast(`Stock máximo alcanzado (${product.stock} unids)`, 'warning');
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });

    showToast(`"${product.title}" agregado a la cuenta`);
  };

  const handleIncrementCart = (productId: string | number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === productId);
      if (existing && existing.quantity < prod.stock) {
        playBeep();
        return prev.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return prev;
    });
  };

  const handleDecrementCart = (productId: string | number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === productId);
      if (existing) {
        if (existing.quantity <= 1) {
          return prev.filter((item) => item.product.id !== productId);
        }
        return prev.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prev;
    });
  };

  const handleUpdateQuantity = (productId: string | number, quantity: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
    } else {
      const validQty = Math.min(quantity, prod.stock);
      setCart((prev) =>
        prev.map((item) =>
          item.product.id === productId ? { ...item, quantity: validQty } : item
        )
      );
    }
  };

  const handleRemoveItem = (productId: string | number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
    setDiscount(0);
    showToast('Cuenta de cobro vaciada', 'info');
  };

  // Barcode scanner actions with anti-bounce defense
  const lastHandledBarcodeRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  const handleBarcodeScan = (scannedCode: string, fromModal: boolean = false) => {
    const cleanCode = scannedCode.trim();
    if (!cleanCode) return;

    const now = Date.now();
    // Protección global contra ráfagas o dobles capturas accidentales (< 600ms para el mismo código)
    if (
      lastHandledBarcodeRef.current.code === cleanCode &&
      now - lastHandledBarcodeRef.current.time < 600
    ) {
      return;
    }
    lastHandledBarcodeRef.current = { code: cleanCode, time: now };

    const found = products.find(
      (p) => p.barcode === cleanCode || p.barcode.endsWith(cleanCode) || cleanCode.endsWith(p.barcode)
    );

    if (found) {
      handleAddToCart(found);
      if (!fromModal) {
        playBeep();
      }
      showToast(`Código ${cleanCode}: "${found.title}" agregado a la cuenta`, 'success');
    } else {
      showToast(`Código "${cleanCode}" no encontrado. Puedes registrarlo como nuevo producto.`, 'warning');
    }
  };

  const handleOpenScannerForSale = () => {
    setScannerMode('sale');
    setIsScannerModalOpen(true);
  };

  const handleOpenScannerForProduct = () => {
    setScannerMode('product');
    setIsScannerModalOpen(true);
  };

  const handleBarcodeScannedFromModal = (barcode: string) => {
    if (scannerMode === 'sale') {
      handleBarcodeScan(barcode, true);
    } else {
      setScannedBarcodeForProduct(barcode);
      setIsScannerModalOpen(false);
      setIsAddProductModalOpen(true);
      showToast(`Código ${barcode} asignado para registrar nuevo producto`, 'success');
    }
  };

  const handleRegisterProductFromScanner = (barcode: string) => {
    setScannedBarcodeForProduct(barcode);
    setIsScannerModalOpen(false);
    setIsAddProductModalOpen(true);
    showToast(`Registrando nuevo producto con código ${barcode}`, 'info');
  };

  // Park sale feature
  const handleParkCurrentSale = () => {
    if (cart.length === 0) return;
    const newParked = {
      id: `park-${Date.now()}`,
      name: `${customerName || 'Cliente'} - ${new Date().toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
      })}`,
      items: [...cart],
      timestamp: new Date(),
    };
    setParkedSales((prev) => [newParked, ...prev]);
    setCart([]);
    showToast('Venta puesta en espera exitosamente', 'info');
  };

  const handleRestoreParkedSale = (parkedId: string) => {
    const target = parkedSales.find((p) => p.id === parkedId);
    if (!target) return;

    setCart(target.items);
    setParkedSales((prev) => prev.filter((p) => p.id !== parkedId));
    showToast('Venta en espera retomada');
  };

  const handleDeleteParkedSale = (parkedId: string) => {
    setParkedSales((prev) => prev.filter((p) => p.id !== parkedId));
  };

  // Checkout operations
  const currentSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const currentProductDiscounts = cart.reduce((sum, item) => {
    const discPct = item.product.discount || 0;
    return sum + (item.product.price * item.quantity * discPct) / 100;
  }, 0);
  const currentNetAfterProdDiscount = Math.max(0, currentSubtotal - currentProductDiscounts);
  const currentGlobalDiscount = (currentNetAfterProdDiscount * discount) / 100;
  const currentTotalDiscount = currentProductDiscounts + currentGlobalDiscount;
  const currentTotal = Math.max(0, currentSubtotal - currentTotalDiscount);
  const currentTotalUnits = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const handleProceedToPayment = () => {
    if (cart.length === 0) return;
    setIsPaymentModalOpen(true);
  };

  const handleCompleteSale = (
    method: PaymentMethodType,
    amountReceived?: number,
    change?: number,
    customDetails?: string
  ) => {
    const grossSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const prodDiscounts = cart.reduce((sum, item) => {
      const discPct = item.product.discount || 0;
      return sum + (item.product.price * item.quantity * discPct) / 100;
    }, 0);
    const netAfterProd = Math.max(0, grossSubtotal - prodDiscounts);
    const globalDisc = (netAfterProd * discount) / 100;
    const totalDiscountAmount = prodDiscounts + globalDisc;
    const totalFinal = Math.max(0, grossSubtotal - totalDiscountAmount);

    // Calculate tax breakdown by rate
    const globalRatio = netAfterProd > 0 ? (netAfterProd - globalDisc) / netAfterProd : 1;
    const taxMap: Record<number, { baseAmount: number; taxAmount: number }> = {};

    cart.forEach((item) => {
      const discPct = item.product.discount || 0;
      const rate = item.product.ivaRate ?? 0;
      const itemNet = (item.product.price * (1 - discPct / 100) * item.quantity) * globalRatio;

      const base = itemNet / (1 + rate / 100);
      const tax = itemNet - base;

      if (!taxMap[rate]) {
        taxMap[rate] = { baseAmount: 0, taxAmount: 0 };
      }
      taxMap[rate].baseAmount += base;
      taxMap[rate].taxAmount += tax;
    });

    const taxBreakdown = Object.entries(taxMap).map(([rateStr, val]) => ({
      rate: Number(rateStr),
      baseAmount: Math.round(val.baseAmount),
      taxAmount: Math.round(val.taxAmount),
    }));

    const totalTax = taxBreakdown.reduce((acc, tb) => acc + tb.taxAmount, 0);

    const activeCustomerName = customerName || 'Consumidor Final';

    const newTransaction: SaleTransaction = {
      id: `${Date.now().toString().slice(-6)}`,
      timestamp: new Date(),
      items: [...cart],
      subtotal: grossSubtotal,
      discount: totalDiscountAmount,
      tax: totalTax,
      taxBreakdown,
      total: totalFinal,
      paymentMethod: method,
      amountReceived,
      change,
      customerName: activeCustomerName,
      cashierName: currentShift?.cashierName || 'Don Esteban',
      customDetails,
    };

    // 1. Deduct stock from inventory
    setProducts((prev) =>
      prev.map((prod) => {
        const soldItem = cart.find((c) => c.product.id === prod.id);
        if (soldItem) {
          return {
            ...prod,
            stock: Math.max(0, prod.stock - soldItem.quantity),
          };
        }
        return prod;
      })
    );

    // 2. If paid by credit / fiado, update customer balance
    if (method === 'Crédito / Fiado' && activeCustomerName !== 'Consumidor Final') {
      setCustomers((prev) => {
        const exists = prev.find((c) => c.name.toLowerCase() === activeCustomerName.toLowerCase());
        if (exists) {
          return prev.map((c) =>
            c.id === exists.id
              ? {
                  ...c,
                  currentDebt: c.currentDebt + totalFinal,
                  totalPurchased: c.totalPurchased + totalFinal,
                  lastPurchaseDate: new Date(),
                }
              : c
          );
        } else {
          // Add new customer automatically
          const newCust: Customer = {
            id: `cust-${Date.now()}`,
            name: activeCustomerName,
            currentDebt: totalFinal,
            creditLimit: 300000,
            totalPurchased: totalFinal,
            lastPurchaseDate: new Date(),
            notes: 'Registrado desde cobranza a crédito',
            paymentHistory: []
          };
          return [...prev, newCust];
        }
      });
    }

    // 3. Update current shift cash / electronic / credit counters
    if (currentShift && currentShift.status === 'open') {
      setCurrentShift((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          cashSales: method === 'Efectivo' ? prev.cashSales + totalFinal : prev.cashSales,
          electronicSales:
            method === 'Nequi / Daviplata' || method === 'Tarjeta Débito/Crédito'
              ? prev.electronicSales + totalFinal
              : prev.electronicSales,
          creditSales: method === 'Crédito / Fiado' ? prev.creditSales + totalFinal : prev.creditSales,
        };
      });
    }

    setSalesHistory((prev) => [newTransaction, ...prev]);
    setActiveTransaction(newTransaction);
    setIsPaymentModalOpen(false);
    setIsReceiptModalOpen(true);
    setCart([]);
    setDiscount(0);
    setCustomerName('Consumidor Final');

    showToast(`Venta por ${formatCOP(totalFinal)} completada con éxito`);
  };

  // Customer Management Handlers
  const handleAddCustomer = (newCustomer: Customer) => {
    setCustomers((prev) => [newCustomer, ...prev]);
    showToast(`Cliente "${newCustomer.name}" registrado exitosamente`);
  };

  const handleUpdateCustomer = (updatedCustomer: Customer) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c))
    );
    showToast(`Datos de "${updatedCustomer.name}" actualizados`);
  };

  const handleDeleteCustomer = (customerId: string) => {
    const cust = customers.find((c) => c.id === customerId);
    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
    showToast(cust ? `Cliente "${cust.name}" eliminado` : 'Cliente eliminado', 'info');
  };

  const handleRecordDebtPayment = (
    customerId: string,
    amount: number,
    paymentMethod: PaymentMethodType,
    notes?: string
  ) => {
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return;

    const newPayment: DebtPayment = {
      id: `pay-${Date.now()}`,
      customerId,
      amount,
      paymentMethod,
      timestamp: new Date(),
      notes,
      cashierName: currentShift?.cashierName || 'Don Esteban'
    };

    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          return {
            ...c,
            currentDebt: Math.max(0, c.currentDebt - amount),
            paymentHistory: [newPayment, ...(c.paymentHistory || [])],
          };
        }
        return c;
      })
    );

    // Register inflow into cash drawer if paid in cash
    if (paymentMethod === 'Efectivo' && currentShift && currentShift.status === 'open') {
      const movement: CashMovement = {
        id: `mov-${Date.now()}`,
        timestamp: new Date(),
        type: 'inflow',
        category: 'Abono de Fiado / Cartera',
        amount,
        reason: `Abono de deuda de ${cust.name}`,
        cashierName: currentShift.cashierName
      };

      setCurrentShift((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          inflows: prev.inflows + amount,
          movements: [movement, ...prev.movements]
        };
      });
    }

    showToast(`Abono de ${formatCOP(amount)} registrado para ${cust.name}`, 'success');
  };

  const handleSelectCustomerForCart = (cust: Customer) => {
    setCustomerName(cust.name);
    setIsCustomerModalOpen(false);
    showToast(`Cliente "${cust.name}" asignado a la factura`);
  };

  // Cash Shift Handlers
  const handleOpenShift = (initialCash: number, cashierName: string) => {
    const newShift: CashShift = {
      id: `shift-${Date.now()}`,
      openedAt: new Date(),
      cashierName,
      initialCash,
      initialBase: initialCash,
      cashSales: 0,
      electronicSales: 0,
      creditSales: 0,
      inflows: 0,
      outflows: 0,
      movements: [
        {
          id: `mov-${Date.now()}`,
          timestamp: new Date(),
          type: 'inflow',
          category: 'Apertura de Caja',
          amount: initialCash,
          reason: 'Base inicial para cambio y vueltas',
          cashierName
        }
      ],
      status: 'open'
    };

    setCurrentShift(newShift);
    showToast(`Turno de caja abierto por ${cashierName} con base de ${formatCOP(initialCash)}`, 'success');
  };

  const handleUpdateCurrentShift = (updates: { cashierName: string; initialCash: number; reason?: string }) => {
    if (!currentShift) return;

    setCurrentShift((prev) => {
      if (!prev) return prev;
      const oldCashier = prev.cashierName;
      const oldBase = prev.initialCash ?? prev.initialBase ?? 0;
      const newCashier = updates.cashierName.trim() || oldCashier;
      const newBase = updates.initialCash;

      // Update initial opening movement if present
      const updatedMovements = prev.movements.map((m) => {
        if (m.category === 'Apertura de Caja' || m.id === 'mov-init') {
          return {
            ...m,
            amount: newBase,
            cashierName: newCashier,
            reason: updates.reason ? `Base inicial ajustada: ${updates.reason}` : m.reason,
          };
        }
        return m;
      });

      // Audit movement for tracking shift cashier change or base alteration
      const auditMovement: CashMovement = {
        id: `mov-audit-${Date.now()}`,
        timestamp: new Date(),
        type: 'inflow',
        category: 'Apertura de Caja',
        amount: 0,
        reason: `Ajuste de turno: Encargado (${oldCashier} ➔ ${newCashier}), Base (${formatCOP(oldBase)} ➔ ${formatCOP(newBase)})${updates.reason ? ` - Motivo: ${updates.reason}` : ''}`,
        cashierName: newCashier,
      };

      return {
        ...prev,
        cashierName: newCashier,
        initialCash: newBase,
        initialBase: newBase,
        movements: [auditMovement, ...updatedMovements]
      };
    });

    showToast(
      `Turno actualizado: Encargado ${updates.cashierName} • Base ${formatCOP(updates.initialCash)}`,
      'success'
    );
  };

  const handleCloseShift = (
    finalCashCounted: number,
    difference: number,
    observations?: string
  ) => {
    if (!currentShift) return;

    const closed: CashShift = {
      ...currentShift,
      closedAt: new Date(),
      finalCashCounted,
      difference,
      observations,
      status: 'closed'
    };

    setShiftHistory((prev) => [closed, ...prev]);
    setCurrentShift(null);
    showToast(`Turno de caja cerrado exitosamente con arqueo final`, 'info');
  };

  const handleAddCashMovement = (
    type: 'inflow' | 'outflow',
    amount: number,
    category: string,
    reason: string
  ) => {
    if (!currentShift || currentShift.status !== 'open') {
      showToast('Debe haber una caja abierta para registrar movimientos de dinero', 'warning');
      return;
    }

    const movement: CashMovement = {
      id: `mov-${Date.now()}`,
      timestamp: new Date(),
      type,
      category,
      amount,
      reason,
      cashierName: currentShift.cashierName
    };

    setCurrentShift((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        inflows: type === 'inflow' ? prev.inflows + amount : prev.inflows,
        outflows: type === 'outflow' ? prev.outflows + amount : prev.outflows,
        movements: [movement, ...prev.movements]
      };
    });

    showToast(`${type === 'inflow' ? 'Ingreso' : 'Egreso'} de ${formatCOP(amount)} registrado en caja`);
  };

  // Product CRUD
  const handleStartEditProduct = (prod: ProductItem) => {
    setEditingProduct(prod);
    setIsAddProductModalOpen(true);
  };

  const handleAddNewProduct = (newProduct: ProductItem) => {
    setProducts((prev) => [newProduct, ...prev]);
    showToast(`Producto "${newProduct.title}" agregado al catálogo con stock de ${newProduct.stock}`);
  };

  const handleUpdateProduct = (updatedProduct: ProductItem) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === updatedProduct.id
          ? { ...item, product: updatedProduct }
          : item
      )
    );
    showToast(`Producto "${updatedProduct.title}" actualizado con éxito`, 'success');
  };

  const handleDeleteProduct = (productId: string | number) => {
    const prod = products.find((p) => p.id === productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    setFavoriteProductIds((prev) => prev.filter((id) => id !== productId));
    showToast(prod ? `"${prod.title}" eliminado` : 'Producto eliminado', 'info');
  };

  // Category CRUD
  const handleAddCategory = (newCat: CategoryInfo) => {
    setCategories((prev) => [...prev, newCat]);
    showToast(`Categoría "${newCat.name}" agregada exitosamente`, 'success');
  };

  const handleUpdateCategory = (updatedCat: CategoryInfo, oldName?: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === updatedCat.id ? updatedCat : c))
    );
    if (oldName && oldName !== updatedCat.name) {
      setProducts((prev) =>
        prev.map((p) => (p.category === oldName ? { ...p, category: updatedCat.name } : p))
      );
      if (selectedCategory === oldName) {
        setSelectedCategory(updatedCat.name);
      }
    }
    showToast(`Categoría "${updatedCat.name}" actualizada`, 'success');
  };

  const handleDeleteCategory = (
    categoryId: string,
    categoryName: string,
    reassignTo: string = 'Otros'
  ) => {
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    setProducts((prev) =>
      prev.map((p) => (p.category === categoryName ? { ...p, category: reassignTo } : p))
    );
    if (selectedCategory === categoryName) {
      setSelectedCategory('Todos');
    }
    showToast(
      `Categoría "${categoryName}" eliminada. Sus productos fueron reasignados a "${reassignTo}".`,
      'info'
    );
  };

  const handleResetDefaultCategories = () => {
    setCategories(CATEGORIES);
    showToast('Categorías restablecidas a los valores por defecto', 'success');
  };

  // Supplier Traceability Handlers
  const handleAddSupplier = (newSupplier: Supplier) => {
    setSuppliers((prev) => [newSupplier, ...prev]);
    showToast(`Proveedor "${newSupplier.name}" registrado exitosamente`, 'success');
  };

  const handleUpdateSupplier = (updatedSupplier: Supplier) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === updatedSupplier.id ? updatedSupplier : s))
    );
    setProducts((prev) =>
      prev.map((p) => {
        let changed = false;
        let pName = p.primarySupplierName;
        if (p.primarySupplierId === updatedSupplier.id) {
          pName = updatedSupplier.name;
          changed = true;
        }
        const updatedQuotes = p.supplierQuotes?.map((q) => {
          if (q.supplierId === updatedSupplier.id) {
            changed = true;
            return { ...q, supplierName: updatedSupplier.name };
          }
          return q;
        });
        return changed ? { ...p, primarySupplierName: pName, supplierQuotes: updatedQuotes } : p;
      })
    );
    showToast(`Proveedor "${updatedSupplier.name}" actualizado`, 'success');
  };

  const handleDeleteSupplier = (supplierId: string) => {
    const sup = suppliers.find((s) => s.id === supplierId);
    setSuppliers((prev) => prev.filter((s) => s.id !== supplierId));
    showToast(sup ? `Proveedor "${sup.name}" eliminado` : 'Proveedor eliminado', 'info');
  };

  const handleAddSupplierQuote = (quote: ProductSupplierQuote) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === quote.productId) {
          const quotes = p.supplierQuotes || [];
          const updatedQuotes = [...quotes, quote];
          if (quote.isPreferred || quotes.length === 0) {
            return {
              ...p,
              primarySupplierId: quote.supplierId,
              primarySupplierName: quote.supplierName,
              costPrice: quote.costPrice,
              supplierQuotes: updatedQuotes.map((q) => ({
                ...q,
                isPreferred: q.id === quote.id,
              })),
            };
          }
          return { ...p, supplierQuotes: updatedQuotes };
        }
        return p;
      })
    );
    showToast(`Cotización de "${quote.supplierName}" registrada`, 'success');
  };

  const handleUpdateSupplierQuote = (updatedQuote: ProductSupplierQuote) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === updatedQuote.productId) {
          const quotes = p.supplierQuotes || [];
          const updatedQuotes = quotes.map((q) => (q.id === updatedQuote.id ? updatedQuote : q));
          if (updatedQuote.isPreferred) {
            return {
              ...p,
              primarySupplierId: updatedQuote.supplierId,
              primarySupplierName: updatedQuote.supplierName,
              costPrice: updatedQuote.costPrice,
              supplierQuotes: updatedQuotes.map((q) => ({
                ...q,
                isPreferred: q.id === updatedQuote.id,
              })),
            };
          }
          return { ...p, supplierQuotes: updatedQuotes };
        }
        return p;
      })
    );
    showToast('Cotización actualizada', 'success');
  };

  const handleSetPreferredQuote = (productId: string | number, quoteId: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const quotes = p.supplierQuotes || [];
          const selected = quotes.find((q) => q.id === quoteId);
          if (!selected) return p;
          return {
            ...p,
            primarySupplierId: selected.supplierId,
            primarySupplierName: selected.supplierName,
            costPrice: selected.costPrice,
            supplierQuotes: quotes.map((q) => ({
              ...q,
              isPreferred: q.id === quoteId,
            })),
          };
        }
        return p;
      })
    );
    showToast('Proveedor preferido actualizado', 'success');
  };

  const handleCreateSupplierOrder = (newOrder: SupplierOrder) => {
    setSupplierOrders((prev) => [newOrder, ...prev]);
    showToast(`Pedido de abastecimiento guardado para ${newOrder.supplierName}`, 'success');
  };

  const handleReceiveSupplierOrder = (orderId: string, recordCashOutflow: boolean) => {
    const targetOrder = supplierOrders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    // Increment inventory stock for each product in order
    setProducts((prev) =>
      prev.map((p) => {
        const itemInOrder = targetOrder.items.find((i) => i.productId === p.id);
        if (itemInOrder) {
          return {
            ...p,
            stock: p.stock + itemInOrder.orderQuantity,
            costPrice: itemInOrder.unitCost > 0 ? itemInOrder.unitCost : p.costPrice,
          };
        }
        return p;
      })
    );

    // Update order status to received
    setSupplierOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'Recibido' as const,
              receivedAt: new Date(),
              receivedBy: currentShift?.cashierName || 'Don Esteban',
              paidWithCashMovement: recordCashOutflow,
            }
          : o
      )
    );

    // If outflow requested, deduct from cash shift
    if (recordCashOutflow && currentShift && currentShift.status === 'open' && targetOrder.totalEstimatedCost > 0) {
      const movement: CashMovement = {
        id: `mov-${Date.now()}`,
        timestamp: new Date(),
        type: 'outflow',
        category: 'Pago a Proveedor',
        amount: targetOrder.totalEstimatedCost,
        reason: `Pago de pedido recibido a ${targetOrder.supplierName}`,
        cashierName: currentShift.cashierName,
      };

      setCurrentShift((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          outflows: prev.outflows + targetOrder.totalEstimatedCost,
          movements: [movement, ...prev.movements],
        };
      });
    }

    showToast(`Pedido recibido: Stock sumado al inventario`, 'success');
  };

  const handleCancelSupplierOrder = (orderId: string) => {
    setSupplierOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'Cancelado' as const } : o))
    );
    showToast('Orden de abastecimiento cancelada', 'info');
  };

  const handleResetSuppliersAndQuotes = () => {
    setSuppliers(INITIAL_SUPPLIERS);
    setProducts((prev) =>
      prev.map((p) => {
        const initMatch = INITIAL_PRODUCTS.find((ip) => String(ip.id) === String(p.id) || ip.barcode === p.barcode);
        return {
          ...p,
          primarySupplierId: initMatch?.primarySupplierId || p.primarySupplierId,
          primarySupplierName: initMatch?.primarySupplierName || p.primarySupplierName,
          supplierQuotes: (initMatch?.supplierQuotes && initMatch.supplierQuotes.length > 0)
            ? initMatch.supplierQuotes
            : (p.supplierQuotes || []),
        };
      })
    );
    showToast('Directorio de proveedores y cotizaciones restablecidos exitosamente', 'success');
  };

  const handleBulkUpdateStock = (updates: { id: string | number; newStock: number }[]) => {
    setProducts((prev) =>
      prev.map((p) => {
        const up = updates.find((u) => u.id === p.id);
        return up ? { ...p, stock: up.newStock } : p;
      })
    );
    showToast(`Inventario actualizado para ${updates.length} productos`, 'success');
  };

  const handleSaveStoreInfo = (newInfo: StoreInfo) => {
    setStoreInfo(newInfo);
    localStorage.setItem('pos_store_info_v1', JSON.stringify(newInfo));
    showToast(`Datos del negocio guardados: ${newInfo.name}`, 'success');
  };

  const handleAddQuickAmountProduct = (quickProduct: ProductItem) => {
    handleAddToCart(quickProduct);
    showToast(`"${quickProduct.title}" agregado a la cuenta por ${formatCOP(quickProduct.price)}`);
  };

  const totalSalesToday = salesHistory.reduce((sum, tx) => sum + tx.total, 0);

  return (
    <div className="min-h-screen bg-[#1b2631] text-[#222E3A] flex flex-col font-secondary relative selection:bg-[#BC6343] selection:text-white overflow-x-hidden">
      {/* Background Wallpaper Image */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat transition-all duration-700"
        style={{ 
          backgroundImage: `url('https://res.cloudinary.com/unhl90nr/image/upload/v1788303386/Belleza_Carmes%C3%AD_iclhmj.webp')`
        }}
      >
        {/* Ambient Overlay to blend with brand warm palette and keep high contrast */}
        <div className="absolute inset-0 bg-[#214C6A]/20 backdrop-saturate-125" />
      </div>

      {/* Liquid Glass Fluid Ambient Backlight Canvas */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#EB9D52]/25 rounded-full blur-3xl" />
        <div className="absolute top-1/4 -right-28 w-[450px] h-[450px] bg-[#BC6343]/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 w-[500px] h-[500px] bg-[#214C6A]/20 rounded-full blur-3xl" />
        <div className="absolute top-2/3 right-1/4 w-80 h-80 bg-[#FFF9F0]/30 rounded-full blur-2xl" />
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-none shadow-2xl bg-[#214C6A] text-[#FFF9F0] text-xs font-bold border-2 border-white/30 animate-fadeIn">
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#4caf50] shrink-0" />}
          {toast.type === 'warning' && <AlertCircle className="w-4 h-4 text-[#EB9D52] shrink-0" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-[#EB9D52] shrink-0" />}
          <span className="tracking-wide">{toast.message}</span>
        </div>
      )}

      {/* POS Top Navigation & Header */}
      <div className="relative z-20">
        <POSHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onBarcodeScan={handleBarcodeScan}
          totalSalesToday={totalSalesToday}
          transactionsToday={salesHistory}
          currentShift={currentShift}
          onOpenHistory={() => setIsHistoryModalOpen(true)}
          onOpenAddProduct={() => {
            setScannedBarcodeForProduct('');
            setEditingProduct(null);
            setIsAddProductModalOpen(true);
          }}
          onOpenManageCategories={() => setIsManageCategoriesOpen(true)}
          onOpenQuickAmount={() => setIsQuickAmountModalOpen(true)}
          onOpenCashShift={() => setIsCashShiftModalOpen(true)}
          onOpenCustomers={() => setIsCustomerModalOpen(true)}
          onOpenInventoryManager={() => setIsInventoryModalOpen(true)}
          onOpenSuppliers={() => {
            setSupplierModalInitialTab('directory');
            setSupplierModalInitialProductId(undefined);
            setIsSuppliersModalOpen(true);
          }}
          onOpenReports={() => setIsReportsModalOpen(true)}
          onOpenManagerDashboard={() => setIsManagerDashboardOpen(true)}
          storeInfo={storeInfo}
          onOpenStoreInfo={() => setIsStoreInfoModalOpen(true)}
          showCategoryGallery={showCategoryGallery}
          onToggleCategoryGallery={() => setShowCategoryGallery(!showCategoryGallery)}
          quickSearchChips={quickSearchChips}
          onAddSearchChip={handleAddSearchChip}
          onRemoveSearchChip={handleRemoveSearchChip}
          onOpenManageQuickSearch={() => setIsManageQuickSearchOpen(true)}
          onOpenScannerModal={handleOpenScannerForSale}
          onOpenLiquidGlassGuide={() => setIsLiquidGlassGuideOpen(true)}
          products={products}
          favoriteIds={favoriteProductIds}
          onAddToCart={handleAddToCart}
          onToggleFavorite={handleToggleFavoriteProduct}
          cartItemCount={currentTotalUnits}
          cartTotal={currentTotal}
          onOpenMobileCart={() => setIsMobileCartOpen(true)}
        />
      </div>

      {/* Main POS Workspace */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 lg:p-5 flex flex-col lg:flex-row gap-4 items-start pb-28 lg:pb-5">
        {/* Left Side: Favorites, Category Navigator & Product Catalog */}
        <section className="flex-1 w-full space-y-3.5 min-w-0">
          {/* Quick 1-Tap Favorites Bar */}
          <QuickFavoritesBar
            products={products}
            favoriteIds={favoriteProductIds}
            onAddToCart={handleAddToCart}
            onOpenManageFavorites={() => setIsManageFavoritesOpen(true)}
            onRemoveFavorite={handleRemoveFavoriteProduct}
          />

          {/* Category Chips & Gallery */}
          <CategoryNav
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            products={products}
            showCategoryGallery={showCategoryGallery}
            onToggleCategoryGallery={() => setShowCategoryGallery(!showCategoryGallery)}
            onOpenManageCategories={() => setIsManageCategoriesOpen(true)}
          />

          {/* Product Grid */}
          <ProductGrid
            products={filteredProducts}
            cart={cart}
            favoriteIds={favoriteProductIds}
            onToggleFavorite={handleToggleFavoriteProduct}
            onAddToCart={handleAddToCart}
            onIncrementCart={handleIncrementCart}
            onDecrementCart={handleDecrementCart}
            onEditProduct={handleStartEditProduct}
            selectedCategory={selectedCategory}
            searchQuery={searchQuery}
            onResetFilters={() => {
              setSelectedCategory('Todos');
              setSearchQuery('');
            }}
          />
        </section>

        {/* Right Side: Sticky POS Cart Drawer with Customer Selection (Desktop) */}
        <div className="hidden lg:block lg:sticky lg:top-20">
          <POSCartDrawer
            cart={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onProceedToPayment={handleProceedToPayment}
            discount={discount}
            onDiscountChange={setDiscount}
            customerName={customerName}
            onCustomerNameChange={setCustomerName}
            customers={customers}
            onOpenCustomerDirectory={() => setIsCustomerModalOpen(true)}
            parkedSales={parkedSales}
            onParkCurrentSale={handleParkCurrentSale}
            onRestoreParkedSale={handleRestoreParkedSale}
            onDeleteParkedSale={handleDeleteParkedSale}
            onOpenQuickAmount={() => setIsQuickAmountModalOpen(true)}
          />
        </div>
      </main>

      {/* Floating Sticky Mobile Cart Bar (< lg) */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-[#163347]/95 backdrop-blur-md border-t border-[#EB9D52]/40 p-2.5 sm:p-3 shadow-[0_-8px_30px_rgba(0,0,0,0.35)] lg:hidden animate-slideUp">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setIsMobileCartOpen(true)}
              className="flex items-center gap-2 text-left cursor-pointer group flex-1 min-w-0"
            >
              <div className="w-10 h-10 rounded-lg bg-[#EB9D52] flex items-center justify-center text-[#222E3A] font-bold shadow-md shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-[#F6E1C6]/80 flex items-center gap-1.5 font-medium">
                  <span>{currentTotalUnits} {currentTotalUnits === 1 ? 'artículo' : 'artículos'}</span>
                  <span className="text-[#EB9D52]">• Ver cuenta</span>
                </div>
                <div className="text-base sm:text-lg font-black font-mono text-white leading-tight truncate">
                  {formatCOP(currentTotal)}
                </div>
              </div>
            </button>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsMobileCartOpen(true)}
                className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer transition-all border border-white/20 active:scale-95"
              >
                Cuenta
              </button>
              <button
                type="button"
                onClick={handleProceedToPayment}
                className="px-4 py-2 rounded-lg bg-[#BC6343] hover:bg-[#964937] text-white font-extrabold text-xs sm:text-sm shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 border border-white/25"
              >
                <Zap className="w-4 h-4 text-[#EB9D52]" />
                <span>Cobrar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Cart Sheet / Modal (< lg) */}
      {isMobileCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md p-0 sm:p-4 lg:hidden animate-fadeIn">
          <div className="w-full max-w-lg max-h-[92vh] sm:max-h-[85vh] h-full flex flex-col bg-white rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden animate-slideUp">
            <POSCartDrawer
              cart={cart}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onClearCart={handleClearCart}
              onProceedToPayment={() => {
                setIsMobileCartOpen(false);
                handleProceedToPayment();
              }}
              discount={discount}
              onDiscountChange={setDiscount}
              customerName={customerName}
              onCustomerNameChange={setCustomerName}
              customers={customers}
              onOpenCustomerDirectory={() => {
                setIsMobileCartOpen(false);
                setIsCustomerModalOpen(true);
              }}
              parkedSales={parkedSales}
              onParkCurrentSale={handleParkCurrentSale}
              onRestoreParkedSale={handleRestoreParkedSale}
              onDeleteParkedSale={handleDeleteParkedSale}
              onOpenQuickAmount={() => {
                setIsMobileCartOpen(false);
                setIsQuickAmountModalOpen(true);
              }}
              onCloseMobileDrawer={() => setIsMobileCartOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Professional Modals */}

      {/* Customer Directory & Credit Modal */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customers={customers}
        onAddCustomer={handleAddCustomer}
        onUpdateCustomer={handleUpdateCustomer}
        onDeleteCustomer={handleDeleteCustomer}
        onRecordDebtPayment={handleRecordDebtPayment}
        onSelectCustomerForSale={handleSelectCustomerForCart}
        storeInfo={storeInfo}
        cashierName={currentShift?.cashierName || storeInfo.defaultCashierName || 'Don Esteban'}
      />

      {/* Cash Shift & Drawer Management Modal */}
      <CashShiftModal
        isOpen={isCashShiftModalOpen}
        onClose={() => setIsCashShiftModalOpen(false)}
        currentShift={currentShift}
        shiftHistory={shiftHistory}
        onOpenShift={handleOpenShift}
        onUpdateShift={handleUpdateCurrentShift}
        onCloseShift={handleCloseShift}
        onAddCashMovement={handleAddCashMovement}
        transactions={salesHistory}
        debtPayments={customers.flatMap((c) => c.paymentHistory || [])}
      />

      {/* Inventory, Stock & Kardex Manager Modal */}
      <InventoryManagerModal
        isOpen={isInventoryModalOpen}
        onClose={() => setIsInventoryModalOpen(false)}
        products={products}
        categories={categories}
        onAddNewProduct={() => {
          setIsInventoryModalOpen(false);
          setEditingProduct(null);
          setIsAddProductModalOpen(true);
        }}
        onEditProduct={(p) => {
          setIsInventoryModalOpen(false);
          setEditingProduct(p);
          setIsAddProductModalOpen(true);
        }}
        onDeleteProduct={handleDeleteProduct}
        onBulkUpdateStock={handleBulkUpdateStock}
        onOpenManageCategories={() => {
          setIsInventoryModalOpen(false);
          setIsManageCategoriesOpen(true);
        }}
        onOpenSuppliersModal={(prodId, tab) => {
          setIsInventoryModalOpen(false);
          setSupplierModalInitialProductId(prodId);
          setSupplierModalInitialTab(tab || 'reorder');
          setIsSuppliersModalOpen(true);
        }}
      />

      {/* Suppliers, Traceability, Quotation Comparison & Purchase Orders Modal */}
      <SuppliersModal
        isOpen={isSuppliersModalOpen}
        onClose={() => {
          setIsSuppliersModalOpen(false);
          setSupplierModalInitialProductId(undefined);
        }}
        suppliers={suppliers}
        products={products}
        supplierOrders={supplierOrders}
        storeInfo={storeInfo}
        onAddSupplier={handleAddSupplier}
        onUpdateSupplier={handleUpdateSupplier}
        onDeleteSupplier={handleDeleteSupplier}
        onAddSupplierQuote={handleAddSupplierQuote}
        onUpdateSupplierQuote={handleUpdateSupplierQuote}
        onSetPreferredQuote={handleSetPreferredQuote}
        onCreateSupplierOrder={handleCreateSupplierOrder}
        onReceiveSupplierOrder={handleReceiveSupplierOrder}
        onCancelSupplierOrder={handleCancelSupplierOrder}
        onResetSuppliersAndQuotes={handleResetSuppliersAndQuotes}
        initialTab={supplierModalInitialTab}
        selectedProductIdForCompare={supplierModalInitialProductId}
      />

      {/* Financial Reports & Analytics Dashboard Modal */}
      <ReportsModal
        isOpen={isReportsModalOpen}
        onClose={() => setIsReportsModalOpen(false)}
        transactions={salesHistory}
        products={products}
        customers={customers}
        shiftHistory={shiftHistory}
      />

      {/* Quick Numeric Keypad Modal */}
      <QuickAmountModal
        isOpen={isQuickAmountModalOpen}
        onClose={() => setIsQuickAmountModalOpen(false)}
        onAddQuickItem={handleAddQuickAmountProduct}
      />

      {/* Manage Quick Favorites Modal */}
      <ManageQuickFavoritesModal
        isOpen={isManageFavoritesOpen}
        onClose={() => setIsManageFavoritesOpen(false)}
        products={products}
        favoriteIds={favoriteProductIds}
        onToggleFavorite={handleToggleFavoriteProduct}
        onClearFavorites={handleClearFavorites}
        onResetDefaultFavorites={handleResetDefaultFavorites}
      />

      {/* Manage Quick Search Chips Modal */}
      <ManageQuickSearchModal
        isOpen={isManageQuickSearchOpen}
        onClose={() => setIsManageQuickSearchOpen(false)}
        chips={quickSearchChips}
        onAddChip={handleAddSearchChip}
        onRemoveChip={handleRemoveSearchChip}
        onResetDefaultChips={handleResetDefaultSearchChips}
      />

      {/* Payment Method & Cash Drawer Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        cart={cart}
        subtotal={currentSubtotal}
        discount={currentTotalDiscount}
        total={currentTotal}
        customerName={customerName}
        onCustomerNameChange={setCustomerName}
        customers={customers}
        onOpenCustomerDirectory={() => {
          setIsPaymentModalOpen(false);
          setIsCustomerModalOpen(true);
        }}
        onCompleteSale={handleCompleteSale}
      />

      {/* Thermal Receipt & DIAN Invoice Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        transaction={activeTransaction}
        storeInfo={storeInfo}
        onOpenStoreInfo={() => setIsStoreInfoModalOpen(true)}
        onNewSale={() => {
          setIsReceiptModalOpen(false);
          setActiveTransaction(null);
        }}
      />

      {/* Sales History Modal */}
      <SalesHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        transactions={salesHistory}
        onSelectReceipt={(tx) => {
          setActiveTransaction(tx);
          setIsReceiptModalOpen(true);
        }}
      />

      {/* Add / Edit Product Modal */}
      <AddProductModal
        isOpen={isAddProductModalOpen}
        onClose={() => {
          setIsAddProductModalOpen(false);
          setEditingProduct(null);
          setScannedBarcodeForProduct('');
        }}
        onAddProduct={handleAddNewProduct}
        onUpdateProduct={handleUpdateProduct}
        onDeleteProduct={handleDeleteProduct}
        editingProduct={editingProduct}
        categories={categories}
        suppliers={suppliers}
        initialBarcode={scannedBarcodeForProduct}
        onOpenScanner={handleOpenScannerForProduct}
        onOpenManageCategories={() => {
          setIsAddProductModalOpen(false);
          setIsManageCategoriesOpen(true);
        }}
      />

      {/* Manage Categories Modal */}
      <ManageCategoriesModal
        isOpen={isManageCategoriesOpen}
        onClose={() => setIsManageCategoriesOpen(false)}
        categories={categories}
        products={products}
        onAddCategory={handleAddCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
        onResetDefaultCategories={handleResetDefaultCategories}
      />

      {/* Barcode Camera & Photo Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        onBarcodeScanned={handleBarcodeScannedFromModal}
        mode={scannerMode}
        products={products}
        onRegisterProduct={handleRegisterProductFromScanner}
      />

      {/* Simplified Manager Dashboard Modal ("Semáforo y Bolsillo") & Break-Even Module */}
      <ManagerDashboardModal
        isOpen={isManagerDashboardOpen}
        onClose={() => setIsManagerDashboardOpen(false)}
        transactions={salesHistory}
        products={products}
        currentShift={currentShift}
        customers={customers}
        fixedCosts={fixedCosts}
        onSaveFixedCosts={(newCosts) => {
          setFixedCosts(newCosts);
          showToast('Gastos fijos actualizados y metas recalculadas', 'success');
        }}
        onOpenInventory={() => {
          setIsManagerDashboardOpen(false);
          setIsInventoryModalOpen(true);
        }}
      />

      {/* Liquid Glass Design System Guide Modal (Based on 3 Tiers Architecture) */}
      <LiquidGlassGuideModal
        isOpen={isLiquidGlassGuideOpen}
        onClose={() => setIsLiquidGlassGuideOpen(false)}
      />

      {/* Store Information & Billing Setup Modal */}
      <StoreInfoModal
        isOpen={isStoreInfoModalOpen}
        onClose={() => setIsStoreInfoModalOpen(false)}
        storeInfo={storeInfo}
        onSaveStoreInfo={handleSaveStoreInfo}
      />
    </div>
  );
}
