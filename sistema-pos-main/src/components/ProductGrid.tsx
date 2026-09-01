import React, { useState } from 'react';
import { ProductItem, CartItem, CategoryName } from '@/types';
import { InteractiveProductCard } from '@/components/ui/card-7';
import { formatCOP, normalizeImageUrl } from '@/lib/utils';
import { 
  SearchX, 
  Filter, 
  LayoutGrid, 
  Grid3X3, 
  List, 
  Plus, 
  Minus, 
  Star,
  Edit3,
  Percent
} from 'lucide-react';

interface ProductGridProps {
  products: ProductItem[];
  cart: CartItem[];
  onAddToCart: (product: ProductItem) => void;
  onIncrementCart: (productId: string | number) => void;
  onDecrementCart: (productId: string | number) => void;
  selectedCategory: CategoryName | 'Todos';
  searchQuery: string;
  onResetFilters: () => void;
  favoriteIds?: (string | number)[];
  onToggleFavorite?: (productId: string | number) => void;
  onEditProduct?: (product: ProductItem) => void;
}

type ViewMode = 'compact' | 'visual' | 'list';

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  cart,
  onAddToCart,
  onIncrementCart,
  onDecrementCart,
  selectedCategory,
  searchQuery,
  onResetFilters,
  favoriteIds = [],
  onToggleFavorite,
  onEditProduct,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('compact');

  const getCartQuantity = (productId: string | number) => {
    const item = cart.find((c) => c.product.id === productId);
    return item ? item.quantity : 0;
  };

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-[#FFF9F0] rounded-none border border-[#214C6A]/20 shadow-sm my-4">
        <div className="w-14 h-14 rounded-none bg-[#214C6A]/10 border border-[#214C6A]/30 text-[#214C6A] flex items-center justify-center mb-3">
          <SearchX className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-[#214C6A] mb-1">
          No encontramos productos
        </h3>
        <p className="text-xs text-[#63665B] max-w-md mb-4">
          No hay artículos que coincidan con &ldquo;{searchQuery}&rdquo; en la categoría &ldquo;{selectedCategory}&rdquo;.
        </p>
        <button
          onClick={onResetFilters}
          className="px-4 py-2 rounded-none bg-[#214C6A] hover:bg-[#1a3d55] text-[#FFF9F0] text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          Mostrar todos los productos
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Grid Meta Header & View Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-[#63665B]">
            Catálogo: <strong className="text-[#214C6A] font-bold">{products.length}</strong> productos
          </span>
          {selectedCategory !== 'Todos' && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#214C6A] bg-[#214C6A]/10 px-2.5 py-0.5 rounded-none border border-[#214C6A]/20">
              <Filter className="w-3.5 h-3.5 text-[#BC6343]" />
              {selectedCategory}
            </span>
          )}
          {searchQuery && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#214C6A] bg-[#FFF9F0] px-2.5 py-0.5 rounded-none border border-[#214C6A]/20">
              Filtro: &ldquo;{searchQuery}&rdquo;
            </span>
          )}
        </div>

        {/* View Mode Controls with subtle glass styling */}
        <div className="flex items-center gap-1 bg-[#FFF9F0]/85 backdrop-blur-md p-0.5 rounded-none border border-white/70 shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode('compact')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-none text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'compact'
                ? 'bg-[#214C6A] text-[#FFF9F0] shadow-xs'
                : 'text-[#63665B] hover:text-[#214C6A]'
            }`}
            title="Cuadrícula Rápida POS"
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Rápido</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('visual')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-none text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'visual'
                ? 'bg-[#214C6A] text-[#FFF9F0] shadow-xs'
                : 'text-[#63665B] hover:text-[#214C6A]'
            }`}
            title="Vista Visual con tarjetas 3D"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Visual 3D</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-none text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-[#214C6A] text-[#FFF9F0] shadow-xs'
                : 'text-[#63665B] hover:text-[#214C6A]'
            }`}
            title="Vista Lista de Alta Densidad"
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lista</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: COMPACT POS GRID */}
      {viewMode === 'compact' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5">
          {products.map((product) => {
            const qtyInCart = getCartQuantity(product.id);
            const isOutOfStock = product.stock <= 0;
            const isFav = favoriteIds.includes(product.id);
            const hasDiscount = Boolean(product.discount && product.discount > 0);
            const ivaRate = product.ivaRate ?? 0;

            return (
              <div
                key={product.id}
                onClick={() => {
                  if (!isOutOfStock) onAddToCart(product);
                }}
                className={`group relative rounded-none bg-[#FFF9F0]/85 hover:bg-white/95 backdrop-blur-md border transition-all duration-150 p-2.5 flex flex-col justify-between cursor-pointer select-none shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-md ${
                  qtyInCart > 0
                    ? 'border-[#4caf50] ring-2 ring-[#4caf50]/40 bg-white/95'
                    : 'border-white/80 hover:border-[#BC6343]/50'
                } ${isOutOfStock ? 'opacity-50 grayscale cursor-not-allowed' : 'active:scale-[0.99]'}`}
              >
                {/* Top Row: Category Pill, IVA & Discount Badges, Edit & Favorite */}
                <div className="flex items-center justify-between gap-1 mb-1.5 flex-wrap">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[9px] font-black uppercase tracking-wider text-[#56291D] bg-[#EB9D52]/20 border border-[#EB9D52]/40 px-1.5 py-0.5 rounded-none truncate max-w-[85px]">
                      {product.category}
                    </span>
                    <span className={`text-[8px] font-extrabold px-1 py-0.5 rounded-none border ${
                      ivaRate > 0 ? 'bg-[#214C6A]/10 text-[#214C6A] border-[#214C6A]/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {ivaRate > 0 ? `IVA ${ivaRate}%` : '0% Exento'}
                    </span>
                    {hasDiscount && (
                      <span className="text-[8px] font-black px-1 py-0.5 rounded-none bg-rose-600 text-white animate-pulse">
                        -{product.discount}%
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 shrink-0">
                    {onEditProduct && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditProduct(product);
                        }}
                        className="p-1 rounded-none text-[#63665B]/60 hover:text-[#BC6343] hover:bg-[#BC6343]/10 transition-colors cursor-pointer"
                        title="Modificar producto, IVA y descuento"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    )}
                    {onToggleFavorite && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(product.id);
                        }}
                        className={`p-0.5 rounded-none transition-colors cursor-pointer ${
                          isFav 
                            ? 'text-[#EB9D52] hover:text-[#BC6343]' 
                            : 'text-[#63665B]/50 hover:text-[#EB9D52]'
                        }`}
                        title={isFav ? 'Quitar de botones rápidos' : 'Añadir a botones rápidos'}
                      >
                        <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-[#EB9D52]' : ''}`} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Center Image & Title */}
                <div className="flex items-center gap-2 my-1">
                  <img
                    src={normalizeImageUrl(product.imageUrl)}
                    alt={product.title}
                    referrerPolicy="no-referrer"
                    className="w-11 h-11 rounded-none object-cover border border-[#214C6A]/15 shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-bold text-[#222E3A] leading-snug line-clamp-2 font-['Outfit',sans-serif]">
                      {product.title}
                    </h4>
                    <p className="text-[10px] text-[#63665B] line-clamp-1 mt-0.5">
                      Stock: <strong className="text-[#222E3A]">{product.stock} {product.unit || 'uds'}</strong>
                    </p>
                  </div>
                </div>

                {/* Bottom Row: COP Price & Action */}
                <div className="mt-2 pt-2 border-t border-[#214C6A]/10 flex items-center justify-between gap-1.5">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-[#63665B]">PRECIO</span>
                    <span className="text-sm sm:text-base font-black text-[#BC6343] tracking-tight font-['Outfit',sans-serif]">
                      {formatCOP(product.price)}
                    </span>
                  </div>

                  {qtyInCart > 0 ? (
                    <div 
                      className="flex items-center gap-1 bg-[#214C6A] border border-[#214C6A] rounded-none p-0.5 text-white"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDecrementCart(product.id);
                        }}
                        className="w-5 h-5 rounded-none bg-[#1a3d55] hover:bg-[#0f2433] active:scale-95 text-[#FFF9F0] flex items-center justify-center font-bold text-xs cursor-pointer"
                        title="Restar 1"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-4 text-center text-xs font-black text-[#FFF9F0]">
                        {qtyInCart}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onIncrementCart(product.id);
                        }}
                        disabled={qtyInCart >= product.stock}
                        className="w-5 h-5 rounded-none bg-[#4caf50] hover:bg-[#388e3c] disabled:opacity-40 active:scale-95 text-white flex items-center justify-center font-bold text-xs cursor-pointer"
                        title="Sumar 1"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart(product);
                      }}
                      className={`px-2.5 py-1 rounded-none text-xs font-black text-[#FFF9F0] flex items-center gap-1 transition-all cursor-pointer ${
                        isOutOfStock
                          ? 'bg-[#63665B]/40 text-[#222E3A]/40 border border-transparent cursor-not-allowed'
                          : 'bg-[#214C6A] hover:bg-[#1a3d55] active:scale-95 border border-[#214C6A]'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>+1</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 2: VISUAL 3D CARDS */}
      {viewMode === 'visual' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4">
          {products.map((product) => {
            const qtyInCart = getCartQuantity(product.id);
            const formattedPrice = formatCOP(product.price);
            const stockText = `${product.stock} ${product.unit || 'unidades'}`;
            const isFav = favoriteIds.includes(product.id);

            return (
              <InteractiveProductCard
                key={product.id}
                title={product.title}
                description={product.description}
                price={formattedPrice}
                stock={product.stock}
                stockText={stockText}
                category={product.category}
                imageUrl={product.imageUrl}
                ivaRate={product.ivaRate}
                discount={product.discount}
                cartQuantity={qtyInCart}
                isFavorite={isFav}
                onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(product.id) : undefined}
                onEditProduct={onEditProduct ? () => onEditProduct(product) : undefined}
                onAddToCart={() => onAddToCart(product)}
                onIncrement={() => onIncrementCart(product.id)}
                onDecrement={() => onDecrementCart(product.id)}
              />
            );
          })}
        </div>
      )}

      {/* VIEW MODE 3: HIGH-DENSITY FAST TABLE LIST */}
      {viewMode === 'list' && (
        <div className="bg-[#FFF9F0] rounded-none border border-[#214C6A]/20 overflow-hidden shadow-sm">
          <div className="divide-y divide-[#214C6A]/10">
            {products.map((product) => {
              const qtyInCart = getCartQuantity(product.id);
              const isOutOfStock = product.stock <= 0;
              const isFav = favoriteIds.includes(product.id);
              const ivaRate = product.ivaRate ?? 0;
              const hasDiscount = Boolean(product.discount && product.discount > 0);

              return (
                <div
                  key={product.id}
                  onClick={() => {
                    if (!isOutOfStock) onAddToCart(product);
                  }}
                  className={`p-3 sm:px-4 flex items-center justify-between gap-3 hover:bg-[#F6E1C6]/30 transition-colors cursor-pointer select-none ${
                    qtyInCart > 0 ? 'bg-[#EB9D52]/10' : ''
                  }`}
                >
                  {/* Left: Edit + Star + Image + Title + Category + IVA + Discount */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {onEditProduct && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditProduct(product);
                        }}
                        className="p-1 rounded-none text-[#63665B]/60 hover:text-[#BC6343] hover:bg-[#BC6343]/10 transition-colors cursor-pointer shrink-0"
                        title="Modificar producto, IVA y descuento"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {onToggleFavorite && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(product.id);
                        }}
                        className={`p-1 rounded-none transition-colors cursor-pointer shrink-0 ${
                          isFav ? 'text-[#EB9D52]' : 'text-[#63665B]/50 hover:text-[#EB9D52]'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${isFav ? 'fill-[#EB9D52]' : ''}`} />
                      </button>
                    )}

                    <img
                      src={normalizeImageUrl(product.imageUrl)}
                      alt={product.title}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-none object-cover border border-[#214C6A]/15 shrink-0"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-bold text-[#222E3A] truncate font-['Outfit',sans-serif]">
                          {product.title}
                        </h4>
                        <span className="text-[9px] font-bold text-[#56291D] bg-[#EB9D52]/20 border border-[#EB9D52]/40 px-1.5 py-0.5 rounded-none shrink-0 hidden sm:inline-block">
                          {product.category}
                        </span>
                        <span className={`text-[8px] font-bold px-1 py-0.5 rounded-none border ${
                          ivaRate > 0 ? 'bg-[#214C6A]/10 text-[#214C6A] border-[#214C6A]/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {ivaRate > 0 ? `IVA ${ivaRate}%` : '0% Exento'}
                        </span>
                        {hasDiscount && (
                          <span className="text-[8px] font-black px-1 py-0.5 rounded-none bg-rose-600 text-white">
                            -{product.discount}%
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#63665B] truncate">
                        Stock: {product.stock} {product.unit || 'uds'} {product.barcode && `• Ref: ${product.barcode}`}
                      </p>
                    </div>
                  </div>

                  {/* Right: Price & Stepper */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm sm:text-base font-black text-[#BC6343] font-['Outfit',sans-serif] min-w-[80px] text-right">
                      {formatCOP(product.price)}
                    </span>

                    {qtyInCart > 0 ? (
                      <div 
                        className="flex items-center gap-1 bg-[#214C6A] border border-[#214C6A] rounded-none p-0.5 text-white"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDecrementCart(product.id);
                          }}
                          className="w-5 h-5 rounded-none bg-[#1a3d55] hover:bg-[#0f2433] active:scale-95 text-[#FFF9F0] flex items-center justify-center font-bold text-xs cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center text-xs font-black text-[#EB9D52]">
                          {qtyInCart}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onIncrementCart(product.id);
                          }}
                          disabled={qtyInCart >= product.stock}
                          className="w-5 h-5 rounded-none bg-[#4caf50] hover:bg-[#388e3c] disabled:opacity-40 active:scale-95 text-white flex items-center justify-center font-bold text-xs cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(product);
                        }}
                        className="px-3 py-1 rounded-none bg-[#214C6A] hover:bg-[#1a3d55] disabled:bg-[#63665B]/30 disabled:opacity-40 text-[#FFF9F0] text-xs font-bold transition-all cursor-pointer"
                      >
                        + Agregar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

