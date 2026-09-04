import { CategoryName } from '@/types';

export interface CategoryMarginGuide {
  category: CategoryName | string;
  defaultMarginPct: number;
  minSuggestedPct: number;
  maxSuggestedPct: number;
  tag: string;
  reasoning: string;
  typicalProducts: string;
}

export const CATEGORY_MARGIN_GUIDES: Record<string, CategoryMarginGuide> = {
  'Abarrotes': {
    category: 'Abarrotes',
    defaultMarginPct: 15,
    minSuggestedPct: 12,
    maxSuggestedPct: 18,
    tag: 'Rotación Alta / Canasta Familiar',
    reasoning: 'Son productos de primera necesidad. El cliente conoce los precios de memoria (arroz, aceite, azúcar, granos). Un margen bajo (12-18%) asegura que te sigan comprando el mercado completo.',
    typicalProducts: 'Arroz, Azúcar, Aceite, Frijol, Sal, Pastas',
  },
  'Lácteos': {
    category: 'Lácteos',
    defaultMarginPct: 20,
    minSuggestedPct: 15,
    maxSuggestedPct: 22,
    tag: 'Rotación Diaria',
    reasoning: 'Tienen fecha de vencimiento corta y requieren refrigeración. El margen ideal es 18-22% para no arriesgar mermas por vencimiento.',
    typicalProducts: 'Leche en bolsa, Queso cuajada, Mantequilla, Yogur',
  },
  'Bebidas': {
    category: 'Bebidas',
    defaultMarginPct: 25,
    minSuggestedPct: 20,
    maxSuggestedPct: 30,
    tag: 'Consumo Inmediato / Nevera',
    reasoning: 'El cliente paga el valor del frío y la inmediatez de calmar la sed. Si tienes la nevera helada, puedes ganar un 25% a 30%.',
    typicalProducts: 'Gaseosas, Jugos, Agua, Maltas, Cervezas',
  },
  'Carnes': {
    category: 'Carnes',
    defaultMarginPct: 22,
    minSuggestedPct: 18,
    maxSuggestedPct: 28,
    tag: 'Perecedero / Refrigerado',
    reasoning: 'Requiere congelador y cuidado de merma de peso. Margen recomendado de 20-25%.',
    typicalProducts: 'Pollo, Salchichón, Jamón, Carne molida',
  },
  'Panadería': {
    category: 'Panadería',
    defaultMarginPct: 25,
    minSuggestedPct: 20,
    maxSuggestedPct: 32,
    tag: 'Desayuno & Algo',
    reasoning: 'Productos de consumo diario. Margen del 20-30% para tostadas, calados y pan fresco.',
    typicalProducts: 'Pan tajado, Tostadas, Galletas de sal, Arepas',
  },
  'Frutas y verduras': {
    category: 'Frutas y verduras',
    defaultMarginPct: 28,
    minSuggestedPct: 22,
    maxSuggestedPct: 35,
    tag: 'Merma Natural',
    reasoning: 'Debes cobrar un margen mayor (25-35%) para cubrir el tomate o plátano que madura demasiado y no se logra vender.',
    typicalProducts: 'Plátano, Papa, Cebolla, Tomate, Limón',
  },
  'Licores': {
    category: 'Licores',
    defaultMarginPct: 28,
    minSuggestedPct: 22,
    maxSuggestedPct: 35,
    tag: 'Ocasión & Celebración',
    reasoning: 'Menor sensibilidad al precio que los abarrotes. Margen saludable de 25-35%.',
    typicalProducts: 'Aguardiente, Ron, Vinos, Aperitivos',
  },
  'Mecato': {
    category: 'Mecato',
    defaultMarginPct: 35,
    minSuggestedPct: 30,
    maxSuggestedPct: 45,
    tag: 'Compra por Impulso (Alta Ganancia)',
    reasoning: 'Papas, galletas, chicles y dulces. El cliente no compara tanto el precio. Es la categoría más rentable de la tienda (30-45%).',
    typicalProducts: 'Papas fritas, Platanitos, Chocolatinas, Bombones, Chicles',
  },
  'Aseo': {
    category: 'Aseo',
    defaultMarginPct: 30,
    minSuggestedPct: 25,
    maxSuggestedPct: 38,
    tag: 'Hogar & Cuidado Personal',
    reasoning: 'No se vencen rápido. Puedes mantener un margen cómodo del 25-35%.',
    typicalProducts: 'Jabón rey, Clorox, Crema dental, Papel higiénico, Champú',
  },
  'Otros': {
    category: 'Otros',
    defaultMarginPct: 30,
    minSuggestedPct: 20,
    maxSuggestedPct: 40,
    tag: 'Miscelánea',
    reasoning: 'Artículos de conveniencia rápida y papelería. Margen estándar 30%.',
    typicalProducts: 'Pilas, Velas, Fósforos, Cuadernos, Pegante',
  },
};

export const COMMON_MARGIN_PRESETS = [
  { pct: 15, label: '15%', tag: 'Abarrotes', desc: 'Canasta básica (Arroz, Aceite)' },
  { pct: 20, label: '20%', tag: 'Lácteos', desc: 'Leche, Huevos, Pan' },
  { pct: 25, label: '25%', tag: 'Bebidas', desc: 'Gaseosas y Cervezas frías' },
  { pct: 30, label: '30%', tag: 'Aseo', desc: 'Jabones, Limpieza' },
  { pct: 35, label: '35%', tag: 'Mecato', desc: 'Snacks, Chocolatinas, Dulces' },
  { pct: 40, label: '40%', tag: 'Impulso', desc: 'Golosinas sueltas, Miscelánea' },
];

/**
 * Calculates recommended sale price from cost using commercial retail margin formula:
 * Price = Cost / (1 - (MarginPct / 100))
 * Rounded to nearest roundTo step in COP (e.g. 50 or 100)
 */
export function calculateSalePriceFromCost(cost: number, marginPct: number, roundTo = 50): number {
  if (cost <= 0) return 0;
  const safeMargin = Math.min(95, Math.max(1, marginPct));
  const rawPrice = cost / (1 - safeMargin / 100);
  // Round to nearest 50 COP (standard Colombian retail change)
  const rounded = Math.round(rawPrice / roundTo) * roundTo;
  return Math.max(cost + 50, rounded);
}

/**
 * Calculates maximum cost from sale price to maintain a target margin:
 * MaxCost = Price * (1 - (MarginPct / 100))
 */
export function calculateCostFromSalePrice(price: number, marginPct: number, roundTo = 50): number {
  if (price <= 0) return 0;
  const safeMargin = Math.min(95, Math.max(1, marginPct));
  const rawCost = price * (1 - safeMargin / 100);
  return Math.max(0, Math.round(rawCost / roundTo) * roundTo);
}

export interface MarginEvaluation {
  profitAmount: number; // in COP
  marginPct: number; // Margin on sale price (%)
  markupPct: number; // Markup on cost price (%)
  status: 'loss' | 'danger' | 'tight' | 'healthy' | 'generous';
  statusLabel: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  advice: string;
}

/**
 * Evaluates the profit margin and generates a pedagogical diagnosis for the shopkeeper
 */
export function evaluateMargin(price: number, cost: number, category?: string): MarginEvaluation {
  const safePrice = Math.max(0, price);
  const safeCost = Math.max(0, cost);

  if (safePrice === 0 && safeCost === 0) {
    return {
      profitAmount: 0,
      marginPct: 0,
      markupPct: 0,
      status: 'tight',
      statusLabel: 'Sin Precio',
      badgeBg: 'bg-slate-100',
      badgeText: 'text-slate-600',
      borderColor: 'border-slate-300',
      advice: 'Ingresa el costo del proveedor o el precio de venta para calcular tu ganancia.',
    };
  }

  const profitAmount = safePrice - safeCost;
  const marginPct = safePrice > 0 ? Math.round((profitAmount / safePrice) * 100) : 0;
  const markupPct = safeCost > 0 ? Math.round((profitAmount / safeCost) * 100) : 0;

  // Category specific guidance if available
  const catGuide = category ? CATEGORY_MARGIN_GUIDES[category] : undefined;

  if (profitAmount <= 0) {
    return {
      profitAmount,
      marginPct,
      markupPct,
      status: 'loss',
      statusLabel: 'Pérdida Crítica',
      badgeBg: 'bg-rose-100',
      badgeText: 'text-rose-800',
      borderColor: 'border-rose-300',
      advice: `¡Atención! El precio de venta ($${safePrice.toLocaleString('es-CO')}) es igual o menor a lo que te cuesta ($${safeCost.toLocaleString('es-CO')}). Estás perdiendo dinero en cada venta.`,
    };
  }

  if (marginPct < 10) {
    return {
      profitAmount,
      marginPct,
      markupPct,
      status: 'danger',
      statusLabel: 'Margen Muy Bajo',
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-800',
      borderColor: 'border-amber-300',
      advice: `Ganancia de solo $${profitAmount.toLocaleString('es-CO')} por unidad (${marginPct}%). Es muy arriesgado a menos que sea un producto anzuelo de altísima rotación.`,
    };
  }

  if (marginPct < (catGuide?.minSuggestedPct ?? 18)) {
    return {
      profitAmount,
      marginPct,
      markupPct,
      status: 'tight',
      statusLabel: 'Margen Ajustado',
      badgeBg: 'bg-yellow-100',
      badgeText: 'text-yellow-800',
      borderColor: 'border-yellow-300',
      advice: `Ganas $${profitAmount.toLocaleString('es-CO')} por unidad (${marginPct}%). Típico de abarrotes de canasta básica. Cuida que el proveedor no te suba el costo.`,
    };
  }

  if (marginPct <= 35) {
    return {
      profitAmount,
      marginPct,
      markupPct,
      status: 'healthy',
      statusLabel: 'Margen Saludable',
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-800',
      borderColor: 'border-emerald-300',
      advice: `¡Excelente balance! Ganas $${profitAmount.toLocaleString('es-CO')} limpios por unidad (${marginPct}%). Es competitivo para el cliente y rentable para la tienda.`,
    };
  }

  return {
    profitAmount,
    marginPct,
    markupPct,
    status: 'generous',
    statusLabel: 'Alta Rentabilidad',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-800',
    borderColor: 'border-indigo-300',
    advice: `¡Muy rentable! Ganas $${profitAmount.toLocaleString('es-CO')} por unidad (${marginPct}%). Ideal para mecato, snacks y golosinas por impulso.`,
  };
}
