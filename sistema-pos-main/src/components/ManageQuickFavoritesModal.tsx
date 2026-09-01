import React, { useState, useMemo } from 'react';
import { ProductItem } from '@/types';
import { formatCOP } from '@/lib/utils';
import { 
  Star, 
  X, 
  Search, 
  Check, 
  Plus, 
  Trash2, 
  AlertCircle,
  FolderPlus,
  FolderMinus,
  Tag
} from 'lucide-react';

interface ManageQuickFavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductItem[];
  favoriteIds: (string | number)[];
  onToggleFavorite: (productId: string | number) => void;
  onClearFavorites: () => void;
  onResetDefaultFavorites: () => void;
}

export const ManageQuickFavoritesModal: React.FC<ManageQuickFavoritesModalProps> = ({
  isOpen,
  onClose,
  products,
  favoriteIds,
  onToggleFavorite,
  onClearFavorites,
  onResetDefaultFavorites,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites'>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const isFav = favoriteIds.includes(p.id);
      if (activeFilter === 'favorites' && !isFav) return false;
      if (selectedCategoryFilter !== 'all' && p.category !== selectedCategoryFilter) return false;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    });
  }, [products, favoriteIds, searchQuery, activeFilter, selectedCategoryFilter]);

  // Bulk category actions
  const currentCategoryProducts = useMemo(() => {
    if (selectedCategoryFilter === 'all') return [];
    return products.filter((p) => p.category === selectedCategoryFilter);
  }, [products, selectedCategoryFilter]);

  const areAllInCategoryFavorites = useMemo(() => {
    if (currentCategoryProducts.length === 0) return false;
    return currentCategoryProducts.every((p) => favoriteIds.includes(p.id));
  }, [currentCategoryProducts, favoriteIds]);

  const handleToggleWholeCategory = () => {
    if (currentCategoryProducts.length === 0) return;
    if (areAllInCategoryFavorites) {
      // Remove all in this category
      currentCategoryProducts.forEach((p) => {
        if (favoriteIds.includes(p.id)) {
          onToggleFavorite(p.id);
        }
      });
    } else {
      // Add all in this category
      currentCategoryProducts.forEach((p) => {
        if (!favoriteIds.includes(p.id)) {
          onToggleFavorite(p.id);
        }
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#222E3A]/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#FFF9F0] rounded-none max-w-2xl w-full shadow-2xl border-2 border-[#214C6A] overflow-hidden flex flex-col max-h-[88vh] text-[#222E3A]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#214C6A] border-b border-[#214C6A] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-none bg-[#BC6343] border border-white/20 flex items-center justify-center text-[#FFF9F0] shadow-xs">
              <Star className="w-5 h-5 fill-[#FFF9F0]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold font-['Outfit',sans-serif] text-[#FFF9F0]">
                Personalizar Botones de Acceso Rápido
              </h3>
              <p className="text-xs text-[#F6E1C6]/80">
                Añade o quita productos y categorías enteras para tus botones rápidos ({favoriteIds.length} activos)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-none bg-[#1a3d55] hover:bg-[#0f2433] flex items-center justify-center text-[#F6E1C6] hover:text-white transition-colors cursor-pointer border border-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-3 sm:p-4 bg-[#F6E1C6]/60 border-b border-[#214C6A]/20 space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#BC6343]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar producto para agregar o quitar de accesos rápidos..."
              className="w-full pl-9 pr-8 py-2 rounded-none bg-[#FFF9F0] border border-[#214C6A]/30 text-[#222E3A] placeholder-[#63665B]/60 text-xs font-medium focus:ring-1 focus:ring-[#214C6A] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#63665B] hover:text-[#222E3A] text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-[10px] font-bold text-[#214C6A] uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Tag className="w-3 h-3 text-[#BC6343]" /> Categoría:
            </span>
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter('all')}
              className={`px-2.5 py-1 rounded-none text-[11px] font-bold shrink-0 transition-all cursor-pointer border ${
                selectedCategoryFilter === 'all'
                  ? 'bg-[#214C6A] text-white border-[#214C6A] shadow-xs'
                  : 'bg-white/80 hover:bg-white text-[#222E3A] border-white/80'
              }`}
            >
              Todas ({products.length})
            </button>
            {categories.map((cat) => {
              const count = products.filter((p) => p.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-none text-[11px] font-bold shrink-0 transition-all cursor-pointer border ${
                    selectedCategoryFilter === cat
                      ? 'bg-[#BC6343] text-white border-[#BC6343] shadow-xs'
                      : 'bg-white/80 hover:bg-white text-[#222E3A] border-white/80'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Quick Whole-Category Action Bar */}
          {selectedCategoryFilter !== 'all' && currentCategoryProducts.length > 0 && (
            <div className="flex items-center justify-between bg-white/90 p-2 rounded-none border border-[#214C6A]/20 shadow-2xs">
              <span className="text-xs font-bold text-[#214C6A]">
                Categoría <strong className="text-[#BC6343]">{selectedCategoryFilter}</strong> ({currentCategoryProducts.length} productos)
              </span>
              <button
                type="button"
                onClick={handleToggleWholeCategory}
                className={`px-3 py-1 rounded-none text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                  areAllInCategoryFavorites
                    ? 'bg-rose-600 hover:bg-rose-700 text-white border border-rose-700'
                    : 'bg-[#EB9D52] hover:bg-[#d98c42] text-[#222E3A] border border-[#BC6343]'
                }`}
              >
                {areAllInCategoryFavorites ? (
                  <>
                    <FolderMinus className="w-3.5 h-3.5" />
                    <span>Quitar toda la categoría de favoritos</span>
                  </>
                ) : (
                  <>
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>+ Añadir toda la categoría a favoritos</span>
                  </>
                )}
              </button>
            </div>
          )}

          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1 rounded-none font-bold transition-all cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-[#214C6A] text-[#FFF9F0] shadow-xs'
                    : 'bg-[#FFF9F0] text-[#63665B] hover:text-[#222E3A] border border-[#214C6A]/20'
                }`}
              >
                Ver Todo ({products.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('favorites')}
                className={`px-3 py-1 rounded-none font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  activeFilter === 'favorites'
                    ? 'bg-[#BC6343] text-[#FFF9F0] shadow-xs'
                    : 'bg-[#FFF9F0] text-[#BC6343] hover:text-[#964937] border border-[#214C6A]/20'
                }`}
              >
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>Solo Activos ({favoriteIds.length})</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onResetDefaultFavorites}
                className="text-[11px] text-[#214C6A] hover:text-[#BC6343] underline font-medium cursor-pointer"
              >
                Restaurar sugeridos
              </button>
              {favoriteIds.length > 0 && (
                <button
                  type="button"
                  onClick={onClearFavorites}
                  className="text-[11px] text-rose-700 hover:text-rose-900 underline font-medium cursor-pointer"
                >
                  Quitar todos
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Products List */}
        <div className="p-3 sm:p-4 flex-1 overflow-y-auto space-y-2">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-[#63665B]">
              <AlertCircle className="w-10 h-10 mx-auto mb-2 text-[#BC6343]/60" />
              <p className="text-sm font-semibold text-[#222E3A]">No se encontraron productos</p>
              <p className="text-xs text-[#63665B] mt-1">Prueba con otro término de búsqueda o categoría.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredProducts.map((product) => {
                const isFavorite = favoriteIds.includes(product.id);

                return (
                  <div
                    key={product.id}
                    onClick={() => onToggleFavorite(product.id)}
                    className={`p-2 rounded-none border-2 transition-all flex items-center justify-between gap-2.5 cursor-pointer select-none ${
                      isFavorite
                        ? 'bg-[#F6E1C6]/70 border-[#BC6343] hover:bg-[#F6E1C6] shadow-2xs'
                        : 'bg-[#FFF9F0] border-[#214C6A]/15 hover:bg-[#F6E1C6]/40 hover:border-[#214C6A]/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="w-10 h-10 rounded-none object-cover border border-[#214C6A]/15 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#222E3A] truncate font-['Outfit',sans-serif]">
                          {product.title}
                        </div>
                        <div className="text-[11px] text-[#BC6343] font-bold">
                          {formatCOP(product.price)}
                        </div>
                        <div className="text-[10px] text-[#63665B] truncate">
                          {product.category}
                        </div>
                      </div>
                    </div>

                    {/* Toggle Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(product.id);
                      }}
                      className={`w-8 h-8 rounded-none flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                        isFavorite
                          ? 'bg-[#BC6343] text-white font-bold shadow-xs'
                          : 'bg-[#F6E1C6]/60 text-[#63665B] hover:text-[#222E3A] border border-[#214C6A]/20 hover:bg-[#F6E1C6]'
                      }`}
                      title={isFavorite ? 'Quitar de acceso rápido' : 'Agregar a acceso rápido'}
                    >
                      <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-white' : ''}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-[#F6E1C6]/60 border-t-2 border-[#214C6A] flex items-center justify-between">
          <span className="text-xs text-[#56291D]">
            Tienes <strong className="text-[#BC6343] font-bold">{favoriteIds.length}</strong> botones de acceso rápido activos.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-none bg-[#214C6A] hover:bg-[#1a3d55] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            Guardar y Listo
          </button>
        </div>
      </div>
    </div>
  );
};


