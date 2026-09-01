export type CategoryName =
  | 'Abarrotes'
  | 'Lácteos'
  | 'Aseo'
  | 'Bebidas'
  | 'Carnes'
  | 'Panadería'
  | 'Frutas y verduras'
  | 'Licores'
  | 'Mecato'
  | 'Otros'
  | (string & {});

export interface CategoryInfo {
  id: string;
  name: CategoryName;
  subtitle: string;
  imageUrl: string;
  iconName: string;
  color: string;
  bgPastel: string;
  textPastel: string;
  borderPastel: string;
}

export interface ProductItem {
  id: string | number;
  barcode: string;
  title: string;
  category: CategoryName;
  description: string;
  price: number; // in COP (sale price)
  costPrice?: number; // in COP (purchase cost price for profit margin calculation)
  stock: number; // units
  minStock?: number; // Minimum stock alert threshold (e.g. 5)
  unit: string; // e.g. 'unidades', 'kg', 'bolsa', 'litro'
  imageUrl: string;
  logoUrl?: string;
  featured?: boolean;
  ivaRate?: number; // VAT percentage: 0, 5, 19
  discount?: number; // Product discount percentage: 0 to 100
}

export interface CartItem {
  product: ProductItem;
  quantity: number;
  discount?: number;
}

export type PaymentMethodType = 'Efectivo' | 'Nequi / Daviplata' | 'Tarjeta Débito/Crédito' | 'Crédito / Fiado';

export interface TaxBreakdownItem {
  rate: number;
  baseAmount: number;
  taxAmount: number;
}

export interface SaleTransaction {
  id: string;
  timestamp: Date;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  taxBreakdown?: TaxBreakdownItem[];
  total: number;
  paymentMethod: PaymentMethodType;
  amountReceived?: number;
  change?: number;
  customerName?: string;
  customerDocument?: string;
  customerPhone?: string;
  cashierName: string;
  customDetails?: string;
  costTotal?: number;
  profit?: number;
}

export interface Customer {
  id: string;
  name: string;
  documentId?: string; // CC / NIT
  phone?: string;
  address?: string;
  creditLimit?: number;
  currentDebt: number;
  totalPurchased?: number;
  lastPurchaseDate?: Date;
  notes?: string;
  createdAt?: Date;
  paymentHistory?: DebtPayment[];
}

export interface DebtPayment {
  id: string;
  timestamp: Date;
  customerId: string;
  customerName?: string;
  amount: number;
  paymentMethod: PaymentMethodType;
  note?: string;
  notes?: string;
  cashierName: string;
}

export type CashMovementType = 'inflow' | 'outflow' | 'base_initial';

export interface CashMovement {
  id: string;
  timestamp: Date;
  type: CashMovementType;
  amount: number;
  reason: string;
  cashierName: string;
  category?: 'Gasto Menor' | 'Pago Proveedor' | 'Ingreso Sencillo' | 'Base de Caja' | 'Apertura de Caja' | 'Abono de Fiado / Cartera' | 'Retiro Propietario' | 'Otro' | string;
}

export interface CashShift {
  id: string;
  openedAt: Date;
  closedAt?: Date;
  initialBase?: number;
  initialCash?: number;
  cashSales?: number;
  electronicSales?: number;
  creditSales?: number;
  inflows?: number;
  outflows?: number;
  movements?: CashMovement[];
  status: 'open' | 'closed';
  cashierName: string;
  finalCashCount?: number;
  finalCashCounted?: number;
  expectedCash?: number;
  difference?: number;
  cashDifference?: number;
  notes?: string;
  observations?: string;
  summary?: {
    cashSales: number;
    electronicSales: number;
    fiadoSales: number;
    inflows: number;
    outflows: number;
    debtPaymentsCollected: number;
    totalTransactions: number;
  };
}

