import React, { useState, useEffect, useRef } from 'react';
import { CategoryInfo, CategoryName, ProductItem } from '@/types';
import { CATEGORIES } from '@/data/initialData';
import {
  PlusCircle,
  X,
  PackagePlus,
  Barcode,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Percent,
  DollarSign,
  Trash2,
  Settings,
  AlertTriangle,
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { playBeep, formatCOP, normalizeImageUrl } from '@/lib/utils';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: ProductItem) => void;
  onUpdateProduct?: (product: ProductItem) => void;
  onDeleteProduct?: (productId: string | number) => void;
  editingProduct?: ProductItem | null;
  categories?: CategoryInfo[];
  initialBarcode?: string;
  onOpenScanner?: () => void;
  onOpenManageCategories?: () => void;
}

const COMMON_IVA_RATES = [
  { rate: 0, label: '0% Exento' },
  { rate: 5, label: '5% Canasta' },
  { rate: 19, label: '19% General' },
];

const COMMON_DISCOUNTS = [
  { discount: 0, label: '0% (Sin desc.)' },
  { discount: 5, label: '5%' },
  { discount: 10, label: '10%' },
  { discount: 15, label: '15%' },
  { discount: 20, label: '20%' },
  { discount: 30, label: '30%' },
];

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  editingProduct = null,
  categories = CATEGORIES,
  initialBarcode = '',
  onOpenScanner,
  onOpenManageCategories,
}) => {
  const isEditing = Boolean(editingProduct);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryName>('Abarrotes');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(4500);
  const [costPrice, setCostPrice] = useState<number>(3375);
  const [stock, setStock] = useState<number>(50);
  const [minStock, setMinStock] = useState<number>(10);
  const [unit, setUnit] = useState('unidades');
  const [barcode, setBarcode] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [ivaRate, setIvaRate] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [isReadingPhoto, setIsReadingPhoto] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingProduct) {
      setTitle(editingProduct.title || '');
      setCategory(editingProduct.category || (categories[0]?.name as CategoryName) || 'Abarrotes');
      setDescription(editingProduct.description || '');
      setPrice(editingProduct.price || 0);
      setCostPrice(editingProduct.costPrice || Math.round((editingProduct.price || 0) * 0.75));
      setStock(editingProduct.stock || 0);
      setMinStock(editingProduct.minStock || 10);
      setUnit(editingProduct.unit || 'unidades');
      setBarcode(editingProduct.barcode || '');
      setImageUrl(editingProduct.imageUrl || '');
      setIvaRate(editingProduct.ivaRate !== undefined ? editingProduct.ivaRate : 0);
      setDiscount(editingProduct.discount !== undefined ? editingProduct.discount : 0);
      setScanFeedback(null);
      setShowDeleteConfirm(false);
    } else {
      setTitle('');
      setCategory((categories[0]?.name as CategoryName) || 'Abarrotes');
      setDescription('');
      setPrice(4500);
      setCostPrice(3375);
      setStock(50);
      setMinStock(10);
      setUnit('unidades');
      setBarcode(initialBarcode || '');
      setImageUrl('');
      setIvaRate(0);
      setDiscount(0);
      setShowDeleteConfirm(false);
      if (initialBarcode) {
        setScanFeedback({ message: `¡Código ${initialBarcode} cargado con éxito!`, type: 'success' });
      } else {
        setScanFeedback(null);
      }
    }
  }, [editingProduct, initialBarcode, isOpen, categories]);

  if (!isOpen) return null;

  // Live calculations
  const basePrice = Math.max(0, Number(price) || 0);
  const discountVal = (basePrice * (Number(discount) || 0)) / 100;
  const priceAfterDiscount = Math.max(0, basePrice - discountVal);
  const cost = Math.max(0, Number(costPrice) || 0);
  const profitMargin = basePrice - cost;
  const profitMarginPct = basePrice > 0 ? Math.round((profitMargin / basePrice) * 100) : 0;

  const handlePhotoUploadForBarcode = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsReadingPhoto(true);
    setScanFeedback(null);

    try {
      const tempScanner = new Html5Qrcode('temp-add-product-barcode-scanner', {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
      });

      const decodedText = await tempScanner.scanFile(file, true);
      tempScanner.clear();

      if (decodedText) {
        const cleaned = decodedText.trim().replace(/[^0-9A-Za-z_-]/g, '') || decodedText.trim();
        setBarcode(cleaned);
        playBeep();
        setScanFeedback({ message: `¡Código ${cleaned} extraído de la foto!`, type: 'success' });
      } else {
        setScanFeedback({ message: 'No se detectó un código claro en la foto.', type: 'error' });
      }
    } catch (err) {
      console.warn('Barcode photo read error in AddProductModal:', err);
      setScanFeedback({ message: 'No se detectó un código de barras en la foto. Intenta con otra imagen más nítida.', type: 'error' });
    } finally {
      setIsReadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const defaultImg =
      normalizeImageUrl(imageUrl.trim()) ||
      (editingProduct?.imageUrl ? normalizeImageUrl(editingProduct.imageUrl) : undefined) ||
      categories.find((c) => c.name === category)?.imageUrl ||
      'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=700&auto=format&fit=crop&q=80';

    const productPayload: ProductItem = {
      id: editingProduct ? editingProduct.id : `custom-${Date.now()}`,
      barcode: barcode.trim() || (editingProduct?.barcode || `770${Math.floor(1000000 + Math.random() * 9000000)}`),
      title: title.trim(),
      category,
      description: description.trim() || `${title} x ${unit}`,
      price: Math.max(50, Number(price)),
      costPrice: Math.max(0, Number(costPrice) || Math.round(Number(price) * 0.75)),
      stock: Math.max(0, Number(stock)),
      minStock: Math.max(0, Number(minStock) || 10),
      unit: unit.trim() || 'unidades',
      imageUrl: defaultImg,
      ivaRate: Math.max(0, Number(ivaRate) || 0),
      discount: Math.max(0, Math.min(100, Number(discount) || 0)),
      featured: editingProduct ? editingProduct.featured : false,
    };

    if (isEditing && onUpdateProduct) {
      onUpdateProduct(productPayload);
    } else {
      onAddProduct(productPayload);
    }
    onClose();
  };

  const handleDeleteCurrentProduct = () => {
    if (!editingProduct || !onDeleteProduct) return;
    onDeleteProduct(editingProduct.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#222E3A]/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#FFF9F0] rounded-none max-w-xl w-full shadow-2xl border border-[#214C6A]/30 overflow-hidden flex flex-col max-h-[92vh] text-[#222E3A]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#214C6A] border-b border-white/10 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-[#BC6343] border border-white/20 flex items-center justify-center shadow-md">
              {isEditing ? (
                <Edit3 className="w-5 h-5 text-[#FFF9F0]" />
              ) : (
                <PackagePlus className="w-5 h-5 text-[#FFF9F0]" />
              )}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black font-['Outfit',sans-serif] text-[#FFF9F0]">
                {isEditing ? 'Modificar Producto, Costos y Stock' : 'Registrar Nuevo Producto'}
              </h3>
              <p className="text-xs text-[#F6E1C6]/80 font-medium">
                {isEditing 
                  ? 'Actualiza precios, costos, código de barras, categoría o elimina el producto' 
                  : 'Añadir al catálogo del POS con IVA discriminado y descuento'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-none bg-[#1a3d55] hover:bg-[#0f2433] flex items-center justify-center text-[#F6E1C6] hover:text-white transition-colors cursor-pointer border border-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Delete Confirmation Alert Banner */}
        {showDeleteConfirm && editingProduct && (
          <div className="bg-rose-50 border-b-2 border-rose-600 p-3.5 space-y-2 animate-fadeIn text-xs">
            <div className="flex items-center gap-2 text-rose-900 font-extrabold">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>¿Confirmas eliminar permanentemente "{editingProduct.title}"?</span>
            </div>
            <p className="text-rose-800 text-[11px]">
              El producto se retirará del catálogo, de la cuadrícula del POS y de los reportes activos.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1 bg-white text-slate-700 font-bold border border-slate-300 rounded-none cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteCurrentProduct}
                className="px-3 py-1 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-none cursor-pointer shadow-xs flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Sí, Eliminar Producto</span>
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Title */}
          <div>
            <label className="block font-bold text-[#214C6A] mb-1">
              Nombre del Producto *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Arroz Diana Premium 1000g"
              className="w-full px-3 py-2.5 bg-[#FFF9F0] border border-[#214C6A]/20 rounded-none text-[#222E3A] placeholder-[#63665B]/50 text-sm focus:ring-1 focus:ring-[#BC6343] focus:border-[#BC6343] focus:outline-none"
            />
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-[#214C6A]">Categoría *</label>
                {onOpenManageCategories && (
                  <button
                    type="button"
                    onClick={onOpenManageCategories}
                    className="text-[10px] text-[#BC6343] hover:text-[#214C6A] font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <Settings className="w-2.5 h-2.5" />
                    <span>+ Categorías</span>
                  </button>
                )}
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryName)}
                className="w-full px-3 py-2.5 bg-[#FFF9F0] border border-[#214C6A]/20 rounded-none text-[#222E3A] font-semibold focus:ring-1 focus:ring-[#BC6343] focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name} className="bg-[#FFF9F0] text-[#222E3A]">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#214C6A] mb-1">Presentación / Unidad</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="unidades, kg, bolsa, lata..."
                className="w-full px-3 py-2.5 bg-[#FFF9F0] border border-[#214C6A]/20 rounded-none text-[#222E3A] placeholder-[#63665B]/50 focus:ring-1 focus:ring-[#BC6343] focus:outline-none"
              />
            </div>
          </div>

          {/* Prices: Sale Price & Cost Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#214C6A] mb-1">
                Precio de Venta Base (COP) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-[#63665B]">
                  $
                </span>
                <input
                  type="number"
                  required
                  min="50"
                  step="50"
                  value={price}
                  onChange={(e) => {
                    const newP = Number(e.target.value);
                    setPrice(newP);
                    if (!editingProduct) {
                      setCostPrice(Math.round(newP * 0.75));
                    }
                  }}
                  placeholder="4500"
                  className="w-full pl-7 pr-3 py-2.5 bg-[#FFF9F0] border border-[#214C6A]/20 rounded-none text-[#BC6343] font-bold text-sm focus:ring-1 focus:ring-[#BC6343] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-[#214C6A]">
                  Precio de Costo (COP)
                </label>
                <span className="text-[10px] text-emerald-700 font-bold">
                  Margen: {profitMarginPct}%
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-[#63665B]">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={costPrice}
                  onChange={(e) => setCostPrice(Number(e.target.value))}
                  placeholder="3375"
                  className="w-full pl-7 pr-3 py-2.5 bg-[#FFF9F0] border border-[#214C6A]/20 rounded-none text-slate-800 font-bold text-sm focus:ring-1 focus:ring-[#214C6A] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Stock & Minimum Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#214C6A] mb-1">
                Stock Disponible ({unit}) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                placeholder="50"
                className="w-full px-3 py-2.5 bg-[#FFF9F0] border border-[#214C6A]/20 rounded-none text-[#214C6A] font-bold text-sm focus:ring-1 focus:ring-[#BC6343] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-[#214C6A] mb-1">
                Stock Mínimo (Alerta de Reorden)
              </label>
              <input
                type="number"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(Number(e.target.value))}
                placeholder="10"
                className="w-full px-3 py-2.5 bg-[#FFF9F0] border border-[#214C6A]/20 rounded-none text-amber-800 font-bold text-sm focus:ring-1 focus:ring-[#BC6343] focus:outline-none"
              />
            </div>
          </div>

          {/* SECTION: IVA (Tax / VAT) Management */}
          <div className="p-3.5 bg-[#214C6A]/5 border border-[#214C6A]/20 rounded-none space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-[#214C6A] flex items-center gap-1.5 uppercase tracking-wide text-[11px]">
                <Percent className="w-3.5 h-3.5 text-[#BC6343]" />
                Tarifa de IVA (%)
              </label>
              <span className="text-[11px] font-bold text-[#BC6343]">
                {ivaRate === 0 ? 'Exento (0%)' : `IVA ${ivaRate}%`}
              </span>
            </div>

            {/* Quick IVA Rate Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {COMMON_IVA_RATES.map((item) => (
                <button
                  key={item.rate}
                  type="button"
                  onClick={() => setIvaRate(item.rate)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-none border transition-all cursor-pointer ${
                    ivaRate === item.rate
                      ? 'bg-[#214C6A] text-[#FFF9F0] border-[#214C6A] shadow-xs'
                      : 'bg-[#FFF9F0] text-[#63665B] border-[#214C6A]/20 hover:border-[#214C6A] hover:text-[#214C6A]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION: Discount Management */}
          <div className="p-3.5 bg-[#BC6343]/5 border border-[#BC6343]/20 rounded-none space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-[#56291D] flex items-center gap-1.5 uppercase tracking-wide text-[11px]">
                <DollarSign className="w-3.5 h-3.5 text-[#BC6343]" />
                Descuento Promocional del Producto (%)
              </label>
              <span className="text-[11px] font-bold text-rose-700">
                {discount > 0 ? `-${discount}% OFF (${formatCOP(discountVal)})` : 'Sin descuento'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {COMMON_DISCOUNTS.map((item) => (
                <button
                  key={item.discount}
                  type="button"
                  onClick={() => setDiscount(item.discount)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-none border transition-all cursor-pointer ${
                    discount === item.discount
                      ? 'bg-[#BC6343] text-white border-[#BC6343] shadow-xs'
                      : 'bg-[#FFF9F0] text-[#63665B] border-[#BC6343]/20 hover:border-[#BC6343] hover:text-[#BC6343]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {discount > 0 && (
              <div className="pt-1.5 border-t border-[#BC6343]/20 flex items-center justify-between text-xs font-bold">
                <span className="text-[#63665B]">Precio Final al Cliente:</span>
                <span className="text-emerald-700 text-sm">{formatCOP(priceAfterDiscount)}</span>
              </div>
            )}
          </div>

          {/* Barcode & Image Options */}
          <div className="space-y-3 pt-1 border-t border-[#214C6A]/15">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-[#214C6A] flex items-center gap-1.5">
                  <Barcode className="w-4 h-4 text-[#BC6343]" />
                  Código de Barras (Opcional)
                </label>
                <div className="flex items-center gap-1.5">
                  {onOpenScanner && (
                    <button
                      type="button"
                      onClick={onOpenScanner}
                      className="text-[11px] text-[#214C6A] hover:text-[#BC6343] font-bold flex items-center gap-1 bg-[#F6E1C6]/60 hover:bg-[#F6E1C6] px-2 py-0.5 rounded-none border border-[#214C6A]/20 cursor-pointer"
                    >
                      <Camera className="w-3 h-3 text-[#BC6343]" />
                      <span>Escanear Cámara</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isReadingPhoto}
                    className="text-[11px] text-[#214C6A] hover:text-[#BC6343] font-bold flex items-center gap-1 bg-[#F6E1C6]/60 hover:bg-[#F6E1C6] px-2 py-0.5 rounded-none border border-[#214C6A]/20 cursor-pointer"
                  >
                    <Upload className="w-3 h-3 text-[#BC6343]" />
                    <span>{isReadingPhoto ? 'Leyendo...' : 'Subir Foto'}</span>
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="7701234567890 (Generado automático si está vacío)"
                className="w-full px-3 py-2 bg-[#FFF9F0] border border-[#214C6A]/20 rounded-none text-[#222E3A] font-mono text-xs focus:ring-1 focus:ring-[#BC6343] focus:outline-none"
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUploadForBarcode}
                accept="image/*"
                className="hidden"
              />
              <div id="temp-add-product-barcode-scanner" className="hidden" />

              {scanFeedback && (
                <div
                  className={`mt-1.5 p-2 rounded-none text-[11px] font-bold flex items-center gap-1.5 ${
                    scanFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-50 text-rose-800 border border-rose-300'
                  }`}
                >
                  {scanFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>{scanFeedback.message}</span>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-[#214C6A]">
                  URL de Imagen del Producto (Opcional)
                </label>
                <span className="text-[10px] text-[#BC6343] font-semibold">
                  Acepta enlaces de Google Drive (públicos)
                </span>
              </div>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/... o https://images.unsplash.com/..."
                className="w-full px-3 py-2 bg-[#FFF9F0] border border-[#214C6A]/20 rounded-none text-[#222E3A] placeholder-[#63665B]/50 focus:ring-1 focus:ring-[#BC6343] focus:outline-none"
              />
              <p className="text-[10px] text-[#63665B] mt-1">
                💡 Puedes pegar el enlace de compartir de Google Drive (asegúrate de que el acceso esté en <em>"Cualquier persona con el enlace"</em>).
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#214C6A]/20 flex items-center justify-between gap-2 flex-wrap">
            <div>
              {isEditing && onDeleteProduct && !showDeleteConfirm && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-2 rounded-none bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-300 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar Producto</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-none bg-[#F6E1C6]/60 hover:bg-[#F6E1C6] text-[#56291D] font-bold transition-all cursor-pointer border border-[#214C6A]/20"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-none bg-[#214C6A] hover:bg-[#1a3d55] text-white font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer border border-[#214C6A]"
              >
                {isEditing ? (
                  <>
                    <Edit3 className="w-4 h-4 text-[#EB9D52]" />
                    <span>Actualizar Producto</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4 text-[#EB9D52]" />
                    <span>Guardar Producto</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
