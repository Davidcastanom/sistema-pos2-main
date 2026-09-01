import React, { useState, useRef } from 'react';
import { ProductItem, CategoryInfo } from '@/types';
import { CATEGORIES } from '@/data/initialData';
import { formatCOP, normalizeImageUrl } from '@/lib/utils';
import { 
  Package, 
  Search, 
  Download, 
  Upload, 
  AlertTriangle, 
  Check, 
  X, 
  TrendingUp, 
  DollarSign, 
  Edit3,
  Layers,
  FileSpreadsheet,
  PlusCircle,
  RefreshCw,
  Trash2,
  Settings
} from 'lucide-react';

interface InventoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductItem[];
  categories?: CategoryInfo[];
  onUpdateProduct?: (product: ProductItem) => void;
  onEditProduct?: (product: ProductItem) => void;
  onDeleteProduct: (id: string | number) => void;
  onBulkImportProducts?: (products: ProductItem[]) => void;
  onBulkUpdateStock?: (updates: { id: string | number; stock: number }[]) => void;
  onOpenAddProduct?: () => void;
  onAddNewProduct?: () => void;
  onOpenManageCategories?: () => void;
}

export const InventoryManagerModal: React.FC<InventoryManagerModalProps> = ({
  isOpen,
  onClose,
  products,
  categories = CATEGORIES,
  onUpdateProduct,
  onEditProduct,
  onDeleteProduct,
  onBulkImportProducts,
  onBulkUpdateStock,
  onOpenAddProduct,
  onAddNewProduct,
  onOpenManageCategories,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCreateNewClick = () => {
    if (onAddNewProduct) {
      onAddNewProduct();
    } else if (onOpenAddProduct) {
      onOpenAddProduct();
    }
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch = 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const isLow = p.stock <= (p.minStock || 10);
    const matchesLowStock = !filterLowStockOnly || isLow;

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  // Calculate Global Inventory Stats
  const totalItemsCount = products.length;
  const totalStockUnits = products.reduce((sum, p) => sum + p.stock, 0);
  
  // Total inventory value at sale price
  const totalInventorySaleValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);
  
  // Total inventory value at estimated cost price (assume 75% if costPrice is undefined)
  const totalInventoryCostValue = products.reduce(
    (sum, p) => sum + (p.costPrice || p.price * 0.75) * p.stock,
    0
  );
  
  const estimatedTotalProfit = Math.max(0, totalInventorySaleValue - totalInventoryCostValue);
  const averageMarginPct = totalInventorySaleValue > 0
    ? Math.round((estimatedTotalProfit / totalInventorySaleValue) * 100)
    : 25;

  const lowStockCount = products.filter((p) => p.stock <= (p.minStock || 10)).length;

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'CodigoBarras', 'Nombre', 'Categoria', 'PrecioVenta', 'PrecioCosto', 'Stock', 'StockMinimo', 'IVA', 'Descuento', 'Unidad', 'ImagenUrl'];
    const rows = products.map((p) => [
      p.id,
      `"${p.barcode}"`,
      `"${p.title.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      p.price,
      p.costPrice || Math.round(p.price * 0.75),
      p.stock,
      p.minStock || 10,
      p.ivaRate || 0,
      p.discount || 0,
      `"${p.unit || 'unidades'}"`,
      `"${p.imageUrl || ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventario_pos_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import from CSV
  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length <= 1) {
          alert('El archivo CSV está vacío o solo contiene encabezados.');
          return;
        }

        const importedProducts: ProductItem[] = [];
        const stockUpdates: { id: string | number; stock: number }[] = [];

        // Parse delimiter (; or ,)
        const firstLine = lines[0];
        const delimiter = firstLine.includes(';') ? ';' : ',';

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          // Simple CSV split matching quotes
          const regex = new RegExp(`(?:^|${delimiter})(?:"([^"]*(?:""[^"]*)*)"|([^"${delimiter}]*))`, 'g');
          const cols: string[] = [];
          let match;
          while ((match = regex.exec(line)) !== null) {
            let val = match[1] !== undefined ? match[1].replace(/""/g, '"') : match[2];
            if (val === undefined) val = '';
            cols.push(val.trim());
          }

          if (cols.length >= 4) {
            const rawId = cols[0];
            const rawBarcode = cols[1];
            const rawTitle = cols[2];
            const rawCategory = cols[3];
            const rawPrice = Number(cols[4]) || 1000;
            const rawCost = Number(cols[5]) || Math.round(rawPrice * 0.75);
            const rawStock = Number(cols[6]) || 0;
            const rawMinStock = Number(cols[7]) || 10;
            const rawIva = Number(cols[8]) || 0;
            const rawDiscount = Number(cols[9]) || 0;
            const rawUnit = cols[10] || 'unidades';
            const rawImage = cols[11] || '';

            const item: ProductItem = {
              id: rawId || `imp-${Date.now()}-${i}`,
              barcode: rawBarcode || `770${Math.floor(1000000 + Math.random() * 9000000)}`,
              title: rawTitle || `Producto Importado ${i}`,
              category: rawCategory || 'Abarrotes',
              price: Math.max(50, rawPrice),
              costPrice: Math.max(0, rawCost),
              stock: Math.max(0, rawStock),
              minStock: Math.max(0, rawMinStock),
              ivaRate: Math.max(0, rawIva),
              discount: Math.max(0, Math.min(100, rawDiscount)),
              unit: rawUnit,
              description: `${rawTitle} x ${rawUnit}`,
              imageUrl: normalizeImageUrl(rawImage) || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80',
            };

            importedProducts.push(item);
            stockUpdates.push({ id: item.id, stock: item.stock });
          }
        }

        if (importedProducts.length > 0) {
          if (onBulkImportProducts) {
            onBulkImportProducts(importedProducts);
          } else if (onBulkUpdateStock) {
            onBulkUpdateStock(stockUpdates);
          }
          alert(`¡Se procesaron ${importedProducts.length} productos correctamente desde el CSV!`);
        } else {
          alert('No se pudieron extraer productos válidos del archivo.');
        }
      } catch (err) {
        console.error('Error procesando CSV:', err);
        alert('Error al leer el archivo CSV. Asegúrate del formato y codificación UTF-8.');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleSaveEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (onUpdateProduct) {
      onUpdateProduct(editingProduct);
    }
    setEditingProduct(null);
  };

  const handleExecuteDelete = (id: string | number) => {
    onDeleteProduct(id);
    setDeleteConfirmId(null);
    if (editingProduct?.id === id) {
      setEditingProduct(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#222E3A]/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#FFF9F0] rounded-none max-w-5xl w-full shadow-2xl border-2 border-[#214C6A] overflow-hidden flex flex-col max-h-[92vh] text-[#222E3A]">
        {/* Header */}
        <div className="p-4 bg-[#214C6A] border-b border-[#214C6A] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-none bg-[#EB9D52] border border-white/20 flex items-center justify-center text-[#222E3A] shadow-xs">
              <Package className="w-5 h-5 text-[#222E3A]" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#EB9D52]">
                Control de Mercancía & Valorización
              </span>
              <h3 className="text-base sm:text-lg font-extrabold font-['Outfit',sans-serif] text-[#FFF9F0]">
                Inventario General, Stock & Catálogo
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-none bg-[#1a3d55] hover:bg-[#0f2433] flex items-center justify-center text-[#F6E1C6] hover:text-white transition-colors cursor-pointer border border-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-[#F6E1C6]/80 border-b border-[#214C6A]/20">
          <div className="bg-white p-2.5 rounded-none border border-[#214C6A]/20 shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-[#63665B] block">Variedad de Ítems</span>
            <div className="text-base sm:text-lg font-black text-[#214C6A]">{totalItemsCount} referencias</div>
            <span className="text-[10px] text-[#56291D] font-semibold">{totalStockUnits} unidades en stock</span>
          </div>

          <div className="bg-white p-2.5 rounded-none border border-[#214C6A]/20 shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-[#63665B] block">Valor en Venta (PVP)</span>
            <div className="text-base sm:text-lg font-black text-[#BC6343]">{formatCOP(totalInventorySaleValue)}</div>
            <span className="text-[10px] text-emerald-700 font-bold">Margen prom: {averageMarginPct}%</span>
          </div>

          <div className="bg-white p-2.5 rounded-none border border-[#214C6A]/20 shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-[#63665B] block">Valor en Costo (Compra)</span>
            <div className="text-base sm:text-lg font-black text-slate-700">{formatCOP(totalInventoryCostValue)}</div>
            <span className="text-[10px] text-[#63665B]">Ganancia est: {formatCOP(estimatedTotalProfit)}</span>
          </div>

          <div className="bg-white p-2.5 rounded-none border border-[#214C6A]/20 shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-rose-700 block">Alertas de Stock Bajo</span>
            <div className="text-base sm:text-lg font-black text-rose-700">{lowStockCount} productos</div>
            <span className="text-[10px] text-rose-800 font-semibold">Requieren reorden urgente</span>
          </div>
        </div>

        {/* Delete Confirmation Alert Banner */}
        {deleteConfirmId !== null && (
          <div className="bg-rose-50 border-b-2 border-rose-600 p-3 flex items-center justify-between gap-2 animate-fadeIn text-xs">
            <div className="flex items-center gap-2 text-rose-900 font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                ¿Estás seguro de eliminar el producto{' '}
                <strong>"{products.find((p) => p.id === deleteConfirmId)?.title}"</strong>?
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1 bg-white text-slate-700 font-bold border border-slate-300 rounded-none cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleExecuteDelete(deleteConfirmId)}
                className="px-3 py-1 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-none cursor-pointer shadow-xs flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Confirmar Eliminación</span>
              </button>
            </div>
          </div>
        )}

        {/* Actions Bar & Filters */}
        <div className="p-3 bg-[#FFF9F0] border-b border-[#214C6A]/15 flex flex-wrap items-center justify-between gap-2">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#214C6A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, código de barras o categoría..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#214C6A]/30 rounded-none text-xs focus:ring-1 focus:ring-[#214C6A] focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-[#214C6A]/30 rounded-none text-xs font-bold text-[#214C6A]"
          >
            <option value="all">Todas las Categorías ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Low Stock Toggle Button */}
          <button
            onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
            className={`px-3 py-1.5 rounded-none text-xs font-bold border transition-all cursor-pointer ${
              filterLowStockOnly
                ? 'bg-rose-700 text-white border-rose-700'
                : 'bg-white text-rose-800 border-rose-300 hover:bg-rose-50'
            }`}
          >
            {filterLowStockOnly ? '✓ Solo Stock Bajo' : '⚠️ Ver Stock Bajo'}
          </button>

          {/* Management Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {onOpenManageCategories && (
              <button
                onClick={onOpenManageCategories}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-[#214C6A] text-xs font-bold rounded-none border border-[#214C6A]/30 flex items-center gap-1 cursor-pointer shadow-2xs"
                title="Añadir, modificar o eliminar categorías"
              >
                <Settings className="w-3.5 h-3.5 text-[#BC6343]" />
                <span>Categorías</span>
              </button>
            )}

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-[#214C6A] hover:bg-[#1a3d55] text-white text-xs font-bold rounded-none flex items-center gap-1 cursor-pointer shadow-xs"
              title="Descargar catálogo en formato CSV / Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Excel</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-[#BC6343] hover:bg-[#964937] text-white text-xs font-bold rounded-none flex items-center gap-1 cursor-pointer shadow-xs"
              title="Cargar productos masivamente desde CSV"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Importar CSV</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportFileChange}
              accept=".csv,text/csv"
              className="hidden"
            />

            <button
              onClick={handleCreateNewClick}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-none flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Nuevo Producto</span>
            </button>
          </div>
        </div>

        {/* Content Body: Table & Inline Editor */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Inline Edit Form Modal if selected */}
          {editingProduct && (
            <form onSubmit={handleSaveEditProduct} className="bg-white p-4 border-2 border-[#214C6A] shadow-md space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[#214C6A]/20 pb-1.5">
                <h4 className="font-bold text-sm text-[#214C6A] flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-[#BC6343]" />
                  <span>Modificar Producto: <strong>{editingProduct.title}</strong></span>
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onEditProduct) {
                        onEditProduct(editingProduct);
                      }
                    }}
                    className="text-xs text-[#214C6A] hover:underline font-bold cursor-pointer"
                  >
                    Abrir en Modal Completo ↗
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="text-xs text-[#63665B] hover:text-[#e74c3c] font-bold cursor-pointer"
                  >
                    ✕ Cancelar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 text-xs">
                <div className="col-span-2">
                  <label className="font-bold text-[#214C6A] block mb-1">Nombre</label>
                  <input
                    type="text"
                    value={editingProduct.title}
                    onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                    className="w-full px-2 py-1 border border-[#214C6A]/30 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#214C6A] block mb-1">Categoría</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full px-2 py-1 border border-[#214C6A]/30 text-xs font-bold text-[#214C6A]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#214C6A] block mb-1">Precio Venta (COP)</label>
                  <input
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    className="w-full px-2 py-1 border border-[#214C6A]/30 text-xs font-bold text-[#BC6343]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#214C6A] block mb-1">Precio Costo (COP)</label>
                  <input
                    type="number"
                    value={editingProduct.costPrice || Math.round(editingProduct.price * 0.75)}
                    onChange={(e) => setEditingProduct({ ...editingProduct, costPrice: Number(e.target.value) })}
                    className="w-full px-2 py-1 border border-[#214C6A]/30 text-xs font-bold text-slate-700"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#214C6A] block mb-1">Stock Disponible</label>
                  <input
                    type="number"
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                    className="w-full px-2 py-1 border border-[#214C6A]/30 text-xs font-bold text-[#214C6A]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#214C6A] block mb-1">Stock Mínimo (Alerta)</label>
                  <input
                    type="number"
                    value={editingProduct.minStock || 10}
                    onChange={(e) => setEditingProduct({ ...editingProduct, minStock: Number(e.target.value) })}
                    className="w-full px-2 py-1 border border-[#214C6A]/30 text-xs font-bold text-amber-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#214C6A] block mb-1">Tarifa IVA</label>
                  <select
                    value={editingProduct.ivaRate ?? 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, ivaRate: Number(e.target.value) })}
                    className="w-full px-2 py-1 border border-[#214C6A]/30 text-xs font-bold"
                  >
                    <option value={0}>0% Exento</option>
                    <option value={5}>5% IVA</option>
                    <option value={19}>19% General</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#214C6A] block mb-1">Descuento (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editingProduct.discount || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, discount: Number(e.target.value) })}
                    className="w-full px-2 py-1 border border-[#214C6A]/30 text-xs font-bold text-rose-700"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-[#214C6A]/15">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(editingProduct.id)}
                  className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-300 rounded-none flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar Producto</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-none cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1 bg-[#214C6A] hover:bg-[#1a3d55] text-white text-xs font-bold rounded-none shadow-xs cursor-pointer"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Products Table */}
          <div className="border border-[#214C6A]/20 bg-white overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#214C6A] text-[#FFF9F0] text-[11px] font-bold uppercase tracking-wider">
                  <th className="p-2">Producto</th>
                  <th className="p-2">Categoría</th>
                  <th className="p-2">Precio Venta</th>
                  <th className="p-2">Costo Est.</th>
                  <th className="p-2">Margen</th>
                  <th className="p-2">Stock</th>
                  <th className="p-2">IVA / Desc</th>
                  <th className="p-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#214C6A]/10">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-[#63665B]">
                      No se encontraron productos con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const cost = p.costPrice || Math.round(p.price * 0.75);
                    const marginAmt = p.price - cost;
                    const marginPct = p.price > 0 ? Math.round((marginAmt / p.price) * 100) : 0;
                    const isLow = p.stock <= (p.minStock || 10);

                    return (
                      <tr key={p.id} className={`hover:bg-[#F6E1C6]/30 transition-colors ${isLow ? 'bg-amber-50/40' : ''}`}>
                        <td className="p-2 flex items-center gap-2">
                          <img
                            src={normalizeImageUrl(p.imageUrl)}
                            alt={p.title}
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-none object-cover border border-[#214C6A]/20 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-[#214C6A] truncate max-w-[170px]">{p.title}</div>
                            <div className="text-[10px] text-[#63665B] font-mono">{p.barcode}</div>
                          </div>
                        </td>
                        <td className="p-2 text-[#56291D] font-medium">
                          <span className="px-1.5 py-0.5 bg-[#F6E1C6]/60 border border-[#214C6A]/15 text-[10px] font-bold">
                            {p.category}
                          </span>
                        </td>
                        <td className="p-2 font-black text-[#BC6343]">{formatCOP(p.price)}</td>
                        <td className="p-2 text-[#63665B] font-medium">{formatCOP(cost)}</td>
                        <td className="p-2">
                          <span className="font-bold text-emerald-700">
                            {marginPct}% ({formatCOP(marginAmt)})
                          </span>
                        </td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded-none font-bold text-[11px] ${
                            isLow
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            {p.stock} {p.unit || 'uds'}
                          </span>
                          {isLow && <span className="block text-[9px] text-rose-700 font-bold mt-0.5">⚠️ Reordenar</span>}
                        </td>
                        <td className="p-2 text-[11px]">
                          <div>IVA: <strong>{p.ivaRate || 0}%</strong></div>
                          {p.discount ? <div className="text-rose-700 font-bold">-{p.discount}%</div> : null}
                        </td>
                        <td className="p-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                if (onEditProduct) {
                                  onEditProduct(p);
                                } else {
                                  setEditingProduct(p);
                                }
                              }}
                              className="px-2 py-1 bg-[#214C6A] hover:bg-[#1a3d55] text-white text-[10px] font-bold rounded-none cursor-pointer flex items-center gap-1"
                              title="Modificar producto"
                            >
                              <Edit3 className="w-3 h-3 text-[#EB9D52]" />
                              <span>Editar</span>
                            </button>

                            <button
                              onClick={() => setDeleteConfirmId(p.id)}
                              className="px-2 py-1 bg-rose-700 hover:bg-rose-800 text-white text-[10px] font-bold rounded-none cursor-pointer flex items-center gap-1"
                              title="Eliminar producto"
                            >
                              <Trash2 className="w-3 h-3 text-white" />
                              <span>Eliminar</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-[#F6E1C6]/60 border-t-2 border-[#214C6A] flex items-center justify-between">
          <span className="text-xs text-[#56291D]">
            Puedes añadir productos nuevos, editarlos, eliminarlos o gestionar categorías fácilmente.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-none bg-[#214C6A] hover:bg-[#1a3d55] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            Listo / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
