import { ProductItem, FixedMonthlyCosts, BreakEvenAnalysis, SaleTransaction, CashShift } from '@/types';
import { formatCOP } from '@/lib/utils';

export const DEFAULT_FIXED_COSTS: FixedMonthlyCosts = {
  rent: 350000,      // Arriendo del local
  utilities: 120000, // Servicios públicos (Luz, Agua, Gas)
  payroll: 200000,   // Ayudante / Empleado / Jornal
  services: 50000,   // Internet, teléfono, datáfono
  other: 80000,      // Imprevistos y otros gastos fijos
  customNotes: 'Gastos base estimados de la tienda',
};

/**
 * Sums all monthly fixed costs
 */
export function calculateTotalFixedCosts(costs: FixedMonthlyCosts): number {
  const rent = Math.max(0, Number(costs.rent) || 0);
  const utilities = Math.max(0, Number(costs.utilities) || 0);
  const payroll = Math.max(0, Number(costs.payroll) || 0);
  const services = Math.max(0, Number(costs.services) || 0);
  const other = Math.max(0, Number(costs.other) || 0);
  return Math.round(rent + utilities + payroll + services + other);
}

/**
 * Calculates the store's average profit margin percentage based on catalog products
 * Formula: Sum(Price - Cost) / Sum(Price) * 100
 * Falls back to 25% if no costs are entered.
 */
export function calculateAverageMargin(products: ProductItem[]): number {
  if (!products || products.length === 0) return 25;

  let totalSalesValue = 0;
  let totalCostValue = 0;

  products.forEach((p) => {
    if (p.price > 0) {
      totalSalesValue += p.price;
      // If no cost price is registered, estimate a typical grocery cost of 75%
      const cost = typeof p.costPrice === 'number' && p.costPrice > 0 ? p.costPrice : p.price * 0.75;
      totalCostValue += cost;
    }
  });

  if (totalSalesValue === 0) return 25;

  const margin = ((totalSalesValue - totalCostValue) / totalSalesValue) * 100;
  // Clamp between 5% and 80% and round to whole integer to keep it clean for tenderos
  return Math.round(Math.min(80, Math.max(5, margin)));
}

/**
 * Calculates Break-Even Point (Punto de Equilibrio) and provides friendly human feedback
 */
export function calculateBreakEven(
  fixedCosts: FixedMonthlyCosts,
  products: ProductItem[],
  currentMonthSales: number
): BreakEvenAnalysis {
  const totalFixedCosts = calculateTotalFixedCosts(fixedCosts);
  const averageMarginPercentage = calculateAverageMargin(products);
  const marginDecimal = averageMarginPercentage / 100;

  // Break-Even Monthly Sales = Fixed Costs / Average Margin
  const breakEvenMonthlySales = marginDecimal > 0 ? Math.round(totalFixedCosts / marginDecimal) : totalFixedCosts * 4;
  
  // Daily target (assuming 30 operating days per month)
  const breakEvenDailySales = Math.round(breakEvenMonthlySales / 30);

  // Clean progress percentage
  const rawProgress = breakEvenMonthlySales > 0 ? (currentMonthSales / breakEvenMonthlySales) * 100 : 0;
  // Round to 1 decimal if < 10%, otherwise whole integer
  const progressPercentage = rawProgress < 10 ? Math.round(rawProgress * 10) / 10 : Math.round(rawProgress);

  const isBreakEvenReached = currentMonthSales >= breakEvenMonthlySales && breakEvenMonthlySales > 0;

  // Friendly human and motivational message for traditional store owners
  let motivationalMessage = '';
  if (totalFixedCosts === 0) {
    motivationalMessage = '¡Aún no has configurado tus gastos fijos! Ingresa tus costos para ver tu meta del mes.';
  } else if (progressPercentage === 0) {
    motivationalMessage = `Tu meta este mes es vender ${formatCOP(breakEvenMonthlySales)} para cubrir tus gastos fijos (${formatCOP(totalFixedCosts)}). ¡Con las primeras ventas arrancamos con toda!`;
  } else if (progressPercentage < 25) {
    motivationalMessage = `Llevas vendido el ${progressPercentage}% de lo que necesitas este mes para pagar los gastos fijos (${formatCOP(totalFixedCosts)}). ¡Ánimo, cada venta suma al bolsillo!`;
  } else if (progressPercentage < 50) {
    motivationalMessage = `¡Buen ritmo! Llevas el ${progressPercentage}% de la meta para cubrir los gastos fijos del mes. ¡Vamos camino a la mitad!`;
  } else if (progressPercentage < 80) {
    motivationalMessage = `¡Excelente trabajo! Ya superaste la mitad y vas en el ${progressPercentage}% de tus costos mensuales. La tienda va por buen camino.`;
  } else if (progressPercentage < 100) {
    motivationalMessage = `¡A un paso de coronar el mes! Estás al ${progressPercentage}% de cubrir todos los gastos fijos (${formatCOP(totalFixedCosts)}). ¡La recta final!`;
  } else {
    motivationalMessage = `🎉 ¡Felicitaciones! Has superado el 100% de tu punto de equilibrio. Ya cubriste los ${formatCOP(totalFixedCosts)} de gastos fijos. ¡A partir de aquí, las ventas son ganancia libre para tu bolsillo!`;
  }

  // Average price of a product for estimated units
  const avgPrice = products.length > 0 ? products.reduce((s, p) => s + p.price, 0) / products.length : 5000;
  const estimatedUnitsNeeded = Math.round(breakEvenMonthlySales / Math.max(1000, avgPrice));

  return {
    totalFixedCosts,
    averageMarginPercentage,
    breakEvenMonthlySales,
    breakEvenDailySales,
    currentMonthSales: Math.round(currentMonthSales),
    progressPercentage,
    motivationalMessage,
    isBreakEvenReached,
    estimatedUnitsNeeded,
  };
}

/**
 * Computes Cash In Drawer ("Efectivo en Caja / Cambio de Bolsillo")
 * Separates total sales from physical cash available
 */
export function calculateCashInDrawer(currentShift: CashShift | null, salesToday: SaleTransaction[]): {
  baseCash: number;
  cashSalesToday: number;
  cashInflows: number;
  cashOutflows: number;
  estimatedCashInHand: number;
} {
  const baseCash = currentShift?.initialCash || currentShift?.initialBase || 0;
  
  // Calculate today's sales paid purely in cash
  const calculatedSalesCash = salesToday && salesToday.length > 0
    ? salesToday
        .filter((s) => s.paymentMethod === 'Efectivo')
        .reduce((sum, s) => sum + s.total, 0)
    : (currentShift?.cashSales || 0);

  const cashSalesToday = calculatedSalesCash;
  const cashInflows = currentShift?.inflows || 0;
  const cashOutflows = currentShift?.outflows || 0;

  const estimatedCashInHand = Math.max(0, baseCash + cashSalesToday + cashInflows - cashOutflows);

  return {
    baseCash,
    cashSalesToday,
    cashInflows,
    cashOutflows,
    estimatedCashInHand,
  };
}

/**
 * Computes the Store's Champions (Top Rotated Products)
 */
export function calculateTopSellingChampions(
  transactions: SaleTransaction[],
  limit: number = 5
): Array<{
  id: string | number;
  title: string;
  category: string;
  quantitySold: number;
  totalRevenue: number;
  rank: number;
}> {
  const map: { [id: string]: { title: string; category: string; quantitySold: number; totalRevenue: number } } = {};

  transactions.forEach((tx) => {
    tx.items.forEach((item) => {
      const pid = String(item.product.id);
      if (!map[pid]) {
        map[pid] = {
          title: item.product.title,
          category: item.product.category || 'General',
          quantitySold: 0,
          totalRevenue: 0,
        };
      }
      map[pid].quantitySold += item.quantity;
      map[pid].totalRevenue += Math.round(item.product.price * item.quantity);
    });
  });

  return Object.entries(map)
    .map(([id, data]) => ({
      id,
      ...data,
      rank: 0,
    }))
    .sort((a, b) => b.quantitySold - a.quantitySold || b.totalRevenue - a.totalRevenue)
    .slice(0, limit)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
}

/**
 * Computes Traffic Light Stock Status (Semáforo de Inventario)
 * Red = Out of stock or <= 1
 * Yellow = Low stock (<= minStock or <= 5)
 * Green = Healthy stock
 */
export interface InventoryTrafficLightStatus {
  status: 'green' | 'yellow' | 'red';
  title: string;
  description: string;
  criticalCount: number;
  lowCount: number;
  healthyCount: number;
  criticalProducts: ProductItem[];
  lowStockProducts: ProductItem[];
}

export function calculateInventoryTrafficLight(products: ProductItem[]): InventoryTrafficLightStatus {
  const criticalProducts: ProductItem[] = [];
  const lowStockProducts: ProductItem[] = [];
  let healthyCount = 0;

  products.forEach((p) => {
    const minThreshold = p.minStock !== undefined ? p.minStock : 5;
    if (p.stock <= 1) {
      criticalProducts.push(p);
    } else if (p.stock <= minThreshold) {
      lowStockProducts.push(p);
    } else {
      healthyCount += 1;
    }
  });

  const criticalCount = criticalProducts.length;
  const lowCount = lowStockProducts.length;

  if (criticalCount > 0) {
    return {
      status: 'red',
      title: '¡Alerta Roja: Hay productos agotados o críticos!',
      description: `Tienes ${criticalCount} producto${criticalCount > 1 ? 's' : ''} agotado${criticalCount > 1 ? 's' : ''} o con 1 sola unidad. Necesitan reposición hoy para no perder ventas.`,
      criticalCount,
      lowCount,
      healthyCount,
      criticalProducts,
      lowStockProducts,
    };
  }

  if (lowCount > 0) {
    return {
      status: 'yellow',
      title: 'Semáforo Amarillo: Productos por agotarse',
      description: `Tienes ${lowCount} producto${lowCount > 1 ? 's' : ''} con pocas unidades. Revisa tu lista antes de que se agoten.`,
      criticalCount,
      lowCount,
      healthyCount,
      criticalProducts,
      lowStockProducts,
    };
  }

  return {
    status: 'green',
    title: 'Semáforo Verde: Inventario Estable',
    description: 'Todo el inventario está en niveles saludables. No tienes productos críticos en este momento.',
    criticalCount: 0,
    lowCount: 0,
    healthyCount,
    criticalProducts: [],
    lowStockProducts: [],
  };
}
