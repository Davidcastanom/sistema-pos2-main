import React, { useState, useEffect, useMemo } from 'react';
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
  DebtPayment
} from './types';
import { INITIAL_PRODUCTS, INITIAL_CUSTOMERS, CATEGORIES } from './data/initialData';
import { POSHeader } from './components/POSHeader';
import { QuickFavoritesBar } from './components/QuickFavoritesBar';
import { CategoryNav } from './components/CategoryNav';
import { ProductGrid } from './components/ProductGrid';
import { POSCartDrawer } from './components/POSCartDrawer';
import { PaymentModal } from './components/PaymentModal';
import { ReceiptModal } from './components/ReceiptModal';
import { SalesHistoryModal } from './components/SalesHistoryModal';
import { AddProductModal } from './components/AddProductModal';
import { ManageCategoriesModal } from './components/ManageCategoriesModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { QuickAmountModal } from './components/QuickAmountModal';
import { ManageQuickFavoritesModal } from './components/ManageQuickFavoritesModal';
import { ManageQuickSearchModal } from './components/ManageQuickSearchModal';
import { CustomerModal } from './components/CustomerModal';
import { CashShiftModal } from './components/CashShiftModal';
import { InventoryManagerModal } from './components/InventoryManagerModal';
import { ReportsModal } from './components/ReportsModal';
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
        return JSON.parse(saved);
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
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState<boolean>(false);
  const [isCashShiftModalOpen, setIsCashShiftModalOpen] = useState<boolean>(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState<boolean>(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState<boolean>(false);

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

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
        showToast(prod ? `⭐ "${prod.title}" agregado a botones rápidos` : '⭐ Botón rápido agregado', 'success');
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
    showToast(`🔍 "${trimmed}" agregado a la búsqueda rápida`, 'success');
  };

  const handleRemoveSearchChip = (chipText: string) => {
    setQuickSearchChips((prev) => prev.filter((c) => c !== chipText));
    showToast(`"${chipText}" eliminado de la búsqueda rápida`, 'info');
  };

  const handleResetDefaultSearchChips = () => {
    setQuickSearchChips(DEFAULT_QUICK_SEARCH_CHIPS);
    showToast('Búsqueda rápida restablecida por defecto', 'success');
  };

  // Keyboard shortcuts for high-speed POS operation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        const searchEl = document.getElementById('pos-search-input');
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

  // Barcode scanner actions
  const handleBarcodeScan = (scannedCode: string) => {
    const cleanCode = scannedCode.trim();
    if (!cleanCode) return;

    const found = products.find(
      (p) => p.barcode === cleanCode || p.barcode.endsWith(cleanCode) || cleanCode.endsWith(p.barcode)
    );

    if (found) {
      handleAddToCart(found);
      playBeep();
      showToast(`✅ Código ${cleanCode}: "${found.title}" agregado a la cuenta`, 'success');
    } else {
      showToast(`⚠️ Código "${cleanCode}" no encontrado. Puedes registrarlo como nuevo producto.`, 'warning');
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
      handleBarcodeScan(barcode);
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

  const handleProceedToPayment = () => {
    if (cart.length === 0) return;
    setIsPaymentModalOpen(true);
  };

  const handleCompleteSale = (
    method: PaymentMethodType,
    amountReceived?: number,
    change?: number
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

  const handleBulkUpdateStock = (updates: { id: string | number; newStock: number }[]) => {
    setProducts((prev) =>
      prev.map((p) => {
        const up = updates.find((u) => u.id === p.id);
        return up ? { ...p, stock: up.newStock } : p;
      })
    );
    showToast(`Inventario actualizado para ${updates.length} productos`, 'success');
  };

  const handleAddQuickAmountProduct = (quickProduct: ProductItem) => {
    handleAddToCart(quickProduct);
    showToast(`"${quickProduct.title}" agregado a la cuenta por ${formatCOP(quickProduct.price)}`);
  };

  const totalSalesToday = salesHistory.reduce((sum, tx) => sum + tx.total, 0);

  return (
    <div className="min-h-screen bg-[#F6E1C6] text-[#222E3A] flex flex-col font-['Plus_Jakarta_Sans',sans-serif] relative selection:bg-[#BC6343] selection:text-white overflow-x-hidden">
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
          onOpenReports={() => setIsReportsModalOpen(true)}
          showCategoryGallery={showCategoryGallery}
          onToggleCategoryGallery={() => setShowCategoryGallery(!showCategoryGallery)}
          quickSearchChips={quickSearchChips}
          onAddSearchChip={handleAddSearchChip}
          onRemoveSearchChip={handleRemoveSearchChip}
          onOpenManageQuickSearch={() => setIsManageQuickSearchOpen(true)}
          onOpenScannerModal={handleOpenScannerForSale}
          products={products}
          favoriteIds={favoriteProductIds}
          onAddToCart={handleAddToCart}
          onToggleFavorite={handleToggleFavoriteProduct}
        />
      </div>

      {/* Main POS Workspace */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 lg:p-5 flex flex-col lg:flex-row gap-4 items-start">
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

        {/* Right Side: Sticky POS Cart Drawer with Customer Selection */}
        <div className="w-full lg:w-auto lg:sticky lg:top-20">
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
      />

      {/* Cash Shift & Drawer Management Modal */}
      <CashShiftModal
        isOpen={isCashShiftModalOpen}
        onClose={() => setIsCashShiftModalOpen(false)}
        currentShift={currentShift}
        shiftHistory={shiftHistory}
        onOpenShift={handleOpenShift}
        onCloseShift={handleCloseShift}
        onAddCashMovement={handleAddCashMovement}
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
    </div>
  );
}
