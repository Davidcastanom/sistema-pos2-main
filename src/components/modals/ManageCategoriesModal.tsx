import React, { useState } from 'react';
import { CategoryInfo, ProductItem } from '@/types';
import { normalizeImageUrl } from '@/lib/utils';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Package,
  Milk,
  CupSoda,
  Beef,
  Croissant,
  Apple,
  Wine,
  Cookie,
  MoreHorizontal,
  Store,
  Tag,
  Coffee,
  Fish,
  Heart,
  Boxes,
  Flame,
  ShoppingBag,
  Zap,
  Info,
} from 'lucide-react';

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryInfo[];
  products: ProductItem[];
  onAddCategory: (category: CategoryInfo) => void;
  onUpdateCategory: (updatedCategory: CategoryInfo, oldName?: string) => void;
  onDeleteCategory: (categoryId: string, categoryName: string, reassignTo?: string) => void;
  onResetDefaultCategories: () => void;
}

const AVAILABLE_ICONS = [
  { name: 'Package', label: 'Paquete', icon: Package },
  { name: 'Milk', label: 'Lácteos', icon: Milk },
  { name: 'Sparkles', label: 'Aseo / Limpieza', icon: Sparkles },
  { name: 'CupSoda', label: 'Bebidas', icon: CupSoda },
  { name: 'Beef', label: 'Carnes', icon: Beef },
  { name: 'Croissant', label: 'Panadería', icon: Croissant },
  { name: 'Apple', label: 'Frutas / Verduras', icon: Apple },
  { name: 'Wine', label: 'Licores', icon: Wine },
  { name: 'Cookie', label: 'Mecato / Snacks', icon: Cookie },
  { name: 'Coffee', label: 'Cafetería', icon: Coffee },
  { name: 'Fish', label: 'Pescados', icon: Fish },
  { name: 'Heart', label: 'Salud / Cuidado', icon: Heart },
  { name: 'Boxes', label: 'Granel', icon: Boxes },
  { name: 'Flame', label: 'Licores / Especiales', icon: Flame },
  { name: 'Store', label: 'Tienda', icon: Store },
  { name: 'Tag', label: 'Ofertas', icon: Tag },
  { name: 'ShoppingBag', label: 'General', icon: ShoppingBag },
  { name: 'Zap', label: 'Rápido', icon: Zap },
  { name: 'MoreHorizontal', label: 'Otros', icon: MoreHorizontal },
];

const PRESET_COLORS = [
  { hex: '#2563EB', name: 'Azul' },
  { hex: '#0284C7', name: 'Celeste' },
  { hex: '#0D9488', name: 'Turquesa' },
  { hex: '#16A34A', name: 'Verde' },
  { hex: '#65A30D', name: 'Lima' },
  { hex: '#CA8A04', name: 'Ámbar' },
  { hex: '#EA580C', name: 'Naranja' },
  { hex: '#E11D48', name: 'Rojo' },
  { hex: '#9333EA', name: 'Morado' },
  { hex: '#475569', name: 'Pizarra' },
];

export const ManageCategoriesModal: React.FC<ManageCategoriesModalProps> = ({
  isOpen,
  onClose,
  categories,
  products,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onResetDefaultCategories,
}) => {
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [deleteTargetCat, setDeleteTargetCat] = useState<CategoryInfo | null>(null);
  const [reassignCategoryName, setReassignCategoryName] = useState<string>('Otros');

  // Form fields
  const [catName, setCatName] = useState('');
  const [catSubtitle, setCatSubtitle] = useState('');
  const [catImageUrl, setCatImageUrl] = useState('');
  const [catIconName, setCatIconName] = useState('Package');
  const [catColor, setCatColor] = useState('#2563EB');
  const [originalNameBeforeEdit, setOriginalNameBeforeEdit] = useState('');

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setEditingCatId(null);
    setIsCreating(true);
    setCatName('');
    setCatSubtitle('');
    setCatImageUrl('');
    setCatIconName('Package');
    setCatColor('#2563EB');
    setOriginalNameBeforeEdit('');
  };

  const handleStartEdit = (cat: CategoryInfo) => {
    setIsCreating(false);
    setEditingCatId(cat.id);
    setCatName(cat.name);
    setCatSubtitle(cat.subtitle || '');
    setCatImageUrl(cat.imageUrl || '');
    setCatIconName(cat.iconName || 'Package');
    setCatColor(cat.color || '#2563EB');
    setOriginalNameBeforeEdit(cat.name);
  };

  const handleCancelForm = () => {
    setIsCreating(false);
    setEditingCatId(null);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = catName.trim();
    if (!cleanName) return;

    const normalizedImg =
      normalizeImageUrl(catImageUrl.trim()) ||
      'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80';

    if (isCreating) {
      // Check duplicate name
      if (categories.some((c) => c.name.toLowerCase() === cleanName.toLowerCase())) {
        alert(`Ya existe una categoría llamada "${cleanName}".`);
        return;
      }

      const newId = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-') || `cat-${Date.now()}`;
      const newCategory: CategoryInfo = {
        id: newId,
        name: cleanName,
        subtitle: catSubtitle.trim() || `Productos de ${cleanName}`,
        imageUrl: normalizedImg,
        iconName: catIconName,
        color: catColor,
        bgPastel: 'bg-amber-100 hover:bg-amber-200',
        textPastel: 'text-slate-900',
        borderPastel: 'border-amber-300',
      };

      onAddCategory(newCategory);
      setIsCreating(false);
    } else if (editingCatId) {
      const existing = categories.find((c) => c.id === editingCatId);
      if (!existing) return;

      const updatedCategory: CategoryInfo = {
        ...existing,
        name: cleanName,
        subtitle: catSubtitle.trim() || `Productos de ${cleanName}`,
        imageUrl: normalizedImg,
        iconName: catIconName,
        color: catColor,
      };

      onUpdateCategory(updatedCategory, originalNameBeforeEdit);
      setEditingCatId(null);
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTargetCat) return;
    onDeleteCategory(deleteTargetCat.id, deleteTargetCat.name, reassignCategoryName);
    setDeleteTargetCat(null);
  };

  const renderIcon = (iconName: string) => {
    const found = AVAILABLE_ICONS.find((i) => i.name === iconName);
    const IconComp = found ? found.icon : Package;
    return <IconComp className="w-4 h-4" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#222E3A]/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#FFF9F0] rounded-none max-w-3xl w-full shadow-2xl border-2 border-[#214C6A] overflow-hidden flex flex-col max-h-[92vh] text-[#222E3A]">
        {/* Header */}
        <div className="p-4 bg-[#214C6A] border-b border-[#214C6A] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-none bg-[#EB9D52] border border-white/20 flex items-center justify-center text-[#222E3A] shadow-xs">
              <Layers className="w-5 h-5 text-[#222E3A]" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#EB9D52]">
                Configuración del Catálogo
              </span>
              <h3 className="text-base sm:text-lg font-bold font-title text-[#FFF9F0]">
                Gestión de Categorías de Productos
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

        {/* Action Top Bar */}
        <div className="p-3 bg-[#F6E1C6]/70 border-b border-[#214C6A]/20 flex items-center justify-between gap-2 flex-wrap">
          <div className="text-xs text-[#56291D] font-medium">
            Total de categorías registradas: <strong>{categories.length}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onResetDefaultCategories}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-[#63665B] hover:text-[#214C6A] text-xs font-bold border border-[#214C6A]/20 rounded-none flex items-center gap-1 cursor-pointer"
              title="Restablecer a las 10 categorías sugeridas estándar"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#BC6343]" />
              <span>Restablecer Originales</span>
            </button>

            {!isCreating && !editingCatId && (
              <button
                onClick={handleStartCreate}
                className="px-3.5 py-1.5 bg-[#214C6A] hover:bg-[#1a3d55] text-white text-xs font-bold rounded-none flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4 text-[#EB9D52]" />
                <span>+ Añadir Categoría</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Create or Edit Form */}
          {(isCreating || editingCatId) && (
            <form
              onSubmit={handleSaveForm}
              className="bg-white p-4 border-2 border-[#214C6A] shadow-md space-y-3.5 animate-fadeIn"
            >
              <div className="flex items-center justify-between border-b border-[#214C6A]/15 pb-2">
                <h4 className="font-extrabold text-sm text-[#214C6A] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#BC6343]" />
                  {isCreating ? 'Crear Nueva Categoría' : `Modificar Categoría: "${originalNameBeforeEdit}"`}
                </h4>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-xs text-[#63665B] hover:text-rose-700 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-[#214C6A] block mb-1">
                    Nombre de la Categoría *
                  </label>
                  <input
                    type="text"
                    required
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="Ej: Lácteos Especiales, Congelados, Droguería..."
                    className="w-full px-3 py-2 bg-[#FFF9F0] border border-[#214C6A]/30 text-xs font-bold text-[#214C6A] focus:ring-1 focus:ring-[#BC6343] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#214C6A] block mb-1">
                    Subtítulo / Descripción Corta
                  </label>
                  <input
                    type="text"
                    value={catSubtitle}
                    onChange={(e) => setCatSubtitle(e.target.value)}
                    placeholder="Ej: Helados, embutidos y congelados"
                    className="w-full px-3 py-2 bg-[#FFF9F0] border border-[#214C6A]/30 text-xs font-medium text-[#222E3A] focus:ring-1 focus:ring-[#BC6343] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-[#214C6A]">
                      URL de Foto de Portada (Opcional)
                    </label>
                    <span className="text-[10px] text-[#BC6343] font-semibold">
                      Acepta enlaces públicos de Google Drive
                    </span>
                  </div>
                  <input
                    type="url"
                    value={catImageUrl}
                    onChange={(e) => setCatImageUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/... o https://images.unsplash.com/..."
                    className="w-full px-3 py-2 bg-[#FFF9F0] border border-[#214C6A]/30 text-xs font-medium text-[#222E3A] focus:ring-1 focus:ring-[#BC6343] focus:outline-none"
                  />
                </div>

                {/* Icon Selection */}
                <div>
                  <label className="font-bold text-[#214C6A] block mb-1">Icono Representativo</label>
                  <div className="grid grid-cols-4 gap-1.5 max-h-28 overflow-y-auto p-1.5 bg-[#FFF9F0] border border-[#214C6A]/20">
                    {AVAILABLE_ICONS.map((item) => {
                      const IconComponent = item.icon;
                      const isSelected = catIconName === item.name;
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => setCatIconName(item.name)}
                          className={`p-1.5 flex items-center justify-center gap-1 rounded-none border text-[10px] font-bold cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#214C6A] text-white border-[#214C6A] shadow-xs'
                              : 'bg-white text-[#63665B] border-[#214C6A]/10 hover:border-[#BC6343]'
                          }`}
                          title={item.label}
                        >
                          <IconComponent className="w-3.5 h-3.5" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Color Palette */}
                <div>
                  <label className="font-bold text-[#214C6A] block mb-1">Color Temático</label>
                  <div className="flex flex-wrap gap-2 p-2 bg-[#FFF9F0] border border-[#214C6A]/20">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setCatColor(c.hex)}
                        className={`w-6 h-6 rounded-none border-2 flex items-center justify-center cursor-pointer transition-transform ${
                          catColor === c.hex ? 'scale-115 border-[#214C6A] shadow-xs' : 'border-white'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      >
                        {catColor === c.hex && <Check className="w-3 h-3 text-white stroke-[3]" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-[#214C6A]/15">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-none cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#214C6A] hover:bg-[#1a3d55] text-white text-xs font-bold rounded-none shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-[#EB9D52]" />
                  <span>{isCreating ? 'Crear Categoría' : 'Guardar Cambios'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Delete Confirmation Modal / Prompt */}
          {deleteTargetCat && (
            <div className="bg-rose-50 border-2 border-rose-600 p-4 shadow-lg space-y-3 animate-fadeIn">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-none bg-rose-600 text-white flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-rose-900">
                    ¿Eliminar categoría "{deleteTargetCat.name}"?
                  </h4>
                  <p className="text-xs text-rose-800">
                    {products.filter((p) => p.category === deleteTargetCat.name).length > 0 ? (
                      <>
                        Esta categoría tiene{' '}
                        <strong>
                          {products.filter((p) => p.category === deleteTargetCat.name).length} productos
                        </strong>{' '}
                        asociados. Selecciona a qué categoría deseas reasignarlos para no perderlos:
                      </>
                    ) : (
                      'No hay productos asociados a esta categoría. Se eliminará de forma segura.'
                    )}
                  </p>
                </div>
              </div>

              {products.filter((p) => p.category === deleteTargetCat.name).length > 0 && (
                <div className="p-2.5 bg-white border border-rose-300 text-xs">
                  <label className="font-bold text-rose-900 block mb-1">
                    Reasignar productos existentes a:
                  </label>
                  <select
                    value={reassignCategoryName}
                    onChange={(e) => setReassignCategoryName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#FFF9F0] border border-rose-300 text-xs font-bold text-[#214C6A]"
                  >
                    {categories
                      .filter((c) => c.id !== deleteTargetCat.id)
                      .map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    <option value="Otros">Otros</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDeleteTargetCat(null)}
                  className="px-3 py-1.5 bg-white text-slate-700 text-xs font-bold border border-slate-300 rounded-none cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-none shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirmar Eliminación</span>
                </button>
              </div>
            </div>
          )}

          {/* Categories Grid / Table */}
          <div className="border border-[#214C6A]/20 bg-white overflow-x-auto shadow-2xs">
            <table className="w-full text-left text-xs border-collapse min-w-[560px]">
              <thead>
                <tr className="bg-[#214C6A] text-[#FFF9F0] text-[11px] font-bold uppercase tracking-wider">
                  <th className="p-2.5">Categoría</th>
                  <th className="p-2.5">Subtítulo</th>
                  <th className="p-2.5 text-center">Productos</th>
                  <th className="p-2.5 text-center">Color</th>
                  <th className="p-2.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#214C6A]/10">
                {categories.map((cat) => {
                  const productCount = products.filter((p) => p.category === cat.name).length;
                  return (
                    <tr key={cat.id} className="hover:bg-[#F6E1C6]/25 transition-colors">
                      <td className="p-2.5 flex items-center gap-2.5">
                        <img
                          src={normalizeImageUrl(cat.imageUrl)}
                          alt={cat.name}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-none object-cover border border-[#214C6A]/20 shrink-0 shadow-2xs"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-[#214C6A] flex items-center gap-1.5 text-xs">
                            <span className="text-[#BC6343]">{renderIcon(cat.iconName)}</span>
                            <span>{cat.name}</span>
                          </div>
                          <div className="text-[10px] text-[#63665B]">{cat.id}</div>
                        </div>
                      </td>

                      <td className="p-2.5 text-[#56291D] font-medium max-w-[200px] truncate">
                        {cat.subtitle || '—'}
                      </td>

                      <td className="p-2.5 text-center">
                        <span className="px-2 py-0.5 bg-[#F6E1C6]/80 text-[#56291D] font-extrabold text-[11px] border border-[#214C6A]/15">
                          {productCount} uds
                        </span>
                      </td>

                      <td className="p-2.5 text-center">
                        <span
                          className="inline-block w-4 h-4 rounded-none border border-black/20"
                          style={{ backgroundColor: cat.color || '#2563EB' }}
                        />
                      </td>

                      <td className="p-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleStartEdit(cat)}
                            className="p-1.5 bg-[#214C6A] hover:bg-[#1a3d55] text-white text-[10px] font-bold rounded-none cursor-pointer flex items-center gap-1"
                            title={`Modificar categoría ${cat.name}`}
                          >
                            <Edit2 className="w-3 h-3 text-[#EB9D52]" />
                            <span className="hidden sm:inline">Modificar</span>
                          </button>

                          <button
                            onClick={() => {
                              setDeleteTargetCat(cat);
                              setReassignCategoryName('Otros');
                            }}
                            className="p-1.5 bg-rose-700 hover:bg-rose-800 text-white text-[10px] font-bold rounded-none cursor-pointer flex items-center gap-1"
                            title={`Eliminar categoría ${cat.name}`}
                          >
                            <Trash2 className="w-3 h-3 text-white" />
                            <span className="hidden sm:inline">Eliminar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-[#F6E1C6]/60 border-t-2 border-[#214C6A] flex items-center justify-between">
          <span className="text-xs text-[#56291D] flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#BC6343] shrink-0" />
            <span>Al modificar el nombre de una categoría, todos los productos existentes se actualizan automáticamente.</span>
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
