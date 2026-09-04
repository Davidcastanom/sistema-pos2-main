import {
  FullBackupData,
  ProductItem,
  CategoryName,
  Customer,
  Supplier,
  SupplierOrder,
  FixedMonthlyCosts,
  SaleTransaction,
  CashShift,
  StoreInfo
} from '@/types';

export interface StorageBreakdownItem {
  key: string;
  label: string;
  bytes: number;
  count: number;
  isVital: boolean;
}

export interface StorageUsageReport {
  totalUsedBytes: number;
  maxEstimatedBytes: number;
  usagePercent: number;
  items: StorageBreakdownItem[];
  hasHighSalesCount: boolean;
  totalSalesCount: number;
}

/**
 * Calculates current localStorage usage and per-category breakdown
 */
export function getStorageUsageReport(salesCount: number): StorageUsageReport {
  const MAX_ESTIMATED_BYTES = 5 * 1024 * 1024; // 5 MB typical browser quota
  let totalUsedBytes = 0;
  const items: StorageBreakdownItem[] = [];

  const keyMapping: { key: string; label: string; isVital: boolean }[] = [
    { key: 'pos_products_v2', label: 'Inventario & Precios', isVital: true },
    { key: 'pos_customers_v1', label: 'Clientes & Fiados', isVital: true },
    { key: 'pos_suppliers_v1', label: 'Proveedores', isVital: true },
    { key: 'pos_store_info_v1', label: 'Datos & Logo del Negocio', isVital: true },
    { key: 'pos_categories_v2', label: 'Categorías', isVital: true },
    { key: 'pos_fixed_costs_v1', label: 'Gastos Fijos', isVital: true },
    { key: 'pos_supplier_orders_v1', label: 'Pedidos a Proveedores', isVital: false },
    { key: 'pos_sales_v2', label: 'Historial de Facturas (Ventas)', isVital: false },
    { key: 'pos_shift_history_v1', label: 'Historial de Arqueos de Caja', isVital: false },
    { key: 'pos_cart_v1', label: 'Carrito Actual', isVital: false },
  ];

  keyMapping.forEach(({ key, label, isVital }) => {
    try {
      const val = localStorage.getItem(key);
      if (val) {
        // UTF-16 in JS string = length * 2 bytes approx
        const bytes = val.length * 2;
        totalUsedBytes += bytes;

        let count = 0;
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) {
            count = parsed.length;
          } else if (parsed && typeof parsed === 'object') {
            count = Object.keys(parsed).length;
          }
        } catch {
          count = 1;
        }

        items.push({ key, label, bytes, count, isVital });
      }
    } catch {
      // Ignore reading errors
    }
  });

  const usagePercent = Math.min(100, Math.round((totalUsedBytes / MAX_ESTIMATED_BYTES) * 100));

  return {
    totalUsedBytes,
    maxEstimatedBytes: MAX_ESTIMATED_BYTES,
    usagePercent,
    items,
    hasHighSalesCount: salesCount >= 300 || usagePercent >= 60,
    totalSalesCount: salesCount,
  };
}

/**
 * Generates a full master backup object
 */
export function buildMasterBackup(data: {
  storeInfo: StoreInfo;
  products: ProductItem[];
  categories: CategoryName[];
  customers: Customer[];
  suppliers: Supplier[];
  supplierOrders: SupplierOrder[];
  fixedCosts: FixedMonthlyCosts;
  salesHistory: SaleTransaction[];
  shiftHistory: CashShift[];
  currentShift: CashShift | null;
  quickSearchChips?: string[];
  favoriteProductIds?: string[];
}): FullBackupData {
  return {
    version: '2.0',
    exportDate: new Date().toISOString(),
    app: 'DonEsteban_POS_Barrio',
    storeInfo: data.storeInfo,
    products: data.products,
    categories: data.categories,
    customers: data.customers,
    suppliers: data.suppliers,
    supplierOrders: data.supplierOrders,
    fixedCosts: data.fixedCosts,
    salesHistory: data.salesHistory,
    shiftHistory: data.shiftHistory,
    currentShift: data.currentShift,
    quickSearchChips: data.quickSearchChips,
    favoriteProductIds: data.favoriteProductIds,
  };
}

/**
 * Triggers instant browser download of a JSON file
 */
export function downloadJsonFile(filename: string, data: unknown): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validates whether an uploaded object is a valid backup file
 */
export function validateBackupData(data: any): { isValid: boolean; error?: string; summary?: any } {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'El archivo no contiene un formato JSON válido.' };
  }

  if (!Array.isArray(data.products)) {
    return { isValid: false, error: 'El archivo no contiene un catálogo de productos válido.' };
  }

  const summary = {
    productsCount: data.products?.length || 0,
    customersCount: Array.isArray(data.customers) ? data.customers.length : 0,
    suppliersCount: Array.isArray(data.suppliers) ? data.suppliers.length : 0,
    salesCount: Array.isArray(data.salesHistory) ? data.salesHistory.length : 0,
    storeName: data.storeInfo?.name || 'Tienda',
    exportDate: data.exportDate || 'Desconocida',
  };

  return { isValid: true, summary };
}

/**
 * Filters sales history keeping only what the user decides, and returning pruned items for safety download
 */
export function filterSalesForPruning(
  allSales: SaleTransaction[],
  criteria: {
    mode: 'keepLast' | 'olderThanDays';
    keepCount?: number;
    days?: number;
  }
): { keptSales: SaleTransaction[]; prunedSales: SaleTransaction[] } {
  if (allSales.length === 0) {
    return { keptSales: [], prunedSales: [] };
  }

  // Sort descending by date (most recent first)
  const sorted = [...allSales].sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeB - timeA;
  });

  if (criteria.mode === 'keepLast') {
    const count = criteria.keepCount ?? 100;
    const keptSales = sorted.slice(0, count);
    const prunedSales = sorted.slice(count);
    return { keptSales, prunedSales };
  }

  if (criteria.mode === 'olderThanDays') {
    const days = criteria.days ?? 60;
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
    const keptSales: SaleTransaction[] = [];
    const prunedSales: SaleTransaction[] = [];

    sorted.forEach((sale) => {
      const saleTime = new Date(sale.timestamp).getTime();
      if (saleTime >= cutoffTime) {
        keptSales.push(sale);
      } else {
        prunedSales.push(sale);
      }
    });

    return { keptSales, prunedSales };
  }

  return { keptSales: allSales, prunedSales: [] };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
