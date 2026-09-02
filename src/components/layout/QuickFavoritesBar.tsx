import React, { useState } from 'react';
import { ProductItem } from '@/types';
import { formatCOP } from '@/lib/utils';
import { 
  Plus, 
  Star, 
  Settings2, 
  X, 
  Check, 
  PlusCircle 
} from 'lucide-react';

interface QuickFavoritesBarProps {
  products: ProductItem[];
  favoriteIds: (string | number)[];
  onAddToCart: (product: ProductItem) => void;
  onOpenManageFavorites: () => void;
  onRemoveFavorite: (productId: string | number) => void;
}

export const QuickFavoritesBar: React.FC<QuickFavoritesBarProps> = ({
  products,
  favoriteIds,
  onAddToCart,
  onOpenManageFavorites,
  onRemoveFavorite,
}) => {
  const [isEditMode, setIsEditMode] = useState(false);

  // Get favorite product items from the list of IDs
  const favoriteProducts = React.useMemo(() => {
    return favoriteIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is ProductItem => Boolean(p));
  }, [products, favoriteIds]);

  return (
    <div className="glass-panel rounded-none p-3.5 border border-white/80 border-t-2 border-t-[#214C6A] shadow-[0_8px_32px_rgba(33,76,106,0.12)] space-y-3 text-[#222E3A] transition-all">
      {/* Header with Title and Customization Actions */}
      <div className="flex items-center justify-between px-1 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 fill-[#EB9D52] text-[#BC6343] shrink-0" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#214C6A] font-title">
            Botones Rápidos • Los Más Vendidos
          </h3>
          <span className="text-[11px] text-[#63665B] font-medium hidden sm:inline-block">
            ({favoriteProducts.length} activos)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Quick Delete Mode */}
          {favoriteProducts.length > 0 && (
            <button
              type="button"
              onClick={() => setIsEditMode(!isEditMode)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-none text-[11px] font-bold transition-all cursor-pointer border backdrop-blur-md shadow-2xs ${
                isEditMode
                  ? 'bg-[#EB9D52] text-[#222E3A] border-white shadow-xs'
                  : 'bg-white/50 hover:bg-white text-[#56291D] border-white/80 hover:border-[#214C6A]/30'
              }`}
            >
              {isEditMode ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Listo</span>
                </>
              ) : (
                <>
                  <Settings2 className="w-3.5 h-3.5 text-[#63665B]" />
                  <span>Quitar Botones</span>
                </>
              )}
            </button>
          )}

          {/* Add Favorite Button */}
          <button
            type="button"
            onClick={onOpenManageFavorites}
            className="flex items-center gap-1.5 px-3 py-1 rounded-none bg-[#214C6A] hover:bg-[#1a3d55] text-[#FFF9F0] text-[11px] font-bold shadow-xs transition-all cursor-pointer border border-white/30 active:scale-95 backdrop-blur-md"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>+ Añadir Botón</span>
          </button>
        </div>
      </div>

      {/* Quick Cards Grid with authentic glass effect */}
      {favoriteProducts.length === 0 ? (
        <div className="text-center py-6 px-4 bg-white/35 backdrop-blur-md rounded-none border border-dashed border-white/80 flex flex-col items-center justify-center gap-2 shadow-inner">
          <Star className="w-7 h-7 text-[#EB9D52]" />
          <p className="text-xs font-bold text-[#214C6A]">
            No tienes botones de acceso rápido configurados
          </p>
          <p className="text-[11px] text-[#63665B] max-w-sm">
            Agrega los artículos que más vendes para cobrarlos con un solo toque sin buscarlos.
          </p>
          <button
            type="button"
            onClick={onOpenManageFavorites}
            className="mt-1 px-4 py-1.5 rounded-none bg-[#BC6343] hover:bg-[#a5533a] text-[#FFF9F0] text-xs font-black transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Seleccionar productos frecuentes</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-2">
          {favoriteProducts.map((product) => (
            <div key={product.id} className="relative group">
              <button
                type="button"
                onClick={() => {
                  if (!isEditMode) {
                    onAddToCart(product);
                  }
                }}
                className={`w-full p-2 rounded-none glass-card glass-card-hover transition-all flex flex-col items-center text-center cursor-pointer active:scale-[0.98] text-left relative overflow-hidden ${
                  isEditMode
                    ? 'border-[#EB9D52] ring-2 ring-[#EB9D52]/50'
                    : 'border-white/70'
                }`}
              >
                {/* Corner Quick Add Badge */}
                {!isEditMode && (
                  <div className="absolute top-0 right-0 w-4 h-4 rounded-none bg-[#214C6A] group-hover:bg-[#BC6343] text-[#FFF9F0] flex items-center justify-center text-[9px] font-bold transition-colors shadow-2xs">
                    <Plus className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}

                {/* Thumbnail */}
                <div className="w-11 h-11 rounded-none overflow-hidden border border-white/60 mb-1.5 shadow-2xs bg-white/40 backdrop-blur-xs shrink-0">
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>

                {/* Title */}
                <span className="text-[11px] font-bold text-[#222E3A] line-clamp-1 w-full text-center tracking-tight">
                  {product.title}
                </span>

                {/* Price Tag with glass accent */}
                <div className="mt-1 w-full bg-white/60 backdrop-blur-xs border border-white/70 py-0.5 px-1 rounded-none text-center shadow-2xs">
                  <span className="text-xs font-black text-[#BC6343] font-secondary">
                    {formatCOP(product.price)}
                  </span>
                </div>
              </button>

              {/* Direct Delete Button in Edit Mode */}
              {isEditMode && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFavorite(product.id);
                  }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-none bg-[#e74c3c] text-white flex items-center justify-center shadow-md border border-white hover:bg-[#c0392b] transition-transform active:scale-90 cursor-pointer z-10"
                  title="Quitar este botón rápido"
                >
                  <X className="w-3 h-3 stroke-[3]" />
                </button>
              )}
            </div>
          ))}

          {/* "+ Agregar Otro Botón" Tile with Frosted Glass look */}
          <button
            type="button"
            onClick={onOpenManageFavorites}
            className="p-2 rounded-none bg-white/40 hover:bg-white/75 backdrop-blur-sm border border-dashed border-[#214C6A]/30 hover:border-[#214C6A] transition-all flex flex-col items-center justify-center text-center cursor-pointer shadow-2xs group min-h-[90px]"
            title="Añadir otro producto a los botones rápidos"
          >
            <div className="w-7 h-7 rounded-none bg-white/80 group-hover:bg-[#214C6A] text-[#214C6A] group-hover:text-[#FFF9F0] flex items-center justify-center transition-all mb-1 border border-[#214C6A]/20 shadow-2xs">
              <Plus className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold text-[#214C6A]">
              + Añadir Botón
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
