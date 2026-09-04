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

export interface ProductSupplierQuote {
  id: string;
  productId: string | number;
  supplierId: string;
  supplierName: string;
  costPrice: number; // Precio al que deja el producto este proveedor (en COP)
  supplierProductCode?: string; // Código / SKU interno del proveedor
  minOrderQuantity?: number; // Cantidad mínima de compra por pedido
  packagePresentation?: string; // Presentación (e.g. "Bulto x 24 un", "Paca x 12", "Caja")
  leadTimeDays?: number; // Días que tarda en entregar (e.g. 1 día, 2 días)
  isPreferred?: boolean; // Si es el proveedor seleccionado actualmente
  inStock?: boolean; // Si el proveedor tiene disponibilidad inmediata o desabastecimiento
  lastQuotedDate?: Date | string;
  notes?: string;
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
  primarySupplierId?: string;
  primarySupplierName?: string;
  supplierQuotes?: ProductSupplierQuote[];
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

export interface FixedMonthlyCosts {
  rent: number; // Arriendo del local
  utilities: number; // Luz, Agua, Gas
  payroll: number; // Empleado, ayudante o jornal
  services: number; // Internet, teléfono, datáfono, seguridad
  other: number; // Otros gastos fijos del mes
  customNotes?: string;
  updatedAt?: Date | string;
}

export interface BreakEvenAnalysis {
  totalFixedCosts: number;
  averageMarginPercentage: number;
  breakEvenMonthlySales: number;
  breakEvenDailySales: number;
  currentMonthSales: number;
  progressPercentage: number;
  motivationalMessage: string;
  isBreakEvenReached: boolean;
  estimatedUnitsNeeded?: number;
}

export interface Supplier {
  id: string;
  name: string;
  nit?: string;
  contactPerson?: string;
  phone: string; // WhatsApp / Celular
  email?: string;
  address?: string;
  visitDays?: string[]; // e.g. ['Lunes', 'Jueves']
  deliveryDays?: number; // Lead time in days
  paymentTerms?: string; // 'Contado / Efectivo', 'Crédito 8 días', 'Crédito 15 días', 'Crédito 30 días'
  minOrderAmount?: number; // Pedido mínimo en COP
  rating?: number; // 1 to 5
  notes?: string;
  categoriesSupplied?: string[];
  createdAt?: Date | string;
}

export interface SupplierOrderItem {
  productId: string | number;
  productTitle: string;
  unit: string;
  currentStock: number;
  minStock: number;
  suggestedQuantity: number;
  orderQuantity: number;
  unitCost: number;
  totalCost: number;
  supplierProductCode?: string;
}

export interface SupplierOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierPhone?: string;
  supplierNit?: string;
  createdAt: Date | string;
  status: 'Borrador' | 'Solicitado' | 'Recibido' | 'Cancelado';
  items: SupplierOrderItem[];
  totalEstimatedCost: number;
  notes?: string;
  sentVia?: 'WhatsApp' | 'PDF / Imprimir' | 'Manual';
  receivedAt?: Date | string;
  receivedBy?: string;
  paidWithCashMovement?: boolean;
}

export interface StoreInfo {
  name: string; // e.g. "Tienda Mixta La Esquinita"
  shortName: string; // e.g. "La Esquinita"
  nit: string; // e.g. "900.842.193-4"
  regimen: string; // e.g. "Régimen Simple", "No Responsable de IVA", "Responsable de IVA"
  address: string; // e.g. "Cra 45 # 23-18 Barrio Central"
  city: string; // e.g. "Medellín, Antioquia"
  phone: string; // e.g. "310 456 7890"
  landline?: string; // e.g. "(604) 444 8920"
  email?: string; // e.g. "laesquinita.pos@gmail.com"
  invoiceFooterMessage: string; // e.g. "¡Gracias por su compra! Vuelva pronto."
  resolutionInfo?: string; // e.g. "Factura POS por Sistema Computarizado"
  defaultCashierName?: string; // e.g. "Don Esteban"
  logoUrl?: string;
}

