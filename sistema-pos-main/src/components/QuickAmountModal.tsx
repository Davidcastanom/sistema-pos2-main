import React, { useState, useEffect, useRef } from 'react';
import { ProductItem, CategoryName } from '@/types';
import { formatCOP } from '@/lib/utils';
import { 
  X, 
  PlusCircle, 
  Zap, 
  Delete, 
  Check, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Sparkles,
  Copy,
  ClipboardPaste,
  ClipboardCheck
} from 'lucide-react';

interface QuickAmountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddQuickItem: (product: ProductItem) => void;
}

export interface QuickSaleCategory {
  id: string;
  label: string;
  category: CategoryName;
  icon: string;
}

const DEFAULT_QUICK_CATEGORIES: QuickSaleCategory[] = [
  { id: 'cat-1', label: 'Queso / Lácteos', category: 'Lácteos', icon: '🧀' },
  { id: 'cat-2', label: 'Panadería / Pan', category: 'Panadería', icon: '🥖' },
  { id: 'cat-3', label: 'Frutas / Verduras', category: 'Frutas y verduras', icon: '🥬' },
  { id: 'cat-4', label: 'Carnes / Pollo', category: 'Carnes', icon: '🥩' },
  { id: 'cat-5', label: 'Abarrotes / Granel', category: 'Abarrotes', icon: '🌾' },
  { id: 'cat-6', label: 'Bebidas / Jugos', category: 'Bebidas', icon: '🥤' },
  { id: 'cat-7', label: 'Huevos / Granja', category: 'Abarrotes', icon: '🥚' },
  { id: 'cat-8', label: 'Mecato / Dulces', category: 'Mecato', icon: '🍬' },
  { id: 'cat-9', label: 'Aseo / Limpieza', category: 'Aseo', icon: '🧼' },
  { id: 'cat-10', label: 'Varios / Miscelánea', category: 'Otros', icon: '🛒' },
];

const SUGGESTED_EMOJIS = ['🧀', '🥖', '🥬', '🥩', '🌾', '🥤', '🥚', '🍬', '🧼', '☕', '🍗', '🍺', '💊', '📦', '🏷️', '⚡', '🍎', '🥦', '🍕', '🍦', '🧂', '🥛', '🌭', '🥪'];

const BASE_CATEGORIES: CategoryName[] = [
  'Abarrotes',
  'Lácteos',
  'Aseo',
  'Bebidas',
  'Carnes',
  'Panadería',
  'Frutas y verduras',
  'Licores',
  'Mecato',
  'Otros',
];

export const QuickAmountModal: React.FC<QuickAmountModalProps> = ({
  isOpen,
  onClose,
  onAddQuickItem,
}) => {
  // Starts empty so the user doesn't have to clear/delete a pre-existing 1000 value
  const [amountStr, setAmountStr] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<QuickSaleCategory[]>(() => {
    const saved = localStorage.getItem('pos_quick_sale_categories_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // Fallback to default
      }
    }
    return DEFAULT_QUICK_CATEGORIES;
  });

  const [selectedPreset, setSelectedPreset] = useState<QuickSaleCategory>(() => {
    return categories[0] || DEFAULT_QUICK_CATEGORIES[0];
  });
  const [customName, setCustomName] = useState<string>('');

  // Category Management State
  const [isManageMode, setIsManageMode] = useState<boolean>(false);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newCatLabel, setNewCatLabel] = useState<string>('');
  const [newCatIcon, setNewCatIcon] = useState<string>('🏷️');
  const [newCatBase, setNewCatBase] = useState<CategoryName>('Abarrotes');

  // Reset and auto-focus when opened
  useEffect(() => {
    if (isOpen) {
      setAmountStr('');
      setCustomName('');
      setCopied(false);
      setIsManageMode(false);
      setShowAddForm(false);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [isOpen]);

  // Save categories to localStorage
  useEffect(() => {
    localStorage.setItem('pos_quick_sale_categories_v1', JSON.stringify(categories));
  }, [categories]);

  // Keep selectedPreset valid if categories change
  useEffect(() => {
    if (!categories.some((c) => c.id === selectedPreset.id) && categories.length > 0) {
      setSelectedPreset(categories[0]);
    }
  }, [categories, selectedPreset]);

  if (!isOpen) return null;

  const currentAmount = parseInt(amountStr, 10) || 0;

  const handleDigit = (digit: string) => {
    if (amountStr === '0' || amountStr === '') {
      setAmountStr(digit);
    } else if (amountStr.length < 8) {
      setAmountStr(amountStr + digit);
    }
  };

  const handleClear = () => {
    setAmountStr('');
    if (inputRef.current) inputRef.current.focus();
  };

  const handleBackspace = () => {
    if (amountStr.length <= 1) {
      setAmountStr('');
    } else {
      setAmountStr(amountStr.slice(0, -1));
    }
  };

  const handleAddPresetAmount = (val: number) => {
    const current = parseInt(amountStr, 10) || 0;
    setAmountStr(String(current + val));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/\D/g, '');
    if (clean.length <= 8) {
      setAmountStr(clean);
    }
  };

  const handleCopyAmount = async () => {
    const textToCopy = currentAmount > 0 ? String(currentAmount) : '0';
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      if (inputRef.current) {
        inputRef.current.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handlePasteAmount = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const clean = text.replace(/\D/g, '');
      if (clean) {
        setAmountStr(clean.slice(0, 8));
      }
    } catch {
      // Clipboard access might be constrained in iframe
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLabel = newCatLabel.trim();
    if (!cleanLabel) return;

    const newCat: QuickSaleCategory = {
      id: `qcat-${Date.now()}`,
      label: cleanLabel,
      icon: newCatIcon || '🏷️',
      category: newCatBase || 'Otros',
    };

    setCategories((prev) => [...prev, newCat]);
    setSelectedPreset(newCat);
    setNewCatLabel('');
    setNewCatIcon('🏷️');
    setShowAddForm(false);
  };

  const handleRemoveCategory = (catId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (categories.length <= 1) return;
    setCategories((prev) => prev.filter((c) => c.id !== catId));
  };

  const handleResetDefaultCategories = () => {
    setCategories(DEFAULT_QUICK_CATEGORIES);
    setSelectedPreset(DEFAULT_QUICK_CATEGORIES[0]);
    setIsManageMode(false);
    setShowAddForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentAmount <= 0) return;

    const itemName =
      customName.trim() ||
      `${selectedPreset.icon} ${selectedPreset.label} (Granel/Rápido)`;

    const quickProduct: ProductItem = {
      id: `quick-${Date.now()}`,
      barcode: `QUICK-${Date.now().toString().slice(-4)}`,
      title: itemName,
      category: selectedPreset.category,
      description: `Venta rápida digitada por el tendero: ${formatCOP(currentAmount)}`,
      price: currentAmount,
      stock: 9999,
      unit: 'unidad/porción',
      imageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600&auto=format&fit=crop&q=80',
    };

    onAddQuickItem(quickProduct);
    onClose();
    // Reset state
    setAmountStr('');
    setCustomName('');
    setIsManageMode(false);
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#222E3A]/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#FFF9F0] rounded-none max-w-lg w-full shadow-2xl border-2 border-[#214C6A] overflow-hidden flex flex-col max-h-[92vh] text-[#222E3A]">
        {/* Header */}
        <div className="p-3.5 sm:p-4 bg-[#214C6A] border-b border-[#214C6A] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none bg-[#BC6343] border border-white/20 flex items-center justify-center shadow-xs">
              <Zap className="w-4 h-4 text-[#FFF9F0]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold font-['Outfit',sans-serif] text-[#FFF9F0] flex items-center gap-2">
                <span>Venta Rápida por Monto</span>
                <span className="text-[10px] bg-[#EB9D52] text-[#222E3A] px-2 py-0.5 rounded-none font-black tracking-wide">
                  F8
                </span>
              </h3>
              <p className="text-[11px] text-[#F6E1C6]/80">
                Digita o copia directamente el monto a cobrar
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-none bg-[#1a3d55] hover:bg-[#0f2433] flex items-center justify-center text-[#F6E1C6] hover:text-white transition-colors cursor-pointer border border-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3.5 sm:p-4 space-y-3.5 overflow-y-auto flex-1">
          {/* Display screen for the typed amount - Ready to copy, paste, or direct keyboard type */}
          <div className="bg-white/90 backdrop-blur-md rounded-none p-3 border border-white/80 shadow-inner relative group">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#56291D] flex items-center gap-1">
                <span>Monto a cobrar en COP</span>
                {amountStr && (
                  <span className="text-[10px] font-normal text-[#63665B]">
                    ({formatCOP(currentAmount)})
                  </span>
                )}
              </span>

              {/* Quick Actions: Copy and Paste */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleCopyAmount}
                  disabled={currentAmount <= 0}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-none text-[10px] font-bold transition-all cursor-pointer border shadow-2xs ${
                    copied
                      ? 'bg-emerald-600 text-white border-emerald-700'
                      : 'bg-white/80 hover:bg-white text-[#214C6A] border-white/80 disabled:opacity-40'
                  }`}
                  title="Copiar valor al portapapeles"
                >
                  {copied ? (
                    <>
                      <ClipboardCheck className="w-3 h-3 text-white" />
                      <span>¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handlePasteAmount}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-none text-[10px] font-bold bg-white/80 hover:bg-white text-[#56291D] border border-white/80 transition-all cursor-pointer shadow-2xs"
                  title="Pegar monto desde el portapapeles"
                >
                  <ClipboardPaste className="w-3 h-3" />
                  <span>Pegar</span>
                </button>
              </div>
            </div>

            {/* Direct Input Field - Auto-focused & selectable */}
            <div className="flex items-center justify-center gap-1 bg-[#F6E1C6]/30 border border-[#214C6A]/20 py-1.5 px-3 rounded-none">
              <span className="text-2xl sm:text-3xl font-black text-[#BC6343] select-none font-['Outfit',sans-serif]">
                $
              </span>
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={amountStr}
                onChange={handleInputChange}
                placeholder="0"
                className="w-full text-center text-3xl sm:text-4xl font-black text-[#214C6A] font-['Outfit',sans-serif] bg-transparent focus:outline-none placeholder-[#214C6A]/30 tracking-tight"
                autoFocus
              />
            </div>
          </div>

          {/* Quick Increment Buttons */}
          <div className="grid grid-cols-4 gap-1.5">
            {[500, 1000, 2000, 5000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleAddPresetAmount(val)}
                className="py-1.5 px-2 rounded-none bg-white/70 hover:bg-white text-[#56291D] text-xs font-bold border border-white/80 transition-all cursor-pointer backdrop-blur-xs shadow-2xs active:scale-95"
              >
                +{val >= 1000 ? `${val / 1000}k` : val}
              </button>
            ))}
          </div>

          {/* Touch-Friendly Numeric Keypad */}
          <div className="grid grid-cols-3 gap-1.5">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '00', '000'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigit(digit)}
                className="py-2.5 rounded-none bg-white/85 hover:bg-white border border-white/80 hover:border-[#214C6A]/30 text-[#222E3A] font-extrabold text-base transition-all cursor-pointer shadow-2xs active:scale-98 backdrop-blur-xs"
              >
                {digit}
              </button>
            ))}
          </div>

          {/* Keypad Utility Controls */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleBackspace}
              className="flex-1 py-1.5 rounded-none bg-white/60 hover:bg-white text-[#56291D] text-xs font-bold border border-white/80 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Delete className="w-3.5 h-3.5" />
              <span>Borrar Dígito</span>
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="py-1.5 px-3 rounded-none bg-white/60 hover:bg-rose-50 text-rose-700 text-xs font-bold border border-white/80 transition-colors cursor-pointer shadow-2xs"
            >
              Limpiar
            </button>
          </div>

          {/* Department / Category Selection with Add/Remove capability */}
          <div className="space-y-2 pt-1 border-t border-[#214C6A]/15">
            <div className="flex items-center justify-between flex-wrap gap-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-[#214C6A] uppercase tracking-wide">
                  Categoría / Departamento
                </span>
                <span className="text-[10px] text-[#214C6A] bg-white/70 px-1.5 py-0.5 rounded-none border border-[#214C6A]/15 font-bold">
                  {categories.length}
                </span>
              </div>

              {/* Action buttons: Add Category, Manage/Remove, Reset */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(!showAddForm);
                    if (isManageMode) setIsManageMode(false);
                  }}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-none text-[10px] font-bold transition-all cursor-pointer border shadow-2xs ${
                    showAddForm
                      ? 'bg-[#214C6A] text-[#FFF9F0] border-[#214C6A]'
                      : 'bg-[#EB9D52] hover:bg-[#d98c42] text-[#222E3A] border-[#BC6343]'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>+ Añadir</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsManageMode(!isManageMode);
                    if (showAddForm) setShowAddForm(false);
                  }}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-none text-[10px] font-bold transition-all cursor-pointer border shadow-2xs ${
                    isManageMode
                      ? 'bg-rose-600 text-white border-rose-700'
                      : 'bg-white/80 hover:bg-white text-[#56291D] border-white/80'
                  }`}
                >
                  {isManageMode ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Listo</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Quitar</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResetDefaultCategories}
                  title="Restablecer categorías sugeridas por defecto"
                  className="p-1 rounded-none bg-white/60 hover:bg-white text-[#63665B] hover:text-[#222E3A] border border-white/80 transition-colors cursor-pointer shadow-2xs"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Inline Add Category Form */}
            {showAddForm && (
              <div className="p-3 bg-white/90 backdrop-blur-md rounded-none border border-[#214C6A]/20 shadow-sm space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#214C6A]/10">
                  <span className="text-[11px] font-black text-[#214C6A] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#EB9D52]" />
                    Nueva Categoría para Venta Rápida
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="text-xs text-[#63665B] hover:text-[#222E3A]"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-[#56291D] block mb-0.5">
                      Nombre de la Categoría:
                    </label>
                    <input
                      type="text"
                      value={newCatLabel}
                      onChange={(e) => setNewCatLabel(e.target.value)}
                      placeholder="Ej: Cigarrería, Dulces, Granja..."
                      className="w-full px-2 py-1.5 bg-white border border-[#214C6A]/25 rounded-none text-[#222E3A] text-xs focus:ring-1 focus:ring-[#214C6A] focus:outline-none"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#56291D] block mb-0.5">
                      Categoría Base (Inventario):
                    </label>
                    <select
                      value={newCatBase}
                      onChange={(e) => setNewCatBase(e.target.value as CategoryName)}
                      className="w-full px-2 py-1.5 bg-white border border-[#214C6A]/25 rounded-none text-[#222E3A] text-xs focus:ring-1 focus:ring-[#214C6A] focus:outline-none"
                    >
                      {BASE_CATEGORIES.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Emoji / Icon Selector */}
                <div>
                  <label className="text-[10px] font-bold text-[#56291D] block mb-1">
                    Icono / Emoji:
                  </label>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {SUGGESTED_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setNewCatIcon(emoji)}
                        className={`w-7 h-7 shrink-0 text-sm flex items-center justify-center rounded-none border transition-all cursor-pointer ${
                          newCatIcon === emoji
                            ? 'bg-[#BC6343] text-white border-[#BC6343] scale-110 shadow-xs'
                            : 'bg-white hover:bg-[#F6E1C6] border-gray-300'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                    <input
                      type="text"
                      maxLength={2}
                      value={newCatIcon}
                      onChange={(e) => setNewCatIcon(e.target.value)}
                      className="w-8 h-7 text-center bg-white border border-gray-300 rounded-none text-sm shrink-0"
                      title="Escribir emoji personalizado"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={!newCatLabel.trim()}
                    className="flex-1 py-1.5 rounded-none bg-[#214C6A] hover:bg-[#1a3d55] disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Guardar y Usar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 rounded-none bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Quick Categories Grid with subtle glass finish */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-44 overflow-y-auto p-1">
              {categories.map((preset) => {
                const isSelected = selectedPreset.id === preset.id;
                return (
                  <div key={preset.id} className="relative group">
                    <button
                      type="button"
                      onClick={() => {
                        if (isManageMode) {
                          handleRemoveCategory(preset.id);
                        } else {
                          setSelectedPreset(preset);
                        }
                      }}
                      className={`w-full p-2 rounded-none border text-[11px] font-bold text-left transition-all cursor-pointer flex items-center gap-1.5 backdrop-blur-md shadow-2xs active:scale-[0.98] ${
                        isManageMode
                          ? 'bg-rose-50/90 border-rose-300 text-rose-900 hover:bg-rose-100 hover:border-rose-500 ring-1 ring-rose-200'
                          : isSelected
                          ? 'bg-[#BC6343] border-[#BC6343] text-[#FFF9F0] shadow-sm'
                          : 'bg-white/80 hover:bg-white border-white/80 text-[#222E3A] hover:border-[#BC6343]/40'
                      }`}
                    >
                      <span className="text-base shrink-0">{preset.icon}</span>
                      <span className="truncate flex-1">{preset.label.split('/')[0]}</span>
                    </button>

                    {/* Delete button in manage mode */}
                    {isManageMode && (
                      <button
                        type="button"
                        onClick={(e) => handleRemoveCategory(preset.id, e)}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 hover:bg-rose-700 text-white rounded-none flex items-center justify-center text-[10px] font-black shadow-xs cursor-pointer z-10"
                        title={`Eliminar categoría ${preset.label}`}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Add category tile */}
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(true);
                  setIsManageMode(false);
                }}
                className="p-2 rounded-none border border-dashed border-[#214C6A]/30 hover:border-[#214C6A] bg-white/40 hover:bg-white/75 backdrop-blur-xs text-[11px] font-bold text-[#214C6A] transition-all cursor-pointer flex items-center justify-center gap-1.5 group shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-[#214C6A] group-hover:scale-110 transition-transform" />
                <span>+ Otra</span>
              </button>
            </div>
          </div>

          {/* Optional Name */}
          <div>
            <label className="text-xs font-bold text-[#214C6A] mb-1 block">
              Nombre Opcional (ej: 500 de Cilantro, 2000 de Queso campesino):
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={`Ej: ${selectedPreset.icon} ${selectedPreset.label}`}
              className="w-full px-3 py-2 bg-white/90 border border-[#214C6A]/30 rounded-none text-[#222E3A] placeholder-[#63665B]/50 text-xs focus:ring-1 focus:ring-[#214C6A] focus:outline-none"
            />
          </div>

          {/* Add to Cart/Order Action Button */}
          <button
            type="submit"
            disabled={currentAmount <= 0}
            className="w-full py-2.5 px-4 rounded-none bg-[#214C6A] hover:bg-[#1a3d55] disabled:opacity-40 disabled:cursor-not-allowed text-[#FFF9F0] font-extrabold text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer border border-[#214C6A] active:scale-[0.99]"
          >
            <PlusCircle className="w-4 h-4 text-[#EB9D52]" />
            <span>
              {currentAmount > 0
                ? `Agregar ${formatCOP(currentAmount)} a la Cuenta (${selectedPreset.label.split('/')[0]})`
                : 'Digita un monto para agregar'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
